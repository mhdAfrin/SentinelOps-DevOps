import { useEffect, useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import Card from '../ui/Card'
import { api } from '../../services/api'

const SERIES = [
  { key: 'cpu', name: 'CPU', color: '#3b82f6' },
  { key: 'memory', name: 'Memory', color: '#22c55e' },
  { key: 'disk', name: 'Disk', color: '#f97316' },
]

function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tip">
      <strong>{label}</strong>
      {payload.map((p) => (
        <div key={p.dataKey}>
          <i style={{ background: p.color }} />
          {p.name}: {p.value}%
        </div>
      ))}
    </div>
  )
}

// Dashboard "System Performance Graphs": CPU / Memory / Disk usage over time,
// averaged across all 8 servers from real rows in the `metrics` table
// (GET /api/metrics/series).
export default function SystemOverviewChart() {
  const [range, setRange] = useState('24h')
  const [data, setData] = useState([])

  useEffect(() => {
    let cancelled = false
    api
      .get('/metrics/series', { params: { range } })
      .then(({ data }) => {
        if (!cancelled) setData(data)
      })
      .catch(() => {
        if (!cancelled) setData([])
      })
    return () => {
      cancelled = true
    }
  }, [range])

  const legend = (
    <ul className="chart-legend">
      {SERIES.map((s) => (
        <li key={s.key}>
          <i style={{ background: s.color }} aria-hidden="true" />
          {s.name}
        </li>
      ))}
    </ul>
  )

  const rangeSwitch = (
    <div className="segmented" role="group" aria-label="Time range">
      {[
        ['24h', '24 hours'],
        ['7d', '7 days'],
      ].map(([value, text]) => (
        <button
          key={value}
          type="button"
          className={range === value ? 'is-active' : ''}
          aria-pressed={range === value}
          onClick={() => setRange(value)}
        >
          {text}
        </button>
      ))}
    </div>
  )

  return (
    <Card title={`System Performance (Last ${range === '24h' ? '24 Hours' : '7 Days'})`} right={legend}>
      <div className="chart-tools">{rangeSwitch}</div>
      <div className="chart-box">
        {data.length === 0 ? (
          <p className="muted">No metrics recorded for this range yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="label"
                interval={range === '24h' ? 3 : 0}
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'var(--text-3)', fontSize: 12 }}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tickFormatter={(v) => `${v}%`}
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'var(--text-3)', fontSize: 12 }}
              />
              <Tooltip content={<ChartTip />} cursor={{ stroke: 'var(--text-3)', strokeDasharray: '3 3' }} />
              {SERIES.map((s) => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.name}
                  stroke={s.color}
                  strokeWidth={2.2}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  )
}
