-- 1. ON DELETE SET NULL for session_exercises.exercise_id
-- Preserves historical workout data when an exercise is deleted
ALTER TABLE session_exercises ALTER COLUMN exercise_id DROP NOT NULL;
ALTER TABLE session_exercises DROP CONSTRAINT session_exercises_exercise_id_fkey;
ALTER TABLE session_exercises ADD CONSTRAINT session_exercises_exercise_id_fkey
  FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE SET NULL;

-- 2. Storage RLS: use auth.uid() instead of auth.role()
-- Ensures only the actual trainer (not just any authenticated user) can access photos
DROP POLICY IF EXISTS "trainer_upload_inbody" ON storage.objects;
DROP POLICY IF EXISTS "trainer_read_inbody" ON storage.objects;
DROP POLICY IF EXISTS "trainer_delete_inbody" ON storage.objects;
CREATE POLICY "trainer_upload_inbody" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'inbody-photos' AND auth.uid() IN (SELECT id FROM trainers));
CREATE POLICY "trainer_read_inbody" ON storage.objects FOR SELECT
  USING (bucket_id = 'inbody-photos' AND auth.uid() IN (SELECT id FROM trainers));
CREATE POLICY "trainer_delete_inbody" ON storage.objects FOR DELETE
  USING (bucket_id = 'inbody-photos' AND auth.uid() IN (SELECT id FROM trainers));

-- 3. Atomic toggle payment RPC
CREATE OR REPLACE FUNCTION toggle_package_payment(p_package_id uuid)
RETURNS TABLE(id uuid, paid boolean, paid_at timestamptz) AS $$
BEGIN
  RETURN QUERY UPDATE packages
  SET paid = NOT packages.paid,
      paid_at = CASE WHEN NOT packages.paid THEN now() ELSE NULL END
  WHERE packages.id = p_package_id
  RETURNING packages.id, packages.paid, packages.paid_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
