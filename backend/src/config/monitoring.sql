CREATE TABLE IF NOT EXISTS monitor_hosts (
  server_id VARCHAR(40) PRIMARY KEY,
  last_seen DATETIME(3) NOT NULL,
  sample_at BIGINT NOT NULL,
  FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS monitor_probes (
  probe_key VARCHAR(20) PRIMARY KEY,
  state VARCHAR(10) NOT NULL,
  observed_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS monitor_conditions (
  target_id VARCHAR(40) NOT NULL,
  rule_key VARCHAR(20) NOT NULL,
  incident_id VARCHAR(20),
  alert_id VARCHAR(20),
  severity VARCHAR(20),
  healthy_count TINYINT NOT NULL DEFAULT 0,
  PRIMARY KEY (target_id, rule_key)
);

CREATE TABLE IF NOT EXISTS monitor_events (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  target_id VARCHAR(40) NOT NULL,
  incident_id VARCHAR(20),
  event_type VARCHAR(32) NOT NULL,
  detail VARCHAR(255) NOT NULL,
  observed_at BIGINT NOT NULL,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (incident_id, id)
);
