import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { api, apiErrorMessage } from '../services/api'
import { useAuth } from './AuthContext'

const DataContext = createContext(null)
export const DEFAULT_THRESHOLDS = { cpuWarning: 80, cpuCritical: 90, memWarning: 80 }
const POLL_MS = 5000 // how often we re-pull live data from the backend

export function DataProvider({ children }) {
  const { user } = useAuth()

  const [servers, setServers] = useState([])
  const [apps, setApps] = useState([])
  const [incidents, setIncidents] = useState([])
  const [alerts, setAlerts] = useState([])
  const [users, setUsers] = useState([])
  const [thresholds, setThresholdsState] = useState(DEFAULT_THRESHOLDS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(() => new Date())
  const thresholdSaveTimer = useRef(null)

  // Pulls everything that can change on its own (servers, incidents, alerts,
  // applications) from the real database. This is what makes the dashboard
  // "live": numbers only move when a real row in MySQL changes - from the
  // monitoring agent (next phase), from Simulate Failure, or from a
  // teammate's action in another tab.
  const refresh = useCallback(async ({ silent } = {}) => {
    if (!silent) setLoading(true)
    try {
      const [serversRes, appsRes, incidentsRes, alertsRes] = await Promise.all([
        api.get('/servers'),
        api.get('/applications'),
        api.get('/incidents'),
        api.get('/alerts'),
      ])
      setServers(serversRes.data.map(normalizeServer))
      setApps(appsRes.data.map(normalizeApp))
      setIncidents(incidentsRes.data.map(normalizeIncident))
      setAlerts(alertsRes.data.map(normalizeAlert))
      setLastUpdated(new Date())
      setError(null)
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not reach the SentinelOps backend.'))
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshUsers = useCallback(async () => {
    const { data } = await api.get('/users')
    setUsers(data.map(normalizeUser))
  }, [])

  const refreshThresholds = useCallback(async () => {
    const { data } = await api.get('/settings/thresholds')
    setThresholdsState(data)
  }, [])

  // Only fetch once signed in, then poll every few seconds. Nothing is
  // fetched on the login page.
  useEffect(() => {
    if (!user) return undefined
    refresh()
    refreshUsers()
    refreshThresholds()
    const id = setInterval(() => refresh({ silent: true }), POLL_MS)
    return () => clearInterval(id)
  }, [user, refresh, refreshUsers, refreshThresholds])

  const health = useMemo(() => {
    const counts = { healthy: 0, warning: 0, critical: 0, offline: 0 }
    servers.forEach((s) => counts[s.status]++)
    return { ...counts, total: servers.length, percent: servers.length ? Math.round((counts.healthy / servers.length) * 100) : 0 }
  }, [servers])

  const activeIncidents = incidents.filter((i) => i.status !== 'Resolved')
  const openAlerts = alerts.filter((a) => a.status !== 'Acknowledged')

  // ----- Incident actions -----
  async function updateIncident(id, patch) {
    await api.patch(`/incidents/${id}`, patch)
    await refresh({ silent: true })
  }

  // Infrastructure Monitoring Module -> "Simulate Failure" action - now a
  // real POST that writes a real row, instead of client-side fakery.
  async function simulateFailure(serverId) {
    try {
      const { data } = await api.post(`/servers/${serverId}/simulate-failure`)
      await refresh({ silent: true })
      return normalizeIncident(data)
    } catch (err) {
      if (err.response?.status === 409) return null // already has an open incident
      throw err
    }
  }

  // ----- Alert actions -----
  async function acknowledgeAlert(id) {
    await api.patch(`/alerts/${id}/acknowledge`)
    await refresh({ silent: true })
  }
  async function acknowledgeAll() {
    await api.patch('/alerts/acknowledge-all')
    await refresh({ silent: true })
  }

  // ----- User actions -----
  async function addUser({ name, email }) {
    await api.post('/users', { name, email })
    await refreshUsers()
  }
  async function removeUser(id) {
    await api.delete(`/users/${id}`)
    await refreshUsers()
  }

  // ----- Settings -----
  // Updates the shared value immediately (so Infrastructure's bar colours
  // react as the slider moves), and saves to the backend 400ms after the
  // last change so dragging a slider doesn't fire a request per pixel.
  function setThresholds(updater) {
    setThresholdsState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      clearTimeout(thresholdSaveTimer.current)
      thresholdSaveTimer.current = setTimeout(() => {
        api.put('/settings/thresholds', next).catch(() => {})
      }, 400)
      return next
    })
  }

  const value = {
    servers,
    apps,
    incidents,
    alerts,
    users,
    health,
    thresholds,
    setThresholds,
    activeIncidents,
    openAlerts,
    lastUpdated,
    loading,
    error,
    refresh,
    updateIncident,
    simulateFailure,
    acknowledgeAlert,
    acknowledgeAll,
    addUser,
    removeUser,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

// ---- API shape -> frontend shape (keeps every page component unchanged) ----
function normalizeServer(s) {
  return {
    id: s.id,
    name: s.server_name,
    ip: s.ip_address,
    type: s.server_type,
    status: s.status.toLowerCase(),
    cpu: Number(s.cpu_usage),
    mem: Number(s.memory_usage),
    disk: Number(s.disk_usage),
  }
}
function normalizeApp(a) {
  return {
    id: a.id,
    name: a.name,
    version: a.version,
    status: a.status,
    responseMs: a.response_time,
    uptime: Number(a.uptime),
    host: a.host_server_name ?? a.host_server_id,
  }
}
function normalizeIncident(i) {
  return {
    id: i.id,
    title: i.title,
    source: i.source,
    serverId: i.server_id,
    severity: i.severity,
    status: i.status,
    assignee: i.assigned_user ? String(i.assigned_user) : null,
    createdAt: i.created_at,
    resolvedAt: i.resolved_at,
  }
}
function normalizeAlert(a) {
  return {
    id: a.id,
    type: a.type,
    message: a.message,
    source: a.source,
    severity: a.severity,
    status: a.status,
    createdAt: a.created_at,
  }
}
function normalizeUser(u) {
  return {
    id: String(u.id),
    name: u.name,
    email: u.email,
    role: u.role,
    status: u.status,
    lastActive: u.last_active,
  }
}

export const useData = () => useContext(DataContext)
