-- CHECK constraint: session duration must be between 1 and 480 minutes (8 hours)
ALTER TABLE sessions ADD CONSTRAINT chk_duration_minutes
  CHECK (duration_minutes > 0 AND duration_minutes <= 480);

-- Prevent deleting packages that have associated sessions
ALTER TABLE sessions DROP CONSTRAINT sessions_package_id_fkey;
ALTER TABLE sessions ADD CONSTRAINT sessions_package_id_fkey
  FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE RESTRICT;
