export default function Logo({ showTagline = true }) {
  return (
    <div className="logo">
      <svg viewBox="0 0 32 36" aria-hidden="true">
        <defs>
          <linearGradient id="logo-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#3b82f6" />
            <stop offset="1" stopColor="#1d4ed8" />
          </linearGradient>
        </defs>
        <path d="M16 2 29 7v10c0 8-5.5 14-13 17C8.5 31 3 25 3 17V7z" fill="url(#logo-grad)" />
        <path
          d="M8 18h4l2.5-5 3.5 9 2.5-4H24"
          fill="none"
          stroke="#fff"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div>
        <div className="logo__name">
          Sentinel<span>Ops</span>
        </div>
        {showTagline && <div className="logo__tag">Monitor · Detect · Respond</div>}
      </div>
    </div>
  )
}
