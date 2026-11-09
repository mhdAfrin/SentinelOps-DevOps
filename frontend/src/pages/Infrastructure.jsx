import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Eye, Zap } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Tabs from '../components/ui/Tabs'
import SearchBox from '../components/ui/SearchBox'
import Meter from '../components/ui/Meter'
import EmptyState from '../components/ui/EmptyState'
import Modal from '../components/ui/Modal'
import { HealthStatus } from '../components/ui/Badge'
import { useData } from '../context/DataContext'
import { formatDateTime } from '../utils/format'

function metricTone(value, warning, critical) {
  if (value >= critical) return 'critical'
  if (value >= warning) return 'warning'
  return 'good'
}

export default function Infrastructure() {
  const { servers, health, incidents, thresholds, simulateFailure } = useData()
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const [filter, setFilter] = useState('all')
  const [notice, setNotice] = useState(null)
  const [detailId, setDetailId] = useState(null)
  const detail = servers.find(server => server.id === detailId)

  const setQuery = (v) => setParams(v ? { q: v } : {}, { replace: true })

  const withActiveIncident = new Set(incidents.filter((i) => i.serverId && i.status !== 'Resolved').map((i) => i.serverId))

  const rows = servers.filter(
    (s) =>
      (filter === 'all' || s.status === filter) &&
      `${s.name} ${s.ip} ${s.type}`.toLowerCase().includes(q.toLowerCase()),
  )

  const [simulating, setSimulating] = useState(null)

  async function simulate(server) {
    setSimulating(server.id)
    try {
      const incident = await simulateFailure(server.id)
      if (incident) setNotice(incident)
    } finally {
      setSimulating(null)
    }
  }

  const tabs = [
    { value: 'all', label: 'All', count: health.total },
    { value: 'healthy', label: 'Healthy', count: health.healthy },
    { value: 'warning', label: 'Warning', count: health.warning },
    { value: 'critical', label: 'Critical', count: health.critical },
    { value: 'offline', label: 'Offline', count: health.offline },
  ]

  return (
    <>
      <PageHeader title="Infrastructure" subtitle="Live health of every Web, API and Database server. Readings refresh every few seconds." />

      {notice && (
        <div className="notice notice--critical" role="status">
          <span>
            Demo failure recorded. <strong>{notice.id}</strong> was opened automatically: {notice.title}.
          </span>
          <Link to={`/incidents?q=${notice.id}`}>Open incident</Link>
        </div>
      )}

      <Card flush>
        <div className="toolbar">
          <Tabs tabs={tabs} value={filter} onChange={setFilter} label="Filter by status" />
          <SearchBox value={q} onChange={setQuery} placeholder="Search servers" />
        </div>
        <div className="table-wrap">
          <table className="table table--meters">
            <thead>
              <tr>
                <th>Server</th>
                <th>IP address</th>
                <th>Type</th>
                <th>Status</th>
                <th>CPU</th>
                <th>Memory</th>
                <th>Disk</th>
                <th>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id}>
                  <td className="strong">{s.name}</td>
                  <td>{s.ip}</td>
                  <td>{s.type}</td>
                  <td>
                    <HealthStatus tone={s.status} />
                  </td>
                  <td>
                    <Meter value={s.cpu} label={`${s.name} CPU`} tone={metricTone(s.cpu, thresholds.cpuWarning, thresholds.cpuCritical)} />
                  </td>
                  <td>
                    <Meter value={s.mem} label={`${s.name} memory`} tone={metricTone(s.mem, thresholds.memWarning, thresholds.memCritical)} />
                  </td>
                  <td>
                    <Meter value={s.disk} label={`${s.name} disk`} tone={metricTone(s.disk, thresholds.diskWarning, thresholds.diskCritical)} />
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="btn btn--sm" onClick={() => setDetailId(s.id)}>
                        <Eye size={14} aria-hidden="true" /> Details
                      </button>
                      {!['ncc-pc-1', 'ncc-pc-2'].includes(s.id) && <button
                        className="btn btn--sm"
                        onClick={() => simulate(s)}
                        disabled={withActiveIncident.has(s.id) || simulating === s.id}
                        title="Create a simulated CPU incident on this demo server"
                      >
                        <Zap size={14} aria-hidden="true" />
                        {withActiveIncident.has(s.id) ? 'Active' : simulating === s.id ? 'Working…' : 'Simulate failure'}
                      </button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && <EmptyState title="No servers match" hint="Try a different status or search term." />}
      </Card>

      {detail && (
        <Modal title={detail.name} onClose={() => setDetailId(null)}>
          <dl className="details">
            <dt>Server ID</dt>
            <dd>{detail.id}</dd>
            <dt>IP address</dt>
            <dd>{detail.ip}</dd>
            <dt>Type</dt>
            <dd>{detail.type}</dd>
            <dt>Status</dt>
            <dd>
              <HealthStatus tone={detail.status} />
            </dd>
            <dt>CPU usage</dt>
            <dd>{detail.cpu}%</dd>
            <dt>Memory usage</dt>
            <dd>{detail.mem}%</dd>
            <dt>Disk usage</dt>
            <dd>{detail.disk}%</dd>
            <dt>Last reading</dt>
            <dd>{detail.lastSeen ? formatDateTime(detail.lastSeen) : 'Demo data'}</dd>
          </dl>
        </Modal>
      )}
    </>
  )
}
