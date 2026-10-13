import { Link } from 'react-router-dom'
import { ArrowDown, ArrowUp } from 'lucide-react'

// tone: blue | red | amber  (icon colour)   good: is this trend good news?
export default function StatCard({ to, icon: Icon, tone = 'blue', label, value, delta, trend, good }) {
  const TrendIcon = trend === 'up' ? ArrowUp : ArrowDown
  return (
    <Link to={to} className="card stat">
      <span className={`stat__icon stat__icon--${tone}`}>
        <Icon size={26} aria-hidden="true" />
      </span>
      <div className="stat__body">
        <span className="stat__label">{label}</span>
        <strong className="stat__value">{value}</strong>
        <span className={`stat__delta ${good ? 'is-good' : 'is-bad'}`}>
          <TrendIcon size={14} aria-hidden="true" /> {delta}
        </span>
      </div>
    </Link>
  )
}
