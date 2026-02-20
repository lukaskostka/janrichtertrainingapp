-- Add recurring session support
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS recurrence_group_id uuid;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS recurrence_rule jsonb;
-- recurrence_rule: { "day_of_week": 2, "time": "10:00", "interval_weeks": 1 }

-- Index for efficient group queries
CREATE INDEX IF NOT EXISTS idx_sessions_recurrence_group ON sessions (recurrence_group_id) WHERE recurrence_group_id IS NOT NULL;
