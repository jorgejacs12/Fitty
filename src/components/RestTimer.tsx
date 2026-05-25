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

// CHANGE 1: double chime (660 Hz then 880 Hz)
function playTimerEndSound() {
  try {
    const ctx = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    [660, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.22;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.5, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
      osc.start(t);
      osc.stop(t + 0.65);
    });
    setTimeout(() => ctx.close(), 1500);
  } catch { /* AudioContext unavailable */ }
}

const TIMER_LS_KEY = "fitty_timer_state";

export function RestTimer({
  state, onTick, onComplete, onSkip,
  onSetDuration, onAdjust,
  primaryColor = "var(--fp)",
  primaryContainer = "var(--fpc)",
  onPrimaryContainer = "var(--fopc)",
  secondaryContainer = "var(--fsc)",
  onSecondaryContainer = "var(--fosc)",
  surface = "#FFFBFE",
  surfaceContainerHighest = "#E6E0EB",
  onSurface = "#1C1B1F",
  onSurfaceVariant = "#49454F",
  outline = "#79747E",
}: RestTimerProps): JSX.Element | null {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const flashRef = useRef(false);
  const [flash, setFlash] = useState(false);

  // CHANGE 7: timestamp-based timing
  const endTimeRef = useRef<number>(0);
  const timerRunningRef = useRef<boolean>(false);
  const prevRemainingRef = useRef<number>(-1);

  // Manage endTimeRef when timer state changes
  useEffect(() => {
    if (state.active) {
      if (!timerRunningRef.current) {
        // Fresh timer start
        endTimeRef.current = Date.now() + state.remaining * 1000;
        timerRunningRef.current = true;
        prevRemainingRef.current = state.remaining;
        localStorage.setItem(TIMER_LS_KEY, JSON.stringify({ endTime: endTimeRef.current }));
      } else {
        // Check if this is a user adjustment (remaining jumped by more than 1s)
        const expectedDecrement = prevRemainingRef.current - 1;
        if (prevRemainingRef.current >= 0 && Math.abs(state.remaining - expectedDecrement) > 1) {
          // Adjustment detected — rebase endTime from new remaining
          endTimeRef.current = Date.now() + state.remaining * 1000;
          localStorage.setItem(TIMER_LS_KEY, JSON.stringify({ endTime: endTimeRef.current }));
        }
        prevRemainingRef.current = state.remaining;
      }
    } else {
      timerRunningRef.current = false;
      endTimeRef.current = 0;
      prevRemainingRef.current = -1;
      localStorage.removeItem(TIMER_LS_KEY);
    }
  }, [state.active, state.remaining]);

  // Interval: compute remaining from endTimeRef (accurate even after backgrounding)
  useEffect(() => {
    if (!state.active) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      if (endTimeRef.current > 0) {
        const rem = Math.max(0, Math.floor((endTimeRef.current - Date.now()) / 1000));
        onTick(rem);
      }
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [state.active, state.remaining]);

  // CHANGE 7: visibilitychange — recalculate when tab comes back to foreground
  useEffect(() => {
    if (!state.active) return;
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && endTimeRef.current > 0) {
        const rem = Math.max(0, Math.floor((endTimeRef.current - Date.now()) / 1000));
        onTick(rem);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [state.active, state.remaining]);

  // Completion detection
  useEffect(() => {
    if (state.remaining === 0 && state.active && !flashRef.current) {
      flashRef.current = true;
      if ("vibrate" in navigator) navigator.vibrate([200, 100, 200]);
      playTimerEndSound();
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

  // CHANGE 8: doubled SVG ring (R=44, was R=22)
  const R = 44, CIRC = 2 * Math.PI * R;
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

          {/* CHANGE 8: centered large ring */}
          <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
            <div style={{ position: "relative", width: 104, height: 104, flexShrink: 0 }}>
              <svg width="104" height="104" viewBox="0 0 104 104" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="52" cy="52" r={R} fill="none" stroke={surfaceContainerHighest} strokeWidth="8"/>
                <circle cx="52" cy="52" r={R} fill="none"
                  stroke={isDone ? "#B3261E" : primaryColor} strokeWidth="8"
                  strokeDasharray={`${dash} ${CIRC}`}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dasharray 1s linear, stroke .3s" }}
                />
              </svg>
              <div style={{
                position: "absolute", inset: 0, display: "flex",
                alignItems: "center", justifyContent: "center",
                fontSize: isDone ? 36 : 26, fontWeight: 900,
                color: isDone ? "#B3261E" : primaryColor, fontFamily: FONT,
              }}>
                {isDone ? "✓" : timeStr}
              </div>
            </div>
          </div>

          {/* Exercise name / done text */}
          <div style={{
            textAlign: "center", fontSize: 13, fontWeight: 800,
            color: onSurface, fontFamily: FONT, padding: "2px 16px 0", lineHeight: 1.2,
          }}>
            {isDone ? "Rest complete — crush it!" : `Rest · ${state.exerciseName}`}
          </div>

          {/* Controls row: −10, +10, Skip/Dismiss */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "8px 12px 14px" }}>
            {!isDone && (
              <>
                <button onClick={() => onAdjust?.(-10)} style={{
                  background: surfaceContainerHighest, border: "none",
                  borderRadius: 100, padding: "6px 14px", fontSize: 11,
                  fontWeight: 700, color: onSurfaceVariant, fontFamily: FONT, cursor: "pointer",
                }}>−10</button>
                <button onClick={() => onAdjust?.(10)} style={{
                  background: secondaryContainer, border: "none",
                  borderRadius: 100, padding: "6px 14px", fontSize: 11,
                  fontWeight: 700, color: onSecondaryContainer, fontFamily: FONT, cursor: "pointer",
                }}>+10</button>
              </>
            )}
            <button onClick={onSkip} style={{
              background: primaryContainer, border: "none",
              borderRadius: 100, padding: "8px 20px",
              fontSize: 12, fontWeight: 700,
              color: onPrimaryContainer, fontFamily: FONT, cursor: "pointer",
            }}>
              {isDone ? "Dismiss" : "Skip"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
