import { useState, useEffect, useRef, type JSX } from "react";

const FONT = `"Nunito","Google Sans","Helvetica Neue",sans-serif`;
const QUICK = [60, 90, 120, 180, 300];
const QUICK_LABEL = ["1m","1:30","2m","3m","5m"];

export interface RestTimerState {
  active: boolean;
  totalSec: number;
  remaining: number;
  exerciseName: string;
}

interface RestTimerProps {
  state: RestTimerState;
  onTick: (remaining: number) => void;
  onComplete: () => void;
  onSkip: () => void;
  onAddThirty: () => void;
  onSetDuration?: (sec: number) => void;
  onAdjust?: (delta: number) => void;
  primaryColor?: string;
  primaryContainer?: string;
  onPrimaryContainer?: string;
  secondaryContainer?: string;
  onSecondaryContainer?: string;
  surface?: string;
  surfaceContainerHighest?: string;
  onSurface?: string;
  onSurfaceVariant?: string;
  outline?: string;
}

export function getRestDuration(exerciseName: string): number {
  const t = exerciseName.toLowerCase();
  const isCompound =
    t.includes("squat") || t.includes("deadlift") || t.includes("bench") ||
    t.includes("overhead") || t.includes("ohp") || t.includes("row") ||
    t.includes("pull-up") || t.includes("chin") || t.includes("press") ||
    t.includes("farmer") || t.includes("zercher") || t.includes("snatch");
  return isCompound ? 180 : 90;
}

export function RestTimer({
  state, onTick, onComplete, onSkip, onAddThirty,
  onSetDuration, onAdjust,
  primaryColor = "#4F378B",
  primaryContainer = "#EADDFF",
  onPrimaryContainer = "#21005D",
  secondaryContainer = "#E8DEF8",
  onSecondaryContainer = "#1D192B",
  surface = "#FFFBFE",
  surfaceContainerHighest = "#E6E0EB",
  onSurface = "#1C1B1F",
  onSurfaceVariant = "#49454F",
  outline = "#79747E",
}: RestTimerProps): JSX.Element | null {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const flashRef = useRef(false);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (!state.active) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      onTick(Math.max(0, state.remaining - 1));
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [state.active, state.remaining]);

  useEffect(() => {
    if (state.remaining === 0 && state.active && !flashRef.current) {
      flashRef.current = true;
      if ("vibrate" in navigator) navigator.vibrate([200, 100, 200]);
      setFlash(true);
      setTimeout(() => {
        setFlash(false);
        flashRef.current = false;
        onSkip(); // auto-dismiss after 3s
      }, 3000);
      onComplete();
    }
    if (state.remaining > 0) flashRef.current = false;
  }, [state.remaining, state.active]);

  if (!state.active) return null;

  const pct = state.totalSec > 0 ? state.remaining / state.totalSec : 0;
  const min = Math.floor(state.remaining / 60);
  const sec = state.remaining % 60;
  const timeStr = `${min}:${String(sec).padStart(2, "0")}`;
  const isDone = state.remaining === 0;

  // SVG ring
  const R = 22, CIRC = 2 * Math.PI * R;
  const dash = CIRC * pct;

  return (
    <>
      {flash && (
        <div style={{
          position: "fixed", inset: 0, background: "#B3261E22",
          zIndex: 9999, pointerEvents: "none",
          animation: "timerFlash 1s ease-out forwards",
        }} />
      )}
      <div style={{
        position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 430, zIndex: 200, padding: "0 12px",
      }}>
        <div style={{
          background: isDone ? primaryContainer : surface,
          borderRadius: 22,
          boxShadow: `0 4px 24px ${primaryColor}33`,
          border: `1.5px solid ${isDone ? primaryColor : outline}`,
          overflow: "hidden",
          transition: "all .3s ease",
        }}>
          {/* Quick-select chips */}
          <div style={{
            display: "flex", gap: 6, padding: "8px 12px 0",
            overflowX: "auto",
          }}>
            {QUICK.map((s, i) => (
              <button key={s} onClick={() => onSetDuration?.(s)} style={{
                background: state.totalSec === s ? primaryColor : surfaceContainerHighest,
                color: state.totalSec === s ? "#fff" : onSurfaceVariant,
                border: "none", borderRadius: 100, padding: "4px 12px",
                fontSize: 11, fontWeight: 700, fontFamily: FONT, cursor: "pointer",
                flexShrink: 0,
              }}>{QUICK_LABEL[i]}</button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", padding: "8px 12px 10px", gap: 10 }}>
            {/* SVG Ring */}
            <div style={{ position: "relative", width: 52, height: 52, flexShrink: 0 }}>
              <svg width="52" height="52" viewBox="0 0 52 52" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="26" cy="26" r={R} fill="none" stroke={surfaceContainerHighest} strokeWidth="4"/>
                <circle cx="26" cy="26" r={R} fill="none"
                  stroke={isDone ? "#B3261E" : primaryColor} strokeWidth="4"
                  strokeDasharray={`${dash} ${CIRC}`}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dasharray 1s linear, stroke .3s" }}
                />
              </svg>
              <div style={{
                position: "absolute", inset: 0, display: "flex",
                alignItems: "center", justifyContent: "center",
                fontSize: isDone ? 18 : 13, fontWeight: 900,
                color: isDone ? "#B3261E" : primaryColor, fontFamily: FONT,
              }}>
                {isDone ? "✓" : timeStr}
              </div>
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: onSurface, fontFamily: FONT, lineHeight: 1.2 }}>
                {isDone ? "Rest complete — crush it!" : `Rest · ${state.exerciseName}`}
              </div>
              {!isDone && (
                <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                  <button onClick={() => onAdjust?.(-15)} style={{
                    background: surfaceContainerHighest, border: "none",
                    borderRadius: 100, padding: "3px 8px", fontSize: 11,
                    fontWeight: 700, color: onSurfaceVariant, fontFamily: FONT, cursor: "pointer",
                  }}>−15</button>
                  <button onClick={onAddThirty} style={{
                    background: secondaryContainer, border: "none",
                    borderRadius: 100, padding: "3px 8px", fontSize: 11,
                    fontWeight: 700, color: onSecondaryContainer, fontFamily: FONT, cursor: "pointer",
                  }}>+30s</button>
                </div>
              )}
            </div>

            {/* Skip */}
            <button onClick={onSkip} style={{
              background: primaryContainer, border: "none",
              borderRadius: 100, padding: "8px 14px",
              fontSize: 12, fontWeight: 700,
              color: onPrimaryContainer, fontFamily: FONT, cursor: "pointer", flexShrink: 0,
            }}>
              {isDone ? "Dismiss" : "Skip"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
