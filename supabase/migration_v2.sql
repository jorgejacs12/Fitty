-- ============================================================
-- Fitty – migration v2
-- Run this in the Supabase SQL Editor (wedsktvyzprxumrorjhf)
-- ============================================================

-- ── profiles table (upsert-safe) ─────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id                         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  weekly_goal                INTEGER NOT NULL DEFAULT 3,
  longest_streak             INTEGER NOT NULL DEFAULT 0,
  run_target_pace_seconds    INTEGER NOT NULL DEFAULT 540,
  weekly_run_goal_miles      DECIMAL(5,1) NOT NULL DEFAULT 10.0,
  rest_timer_compound        INTEGER NOT NULL DEFAULT 180,
  rest_timer_isolation       INTEGER NOT NULL DEFAULT 90,
  theme_preference           TEXT NOT NULL DEFAULT 'violet',
  bodyweight_lbs             DECIMAL(5,1),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='owner_all') THEN
    CREATE POLICY owner_all ON profiles FOR ALL USING (auth.uid()=id) WITH CHECK (auth.uid()=id);
  END IF;
END $$;

-- ── stretch_logs ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stretch_logs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date                DATE NOT NULL DEFAULT CURRENT_DATE,
  workout_id          UUID,
  type                TEXT,
  stretches_completed TEXT[],
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE stretch_logs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='stretch_logs' AND policyname='owner_all') THEN
    CREATE POLICY owner_all ON stretch_logs FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
  END IF;
END $$;

-- ── programs ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS programs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  subtitle       TEXT,
  duration_days  INTEGER,
  is_active      BOOLEAN NOT NULL DEFAULT false,
  start_date     DATE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='programs' AND policyname='owner_all') THEN
    CREATE POLICY owner_all ON programs FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
  END IF;
END $$;

-- ── program_days ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS program_days (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id     UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  day_number     INTEGER NOT NULL,
  original_date  TEXT,
  title          TEXT,
  notes          TEXT,
  is_pending     BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE program_days ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='program_days' AND policyname='owner_all') THEN
    CREATE POLICY owner_all ON program_days FOR ALL
      USING ((SELECT user_id FROM programs WHERE id=program_id)=auth.uid())
      WITH CHECK ((SELECT user_id FROM programs WHERE id=program_id)=auth.uid());
  END IF;
END $$;

-- ── program_blocks ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS program_blocks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_day_id   UUID NOT NULL REFERENCES program_days(id) ON DELETE CASCADE,
  block_label      TEXT,
  block_name       TEXT,
  block_type       TEXT,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE program_blocks ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='program_blocks' AND policyname='owner_all') THEN
    CREATE POLICY owner_all ON program_blocks FOR ALL
      USING ((SELECT p.user_id FROM programs p JOIN program_days pd ON pd.program_id=p.id WHERE pd.id=program_day_id)=auth.uid())
      WITH CHECK ((SELECT p.user_id FROM programs p JOIN program_days pd ON pd.program_id=p.id WHERE pd.id=program_day_id)=auth.uid());
  END IF;
END $$;

-- ── program_exercises ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS program_exercises (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_block_id     UUID NOT NULL REFERENCES program_blocks(id) ON DELETE CASCADE,
  exercise_name        TEXT NOT NULL,
  sets                 INTEGER,
  reps                 TEXT,
  rest_seconds         INTEGER,
  intensity_note       TEXT,
  form_note            TEXT,
  tempo_note           TEXT,
  is_amrap             BOOLEAN NOT NULL DEFAULT false,
  amrap_window_seconds INTEGER,
  sort_order           INTEGER NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE program_exercises ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='program_exercises' AND policyname='owner_all') THEN
    CREATE POLICY owner_all ON program_exercises FOR ALL
      USING (
        (SELECT p.user_id FROM programs p
          JOIN program_days pd ON pd.program_id=p.id
          JOIN program_blocks pb ON pb.program_day_id=pd.id
          WHERE pb.id=program_block_id)=auth.uid()
      )
      WITH CHECK (
        (SELECT p.user_id FROM programs p
          JOIN program_days pd ON pd.program_id=p.id
          JOIN program_blocks pb ON pb.program_day_id=pd.id
          WHERE pb.id=program_block_id)=auth.uid()
      );
  END IF;
END $$;

-- ── program_day_logs ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS program_day_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id      UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  program_day_id  UUID NOT NULL REFERENCES program_days(id) ON DELETE CASCADE,
  completed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE program_day_logs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='program_day_logs' AND policyname='owner_all') THEN
    CREATE POLICY owner_all ON program_day_logs FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
  END IF;
END $$;

-- ── Indexes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_programs_user ON programs(user_id);
CREATE INDEX IF NOT EXISTS idx_program_days_program ON program_days(program_id, day_number);
CREATE INDEX IF NOT EXISTS idx_program_day_logs_user ON program_day_logs(user_id, program_id);

-- ============================================================
-- Done.
-- ============================================================
