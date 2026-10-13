# SentinelOps

Autonomous IT Infrastructure Monitoring and Incident Response Platform.
A DevOps-lifecycle demonstration project: React frontend, Node/Express + MySQL
backend, with Docker/Jenkins/Terraform/Ansible to follow once this layer is solid.

```
SentinelOps/
|-- frontend/     React + Vite dashboard (DONE - see frontend/README.md)
|-- backend/      Express REST API (DONE - see backend/README.md)
|-- database/     schema.sql - run this first
|-- deployment/   placeholder for the DevOps phase (Docker, Jenkins, Terraform, Ansible)
```

## Run it locally (both halves)

**1. Database** - install MySQL 8, then:
```bash
mysql -u root -p -e "
CREATE DATABASE sentinelops_db;
CREATE USER 'sentinelops'@'localhost' IDENTIFIED BY 'your_password_here';
GRANT ALL PRIVILEGES ON sentinelops_db.* TO 'sentinelops'@'localhost';
FLUSH PRIVILEGES;"
mysql -u sentinelops -p sentinelops_db < database/schema.sql
```

**2. Backend**
```bash
cd backend
cp .env.example .env      # fill in your DB password + a JWT secret
npm install
npm run seed              # loads the 8 servers / 5 apps / incidents / alerts / 5 users
npm run dev                # http://localhost:5000
```

**3. Frontend** (new terminal)
```bash
cd frontend
npm install
npm run dev                # http://localhost:5173
```

Sign in with `devops@sentinelops.io` / `devops123` (see `backend/README.md` for
every demo account).

## What's live vs. simulated right now

| | Status |
| --- | --- |
| Login, JWT sessions | **Real** - MySQL + bcrypt + JWT |
| Servers, applications, incidents, alerts, users, settings | **Real** - every page reads/writes actual MySQL rows through the API, polled every 5s |
| Dashboard chart history | **Real** - `metrics` table, seeded with a day of history |
| "Simulate Failure" | **Real** - writes a real incident + alert + server status change, used as a manual stand-in for detection |
| Continuous real-world CPU/memory/disk readings | **Not yet** - that's the monitoring agent, the next phase. `POST /api/metrics` is built and tested; nothing calls it on a schedule yet |

## Project status

- [x] Frontend (v3): single DevOps Engineer role, 8 servers across 3 tiers, 5 applications
- [x] Backend: Express + MySQL, JWT auth, full CRUD for every module
- [x] Frontend <-> backend wired together, mock data removed
- [ ] Monitoring agent (real CPU/memory/disk collection)
- [ ] Docker, Jenkins, Terraform, Ansible, Kubernetes/Prometheus (optional)
