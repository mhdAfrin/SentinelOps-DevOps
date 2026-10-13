import { LogOut, Moon, RotateCcw, Sun } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import { useAuth } from '../context/AuthContext'
import { DEFAULT_THRESHOLDS, useData } from '../context/DataContext'
import { useTheme } from '../context/ThemeContext'

// Settings Module: Alert Threshold Settings (CPU Warning, CPU Critical, Memory
// Warning), Account Settings, Application Preferences (theme).
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
              A server is marked Warning or Critical when its CPU or memory usage reaches these values.
            </p>
            <div className="settings-field">
              <label htmlFor="cpu-warn">
                CPU warning at <output>{thresholds.cpuWarning}%</output>
              </label>
              <input
                id="cpu-warn"
                type="range"
                min="50"
                max={thresholds.cpuCritical - 1}
                value={thresholds.cpuWarning}
                onChange={(e) => setThresholds((t) => ({ ...t, cpuWarning: Number(e.target.value) }))}
              />
            </div>
            <div className="settings-field">
              <label htmlFor="cpu-crit">
                CPU critical at <output>{thresholds.cpuCritical}%</output>
              </label>
              <input
                id="cpu-crit"
                type="range"
                min={thresholds.cpuWarning + 1}
                max="99"
                value={thresholds.cpuCritical}
                onChange={(e) => setThresholds((t) => ({ ...t, cpuCritical: Number(e.target.value) }))}
              />
            </div>
            <div className="settings-field">
              <label htmlFor="mem-warn">
                Memory warning at <output>{thresholds.memWarning}%</output>
              </label>
              <input
                id="mem-warn"
                type="range"
                min="50"
                max="99"
                value={thresholds.memWarning}
                onChange={(e) => setThresholds((t) => ({ ...t, memWarning: Number(e.target.value) }))}
              />
            </div>
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
