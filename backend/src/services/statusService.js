const { severityFor } = require('./monitorRules')

function computeStatus({ cpu_usage, memory_usage, disk_usage }, thresholds) {
  const readings = [
    severityFor(cpu_usage, thresholds.cpuWarning, thresholds.cpuCritical),
    severityFor(memory_usage, thresholds.memWarning, thresholds.memCritical),
    severityFor(disk_usage, thresholds.diskWarning, thresholds.diskCritical),
  ]
  if (readings.includes('Critical')) return 'Critical'
  return readings.includes('Warning') ? 'Warning' : 'Healthy'
}

module.exports = { computeStatus }
