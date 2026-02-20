-- ENUM types
CREATE TYPE client_status AS ENUM ('active', 'inactive', 'archived');
CREATE TYPE package_status AS ENUM ('active', 'completed', 'expired');
CREATE TYPE session_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');

-- trainers
CREATE TABLE trainers (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  name text NOT NULL,
  email text NOT NULL,
  ics_token text UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now()
);

-- clients
CREATE TABLE clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id uuid NOT NULL REFERENCES trainers(id),
  name text NOT NULL,
  email text,
  phone text,
  birth_date date,
  notes text,
  status client_status DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

-- packages
CREATE TABLE packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  total_sessions int NOT NULL,
  used_sessions int DEFAULT 0,
  price decimal(10,2),
  paid boolean DEFAULT false,
  paid_at timestamptz,
  status package_status DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

-- sessions
CREATE TABLE sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  package_id uuid REFERENCES packages(id),
  trainer_id uuid NOT NULL REFERENCES trainers(id),
  scheduled_at timestamptz NOT NULL,
  duration_minutes int DEFAULT 60,
  status session_status DEFAULT 'scheduled',
  location text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- exercises
CREATE TABLE exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id uuid NOT NULL REFERENCES trainers(id),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- session_exercises
CREATE TABLE session_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES exercises(id),
  order_index int NOT NULL,
  sets jsonb DEFAULT '[]',
  notes text,
  superset_group int
);

-- workout_templates
CREATE TABLE workout_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id uuid NOT NULL REFERENCES trainers(id),
  name text NOT NULL,
  exercises jsonb NOT NULL,
  category text,
  created_at timestamptz DEFAULT now()
);

-- inbody_records
CREATE TABLE inbody_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  measured_at date NOT NULL,
  weight decimal(5,2),
  body_fat_pct decimal(4,1),
  muscle_mass decimal(5,2),
  bmi decimal(4,1),
  visceral_fat decimal(4,1),
  body_water_pct decimal(4,1),
  custom_data jsonb,
  photo_urls text[],
  notes text,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE trainers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_trainer" ON trainers FOR ALL USING (id = auth.uid());

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_clients" ON clients FOR ALL USING (trainer_id = auth.uid());

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_sessions" ON sessions FOR ALL USING (trainer_id = auth.uid());

ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_exercises" ON exercises FOR ALL USING (trainer_id = auth.uid());

ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_templates" ON workout_templates FOR ALL USING (trainer_id = auth.uid());

ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_packages" ON packages FOR ALL
  USING (client_id IN (SELECT id FROM clients WHERE trainer_id = auth.uid()));

ALTER TABLE session_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_session_exercises" ON session_exercises FOR ALL
  USING (session_id IN (SELECT id FROM sessions WHERE trainer_id = auth.uid()));

ALTER TABLE inbody_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_inbody" ON inbody_records FOR ALL
  USING (client_id IN (SELECT id FROM clients WHERE trainer_id = auth.uid()));

-- Storage bucket for inbody photos
INSERT INTO storage.buckets (id, name, public) VALUES ('inbody-photos', 'inbody-photos', false);
CREATE POLICY "trainer_upload_inbody" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'inbody-photos' AND auth.role() = 'authenticated');
CREATE POLICY "trainer_read_inbody" ON storage.objects FOR SELECT
  USING (bucket_id = 'inbody-photos' AND auth.role() = 'authenticated');
CREATE POLICY "trainer_delete_inbody" ON storage.objects FOR DELETE
  USING (bucket_id = 'inbody-photos' AND auth.role() = 'authenticated');
