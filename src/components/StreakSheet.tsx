import { useMemo, type JSX } from "react";
import type { WorkoutLog } from "../App";

const FONT = `"Nunito","Google Sans","Helvetica Neue",sans-serif`;

// Returns Monday of the week containing date d
function weekStart(d: Date): Date {
  const day = d.getDay(); // 0=Sun
  const diff = (day === 0 ? -6 : 1 - day);
  const m = new Date(d);
  m.setDate(m.getDate() + diff);
  m.setHours(0,0,0,0);
  return m;
}
function isoDate(d: Date): string { return d.toISOString().slice(0,10); }
function addDays(d: Date, n: number): Date { const r=new Date(d); r.setDate(r.getDate()+n); return r; }

interface Props {
  logs: WorkoutLog[];
  weeklyGoal: number;
  longestStreak: number;
  onClose: () => void;
  primaryColor?: string;
  primaryContainer?: string;
  onPrimaryContainer?: string;
  surface?: string;
  surfaceContainerHighest?: string;
  onSurface?: string;
  onSurfaceVariant?: string;
  outlineVariant?: string;
}

export function StreakSheet({
  logs, weeklyGoal, longestStreak, onClose,
  primaryColor="#4F378B",
  primaryContainer="#EADDFF",
  onPrimaryContainer="#21005D",
  surface="#FFFBFE",
  surfaceContainerHighest="#E6E0EB",
  onSurface="#1C1B1F",
  onSurfaceVariant="#49454F",
  outlineVariant="#CAC4D0",
}: Props): JSX.Element {
  const now = new Date();
  const thisWeekStart = weekStart(now);

  // Build weekly workout count map: weekStartISO → count
  const weekCounts = useMemo(() => {
    const map: Record<string,number> = {};
    logs.forEach(w => {
      const d = new Date(w.completed_at);
      const ws = isoDate(weekStart(d));
      map[ws] = (map[ws]||0) + 1;
    });
    return map;
  }, [logs]);

  // This week's count
  const thisWeekCount = weekCounts[isoDate(thisWeekStart)] || 0;

  // Streak: consecutive completed weeks going back from LAST week (not including current)
  const currentStreak = useMemo(() => {
    let streak = 0;
    let cursor = new Date(thisWeekStart);
    // Check if this week meets goal — if so count it too
    if (thisWeekCount >= weeklyGoal) {
      streak++;
      cursor = addDays(cursor, -7);
    } else {
      cursor = addDays(cursor, -7);
    }
    for (let i = 0; i < 52; i++) {
      const key = isoDate(cursor);
      if ((weekCounts[key]||0) >= weeklyGoal) { streak++; cursor = addDays(cursor,-7); }
      else break;
    }
    return streak;
  }, [weekCounts, weeklyGoal, thisWeekCount]);

  // 8-week history
  const weeks = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => {
      const ws = addDays(thisWeekStart, -(7 - i) * 7);
      const key = isoDate(ws);
      const count = weekCounts[key] || 0;
      const isCurrent = key === isoDate(thisWeekStart);
      const label = ws.toLocaleDateString("en-US", { month:"numeric", day:"numeric" });
      let status: "met"|"progress"|"missed" = "missed";
      if (count >= weeklyGoal) status = "met";
      else if (isCurrent && count > 0) status = "progress";
      return { key, label, count, isCurrent, status };
    });
  }, [weekCounts, thisWeekStart, weeklyGoal]);

  const progressPct = Math.min(1, thisWeekCount / weeklyGoal) * 100;

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(28,27,31,.55)",backdropFilter:"blur(6px)",zIndex:600,display:"flex",alignItems:"flex-end",justifyContent:"center" }}
      onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div style={{ width:"100%",maxWidth:430,background:surface,borderRadius:"28px 28px 0 0",maxHeight:"85vh",overflowY:"auto",animation:"slideUp .45s cubic-bezier(.34,1.56,.64,1)" }}>
        <div className="sheet-handle"/>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 20px 8px" }}>
          <div style={{ fontSize:22,fontWeight:900,color:onSurface,fontFamily:FONT }}>🔥 Streak</div>
          <button onClick={onClose} style={{ width:36,height:36,borderRadius:"50%",background:surfaceContainerHighest,border:"none",fontSize:18,color:onSurfaceVariant,cursor:"pointer" }}>✕</button>
        </div>

        <div style={{ padding:"0 20px 48px" }}>
          {/* Current streak */}
          <div style={{ background:primaryContainer,borderRadius:20,padding:"18px 20px",marginBottom:16,textAlign:"center" }}>
            <div style={{ fontSize:52,fontWeight:900,color:primaryColor,fontFamily:FONT,lineHeight:1 }}>{currentStreak}</div>
            <div style={{ fontSize:14,color:onPrimaryContainer,fontFamily:FONT,marginTop:4 }}>week{currentStreak!==1?"s":""} streak</div>
          </div>

          {/* Goal & progress */}
          <div style={{ fontSize:13,color:onSurfaceVariant,fontFamily:FONT,marginBottom:8 }}>
            Goal: <strong style={{ color:onSurface }}>{weeklyGoal} workout{weeklyGoal!==1?"s":""} / week</strong>
          </div>
          <div style={{ fontSize:13,color:onSurfaceVariant,fontFamily:FONT,marginBottom:8 }}>
            <strong style={{ color:onSurface }}>{thisWeekCount} of {weeklyGoal}</strong> done this week
          </div>
          <div style={{ background:surfaceContainerHighest,borderRadius:100,height:8,marginBottom:16,overflow:"hidden" }}>
            <div style={{ height:"100%",width:`${progressPct}%`,background:primaryColor,borderRadius:100,transition:"width .4s ease" }}/>
          </div>

          {/* 8-week mini history */}
          <div style={{ fontSize:12,fontWeight:700,color:onSurfaceVariant,fontFamily:FONT,letterSpacing:".6px",textTransform:"uppercase",marginBottom:10 }}>
            Last 8 Weeks
          </div>
          <div style={{ display:"flex",gap:6 }}>
            {weeks.map(w => (
              <div key={w.key} style={{ flex:1,textAlign:"center" }}>
                <div style={{
                  height:36,borderRadius:10,marginBottom:4,
                  background: w.status==="met" ? "#4CAF50" : w.status==="progress" ? "#FFC107" : surfaceContainerHighest,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  border: w.isCurrent ? `2px solid ${primaryColor}` : "2px solid transparent",
                  transition:"background .2s",
                }}>
                  <span style={{ fontSize:11,fontWeight:700,color: w.status==="missed" ? onSurfaceVariant : "#fff" }}>
                    {w.count}
                  </span>
                </div>
                <div style={{ fontSize:9,color:onSurfaceVariant,fontFamily:FONT }}>{w.label}</div>
              </div>
            ))}
          </div>

          <div style={{ borderTop:`1px solid ${outlineVariant}`,marginTop:20,paddingTop:16 }}>
            <div style={{ fontSize:13,color:onSurfaceVariant,fontFamily:FONT }}>
              Longest streak: <strong style={{ color:onSurface }}>{longestStreak} week{longestStreak!==1?"s":""}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
