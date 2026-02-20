-- Partial unique index: enforce one active package per client
CREATE UNIQUE INDEX idx_one_active_package_per_client ON packages (client_id) WHERE status = 'active';

-- CHECK constraints on packages
ALTER TABLE packages ADD CONSTRAINT chk_used_sessions_non_negative CHECK (used_sessions >= 0);
ALTER TABLE packages ADD CONSTRAINT chk_total_sessions_positive CHECK (total_sessions > 0);
ALTER TABLE packages ADD CONSTRAINT chk_price_non_negative CHECK (price >= 0);

-- RPC: atomically increment used_sessions and auto-complete when used >= total
CREATE OR REPLACE FUNCTION increment_package_sessions(p_package_id uuid)
RETURNS TABLE(id uuid, used_sessions int, total_sessions int, status package_status) AS $$
BEGIN
  RETURN QUERY
  UPDATE packages
  SET used_sessions = packages.used_sessions + 1,
      status = CASE WHEN packages.used_sessions + 1 >= packages.total_sessions THEN 'completed'::package_status ELSE packages.status END
  WHERE packages.id = p_package_id
  RETURNING packages.id, packages.used_sessions, packages.total_sessions, packages.status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: atomically decrement used_sessions and reopen if was completed
CREATE OR REPLACE FUNCTION decrement_package_sessions(p_package_id uuid)
RETURNS TABLE(id uuid, used_sessions int, total_sessions int, status package_status) AS $$
BEGIN
  RETURN QUERY
  UPDATE packages
  SET used_sessions = GREATEST(packages.used_sessions - 1, 0),
      status = CASE WHEN packages.status = 'completed'::package_status THEN 'active'::package_status ELSE packages.status END
  WHERE packages.id = p_package_id
  RETURNING packages.id, packages.used_sessions, packages.total_sessions, packages.status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
