import { useMemo, type JSX } from "react";
import type { PersonalRecord } from "../lib/db";
import tigerSrc from "../assets/tiger-logo.png";

const FONT = `"Nunito","Google Sans","Helvetica Neue",sans-serif`;

function medalEmoji(pr: PersonalRecord): string {
  const days = (Date.now() - new Date(pr.achieved_at).getTime()) / (1000*60*60*24);
  if (days <= 7) return "🥉";
  if (days <= 30) return "🥈";
  return "🥇";
}

interface Props {
  prs: PersonalRecord[];
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

export function PRSheet({
  prs, onClose,
  primaryColor="var(--fp)",
  primaryContainer:_pc="var(--fpc)",
  onPrimaryContainer:_opc="var(--fopc)",
  surface="#FFFBFE",
  surfaceContainerHighest="#E6E0EB",
  onSurface="#1C1B1F",
  onSurfaceVariant="#49454F",
  outlineVariant="#CAC4D0",
}: Props): JSX.Element {
  // Best PR per exercise (by estimated_1rm), sorted newest first
  const grouped = useMemo(() => {
    const map: Record<string, PersonalRecord> = {};
    prs.forEach(pr => {
      const existing = map[pr.exercise_name];
      if (!existing || pr.estimated_1rm > existing.estimated_1rm) {
        map[pr.exercise_name] = pr;
      }
    });
    return Object.values(map).sort((a,b) =>
      new Date(b.achieved_at).getTime() - new Date(a.achieved_at).getTime()
    );
  }, [prs]);

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(28,27,31,.55)",backdropFilter:"blur(6px)",zIndex:600,display:"flex",alignItems:"flex-end",justifyContent:"center" }}
      onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div style={{ width:"100%",maxWidth:430,background:surface,borderRadius:"28px 28px 0 0",maxHeight:"85dvh",overflowY:"auto",animation:"slideUp .45s cubic-bezier(.34,1.56,.64,1)" }}>
        <div className="sheet-handle"/>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 20px 8px" }}>
          <div style={{ fontSize:22,fontWeight:900,color:onSurface,fontFamily:FONT }}>🏆 Personal Records</div>
          <button onClick={onClose} style={{ width:44,height:44,borderRadius:"50%",background:surfaceContainerHighest,border:"none",fontSize:18,color:onSurfaceVariant,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>✕</button>
        </div>

        <div style={{ padding:"0 20px 48px" }}>
          {grouped.length === 0 ? (
            <div style={{ textAlign:"center",padding:"40px 0" }}>
              <img src={tigerSrc} alt="" width={72} height={72} style={{ objectFit:"contain",marginBottom:16,opacity:.5 }}/>
              <div style={{ fontSize:16,fontWeight:700,color:onSurface,fontFamily:FONT,marginBottom:6 }}>No PRs yet</div>
              <div style={{ fontSize:13,color:onSurfaceVariant,fontFamily:FONT }}>Start logging to track your bests</div>
            </div>
          ) : (
            grouped.map((pr, i) => {
              const medal = medalEmoji(pr);
              const date = new Date(pr.achieved_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
              return (
                <div key={pr.id} style={{
                  display:"flex",alignItems:"center",gap:12,
                  padding:"12px 0",
                  borderBottom: i<grouped.length-1 ? `1px solid ${outlineVariant}` : "none",
                  animation:`stagger .25s ${i*40}ms both`,
                }}>
                  <div style={{ fontSize:26,flexShrink:0 }}>{medal}</div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontSize:14,fontWeight:800,color:onSurface,fontFamily:FONT,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{pr.exercise_name}</div>
                    <div style={{ fontSize:12,color:onSurfaceVariant,fontFamily:FONT,marginTop:2 }}>{date}</div>
                  </div>
                  <div style={{ textAlign:"right",flexShrink:0 }}>
                    <div style={{ fontSize:16,fontWeight:900,color:primaryColor,fontFamily:FONT }}>{pr.weight} × {pr.reps}</div>
                    <div style={{ fontSize:11,color:onSurfaceVariant,fontFamily:FONT }}>~{pr.estimated_1rm.toFixed(1)} 1RM</div>
                  </div>
                </div>
              );
            })
          )}

          {/* Legend */}
          {grouped.length > 0 && (
            <div style={{ display:"flex",gap:16,paddingTop:16,justifyContent:"center" }}>
              {[["🥇","All-time"],["🥈","Last 30d"],["🥉","This week"]].map(([em,lbl])=>(
                <div key={lbl} style={{ display:"flex",alignItems:"center",gap:4 }}>
                  <span style={{ fontSize:16 }}>{em}</span>
                  <span style={{ fontSize:11,color:onSurfaceVariant,fontFamily:FONT }}>{lbl}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
