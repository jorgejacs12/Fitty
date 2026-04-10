import { useState, type JSX } from "react";

const M = {
  primary: "#4F378B", onPrimary: "#FFFFFF",
  primaryContainer: "#EADDFF", onPrimaryContainer: "#21005D",
  surface: "#FFFBFE", surfaceContainerHighest: "#E6E0EB",
  onSurface: "#1C1B1F", onSurfaceVariant: "#49454F",
  outlineVariant: "#CAC4D0",
};
const FONT = `"Nunito","Google Sans","Helvetica Neue",sans-serif`;

const MUSCLE_GROUPS = [
  "Chest", "Back", "Shoulders", "Biceps", "Triceps", "Forearms",
  "Quads", "Hamstrings", "Glutes", "Calves", "Core", "Full Body",
];
const EQUIPMENT = [
  "Barbell", "Dumbbell", "Cable", "Machine", "Bodyweight",
  "Kettlebell", "Resistance Band", "Smith Machine", "Other",
];

interface Props {
  onSave: (name: string, muscleGroup: string, equipment: string) => Promise<void>;
  onClose: () => void;
}

export function CustomExerciseModal({ onSave, onClose }: Props): JSX.Element {
  const [name, setName] = useState("");
  const [muscle, setMuscle] = useState(MUSCLE_GROUPS[0]);
  const [equip, setEquip] = useState(EQUIPMENT[0]);
  const [saving, setSaving] = useState(false);

  const handle = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await onSave(name.trim(), muscle, equip);
    setSaving(false);
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(28,27,31,.6)", backdropFilter: "blur(6px)",
        zIndex: 500, display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: "100%", maxWidth: 430,
        background: M.surface, borderRadius: "28px 28px 0 0",
        padding: "0 0 48px",
        animation: "slideUp .5s cubic-bezier(.34,1.56,.64,1)",
      }}>
        <div style={{ width: 32, height: 4, background: "#CAC4D0", borderRadius: 2, margin: "10px auto 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px 12px" }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: M.onSurface, fontFamily: FONT }}>New Exercise</div>
          <button
            onClick={onClose}
            style={{
              width: 44, height: 44, borderRadius: "50%",
              background: M.surfaceContainerHighest, border: "none",
              fontSize: 18, color: M.onSurfaceVariant, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >✕</button>
        </div>
        <div style={{ padding: "0 20px" }}>
          {/* Name */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: M.onSurfaceVariant, fontFamily: FONT, textTransform: "uppercase", letterSpacing: ".6px", marginBottom: 6 }}>
              Exercise Name *
            </div>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Meadows Row"
              style={{
                width: "100%", background: M.surfaceContainerHighest,
                border: "none", borderRadius: 14, padding: "12px 16px",
                fontFamily: FONT, fontSize: 16, color: M.onSurface, outline: "none",
              }}
            />
          </div>

          {/* Muscle group */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: M.onSurfaceVariant, fontFamily: FONT, textTransform: "uppercase", letterSpacing: ".6px", marginBottom: 6 }}>
              Primary Muscle Group
            </div>
            <select
              value={muscle}
              onChange={e => setMuscle(e.target.value)}
              style={{
                width: "100%", background: M.surfaceContainerHighest,
                border: "none", borderRadius: 14, padding: "12px 16px",
                fontFamily: FONT, fontSize: 16, color: M.onSurface, outline: "none",
              }}
            >
              {MUSCLE_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          {/* Equipment */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: M.onSurfaceVariant, fontFamily: FONT, textTransform: "uppercase", letterSpacing: ".6px", marginBottom: 6 }}>
              Equipment
            </div>
            <select
              value={equip}
              onChange={e => setEquip(e.target.value)}
              style={{
                width: "100%", background: M.surfaceContainerHighest,
                border: "none", borderRadius: 14, padding: "12px 16px",
                fontFamily: FONT, fontSize: 16, color: M.onSurface, outline: "none",
              }}
            >
              {EQUIPMENT.map(eq => <option key={eq} value={eq}>{eq}</option>)}
            </select>
          </div>

          <button
            onClick={handle}
            disabled={saving || !name.trim()}
            style={{
              width: "100%", background: M.primary,
              color: M.onPrimary, border: "none",
              borderRadius: 20, padding: 16,
              fontSize: 15, fontWeight: 800, fontFamily: FONT,
              cursor: (saving || !name.trim()) ? "default" : "pointer",
              opacity: (saving || !name.trim()) ? 0.6 : 1,
            }}
          >
            {saving ? "Saving…" : "Save Exercise"}
          </button>
        </div>
      </div>
    </div>
  );
}
