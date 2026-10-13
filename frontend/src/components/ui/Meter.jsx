// Usage bar. `tone` (good | warning | critical | neutral) is decided by the
// caller, since CPU, Memory and Disk each follow different rules (Settings
// Module only defines CPU Warning/Critical and Memory Warning thresholds).
export default function Meter({ value, label, tone = 'neutral' }) {
  return (
    <div className={`meter meter--${tone}`}>
      <span className="meter__value">{value}%</span>
      <div
        className="meter__track"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
      >
        <div className="meter__fill" style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}
