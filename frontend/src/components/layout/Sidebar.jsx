import { NavLink } from 'react-router-dom'
import { Bell, Boxes, LayoutDashboard, Server, Settings, Siren, Users } from 'lucide-react'
import Logo from '../ui/Logo'
import { useData } from '../../context/DataContext'

// Sidebar order follows the v2 module list: Dashboard, Infrastructure Monitoring,
// Application Monitoring, Incident Management, Alert Management, User Management, Settings.
const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/infrastructure', label: 'Infrastructure', icon: Server },
  { to: '/applications', label: 'Applications', icon: Boxes },
  { to: '/incidents', label: 'Incidents', icon: Siren, badge: 'incidents' },
  { to: '/alerts', label: 'Alerts', icon: Bell },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar({ open, onNavigate }) {
  const { activeIncidents } = useData()
  const badges = { incidents: activeIncidents.length }

  return (
    <aside className={open ? 'sidebar is-open' : 'sidebar'} aria-label="Main navigation">
      <Logo />
      <nav className="nav">
        {NAV.map(({ to, label, icon: Icon, end, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) => (isActive ? 'nav__link is-active' : 'nav__link')}
          >
            <Icon size={20} aria-hidden="true" />
            {label}
            {badge && badges[badge] > 0 && <span className="nav__badge">{badges[badge]}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar__foot">
        <p className="quote">“Reliable Systems, Stronger Tomorrows”</p>
        <span className="version">v2.1.0</span>
      </div>
    </aside>
  )
}
