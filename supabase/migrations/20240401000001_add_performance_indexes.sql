-- Performance indexes for commonly filtered columns

-- Sessions: frequently filtered by trainer_id + client_id together
CREATE INDEX IF NOT EXISTS idx_sessions_trainer_client
  ON sessions (trainer_id, client_id);

-- Sessions: frequently filtered by status + scheduled_at (calendar, auto-complete)
CREATE INDEX IF NOT EXISTS idx_sessions_status_scheduled
  ON sessions (status, scheduled_at);

-- Packages: frequently filtered by client_id + status (active package lookup)
CREATE INDEX IF NOT EXISTS idx_packages_client_status
  ON packages (client_id, status);

-- InBody records: frequently ordered by client_id + measured_at
CREATE INDEX IF NOT EXISTS idx_inbody_client_measured
  ON inbody_records (client_id, measured_at DESC);

-- Session exercises: frequently filtered by session_id with ordering
CREATE INDEX IF NOT EXISTS idx_session_exercises_session_order
  ON session_exercises (session_id, order_index);
