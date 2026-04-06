import { useState, useMemo, type JSX } from "react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import type { Run } from "../lib/db";

const M = {
  primary: "#4F378B", onPrimary: "#FFFFFF",
  primaryContainer: "#EADDFF", onPrimaryContainer: "#21005D",
  secondaryContainer: "#E8DEF8", onSecondaryContainer: "#1D192B",
  tertiaryContainer: "#FFD8E4", onTertiaryContainer: "#31111D",
  surface: "#FFFBFE", surfaceContainer: "#F3EDF7",
  surfaceContainerHigh: "#ECE6F0", surfaceContainerHighest: "#E6E0EB",
  onSurface: "#1C1B1F", onSurfaceVariant: "#49454F",
  outline: "#79747E", outlineVariant: "#CAC4D0",
  error: "#B3261E", errorContainer: "#F9DEDC",
  greenPrimary: "#386A20", greenContainer: "#C5EFAA", onGreenContainer: "#072100",
  orangeContainer: "#FFDDB3", orangePrimary: "#7D4E00",
};
const FONT = `"Nunito","Google Sans","Helvetica Neue",sans-serif`;

function fmtPace(distMi: number, durSec: number): string {
  if (!distMi || !durSec) return "—";
  const pps = durSec / distMi;
  const m = Math.floor(pps / 60), s = Math.round(pps % 60);
  return `${m}:${String(s).padStart(2, "0")}/mi`;
}
function fmtDur(sec: number): string {
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  if (h > 0) return `${h}h ${m}m`; if (m > 0) return `${m}m ${s}s`; return `${s}s`;
}
function paceSecPerMile(run: Run): number {
  return run.distance_miles > 0 ? run.duration_seconds / run.distance_miles : Infinity;
}

function ChartTip({ active, payload, label }: Record<string, unknown>): JSX.Element | null {
  if (!(active as boolean) || !(payload as unknown[])?.length) return null;
  const p = (payload as Array<{ value: number; name: string }>)[0];
  return (
    <div style={{ background: M.surface, border: `1px solid ${M.outlineVariant}`, borderRadius: 12, padding: "8px 14px", fontFamily: FONT, fontSize: 12 }}>
      <div style={{ fontWeight: 700 }}>{label as string}</div>
      <div style={{ color: M.primary, fontWeight: 800 }}>{p.value}</div>
    </div>
  );
}

// ── Log / Edit sheet ──────────────────────────────────────────────────────
interface SheetProps {
  editRun: Run | null;
  userBodyweight: number;
  targetPaceSec: number;
  distanceUnit: "mi" | "km";
  onSave: (fields: {
    distanceMiles: number; durationSeconds: number; notes: string;
    routeName?: string; heartRateAvg?: number;
  }) => Promise<void>;
  onClose: () => void;
}

function RunSheet({ editRun, distanceUnit, onSave, onClose }: SheetProps): JSX.Element {
  const [dist, setDist] = useState(editRun ? (distanceUnit === "km" ? editRun.distance_miles * 1.60934 : editRun.distance_miles) : 3.0);
  const [minutes, setMinutes] = useState(editRun ? Math.floor(editRun.duration_seconds / 60) : 30);
  const [seconds, setSeconds] = useState(editRun ? editRun.duration_seconds % 60 : 0);
  const [notes, setNotes] = useState(editRun?.notes || "");
  const [route, setRoute] = useState(editRun?.route_name || "");
  const [hr, setHr] = useState(editRun?.heart_rate_avg ? String(editRun.heart_rate_avg) : "");
  const [saving, setSaving] = useState(false);

  const durSec = minutes * 60 + seconds;
  const distMi = distanceUnit === "km" ? dist / 1.60934 : dist;
  const pace = fmtPace(distMi, durSec);

  const save = async () => {
    if (!dist || !durSec) return;
    setSaving(true);
    await onSave({
      distanceMiles: distMi,
      durationSeconds: durSec,
      notes,
      routeName: route || undefined,
      heartRateAvg: hr ? parseInt(hr) : undefined,
    });
    setSaving(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(28,27,31,.6)", backdropFilter: "blur(6px)", zIndex: 400, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: "100%", maxWidth: 430, background: M.surface, borderRadius: "28px 28px 0 0", padding: "0 0 48px", maxHeight: "90vh", overflowY: "auto", animation: "slideUp .5s cubic-bezier(.34,1.56,.64,1)" }}>
        <div style={{ width: 32, height: 4, background: "#CAC4D0", borderRadius: 2, margin: "10px auto 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px 12px" }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: M.onSurface, fontFamily: FONT }}>{editRun ? "Edit Run" : "Log a Run"}</div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: "50%", background: M.surfaceContainerHighest, border: "none", fontSize: 18, color: M.onSurfaceVariant, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
        <div style={{ padding: "0 20px" }}>
          {/* Distance */}
          <div style={{ fontSize: 11, fontWeight: 700, color: M.onSurfaceVariant, letterSpacing: ".8px", textTransform: "uppercase", marginBottom: 8, fontFamily: FONT }}>
            Distance ({distanceUnit})
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
            <button onClick={() => setDist(d => Math.max(0.1, Math.round((d - 0.1) * 10) / 10))} style={{ width: 44, height: 44, borderRadius: "50%", background: M.surfaceContainerHighest, border: "none", fontSize: 24, fontWeight: 700, cursor: "pointer" }}>−</button>
            <div style={{ flex: 1, textAlign: "center", fontSize: 40, fontWeight: 900, color: M.onSurface, fontFamily: FONT }}>{dist.toFixed(1)}</div>
            <button onClick={() => setDist(d => Math.round((d + 0.1) * 10) / 10)} style={{ width: 44, height: 44, borderRadius: "50%", background: M.surfaceContainerHighest, border: "none", fontSize: 24, fontWeight: 700, cursor: "pointer" }}>+</button>
          </div>
          {/* Duration */}
          <div style={{ fontSize: 11, fontWeight: 700, color: M.onSurfaceVariant, letterSpacing: ".8px", textTransform: "uppercase", marginBottom: 8, fontFamily: FONT }}>Duration</div>
          <div style={{ display: "flex", gap: 12, marginBottom: 4 }}>
            {[{ label: "Minutes", val: minutes, set: setMinutes, max: 999 }, { label: "Seconds", val: seconds, set: setSeconds, max: 59 }].map(({ label, val, set, max }) => (
              <div key={label} style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: M.onSurfaceVariant, fontFamily: FONT, marginBottom: 4, textAlign: "center" }}>{label}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button onClick={() => set((v: number) => Math.max(0, v - 1))} style={{ width: 36, height: 36, borderRadius: "50%", background: M.surfaceContainerHighest, border: "none", fontSize: 18, cursor: "pointer" }}>−</button>
                  <div style={{ flex: 1, textAlign: "center", fontSize: 26, fontWeight: 900, color: M.onSurface, fontFamily: FONT }}>{String(val).padStart(label === "Seconds" ? 2 : 1, "0")}</div>
                  <button onClick={() => set((v: number) => Math.min(max, v + 1))} style={{ width: 36, height: 36, borderRadius: "50%", background: M.surfaceContainerHighest, border: "none", fontSize: 18, cursor: "pointer" }}>+</button>
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 12, color: M.primary, fontWeight: 700, fontFamily: FONT, textAlign: "center", marginBottom: 16 }}>
            Pace: {pace}
          </div>
          {/* Optional fields */}
          {[
            { label: "Route Name (optional)", val: route, set: setRoute, placeholder: "e.g. River Loop", type: "text" },
            { label: "Heart Rate (avg bpm, optional)", val: hr, set: setHr, placeholder: "e.g. 152", type: "number" },
          ].map(({ label, val, set, placeholder, type }) => (
            <div key={label} style={{ marginBottom: 12 }}>
              <input value={val} onChange={e => set(e.target.value)} type={type} placeholder={label + ` — ${placeholder}`}
                style={{ width: "100%", background: M.surfaceContainerHighest, border: "none", borderRadius: 14, padding: "12px 16px", fontFamily: FONT, fontSize: 14, color: M.onSurface, outline: "none" }} />
            </div>
          ))}
          <div style={{ marginBottom: 16 }}>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (optional)" rows={2}
              style={{ width: "100%", background: M.surfaceContainerHighest, border: "none", borderRadius: 14, padding: "12px 16px", fontFamily: FONT, fontSize: 14, color: M.onSurface, outline: "none", resize: "none" }} />
          </div>
          <button onClick={save} disabled={saving} style={{ width: "100%", background: M.primary, color: M.onPrimary, border: "none", borderRadius: 20, padding: 16, fontWeight: 800, fontSize: 15, fontFamily: FONT, cursor: saving ? "default" : "pointer", opacity: saving ? 0.6 : 1 }}>
            {saving ? "Saving…" : editRun ? "Update Run" : "Save Run"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main RunningScreenFull ────────────────────────────────────────────────
interface Props {
  userId: string;
  runs: Run[];
  userBodyweight: number; // kg
  targetPaceSec: number;  // sec/mile, user setting
  distanceUnit: "mi" | "km";
  onSaveRun: (fields: {
    distanceMiles: number; durationSeconds: number; notes: string;
    routeName?: string; heartRateAvg?: number;
  }, editId?: string) => Promise<void>;
  onTargetPaceChange: (sec: number) => void;
}

export function RunningScreenFull({
  runs, userBodyweight, targetPaceSec, distanceUnit, onSaveRun,
}: Props): JSX.Element {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editRun, setEditRun] = useState<Run | null>(null);

  // Stats
  const totalMiles = useMemo(() => runs.reduce((a, r) => a + r.distance_miles, 0), [runs]);
  const thisMonthMiles = useMemo(() => {
    const now = new Date(); const y = now.getFullYear(), mo = now.getMonth();
    return runs.filter(r => {
      const d = new Date(r.ran_at); return d.getFullYear() === y && d.getMonth() === mo;
    }).reduce((a, r) => a + r.distance_miles, 0);
  }, [runs]);
  const lastMonthMiles = useMemo(() => {
    const now = new Date(); let y = now.getFullYear(), mo = now.getMonth() - 1;
    if (mo < 0) { mo = 11; y--; }
    return runs.filter(r => {
      const d = new Date(r.ran_at); return d.getFullYear() === y && d.getMonth() === mo;
    }).reduce((a, r) => a + r.distance_miles, 0);
  }, [runs]);
  const monthChange = lastMonthMiles > 0 ? ((thisMonthMiles - lastMonthMiles) / lastMonthMiles) * 100 : null;
  const longestRun = useMemo(() => Math.max(0, ...runs.map(r => r.distance_miles)), [runs]);
  const bestPaceSec = useMemo(() => {
    if (!runs.length) return Infinity;
    return Math.min(...runs.filter(r => r.distance_miles > 0).map(r => paceSecPerMile(r)));
  }, [runs]);

  // Consistency streak (consecutive weeks with ≥1 run)
  const weekStreak = useMemo(() => {
    if (!runs.length) return 0;
    let streak = 0; const now = new Date();
    for (let w = 0; w < 52; w++) {
      const wStart = new Date(now); wStart.setDate(wStart.getDate() - (w + 1) * 7);
      const wEnd = new Date(now); wEnd.setDate(wEnd.getDate() - w * 7);
      const hasRun = runs.some(r => {
        const d = new Date(r.ran_at); return d >= wStart && d < wEnd;
      });
      if (hasRun) streak++; else break;
    }
    return streak;
  }, [runs]);

  // Calories (bodyweight lbs × 0.75 × miles)
  const calcCals = (miles: number) => {
    const lbs = userBodyweight * 2.20462;
    return Math.round(lbs * 0.75 * miles);
  };

  // Average pace trend — last 8 weeks
  const paceTrendData = useMemo(() => {
    const result = [];
    const now = new Date();
    for (let w = 7; w >= 0; w--) {
      const wStart = new Date(now); wStart.setDate(wStart.getDate() - (w + 1) * 7);
      const wEnd = new Date(now); wEnd.setDate(wEnd.getDate() - w * 7);
      const weekRuns = runs.filter(r => {
        const d = new Date(r.ran_at); return d >= wStart && d < wEnd && r.distance_miles > 0;
      });
      const label = wStart.toLocaleDateString("en-US", { month: "numeric", day: "numeric" });
      if (!weekRuns.length) { result.push({ week: label, pace: null }); continue; }
      const avgPace = weekRuns.reduce((a, r) => a + paceSecPerMile(r), 0) / weekRuns.length;
      // Convert to decimal minutes for chart
      result.push({ week: label, pace: parseFloat((avgPace / 60).toFixed(2)) });
    }
    return result;
  }, [runs]);

  // Weekly mileage — last 8 weeks
  const weeklyMileageData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 8 }, (_, i) => {
      const wi = 7 - i;
      const wStart = new Date(now); wStart.setDate(wStart.getDate() - (wi + 1) * 7);
      const wEnd = new Date(now); wEnd.setDate(wEnd.getDate() - wi * 7);
      const miles = runs.filter(r => {
        const d = new Date(r.ran_at); return d >= wStart && d < wEnd;
      }).reduce((a, r) => a + r.distance_miles, 0);
      return {
        week: wStart.toLocaleDateString("en-US", { month: "numeric", day: "numeric" }),
        miles: parseFloat(miles.toFixed(2)),
      };
    });
  }, [runs]);

  const fmtMiles = (mi: number) => distanceUnit === "km" ? `${(mi * 1.60934).toFixed(2)} km` : `${mi.toFixed(2)} mi`;
  const bestPaceStr = isFinite(bestPaceSec)
    ? `${Math.floor(bestPaceSec / 60)}:${String(Math.round(bestPaceSec % 60)).padStart(2, "0")}/mi`
    : "—";

  const openNew = () => { setEditRun(null); setSheetOpen(true); };
  const openEdit = (r: Run) => { setEditRun(r); setSheetOpen(true); };

  const handleSave = async (fields: {
    distanceMiles: number; durationSeconds: number; notes: string;
    routeName?: string; heartRateAvg?: number;
  }) => {
    await onSaveRun(fields, editRun?.id);
    setSheetOpen(false);
    setEditRun(null);
  };

  return (
    <div style={{ padding: "0 16px 100px", animation: "heroIn .55s cubic-bezier(.2,0,0,1)" }}>
      <div style={{ fontSize: 34, fontWeight: 900, color: M.onSurface, fontFamily: FONT, letterSpacing: "-.6px", lineHeight: 1.1, padding: "4px 4px 16px" }}>
        Running
      </div>

      {/* Top stat cards */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        {[
          { icon: "🏃", val: fmtMiles(totalMiles), unit: "total", bg: M.primaryContainer, fg: M.onPrimaryContainer },
          { icon: "📅", val: fmtMiles(thisMonthMiles), unit: `this month${monthChange !== null ? ` (${monthChange >= 0 ? "+" : ""}${monthChange.toFixed(0)}%)` : ""}`, bg: M.secondaryContainer, fg: M.onSecondaryContainer },
          { icon: "⚡", val: bestPaceStr, unit: "best pace", bg: M.tertiaryContainer, fg: M.onTertiaryContainer },
        ].map(s => (
          <div key={s.unit} style={{ background: s.bg, borderRadius: 20, padding: "12px", flex: 1, display: "flex", flexDirection: "column", gap: 3, alignItems: "center" }}>
            <span style={{ fontSize: 18 }}>{s.icon}</span>
            <div style={{ fontSize: 13, fontWeight: 900, color: s.fg, fontFamily: FONT, lineHeight: 1.1, textAlign: "center" }}>{s.val}</div>
            <div style={{ fontSize: 9, color: s.fg, opacity: .75, fontFamily: FONT, textAlign: "center" }}>{s.unit}</div>
          </div>
        ))}
      </div>

      {/* Secondary stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        {[
          { icon: "🏅", val: fmtMiles(longestRun), label: "Longest run" },
          { icon: "🔥", val: `${weekStreak}w`, label: "Week streak" },
        ].map(s => (
          <div key={s.label} style={{ background: M.surfaceContainerHighest, borderRadius: 20, padding: "14px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: M.onSurface, fontFamily: FONT, lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: 11, color: M.onSurfaceVariant, fontFamily: FONT }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Log button */}
      <button onClick={openNew} style={{ width: "100%", background: M.primary, color: M.onPrimary, border: "none", borderRadius: 20, padding: "18px", fontFamily: FONT, fontWeight: 800, fontSize: 15, display: "flex", alignItems: "center", gap: 12, justifyContent: "center", marginBottom: 20, cursor: "pointer" }}>
        <span style={{ fontSize: 22 }}>+</span> Log a Run
      </button>

      {/* Charts */}
      {runs.length > 1 && (
        <>
          <div style={{ background: M.surfaceContainerHighest, borderRadius: 24, padding: "14px 8px 8px", marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: M.onSurfaceVariant, fontFamily: FONT, letterSpacing: ".8px", textTransform: "uppercase", marginBottom: 8, paddingLeft: 8 }}>
              Weekly Mileage (last 8 weeks)
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={weeklyMileageData} margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={M.outlineVariant} />
                <XAxis dataKey="week" tick={{ fontSize: 9, fill: M.onSurfaceVariant, fontFamily: FONT }} />
                <YAxis tick={{ fontSize: 9, fill: M.onSurfaceVariant, fontFamily: FONT }} width={30} />
                <Tooltip content={<ChartTip />} />
                <Bar dataKey="miles" fill="#0D47A1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: M.surfaceContainerHighest, borderRadius: 24, padding: "14px 8px 8px", marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: M.onSurfaceVariant, fontFamily: FONT, letterSpacing: ".8px", textTransform: "uppercase", marginBottom: 8, paddingLeft: 8 }}>
              Avg Pace Trend (min/mi)
            </div>
            <ResponsiveContainer width="100%" height={110}>
              <LineChart data={paceTrendData} margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={M.outlineVariant} />
                <XAxis dataKey="week" tick={{ fontSize: 9, fill: M.onSurfaceVariant, fontFamily: FONT }} />
                <YAxis tick={{ fontSize: 9, fill: M.onSurfaceVariant, fontFamily: FONT }} width={32} domain={["auto", "auto"]} reversed />
                <Tooltip content={<ChartTip />} />
                <Line type="monotone" dataKey="pace" stroke={M.primary} strokeWidth={2} dot={{ fill: M.primary, r: 2 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* Run history */}
      {runs.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: M.onSurfaceVariant, fontFamily: FONT }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏃</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>No runs yet</div>
          <div style={{ fontSize: 13 }}>Tap above to log your first run</div>
        </div>
      ) : (
        runs.map((r, i) => {
          const pace = fmtPace(r.distance_miles, r.duration_seconds);
          const paceSec = paceSecPerMile(r);
          const isUnderTarget = targetPaceSec > 0 && paceSec < targetPaceSec;
          const date = new Date(r.ran_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
          const cals = calcCals(r.distance_miles);
          return (
            <div
              key={r.id}
              onClick={() => openEdit(r)}
              style={{
                background: M.surfaceContainerHighest,
                borderRadius: 24, padding: "16px 20px",
                marginBottom: 10,
                animation: `stagger .25s ${i * 40}ms both`,
                cursor: "pointer",
                borderLeft: targetPaceSec > 0 ? `4px solid ${isUnderTarget ? "#4CAF50" : "#FF9800"}` : `4px solid transparent`,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: M.onSurface, fontFamily: FONT }}>
                    {fmtMiles(r.distance_miles)}
                    {r.route_name && (
                      <span style={{ fontSize: 12, fontWeight: 600, color: M.onSurfaceVariant, marginLeft: 8 }}>{r.route_name}</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: M.onSurfaceVariant, fontFamily: FONT, marginTop: 2 }}>{date}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: M.primary, fontFamily: FONT }}>{pace}</div>
                  <div style={{ fontSize: 12, color: M.onSurfaceVariant, fontFamily: FONT, marginTop: 2 }}>{fmtDur(r.duration_seconds)}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                {userBodyweight > 0 && (
                  <span style={{ fontSize: 11, background: M.primaryContainer, color: M.onPrimaryContainer, borderRadius: 100, padding: "2px 10px", fontWeight: 600, fontFamily: FONT }}>
                    ~{cals} cal
                  </span>
                )}
                {r.heart_rate_avg && (
                  <span style={{ fontSize: 11, background: M.tertiaryContainer, color: M.onTertiaryContainer, borderRadius: 100, padding: "2px 10px", fontWeight: 600, fontFamily: FONT }}>
                    ❤️ {r.heart_rate_avg} bpm
                  </span>
                )}
              </div>
              {r.notes && (
                <div style={{ fontSize: 12, color: M.onSurfaceVariant, fontFamily: FONT, fontStyle: "italic", marginTop: 6 }}>{r.notes}</div>
              )}
            </div>
          );
        })
      )}

      {/* Log sheet */}
      {sheetOpen && (
        <RunSheet
          editRun={editRun}
          userBodyweight={userBodyweight}
          targetPaceSec={targetPaceSec}
          distanceUnit={distanceUnit}
          onSave={handleSave}
          onClose={() => { setSheetOpen(false); setEditRun(null); }}
        />
      )}
    </div>
  );
}
