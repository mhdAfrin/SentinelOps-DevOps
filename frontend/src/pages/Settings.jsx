import { LogOut, Moon, RotateCcw, Sun } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import { useAuth } from '../context/AuthContext'
import { DEFAULT_THRESHOLDS, useData } from '../context/DataContext'
import { useTheme } from '../context/ThemeContext'

const THRESHOLD_GROUPS = [
  ['CPU', 'cpuWarning', 'cpuCritical'],
  ['Memory', 'memWarning', 'memCritical'],
  ['Disk', 'diskWarning', 'diskCritical'],
]
export default function Settings() {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const { thresholds, setThresholds } = useData()

  return (
    <>
      <PageHeader title="Settings" subtitle="Changes apply immediately across the dashboard." />

      <div className="grid">
        <div className="col-6">
          <Card title="Alert threshold settings">
            <p className="muted">
              Live agents use these thresholds on their next reading. A resource incident resolves after two healthy readings.
            </p>
            {THRESHOLD_GROUPS.flatMap(([label, warning, critical]) => [
              [label + ' warning', warning, 0, thresholds[critical] - 1],
              [label + ' critical', critical, thresholds[warning] + 1, 100],
            ]).map(([label, key, min, max]) => (
              <div key={key} className="settings-field">
                <label htmlFor={key}>{label} at <output>{thresholds[key]}%</output></label>
                <input id={key} type="range" min={min} max={max} value={thresholds[key]}
                  onChange={event => setThresholds(current => ({ ...current, [key]: Number(event.target.value) }))} />
              </div>
            ))}
            <button className="btn btn--sm" onClick={() => setThresholds(DEFAULT_THRESHOLDS)}>
              <RotateCcw size={14} aria-hidden="true" /> Reset to defaults
            </button>
          </Card>
        </div>

        <div className="col-6">
          <Card title="Application preferences">
            <div className="segmented segmented--lg" role="group" aria-label="Theme">
              <button className={theme === 'light' ? 'is-active' : ''} aria-pressed={theme === 'light'} onClick={() => setTheme('light')}>
                <Sun size={16} aria-hidden="true" /> Light
              </button>
              <button className={theme === 'dark' ? 'is-active' : ''} aria-pressed={theme === 'dark'} onClick={() => setTheme('dark')}>
                <Moon size={16} aria-hidden="true" /> Dark
              </button>
            </div>
          </Card>

          <Card title="Account settings" className="mt">
            <dl className="details">
              <dt>Name</dt>
              <dd>{user.name}</dd>
              <dt>Email</dt>
              <dd>{user.email}</dd>
              <dt>Role</dt>
              <dd>{user.role}</dd>
            </dl>
            <button className="btn btn--sm" onClick={logout}>
              <LogOut size={14} aria-hidden="true" /> Sign out
            </button>
          </Card>
        </div>
      </div>
    </>
  )
}
