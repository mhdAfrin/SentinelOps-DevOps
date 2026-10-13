# SentinelOps - Backend

Node.js + Express REST API, backed by MySQL, following the structure from the
backend blueprint (`config/ controllers/ routes/ models/ middleware/ services/`).

## Setup

1. **Install MySQL 8** if you don't have it, then create the database and an app user:
   ```sql
   CREATE DATABASE sentinelops_db;
   CREATE USER 'sentinelops'@'localhost' IDENTIFIED BY 'your_password_here';
   GRANT ALL PRIVILEGES ON sentinelops_db.* TO 'sentinelops'@'localhost';
   FLUSH PRIVILEGES;
   ```
2. **Load the schema**:
   ```bash
   mysql -u sentinelops -p sentinelops_db < ../database/schema.sql
   ```
3. **Configure environment**: copy `.env.example` to `.env` and fill in your DB password and a
   long random `JWT_SECRET`.
4. **Install dependencies and seed demo data**:
   ```bash
   npm install
   npm run seed
   ```
5. **Run the server**:
   ```bash
   npm run dev     # nodemon, auto-restarts on file changes
   # or
   npm start       # plain node
   ```
6. **Check it's alive**: open http://localhost:5000/api/status - you should see
   `{"status":"SentinelOps Backend Running"}`.

## Demo logins (after `npm run seed`)

| Email | Password |
| --- | --- |
| devops@sentinelops.io | devops123 |
| ishara@sentinelops.io | ishara123 |
| nimali@sentinelops.io | nimali123 |
| kasun@sentinelops.io | kasun123 |
| tharindu@sentinelops.io | tharindu123 |

## API reference

All routes except `/api/status` and `/api/auth/login` require
`Authorization: Bearer <token>`, issued by the login endpoint.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/status` | Health check |
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
| GET | `/api/settings/thresholds` | Current CPU Warning/Critical + Memory Warning |
| PUT | `/api/settings/thresholds` | Update them |
| POST | `/api/metrics` | `{ serverId, cpuUsage, memoryUsage, diskUsage }` - what the next-phase monitoring agent will call |
| GET | `/api/metrics/series?range=24h\|7d` | Averaged history for the dashboard chart |

## What's deliberately NOT here yet

Automatic incident/alert creation from a *real*, continuously-running monitoring
agent is the next phase (`monitoring-agent/`), per the blueprint's "Important
Development Rule." `POST /api/metrics` exists and works today - it's the
endpoint that agent will call - but nothing currently calls it on a schedule.
Until then, `POST /api/servers/:id/simulate-failure` is the real, working stand-in
used by the Infrastructure page's "Simulate Failure" button.
