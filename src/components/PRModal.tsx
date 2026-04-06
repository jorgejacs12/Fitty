import type { JSX } from "react";

const M = {
  primary: "#4F378B", onPrimary: "#FFFFFF",
  primaryContainer: "#EADDFF", onPrimaryContainer: "#21005D",
  secondaryContainer: "#E8DEF8", onSecondaryContainer: "#1D192B",
  tertiaryContainer: "#FFD8E4", onTertiaryContainer: "#31111D",
  surface: "#FFFBFE", surfaceContainerHighest: "#E6E0EB",
  onSurface: "#1C1B1F", onSurfaceVariant: "#49454F",
};
const FONT = `"Nunito","Google Sans","Helvetica Neue",sans-serif`;

export type PRTier = "gold" | "silver" | "bronze";

export interface PRInfo {
  exerciseName: string;
  weight: number;
  reps: number;
  estimated1RM: number;
  tier: PRTier;
}

interface PRModalProps {
  pr: PRInfo;
  onClose: () => void;
}

const TIER_META: Record<PRTier, { emoji: string; label: string; bg: string; fg: string; desc: string }> = {
  gold: {
    emoji: "🥇",
    label: "ALL-TIME PR",
    bg: "#FFF8E1",
    fg: "#E65100",
    desc: "You just set an all-time personal record!",
  },
  silver: {
    emoji: "🥈",
    label: "30-DAY PR",
    bg: "#ECEFF1",
    fg: "#37474F",
    desc: "Best weight in the last 30 days!",
  },
  bronze: {
    emoji: "🥉",
    label: "WEEKLY PR",
    bg: "#FBE9E7",
    fg: "#BF360C",
    desc: "Best weight this week!",
  },
};

export function PRModal({ pr, onClose }: PRModalProps): JSX.Element {
  const meta = TIER_META[pr.tier];
  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(28,27,31,.65)",
        backdropFilter: "blur(6px)",
        zIndex: 700,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "0 24px",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: "100%", maxWidth: 360,
        background: M.surface,
        borderRadius: 32,
        padding: "32px 24px",
        animation: "scaleIn .45s cubic-bezier(.34,1.56,.64,1)",
        textAlign: "center",
        boxShadow: "0 8px 40px rgba(79,55,139,.35)",
      }}>
        {/* Medal */}
        <div style={{
          fontSize: 72, lineHeight: 1,
          animation: "navBounce .6s cubic-bezier(.34,1.56,.64,1) .1s both",
          marginBottom: 8,
        }}>
          {meta.emoji}
        </div>

        {/* Badge */}
        <div style={{
          display: "inline-flex",
          background: meta.bg,
          borderRadius: 100,
          padding: "5px 16px",
          marginBottom: 16,
        }}>
          <span style={{
            fontSize: 11, fontWeight: 800,
            color: meta.fg,
            fontFamily: FONT,
            letterSpacing: ".8px",
          }}>
            {meta.label}
          </span>
        </div>

        {/* Exercise name */}
        <div style={{
          fontSize: 22, fontWeight: 900,
          color: M.onSurface, fontFamily: FONT,
          letterSpacing: "-.3px", marginBottom: 4,
        }}>
          {pr.exerciseName}
        </div>

        {/* Weight / reps */}
        <div style={{
          fontSize: 42, fontWeight: 900,
          color: M.primary, fontFamily: FONT,
          lineHeight: 1, marginBottom: 4,
        }}>
          {pr.weight} <span style={{ fontSize: 18, fontWeight: 600, color: M.onSurfaceVariant }}>kg</span>
        </div>
        <div style={{
          fontSize: 14, color: M.onSurfaceVariant,
          fontFamily: FONT, marginBottom: 16,
        }}>
          × {pr.reps} reps
        </div>

        {/* Estimated 1RM */}
        <div style={{
          background: M.primaryContainer,
          borderRadius: 20, padding: "14px 20px",
          marginBottom: 20,
        }}>
          <div style={{
            fontSize: 11, fontWeight: 700,
            color: M.onPrimaryContainer,
            letterSpacing: ".6px", textTransform: "uppercase",
            fontFamily: FONT, marginBottom: 4,
          }}>
            Estimated 1RM (Epley)
          </div>
          <div style={{
            fontSize: 28, fontWeight: 900,
            color: M.primary, fontFamily: FONT,
          }}>
            {pr.estimated1RM.toFixed(1)} kg
          </div>
        </div>

        <div style={{
          fontSize: 13, color: M.onSurfaceVariant,
          fontFamily: FONT, marginBottom: 20,
        }}>
          {meta.desc}
        </div>

        <button
          onClick={onClose}
          style={{
            width: "100%", background: M.primary,
            color: M.onPrimary, border: "none",
            borderRadius: 20, padding: 16,
            fontSize: 15, fontWeight: 800,
            fontFamily: FONT, cursor: "pointer",
          }}
        >
          Keep Going! 💪
        </button>
      </div>
    </div>
  );
}

// Badge shown inline next to exercise name during active workout
export function PRBadge({ tier }: { tier: PRTier }): JSX.Element {
  const meta = TIER_META[tier];
  return (
    <span title={meta.label} style={{
      fontSize: 16, marginLeft: 4,
    }}>
      {meta.emoji}
    </span>
  );
}
