import { useEffect, useState } from 'react'

// Re-renders the component every `ms` so clocks and "open for X min" stay fresh.
export default function useNow(ms = 30000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), ms)
    return () => clearInterval(id)
  }, [ms])
  return now
}
