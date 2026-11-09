import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Card from '../ui/Card'
import { HealthStatus } from '../ui/Badge'
import { api } from '../../services/api'

function formatTime(value) {
  return value ? new Date(value).toLocaleString() : 'Waiting for a report'
}

const probeTone = { up: 'healthy', down: 'critical', unknown: 'offline' }
const probeLabel = { up: 'Up', down: 'Down', unknown: 'Unknown' }

export default function MonitoringStatus() {
  const [summary, setSummary] = useState(null)
  const [events, setEvents] = useState([])
  const [error, setError] = useState(false)

  useEffect(() => {
    let stopped = false
    let timer
    async function poll() {
      try {
        const [status, history] = await Promise.all([api.get('/monitor/summary'), api.get('/monitor/events')])
        if (stopped) return
        setSummary(status.data)
        setEvents(history.data)
        setError(false)
      } catch {
        if (!stopped) setError(true)
      } finally {
        if (!stopped) timer = setTimeout(poll, 5000)
      }
    }
    poll()
    return () => { stopped = true; clearTimeout(timer) }
  }, [])

  return (
    <>
      <div className="col-5">
        <Card title="Live monitoring">
          {error && <p className="muted" role="status">Could not refresh monitoring status.</p>}
          {!summary && !error && <p className="muted">Loading monitoring status…</p>}
          <ul className="rows rows--spaced">
            {summary?.hosts.map(host => (
              <li key={host.id} className="row row--plain">
                <div className="row__main">
                  <strong>{host.label}</strong>
                  <span>{host.enabled ? formatTime(host.last_seen) : 'Agent token is not configured'}</span>
                </div>
                <HealthStatus tone={host.status?.toLowerCase() ?? 'offline'} label={host.status ?? 'Waiting'} />
              </li>
            ))}
            {summary?.probes.map(probe => (
              <li key={probe.key} className="row row--plain">
                <div className="row__main">
                  <strong>{probe.label}</strong>
                  <span>{formatTime(Number(probe.observed_at))}</span>
                </div>
                <HealthStatus tone={probeTone[probe.state]} label={probeLabel[probe.state]} />
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <div className="col-7">
        <Card title="Monitoring and recovery history">
          {events.length === 0 ? <p className="muted">No monitoring events recorded yet.</p> : (
            <ul className="rows rows--spaced">
              {events.slice(0, 10).map(event => (
                <li key={event.id} className="row row--plain">
                  <div className="row__main">
                    <strong>{event.event_type} · {event.target_id}</strong>
                    <span>{event.detail} · {formatTime(Number(event.observed_at))}</span>
                  </div>
                  {event.incident_id && <Link to={'/incidents?q=' + event.incident_id}>{event.incident_id}</Link>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  )
}
