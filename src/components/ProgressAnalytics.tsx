import { useState, useMemo, useEffect, type JSX } from "react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import type { WorkoutExerciseRow, PersonalRecord } from "../lib/db";
import { epley1RM, dbLoadWorkoutSetsForWorkout } from "../lib/db";
import { TigerLogo } from "./TigerLogo";

interface WorkoutLog {
  id: string; routine_name: string; routine_emoji: string;
  completed_at: string; duration_seconds: number;
  total_sets: number; total_volume_kg: number; xp_earned: number;
}
interface Run { id: string; distance_miles: number; duration_seconds: number; ran_at: string; }

interface Props {
  logs: WorkoutLog[];
  runs: Run[];
  workoutExercises: WorkoutExerciseRow[];
  personalRecords: PersonalRecord[];
  userId: string;
}

const M = {
  primary: "var(--fp)", primaryContainer: "var(--fpc)", onPrimaryContainer: "var(--fopc)",
  secondary: "var(--fs)", secondaryContainer: "var(--fsc)", onSecondaryContainer: "var(--fosc)",
  tertiary: "var(--ft)", tertiaryContainer: "var(--ftc)", onTertiaryContainer: "var(--fotc)",
  background: "#FFFBFE", surface: "#FFFBFE",
  surfaceContainer: "#F3EDF7", surfaceContainerHigh: "#ECE6F0",
  surfaceContainerHighest: "#E6E0EB",
  onSurface: "#1C1B1F", onSurfaceVariant: "#49454F",
  outline: "#79747E", outlineVariant: "#CAC4D0",
  greenPrimary: "#386A20", greenContainer: "#C5EFAA", onGreenContainer: "#072100",
};
const FONT = `"Nunito","Google Sans","Helvetica Neue",sans-serif`;

function fmtDur(sec: number): string {
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  if (h > 0) return `${h}h ${m}m`; if (m > 0) return `${m}m ${s}s`; return `${s}s`;
}

function computeStreak(logs: WorkoutLog[], runs: Run[]): number {
  const days = new Set<string>();
  logs.forEach(w => days.add(w.completed_at.slice(0, 10)));
  runs.forEach(r => days.add(r.ran_at.slice(0, 10)));
  let streak = 0; const d = new Date();
  for (let i = 0; i < 365; i++) {
    const key = d.toISOString().slice(0, 10);
    if (days.has(key)) { streak++; d.setDate(d.getDate() - 1); } else break;
  }
  return streak;
}

// ── Recharts custom tooltip ───────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: Record<string, unknown>): JSX.Element | null {
  if (!(active as boolean) || !(payload as unknown[])?.length) return null;
  const p = (payload as Array<{ value: number }>)[0];
  return (
    <div style={{
      background: M.surface, border: `1px solid ${M.outlineVariant}`,
      borderRadius: 12, padding: "8px 14px",
      fontFamily: FONT, fontSize: 12, color: M.onSurface,
      boxShadow: "0 4px 16px rgba(0,0,0,.08)",
    }}>
      <div style={{ fontWeight: 700 }}>{label as string}</div>
      <div style={{ color: M.primary, fontWeight: 800 }}>{(p.value).toFixed(1)}</div>
    </div>
  );
}

// ── Heatmap calendar ──────────────────────────────────────────────────────
function HeatmapCalendar({ logs, runs }: { logs: WorkoutLog[]; runs: Run[] }): JSX.Element {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Build day→volume map for last 84 days (12 weeks)
  const dayData = useMemo(() => {
    const map: Record<string, { volume: number; type: string; emoji: string }> = {};
    logs.forEach(w => {
      const d = w.completed_at.slice(0, 10);
      map[d] = {
        volume: (map[d]?.volume || 0) + w.total_volume_kg,
        type: w.routine_name, emoji: w.routine_emoji,
      };
    });
    runs.forEach(r => {
      const d = r.ran_at.slice(0, 10);
      if (!map[d]) map[d] = { volume: r.distance_miles * 50, type: "Run", emoji: "🏃" };
    });
    return map;
  }, [logs, runs]);

  const maxVol = useMemo(() => {
    const vals = Object.values(dayData).map(d => d.volume);
    return Math.max(...vals, 1);
  }, [dayData]);

  const weeks: string[][] = useMemo(() => {
    const result: string[][] = [];
    const today = new Date();
    // Start 83 days ago (12 weeks back)
    const start = new Date(today);
    start.setDate(start.getDate() - 83);
    // Go back to Sunday
    start.setDate(start.getDate() - start.getDay());
    for (let w = 0; w < 13; w++) {
      const week: string[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(start);
        date.setDate(start.getDate() + w * 7 + d);
        week.push(date.toISOString().slice(0, 10));
      }
      result.push(week);
    }
    return result;
  }, []);

  const getColor = (vol: number) => {
    if (!vol) return M.surfaceContainerHighest;
    const intensity = Math.min(1, vol / maxVol);
    if (intensity < 0.25) return "#D4C8F5";
    if (intensity < 0.5) return "#B39DDB";
    if (intensity < 0.75) return "#7B5EA7";
    return M.primary;
  };

  const today = new Date().toISOString().slice(0, 10);
  const dayLabels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const sel = selectedDay ? dayData[selectedDay] : null;

  return (
    <div style={{ background: M.surfaceContainerHighest, borderRadius: 24, padding: "16px", marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: M.onSurfaceVariant, fontFamily: FONT, letterSpacing: ".8px", textTransform: "uppercase", marginBottom: 12 }}>
        Workout Frequency (12 Weeks)
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        {/* Day labels */}
        <div style={{ display: "flex", flexDirection: "column", gap: 3, marginRight: 2 }}>
          {dayLabels.map(l => (
            <div key={l} style={{ height: 11, display: "flex", alignItems: "center", fontSize: 10, color: M.onSurfaceVariant, fontFamily: FONT }}>{l}</div>
          ))}
        </div>
        {/* Grid */}
        <div style={{ display: "flex", gap: 3, flex: 1 }}>
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1 }}>
              {week.map(day => {
                const vol = dayData[day]?.volume || 0;
                const isToday = day === today;
                const isFuture = day > today;
                return (
                  <div
                    key={day}
                    onClick={() => !isFuture && setSelectedDay(selectedDay === day ? null : day)}
                    style={{
                      aspectRatio: "1",
                      borderRadius: 3,
                      background: isFuture ? M.surfaceContainer : getColor(vol),
                      border: isToday ? `1px solid ${M.primary}` : "1px solid transparent",
                      cursor: isFuture ? "default" : "pointer",
                      opacity: isFuture ? 0.3 : 1,
                      transition: "transform .15s",
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {/* Color legend */}
      <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 10 }}>
        <span style={{ fontSize: 10, color: M.onSurfaceVariant, fontFamily: FONT }}>Less</span>
        {["#E6E0EB", "#D4C8F5", "#B39DDB", "#7B5EA7", M.primary].map(c => (
          <div key={c} style={{ width: 10, height: 10, borderRadius: 2, background: c }} />
        ))}
        <span style={{ fontSize: 10, color: M.onSurfaceVariant, fontFamily: FONT }}>More</span>
      </div>
      {/* Selected day tooltip */}
      {selectedDay && (
        <div style={{
          marginTop: 10, background: M.primaryContainer, borderRadius: 14, padding: "10px 14px",
          animation: "scaleIn .3s cubic-bezier(.34,1.56,.64,1)",
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: M.onPrimaryContainer, fontFamily: FONT }}>
            {new Date(selectedDay + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </div>
          {sel ? (
            <div style={{ fontSize: 13, color: M.onPrimaryContainer, fontFamily: FONT, marginTop: 2 }}>
              {sel.emoji} {sel.type} · {(sel.volume).toFixed(0)} kg volume
            </div>
          ) : (
            <div style={{ fontSize: 13, color: M.onPrimaryContainer, fontFamily: FONT, marginTop: 2 }}>Rest day</div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Workout Detail View ──────────────────────────────────────────────────
function WorkoutDetailView({ workout, personalRecords, onBack }: { workout: WorkoutLog; personalRecords: PersonalRecord[]; onBack: () => void }): JSX.Element {
  const [sets, setSets] = useState<Array<{ exercise_name: string; set_number: number; weight: number; reps: number; done: boolean }> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    dbLoadWorkoutSetsForWorkout(workout.id).then(rows => {
      if (active) { setSets(rows); setLoading(false); }
    });
    return () => { active = false; };
  }, [workout.id]);

  const dateLabel = new Date(workout.completed_at).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const durMin = Math.round(workout.duration_seconds / 60);

  // Group sets by exercise (preserve insertion order)
  const grouped = useMemo(() => {
    if (!sets) return [];
    const byEx: Record<string, Array<{ set_number: number; weight: number; reps: number; done: boolean }>> = {};
    const order: string[] = [];
    sets.forEach(s => {
      if (!byEx[s.exercise_name]) { byEx[s.exercise_name] = []; order.push(s.exercise_name); }
      byEx[s.exercise_name].push({ set_number: s.set_number, weight: s.weight, reps: s.reps, done: s.done });
    });
    return order.map(name => ({ name, rows: byEx[name] }));
  }, [sets]);

  const totalSetsCompleted = sets ? sets.filter(s => s.done).length : 0;
  const totalSetsPlanned = sets ? sets.length : 0;

  // PR detection per (exercise, set) — naive: if a set's est1rm >= the PR row, mark medal
  const prByExercise = useMemo(() => {
    const m: Record<string, PersonalRecord> = {};
    personalRecords.forEach(pr => {
      const e = m[pr.exercise_name];
      if (!e || pr.estimated_1rm > e.estimated_1rm) m[pr.exercise_name] = pr;
    });
    return m;
  }, [personalRecords]);

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(28,27,31,.6)",
      backdropFilter: "blur(6px)", zIndex: 500,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }} onClick={e => { if (e.target === e.currentTarget) onBack(); }}>
      <div style={{
        width: "100%", maxWidth: 430, background: "#FFFFFF",
        borderRadius: "28px 28px 0 0", height: "95dvh", overflowY: "auto",
        animation: "slideUp .5s cubic-bezier(.34,1.56,.64,1)",
        fontFamily: FONT, color: "#1C1B1F",
      }}>
        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px 6px", position: "sticky", top: 0, background: "#FFFFFF", zIndex: 2 }}>
          <button onClick={onBack} className="m3b" style={{ background: M.surfaceContainerHighest, border: "none", borderRadius: 100, padding: "8px 14px", display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: M.onSurfaceVariant, fontFamily: FONT, cursor: "pointer" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><polyline points="15 18 9 12 15 6" /></svg>
            Back
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 6, opacity: .6 }}>
            <div style={{ width: 22, height: 22, borderRadius: 7, background: M.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <TigerLogo size={16} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 800, color: M.onSurface, fontFamily: FONT, letterSpacing: ".3px" }}>Fitty</span>
          </div>
        </div>

        {/* Header */}
        <div style={{ padding: "8px 20px 16px" }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#1C1B1F", fontFamily: FONT, letterSpacing: "-.4px", lineHeight: 1.15 }}>
            <span style={{ fontSize: 30, marginRight: 8 }}>{workout.routine_emoji}</span>{workout.routine_name}
          </div>
          <div style={{ fontSize: 13, color: "#49454F", fontFamily: FONT, marginTop: 4 }}>{dateLabel}</div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginTop: 14 }}>
            <div style={{ background: M.primaryContainer, borderRadius: 14, padding: "10px 12px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: M.onPrimaryContainer, opacity: .75, fontFamily: FONT, letterSpacing: ".5px", textTransform: "uppercase" }}>Duration</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: M.onPrimaryContainer, fontFamily: FONT, marginTop: 2 }}>{durMin} min</div>
            </div>
            <div style={{ background: M.secondaryContainer, borderRadius: 14, padding: "10px 12px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: M.onSecondaryContainer, opacity: .75, fontFamily: FONT, letterSpacing: ".5px", textTransform: "uppercase" }}>Volume</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: M.onSecondaryContainer, fontFamily: FONT, marginTop: 2 }}>{Math.round(workout.total_volume_kg).toLocaleString()}<span style={{ fontSize: 11, marginLeft: 3, opacity: .7 }}>lbs</span></div>
            </div>
            <div style={{ background: M.tertiaryContainer, borderRadius: 14, padding: "10px 12px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: M.onTertiaryContainer, opacity: .75, fontFamily: FONT, letterSpacing: ".5px", textTransform: "uppercase" }}>XP</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: M.onTertiaryContainer, fontFamily: FONT, marginTop: 2 }}>+{workout.xp_earned}</div>
            </div>
          </div>
        </div>

        {/* Exercises */}
        <div style={{ padding: "0 20px 8px" }}>
          {loading && (
            <div style={{ textAlign: "center", padding: "32px 0", color: M.onSurfaceVariant, fontFamily: FONT, fontSize: 13 }}>
              Loading set details…
            </div>
          )}
          {!loading && grouped.length === 0 && (
            <div style={{ background: M.surfaceContainerHighest, borderRadius: 18, padding: "16px 18px", color: M.onSurfaceVariant, fontFamily: FONT, fontSize: 13, lineHeight: 1.5 }}>
              Detailed set data not available for this session.
            </div>
          )}
          {!loading && grouped.map((ex, i) => {
            const pr = prByExercise[ex.name];
            return (
              <div key={i} style={{ background: "#FFFFFF", border: `1.5px solid ${M.outlineVariant}`, borderRadius: 18, padding: "12px 14px", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: "#1C1B1F", fontFamily: FONT }}>{ex.name}</div>
                  <div style={{ fontSize: 11, color: "#49454F", fontFamily: FONT, fontWeight: 600 }}>{ex.rows.filter(r => r.done).length}/{ex.rows.length} sets</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "32px 1fr 1fr 36px 24px", gap: 6, fontSize: 10, color: M.onSurfaceVariant, fontWeight: 700, letterSpacing: ".6px", textTransform: "uppercase", fontFamily: FONT, paddingBottom: 4, borderBottom: `1px solid ${M.outlineVariant}` }}>
                  <span>Set</span><span>Weight</span><span>Reps</span><span style={{ textAlign: "center" }}>Done</span><span />
                </div>
                {ex.rows.map((s, j) => {
                  const isPR = pr && s.done && epley1RM(s.weight, s.reps) >= pr.estimated_1rm * 0.99;
                  return (
                    <div key={j} style={{ display: "grid", gridTemplateColumns: "32px 1fr 1fr 36px 24px", gap: 6, padding: "8px 0", borderBottom: j < ex.rows.length - 1 ? `1px solid #F0EBF3` : "none", alignItems: "center" }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: s.done ? "#1C1B1F" : "#9C969F", fontFamily: FONT }}>{s.set_number}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: s.done ? "#1C1B1F" : "#9C969F", fontFamily: FONT }}>{s.done ? `${s.weight} lbs` : "—"}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: s.done ? "#1C1B1F" : "#9C969F", fontFamily: FONT }}>{s.done ? `${s.reps}` : "—"}</span>
                      <span style={{ textAlign: "center", fontSize: 16, color: s.done ? M.greenPrimary : "#CAC4D0" }}>{s.done ? "✓" : "—"}</span>
                      <span style={{ fontSize: 14, textAlign: "right" }}>{isPR ? "🏅" : ""}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 20px 28px", textAlign: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: M.greenPrimary, fontFamily: FONT }}>✓ Workout complete</div>
          {totalSetsPlanned > 0 && (
            <div style={{ fontSize: 12, color: "#49454F", fontFamily: FONT, marginTop: 4 }}>
              {totalSetsCompleted} of {totalSetsPlanned} sets completed
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────
export function ProgressAnalytics({ logs, runs, workoutExercises, personalRecords }: Props): JSX.Element {
  const [strengthEx, setStrengthEx] = useState("Barbell Bench Press");
  const [activeChart, setActiveChart] = useState<"strength" | "volume" | "1rm">("strength");
  const [detailWorkout, setDetailWorkout] = useState<WorkoutLog | null>(null);

  const streak = useMemo(() => computeStreak(logs, runs), [logs, runs]);
  const totalXP = useMemo(() => logs.reduce((a, w) => a + w.xp_earned, 0), [logs]);
  const totalVol = useMemo(() => logs.reduce((a, w) => a + w.total_volume_kg, 0), [logs]);
  const totalMiles = useMemo(() => runs.reduce((a, r) => a + r.distance_miles, 0), [runs]);

  // All exercises that have been logged
  const allLoggedExercises = useMemo(() => {
    const s = new Set(workoutExercises.map(w => w.exercise_name));
    return Array.from(s).sort();
  }, [workoutExercises]);

  // Strength chart data: max weight per session for selected exercise
  const strengthData = useMemo(() => {
    const byDate: Record<string, number> = {};
    workoutExercises
      .filter(w => w.exercise_name === strengthEx)
      .forEach(w => {
        const d = w.completed_at.slice(0, 10);
        const maxW = Math.max(...w.sets_json.filter(s => s.done).map(s => s.weight), 0);
        if (maxW > 0) byDate[d] = Math.max(byDate[d] || 0, maxW);
      });
    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([date, weight]) => ({
        date: new Date(date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        weight,
      }));
  }, [workoutExercises, strengthEx]);

  // 1RM chart data: Epley estimate over time for selected exercise
  const oneRMData = useMemo(() => {
    const byDate: Record<string, number> = {};
    workoutExercises
      .filter(w => w.exercise_name === strengthEx)
      .forEach(w => {
        const d = w.completed_at.slice(0, 10);
        const best = Math.max(
          ...w.sets_json.filter(s => s.done).map(s => epley1RM(s.weight, s.reps)),
          0,
        );
        if (best > 0) byDate[d] = Math.max(byDate[d] || 0, best);
      });
    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([date, rm]) => ({
        date: new Date(date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        rm: parseFloat(rm.toFixed(1)),
      }));
  }, [workoutExercises, strengthEx]);

  // Weekly volume data
  const volumeData = useMemo(() => {
    const weeks: number[] = Array(8).fill(0);
    const now = new Date();
    logs.forEach(w => {
      const d = Math.floor((now.getTime() - new Date(w.completed_at).getTime()) / (7 * 24 * 3600 * 1000));
      if (d >= 0 && d < 8) weeks[7 - d] += w.total_volume_kg;
    });
    return weeks.map((vol, i) => {
      const d = new Date(); d.setDate(d.getDate() - (7 - i) * 7);
      return {
        week: d.toLocaleDateString("en-US", { month: "numeric", day: "numeric" }),
        volume: parseFloat(vol.toFixed(0)),
      };
    });
  }, [logs]);

  // Current 1RM for selected exercise
  const current1RM = oneRMData.length > 0 ? oneRMData[oneRMData.length - 1].rm : 0;

  return (
    <div style={{ padding: "0 16px 100px", animation: "heroIn .55s cubic-bezier(.2,0,0,1)" }}>
      <div style={{ fontSize: 34, fontWeight: 900, color: M.onSurface, fontFamily: FONT, letterSpacing: "-.6px", lineHeight: 1.1, padding: "4px 4px 16px" }}>
        Progress
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        {[
          { icon: "🔥", val: String(streak), unit: "day streak", bg: M.tertiaryContainer, fg: M.onTertiaryContainer },
          { icon: "⚡", val: String(totalXP), unit: "total XP", bg: M.primaryContainer, fg: M.onPrimaryContainer },
          { icon: "🏋️", val: String(logs.length), unit: "workouts", bg: M.secondaryContainer, fg: M.onSecondaryContainer },
          { icon: "🏃", val: totalMiles.toFixed(1), unit: "miles run", bg: "#BBDEFB", fg: "#0D47A1" },
        ].map(s => (
          <div key={s.unit} style={{ background: s.bg, borderRadius: 20, padding: "16px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 24 }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: s.fg, fontFamily: FONT, lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: 11, color: s.fg, opacity: .75, fontFamily: FONT, marginTop: 1 }}>{s.unit}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart selector */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
        {([
          ["strength", "💪 Strength"],
          ["volume", "📊 Volume"],
          ["1rm", "🏆 Est. 1RM"],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setActiveChart(id)}
            style={{
              background: activeChart === id ? M.primary : M.surfaceContainerHighest,
              color: activeChart === id ? "#fff" : M.onSurfaceVariant,
              border: "none", borderRadius: 100,
              padding: "8px 16px", fontSize: 12, fontWeight: 700,
              fontFamily: FONT, cursor: "pointer", flexShrink: 0,
              transition: "all .2s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Exercise selector (for strength + 1RM views) */}
      {activeChart !== "volume" && (
        <div style={{ marginBottom: 12 }}>
          <select
            value={strengthEx}
            onChange={e => setStrengthEx(e.target.value)}
            style={{
              width: "100%", background: M.surfaceContainerHighest,
              border: "none", borderRadius: 14, padding: "12px 16px",
              fontFamily: FONT, fontSize: 14, color: M.onSurface, outline: "none",
            }}
          >
            {allLoggedExercises.length > 0
              ? allLoggedExercises.map(ex => <option key={ex} value={ex}>{ex}</option>)
              : <option value="Barbell Bench Press">Barbell Bench Press</option>
            }
          </select>
        </div>
      )}

      {/* Chart area */}
      <div style={{ background: M.surfaceContainerHighest, borderRadius: 24, padding: "16px 8px 8px", marginBottom: 16, minHeight: 180 }}>
        {activeChart === "strength" && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: M.onSurfaceVariant, fontFamily: FONT, letterSpacing: ".8px", textTransform: "uppercase", marginBottom: 8, paddingLeft: 8 }}>
              Max Weight (kg) — Last 12 Sessions
            </div>
            {strengthData.length > 0 ? (
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={strengthData} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={M.outlineVariant} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: M.onSurfaceVariant, fontFamily: FONT }} />
                  <YAxis tick={{ fontSize: 10, fill: M.onSurfaceVariant, fontFamily: FONT }} width={32} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line type="monotone" dataKey="weight" stroke={M.primary} strokeWidth={2.5} dot={{ fill: M.primary, r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: "center", padding: "32px 0", color: M.onSurfaceVariant, fontFamily: FONT, fontSize: 13 }}>
                No data yet for {strengthEx}
              </div>
            )}
          </>
        )}

        {activeChart === "volume" && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: M.onSurfaceVariant, fontFamily: FONT, letterSpacing: ".8px", textTransform: "uppercase", marginBottom: 8, paddingLeft: 8 }}>
              Weekly Volume (kg) — Last 8 Weeks
            </div>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={volumeData} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={M.outlineVariant} />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: M.onSurfaceVariant, fontFamily: FONT }} />
                <YAxis tick={{ fontSize: 10, fill: M.onSurfaceVariant, fontFamily: FONT }} width={36} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="volume" fill={M.primary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}

        {activeChart === "1rm" && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: M.onSurfaceVariant, fontFamily: FONT, letterSpacing: ".8px", textTransform: "uppercase", marginBottom: 8, paddingLeft: 8 }}>
              Estimated 1RM (Epley) — kg
            </div>
            {current1RM > 0 && (
              <div style={{ paddingLeft: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 28, fontWeight: 900, color: M.primary, fontFamily: FONT }}>{current1RM}</span>
                <span style={{ fontSize: 12, color: M.onSurfaceVariant, fontFamily: FONT, marginLeft: 6 }}>kg current</span>
              </div>
            )}
            {oneRMData.length > 0 ? (
              <ResponsiveContainer width="100%" height={130}>
                <LineChart data={oneRMData} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={M.outlineVariant} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: M.onSurfaceVariant, fontFamily: FONT }} />
                  <YAxis tick={{ fontSize: 10, fill: M.onSurfaceVariant, fontFamily: FONT }} width={36} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line type="monotone" dataKey="rm" stroke="#7B5EA7" strokeWidth={2.5} dot={{ fill: "#7B5EA7", r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: "center", padding: "32px 0", color: M.onSurfaceVariant, fontFamily: FONT, fontSize: 13 }}>
                No data yet for {strengthEx}
              </div>
            )}
          </>
        )}
      </div>

      {/* Heatmap */}
      <HeatmapCalendar logs={logs} runs={runs} />

      {/* Total volume */}
      <div style={{ background: M.surfaceContainerHighest, borderRadius: 24, padding: "16px 20px", marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: M.onSurfaceVariant, fontFamily: FONT, letterSpacing: ".8px", textTransform: "uppercase", marginBottom: 8 }}>
          Total Volume Lifted
        </div>
        <div style={{ fontSize: 32, fontWeight: 900, color: M.onSurface, fontFamily: FONT }}>
          {totalVol.toFixed(0)} <span style={{ fontSize: 16, fontWeight: 600, color: M.onSurfaceVariant }}>kg</span>
        </div>
      </div>

      {/* PR Timeline */}
      {personalRecords.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: M.onSurfaceVariant, fontFamily: FONT, letterSpacing: ".8px", textTransform: "uppercase", marginBottom: 10 }}>
            Personal Records
          </div>
          {personalRecords.slice(0, 10).map((pr, i) => {
            const date = new Date(pr.achieved_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
            const now = Date.now();
            const achieved = new Date(pr.achieved_at).getTime();
            const daysDiff = (now - achieved) / (1000 * 60 * 60 * 24);
            const tier = daysDiff < 7 ? "🥇" : daysDiff < 30 ? "🥈" : "🥉";
            return (
              <div key={pr.id} style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "12px 16px", background: M.surfaceContainerHighest,
                borderRadius: 20, marginBottom: 8,
                animation: `stagger .25s ${i * 50}ms both`,
              }}>
                <span style={{ fontSize: 22 }}>{tier}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: M.onSurface, fontFamily: FONT }}>{pr.exercise_name}</div>
                  <div style={{ fontSize: 11, color: M.onSurfaceVariant, fontFamily: FONT, marginTop: 1 }}>{date}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: M.primary, fontFamily: FONT }}>{pr.weight} kg</div>
                  <div style={{ fontSize: 11, color: M.onSurfaceVariant, fontFamily: FONT }}>× {pr.reps} · {pr.estimated_1rm.toFixed(1)} 1RM</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recent workouts */}
      {logs.length === 0 ? (
        <div style={{ textAlign: "center", padding: "32px 0", color: M.onSurfaceVariant, fontFamily: FONT }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>No data yet</div>
          <div style={{ fontSize: 13 }}>Complete a workout to see your progress</div>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 11, fontWeight: 700, color: M.onSurfaceVariant, fontFamily: FONT, letterSpacing: ".8px", textTransform: "uppercase", marginBottom: 10 }}>
            Recent Workouts
          </div>
          {logs.slice(0, 8).map((w, i) => {
            const date = new Date(w.completed_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
            return (
              <div key={w.id} onClick={() => setDetailWorkout(w)} className="m3b" style={{
                background: M.surfaceContainerHighest, borderRadius: 20,
                padding: "14px 16px", marginBottom: 8,
                display: "flex", justifyContent: "space-between", alignItems: "center",
                animation: `stagger .25s ${i * 50}ms both`,
                cursor: "pointer", border: `1px solid ${M.outlineVariant}`,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: M.onSurface, fontFamily: FONT }}>{w.routine_emoji} {w.routine_name}</div>
                  <div style={{ fontSize: 11, color: M.onSurfaceVariant, fontFamily: FONT, marginTop: 2 }}>{date} · {w.total_sets} sets · {fmtDur(w.duration_seconds)}</div>
                </div>
                <div style={{ textAlign: "right", marginRight: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: M.primary, fontFamily: FONT }}>+{w.xp_earned} XP</div>
                  <div style={{ fontSize: 11, color: M.onSurfaceVariant, fontFamily: FONT }}>{w.total_volume_kg.toFixed(0)} lbs</div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={M.onSurfaceVariant} strokeWidth="2.2" style={{ flexShrink: 0, opacity: .65 }}>
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            );
          })}
        </>
      )}

      {detailWorkout && (
        <WorkoutDetailView workout={detailWorkout} personalRecords={personalRecords} onBack={() => setDetailWorkout(null)} />
      )}
    </div>
  );
}
