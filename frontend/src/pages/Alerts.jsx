import { useState } from 'react'
import { Bell, CheckCheck } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Tabs from '../components/ui/Tabs'
import EmptyState from '../components/ui/EmptyState'
import { SeverityBadge } from '../components/ui/Badge'
import { useData } from '../context/DataContext'
import { formatDateTime } from '../utils/format'

const TONE = { Critical: 'red', Warning: 'amber', Information: 'blue' }

// Alert Management Module. Information: Alert Type, Severity, Affected Service,
// Time, Status. Action: Acknowledge Alert.
export default function Alerts() {
  const { alerts, openAlerts, acknowledgeAlert, acknowledgeAll } = useData()
  const [filter, setFilter] = useState('active')

  const rows = alerts
    .filter((a) => (filter === 'all' ? true : filter === 'active' ? a.status === 'Active' : a.status === 'Acknowledged'))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const tabs = [
    { value: 'active', label: 'Active', count: openAlerts.length },
    { value: 'acknowledged', label: 'Acknowledged', count: alerts.length - openAlerts.length },
    { value: 'all', label: 'All', count: alerts.length },
  ]

  return (
    <>
      <PageHeader title="Alerts" subtitle="Threshold warnings raised by the monitoring agent. Acknowledge an alert once someone has seen it.">
        <button className="btn" onClick={acknowledgeAll} disabled={openAlerts.length === 0}>
          <CheckCheck size={16} aria-hidden="true" /> Acknowledge all
        </button>
      </PageHeader>

      <Card>
        <Tabs tabs={tabs} value={filter} onChange={setFilter} label="Filter alerts" />
        {rows.length === 0 ? (
          <EmptyState title="Nothing here" hint="New alerts appear when a server crosses a threshold." />
        ) : (
          <ul className="rows rows--spaced">
            {rows.map((a) => (
              <li key={a.id} className="row row--plain">
                <span className={`bell bell--${TONE[a.severity]}`}>
                  <Bell size={18} aria-hidden="true" />
                </span>
                <div className="row__main">
                  <strong>{a.type}</strong>
                  <span>
                    {a.source} • {formatDateTime(a.createdAt)}
                  </span>
                </div>
                <SeverityBadge level={a.severity} />
                {a.status === 'Acknowledged' ? (
                  <span className="muted">Acknowledged</span>
                ) : (
                  <button className="btn btn--sm" onClick={() => acknowledgeAlert(a.id)}>
                    Acknowledge
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  )
}
