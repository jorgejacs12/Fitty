import type { JSX } from "react";

// Color palette — matches M3 design system in App.tsx
const P  = "#4F378B";  // purple — tiger body
const PC = "#EADDFF";  // lavender — stripes & highlights
const TC = "#FFD8E4";  // rose — barbell plates
const BD = "#5C4B7A";  // darker purple — muzzle
const BR = "#1C1B1F";  // ink — bar, pupils
const PL = "#CAC4D0";  // grey — platforms, benches, ground

// Tiger CSS keyframe animations — injected once alongside main CSS
export const TIGER_CSS = `
@keyframes tg-press{0%,100%{transform:translateY(0)}45%{transform:translateY(-11px)}}
.tg-press{animation:tg-press 2s ease-in-out infinite;transform-origin:40px 36px}
@keyframes tg-squat{0%,100%{transform:translateY(0)}50%{transform:translateY(11px)}}
.tg-squat{animation:tg-squat 1.8s ease-in-out infinite;transform-origin:40px 28px}
@keyframes tg-curl{0%,100%{transform:translateY(0)}45%{transform:translateY(-12px)}}
.tg-curl{animation:tg-curl 1.6s ease-in-out infinite;transform-origin:22px 52px}
@keyframes tg-dlLift{0%,100%{transform:translateY(8px) rotate(28deg)}50%{transform:translateY(0) rotate(0deg)}}
.tg-dl{animation:tg-dlLift 2s ease-in-out infinite;transform-origin:40px 46px}
@keyframes tg-ohp{0%,100%{transform:translateY(0)}45%{transform:translateY(-13px)}}
.tg-ohp{animation:tg-ohp 1.7s ease-in-out infinite;transform-origin:40px 28px}
@keyframes tg-lat{0%,100%{transform:rotate(0deg)}45%{transform:rotate(-34deg)}}
.tg-lat-l{animation:tg-lat 1.8s ease-in-out infinite;transform-origin:33px 28px}
.tg-lat-r{animation:tg-lat 1.8s ease-in-out infinite reverse;transform-origin:47px 28px}
@keyframes tg-row{0%,100%{transform:translateX(0)}45%{transform:translateX(12px)}}
.tg-row{animation:tg-row 1.6s ease-in-out infinite;transform-origin:24px 36px}
@keyframes tg-pd{0%,100%{transform:translateY(0)}45%{transform:translateY(9px)}}
.tg-pd{animation:tg-pd 1.7s ease-in-out infinite;transform-origin:40px 20px}
@keyframes tg-cr{0%,100%{transform:rotate(0deg)}45%{transform:rotate(-26deg)}}
.tg-cr{animation:tg-cr 1.8s ease-in-out infinite;transform-origin:40px 52px}
@keyframes tg-lp{0%,100%{transform:translateX(-8px)}50%{transform:translateX(0)}}
.tg-lp{animation:tg-lp 1.7s ease-in-out infinite;transform-origin:30px 42px}
@keyframes tg-cf{0%,100%{transform:translateY(0)}45%{transform:translateY(-12px)}}
.tg-cf{animation:tg-cf 1.6s ease-in-out infinite;transform-origin:40px 42px}
@keyframes tg-fp{0%,100%{transform:translateX(0)}45%{transform:translateX(10px)}}
.tg-fp{animation:tg-fp 1.6s ease-in-out infinite;transform-origin:44px 34px}
@keyframes tg-lng{0%,100%{transform:translateY(0)}50%{transform:translateY(8px)}}
.tg-lng{animation:tg-lng 1.8s ease-in-out infinite;transform-origin:40px 30px}
@keyframes tg-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
.tg-bob{animation:tg-bob 1.6s ease-in-out infinite;transform-origin:40px 40px}
`;

// ── Shared tiger face/head drawing helper ──────────────────────────────────
// Draws full tiger head at (cx, cy) with given radius.
function TigerHead({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const er = r * 0.85; // ear root
  return (
    <>
      {/* Skull */}
      <circle cx={cx} cy={cy} r={r} fill={P} />
      {/* Left ear */}
      <polygon points={`${cx - er * 0.65},${cy - r * 0.35} ${cx - er * 0.3},${cy - r * 1.18} ${cx - er * 0.0},${cy - r * 0.22}`} fill={P} />
      <polygon points={`${cx - er * 0.57},${cy - r * 0.33} ${cx - er * 0.3},${cy - r * 1.0} ${cx - er * 0.05},${cy - r * 0.25}`} fill={PC} opacity="0.65" />
      {/* Right ear */}
      <polygon points={`${cx + er * 0.65},${cy - r * 0.35} ${cx + er * 0.3},${cy - r * 1.18} ${cx + er * 0.0},${cy - r * 0.22}`} fill={P} />
      <polygon points={`${cx + er * 0.57},${cy - r * 0.33} ${cx + er * 0.3},${cy - r * 1.0} ${cx + er * 0.05},${cy - r * 0.25}`} fill={PC} opacity="0.65" />
      {/* Forehead stripe */}
      <line x1={cx} y1={cy - r} x2={cx} y2={cy - r * 0.25} stroke={PC} strokeWidth="1.3" opacity="0.6" strokeLinecap="round" />
      {/* Eye whites */}
      <ellipse cx={cx - r * 0.38} cy={cy - r * 0.12} rx={r * 0.29} ry={r * 0.25} fill="white" />
      <ellipse cx={cx + r * 0.38} cy={cy - r * 0.12} rx={r * 0.29} ry={r * 0.25} fill="white" />
      {/* Pupils */}
      <circle cx={cx - r * 0.35} cy={cy - r * 0.1} r={r * 0.17} fill={BR} />
      <circle cx={cx + r * 0.35} cy={cy - r * 0.1} r={r * 0.17} fill={BR} />
      {/* Catchlights */}
      <circle cx={cx - r * 0.29} cy={cy - r * 0.18} r={r * 0.06} fill="white" />
      <circle cx={cx + r * 0.29} cy={cy - r * 0.18} r={r * 0.06} fill="white" />
      {/* Muzzle */}
      <ellipse cx={cx} cy={cy + r * 0.4} rx={r * 0.46} ry={r * 0.34} fill={BD} opacity="0.85" />
      {/* Nose */}
      <ellipse cx={cx} cy={cy + r * 0.25} rx={r * 0.12} ry={r * 0.09} fill={BR} />
      {/* Mouth */}
      <path d={`M${cx - r * 0.22},${cy + r * 0.46} Q${cx},${cy + r * 0.56} ${cx + r * 0.22},${cy + r * 0.46}`} stroke={BR} strokeWidth="0.9" fill="none" strokeLinecap="round" />
    </>
  );
}

// ── 1. BENCH PRESS ─────────────────────────────────────────────────────────
function tigerBench(): JSX.Element {
  return (
    <svg viewBox="0 0 80 80" style={{ width: "100%", height: "100%" }}>
      {/* Bench */}
      <rect x="8" y="53" width="58" height="7" rx="4" fill={PL} />
      <rect x="12" y="60" width="6" height="13" rx="3" fill={PL} />
      <rect x="56" y="60" width="6" height="13" rx="3" fill={PL} />
      {/* Tiger body lying on bench */}
      <ellipse cx="36" cy="50" rx="22" ry="6" fill={P} />
      {/* Body stripes */}
      <line x1="28" y1="45" x2="27" y2="55" stroke={PC} strokeWidth="1.5" opacity="0.55" strokeLinecap="round" />
      <line x1="36" y1="44" x2="36" y2="56" stroke={PC} strokeWidth="1.5" opacity="0.55" strokeLinecap="round" />
      <line x1="44" y1="45" x2="45" y2="55" stroke={PC} strokeWidth="1.5" opacity="0.55" strokeLinecap="round" />
      {/* Tiger tail (left end) */}
      <ellipse cx="14" cy="50" rx="4" ry="3" fill={P} />
      {/* Head (right, looking up) */}
      <TigerHead cx={63} cy={47} r={8} />
      {/* Neck */}
      <line x1="57" y1="49" x2="55" y2="50" stroke={P} strokeWidth="5" strokeLinecap="round" />
      {/* Shoulder circles */}
      <circle cx="28" cy="48" r="4" fill={P} />
      <circle cx="44" cy="48" r="4" fill={P} />
      {/* Animated arms + barbell (press up/down) */}
      <g className="tg-press">
        {/* Left arm */}
        <line x1="28" y1="46" x2="20" y2="34" stroke={P} strokeWidth="5" strokeLinecap="round" />
        {/* Right arm */}
        <line x1="44" y1="46" x2="52" y2="34" stroke={P} strokeWidth="5" strokeLinecap="round" />
        {/* Bar */}
        <rect x="13" y="31" width="46" height="5" rx="2.5" fill={BR} />
        {/* Plates */}
        <rect x="9" y="27" width="7" height="13" rx="3" fill={TC} />
        <rect x="56" y="27" width="7" height="13" rx="3" fill={TC} />
        {/* Arm stripes */}
        <line x1="24" y1="41" x2="22" y2="38" stroke={PC} strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
        <line x1="48" y1="41" x2="50" y2="38" stroke={PC} strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
      </g>
    </svg>
  );
}

// ── 2. SQUAT ───────────────────────────────────────────────────────────────
function tigerSquat(): JSX.Element {
  return (
    <svg viewBox="0 0 80 80" style={{ width: "100%", height: "100%" }}>
      <g className="tg-squat">
        {/* Head */}
        <TigerHead cx={40} cy={13} r={9} />
        {/* Torso */}
        <rect x="33" y="22" width="14" height="17" rx="5" fill={P} />
        <ellipse cx="40" cy="24" rx="10" ry="4" fill={P} />
        {/* Body stripes */}
        <line x1="37" y1="23" x2="36" y2="37" stroke={PC} strokeWidth="1.5" opacity="0.55" strokeLinecap="round" />
        <line x1="43" y1="23" x2="44" y2="37" stroke={PC} strokeWidth="1.5" opacity="0.55" strokeLinecap="round" />
        {/* Barbell on traps */}
        <rect x="14" y="22" width="52" height="4" rx="2" fill={BR} />
        <rect x="10" y="19" width="6" height="10" rx="3" fill={TC} />
        <rect x="64" y="19" width="6" height="10" rx="3" fill={TC} />
        {/* Arms bent holding bar */}
        <line x1="33" y1="26" x2="22" y2="25" stroke={P} strokeWidth="4" strokeLinecap="round" />
        <line x1="47" y1="26" x2="58" y2="25" stroke={P} strokeWidth="4" strokeLinecap="round" />
        {/* Hips */}
        <ellipse cx="40" cy="41" rx="10" ry="5" fill={P} />
        {/* Left thigh (angled — squat stance) */}
        <line x1="35" y1="43" x2="24" y2="59" stroke={P} strokeWidth="6" strokeLinecap="round" />
        {/* Right thigh */}
        <line x1="45" y1="43" x2="56" y2="59" stroke={P} strokeWidth="6" strokeLinecap="round" />
        {/* Left shin */}
        <line x1="24" y1="59" x2="20" y2="70" stroke={P} strokeWidth="5" strokeLinecap="round" />
        {/* Right shin */}
        <line x1="56" y1="59" x2="60" y2="70" stroke={P} strokeWidth="5" strokeLinecap="round" />
        {/* Knee highlights */}
        <circle cx="24" cy="59" r="3.5" fill={PC} opacity="0.4" />
        <circle cx="56" cy="59" r="3.5" fill={PC} opacity="0.4" />
      </g>
      {/* Ground */}
      <rect x="8" y="70" width="64" height="4" rx="2" fill={PL} />
    </svg>
  );
}

// ── 3. BARBELL CURL ────────────────────────────────────────────────────────
function tigerCurl(): JSX.Element {
  return (
    <svg viewBox="0 0 80 80" style={{ width: "100%", height: "100%" }}>
      {/* Static: head, torso, legs, right arm */}
      <TigerHead cx={40} cy={12} r={8} />
      <rect x="34" y="20" width="12" height="20" rx="5" fill={P} />
      <ellipse cx="40" cy="22" rx="8" ry="3.5" fill={P} />
      <line x1="37" y1="21" x2="36" y2="38" stroke={PC} strokeWidth="1.4" opacity="0.55" strokeLinecap="round" />
      <line x1="43" y1="21" x2="44" y2="38" stroke={PC} strokeWidth="1.4" opacity="0.55" strokeLinecap="round" />
      {/* Right arm (static, hanging) */}
      <line x1="46" y1="26" x2="54" y2="44" stroke={P} strokeWidth="5" strokeLinecap="round" />
      <line x1="54" y1="44" x2="60" y2="55" stroke={P} strokeWidth="4.5" strokeLinecap="round" />
      {/* Right dumbbell head */}
      <ellipse cx="63" cy="56" rx="5" ry="3.5" fill={BR} />
      {/* Legs */}
      <ellipse cx="40" cy="42" rx="9" ry="4.5" fill={P} />
      <line x1="35" y1="44" x2="28" y2="66" stroke={P} strokeWidth="5" strokeLinecap="round" />
      <line x1="45" y1="44" x2="52" y2="66" stroke={P} strokeWidth="5" strokeLinecap="round" />
      <line x1="28" y1="66" x2="24" y2="72" stroke={P} strokeWidth="4" strokeLinecap="round" />
      <line x1="52" y1="66" x2="56" y2="72" stroke={P} strokeWidth="4" strokeLinecap="round" />
      {/* Animated left arm + dumbbell (curling up) */}
      <g className="tg-curl">
        <line x1="34" y1="26" x2="26" y2="44" stroke={P} strokeWidth="5" strokeLinecap="round" />
        <line x1="26" y1="44" x2="20" y2="53" stroke={P} strokeWidth="4.5" strokeLinecap="round" />
        <ellipse cx="17" cy="54" rx="5" ry="3.5" fill={BR} />
        {/* Curl stripe on forearm */}
        <line x1="24" y1="49" x2="22" y2="46" stroke={PC} strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
      </g>
      <rect x="8" y="72" width="64" height="4" rx="2" fill={PL} />
    </svg>
  );
}

// ── 4. DEADLIFT ────────────────────────────────────────────────────────────
function tigerDeadlift(): JSX.Element {
  return (
    <svg viewBox="0 0 80 80" style={{ width: "100%", height: "100%" }}>
      {/* Full body group animates from hinged to upright */}
      <g className="tg-dl">
        {/* Head (looking forward/down in start position) */}
        <TigerHead cx={40} cy={10} r={8} />
        {/* Torso (upright at top, forward at bottom via animation) */}
        <line x1="40" y1="18" x2="40" y2="38" stroke={P} strokeWidth="8" strokeLinecap="round" />
        <ellipse cx="40" cy="20" rx="8" ry="4" fill={P} />
        {/* Body stripe */}
        <line x1="38" y1="20" x2="37" y2="36" stroke={PC} strokeWidth="1.5" opacity="0.55" strokeLinecap="round" />
        <line x1="42" y1="20" x2="43" y2="36" stroke={PC} strokeWidth="1.5" opacity="0.55" strokeLinecap="round" />
        {/* Arms reaching down to bar */}
        <line x1="36" y1="22" x2="24" y2="46" stroke={P} strokeWidth="5" strokeLinecap="round" />
        <line x1="44" y1="22" x2="56" y2="46" stroke={P} strokeWidth="5" strokeLinecap="round" />
        {/* Hips */}
        <ellipse cx="40" cy="40" rx="10" ry="5" fill={P} />
        {/* Left leg (slightly bent) */}
        <line x1="35" y1="43" x2="28" y2="58" stroke={P} strokeWidth="6" strokeLinecap="round" />
        <line x1="28" y1="58" x2="24" y2="68" stroke={P} strokeWidth="5" strokeLinecap="round" />
        {/* Right leg */}
        <line x1="45" y1="43" x2="52" y2="58" stroke={P} strokeWidth="6" strokeLinecap="round" />
        <line x1="52" y1="58" x2="56" y2="68" stroke={P} strokeWidth="5" strokeLinecap="round" />
        {/* Barbell at floor */}
        <rect x="14" y="49" width="52" height="5" rx="2.5" fill={BR} />
        <rect x="9" y="44" width="7" height="15" rx="3.5" fill={TC} />
        <rect x="64" y="44" width="7" height="15" rx="3.5" fill={TC} />
      </g>
    </svg>
  );
}

// ── 5. OVERHEAD PRESS ──────────────────────────────────────────────────────
function tigerOverhead(): JSX.Element {
  return (
    <svg viewBox="0 0 80 80" style={{ width: "100%", height: "100%" }}>
      {/* Static body */}
      <TigerHead cx={40} cy={14} r={8} />
      <rect x="34" y="22" width="12" height="18" rx="5" fill={P} />
      <ellipse cx="40" cy="24" rx="9" ry="4" fill={P} />
      <line x1="37" y1="23" x2="36" y2="38" stroke={PC} strokeWidth="1.4" opacity="0.55" strokeLinecap="round" />
      <line x1="43" y1="23" x2="44" y2="38" stroke={PC} strokeWidth="1.4" opacity="0.55" strokeLinecap="round" />
      {/* Hips */}
      <ellipse cx="40" cy="42" rx="9" ry="5" fill={P} />
      {/* Legs */}
      <line x1="35" y1="45" x2="28" y2="62" stroke={P} strokeWidth="5" strokeLinecap="round" />
      <line x1="45" y1="45" x2="52" y2="62" stroke={P} strokeWidth="5" strokeLinecap="round" />
      <line x1="28" y1="62" x2="24" y2="70" stroke={P} strokeWidth="4.5" strokeLinecap="round" />
      <line x1="52" y1="62" x2="56" y2="70" stroke={P} strokeWidth="4.5" strokeLinecap="round" />
      <ellipse cx="22" cy="71" rx="5" ry="3" fill={P} />
      <ellipse cx="58" cy="71" rx="5" ry="3" fill={P} />
      {/* Animated arms + barbell pressing up */}
      <g className="tg-ohp">
        {/* Arms at shoulder start position */}
        <line x1="34" y1="26" x2="18" y2="28" stroke={P} strokeWidth="5" strokeLinecap="round" />
        <line x1="46" y1="26" x2="62" y2="28" stroke={P} strokeWidth="5" strokeLinecap="round" />
        {/* Barbell */}
        <rect x="11" y="24" width="58" height="5" rx="2.5" fill={BR} />
        <rect x="6" y="19" width="7" height="15" rx="3.5" fill={TC} />
        <rect x="67" y="19" width="7" height="15" rx="3.5" fill={TC} />
        {/* Arm stripes */}
        <line x1="26" y1="27" x2="24" y2="30" stroke={PC} strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
        <line x1="54" y1="27" x2="56" y2="30" stroke={PC} strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
      </g>
      <rect x="8" y="72" width="64" height="4" rx="2" fill={PL} />
    </svg>
  );
}

// ── 6. LATERAL RAISE ──────────────────────────────────────────────────────
function tigerLateral(): JSX.Element {
  return (
    <svg viewBox="0 0 80 80" style={{ width: "100%", height: "100%" }}>
      {/* Standing body */}
      <TigerHead cx={40} cy={13} r={8} />
      <rect x="34" y="21" width="12" height="19" rx="5" fill={P} />
      <ellipse cx="40" cy="23" rx="9" ry="4" fill={P} />
      <line x1="37" y1="22" x2="36" y2="38" stroke={PC} strokeWidth="1.4" opacity="0.55" strokeLinecap="round" />
      <line x1="43" y1="22" x2="44" y2="38" stroke={PC} strokeWidth="1.4" opacity="0.55" strokeLinecap="round" />
      <ellipse cx="40" cy="42" rx="9" ry="5" fill={P} />
      <line x1="35" y1="45" x2="28" y2="62" stroke={P} strokeWidth="5" strokeLinecap="round" />
      <line x1="45" y1="45" x2="52" y2="62" stroke={P} strokeWidth="5" strokeLinecap="round" />
      <line x1="28" y1="62" x2="24" y2="70" stroke={P} strokeWidth="4.5" strokeLinecap="round" />
      <line x1="52" y1="62" x2="56" y2="70" stroke={P} strokeWidth="4.5" strokeLinecap="round" />
      <ellipse cx="22" cy="71" rx="5" ry="3" fill={P} />
      <ellipse cx="58" cy="71" rx="5" ry="3" fill={P} />
      {/* Animated left arm raising */}
      <g className="tg-lat-l">
        <line x1="34" y1="28" x2="18" y2="36" stroke={P} strokeWidth="5" strokeLinecap="round" />
        <ellipse cx="14" cy="37" rx="4.5" ry="3" fill={BR} />
      </g>
      {/* Animated right arm raising */}
      <g className="tg-lat-r">
        <line x1="46" y1="28" x2="62" y2="36" stroke={P} strokeWidth="5" strokeLinecap="round" />
        <ellipse cx="66" cy="37" rx="4.5" ry="3" fill={BR} />
      </g>
      <rect x="8" y="72" width="64" height="4" rx="2" fill={PL} />
    </svg>
  );
}

// ── 7. BARBELL ROW ────────────────────────────────────────────────────────
function tigerRow(): JSX.Element {
  return (
    <svg viewBox="0 0 80 80" style={{ width: "100%", height: "100%" }}>
      {/* Support structure / bench at right */}
      <rect x="54" y="40" width="22" height="5" rx="2.5" fill={PL} />
      <rect x="58" y="45" width="5" height="22" rx="2.5" fill={PL} />
      {/* Tiger body hinged at ~40° */}
      {/* Head (forward, lower) */}
      <TigerHead cx={18} cy={32} r={8} />
      {/* Torso (angled) */}
      <line x1="22" y1="35" x2="50" y2="44" stroke={P} strokeWidth="9" strokeLinecap="round" />
      {/* Body stripes on angled torso */}
      <line x1="28" y1="34" x2="30" y2="46" stroke={PC} strokeWidth="1.4" opacity="0.5" strokeLinecap="round" />
      <line x1="38" y1="37" x2="40" y2="47" stroke={PC} strokeWidth="1.4" opacity="0.5" strokeLinecap="round" />
      {/* Hips */}
      <ellipse cx="52" cy="44" rx="9" ry="5" fill={P} />
      {/* Legs (bent, supporting body) */}
      <line x1="48" y1="47" x2="38" y2="62" stroke={P} strokeWidth="5" strokeLinecap="round" />
      <line x1="56" y1="47" x2="62" y2="58" stroke={P} strokeWidth="5" strokeLinecap="round" />
      <line x1="38" y1="62" x2="34" y2="70" stroke={P} strokeWidth="4.5" strokeLinecap="round" />
      <line x1="62" y1="58" x2="64" y2="70" stroke={P} strokeWidth="4.5" strokeLinecap="round" />
      <rect x="8" y="70" width="64" height="4" rx="2" fill={PL} />
      {/* Animated arm pulling barbell */}
      <g className="tg-row">
        {/* Arm */}
        <line x1="22" y1="38" x2="12" y2="50" stroke={P} strokeWidth="5" strokeLinecap="round" />
        {/* Barbell */}
        <rect x="6" y="48" width="32" height="5" rx="2.5" fill={BR} />
        <rect x="3" y="44" width="5" height="13" rx="2.5" fill={TC} />
        <rect x="35" y="44" width="5" height="13" rx="2.5" fill={TC} />
      </g>
    </svg>
  );
}

// ── 8. LAT PULLDOWN ───────────────────────────────────────────────────────
function tigerPulldown(): JSX.Element {
  return (
    <svg viewBox="0 0 80 80" style={{ width: "100%", height: "100%" }}>
      {/* Cable machine top bar */}
      <rect x="4" y="4" width="72" height="5" rx="2.5" fill={BR} />
      {/* Cable line */}
      <line x1="40" y1="9" x2="40" y2="20" stroke={PL} strokeWidth="1.5" />
      {/* Animated pulldown bar + arms */}
      <g className="tg-pd">
        {/* Wide pulldown bar */}
        <rect x="22" y="18" width="36" height="4" rx="2" fill={BR} />
        {/* Handles */}
        <circle cx="22" cy="20" r="3.5" fill={PL} />
        <circle cx="58" cy="20" r="3.5" fill={PL} />
        {/* Tiger head */}
        <TigerHead cx={40} cy={32} r={8} />
        {/* Torso (seated, slight back lean) */}
        <rect x="34" y="40" width="12" height="16" rx="5" fill={P} />
        <ellipse cx="40" cy="42" rx="9" ry="4" fill={P} />
        <line x1="37" y1="41" x2="36" y2="54" stroke={PC} strokeWidth="1.4" opacity="0.55" strokeLinecap="round" />
        <line x1="43" y1="41" x2="44" y2="54" stroke={PC} strokeWidth="1.4" opacity="0.55" strokeLinecap="round" />
        {/* Seated legs */}
        <line x1="36" y1="56" x2="24" y2="64" stroke={P} strokeWidth="5" strokeLinecap="round" />
        <line x1="44" y1="56" x2="56" y2="64" stroke={P} strokeWidth="5" strokeLinecap="round" />
        {/* Thigh pads hint */}
        <rect x="18" y="62" width="16" height="5" rx="2.5" fill={PL} />
        <rect x="46" y="62" width="16" height="5" rx="2.5" fill={PL} />
        {/* Arms reaching up to bar */}
        <line x1="35" y1="42" x2="24" y2="22" stroke={P} strokeWidth="4.5" strokeLinecap="round" />
        <line x1="45" y1="42" x2="56" y2="22" stroke={P} strokeWidth="4.5" strokeLinecap="round" />
      </g>
    </svg>
  );
}

// ── 9. CRUNCH ─────────────────────────────────────────────────────────────
function tigerCrunch(): JSX.Element {
  return (
    <svg viewBox="0 0 80 80" style={{ width: "100%", height: "100%" }}>
      {/* Floor */}
      <rect x="4" y="68" width="72" height="5" rx="2.5" fill={PL} />
      {/* Lower body (static) */}
      {/* Hips */}
      <ellipse cx="40" cy="64" rx="12" ry="6" fill={P} />
      {/* Left leg bent */}
      <line x1="32" y1="66" x2="22" y2="72" stroke={P} strokeWidth="6" strokeLinecap="round" />
      {/* Right leg bent */}
      <line x1="48" y1="66" x2="58" y2="72" stroke={P} strokeWidth="6" strokeLinecap="round" />
      {/* Lower back/torso lower half */}
      <rect x="33" y="48" width="14" height="18" rx="5" fill={P} />
      {/* Animated upper body crunching */}
      <g className="tg-cr">
        {/* Upper torso */}
        <rect x="32" y="40" width="16" height="14" rx="5" fill={P} />
        <ellipse cx="40" cy="42" rx="10" ry="4.5" fill={P} />
        <line x1="37" y1="41" x2="36" y2="52" stroke={PC} strokeWidth="1.4" opacity="0.55" strokeLinecap="round" />
        <line x1="43" y1="41" x2="44" y2="52" stroke={PC} strokeWidth="1.4" opacity="0.55" strokeLinecap="round" />
        {/* Head */}
        <TigerHead cx={40} cy={31} r={8} />
        {/* Arms behind head */}
        <line x1="34" y1="40" x2="24" y2="36" stroke={P} strokeWidth="4" strokeLinecap="round" />
        <line x1="46" y1="40" x2="56" y2="36" stroke={P} strokeWidth="4" strokeLinecap="round" />
        <line x1="24" y1="36" x2="30" y2="28" stroke={P} strokeWidth="3.5" strokeLinecap="round" />
        <line x1="56" y1="36" x2="50" y2="28" stroke={P} strokeWidth="3.5" strokeLinecap="round" />
      </g>
    </svg>
  );
}

// ── 10. LEG PRESS ─────────────────────────────────────────────────────────
function tigerLegpress(): JSX.Element {
  return (
    <svg viewBox="0 0 80 80" style={{ width: "100%", height: "100%" }}>
      {/* Machine structure */}
      <rect x="4" y="44" width="22" height="6" rx="3" fill={PL} />
      <rect x="4" y="50" width="6" height="22" rx="3" fill={PL} />
      <rect x="60" y="26" width="16" height="32" rx="4" fill={PL} />
      {/* Platform (animated) */}
      <g className="tg-lp">
        <rect x="50" y="24" width="12" height="24" rx="3" fill={BR} />
        {/* Plate on platform */}
        <rect x="54" y="22" width="7" height="4" rx="2" fill={TC} />
        {/* Legs pushing platform */}
        <line x1="22" y1="52" x2="50" y2="38" stroke={P} strokeWidth="6" strokeLinecap="round" />
        <line x1="22" y1="58" x2="50" y2="48" stroke={P} strokeWidth="6" strokeLinecap="round" />
        {/* Knee dots */}
        <circle cx="36" cy="45" r="4" fill={PC} opacity="0.5" />
        <circle cx="36" cy="53" r="4" fill={PC} opacity="0.5" />
      </g>
      {/* Tiger body (reclined, upper) */}
      <ellipse cx="14" cy="44" rx="12" ry="7" fill={P} />
      {/* Head */}
      <TigerHead cx={14} cy={34} r={8} />
      {/* Neck */}
      <line x1="14" y1="42" x2="14" y2="45" stroke={P} strokeWidth="5" strokeLinecap="round" />
      {/* Arms on side handles */}
      <line x1="10" y1="44" x2="4" y2="52" stroke={P} strokeWidth="4" strokeLinecap="round" />
      <line x1="18" y1="44" x2="24" y2="52" stroke={P} strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

// ── 11. CALF RAISE ────────────────────────────────────────────────────────
function tigerCalf(): JSX.Element {
  return (
    <svg viewBox="0 0 80 80" style={{ width: "100%", height: "100%" }}>
      {/* Platform / step */}
      <rect x="12" y="64" width="56" height="8" rx="4" fill={PL} />
      <rect x="4" y="68" width="72" height="4" rx="2" fill={PL} />
      {/* Animated whole body rises on toes */}
      <g className="tg-cf">
        <TigerHead cx={40} cy={11} r={8} />
        <rect x="34" y="19" width="12" height="20" rx="5" fill={P} />
        <ellipse cx="40" cy="21" rx="9" ry="4" fill={P} />
        <line x1="37" y1="20" x2="36" y2="37" stroke={PC} strokeWidth="1.4" opacity="0.55" strokeLinecap="round" />
        <line x1="43" y1="20" x2="44" y2="37" stroke={PC} strokeWidth="1.4" opacity="0.55" strokeLinecap="round" />
        {/* Arms at sides */}
        <line x1="34" y1="24" x2="22" y2="36" stroke={P} strokeWidth="4.5" strokeLinecap="round" />
        <line x1="46" y1="24" x2="58" y2="36" stroke={P} strokeWidth="4.5" strokeLinecap="round" />
        {/* Hips */}
        <ellipse cx="40" cy="41" rx="9" ry="5" fill={P} />
        {/* Thighs */}
        <line x1="35" y1="44" x2="30" y2="56" stroke={P} strokeWidth="5.5" strokeLinecap="round" />
        <line x1="45" y1="44" x2="50" y2="56" stroke={P} strokeWidth="5.5" strokeLinecap="round" />
        {/* Calves */}
        <line x1="30" y1="56" x2="28" y2="65" stroke={P} strokeWidth="5" strokeLinecap="round" />
        <line x1="50" y1="56" x2="52" y2="65" stroke={P} strokeWidth="5" strokeLinecap="round" />
        {/* Feet (on toes) */}
        <ellipse cx="27" cy="66" rx="5" ry="3" fill={P} />
        <ellipse cx="53" cy="66" rx="5" ry="3" fill={P} />
      </g>
    </svg>
  );
}

// ── 12. FACE PULL / CABLE ─────────────────────────────────────────────────
function tigerFacepull(): JSX.Element {
  return (
    <svg viewBox="0 0 80 80" style={{ width: "100%", height: "100%" }}>
      {/* Cable machine on left */}
      <rect x="2" y="8" width="8" height="60" rx="4" fill={BR} />
      <line x1="10" y1="32" x2="24" y2="34" stroke={PL} strokeWidth="2" />
      {/* Tiger: facing cable, standing */}
      <TigerHead cx={48} cy={28} r={8} />
      <rect x="42" y="36" width="12" height="20" rx="5" fill={P} />
      <ellipse cx="48" cy="38" rx="9" ry="4" fill={P} />
      <line x1="45" y1="37" x2="44" y2="54" stroke={PC} strokeWidth="1.4" opacity="0.55" strokeLinecap="round" />
      <line x1="51" y1="37" x2="52" y2="54" stroke={PC} strokeWidth="1.4" opacity="0.55" strokeLinecap="round" />
      <ellipse cx="48" cy="58" rx="9" ry="5" fill={P} />
      <line x1="43" y1="61" x2="36" y2="74" stroke={P} strokeWidth="5" strokeLinecap="round" />
      <line x1="53" y1="61" x2="60" y2="74" stroke={P} strokeWidth="5" strokeLinecap="round" />
      <ellipse cx="34" cy="75" rx="5" ry="3" fill={P} />
      <ellipse cx="62" cy="75" rx="5" ry="3" fill={P} />
      <rect x="8" y="74" width="68" height="4" rx="2" fill={PL} />
      {/* Animated arms pulling rope toward face */}
      <g className="tg-fp">
        {/* Left arm extended toward cable */}
        <line x1="42" y1="40" x2="28" y2="34" stroke={P} strokeWidth="5" strokeLinecap="round" />
        {/* Right arm extended */}
        <line x1="54" y1="40" x2="28" y2="38" stroke={P} strokeWidth="5" strokeLinecap="round" />
        {/* Rope end */}
        <circle cx="26" cy="36" r="4" fill={PL} />
        <circle cx="24" cy="37" r="3" fill={TC} />
      </g>
    </svg>
  );
}

// ── 13. LUNGE ─────────────────────────────────────────────────────────────
function tigerLunge(): JSX.Element {
  return (
    <svg viewBox="0 0 80 80" style={{ width: "100%", height: "100%" }}>
      <rect x="8" y="72" width="64" height="4" rx="2" fill={PL} />
      <g className="tg-lng">
        {/* Head */}
        <TigerHead cx={42} cy={13} r={8} />
        {/* Torso (upright) */}
        <rect x="36" y="21" width="12" height="18" rx="5" fill={P} />
        <ellipse cx="42" cy="23" rx="9" ry="4" fill={P} />
        <line x1="39" y1="22" x2="38" y2="37" stroke={PC} strokeWidth="1.4" opacity="0.55" strokeLinecap="round" />
        <line x1="45" y1="22" x2="46" y2="37" stroke={PC} strokeWidth="1.4" opacity="0.55" strokeLinecap="round" />
        {/* Arms swinging */}
        <line x1="36" y1="26" x2="26" y2="38" stroke={P} strokeWidth="4.5" strokeLinecap="round" />
        <line x1="48" y1="26" x2="58" y2="40" stroke={P} strokeWidth="4.5" strokeLinecap="round" />
        {/* Hips */}
        <ellipse cx="42" cy="41" rx="10" ry="5" fill={P} />
        {/* Front leg (left, forward, knee bent) */}
        <line x1="37" y1="44" x2="28" y2="57" stroke={P} strokeWidth="6" strokeLinecap="round" />
        <line x1="28" y1="57" x2="24" y2="70" stroke={P} strokeWidth="5" strokeLinecap="round" />
        <ellipse cx="23" cy="71" rx="5" ry="3" fill={P} />
        <circle cx="28" cy="57" r="3.5" fill={PC} opacity="0.45" />
        {/* Back leg (right, knee near ground) */}
        <line x1="47" y1="44" x2="56" y2="52" stroke={P} strokeWidth="6" strokeLinecap="round" />
        <line x1="56" y1="52" x2="60" y2="65" stroke={P} strokeWidth="5" strokeLinecap="round" />
        <ellipse cx="60" cy="66" rx="5" ry="3" fill={P} />
        <circle cx="56" cy="52" r="3.5" fill={PC} opacity="0.45" />
      </g>
    </svg>
  );
}

// ── 14. DEFAULT / GENERIC ─────────────────────────────────────────────────
function tigerDefault(): JSX.Element {
  return (
    <svg viewBox="0 0 80 80" style={{ width: "100%", height: "100%" }}>
      <g className="tg-bob">
        <TigerHead cx={40} cy={13} r={9} />
        {/* Torso */}
        <rect x="33" y="22" width="14" height="22" rx="6" fill={P} />
        <ellipse cx="40" cy="24" rx="10" ry="4.5" fill={P} />
        {/* Body stripes */}
        <line x1="37" y1="23" x2="36" y2="42" stroke={PC} strokeWidth="1.5" opacity="0.55" strokeLinecap="round" />
        <line x1="43" y1="23" x2="44" y2="42" stroke={PC} strokeWidth="1.5" opacity="0.55" strokeLinecap="round" />
        {/* Arms in athletic stance */}
        <line x1="33" y1="28" x2="20" y2="42" stroke={P} strokeWidth="5" strokeLinecap="round" />
        <line x1="47" y1="28" x2="60" y2="42" stroke={P} strokeWidth="5" strokeLinecap="round" />
        {/* Forearms slightly bent */}
        <line x1="20" y1="42" x2="16" y2="52" stroke={P} strokeWidth="4.5" strokeLinecap="round" />
        <line x1="60" y1="42" x2="64" y2="52" stroke={P} strokeWidth="4.5" strokeLinecap="round" />
        {/* Hips */}
        <ellipse cx="40" cy="46" rx="9" ry="5" fill={P} />
        {/* Legs */}
        <line x1="35" y1="49" x2="28" y2="64" stroke={P} strokeWidth="6" strokeLinecap="round" />
        <line x1="45" y1="49" x2="52" y2="64" stroke={P} strokeWidth="6" strokeLinecap="round" />
        <line x1="28" y1="64" x2="24" y2="72" stroke={P} strokeWidth="5" strokeLinecap="round" />
        <line x1="52" y1="64" x2="56" y2="72" stroke={P} strokeWidth="5" strokeLinecap="round" />
        <ellipse cx="22" cy="73" rx="5" ry="3" fill={P} />
        <ellipse cx="58" cy="73" rx="5" ry="3" fill={P} />
      </g>
      <rect x="8" y="74" width="64" height="4" rx="2" fill={PL} />
    </svg>
  );
}

// ── Export map (same shape as existing ANIMS) ──────────────────────────────
export const TIGER_ANIMS: Record<string, () => JSX.Element> = {
  bench:    tigerBench,
  squat:    tigerSquat,
  curl:     tigerCurl,
  deadlift: tigerDeadlift,
  overhead: tigerOverhead,
  lateral:  tigerLateral,
  row:      tigerRow,
  pulldown: tigerPulldown,
  crunch:   tigerCrunch,
  legpress: tigerLegpress,
  calf:     tigerCalf,
  facepu:   tigerFacepull,
  lunge:    tigerLunge,
  default:  tigerDefault,
};

// ── Updated getKey — same logic as original + lunge ────────────────────────
export function getKey(n = ""): string {
  const t = n.toLowerCase();
  if (t.includes("bench") || t.includes("incline") || t.includes("fly") || t.includes("pec")) return "bench";
  if (t.includes("squat")) return "squat";
  if (t.includes("curl") && !t.includes("wrist")) return "curl";
  if (t.includes("deadlift") || t.includes("rdl")) return "deadlift";
  if (t.includes("overhead") || t.includes("ohp") || t.includes("shoulder press")) return "overhead";
  if (t.includes("lateral") || t.includes("raise") || t.includes("delt")) return "lateral";
  if (t.includes("row") || t.includes("seated cable")) return "row";
  if (t.includes("pulldown") || t.includes("pull-up") || t.includes("chin")) return "pulldown";
  if (t.includes("crunch") || t.includes("leg raise") || t.includes("rollout") || t.includes("ab ")) return "crunch";
  if (t.includes("leg press") || t.includes("adduct") || t.includes("abduct") || t.includes("leg curl") || t.includes("extension")) return "legpress";
  if (t.includes("calf")) return "calf";
  if (t.includes("lunge")) return "lunge";
  if (t.includes("face pull") || t.includes("pushdown") || t.includes("tricep")) return "facepu";
  return "default";
}
