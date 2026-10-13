# SentinelOps - Frontend (v3)

React + Vite dashboard for SentinelOps. Single role (DevOps Engineer - add as many
as you need), 3-tier infrastructure (Web / API / Database, 8 servers total), and
5 monitored applications. All data is mocked in `src/data/mockData.js`; the
monitoring agent is simulated in `src/context/DataContext.jsx`.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

## Demo accounts

Every account is a **DevOps Engineer** - that's the only role SentinelOps has.

| Name | Email | Password |
| --- | --- | --- |
| Dinuka Kavinda | devops@sentinelops.io | devops123 |
| Ishara Fernando | ishara@sentinelops.io | ishara123 |

Add more from the **Users** page in-app (name + email - no password/role needed for the demo).

## Infrastructure (8 servers, 3 types)

| Type | Count | Hosts |
| --- | --- | --- |
| Web | 2 | the dashboard itself |
| API | 4 | User Authentication, Payment, Notification, API Gateway services |
| Database | 2 | Database Service (primary + replica) |

## Structure

```
src/
  components/  layout (Sidebar, Topbar, AppLayout), dashboard widgets, ui primitives (incl. Modal)
  context/     Theme, Auth (login only - one role), Data (servers, incidents, alerts, users, live simulation)
  data/        mock data: 8 servers / 5 apps / incidents & alerts that only reference those
  pages/       Login, Dashboard, Infrastructure, Applications, Incidents, Alerts, Users, Settings
  styles/      base.css (tokens, shell, modal), dashboard.css, pages.css
```
