import { Bell, Boxes, Server, Siren } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import useNow from '../hooks/useNow'
import StatCard from '../components/dashboard/StatCard'
import HealthDonut from '../components/dashboard/HealthDonut'
import SystemOverviewChart from '../components/dashboard/SystemOverviewChart'
import RecentIncidents from '../components/dashboard/RecentIncidents'

// Dashboard Module: Summary Cards, Infrastructure Health, System Performance
// Graphs, Recent Incidents - exactly the four components in the v2 blueprint.
export default function Dashboard() {
  const { user } = useAuth()
  const { servers, apps, incidents, health, activeIncidents, openAlerts } = useData()
  const now = useNow()

  const date = now.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
  const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

  const critical = health.critical + health.offline + apps.filter((a) => a.status === 'Down' || a.status === 'Critical').length
  const warnings = health.warning
  const overall =
    critical > 0
      ? { tone: 'critical', text: `${critical} critical ${critical === 1 ? 'issue needs' : 'issues need'} attention` }
      : warnings > 0
        ? { tone: 'warning', text: `${warnings} ${warnings === 1 ? 'warning' : 'warnings'} to review` }
        : { tone: 'healthy', text: 'All Systems Operational' }

  return (
    <>
      <div className="welcome">
        <div>
          <h1>Welcome back, {user.name.split(' ')[0]}!</h1>
          <p>Here&apos;s what&apos;s happening with your infrastructure today.</p>
        </div>
        <div className="welcome__meta">
          <span>
            {date} {time}
          </span>
          <span className={`overall overall--${overall.tone}`}>
            <i aria-hidden="true" /> {overall.text}
          </span>
        </div>
      </div>

      <div className="grid">
        <div className="col-3">
          <StatCard to="/infrastructure" icon={Server} label="Total Servers" value={servers.length} trend="down" good delta="Right-sized to 3 tiers" />
        </div>
        <div className="col-3">
          <StatCard to="/applications" icon={Boxes} label="Applications" value={apps.length} trend="up" good delta="+1 from last week" />
        </div>
        <div className="col-3">
          <StatCard to="/incidents" icon={Siren} tone="red" label="Active Incidents" value={activeIncidents.length} trend="down" good delta="-2 from yesterday" />
        </div>
        <div className="col-3">
          <StatCard to="/alerts" icon={Bell} label="Open Alerts" value={openAlerts.length} trend="up" good={false} delta="+3 from yesterday" />
        </div>

        <div className="col-5">
          <HealthDonut health={health} />
        </div>
        <div className="col-7">
          <SystemOverviewChart />
        </div>

        <div className="col-12">
          <RecentIncidents incidents={incidents} />
        </div>
      </div>
    </>
  )
}
