import { Link } from 'react-router-dom'

export default function Card({ title, actionTo, actionLabel = 'View All', right, flush = false, className = '', children }) {
  return (
    <section className={`card ${className}`}>
      {(title || actionTo || right) && (
        <header className="card__head">
          <h2 className="card__title">{title}</h2>
          {right}
          {actionTo && (
            <Link to={actionTo} className="card__link">
              {actionLabel}
            </Link>
          )}
        </header>
      )}
      <div className={flush ? 'card__body card__body--flush' : 'card__body'}>{children}</div>
    </section>
  )
}
