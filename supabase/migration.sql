-- ============================================================
-- Fitty – database migration
-- Run this in the Supabase SQL Editor (wedsktvyzprxumrorjhf)
-- ============================================================

-- ── 1. personal_records ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS personal_records (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_name  TEXT NOT NULL,
  weight         NUMERIC NOT NULL,
  reps           INTEGER NOT NULL,
  estimated_1rm  NUMERIC NOT NULL,
  achieved_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE personal_records ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='personal_records' AND policyname='owner_all'
  ) THEN
    CREATE POLICY owner_all ON personal_records
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_pr_user_exercise ON personal_records(user_id, exercise_name);

-- ── 2. body_metrics ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS body_metrics (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bodyweight    NUMERIC NOT NULL,
  body_fat_pct  NUMERIC,
  neck_cm       NUMERIC,
  waist_cm      NUMERIC,
  hip_cm        NUMERIC,
  logged_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE body_metrics ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='body_metrics' AND policyname='owner_all'
  ) THEN
    CREATE POLICY owner_all ON body_metrics
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_bm_user ON body_metrics(user_id, logged_at DESC);

-- ── 3. custom_exercises ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS custom_exercises (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  muscle_group  TEXT NOT NULL,
  equipment     TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE custom_exercises ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='custom_exercises' AND policyname='owner_all'
  ) THEN
    CREATE POLICY owner_all ON custom_exercises
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_ce_user ON custom_exercises(user_id);

-- ── 4. workouts — add session_note ───────────────────────────
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS session_note TEXT;

-- ── 5. workout_exercises — add note ──────────────────────────
ALTER TABLE workout_exercises ADD COLUMN IF NOT EXISTS note TEXT;

-- ── 6. runs — add route_name and heart_rate_avg ──────────────
ALTER TABLE runs ADD COLUMN IF NOT EXISTS route_name     TEXT;
ALTER TABLE runs ADD COLUMN IF NOT EXISTS heart_rate_avg INTEGER;

-- ============================================================
-- Done. All new tables have RLS enabled and locked to owner.
-- ============================================================
