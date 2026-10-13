const SEVERITY_TONE = { Critical: 'critical', Warning: 'warning', Information: 'info' }
const INCIDENT_TONE = { Open: 'critical', Investigating: 'warning', Resolved: 'good' }
const APP_TONE = { Healthy: 'healthy', Degraded: 'warning', Down: 'critical', Critical: 'critical' }

export const appTone = (status) => APP_TONE[status] ?? 'offline'

// Solid label used for incident / alert severity.
export function SeverityBadge({ level }) {
  return <span className={`sev sev--${SEVERITY_TONE[level] ?? 'info'}`}>{level}</span>
}

// Soft pill used for incident status.
export function IncidentStatus({ status }) {
  return <span className={`pill pill--${INCIDENT_TONE[status]}`}>{status}</span>
}

// Coloured dot + label used for server / service health.
// tone: healthy | warning | critical | offline
export function HealthStatus({ tone, label }) {
  const text = label ?? tone.charAt(0).toUpperCase() + tone.slice(1)
  return (
    <span className={`dot-status dot-status--${tone}`}>
      <i aria-hidden="true" />
      {text}
    </span>
  )
}
