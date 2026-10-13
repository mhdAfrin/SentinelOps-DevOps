// Same rule the frontend used in its simulated version (DataContext.jsx):
// CPU >= critical -> Critical; CPU >= warning OR memory >= warning -> Warning;
// otherwise Healthy. Disk has no configured threshold (Settings Module only
// defines CPU Warning/Critical and Memory Warning).
function computeStatus({ cpu_usage, memory_usage }, thresholds) {
  if (cpu_usage >= thresholds.cpuCritical) return 'Critical'
  if (cpu_usage >= thresholds.cpuWarning || memory_usage >= thresholds.memWarning) return 'Warning'
  return 'Healthy'
}

module.exports = { computeStatus }
