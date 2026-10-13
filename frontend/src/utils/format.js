export const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

const isToday = (iso) => new Date(iso).toDateString() === new Date().toDateString()

export const formatDateTime = (iso) => {
  if (isToday(iso)) return `Today, ${formatTime(iso)}`
  const day = new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  return `${day}, ${formatTime(iso)}`
}

export const formatMs = (ms) => {
  if (ms == null) return '-'
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : `${ms} ms`
}

export const minutesBetween = (fromIso, toIso) =>
  Math.max(0, Math.round((new Date(toIso) - new Date(fromIso)) / 60000))

export const formatMinutes = (mins) => {
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m ? `${h} h ${m} min` : `${h} h`
}

export const initials = (name) =>
  name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
