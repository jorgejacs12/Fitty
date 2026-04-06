import { useState, type JSX } from "react";

const FONT = `"Nunito","Google Sans","Helvetica Neue",sans-serif`;

// Fatigue colors
const COLOR = {
  fresh:    "#C8E6C9", // 3+ days ago
  moderate: "#FFF9C4", // 2 days ago
  high:     "#FFE0B2", // 1 day ago
  peak:     "#FFCDD2", // today
  none:     "#F3EDF7", // never
};
const LABEL: Record<string, string> = {
  fresh:"Fresh (3+ days)", moderate:"Moderate (2 days)", high:"Sore (1 day)", peak:"Trained today", none:"Not yet trained",
};

export interface RoutineFatigue {
  routineName: string;  // "Push Day" | "Pull Day" | "Leg Day" | "Upper Body" | "Misc / Isolation"
  lastDoneDate: string | null; // ISO date string or null
}

interface MuscleZone {
  id: string;
  label: string;
  routines: string[];
  frontPaths?: string;
  backPaths?: string;
  side: "front" | "back" | "both";
}

const ZONES: MuscleZone[] = [
  { id:"chest",     label:"Chest",         routines:["Push Day","Upper Body"],            side:"front", frontPaths:"M 60,72 Q 70,65 80,70 Q 82,85 70,90 Q 60,88 58,78 Z M 120,72 Q 110,65 100,70 Q 98,85 110,90 Q 120,88 122,78 Z" },
  { id:"frontdelt", label:"Front Delts",   routines:["Push Day","Upper Body"],            side:"front", frontPaths:"M 48,65 Q 55,58 62,65 Q 58,75 52,76 Z M 132,65 Q 125,58 118,65 Q 122,75 128,76 Z" },
  { id:"triceps",   label:"Triceps",       routines:["Push Day","Upper Body"],            side:"back",  backPaths:"M 46,70 Q 52,65 56,73 Q 54,83 48,82 Z M 134,70 Q 128,65 124,73 Q 126,83 132,82 Z" },
  { id:"sidedelt",  label:"Side Delts",    routines:["Push Day"],                         side:"both",  frontPaths:"M 44,60 Q 52,54 56,63 Q 50,68 46,66 Z M 136,60 Q 128,54 124,63 Q 130,68 134,66 Z", backPaths:"M 44,60 Q 52,54 56,63 Q 50,68 46,66 Z M 136,60 Q 128,54 124,63 Q 130,68 134,66 Z" },
  { id:"back",      label:"Back",          routines:["Pull Day","Upper Body"],            side:"back",  backPaths:"M 68,68 Q 90,62 112,68 Q 114,100 90,106 Q 66,100 68,68 Z" },
  { id:"reardelt",  label:"Rear Delts",    routines:["Pull Day","Upper Body"],            side:"back",  backPaths:"M 54,60 Q 62,55 68,62 Q 64,70 58,70 Z M 126,60 Q 118,55 112,62 Q 116,70 122,70 Z" },
  { id:"biceps",    label:"Biceps",        routines:["Pull Day","Upper Body"],            side:"front", frontPaths:"M 44,70 Q 50,65 54,73 Q 52,83 46,82 Z M 136,70 Q 130,65 126,73 Q 128,83 134,82 Z" },
  { id:"quads",     label:"Quads",         routines:["Leg Day"],                          side:"front", frontPaths:"M 66,120 Q 78,115 82,140 Q 78,158 70,158 Q 62,155 62,138 Z M 114,120 Q 102,115 98,140 Q 102,158 110,158 Q 118,155 118,138 Z" },
  { id:"hamstrings",label:"Hamstrings",    routines:["Leg Day"],                          side:"back",  backPaths:"M 66,120 Q 78,115 82,140 Q 78,158 70,158 Q 62,155 62,138 Z M 114,120 Q 102,115 98,140 Q 102,158 110,158 Q 118,155 118,138 Z" },
  { id:"glutes",    label:"Glutes",        routines:["Leg Day"],                          side:"back",  backPaths:"M 65,108 Q 90,103 115,108 Q 118,125 90,128 Q 62,125 65,108 Z" },
  { id:"calves",    label:"Calves",        routines:["Leg Day","Misc / Isolation"],       side:"back",  backPaths:"M 68,160 Q 78,157 80,175 Q 78,188 72,188 Q 66,185 66,172 Z M 112,160 Q 102,157 100,175 Q 102,188 108,188 Q 114,185 114,172 Z" },
  { id:"abs",       label:"Abs / Core",    routines:["Misc / Isolation"],                 side:"front", frontPaths:"M 78,92 Q 90,89 102,92 Q 104,118 90,120 Q 76,118 78,92 Z" },
];

function daysSince(dateStr: string | null): number {
  if (!dateStr) return 999;
  const d = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

function fatigueColor(days: number): string {
  if (days === 0) return COLOR.peak;
  if (days === 1) return COLOR.high;
  if (days === 2) return COLOR.moderate;
  if (days < 999) return COLOR.fresh;
  return COLOR.none;
}
// Simple SVG torso silhouettes
function FrontBody({ zoneColors, onZone }: { zoneColors: Record<string,string>; onZone: (id:string)=>void }): JSX.Element {
  return (
    <svg viewBox="0 0 180 220" width="100%" style={{ maxWidth: 130, display:"block", margin:"0 auto" }}>
      {/* Body outline */}
      <ellipse cx="90" cy="55" rx="28" ry="32" fill="#E8E0EF" stroke="#C4BCCF" strokeWidth="1.5"/>
      {/* Torso */}
      <path d="M 60,80 Q 58,130 62,170 Q 90,175 118,170 Q 122,130 120,80 Q 90,92 60,80 Z" fill="#E8E0EF" stroke="#C4BCCF" strokeWidth="1.5"/>
      {/* Arms */}
      <path d="M 58,80 Q 42,90 36,140 Q 44,144 50,140 Q 54,100 62,86 Z" fill="#E8E0EF" stroke="#C4BCCF" strokeWidth="1.5"/>
      <path d="M 122,80 Q 138,90 144,140 Q 136,144 130,140 Q 126,100 118,86 Z" fill="#E8E0EF" stroke="#C4BCCF" strokeWidth="1.5"/>
      {/* Legs */}
      <path d="M 62,170 Q 58,200 60,215 Q 78,217 82,215 Q 84,200 82,170 Z" fill="#E8E0EF" stroke="#C4BCCF" strokeWidth="1.5"/>
      <path d="M 118,170 Q 122,200 120,215 Q 102,217 98,215 Q 96,200 98,170 Z" fill="#E8E0EF" stroke="#C4BCCF" strokeWidth="1.5"/>

      {/* Muscle zones */}
      {ZONES.filter(z => z.side !== "back" && z.frontPaths).map(z => (
        <path key={z.id} d={z.frontPaths!} fill={zoneColors[z.id]||COLOR.none} stroke="#fff" strokeWidth="1"
          style={{ cursor:"pointer", opacity:0.85, transition:"opacity .2s" }}
          onClick={() => onZone(z.id)}/>
      ))}
    </svg>
  );
}

function BackBody({ zoneColors, onZone }: { zoneColors: Record<string,string>; onZone: (id:string)=>void }): JSX.Element {
  return (
    <svg viewBox="0 0 180 220" width="100%" style={{ maxWidth: 130, display:"block", margin:"0 auto" }}>
      {/* Body outline (mirror) */}
      <ellipse cx="90" cy="55" rx="28" ry="32" fill="#E8E0EF" stroke="#C4BCCF" strokeWidth="1.5"/>
      <path d="M 60,80 Q 58,130 62,170 Q 90,175 118,170 Q 122,130 120,80 Q 90,92 60,80 Z" fill="#E8E0EF" stroke="#C4BCCF" strokeWidth="1.5"/>
      <path d="M 58,80 Q 42,90 36,140 Q 44,144 50,140 Q 54,100 62,86 Z" fill="#E8E0EF" stroke="#C4BCCF" strokeWidth="1.5"/>
      <path d="M 122,80 Q 138,90 144,140 Q 136,144 130,140 Q 126,100 118,86 Z" fill="#E8E0EF" stroke="#C4BCCF" strokeWidth="1.5"/>
      <path d="M 62,170 Q 58,200 60,215 Q 78,217 82,215 Q 84,200 82,170 Z" fill="#E8E0EF" stroke="#C4BCCF" strokeWidth="1.5"/>
      <path d="M 118,170 Q 122,200 120,215 Q 102,217 98,215 Q 96,200 98,170 Z" fill="#E8E0EF" stroke="#C4BCCF" strokeWidth="1.5"/>

      {ZONES.filter(z => z.side !== "front" && z.backPaths).map(z => (
        <path key={z.id} d={z.backPaths!} fill={zoneColors[z.id]||COLOR.none} stroke="#fff" strokeWidth="1"
          style={{ cursor:"pointer", opacity:0.85, transition:"opacity .2s" }}
          onClick={() => onZone(z.id)}/>
      ))}
    </svg>
  );
}

interface Props {
  routineFatigue: RoutineFatigue[];
  surfaceContainerHighest?: string;
  onSurface?: string;
  onSurfaceVariant?: string;
}

export function FatigueMap({ routineFatigue, surfaceContainerHighest="#E6E0EB", onSurface="#1C1B1F", onSurfaceVariant="#49454F" }: Props): JSX.Element {
  const [tooltip, setTooltip] = useState<string|null>(null);

  // Build zone → days map
  const zoneColors: Record<string,string> = {};
  const zoneDays: Record<string,number> = {};

  ZONES.forEach(zone => {
    let minDays = 999;
    zone.routines.forEach(rname => {
      const rf = routineFatigue.find(r => r.routineName === rname);
      if (rf) {
        const d = daysSince(rf.lastDoneDate);
        if (d < minDays) minDays = d;
      }
    });
    zoneDays[zone.id] = minDays;
    zoneColors[zone.id] = fatigueColor(minDays);
  });

  const handleZone = (id: string) => {
    const zone = ZONES.find(z => z.id === id);
    if (!zone) return;
    const days = zoneDays[id];
    const dateLabel = days >= 999 ? "Never" : days === 0 ? "Today" : `${days} day${days>1?"s":""} ago`;
    setTooltip(`${zone.label} · ${dateLabel}`);
    setTimeout(() => setTooltip(null), 2500);
  };

  return (
    <div style={{ background: surfaceContainerHighest, borderRadius: 28, padding: "16px", margin: "0 0 16px" }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: onSurface, fontFamily: FONT, marginBottom: 12 }}>
        💪 Muscle Fatigue
      </div>

      {tooltip && (
        <div style={{ background: "#1C1B1F", color: "#fff", borderRadius: 12, padding: "6px 14px", fontSize: 12, fontWeight: 700, fontFamily: FONT, textAlign: "center", marginBottom: 10 }}>
          {tooltip}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: onSurfaceVariant, fontFamily: FONT, textAlign:"center", marginBottom: 4, fontWeight:700 }}>FRONT</div>
          <FrontBody zoneColors={zoneColors} onZone={handleZone}/>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: onSurfaceVariant, fontFamily: FONT, textAlign:"center", marginBottom: 4, fontWeight:700 }}>BACK</div>
          <BackBody zoneColors={zoneColors} onZone={handleZone}/>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12, justifyContent: "center" }}>
        {(["peak","high","moderate","fresh","none"] as const).map(k => (
          <div key={k} style={{ display:"flex", alignItems:"center", gap:4 }}>
            <div style={{ width:10, height:10, borderRadius:3, background: COLOR[k], border:"1px solid #ccc" }}/>
            <span style={{ fontSize:9, color:onSurfaceVariant, fontFamily:FONT }}>{LABEL[k]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
