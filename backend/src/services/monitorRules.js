const RULES = [
  { key: 'cpu', label: 'CPU usage', field: 'cpuUsage', warning: 'cpuWarning', critical: 'cpuCritical' },
  { key: 'memory', label: 'Memory usage', field: 'memoryUsage', warning: 'memWarning', critical: 'memCritical' },
  { key: 'disk', label: 'Disk usage', field: 'diskUsage', warning: 'diskWarning', critical: 'diskCritical' },
]
const HOSTS = {
  'ncc-pc-1': { label: 'NCC PC 1', tokenEnv: 'MONITOR_PC1_TOKEN' },
  'ncc-pc-2': { label: 'NCC PC 2', tokenEnv: 'MONITOR_PC2_TOKEN', probe: true },
}

const hasHost = id => Object.hasOwn(HOSTS, id)
const isPercentage = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100

function severityFor(value, warning, critical) {
  if (value >= critical) return 'Critical'
  if (value >= warning) return 'Warning'
  return null
}

module.exports = { RULES, HOSTS, hasHost, isPercentage, severityFor }
