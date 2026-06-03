import { supabase } from "./supabase";

// ── Types ──────────────────────────────────────────────────────────────────

export interface WorkoutExerciseRow {
  workout_id: string;
  exercise_name: string;
  sets_json: Array<{ weight: number; reps: number; done: boolean }>;
  note?: string;
  completed_at: string; // from joined workouts
}

export interface PersonalRecord {
  id: string;
  user_id: string;
  exercise_name: string;
  weight: number;
  reps: number;
  estimated_1rm: number;
  achieved_at: string;
}

export interface BodyMetric {
  id: string;
  user_id: string;
  bodyweight: number;
  body_fat_pct?: number | null;
  neck_cm?: number | null;
  waist_cm?: number | null;
  hip_cm?: number | null;
  logged_at: string;
}

export interface CustomExercise {
  id: string;
  user_id: string;
  name: string;
  muscle_group: string;
  equipment: string;
}

export interface Run {
  id: string;
  user_id: string;
  distance_miles: number;
  duration_seconds: number;
  ran_at: string;
  notes: string;
  route_name?: string;
  heart_rate_avg?: number | null;
  target_pace_sec_per_mile?: number | null;
}

// ── Workout helpers ────────────────────────────────────────────────────────

export async function dbLoadWorkoutsWithExercises(userId: string): Promise<WorkoutExerciseRow[]> {
  const { data } = await supabase
    .from("workouts")
    .select(`id, completed_at, workout_exercises(exercise_name, sets_json, note)`)
    .eq("user_id", userId)
    .order("completed_at", { ascending: false })
    .limit(200);

  if (!data) return [];
  const rows: WorkoutExerciseRow[] = [];
  for (const w of data) {
    const exes = (w as Record<string, unknown>).workout_exercises as Array<{
      exercise_name: string; sets_json: unknown; note?: string;
    }> | undefined;
    if (!exes) continue;
    for (const ex of exes) {
      rows.push({
        workout_id: w.id as string,
        exercise_name: ex.exercise_name,
        sets_json: (ex.sets_json as WorkoutExerciseRow["sets_json"]) || [],
        note: ex.note,
        completed_at: w.completed_at as string,
      });
    }
  }
  return rows;
}

// ── Personal Records ───────────────────────────────────────────────────────

export async function dbLoadPRs(userId: string): Promise<PersonalRecord[]> {
  const { data } = await supabase
    .from("personal_records")
    .select("*")
    .eq("user_id", userId)
    .order("achieved_at", { ascending: false });
  return (data || []) as PersonalRecord[];
}

export async function dbSavePR(
  userId: string,
  exerciseName: string,
  weight: number,
  reps: number,
): Promise<void> {
  const est1rm = weight * (1 + reps / 30);
  await supabase.from("personal_records").insert({
    user_id: userId,
    exercise_name: exerciseName,
    weight,
    reps,
    estimated_1rm: est1rm,
  });
}

export async function dbGetBestPR(
  userId: string,
  exerciseName: string,
): Promise<PersonalRecord | null> {
  const { data } = await supabase
    .from("personal_records")
    .select("*")
    .eq("user_id", userId)
    .eq("exercise_name", exerciseName)
    .order("estimated_1rm", { ascending: false })
    .limit(1);
  return data?.[0] as PersonalRecord | null;
}

// ── Body Metrics ───────────────────────────────────────────────────────────

export async function dbLoadBodyMetrics(userId: string): Promise<BodyMetric[]> {
  const { data } = await supabase
    .from("body_metrics")
    .select("*")
    .eq("user_id", userId)
    .order("logged_at", { ascending: false })
    .limit(100);
  return (data || []) as BodyMetric[];
}

export async function dbSaveBodyMetric(
  userId: string,
  bodyweight: number,
  opts?: {
    body_fat_pct?: number;
    neck_cm?: number;
    waist_cm?: number;
    hip_cm?: number;
  },
): Promise<void> {
  await supabase.from("body_metrics").insert({
    user_id: userId,
    bodyweight,
    ...opts,
  });
}

// ── Custom Exercises ───────────────────────────────────────────────────────

export async function dbLoadCustomExercises(userId: string): Promise<CustomExercise[]> {
  const { data } = await supabase
    .from("custom_exercises")
    .select("*")
    .eq("user_id", userId)
    .order("name");
  return (data || []) as CustomExercise[];
}

export async function dbSaveCustomExercise(
  userId: string,
  name: string,
  muscle_group: string,
  equipment: string,
): Promise<CustomExercise | null> {
  const { data } = await supabase
    .from("custom_exercises")
    .insert({ user_id: userId, name, muscle_group, equipment })
    .select()
    .single();
  return data as CustomExercise | null;
}

// ── Enhanced Runs ──────────────────────────────────────────────────────────

export async function dbSaveRunFull(
  userId: string,
  distanceMiles: number,
  durationSeconds: number,
  notes: string,
  routeName?: string,
  heartRateAvg?: number,
): Promise<void> {
  await supabase.from("runs").insert({
    user_id: userId,
    distance_miles: distanceMiles,
    duration_seconds: durationSeconds,
    notes,
    route_name: routeName || null,
    heart_rate_avg: heartRateAvg || null,
  });
}

export async function dbUpdateRun(
  runId: string,
  fields: Partial<Pick<Run, "distance_miles" | "duration_seconds" | "notes" | "route_name" | "heart_rate_avg" | "ran_at">>,
): Promise<void> {
  await supabase.from("runs").update(fields).eq("id", runId);
}

export async function dbDeleteRun(runId: string): Promise<void> {
  await supabase.from("runs").delete().eq("id", runId);
}

export async function dbLoadRunsFull(userId: string): Promise<Run[]> {
  const { data } = await supabase
    .from("runs")
    .select("*")
    .eq("user_id", userId)
    .order("ran_at", { ascending: false })
    .limit(200);
  return (data || []) as Run[];
}

// ── Workout notes ──────────────────────────────────────────────────────────

export async function dbSaveWorkoutNote(workoutId: string, note: string): Promise<void> {
  await supabase.from("workouts").update({ session_note: note }).eq("id", workoutId);
}

// ── User Routines ──────────────────────────────────────────────────────────

export interface UserRoutineRow {
  id: string;
  user_id: string;
  routine_id: string;
  name: string;
  emoji: string | null;
  tag: string | null;
  duration: string | null;
  sort_order: number | null;
}

export interface UserRoutineExerciseRow {
  id: string;
  user_id: string;
  user_routine_id: string;
  exercise_id: string | null;
  name: string;
  sets: number | null;
  reps: string | null;
  sort_order: number | null;
}

export interface SeedRoutineInput {
  routine_id: string;
  name: string;
  emoji: string;
  tag: string;
  duration: string;
  exercises: Array<{ exercise_id?: string; name: string; sets: number; reps: string }>;
}

export async function dbLoadUserRoutines(userId: string): Promise<{
  routines: UserRoutineRow[];
  exercises: UserRoutineExerciseRow[];
}> {
  const [routinesRes, exsRes] = await Promise.all([
    supabase.from("user_routines").select("*").eq("user_id", userId).order("sort_order", { ascending: true }),
    supabase.from("user_routine_exercises").select("*").eq("user_id", userId).order("sort_order", { ascending: true }),
  ]);
  return {
    routines: (routinesRes.data as UserRoutineRow[]) || [],
    exercises: (exsRes.data as UserRoutineExerciseRow[]) || [],
  };
}

export async function dbSeedUserRoutines(
  userId: string,
  defaults: SeedRoutineInput[],
): Promise<{ routines: UserRoutineRow[]; exercises: UserRoutineExerciseRow[] }> {
  const inserted: UserRoutineRow[] = [];
  const insertedExs: UserRoutineExerciseRow[] = [];
  for (let i = 0; i < defaults.length; i++) {
    const r = defaults[i];
    const { data: routine } = await supabase
      .from("user_routines")
      .insert({
        user_id: userId,
        routine_id: r.routine_id,
        name: r.name,
        emoji: r.emoji,
        tag: r.tag,
        duration: r.duration,
        sort_order: i,
      })
      .select()
      .single();
    if (!routine) continue;
    inserted.push(routine as UserRoutineRow);
    const exRows = r.exercises.map((ex, j) => ({
      user_id: userId,
      user_routine_id: (routine as UserRoutineRow).id,
      exercise_id: ex.exercise_id || null,
      name: ex.name,
      sets: ex.sets,
      reps: ex.reps,
      sort_order: j,
    }));
    if (exRows.length) {
      const { data: exs } = await supabase.from("user_routine_exercises").insert(exRows).select();
      if (exs) insertedExs.push(...(exs as UserRoutineExerciseRow[]));
    }
  }
  return { routines: inserted, exercises: insertedExs };
}

export async function dbUpdateUserRoutine(
  routineDbId: string,
  fields: Partial<Pick<UserRoutineRow, "name" | "emoji" | "tag" | "duration" | "sort_order">>,
): Promise<void> {
  await supabase
    .from("user_routines")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", routineDbId);
}

export async function dbInsertUserRoutineExercise(
  userId: string,
  userRoutineId: string,
  ex: { exercise_id?: string; name: string; sets: number; reps: string; sort_order: number },
): Promise<UserRoutineExerciseRow | null> {
  const { data } = await supabase
    .from("user_routine_exercises")
    .insert({
      user_id: userId,
      user_routine_id: userRoutineId,
      exercise_id: ex.exercise_id || null,
      name: ex.name,
      sets: ex.sets,
      reps: ex.reps,
      sort_order: ex.sort_order,
    })
    .select()
    .single();
  return data as UserRoutineExerciseRow | null;
}

export async function dbUpdateUserRoutineExercise(
  exerciseDbId: string,
  fields: Partial<Pick<UserRoutineExerciseRow, "name" | "sets" | "reps" | "sort_order">>,
): Promise<void> {
  await supabase.from("user_routine_exercises").update(fields).eq("id", exerciseDbId);
}

export async function dbDeleteUserRoutineExercise(exerciseDbId: string): Promise<void> {
  await supabase.from("user_routine_exercises").delete().eq("id", exerciseDbId);
}

export async function dbReorderUserRoutineExercises(updates: Array<{ id: string; sort_order: number }>): Promise<void> {
  await Promise.all(
    updates.map(u => supabase.from("user_routine_exercises").update({ sort_order: u.sort_order }).eq("id", u.id))
  );
}

// ── Workout sets (per-set rows) ────────────────────────────────────────────

export interface WorkoutSetDetail {
  workout_id: string;
  exercise_name: string;
  set_number: number;
  weight: number;
  reps: number;
  done: boolean;
}

export async function dbLoadWorkoutSetsForWorkout(workoutId: string): Promise<WorkoutSetDetail[]> {
  const { data } = await supabase
    .from("workout_exercises")
    .select("exercise_name, sets_json")
    .eq("workout_id", workoutId);
  if (!data) return [];
  const rows: WorkoutSetDetail[] = [];
  for (const w of data) {
    const sets = ((w as { sets_json: unknown }).sets_json || []) as Array<{ weight: number; reps: number; done: boolean }>;
    sets.forEach((s, idx) => {
      rows.push({
        workout_id: workoutId,
        exercise_name: (w as { exercise_name: string }).exercise_name,
        set_number: idx + 1,
        weight: s.weight,
        reps: s.reps,
        done: s.done,
      });
    });
  }
  return rows;
}

// ── Epley 1RM ──────────────────────────────────────────────────────────────

export function epley1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}
