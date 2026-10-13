-- ===========================================================
-- SentinelOps database schema (sentinelops_db)
-- Adapted from the backend blueprint's Task 4 design. Columns
-- marked [added] were not in the original table list but are
-- required by the live frontend (v3): single DevOps Engineer
-- role with multiple users, incidents/alerts that name their
-- application or server, and configurable alert thresholds.
-- ===========================================================

CREATE DATABASE IF NOT EXISTS sentinelops_db;
USE sentinelops_db;

-- ---------- users ----------
-- DevOps Engineer accounts. Only one role exists; many users can hold it.
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(120)  NOT NULL,
  email         VARCHAR(160)  NOT NULL UNIQUE,
  password      VARCHAR(255)  NOT NULL,          -- bcrypt hash
  role          VARCHAR(40)   NOT NULL DEFAULT 'DevOps Engineer',
  status        VARCHAR(20)   NOT NULL DEFAULT 'Active',   -- [added] User Management Module needs this
  last_active   DATETIME      NULL,                        -- [added]
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------- servers ----------
-- Exactly 3 server_type values are used: 'Web', 'API', 'Database'.
-- cpu/memory/disk usage are the LATEST reading, kept on the row itself
-- so GET /api/servers is a single cheap query; history lives in `metrics`.
CREATE TABLE IF NOT EXISTS servers (
  id              VARCHAR(40)   PRIMARY KEY,      -- e.g. 'prod-web-01'
  server_name     VARCHAR(80)   NOT NULL,
  server_type     VARCHAR(20)   NOT NULL,          -- 'Web' | 'API' | 'Database'
  ip_address      VARCHAR(45)   NOT NULL,
  status          VARCHAR(20)   NOT NULL DEFAULT 'Healthy', -- Healthy|Warning|Critical|Offline
  cpu_usage       DECIMAL(5,2)  NOT NULL DEFAULT 0,
  memory_usage    DECIMAL(5,2)  NOT NULL DEFAULT 0,
  disk_usage      DECIMAL(5,2)  NOT NULL DEFAULT 0,
  updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ---------- applications ----------
-- The 5 monitored applications. host_server_id [added] ties each one to a
-- real server so Applications.jsx can show "Running on".
CREATE TABLE IF NOT EXISTS applications (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(120)  NOT NULL,
  version         VARCHAR(40)   NOT NULL,
  status          VARCHAR(20)   NOT NULL DEFAULT 'Healthy', -- Healthy|Down|Critical
  response_time   INT           NULL,                       -- milliseconds, NULL when Down
  uptime          DECIMAL(5,2)  NOT NULL DEFAULT 100,
  host_server_id  VARCHAR(40)   NULL,                        -- [added]
  updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (host_server_id) REFERENCES servers(id) ON DELETE SET NULL
);

-- ---------- metrics ----------
-- Historical readings, used for the dashboard's CPU/Memory/Disk chart.
CREATE TABLE IF NOT EXISTS metrics (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  server_id       VARCHAR(40)   NOT NULL,
  cpu_usage       DECIMAL(5,2)  NOT NULL,
  memory_usage    DECIMAL(5,2)  NOT NULL,
  disk_usage      DECIMAL(5,2)  NOT NULL,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE,
  INDEX idx_metrics_server_time (server_id, created_at)
);

-- ---------- incidents ----------
-- source [added]: the application or server name to display, since a title
-- like "Database Connection Failure" alone isn't enough context in a list.
-- assigned_user [added]: the Incident Management Module explicitly calls for
-- an assignee; the Task 4 table list omitted it.
CREATE TABLE IF NOT EXISTS incidents (
  id              VARCHAR(20)   PRIMARY KEY,       -- e.g. 'INC-1042'
  title           VARCHAR(160)  NOT NULL,
  source          VARCHAR(120)  NOT NULL,           -- [added]
  severity        VARCHAR(20)   NOT NULL,           -- Critical | Warning | Information
  status          VARCHAR(20)   NOT NULL DEFAULT 'Open', -- Open|Investigating|Resolved
  server_id       VARCHAR(40)   NULL,
  assigned_user   INT           NULL,               -- [added]
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at     DATETIME      NULL,
  FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_user) REFERENCES users(id) ON DELETE SET NULL
);

-- ---------- alerts ----------
-- type [added]: the Alert Management Module's "Alert Type" field (e.g. "CPU
-- Usage Above 80%"), separate from the longer `message`.
-- source [added]: the "Affected Service" field.
CREATE TABLE IF NOT EXISTS alerts (
  id              VARCHAR(20)   PRIMARY KEY,        -- e.g. 'ALT-2001'
  type            VARCHAR(120)  NOT NULL,            -- [added]
  message         VARCHAR(255)  NOT NULL,
  source          VARCHAR(120)  NOT NULL,            -- [added]
  severity        VARCHAR(20)   NOT NULL,            -- Critical | Warning | Information
  status          VARCHAR(20)   NOT NULL DEFAULT 'Active', -- Active | Acknowledged
  server_id       VARCHAR(40)   NULL,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE SET NULL
);

-- ---------- settings ----------
-- [added] Not in the Task 4 list at all, but the Settings Module's alert
-- thresholds (CPU Warning/Critical, Memory Warning) have to live somewhere
-- the monitoring engine can read. Single-row key/value table.
CREATE TABLE IF NOT EXISTS settings (
  setting_key     VARCHAR(40)  PRIMARY KEY,
  setting_value   VARCHAR(40)  NOT NULL
);
