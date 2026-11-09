# SentinelOps - Backend

Node.js + Express REST API, backed by MySQL, following the structure from the
backend blueprint (`config/ controllers/ routes/ models/ middleware/ services/`).

## Setup outside Docker

1. Connect to MySQL 8 as an administrator and create a database and app user:
   ```sql
   CREATE DATABASE IF NOT EXISTS sentinelops_db;
   CREATE USER 'sentinelops'@'localhost' IDENTIFIED BY 'replace-with-a-random-password';
   GRANT ALL PRIVILEGES ON sentinelops_db.* TO 'sentinelops'@'localhost';
   ```
2. From the repository root, load `database/schema.sql` as the administrator, for example by running `source database/schema.sql` in the MySQL client.
3. Copy `backend/.env.example` to `backend/.env`. Set the app database password and a random JWT secret. To create the first account, set both bootstrap values before startup.
4. In `backend/`, run `npm ci` and `npm run dev`. Use `npm start` to start without the development watcher.
5. Check `http://localhost:5000/api/ready` to verify the API can query MySQL.

The optional `npm run seed` command replaces the data and user accounts. Use it only on a disposable demo database.

## Demo logins (after `npm run seed`)

| Email | Password |
| --- | --- |
| devops@sentinelops.io | devops123 |
| ishara@sentinelops.io | ishara123 |
| nimali@sentinelops.io | nimali123 |
| kasun@sentinelops.io | kasun123 |
| tharindu@sentinelops.io | tharindu123 |

## API reference

All routes except `/api/status`, `/api/ready`, `/api/auth/login`, and the two agent-write routes require
`Authorization: Bearer <token>`, issued by the login endpoint.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | /api/status | Process health |
| GET | /api/ready | Database readiness |
| POST | `/api/auth/login` | `{ email, password }` -> `{ token, user }` |
| GET | `/api/dashboard` | Summary counts + health breakdown + recent incidents |
| GET | `/api/servers` | All 8 servers with their latest reading |
| POST | `/api/servers/:id/simulate-failure` | Forces Critical CPU, opens a real incident + alert |
| GET | `/api/applications` | The 5 monitored applications |
| GET | `/api/incidents` | All incidents |
| POST | `/api/incidents` | Create one manually |
| PATCH | `/api/incidents/:id` | Change `status` and/or `assigned_user` |
| GET | `/api/alerts` | All alerts |
| PATCH | `/api/alerts/:id/acknowledge` | Acknowledge one |
| PATCH | `/api/alerts/acknowledge-all` | Acknowledge every active alert |
| GET | `/api/users` | All DevOps engineers |
| POST | `/api/users` | `{ name, email }` - adds a new engineer |
| DELETE | `/api/users/:id` | Remove one |
| GET | `/api/settings/thresholds` | Warning and critical thresholds for CPU, memory, and disk |
| PUT | `/api/settings/thresholds` | Update them |
| POST | `/api/metrics` | Legacy metric ingestion for demo inventory |
| POST | `/api/monitor/heartbeat` | Per-host agent token and `X-Monitor-Host`; records live resource readings |
| POST | `/api/monitor/probes` | PC 2 agent token; records API/MySQL observations |
| GET | `/api/monitor/summary` | Live host and service status |
| GET | `/api/monitor/events` | Latest incident and recovery events |
| GET | `/api/metrics/series?range=24h\|7d` | Averaged history for the dashboard chart |

See the [monitoring agent runbook](../monitoring-agent/README.md) for heartbeat timeouts, thresholds, recovery, and the two-PC setup.
