import { Link } from 'react-router-dom'
import Card from '../ui/Card'
import { IncidentStatus, SeverityBadge } from '../ui/Badge'
import { formatTime } from '../../utils/format'

export default function RecentIncidents({ incidents }) {
  const recent = [...incidents].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)

  return (
    <Card title="Recent Incidents" actionTo="/incidents">
      <ul className="rows">
        {recent.map((i) => (
          <li key={i.id}>
            <Link to={`/incidents?q=${i.id}`} className="row">
              <SeverityBadge level={i.severity} />
              <div className="row__main">
                <strong>{i.title}</strong>
                <span>
                  {i.source} • {formatTime(i.createdAt)}
                </span>
              </div>
              <IncidentStatus status={i.status} />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  )
}
