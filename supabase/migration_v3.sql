-- ============================================================
-- Fitty – migration v3 (user routines)
-- Run this in the Supabase SQL Editor (wedsktvyzprxumrorjhf)
-- ============================================================

-- ── user_routines ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_routines (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  routine_id  TEXT NOT NULL,
  name        TEXT NOT NULL,
  emoji       TEXT,
  tag         TEXT,
  duration    TEXT,
  sort_order  INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE user_routines ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_routines' AND policyname='owner_all') THEN
    CREATE POLICY owner_all ON user_routines FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_user_routines_user ON user_routines(user_id, sort_order);

-- ── user_routine_exercises ────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_routine_exercises (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_routine_id UUID NOT NULL REFERENCES user_routines(id) ON DELETE CASCADE,
  exercise_id     TEXT,
  name            TEXT NOT NULL,
  sets            INTEGER,
  reps            TEXT,
  sort_order      INTEGER,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE user_routine_exercises ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_routine_exercises' AND policyname='owner_all') THEN
    CREATE POLICY owner_all ON user_routine_exercises FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_user_routine_exercises_routine ON user_routine_exercises(user_routine_id, sort_order);

-- ============================================================
-- Done.
-- ============================================================
