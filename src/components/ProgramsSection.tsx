import { useState, useEffect, useRef, type JSX } from "react";
import { supabase } from "../lib/supabase";

// ── Design tokens ─────────────────────────────────────────────────────────
const FONT = `"Nunito","Google Sans","Helvetica Neue",sans-serif`;
const M = {
  primary: "#4F378B", onPrimary: "#FFFFFF",
  primaryContainer: "#EADDFF", onPrimaryContainer: "#21005D",
  secondaryContainer: "#E8DEF8", onSecondaryContainer: "#1D192B",
  tertiaryContainer: "#FFD8E4", onTertiaryContainer: "#31111D",
  surface: "#FFFBFE", surfaceContainer: "#F3EDF7",
  surfaceContainerHigh: "#ECE6F0", surfaceContainerHighest: "#E6E0EB",
  onSurface: "#1C1B1F", onSurfaceVariant: "#49454F",
  outline: "#79747E", outlineVariant: "#CAC4D0",
  greenContainer: "#C5EFAA", onGreenContainer: "#072100",
  error: "#B3261E", errorContainer: "#F9DEDC",
};

// ── Type definitions ───────────────────────────────────────────────────────
export interface ProgramDay {
  id: string; dayNumber: number; originalDate: string; title: string; notes?: string;
  isPending: boolean;
}
export interface ProgramBlock {
  id: string; label: string; name?: string; type: string; sortOrder: number;
  theme?: string;
}
export interface ProgramExercise {
  id: string; blockId: string; exerciseName: string;
  sets?: number; reps?: string; restSeconds?: number;
  intensityNote?: string; formNote?: string; tempoNote?: string;
  isAmrap: boolean; amrapWindowSeconds?: number; sortOrder: number;
}
interface ActiveProgram {
  id: string; name: string; subtitle: string; durationDays: number;
  completedDayIds: string[];
}

// ── Seed data types ────────────────────────────────────────────────────────
interface SeedExercise {
  exerciseName: string; sets?: number; reps?: string; restSeconds?: number;
  intensityNote?: string; formNote?: string; tempoNote?: string;
  isAmrap?: boolean; amrapWindowSeconds?: number; sortOrder: number;
}
interface SeedBlock {
  label: string; name?: string; type: string; sortOrder: number; theme?: string;
  exercises: SeedExercise[];
}
interface SeedDay {
  dayNumber: number; originalDate: string; title: string; notes?: string;
  isPending?: boolean; blocks: SeedBlock[];
}

// ── Full seed data for SquatCtober ─────────────────────────────────────────
const SQUATCTOBER_DAYS: SeedDay[] = [
  {
    dayNumber: 1, originalDate: "Oct 1 2025", title: "Max Testing Day",
    blocks: [
      {
        label: "WARMUP", name: undefined, type: "warmup", sortOrder: 0, theme: undefined,
        exercises: [
          { exerciseName: "Crack the Knuckles and hit some trunk twists. It's go time!!", isAmrap: false, sortOrder: 0, intensityNote: "Warmup note" },
        ],
      },
      {
        label: "MAX TESTING", name: "Record 1-rep maxes", type: "maxtest", sortOrder: 1, theme: undefined,
        exercises: [
          { exerciseName: "Back Squat", sets: 1, reps: "1", isAmrap: false, sortOrder: 0 },
          { exerciseName: "Bench Press", sets: 1, reps: "1", isAmrap: false, sortOrder: 1 },
          { exerciseName: "Deadlift", sets: 1, reps: "1", isAmrap: false, sortOrder: 2 },
        ],
      },
      {
        label: "BLOCK A", type: "main", sortOrder: 2,
        exercises: [
          { exerciseName: "Back Squat", sets: 5, reps: "6,5,4,3,8", restSeconds: 150, isAmrap: false, sortOrder: 0 },
        ],
      },
      {
        label: "BLOCK B", type: "main", sortOrder: 3,
        exercises: [
          { exerciseName: "Barbell Bench Press", sets: 5, reps: "3", restSeconds: 75, isAmrap: false, sortOrder: 0 },
        ],
      },
      {
        label: "BLOCK C", type: "main", sortOrder: 4,
        exercises: [
          { exerciseName: "Chin-Up", sets: 8, reps: "3", restSeconds: 60, isAmrap: false, sortOrder: 0, formNote: "SLOW AND STRICT. 1–3 reps. Full Range of Motion." },
        ],
      },
      {
        label: "CARDIO BLOCK", type: "cardio", sortOrder: 5, theme: "Hamstrings and Horseshoes",
        exercises: [],
      },
      {
        label: "BLOCK D", type: "cardio", sortOrder: 6,
        exercises: [
          { exerciseName: "DB Romanian Deadlift", sets: 5, reps: "10", isAmrap: false, sortOrder: 0, intensityNote: "LIGHT" },
        ],
      },
      {
        label: "BLOCK E", type: "cardio", sortOrder: 7,
        exercises: [
          { exerciseName: "Barbell Skull Crusher", sets: 5, reps: "20", restSeconds: 90, isAmrap: false, sortOrder: 0, formNote: "BB or EZ Bar" },
        ],
      },
    ],
  },
  {
    dayNumber: 2, originalDate: "Oct 2 2025", title: "Deadlift & Split Squat",
    blocks: [
      {
        label: "BLOCK A", type: "main", sortOrder: 0,
        exercises: [
          { exerciseName: "DB Bulgarian Split Squat", sets: 3, reps: "5", restSeconds: 120, isAmrap: false, sortOrder: 0, intensityNote: "Medium intensity, nothing too heavy" },
        ],
      },
      {
        label: "BLOCK B", type: "main", sortOrder: 1,
        exercises: [
          { exerciseName: "Deadlift", sets: 5, reps: "3", restSeconds: 90, isAmrap: false, sortOrder: 0, formNote: "Start each rep from dead stop. NO BOUNCING." },
        ],
      },
      {
        label: "BLOCK C", type: "main", sortOrder: 2,
        exercises: [
          { exerciseName: "Back Squat", sets: 1, reps: "20", isAmrap: false, sortOrder: 0, intensityNote: "Use 40–45% of max. Perform unbroken — no rest or pauses at the top." },
        ],
      },
      {
        label: "CARDIO BLOCK", type: "cardio", sortOrder: 3,
        exercises: [],
      },
      {
        label: "BLOCK D", type: "cardio", sortOrder: 4,
        exercises: [
          { exerciseName: "Barbell Overhead Press", sets: 5, reps: "10", restSeconds: 90, isAmrap: false, sortOrder: 0, intensityNote: "Seated or standing" },
        ],
      },
      {
        label: "RECOVERY", type: "recovery", sortOrder: 5,
        exercises: [
          { exerciseName: "Meatloaf, green beans, mashed potatoes. Get out and walk 30–40 minutes. Sleep to grow strong.", isAmrap: false, sortOrder: 0 },
        ],
      },
    ],
  },
  {
    dayNumber: 3, originalDate: "Oct 3 2025", title: "Cluster Sets",
    blocks: [
      {
        label: "BLOCK A", type: "cluster", sortOrder: 0,
        exercises: [
          { exerciseName: "Back Squat", sets: 2, reps: "5→rest 30s→5→rest 30s→5", restSeconds: 150, isAmrap: false, sortOrder: 0, formNote: "Cluster set: 5 reps → rest 30s → 5 reps → rest 30s → 5 reps" },
        ],
      },
      {
        label: "BLOCK B", type: "cluster", sortOrder: 1,
        exercises: [
          { exerciseName: "Barbell Bench Press", sets: 2, reps: "2→rest 20s→2→rest 20s→2", restSeconds: 150, isAmrap: false, sortOrder: 0, formNote: "Cluster set: 2 reps → rest 20s → 2 reps → rest 20s → 2 reps" },
        ],
      },
      {
        label: "SECTION", type: "section", sortOrder: 2, theme: "Pumped in the POLO",
        exercises: [],
      },
      {
        label: "BLOCK C", type: "pump", sortOrder: 3,
        exercises: [
          { exerciseName: "Band Tricep Pushdown", sets: 6, reps: "20", isAmrap: false, sortOrder: 0 },
        ],
      },
      {
        label: "BLOCK E", type: "pump", sortOrder: 4,
        exercises: [
          { exerciseName: "Barbell Curl", sets: 6, reps: "20", isAmrap: false, sortOrder: 0 },
        ],
      },
      {
        label: "CARDIO BLOCK", type: "cardio", sortOrder: 5, theme: "Bodyweight Bulgarians",
        exercises: [],
      },
      {
        label: "BLOCK D", type: "cardio", sortOrder: 6,
        exercises: [
          { exerciseName: "Bulgarian Split Squat", sets: 5, reps: "5", isAmrap: false, sortOrder: 0, tempoNote: "5 second eccentric, 5 second concentric" },
        ],
      },
      {
        label: "RECOVERY", type: "recovery", sortOrder: 7,
        exercises: [
          { exerciseName: "Extra meaty hot chili. Side of corn bread. 30–40 min walk. 8–9 hours of sleep.", isAmrap: false, sortOrder: 0 },
        ],
      },
    ],
  },
  {
    dayNumber: 4, originalDate: "Oct 6 2025", title: "Front Squat Day",
    blocks: [
      {
        label: "WARMUP", type: "warmup", sortOrder: 0,
        exercises: [
          { exerciseName: "5 jumping jacks. 5 push-ups. Repeat as needed.", isAmrap: false, sortOrder: 0 },
        ],
      },
      {
        label: "BLOCK A", type: "main", sortOrder: 1,
        exercises: [
          { exerciseName: "Back Squat", sets: 1, reps: "10", isAmrap: false, sortOrder: 0 },
        ],
      },
      {
        label: "BLOCK B", type: "main", sortOrder: 2,
        exercises: [
          { exerciseName: "Front Squat", sets: 5, reps: "5", restSeconds: 120, isAmrap: false, sortOrder: 0, intensityNote: "Use ~45–50% of back squat max" },
        ],
      },
      {
        label: "BLOCK C", type: "superset", sortOrder: 3,
        exercises: [
          { exerciseName: "Barbell Bench Press", sets: 3, reps: "10", restSeconds: 150, isAmrap: false, sortOrder: 0 },
          { exerciseName: "DB Romanian Deadlift", sets: 3, reps: "10", restSeconds: 150, isAmrap: false, sortOrder: 1 },
        ],
      },
      {
        label: "BLOCK D", type: "superset", sortOrder: 4,
        exercises: [
          { exerciseName: "Seated Dumbbell Overhead Press", sets: 2, reps: "10", restSeconds: 90, isAmrap: false, sortOrder: 0 },
          { exerciseName: "Single Arm Dumbbell Row", sets: 2, reps: "5", restSeconds: 90, isAmrap: false, sortOrder: 1 },
        ],
      },
      {
        label: "CARDIO BLOCK", type: "cardio", sortOrder: 5,
        exercises: [],
      },
      {
        label: "BLOCK E", type: "cardio", sortOrder: 6,
        exercises: [
          { exerciseName: "KB Swings", sets: 10, reps: "10", restSeconds: 60, isAmrap: false, sortOrder: 0 },
        ],
      },
    ],
  },
  {
    dayNumber: 5, originalDate: "Oct 7 2025", title: "AMRAP Squats",
    blocks: [
      {
        label: "WARMUP", type: "warmup", sortOrder: 0,
        exercises: [
          { exerciseName: "Back Squat", sets: 3, reps: "5,3,2", isAmrap: false, sortOrder: 0, intensityNote: "Warm-up sets" },
        ],
      },
      {
        label: "BLOCK A", type: "amrap", sortOrder: 1,
        exercises: [
          { exerciseName: "Back Squat", reps: "2", isAmrap: true, amrapWindowSeconds: 600, sortOrder: 0, formNote: "As many sets of 2 as possible in 10 minutes. Record total sets completed." },
        ],
      },
      {
        label: "BLOCK B", type: "main", sortOrder: 2,
        exercises: [
          { exerciseName: "Snatch Grip Deadlift", sets: 5, reps: "5", restSeconds: 120, isAmrap: false, sortOrder: 0, intensityNote: "Use 50–60% of deadlift max.", formNote: "NO BOUNCING." },
        ],
      },
      {
        label: "CARDIO BLOCK", type: "cardio", sortOrder: 3,
        exercises: [],
      },
      {
        label: "BLOCK C", type: "cardio", sortOrder: 4,
        exercises: [
          { exerciseName: "Suitcase / Waiter Carry", sets: 6, reps: "30 yards", restSeconds: 90, isAmrap: false, sortOrder: 0, formNote: "Alternate arm position each set" },
        ],
      },
    ],
  },
  {
    dayNumber: 6, originalDate: "Oct 8 2025", title: "Zercher Day",
    blocks: [
      {
        label: "WARMUP", type: "warmup", sortOrder: 0,
        exercises: [
          { exerciseName: "Back Squat", sets: 2, reps: "10", restSeconds: 120, isAmrap: false, sortOrder: 0 },
        ],
      },
      {
        label: "BLOCK A", type: "main", sortOrder: 1,
        exercises: [
          { exerciseName: "Zercher Squat", sets: 4, reps: "5", isAmrap: false, sortOrder: 0, intensityNote: "Stay light to medium. Learn the exercise. Track weight used." },
        ],
      },
      {
        label: "BLOCK B", type: "main", sortOrder: 2,
        exercises: [
          { exerciseName: "Front Squat", sets: 3, reps: "5", restSeconds: 120, isAmrap: false, sortOrder: 0, intensityNote: "Use 45–50% of back squat max" },
        ],
      },
      {
        label: "CARDIO BLOCK", type: "cardio", sortOrder: 3, theme: "Bodyweight Bulgarians",
        exercises: [],
      },
      {
        label: "BLOCK C", type: "cardio", sortOrder: 4,
        exercises: [
          { exerciseName: "Bulgarian Split Squat", sets: 3, reps: "10", restSeconds: 120, isAmrap: false, sortOrder: 0, tempoNote: "3 seconds down, 3 seconds up" },
        ],
      },
    ],
  },
  {
    dayNumber: 7, originalDate: "Oct 9 2025", title: "Farmer's Walk + Big 3",
    blocks: [
      {
        label: "BLOCK A", type: "main", sortOrder: 0,
        exercises: [
          { exerciseName: "Farmer's Walk", sets: 5, reps: "40 yards", restSeconds: 90, isAmrap: false, sortOrder: 0, intensityNote: "Go heavier each set" },
        ],
      },
      {
        label: "BLOCK B", type: "superset", sortOrder: 1,
        exercises: [
          { exerciseName: "Back Squat", sets: 5, reps: "5", restSeconds: 120, isAmrap: false, sortOrder: 0 },
          { exerciseName: "Barbell Bench Press", sets: 5, reps: "5", restSeconds: 120, isAmrap: false, sortOrder: 1 },
        ],
      },
      {
        label: "BLOCK C", type: "main", sortOrder: 2,
        exercises: [
          { exerciseName: "Standing Barbell Shoulder Press", sets: 5, reps: "5", isAmrap: false, sortOrder: 0 },
        ],
      },
      {
        label: "CARDIO BLOCK", type: "cardio", sortOrder: 3,
        exercises: [],
      },
      {
        label: "BLOCK D", type: "superset", sortOrder: 4,
        exercises: [
          { exerciseName: "Barbell Curl", sets: 5, reps: "5", restSeconds: 120, isAmrap: false, sortOrder: 0, intensityNote: "HEAVY" },
          { exerciseName: "Farmer's Carry", sets: 5, reps: "40 yards", restSeconds: 120, isAmrap: false, sortOrder: 1 },
        ],
      },
    ],
  },
  {
    dayNumber: 8, originalDate: "Oct 14 2025", title: "Coming Soon", isPending: true,
    blocks: [],
  },
  {
    dayNumber: 9, originalDate: "Oct 10 2025", title: "3s and 1s",
    blocks: [
      {
        label: "BLOCK A", type: "main", sortOrder: 0,
        exercises: [
          { exerciseName: "Back Squat", sets: 6, reps: "3,1,3,1,3,1", restSeconds: 150, isAmrap: false, sortOrder: 0 },
        ],
      },
      {
        label: "BLOCK B", type: "main", sortOrder: 1,
        exercises: [
          { exerciseName: "Front Squat", sets: 4, reps: "4,2,4,2", restSeconds: 120, isAmrap: false, sortOrder: 0, intensityNote: "Percentage taken from back squat max" },
        ],
      },
    ],
  },
  {
    dayNumber: 10, originalDate: "Oct 13 2025", title: "Volume Day",
    blocks: [
      {
        label: "WARMUP", type: "warmup", sortOrder: 0,
        exercises: [
          { exerciseName: "KB Swings", sets: 1, reps: "10", isAmrap: false, sortOrder: 0, intensityNote: "Light to medium" },
        ],
      },
      {
        label: "BLOCK A", type: "main", sortOrder: 1,
        exercises: [
          { exerciseName: "Back Squat", sets: 8, reps: "10,10,7,7,5,5,3,3", restSeconds: 120, isAmrap: false, sortOrder: 0 },
        ],
      },
      {
        label: "BLOCK B", type: "main", sortOrder: 2,
        exercises: [
          { exerciseName: "Barbell Bench Press", sets: 6, reps: "5,5,5,5,10,10", restSeconds: 120, isAmrap: false, sortOrder: 0 },
        ],
      },
      {
        label: "BLOCK C", type: "main", sortOrder: 3,
        exercises: [
          { exerciseName: "Deadlift", sets: 4, reps: "4,4,2,2", restSeconds: 120, isAmrap: false, sortOrder: 0 },
        ],
      },
      {
        label: "CARDIO BLOCK", type: "cardio", sortOrder: 4,
        exercises: [],
      },
      {
        label: "BLOCK D", type: "cardio", sortOrder: 5,
        exercises: [
          { exerciseName: "DB Shrugs", sets: 5, reps: "20", restSeconds: 60, isAmrap: false, sortOrder: 0 },
        ],
      },
    ],
  },
  {
    dayNumber: 11, originalDate: "Oct 15 2025", title: "AMRAP + RDL",
    blocks: [
      {
        label: "WARMUP", type: "warmup", sortOrder: 0,
        exercises: [
          { exerciseName: "Back Squat", sets: 3, reps: "5,3,2", isAmrap: false, sortOrder: 0 },
        ],
      },
      {
        label: "BLOCK A", type: "amrap", sortOrder: 1,
        exercises: [
          { exerciseName: "Back Squat", reps: "2", isAmrap: true, amrapWindowSeconds: 600, sortOrder: 0, formNote: "Same format as Day 5. Record total sets completed." },
        ],
      },
      {
        label: "BLOCK B", type: "superset", sortOrder: 2,
        exercises: [
          { exerciseName: "Romanian Deadlift", sets: 4, reps: "8", isAmrap: false, sortOrder: 0, intensityNote: "LIGHT" },
          { exerciseName: "DB Shrugs", sets: 4, reps: "10", isAmrap: false, sortOrder: 1, intensityNote: "HEAVY" },
        ],
      },
      {
        label: "CARDIO BLOCK", type: "cardio", sortOrder: 3,
        exercises: [],
      },
      {
        label: "AMRAP FINISHER", type: "amrap", sortOrder: 4,
        exercises: [
          { exerciseName: "DB Reverse Lunge", reps: "5", isAmrap: true, amrapWindowSeconds: 300, sortOrder: 0, intensityNote: "Use 5–15% of bodyweight in each hand" },
        ],
      },
    ],
  },
  {
    dayNumber: 12, originalDate: "Oct 16 2025", title: "Triple Superset Day",
    blocks: [
      {
        label: "BLOCK A", type: "main", sortOrder: 0,
        exercises: [
          { exerciseName: "Farmer's Carry", sets: 3, reps: "40 yards", isAmrap: false, sortOrder: 0, intensityNote: "DB or KB" },
        ],
      },
      {
        label: "BLOCK B", type: "triplesuperset", sortOrder: 1,
        exercises: [
          { exerciseName: "Barbell Bulgarian Split Squat", sets: 3, reps: "5", isAmrap: false, sortOrder: 0 },
          { exerciseName: "DB Rear Lateral Raise", sets: 3, reps: "10", isAmrap: false, sortOrder: 1 },
          { exerciseName: "DB Shrugs", sets: 3, reps: "10", isAmrap: false, sortOrder: 2 },
        ],
      },
      {
        label: "BLOCK C", type: "triplesuperset", sortOrder: 2,
        exercises: [
          { exerciseName: "Front Squat", sets: 3, reps: "5", isAmrap: false, sortOrder: 0, intensityNote: "50–55% of back squat max" },
          { exerciseName: "DB Incline Press", sets: 3, reps: "10", isAmrap: false, sortOrder: 1 },
          { exerciseName: "DB Lateral Raises", sets: 3, reps: "10", isAmrap: false, sortOrder: 2 },
        ],
      },
      {
        label: "BLOCK D", type: "triplesuperset", sortOrder: 3,
        exercises: [
          { exerciseName: "Back Squat", sets: 3, reps: "5", isAmrap: false, sortOrder: 0 },
          { exerciseName: "Tempo Push-Ups", sets: 3, reps: "10", isAmrap: false, sortOrder: 1, tempoNote: "5s eccentric, 5s concentric" },
          { exerciseName: "KB Swings", sets: 3, reps: "10", isAmrap: false, sortOrder: 2 },
        ],
      },
    ],
  },
  {
    dayNumber: 13, originalDate: "Oct 17 2025", title: "Cluster + CGBP",
    blocks: [
      {
        label: "BLOCK A", type: "main", sortOrder: 0,
        exercises: [
          { exerciseName: "Back Squat", sets: 3, reps: "2", isAmrap: false, sortOrder: 0 },
        ],
      },
      {
        label: "BLOCK B", type: "main", sortOrder: 1,
        exercises: [
          { exerciseName: "Back Squat", sets: 3, reps: "2,3,4", isAmrap: false, sortOrder: 0 },
        ],
      },
      {
        label: "CARDIO BLOCK", type: "cardio", sortOrder: 2,
        exercises: [],
      },
      {
        label: "BLOCK C", type: "cardio", sortOrder: 3,
        exercises: [
          { exerciseName: "Close Grip Bench Press", sets: 10, reps: "10", isAmrap: false, sortOrder: 0, intensityNote: "Use 40% of bench max" },
        ],
      },
    ],
  },
  {
    dayNumber: 14, originalDate: "Oct 20 2025", title: "Superset Day",
    blocks: [
      {
        label: "WARMUP", type: "warmup", sortOrder: 0,
        exercises: [
          { exerciseName: "KB Swings", sets: 4, reps: "10", isAmrap: false, sortOrder: 0 },
          { exerciseName: "Tempo Push-Ups", sets: 4, reps: "5", isAmrap: false, sortOrder: 1, tempoNote: "3s down, 3s up" },
        ],
      },
      {
        label: "BLOCK A", type: "superset", sortOrder: 1,
        exercises: [
          { exerciseName: "Back Squat", sets: 4, reps: "5", isAmrap: false, sortOrder: 0 },
          { exerciseName: "Chin-Up", sets: 4, reps: "5", isAmrap: false, sortOrder: 1, formNote: "Slow and strict. 3–5 reps." },
        ],
      },
      {
        label: "BLOCK B", type: "superset", sortOrder: 2,
        exercises: [
          { exerciseName: "Barbell Bench Press", sets: 5, reps: "4", isAmrap: false, sortOrder: 0 },
          { exerciseName: "DB Romanian Deadlift", sets: 5, reps: "5", isAmrap: false, sortOrder: 1 },
        ],
      },
      {
        label: "BLOCK C", type: "superset", sortOrder: 3,
        exercises: [
          { exerciseName: "Deadlift", sets: 4, reps: "4", isAmrap: false, sortOrder: 0 },
          { exerciseName: "DB Shrugs", sets: 4, reps: "10", isAmrap: false, sortOrder: 1 },
        ],
      },
      {
        label: "CARDIO BLOCK", type: "cardio", sortOrder: 4,
        exercises: [],
      },
      {
        label: "BLOCK D", type: "triplesuperset", sortOrder: 5,
        exercises: [
          { exerciseName: "Tricep Push-Up", sets: 3, reps: "20", isAmrap: false, sortOrder: 0 },
          { exerciseName: "Med Ball Close Grip Push-Up", sets: 3, reps: "5", isAmrap: false, sortOrder: 1, tempoNote: "3s down, 3s up" },
          { exerciseName: "Barbell 21's", sets: 3, reps: "21", isAmrap: false, sortOrder: 2 },
        ],
      },
    ],
  },
  {
    dayNumber: 15, originalDate: "Oct 21 2025", title: "Zercher + Bent Row",
    blocks: [
      {
        label: "WARMUP", type: "warmup", sortOrder: 0,
        exercises: [
          { exerciseName: "Farmer's Carry", sets: 3, reps: "40 yards", isAmrap: false, sortOrder: 0, intensityNote: "Heavier each set" },
        ],
      },
      {
        label: "BLOCK A", type: "main", sortOrder: 1,
        exercises: [
          { exerciseName: "Back Squat", sets: 3, reps: "4,3,2", isAmrap: false, sortOrder: 0 },
        ],
      },
      {
        label: "BLOCK B", type: "main", sortOrder: 2,
        exercises: [
          { exerciseName: "Back Squat", sets: 2, reps: "5", isAmrap: false, sortOrder: 0 },
        ],
      },
      {
        label: "BLOCK C", type: "main", sortOrder: 3,
        exercises: [
          { exerciseName: "Zercher Squat", sets: 3, reps: "5", isAmrap: false, sortOrder: 0, intensityNote: "Increase weight each set. Last set should be tough!" },
        ],
      },
      {
        label: "CARDIO BLOCK", type: "cardio", sortOrder: 4,
        exercises: [],
      },
      {
        label: "BLOCK D", type: "cardio", sortOrder: 5,
        exercises: [
          { exerciseName: "Bent Over Row", sets: 8, reps: "8", isAmrap: false, sortOrder: 0, formNote: "Great display of form." },
        ],
      },
    ],
  },
  {
    dayNumber: 16, originalDate: "Oct 22 2025", title: "Pause Squats + Bench Ladder",
    blocks: [
      {
        label: "BLOCK A", type: "main", sortOrder: 0,
        exercises: [
          { exerciseName: "Back Squat", sets: 6, reps: "5,4,3,2,2,2", isAmrap: false, sortOrder: 0, formNote: "2 second pause in the deep bottom position" },
        ],
      },
      {
        label: "BLOCK B", type: "main", sortOrder: 1,
        exercises: [
          { exerciseName: "Barbell Bench Press", sets: 10, reps: "10,10,7,7,5,5,3,3,1,1", isAmrap: false, sortOrder: 0 },
        ],
      },
      {
        label: "CARDIO BLOCK", type: "cardio", sortOrder: 2,
        exercises: [],
      },
      {
        label: "BLOCK C", type: "amrap", sortOrder: 3,
        exercises: [
          { exerciseName: "5-Minute Conditioning Finisher — choose your movement. Record what you did.", isAmrap: true, amrapWindowSeconds: 300, sortOrder: 0 },
        ],
      },
    ],
  },
  {
    dayNumber: 17, originalDate: "Oct 23 2025", title: "Coming Soon", isPending: true,
    blocks: [],
  },
  {
    dayNumber: 18, originalDate: "Oct 24 2025", title: "Shoulder Boulder Day",
    blocks: [
      {
        label: "WARMUP", type: "warmup", sortOrder: 0,
        exercises: [
          { exerciseName: "Back Squat", sets: 3, reps: "5", isAmrap: false, sortOrder: 0 },
        ],
      },
      {
        label: "BLOCK A", type: "superset", sortOrder: 1,
        exercises: [
          { exerciseName: "Dumbbell Bench Press", sets: 5, reps: "10,5,5,5,10", isAmrap: false, sortOrder: 0 },
          { exerciseName: "Single Arm Dumbbell Row", sets: 5, reps: "5", isAmrap: false, sortOrder: 1 },
        ],
      },
      {
        label: "BLOCK B", type: "triplesuperset", sortOrder: 2, theme: "Shoulder Like Boulders",
        exercises: [
          { exerciseName: "Seated DB Arnold Press", sets: 3, reps: "10", isAmrap: false, sortOrder: 0 },
          { exerciseName: "DB Lateral Raise", sets: 3, reps: "10", isAmrap: false, sortOrder: 1 },
          { exerciseName: "DB Shrugs", sets: 3, reps: "10", isAmrap: false, sortOrder: 2 },
        ],
      },
      {
        label: "BLOCK C", type: "triplesuperset", sortOrder: 3, theme: "Feeling Stacked and Jacked",
        exercises: [
          { exerciseName: "Tempo Push-Ups", sets: 4, reps: "8-10", isAmrap: false, sortOrder: 0, tempoNote: "3s down, 3s up" },
          { exerciseName: "Heavy Alternating DB Bicep Curl", sets: 4, reps: "5 each arm", isAmrap: false, sortOrder: 1 },
          { exerciseName: "Cable Tricep Pushdown", sets: 4, reps: "10", isAmrap: false, sortOrder: 2 },
        ],
      },
    ],
  },
  {
    dayNumber: 19, originalDate: "Oct 27 2025", title: "Peak + AMAP",
    blocks: [
      {
        label: "WARMUP", type: "warmup", sortOrder: 0,
        exercises: [
          { exerciseName: "KB Swings", sets: 4, reps: "10", isAmrap: false, sortOrder: 0 },
        ],
      },
      {
        label: "BLOCK A", type: "main", sortOrder: 1,
        exercises: [
          { exerciseName: "Back Squat", sets: 6, reps: "5,3,2,1,1,AMAP", isAmrap: false, sortOrder: 0, intensityNote: "Final set is as many reps as possible" },
        ],
      },
      {
        label: "BLOCK B", type: "main", sortOrder: 2,
        exercises: [
          { exerciseName: "Barbell Bench Press", sets: 4, reps: "3", isAmrap: false, sortOrder: 0 },
        ],
      },
      {
        label: "BLOCK C", type: "main", sortOrder: 3,
        exercises: [
          { exerciseName: "Bent Over Row", sets: 3, reps: "5", isAmrap: false, sortOrder: 0, intensityNote: "HEAVY" },
        ],
      },
      {
        label: "CARDIO BLOCK", type: "cardio", sortOrder: 4,
        exercises: [],
      },
      {
        label: "BLOCK D", type: "cardio", sortOrder: 5,
        exercises: [
          { exerciseName: "Barbell Skull Crusher", sets: 3, reps: "10", isAmrap: false, sortOrder: 0 },
        ],
      },
    ],
  },
  {
    dayNumber: 20, originalDate: "Oct 28 2025", title: "Snappy Squats",
    blocks: [
      {
        label: "WARMUP", type: "warmup", sortOrder: 0,
        exercises: [
          { exerciseName: "DB Farmer's Walk", sets: 4, reps: "20 yards", isAmrap: false, sortOrder: 0 },
        ],
      },
      {
        label: "BLOCK A", type: "main", sortOrder: 1,
        exercises: [
          { exerciseName: "Back Squat", sets: 5, reps: "3", isAmrap: false, sortOrder: 0, intensityNote: "Move weight fast and snappy" },
        ],
      },
      {
        label: "BLOCK B", type: "main", sortOrder: 2,
        exercises: [
          { exerciseName: "Snatch Grip Deadlift", sets: 4, reps: "4", isAmrap: false, sortOrder: 0, intensityNote: "Aim for 50–60% of deadlift max" },
        ],
      },
      {
        label: "BLOCK C", type: "main", sortOrder: 3,
        exercises: [
          { exerciseName: "Barbell Overhead Press", sets: 3, reps: "5", isAmrap: false, sortOrder: 0 },
        ],
      },
      {
        label: "CARDIO BLOCK", type: "cardio", sortOrder: 4,
        exercises: [],
      },
      {
        label: "BLOCK D", type: "superset", sortOrder: 5,
        exercises: [
          { exerciseName: "DB Concentration Curls", sets: 3, reps: "10", isAmrap: false, sortOrder: 0 },
          { exerciseName: "DB Shrugs", sets: 3, reps: "10", isAmrap: false, sortOrder: 1 },
        ],
      },
    ],
  },
  {
    dayNumber: 21, originalDate: "Oct 29 2025", title: "Incline + Chin",
    blocks: [
      {
        label: "WARMUP", type: "warmup", sortOrder: 0,
        exercises: [
          { exerciseName: "KB Swings", sets: 4, reps: "10", isAmrap: false, sortOrder: 0 },
        ],
      },
      {
        label: "BLOCK A", type: "main", sortOrder: 1,
        exercises: [
          { exerciseName: "Back Squat", sets: 3, reps: "5", isAmrap: false, sortOrder: 0 },
        ],
      },
      {
        label: "BLOCK B", type: "main", sortOrder: 2,
        exercises: [
          { exerciseName: "DB Incline Press", sets: 5, reps: "5,5,5,5,10", isAmrap: false, sortOrder: 0 },
        ],
      },
      {
        label: "BLOCK C", type: "main", sortOrder: 3,
        exercises: [
          { exerciseName: "Chin-Up", sets: 4, reps: "5", isAmrap: false, sortOrder: 0, formNote: "2–5 reps. Slow and strict. Add weight if needed." },
        ],
      },
    ],
  },
  {
    dayNumber: 22, originalDate: "Oct 30 2025", title: "Peak Squat Day",
    blocks: [
      {
        label: "MAIN", type: "main", sortOrder: 0,
        exercises: [
          { exerciseName: "Back Squat", sets: 10, reps: "5,3,1,1,1,1,1,1,1,1", isAmrap: false, sortOrder: 0, intensityNote: "GO UNTIL YOU CAN'T COMPLETE A MAX!!! DOMINATE!!!!" },
        ],
      },
    ],
  },
  {
    dayNumber: 23, originalDate: "Oct 31 2025", title: "Grand Finale",
    blocks: [
      {
        label: "WARMUP", type: "warmup", sortOrder: 0,
        exercises: [
          { exerciseName: "5 jumping jacks. 3 claps. Big Ric Flair WOO.", isAmrap: false, sortOrder: 0 },
        ],
      },
      {
        label: "BLOCK A", type: "main", sortOrder: 1,
        exercises: [
          { exerciseName: "Back Squat", sets: 2, reps: "10", isAmrap: false, sortOrder: 0 },
        ],
      },
      {
        label: "BLOCK B", type: "superset", sortOrder: 2,
        exercises: [
          { exerciseName: "Close Grip Bench Press", sets: 10, reps: "10", isAmrap: false, sortOrder: 0 },
          { exerciseName: "KB Swings", sets: 10, reps: "10", isAmrap: false, sortOrder: 1 },
        ],
      },
      {
        label: "BLOCK C", type: "superset", sortOrder: 3,
        exercises: [
          { exerciseName: "Chin-Up", sets: 4, reps: "5", isAmrap: false, sortOrder: 0, formNote: "Slow and strict. 2–5 reps." },
          { exerciseName: "DB Pullovers", sets: 4, reps: "5", isAmrap: false, sortOrder: 1 },
        ],
      },
      {
        label: "CARDIO BLOCK", type: "cardio", sortOrder: 4,
        exercises: [],
      },
      {
        label: "BLOCK D", type: "cardio", sortOrder: 5,
        exercises: [
          { exerciseName: "Barbell Curl", sets: 10, reps: "10", isAmrap: false, sortOrder: 0 },
        ],
      },
    ],
  },
];

// ── Seed function ──────────────────────────────────────────────────────────
async function seedSquatctober(userId: string): Promise<void> {
  const { data: existing } = await supabase
    .from("programs")
    .select("id")
    .eq("user_id", userId)
    .eq("name", "SquatCtober in April")
    .limit(1);

  if (existing && existing.length > 0) return;

  const programId = crypto.randomUUID();
  const { error: progErr } = await supabase.from("programs").insert({
    id: programId,
    user_id: userId,
    name: "SquatCtober in April",
    subtitle: "Original program: October 2025",
    duration_days: 23,
    is_active: true,
  });
  if (progErr) { console.error("seed program error:", progErr); return; }

  for (const day of SQUATCTOBER_DAYS) {
    const dayId = crypto.randomUUID();
    const { error: dayErr } = await supabase.from("program_days").insert({
      id: dayId,
      program_id: programId,
      day_number: day.dayNumber,
      original_date: day.originalDate,
      title: day.title,
      notes: day.notes ?? null,
      is_pending: day.isPending ?? false,
    });
    if (dayErr) { console.error("seed day error:", dayErr); continue; }

    for (const block of day.blocks) {
      const blockId = crypto.randomUUID();
      const { error: blockErr } = await supabase.from("program_blocks").insert({
        id: blockId,
        day_id: dayId,
        label: block.label,
        name: block.name ?? null,
        type: block.type,
        sort_order: block.sortOrder,
        theme: block.theme ?? null,
      });
      if (blockErr) { console.error("seed block error:", blockErr); continue; }

      for (const ex of block.exercises) {
        const { error: exErr } = await supabase.from("program_exercises").insert({
          id: crypto.randomUUID(),
          block_id: blockId,
          exercise_name: ex.exerciseName,
          sets: ex.sets ?? null,
          reps: ex.reps ?? null,
          rest_seconds: ex.restSeconds ?? null,
          intensity_note: ex.intensityNote ?? null,
          form_note: ex.formNote ?? null,
          tempo_note: ex.tempoNote ?? null,
          is_amrap: ex.isAmrap ?? false,
          amrap_window_seconds: ex.amrapWindowSeconds ?? null,
          sort_order: ex.sortOrder,
        });
        if (exErr) console.error("seed exercise error:", exErr);
      }
    }
  }
}

// ── AMRAP Timer component ──────────────────────────────────────────────────
function AmrapTimer({ windowSeconds, label }: { windowSeconds: number; label: string }): JSX.Element {
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(windowSeconds);
  const [done, setDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const radius = 52;
  const circ = 2 * Math.PI * radius;

  useEffect(() => {
    if (running && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setRunning(false);
            setDone(true);
            if (navigator.vibrate) navigator.vibrate([300, 100, 300]);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const progress = remaining / windowSeconds;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const timeStr = `${mins}:${secs.toString().padStart(2, "0")}`;

  const handleStart = () => { setDone(false); setRemaining(windowSeconds); setRunning(true); };
  const handleStop = () => { clearInterval(intervalRef.current!); setRunning(false); };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "16px 0" }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: M.onSurfaceVariant, fontFamily: FONT, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
      <div style={{ position: "relative", width: 140, height: 140 }}>
        <svg width={140} height={140} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={70} cy={70} r={radius} fill="none" stroke={M.surfaceContainerHighest} strokeWidth={10} />
          <circle
            cx={70} cy={70} r={radius}
            fill="none"
            stroke={done ? M.greenContainer : running ? M.primary : M.primaryContainer}
            strokeWidth={10}
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - progress)}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          {done
            ? <div style={{ fontSize: 14, fontWeight: 900, color: M.onGreenContainer, fontFamily: FONT, textAlign: "center" }}>Time's<br />up!</div>
            : <div style={{ fontSize: 28, fontWeight: 900, color: M.onSurface, fontFamily: FONT }}>{timeStr}</div>
          }
        </div>
      </div>
      {!running && !done &&
        <button onClick={handleStart} style={{ padding: "10px 28px", borderRadius: 20, background: M.primary, color: M.onPrimary, border: "none", fontSize: 14, fontWeight: 700, fontFamily: FONT, cursor: "pointer" }}>
          Start AMRAP
        </button>
      }
      {running &&
        <button onClick={handleStop} style={{ padding: "10px 28px", borderRadius: 20, background: M.errorContainer, color: M.error, border: "none", fontSize: 14, fontWeight: 700, fontFamily: FONT, cursor: "pointer" }}>
          Stop
        </button>
      }
      {done &&
        <button onClick={handleStart} style={{ padding: "10px 28px", borderRadius: 20, background: M.primaryContainer, color: M.onPrimaryContainer, border: "none", fontSize: 14, fontWeight: 700, fontFamily: FONT, cursor: "pointer" }}>
          Restart
        </button>
      }
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────
function blockBg(type: string): string {
  if (type === "warmup") return M.tertiaryContainer;
  if (type === "recovery") return M.tertiaryContainer;
  if (type === "amrap") return M.secondaryContainer;
  return M.surfaceContainerHigh;
}
function blockFg(type: string): string {
  if (type === "warmup" || type === "recovery") return M.onTertiaryContainer;
  if (type === "amrap") return M.onSecondaryContainer;
  return M.onSurface;
}
function isGroupedBlock(type: string): boolean {
  return type === "superset" || type === "triplesuperset";
}

// ── Day Detail view ────────────────────────────────────────────────────────
function DayDetail({
  day, blocks, exercises, onBack, onStart,
}: {
  day: ProgramDay;
  blocks: ProgramBlock[];
  exercises: ProgramExercise[];
  onBack: () => void;
  onStart: () => void;
}): JSX.Element {
  const exByBlock = (blockId: string): ProgramExercise[] =>
    exercises.filter(e => e.blockId === blockId).sort((a, b) => a.sortOrder - b.sortOrder);

  const sortedBlocks = [...blocks].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px 8px", flexShrink: 0 }}>
        <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: "50%", background: M.surfaceContainerHighest, border: "none", fontSize: 18, color: M.onSurfaceVariant, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          ←
        </button>
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, color: M.onSurface, fontFamily: FONT }}>
            Day {day.dayNumber}
          </div>
          <div style={{ fontSize: 13, color: M.onSurfaceVariant, fontFamily: FONT }}>{day.originalDate}</div>
        </div>
      </div>
      <div style={{ padding: "4px 20px 12px", flexShrink: 0 }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: M.primary, fontFamily: FONT }}>{day.title}</div>
      </div>

      {/* Scrollable blocks */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 16px", minHeight: 0, maxHeight: "calc(90dvh - 240px)" }}>
        {sortedBlocks.map(block => {
          const exs = exByBlock(block.id);
          const bg = blockBg(block.type);
          const fg = blockFg(block.type);
          const grouped = isGroupedBlock(block.type);

          // Section headers (cardio block, section) with no exercises — just a divider
          if ((block.type === "cardio" || block.type === "section") && exs.length === 0) {
            return (
              <div key={block.id} style={{ margin: "14px 0 6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ flex: 1, height: 1, background: M.outlineVariant }} />
                  <div style={{ fontSize: 11, fontWeight: 800, color: M.onSurfaceVariant, fontFamily: FONT, textTransform: "uppercase", letterSpacing: 1.5 }}>
                    {block.theme ?? block.label}
                  </div>
                  <div style={{ flex: 1, height: 1, background: M.outlineVariant }} />
                </div>
              </div>
            );
          }

          return (
            <div key={block.id} style={{ marginBottom: 12 }}>
              {/* Block header */}
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: M.onSurfaceVariant, fontFamily: FONT, textTransform: "uppercase", letterSpacing: 1.5 }}>{block.label}</span>
                {block.theme && (
                  <span style={{ fontSize: 12, fontWeight: 700, color: M.primary, fontFamily: FONT }}>{block.theme}</span>
                )}
                {block.type === "superset" && (
                  <span style={{ fontSize: 11, color: M.onSurfaceVariant, fontFamily: FONT, fontStyle: "italic" }}>superset</span>
                )}
                {block.type === "triplesuperset" && (
                  <span style={{ fontSize: 11, color: M.onSurfaceVariant, fontFamily: FONT, fontStyle: "italic" }}>triple superset</span>
                )}
              </div>

              {/* AMRAP timer block */}
              {block.type === "amrap" && exs.length > 0 && exs[0].isAmrap && exs[0].amrapWindowSeconds ? (
                <div style={{ background: bg, borderRadius: 16, padding: "12px 16px", marginBottom: 4 }}>
                  <AmrapTimer
                    windowSeconds={exs[0].amrapWindowSeconds}
                    label={`${exs[0].exerciseName}${exs[0].reps ? ` · ${exs[0].reps} reps/set` : ""}`}
                  />
                  {exs[0].formNote && (
                    <div style={{ fontSize: 12, color: fg, fontFamily: FONT, textAlign: "center", marginTop: 4, fontStyle: "italic" }}>{exs[0].formNote}</div>
                  )}
                </div>
              ) : (
                /* Regular card */
                <div style={{
                  background: bg,
                  borderRadius: 16,
                  overflow: "hidden",
                  ...(grouped ? { borderLeft: `4px solid ${M.primary}` } : {}),
                }}>
                  {exs.map((ex, i) => (
                    <div key={ex.id} style={{
                      padding: "10px 16px",
                      borderBottom: i < exs.length - 1 ? `1px solid ${M.outlineVariant}` : "none",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: fg, fontFamily: FONT, flex: 1 }}>{ex.exerciseName}</div>
                        {(ex.sets || ex.reps) && (
                          <div style={{ fontSize: 13, fontWeight: 600, color: M.primary, fontFamily: FONT, whiteSpace: "nowrap" }}>
                            {ex.sets && ex.reps ? `${ex.sets}×${ex.reps}` : ex.sets ? `${ex.sets} sets` : ex.reps ? ex.reps : ""}
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 10px", marginTop: ex.intensityNote || ex.formNote || ex.tempoNote || ex.restSeconds ? 4 : 0 }}>
                        {ex.restSeconds && (
                          <span style={{ fontSize: 11, color: M.onSurfaceVariant, fontFamily: FONT }}>Rest: {ex.restSeconds}s</span>
                        )}
                        {ex.intensityNote && (
                          <span style={{ fontSize: 11, color: M.onSurfaceVariant, fontFamily: FONT, fontStyle: "italic" }}>{ex.intensityNote}</span>
                        )}
                        {ex.formNote && (
                          <span style={{ fontSize: 11, color: M.onSurfaceVariant, fontFamily: FONT, fontStyle: "italic" }}>{ex.formNote}</span>
                        )}
                        {ex.tempoNote && (
                          <span style={{ fontSize: 11, color: M.onSurfaceVariant, fontFamily: FONT }}>Tempo: {ex.tempoNote}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        <div style={{ height: 100 }} />
      </div>

      {/* Start button */}
      <div style={{ padding: "12px 20px 24px", flexShrink: 0, background: M.surface }}>
        <button
          onClick={onStart}
          style={{ width: "100%", padding: "16px 0", borderRadius: 20, background: M.primary, color: M.onPrimary, border: "none", fontSize: 16, fontWeight: 900, fontFamily: FONT, cursor: "pointer", letterSpacing: 0.5 }}
        >
          Start This Workout
        </button>
      </div>
    </div>
  );
}

// ── Full program list view ─────────────────────────────────────────────────
function ProgramList({
  days, completedIds, onSelectDay, onBack,
}: {
  days: ProgramDay[];
  completedIds: string[];
  onSelectDay: (day: ProgramDay) => void;
  onBack: () => void;
}): JSX.Element {
  const sorted = [...days].sort((a, b) => a.dayNumber - b.dayNumber);
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px 12px", flexShrink: 0 }}>
        <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: "50%", background: M.surfaceContainerHighest, border: "none", fontSize: 18, color: M.onSurfaceVariant, cursor: "pointer" }}>
          ←
        </button>
        <div style={{ fontSize: 20, fontWeight: 900, color: M.onSurface, fontFamily: FONT }}>Full Program</div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 32px", maxHeight: "calc(90dvh - 80px)" }}>
        {sorted.map(day => {
          const isCompleted = completedIds.includes(day.id);
          const isPending = day.isPending;
          return (
            <div
              key={day.id}
              onClick={() => { if (!isPending) onSelectDay(day); }}
              style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "14px 16px",
                borderRadius: 16,
                marginBottom: 8,
                background: isPending ? M.surfaceContainerHighest : isCompleted ? M.greenContainer : M.surfaceContainerHigh,
                opacity: isPending ? 0.5 : 1,
                cursor: isPending ? "default" : "pointer",
                transition: "opacity 0.2s",
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                background: isCompleted ? "#2E7D32" : isPending ? M.outlineVariant : M.primaryContainer,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: isCompleted ? 16 : 13,
                fontWeight: 900,
                color: isCompleted ? "#fff" : isPending ? M.onSurfaceVariant : M.onPrimaryContainer,
                fontFamily: FONT,
              }}>
                {isCompleted ? "✓" : day.dayNumber}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: isCompleted ? M.onGreenContainer : isPending ? M.onSurfaceVariant : M.onSurface, fontFamily: FONT }}>
                  {day.title}
                </div>
                <div style={{ fontSize: 12, color: isCompleted ? M.onGreenContainer : M.onSurfaceVariant, fontFamily: FONT }}>
                  {day.originalDate}
                </div>
              </div>
              {isCompleted && (
                <div style={{ fontSize: 11, fontWeight: 700, color: M.onGreenContainer, fontFamily: FONT }}>Done</div>
              )}
              {isPending && (
                <div style={{ fontSize: 11, fontWeight: 700, color: M.onSurfaceVariant, fontFamily: FONT }}>Coming Soon</div>
              )}
              {!isCompleted && !isPending && (
                <div style={{ fontSize: 16, color: M.onSurfaceVariant }}>›</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Props ──────────────────────────────────────────────────────────────────
interface Props {
  userId: string;
  onStartProgramDay: (day: ProgramDay, blocks: ProgramBlock[], exercises: ProgramExercise[], programId: string) => void;
}

// ── Main component ─────────────────────────────────────────────────────────
export function ProgramsSection({ userId, onStartProgramDay }: Props): JSX.Element {
  const [program, setProgram] = useState<ActiveProgram | null>(null);
  const [days, setDays] = useState<ProgramDay[]>([]);
  const [loading, setLoading] = useState(true);

  // Sheet state: null = closed, "list" = full list, "detail" = day detail
  const [sheetView, setSheetView] = useState<"list" | "detail" | null>(null);
  const [selectedDay, setSelectedDay] = useState<ProgramDay | null>(null);
  const [detailBlocks, setDetailBlocks] = useState<ProgramBlock[]>([]);
  const [detailExercises, setDetailExercises] = useState<ProgramExercise[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Load program data
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await seedSquatctober(userId);
        if (cancelled) return;

        const { data: progRows } = await supabase
          .from("programs")
          .select("id, name, subtitle, duration_days")
          .eq("user_id", userId)
          .eq("is_active", true)
          .limit(1);

        const prog = progRows?.[0] ?? null;
        if (!prog || cancelled) { setLoading(false); return; }

        const { data: rawDays } = await supabase
          .from("program_days")
          .select("id, day_number, original_date, title, notes, is_pending")
          .eq("program_id", prog.id)
          .order("day_number", { ascending: true });

        const { data: logs } = await supabase
          .from("program_day_logs")
          .select("day_id")
          .eq("program_id", prog.id)
          .eq("user_id", userId);

        if (cancelled) return;

        const completedDayIds = (logs ?? []).map((l: { day_id: string }) => l.day_id);

        const mappedDays: ProgramDay[] = (rawDays ?? []).map((d: {
          id: string; day_number: number; original_date: string;
          title: string; notes?: string; is_pending: boolean;
        }) => ({
          id: d.id,
          dayNumber: d.day_number,
          originalDate: d.original_date,
          title: d.title,
          notes: d.notes,
          isPending: d.is_pending,
        }));

        setDays(mappedDays);
        setProgram({ id: prog.id, name: prog.name, subtitle: prog.subtitle, durationDays: prog.duration_days, completedDayIds });
      } catch (e) {
        console.error("ProgramsSection load error:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  // Load blocks + exercises for a day
  const loadDayDetail = async (day: ProgramDay) => {
    setLoadingDetail(true);
    setSelectedDay(day);
    setSheetView("detail");

    const { data: rawBlocks } = await supabase
      .from("program_blocks")
      .select("id, label, name, type, sort_order, theme")
      .eq("day_id", day.id)
      .order("sort_order", { ascending: true });

    const blockIds = (rawBlocks ?? []).map((b: { id: string }) => b.id);
    let rawExercises: Array<{
      id: string; block_id: string; exercise_name: string;
      sets?: number; reps?: string; rest_seconds?: number;
      intensity_note?: string; form_note?: string; tempo_note?: string;
      is_amrap: boolean; amrap_window_seconds?: number; sort_order: number;
    }> = [];

    if (blockIds.length > 0) {
      const { data } = await supabase
        .from("program_exercises")
        .select("id, block_id, exercise_name, sets, reps, rest_seconds, intensity_note, form_note, tempo_note, is_amrap, amrap_window_seconds, sort_order")
        .in("block_id", blockIds)
        .order("sort_order", { ascending: true });
      rawExercises = data ?? [];
    }

    const blocks: ProgramBlock[] = (rawBlocks ?? []).map((b: {
      id: string; label: string; name?: string; type: string; sort_order: number; theme?: string;
    }) => ({
      id: b.id, label: b.label, name: b.name, type: b.type, sortOrder: b.sort_order, theme: b.theme,
    }));

    const exercises: ProgramExercise[] = rawExercises.map(e => ({
      id: e.id, blockId: e.block_id, exerciseName: e.exercise_name,
      sets: e.sets, reps: e.reps, restSeconds: e.rest_seconds,
      intensityNote: e.intensity_note, formNote: e.form_note, tempoNote: e.tempo_note,
      isAmrap: e.is_amrap, amrapWindowSeconds: e.amrap_window_seconds, sortOrder: e.sort_order,
    }));

    setDetailBlocks(blocks);
    setDetailExercises(exercises);
    setLoadingDetail(false);
  };

  // Derived stats
  const availableDays = days.filter(d => !d.isPending);
  const completedCount = program ? program.completedDayIds.filter(id => availableDays.some(d => d.id === id)).length : 0;
  const totalAvailable = availableDays.length;
  const progressPct = totalAvailable > 0 ? Math.round((completedCount / totalAvailable) * 100) : 0;
  const allDone = completedCount >= totalAvailable && totalAvailable > 0;

  const nextDay = availableDays.find(d => program && !program.completedDayIds.includes(d.id)) ?? null;

  const handleTodayWorkout = () => {
    if (nextDay) loadDayDetail(nextDay);
  };

  const handleSelectDay = (day: ProgramDay) => {
    loadDayDetail(day);
  };

  const handleStartWorkout = () => {
    if (!selectedDay || !program) return;
    onStartProgramDay(selectedDay, detailBlocks, detailExercises, program.id);
    setSheetView(null);
  };

  if (loading) {
    return (
      <div style={{ padding: "20px 16px" }}>
        <div style={{ background: M.surfaceContainerHigh, borderRadius: 20, padding: "20px 16px", fontFamily: FONT, color: M.onSurfaceVariant, fontSize: 14 }}>
          Loading program...
        </div>
      </div>
    );
  }

  // ── Collapsed card (no active program) ──────────────────────────────────
  if (!program) {
    return (
      <div style={{ padding: "20px 16px" }}>
        <div style={{ background: M.surfaceContainerHigh, borderRadius: 20, padding: "20px 16px" }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: M.onSurface, fontFamily: FONT, marginBottom: 6 }}>No Active Program</div>
          <div style={{ fontSize: 14, color: M.onSurfaceVariant, fontFamily: FONT }}>No structured program is currently active.</div>
        </div>
      </div>
    );
  }

  // ── Expanded program card ──────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .m3b:active { filter: brightness(0.93); }
        .sheet-handle { width: 36px; height: 4px; border-radius: 2px; background: #CAC4D0; margin: 12px auto 4px; }
        .stagger { animation: slideUp 0.4s cubic-bezier(.34,1.3,.64,1) both; }
      `}</style>

      <div style={{ padding: "20px 16px" }}>
        <div style={{ background: M.surfaceContainerHigh, borderRadius: 24, padding: "20px 18px", boxShadow: "0 2px 12px rgba(79,55,139,.08)" }}>
          {/* Program name + subtitle */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: M.primary, fontFamily: FONT, lineHeight: 1.2 }}>{program.name}</div>
            <div style={{ fontSize: 13, color: M.onSurfaceVariant, fontFamily: FONT, marginTop: 2 }}>{program.subtitle}</div>
          </div>

          {/* All done badge */}
          {allDone && (
            <div style={{ background: M.greenContainer, borderRadius: 12, padding: "10px 14px", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 20 }}>🏆</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 900, color: M.onGreenContainer, fontFamily: FONT }}>Program Complete!</div>
                <div style={{ fontSize: 12, color: M.onGreenContainer, fontFamily: FONT }}>All {totalAvailable} available days finished.</div>
              </div>
            </div>
          )}

          {/* Progress */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: M.onSurface, fontFamily: FONT }}>
                Day {completedCount} of {totalAvailable} complete
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: M.primary, fontFamily: FONT }}>{progressPct}%</div>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: M.surfaceContainerHighest, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 4,
                background: allDone ? "#2E7D32" : M.primary,
                width: `${progressPct}%`,
                transition: "width 0.6s cubic-bezier(.34,1.3,.64,1)",
              }} />
            </div>
            <div style={{ fontSize: 11, color: M.onSurfaceVariant, fontFamily: FONT, marginTop: 4 }}>
              {days.filter(d => d.isPending).length} days coming soon · {program.durationDays} total
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              className="m3b"
              onClick={handleTodayWorkout}
              disabled={!nextDay}
              style={{
                flex: 1, padding: "13px 0", borderRadius: 18,
                background: nextDay ? M.primary : M.surfaceContainerHighest,
                color: nextDay ? M.onPrimary : M.onSurfaceVariant,
                border: "none", fontSize: 14, fontWeight: 900, fontFamily: FONT,
                cursor: nextDay ? "pointer" : "default",
              }}
            >
              {nextDay ? "Today's Workout" : "All Done!"}
            </button>
            <button
              className="m3b"
              onClick={() => setSheetView("list")}
              style={{
                flex: 1, padding: "13px 0", borderRadius: 18,
                background: M.primaryContainer, color: M.onPrimaryContainer,
                border: "none", fontSize: 14, fontWeight: 900, fontFamily: FONT, cursor: "pointer",
              }}
            >
              View Full Program
            </button>
          </div>
        </div>
      </div>

      {/* Bottom sheet */}
      {sheetView !== null && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(28,27,31,.55)", backdropFilter: "blur(6px)", zIndex: 600, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
          onClick={e => { if (e.target === e.currentTarget) setSheetView(null); }}
        >
          <div
            className="stagger"
            style={{ width: "100%", maxWidth: 480, background: M.surface, borderRadius: "28px 28px 0 0", maxHeight: "90dvh", display: "flex", flexDirection: "column", overflow: "hidden" }}
          >
            <div className="sheet-handle" />

            {/* Sheet content */}
            {sheetView === "list" && (
              <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <ProgramList
                  days={days}
                  completedIds={program.completedDayIds}
                  onSelectDay={handleSelectDay}
                  onBack={() => setSheetView(null)}
                />
              </div>
            )}

            {sheetView === "detail" && selectedDay && (
              <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 0 }}>
                {loadingDetail ? (
                  <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: M.onSurfaceVariant, fontFamily: FONT }}>
                    Loading workout...
                  </div>
                ) : (
                  <DayDetail
                    day={selectedDay}
                    blocks={detailBlocks}
                    exercises={detailExercises}
                    onBack={() => setSheetView("list")}
                    onStart={handleStartWorkout}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
