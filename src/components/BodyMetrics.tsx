import { useState, useMemo, type JSX } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import type { BodyMetric } from "../lib/db";

const M = {
  primary: "var(--fp)", onPrimary: "var(--fop)",
  primaryContainer: "var(--fpc)", onPrimaryContainer: "var(--fopc)",
  secondaryContainer: "var(--fsc)", onSecondaryContainer: "var(--fosc)",
  tertiaryContainer: "var(--ftc)", onTertiaryContainer: "var(--fotc)",
  surface: "#FFFBFE", surfaceContainerHighest: "#E6E0EB",
  surfaceContainerHigh: "#ECE6F0",
  onSurface: "#1C1B1F", onSurfaceVariant: "#49454F",
  outline: "#79747E", outlineVariant: "#CAC4D0",
};
const FONT = `"Nunito","Google Sans","Helvetica Neue",sans-serif`;

interface Props {
  metrics: BodyMetric[];
  onSave: (bodyweight: number, opts?: {
    body_fat_pct?: number;
    neck_cm?: number;
    waist_cm?: number;
    hip_cm?: number;
  }) => Promise<void>;
}

function ChartTip({ active, payload, label }: Record<string, unknown>): JSX.Element | null {
  if (!(active as boolean) || !(payload as unknown[])?.length) return null;
  const p = (payload as Array<{ value: number }>)[0];
  return (
    <div style={{ background: M.surface, border: `1px solid ${M.outlineVariant}`, borderRadius: 12, padding: "8px 14px", fontFamily: FONT, fontSize: 12 }}>
      <div style={{ fontWeight: 700 }}>{label as string}</div>
      <div style={{ color: M.primary, fontWeight: 800 }}>{p.value} kg</div>
    </div>
  );
}

export function BodyMetrics({ metrics, onSave }: Props): JSX.Element {
  const [open, setOpen] = useState(false);
  const [bw, setBw] = useState("");
  const [bf, setBf] = useState("");
  const [neck, setNeck] = useState("");
  const [waist, setWaist] = useState("");
  const [hip, setHip] = useState("");
  const [saving, setSaving] = useState(false);

  const chartData = useMemo(() => {
    return [...metrics]
      .reverse()
      .slice(-20)
      .map(m => ({
        date: new Date(m.logged_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        weight: m.bodyweight,
      }));
  }, [metrics]);

  // Trend: last 7 days vs previous 7 days
  const trend = useMemo(() => {
    const now = Date.now();
    const recent = metrics.filter(m => now - new Date(m.logged_at).getTime() < 7 * 86400000);
    const prev = metrics.filter(m => {
      const age = now - new Date(m.logged_at).getTime();
      return age >= 7 * 86400000 && age < 14 * 86400000;
    });
    if (!recent.length || !prev.length) return null;
    const avgRecent = recent.reduce((a, m) => a + m.bodyweight, 0) / recent.length;
    const avgPrev = prev.reduce((a, m) => a + m.bodyweight, 0) / prev.length;
    const diff = avgRecent - avgPrev;
    if (Math.abs(diff) < 0.2) return { dir: "flat" as const, diff };
    return { dir: diff > 0 ? "up" as const : "down" as const, diff };
  }, [metrics]);

  const latest = metrics[0];

  const handleSave = async () => {
    const bwNum = parseFloat(bw);
    if (!bwNum || bwNum <= 0) return;
    setSaving(true);
    await onSave(bwNum, {
      body_fat_pct: bf ? parseFloat(bf) : undefined,
      neck_cm: neck ? parseFloat(neck) : undefined,
      waist_cm: waist ? parseFloat(waist) : undefined,
      hip_cm: hip ? parseFloat(hip) : undefined,
    });
    setSaving(false);
    setOpen(false);
    setBw(""); setBf(""); setNeck(""); setWaist(""); setHip("");
  };

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: M.onSurface, fontFamily: FONT }}>Body Metrics</div>
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            background: M.primaryContainer, border: "none", borderRadius: 100,
            padding: "7px 14px", fontSize: 12, fontWeight: 700,
            color: M.onPrimaryContainer, fontFamily: FONT, cursor: "pointer",
          }}
        >
          + Log
        </button>
      </div>

      {/* Latest + trend */}
      {latest && (
        <div style={{
          background: M.primaryContainer, borderRadius: 20, padding: "16px",
          marginBottom: 12, display: "flex", alignItems: "center", gap: 16,
        }}>
          <div>
            <div style={{ fontSize: 32, fontWeight: 900, color: M.primary, fontFamily: FONT, lineHeight: 1 }}>
              {latest.bodyweight} <span style={{ fontSize: 14, fontWeight: 600, color: M.onPrimaryContainer }}>kg</span>
            </div>
            <div style={{ fontSize: 11, color: M.onPrimaryContainer, fontFamily: FONT, marginTop: 2 }}>
              {new Date(latest.logged_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </div>
          </div>
          {trend && (
            <div style={{
              marginLeft: "auto",
              background: trend.dir === "down" ? "#C5EFAA" : trend.dir === "up" ? M.tertiaryContainer : M.surfaceContainerHighest,
              borderRadius: 100, padding: "6px 14px",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <span style={{ fontSize: 16 }}>
                {trend.dir === "up" ? "↑" : trend.dir === "down" ? "↓" : "→"}
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, fontFamily: FONT, color: M.onSurface }}>
                {Math.abs(trend.diff).toFixed(1)} kg / 7d
              </span>
            </div>
          )}
        </div>
      )}

      {/* Chart */}
      {chartData.length > 1 && (
        <div style={{ background: M.surfaceContainerHighest, borderRadius: 20, padding: "12px 8px 8px", marginBottom: 12 }}>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={chartData} margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={M.outlineVariant} />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: M.onSurfaceVariant, fontFamily: FONT }} />
              <YAxis
                tick={{ fontSize: 9, fill: M.onSurfaceVariant, fontFamily: FONT }}
                width={36}
                domain={["auto", "auto"]}
              />
              <Tooltip content={<ChartTip />} />
              <Line type="monotone" dataKey="weight" stroke={M.primary} strokeWidth={2} dot={{ fill: M.primary, r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Log sheet */}
      {open && (
        <div style={{
          background: M.surfaceContainerHighest, borderRadius: 24,
          padding: "16px", animation: "scaleIn .3s cubic-bezier(.34,1.56,.64,1)",
        }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: M.onSurface, fontFamily: FONT, marginBottom: 14 }}>Log Body Metrics</div>
          {[
            { label: "Bodyweight (kg) *", val: bw, set: setBw, placeholder: "e.g. 82.5" },
            { label: "Body Fat % (optional)", val: bf, set: setBf, placeholder: "e.g. 18.5" },
            { label: "Neck (cm, optional)", val: neck, set: setNeck, placeholder: "e.g. 38.0" },
            { label: "Waist (cm, optional)", val: waist, set: setWaist, placeholder: "e.g. 84.0" },
            { label: "Hips (cm, optional)", val: hip, set: setHip, placeholder: "e.g. 96.0" },
          ].map(({ label, val, set, placeholder }) => (
            <div key={label} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: M.onSurfaceVariant, fontFamily: FONT, marginBottom: 4, textTransform: "uppercase", letterSpacing: ".6px" }}>{label}</div>
              <input
                type="number"
                inputMode="numeric"
                value={val}
                onChange={e => set(e.target.value)}
                placeholder={placeholder}
                style={{
                  width: "100%", background: M.surface, border: `1.5px solid ${M.outlineVariant}`,
                  borderRadius: 12, padding: "10px 14px",
                  fontFamily: FONT, fontSize: 16, color: M.onSurface, outline: "none",
                }}
              />
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button
              onClick={handleSave}
              disabled={saving || !bw}
              style={{
                flex: 1, background: M.primary, color: M.onPrimary,
                border: "none", borderRadius: 16, padding: "12px",
                fontSize: 14, fontWeight: 800, fontFamily: FONT,
                cursor: saving ? "default" : "pointer",
                opacity: (saving || !bw) ? 0.6 : 1,
              }}
            >
              {saving ? "Saving…" : "Save Entry"}
            </button>
            <button
              onClick={() => setOpen(false)}
              style={{
                background: "transparent", border: `1.5px solid ${M.outlineVariant}`,
                borderRadius: 16, padding: "12px 18px", fontSize: 14,
                fontWeight: 600, color: M.onSurfaceVariant, fontFamily: FONT, cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
