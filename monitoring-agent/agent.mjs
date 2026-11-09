import os from 'node:os'
import { isIP } from 'node:net'
import { statfs, readFile, writeFile, rename } from 'node:fs/promises'
import { resolve, parse } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

const { MONITOR_URL, MONITOR_HOST_ID, MONITOR_TOKEN, MONITOR_IP, MONITOR_DISK_PATH, MONITOR_STATE_FILE } = process.env
const interval = Number(process.env.MONITOR_INTERVAL_SECONDS || 15)
if (!['ncc-pc-1', 'ncc-pc-2'].includes(MONITOR_HOST_ID) || !MONITOR_URL || (MONITOR_TOKEN?.length ?? 0) < 32) {
  throw new Error('Set MONITOR_URL, MONITOR_HOST_ID, and the matching 32+ character MONITOR_TOKEN.')
}
const base = new URL(MONITOR_URL)
if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password || base.pathname !== '/' || base.search || base.hash) {
  throw new Error('MONITOR_URL must be the application origin, such as http://192.168.1.10:8080.')
}
if (!Number.isInteger(interval) || interval < 3 || interval > 3600) throw new Error('MONITOR_INTERVAL_SECONDS must be 3–3600.')
const ipAddress = MONITOR_IP || Object.values(os.networkInterfaces()).flat().find(item => item.family === 'IPv4' && !item.internal)?.address || '127.0.0.1'
if (!isIP(ipAddress)) throw new Error('MONITOR_IP must be an IP address.')
const diskPath = MONITOR_DISK_PATH || parse(process.cwd()).root
const witness = MONITOR_HOST_ID === 'ncc-pc-2'
const statePath = resolve(MONITOR_STATE_FILE || 'monitor-state.json')
let state = { previous: null, pending: [] }
if (witness) {
  try { state = JSON.parse(await readFile(statePath, 'utf8')) }
  catch (error) { if (error.code !== 'ENOENT') throw error }
}
async function saveState() {
  await writeFile(statePath + '.tmp', JSON.stringify(state), { mode: 0o600 })
  await rename(statePath + '.tmp', statePath)
}

function cpuTimes() {
  return os.cpus().reduce(({ total, idle }, { times }) => ({
    total: total + Object.values(times).reduce((sum, value) => sum + value, 0),
    idle: idle + times.idle,
  }), { total: 0, idle: 0 })
}

async function sampleHost() {
  const start = cpuTimes()
  await delay(1000)
  const end = cpuTimes()
  const elapsed = end.total - start.total
  if (elapsed <= 0) throw new Error('CPU counters did not advance.')
  const disk = await statfs(diskPath)
  if (!disk.blocks) throw new Error('Filesystem capacity is zero for ' + diskPath)
  let availableMemory = os.freemem()
  if (process.platform === 'linux') {
    const meminfo = await readFile('/proc/meminfo', 'utf8')
    const available = meminfo.match(/^MemAvailable:\s+(\d+)\s+kB/m)
    if (available) availableMemory = Number(available[1]) * 1024
  }
  const percent = fraction => Math.round(Math.max(0, Math.min(1, fraction)) * 10000) / 100
  return {
    cpuUsage: percent(1 - (end.idle - start.idle) / elapsed),
    memoryUsage: percent(1 - availableMemory / os.totalmem()),
    diskUsage: percent(1 - disk.bfree / disk.blocks),
    ipAddress, observedAt: Date.now(),
  }
}

async function request(path, options) {
  return fetch(new URL(path, base), { ...options, redirect: 'error', signal: AbortSignal.timeout(3500) })
}

async function submit(path, body) {
  const response = await request('/api/monitor/' + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + MONITOR_TOKEN, 'X-Monitor-Host': MONITOR_HOST_ID },
    body: JSON.stringify(body),
  })
  await response.body?.cancel()
  if (!response.ok) throw new Error(path + ' returned HTTP ' + response.status)
}

async function check(path) {
  try {
    const response = await request('/api/' + path)
    return { code: response.status, body: await response.json() }
  } catch { return {} }
}

async function probeServices() {
  const api = await check('status')
  if (api.code !== 200 || api.body?.status !== 'SentinelOps Backend Running') {
    return { api: 'down', database: 'unknown' }
  }
  const db = await check('ready')
  if (db.code === 200 && db.body?.status === 'ready') return { api: 'up', database: 'up' }
  if (db.code === 503 && db.body?.status === 'database unavailable') return { api: 'up', database: 'down' }
  return { api: 'up', database: 'unknown' }
}

async function sampleServices() {
  let reading = await probeServices()
  const newFailure = ['api', 'database'].some(key => reading[key] === 'down' && state.previous?.[key] !== 'down')
  if (newFailure) {
    await delay(1000)
    reading = await probeServices()
  }
  const sample = { ...reading, rechecked: newFailure, observedAt: Date.now() }
  const changed = reading.api !== state.previous?.api || reading.database !== state.previous?.database
  if (changed) {
    const previous = state.previous
    const pending = state.pending
    state = { previous: reading, pending: [...pending, sample].slice(-1000) }
    try { await saveState() } catch (error) { state = { previous, pending }; throw error }
    console.log(new Date().toISOString(), 'API', reading.api, 'database', reading.database)
  }

  // Preserve outage transitions while the backend or its database cannot accept writes.
  // Entries replay in order. The server treats duplicate timestamps as no-ops.
  if (state.pending.length) {
    let sent = 0
    try {
      for (const entry of state.pending.slice(0, 25)) {
        await submit('probes', entry)
        sent++
      }
    } finally {
      if (sent) {
        state.pending = state.pending.slice(sent)
        await saveState()
      }
    }
  } else {
    await submit('probes', sample)
  }
}

console.log('Monitoring ' + MONITOR_HOST_ID + ' (' + ipAddress + '), disk ' + diskPath + ', every ' + interval + ' seconds.')
while (true) {
  const start = Date.now()
  const work = [sampleHost().then(reading => submit('heartbeat', reading))]
  if (witness) work.push(sampleServices())
  for (const result of await Promise.allSettled(work)) {
    if (result.status === 'rejected') console.error(new Date().toISOString(), result.reason.message)
  }
  await delay(Math.max(250, interval * 1000 - (Date.now() - start)))
}
