# SentinelOps

React/Vite dashboard, Express API, and MySQL for infrastructure metrics, incidents, and alerts.

## Sprint 4–5 monitoring

Follow the [two-PC agent setup and failure demo](monitoring-agent/README.md) after starting the stack. The backend applies the additive [monitoring schema](backend/src/config/monitoring.sql) at startup, including on an existing Sprint 1–2 database. The app database account needs table creation privileges. This new project starts with a separate Compose volume by default.

## Run with Docker Compose

1. Start Docker Desktop in Linux container mode, or use Docker Engine with the Compose plugin on Linux.
2. Use the root `.env` if one was supplied. For a new checkout, copy `.env.example` to `.env`, set distinct random values for the three secrets, and set the first account's email and password. Use at least 12 characters and at most 72 bytes for the account password. Keep `.env` private.
3. From the repository root:

   ```powershell
   docker compose config --quiet
   docker compose up -d --build
   docker compose ps
   curl.exe -f http://localhost:8080/api/ready
   ```

4. Open [http://localhost:8080](http://localhost:8080) and sign in with `BOOTSTRAP_EMAIL` and `BOOTSTRAP_PASSWORD` from `.env`. The backend creates the first account on an empty users table. Changing those variables later does not reset the account's password.

Nginx publishes the dashboard and forwards `/api/` to Express on the internal network. MySQL is internal to Compose. By default the web port is bound to localhost. To use an approved lab network, set `BIND_ADDRESS` in `.env` to the lab host's LAN IP and open the configured `APP_PORT` on that host's firewall for lab clients.

MySQL loads [the schema](database/schema.sql) during initialization of a new `mysql_data` volume. Normal restarts and `docker compose down` keep that volume. `docker compose down -v` deletes it. Schema changes and password rotations on an existing volume require database operations because initialization does not rerun.

### Optional lab demo data

A fresh database starts with the first account and an empty dashboard. For an isolated demo with both monitoring tokens unset and no monitoring history, `docker compose exec backend node src/scripts/seed.js` replaces **all** app data and accounts with fixtures, including known demo passwords. Sign in using the accounts in the [backend README](backend/README.md) after seeding. Use this only on a disposable database.

### Check the stack

- Check `docker compose ps` for three healthy services and `/api/ready` for a successful database check.
- Sign in and open Dashboard, Infrastructure, Incidents, and Alerts. Reload a nested page directly.
- With demo data, simulate a failure on a server without an open incident, acknowledge its alert, and resolve its incident.
- Run `docker compose restart`, wait for readiness, and verify that those changes remain.

For startup failures, run `docker compose logs --tail=100 db backend frontend`.

## Run outside Docker

Prepare MySQL and `backend/.env` using the [backend instructions](backend/README.md), then run `npm ci` and `npm run dev` in `backend/`. In another terminal, run `npm ci` and `npm run dev` in `frontend/` and open [http://localhost:5173](http://localhost:5173). Vite forwards `/api/` to port 5000. For a different backend address, copy `frontend/.env.example` to `frontend/.env` and set `API_PROXY_TARGET`.

The legacy metric API and manual simulation remain available for demo servers. Lab hosts send readings through the authenticated monitoring API.
