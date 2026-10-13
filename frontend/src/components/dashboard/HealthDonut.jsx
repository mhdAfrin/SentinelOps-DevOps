import Card from '../ui/Card'

const SEGMENTS = [
  { key: 'healthy', label: 'Healthy', color: 'var(--green)' },
  { key: 'warning', label: 'Warning', color: 'var(--amber-bg)' },
  { key: 'critical', label: 'Critical', color: 'var(--red)' },
  { key: 'offline', label: 'Offline', color: 'var(--slate)' },
]

export default function HealthDonut({ health }) {
  const R = 48
  const GAP = 0.8

  // Each arc starts where the previous one ended.
  const arcs = SEGMENTS.reduce((list, seg) => {
    const pct = health.total ? (health[seg.key] / health.total) * 100 : 0
    const prev = list[list.length - 1]
    const offset = prev ? prev.offset + prev.pct : 0
    return [...list, { ...seg, pct, offset }]
  }, [])
  const visible = arcs.filter((a) => a.pct > 0)
  const gap = visible.length > 1 ? GAP : 0

  return (
    <Card title="Infrastructure Health">
      <div className="health">
        <div className="donut">
          <svg viewBox="0 0 120 120" role="img" aria-label={`${health.percent}% of servers healthy`}>
            <circle className="donut__track" cx="60" cy="60" r={R} />
            {visible.map((a) => (
              <circle
                key={a.key}
                className="donut__arc"
                cx="60"
                cy="60"
                r={R}
                pathLength="100"
                stroke={a.color}
                strokeDasharray={`${a.pct - gap} ${100 - a.pct + gap}`}
                strokeDashoffset={-a.offset}
                transform="rotate(-90 60 60)"
              />
            ))}
          </svg>
          <div className="donut__center">
            <strong>{health.percent}%</strong>
            <span>Healthy</span>
          </div>
        </div>

        <ul className="legend">
          {SEGMENTS.map((seg) => (
            <li key={seg.key}>
              <i style={{ background: seg.color }} aria-hidden="true" />
              <span>{seg.label}</span>
              <strong>{health[seg.key]}</strong>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  )
}
