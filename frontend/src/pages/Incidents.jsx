import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Tabs from '../components/ui/Tabs'
import SearchBox from '../components/ui/SearchBox'
import EmptyState from '../components/ui/EmptyState'
import { IncidentStatus, SeverityBadge } from '../components/ui/Badge'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import useNow from '../hooks/useNow'
import { formatDateTime, formatMinutes, minutesBetween } from '../utils/format'

const FLOW = ['Open', 'Investigating', 'Resolved']

// Status flow: Open -> Investigating -> Resolved.
function IncidentFlow({ status }) {
  const current = FLOW.indexOf(status)
  return (
    <ol className="flow" aria-label={`Progress: ${status}`}>
      {FLOW.map((step, idx) => (
        <li key={step} className={idx <= current ? 'is-done' : ''} title={step} />
      ))}
    </ol>
  )
}

export default function Incidents() {
  const { incidents, users, updateIncident } = useData()
  const { user } = useAuth()
  const now = useNow()
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const [filter, setFilter] = useState('all')

  const setQuery = (v) => setParams(v ? { q: v } : {}, { replace: true })
  const assignable = users.filter((u) => u.status === 'Active')
  const nameOf = (id) => users.find((u) => u.id === id)?.name

  const rows = incidents
    .filter(
      (i) =>
        (filter === 'all' || i.status === filter) &&
        `${i.id} ${i.title} ${i.source} ${nameOf(i.assignee) ?? ''}`.toLowerCase().includes(q.toLowerCase()),
    )
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const count = (s) => incidents.filter((i) => i.status === s).length
  const tabs = [
    { value: 'all', label: 'All', count: incidents.length },
    { value: 'Open', label: 'Open', count: count('Open') },
    { value: 'Investigating', label: 'Investigating', count: count('Investigating') },
    { value: 'Resolved', label: 'Resolved', count: count('Resolved') },
  ]

  // Actions: Start Investigation -> Mark Resolved -> Reopen Incident.
  function advance(i) {
    if (i.status === 'Open') updateIncident(i.id, { status: 'Investigating', assigned_user: i.assignee ?? String(user.id) })
    else if (i.status === 'Investigating') updateIncident(i.id, { status: 'Resolved' })
    else updateIncident(i.id, { status: 'Open' })
  }

  const actionLabel = { Open: 'Start investigation', Investigating: 'Mark resolved', Resolved: 'Reopen incident' }

  return (
    <>
      <PageHeader title="Incidents" subtitle="Assign incidents to a DevOps engineer, move them through the flow and track how long each takes to resolve." />
      <Card flush>
        <div className="toolbar">
          <Tabs tabs={tabs} value={filter} onChange={setFilter} label="Filter by status" />
          <SearchBox value={q} onChange={setQuery} placeholder="Search incidents" />
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Incident</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Assigned to</th>
                <th>Created time</th>
                <th>Resolved time</th>
                <th>
                  <span className="sr-only">Action</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((i) => (
                <tr key={i.id}>
                  <td>
                    <div className="cell-stack">
                      <strong>{i.title}</strong>
                      <span>
                        {i.id} • {i.source}
                      </span>
                    </div>
                  </td>
                  <td>
                    <SeverityBadge level={i.severity} />
                  </td>
                  <td>
                    <div className="status-cell">
                      <IncidentStatus status={i.status} />
                      <IncidentFlow status={i.status} />
                    </div>
                  </td>
                  <td>
                    <select
                      className="select"
                      value={i.assignee ?? ''}
                      onChange={(e) => updateIncident(i.id, { assigned_user: e.target.value || null })}
                      aria-label={`Assign ${i.id}`}
                    >
                      <option value="">Unassigned</option>
                      {assignable.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>{formatDateTime(i.createdAt)}</td>
                  <td>
                    {i.resolvedAt
                      ? formatDateTime(i.resolvedAt)
                      : `Open ${formatMinutes(minutesBetween(i.createdAt, now.toISOString()))}`}
                  </td>
                  <td>
                    <button
                      className={`btn btn--sm ${i.status === 'Investigating' ? 'btn--good' : i.status === 'Open' ? 'btn--primary' : ''}`}
                      onClick={() => advance(i)}
                    >
                      {actionLabel[i.status]}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && <EmptyState title="No incidents match" hint="Try a different status or search term." />}
      </Card>
    </>
  )
}
