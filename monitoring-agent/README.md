# Run the two NCC host agents

Run the agent directly on each lab computer with Node.js 24. Running inside a
container would measure the container or its VM rather than the intended host.

1. On PC 1, start the stack from this sprint folder. Set the root `.env`
   `BIND_ADDRESS` to PC 1's LAN IP. Keep both `MONITOR_PC1_TOKEN` and
   `MONITOR_PC2_TOKEN` private. Allow the web port from the approved lab network.
2. On each PC, copy this directory and copy `.env.example` to `.env`. Use:

   | Value | PC 1 | PC 2 |
   | --- | --- | --- |
   | `MONITOR_HOST_ID` | `ncc-pc-1` | `ncc-pc-2` |
   | `MONITOR_URL` | `http://<PC-1-LAN-IP>:8080` | Same |
   | `MONITOR_TOKEN` | PC 1 token from the stack | PC 2 token from the stack |
   | `MONITOR_IP` | PC 1's LAN IP, optional | PC 2's LAN IP, optional |

   Use an HTTPS origin when one is available. With HTTP, use the approved
   lab network because requests contain each agent's token.
3. From the `monitoring-agent` folder on each PC, run:

   ```powershell
   node --env-file=.env agent.mjs
   ```

   Keep the process running. Run one process per host ID and keep both
   system clocks synchronized. By default, the agent reports every 15 seconds.
   Set `MONITOR_DISK_PATH` to monitor a different filesystem. CPU is calculated
   from a one-second sample, and disk usage is for the chosen filesystem.
4. Sign in to SentinelOps. **Live monitoring** shows both hosts and the service
   checks. **Live Host Metrics** graphs CPU, RAM, and disk from agent readings.

## Failure and recovery demo

- **Agent availability** — stop one agent with Ctrl+C, wait for the heartbeat
  timeout (90 seconds by default, plus the scan interval), and check for its
  Offline status and incident. Restart the agent and check that its next
  heartbeat restores availability and records recovery.
- **Service availability** — with PC 2 still running, stop and restart the
  backend on a disposable demo stack. PC 2 checks the API independently and
  keeps service transitions in its local `monitor-state.json`. After the API
  returns, it uploads the outage and recovery. The same approach works with
  a MySQL stop/start. While MySQL is down, the API liveness endpoint can still
  respond, and readiness reports 503. The dashboard displays the recorded
  incident history after MySQL can accept writes again.
- **Resource thresholds** — set warning and critical thresholds in Settings.
  Use a threshold below current usage to trigger a test incident without adding
  load. Repeated breaches share one active incident and alert per host and metric.
  A warning escalates in place. Two consecutive readings below warning close the
  incident and alert. A new breach after recovery starts a new incident.
- **Operator response** — use **Acknowledge** on the alert or **Start
  investigation** on the incident. Automatic incidents close on confirmed
  recovery. Operators can still resolve manual incidents in the usual way.

The automatic actions are a bounded, read-only retry of the configured
SentinelOps health endpoint and incident/alert closure after recovery. No
host command or service restart is needed for either action. A service status of
**Unknown** means the witness could not verify it, for example when the API is
unreachable. Only observed failures lasting long enough for a probe and its
recheck can be reported. Keep the witness state file across restarts if a
service outage is in progress.
