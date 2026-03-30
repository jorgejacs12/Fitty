import { useState, useEffect, type JSX } from "react";
import { supabase } from "./lib/supabase";

const M = {
  primary:"#4F378B",onPrimary:"#FFFFFF",primaryContainer:"#EADDFF",onPrimaryContainer:"#21005D",
  secondary:"#625B71",onSecondary:"#FFFFFF",secondaryContainer:"#E8DEF8",onSecondaryContainer:"#1D192B",
  tertiary:"#7D5260",onTertiary:"#FFFFFF",tertiaryContainer:"#FFD8E4",onTertiaryContainer:"#31111D",
  background:"#FFFBFE",surface:"#FFFBFE",surfaceContainer:"#F3EDF7",surfaceContainerLow:"#F7F2FA",
  surfaceContainerHigh:"#ECE6F0",surfaceContainerHighest:"#E6E0EB",
  onSurface:"#1C1B1F",onSurfaceVariant:"#49454F",outline:"#79747E",outlineVariant:"#CAC4D0",
  error:"#B3261E",errorContainer:"#F9DEDC",onErrorContainer:"#410E0B",
  greenPrimary:"#386A20",greenContainer:"#C5EFAA",onGreenContainer:"#072100",
  orangePrimary:"#7D4E00",orangeContainer:"#FFDDB3",onOrangeContainer:"#281900",
};
const FONT = `"Nunito","Google Sans","Helvetica Neue",sans-serif`;

const STRETCHES: Record<string, {name:string;desc:string;emoji:string}[]> = {
  before:[
    {name:"Leg Swings",desc:"10 each leg — forward/back then side to side",emoji:"🦵"},
    {name:"Arm Circles",desc:"10 forward, 10 backward — loosens the shoulders",emoji:"💪"},
    {name:"Hip Circles",desc:"10 each direction — hands on hips",emoji:"🔄"},
    {name:"Torso Twists",desc:"10 each side — arms out at shoulder height",emoji:"🌀"},
    {name:"High Knees",desc:"30 seconds moderate pace — elevates heart rate",emoji:"🏃"},
    {name:"Ankle Rolls",desc:"10 circles each ankle",emoji:"⭕"},
  ],
  after:[
    {name:"Hamstring Stretch",desc:"Hold 30 sec each leg — reach toward your toes",emoji:"🦵"},
    {name:"Quad Stretch",desc:"Hold 30 sec each leg — pull heel to glute",emoji:"🧘"},
    {name:"Chest Opener",desc:"Hold 30 sec — clasp hands behind back, open chest",emoji:"💪"},
    {name:"Hip Flexor Stretch",desc:"Hold 30 sec each side — low lunge, hips down",emoji:"🔽"},
    {name:"Shoulder Cross-Body",desc:"Hold 30 sec each arm",emoji:"✋"},
    {name:"Spinal Twist",desc:"Hold 20 sec each side — seated, rotate from waist",emoji:"🌀"},
  ],
  runBefore:[
    {name:"Ankle Rolls",desc:"10 circles each ankle — prevents ankle rolls",emoji:"⭕"},
    {name:"Leg Swings",desc:"10 each leg — loosens hamstrings and hip flexors",emoji:"🦵"},
    {name:"Hip Circles",desc:"10 each direction",emoji:"🔄"},
    {name:"Walking Lunges",desc:"10 steps — activates glutes and quads",emoji:"🚶"},
    {name:"Calf Raises",desc:"15 reps — warms up lower legs and Achilles",emoji:"⬆️"},
  ],
  runAfter:[
    {name:"Standing Quad Stretch",desc:"Hold 30 sec each leg",emoji:"🧘"},
    {name:"Calf Stretch",desc:"Hold 30 sec each — foot against wall, lean in",emoji:"🦵"},
    {name:"IT Band Stretch",desc:"Hold 30 sec each side — cross one leg behind other",emoji:"✖️"},
    {name:"Hip Flexor Stretch",desc:"Hold 30 sec each side",emoji:"🔽"},
    {name:"Seated Hamstring",desc:"Hold 30 sec each leg — reach toward toes",emoji:"🙆"},
  ],
};

const HISTORY: Record<string, {type:string;emoji:string;exercises?:string[];miles?:number}> = {
  "2026-03-16":{type:"Push Day",emoji:"💪",exercises:["Bench Press","OHP","Lateral Raises","Tricep Pushdown"]},
  "2026-03-17":{type:"Run",emoji:"🏃",miles:2.8},
  "2026-03-18":{type:"Pull Day",emoji:"🏋️",exercises:["Deadlift","Lat Pulldown","Barbell Rows","Barbell Curls"]},
  "2026-03-19":{type:"Rest",emoji:"😴"},
  "2026-03-20":{type:"Leg Day",emoji:"🦵",exercises:["Barbell Squat","Romanian Deadlift","Leg Press","Calf Raises"]},
  "2026-03-21":{type:"Upper Body",emoji:"⬆️",exercises:["Bench Press","Barbell Rows","OHP","Lat Pulldown"]},
  "2026-03-22":{type:"Rest",emoji:"😴"},
  "2026-03-23":{type:"Pull Day",emoji:"🏋️",exercises:["Deadlift","Barbell Rows","Lat Pulldown","Face Pull","Barbell Curls"]},
  "2026-03-24":{type:"Push Day",emoji:"💪",exercises:["Barbell Bench Press","Incline DB Press","OHP","Lateral Raises"]},
  "2026-03-25":{type:"Rest",emoji:"😴"},
  "2026-03-26":{type:"Leg Day",emoji:"🦵",exercises:["Barbell Squat","Romanian Deadlift","Leg Press","Walking Lunges","Calf Raises"]},
  "2026-03-27":{type:"Run",emoji:"🏃",miles:3.2},
  "2026-03-28":{type:"Upper Body",emoji:"⬆️",exercises:["Bench Press","Barbell Rows","OHP","Lat Pulldown","Incline DB Press"]},
  "2026-03-29":{type:"Push Day",emoji:"💪",exercises:["Barbell Bench Press","Cable Flyes","OHP","Lateral Raises","Tricep Pushdown"]},
};

const TYPE_COLORS: Record<string, {bg:string;fg:string}> = {
  "Push Day":  {bg:M.primaryContainer,   fg:M.onPrimaryContainer},
  "Pull Day":  {bg:M.secondaryContainer, fg:M.onSecondaryContainer},
  "Leg Day":   {bg:M.tertiaryContainer,  fg:M.onTertiaryContainer},
  "Upper Body":{bg:M.greenContainer,     fg:M.onGreenContainer},
  "Misc":      {bg:M.orangeContainer,    fg:M.onOrangeContainer},
  "Run":       {bg:"#BBDEFB",            fg:"#0D47A1"},
  "Rest":      {bg:M.surfaceContainerHighest, fg:M.onSurfaceVariant},
};

const BREATHING: Record<string, string> = {
  bench:"Exhale as you press up — inhale as you lower the bar with control.",
  squat:"Deep breath before you descend, brace hard, then exhale as you drive back up.",
  curl:"Exhale as you curl up — inhale as you slowly extend back down.",
  deadlift:"Big breath before the pull, brace your core, then exhale at lockout.",
  overhead:"Exhale as you press overhead — inhale as you lower to shoulder height.",
  lateral:"Exhale as you raise — inhale on the controlled way back down.",
  row:"Exhale as you pull toward you — inhale as you extend back out.",
  pulldown:"Exhale as you pull down — inhale as you let the bar rise back up.",
  crunch:"Exhale forcefully as you crunch — inhale as you lower back down.",
  legpress:"Inhale as you lower — exhale as you drive the platform away.",
  calf:"Exhale as you rise — inhale as you lower back down.",
  lunge:"Inhale as you step down — exhale as you push back to standing.",
  facepu:"Exhale as you pull toward your face — inhale on the way back out.",
  default:"Exhale on the exertion (the hard part) — inhale on the return. Never hold your breath.",
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900;1000&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
.m3b{position:relative;overflow:hidden;cursor:pointer;border:none;font-family:inherit;transition:transform .12s}
.m3b::before{content:"";position:absolute;inset:0;background:currentColor;opacity:0;border-radius:inherit;transition:opacity .15s;pointer-events:none}
.m3b:hover::before{opacity:.08}.m3b:active::before{opacity:.14}.m3b:active{transform:scale(.97)}
.m3i{position:relative;overflow:hidden;border:none;cursor:pointer;border-radius:50%;display:flex;align-items:center;justify-content:center}
.m3i::before{content:"";position:absolute;inset:0;background:currentColor;opacity:0;transition:opacity .15s;pointer-events:none}
.m3i:hover::before{opacity:.08}.m3i:active::before{opacity:.14}
@keyframes slideUp{0%{transform:translateY(80px) scale(.94);opacity:0}60%{transform:translateY(-8px) scale(1.01)}100%{transform:translateY(0) scale(1);opacity:1}}
@keyframes scaleIn{0%{transform:scale(.8);opacity:0}60%{transform:scale(1.06)}100%{transform:scale(1);opacity:1}}
@keyframes heroIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes stagger{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes tabIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}
@keyframes navBounce{0%,100%{transform:translateY(0)}35%{transform:translateY(-4px)}65%{transform:translateY(2px)}}
@keyframes checkSpring{0%{transform:scale(0) rotate(-20deg)}60%{transform:scale(1.25) rotate(5deg)}100%{transform:scale(1) rotate(0)}}
@keyframes loginFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes burstRing{0%{transform:scale(0);opacity:.9}100%{transform:scale(2.4);opacity:0}}
@keyframes xpFly{0%{transform:translateY(0) scale(1);opacity:1}100%{transform:translateY(-90px) scale(.7);opacity:0}}
@keyframes benchPress{0%,100%{transform:translateY(0)}45%{transform:translateY(-10px)}}
@keyframes squatDown{0%,100%{transform:translateY(0)}50%{transform:translateY(10px)}}
@keyframes curlUp{0%,100%{transform:rotate(0deg)}45%{transform:rotate(-50deg)}}
@keyframes dlLift{0%,100%{transform:translateY(8px) rotate(30deg)}50%{transform:translateY(0) rotate(0deg)}}
@keyframes ohpPress{0%,100%{transform:translateY(0)}45%{transform:translateY(-12px)}}
@keyframes latRaise{0%,100%{transform:rotate(0deg)}45%{transform:rotate(-35deg)}}
@keyframes rowPull{0%,100%{transform:translateX(0)}45%{transform:translateX(10px)}}
@keyframes pullDown{0%,100%{transform:translateY(0)}45%{transform:translateY(8px)}}
@keyframes crunchUp{0%,100%{transform:rotate(0deg)}45%{transform:rotate(-28deg)}}
@keyframes legPush{0%,100%{transform:translateX(-8px)}50%{transform:translateX(0)}}
@keyframes calfRaise{0%,100%{transform:translateY(0)}45%{transform:translateY(-12px)}}
@keyframes defBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
.bp-arms{animation:benchPress 1.6s ease-in-out infinite;transform-origin:40px 40px}
.sq-body{animation:squatDown 1.8s ease-in-out infinite;transform-origin:40px 30px}
.curl-arm{animation:curlUp 1.8s ease-in-out infinite;transform-origin:36px 50px}
.dl-body{animation:dlLift 2s ease-in-out infinite;transform-origin:40px 50px}
.ohp-arms{animation:ohpPress 1.7s ease-in-out infinite;transform-origin:40px 35px}
.lat-l{animation:latRaise 1.8s ease-in-out infinite;transform-origin:34px 30px}
.lat-r{animation:latRaise 1.8s ease-in-out infinite reverse;transform-origin:46px 30px}
.row-arm{animation:rowPull 1.6s ease-in-out infinite;transform-origin:30px 35px}
.pd-arms{animation:pullDown 1.7s ease-in-out infinite;transform-origin:40px 20px}
.cr-upper{animation:crunchUp 1.8s ease-in-out infinite;transform-origin:40px 50px}
.lp-legs{animation:legPush 1.7s ease-in-out infinite;transform-origin:30px 40px}
.cf-body{animation:calfRaise 1.6s ease-in-out infinite;transform-origin:40px 40px}
.def-body{animation:defBob 1.6s ease-in-out infinite}
.burst-ring{animation:burstRing .55s cubic-bezier(0,0,.2,1) forwards}
.xp-fly{animation:xpFly 1s cubic-bezier(.2,0,0,1) .06s forwards}
.check-pop{animation:checkSpring .4s cubic-bezier(.34,1.56,.64,1) forwards}
.spring{transition:all .35s cubic-bezier(.34,1.56,.64,1)}
.ease{transition:all .28s cubic-bezier(.2,0,0,1)}
.fast{transition:all .18s cubic-bezier(.2,0,0,1)}
.sheet-handle{width:32px;height:4px;background:#CAC4D0;border-radius:2px;margin:10px auto 0}
.nav-pill{border-radius:16px;padding:4px 18px;min-width:60px;display:flex;align-items:center;justify-content:center;transition:all .28s cubic-bezier(.2,0,0,1)}
`;
function useCSS() {
  useEffect(()=>{
    if(document.getElementById("fv8"))return;
    const s=document.createElement("style");s.id="fv8";s.textContent=CSS;
    document.head.appendChild(s);
  },[]);
}

const [P,PC,BD,HD,BR,PL]=[M.primary,M.primaryContainer,"#625B71","#EADDFF","#1C1B1F","#CAC4D0"];
const ANIMS: Record<string, ()=>JSX.Element> = {
  bench:()=><svg viewBox="0 0 80 80" style={{width:"100%",height:"100%"}}><rect x="10" y="55" width="60" height="6" rx="3" fill={PL}/><rect x="15" y="61" width="8" height="12" rx="2" fill={PL}/><rect x="57" y="61" width="8" height="12" rx="2" fill={PL}/><ellipse cx="40" cy="52" rx="18" ry="5" fill={BD}/><circle cx="62" cy="50" r="7" fill={HD}/><g className="bp-arms"><line x1="30" y1="50" x2="20" y2="36" stroke={P} strokeWidth="3" strokeLinecap="round"/><line x1="50" y1="50" x2="60" y2="36" stroke={P} strokeWidth="3" strokeLinecap="round"/><rect x="14" y="32" width="52" height="5" rx="2.5" fill={BR}/><circle cx="14" cy="34.5" r="6" fill={P} stroke={PC} strokeWidth="1.5"/><circle cx="66" cy="34.5" r="6" fill={P} stroke={PC} strokeWidth="1.5"/></g></svg>,
  squat:()=><svg viewBox="0 0 80 80" style={{width:"100%",height:"100%"}}><g className="sq-body"><circle cx="40" cy="14" r="8" fill={HD}/><rect x="34" y="22" width="12" height="18" rx="4" fill={BD}/><rect x="18" y="24" width="44" height="4" rx="2" fill={BR}/><circle cx="18" cy="26" r="6" fill={P} stroke={PC} strokeWidth="1.5"/><circle cx="62" cy="26" r="6" fill={P} stroke={PC} strokeWidth="1.5"/><line x1="37" y1="40" x2="28" y2="62" stroke={BD} strokeWidth="4" strokeLinecap="round"/><line x1="43" y1="40" x2="52" y2="62" stroke={BD} strokeWidth="4" strokeLinecap="round"/><line x1="28" y1="62" x2="22" y2="72" stroke={BD} strokeWidth="3" strokeLinecap="round"/><line x1="52" y1="62" x2="58" y2="72" stroke={BD} strokeWidth="3" strokeLinecap="round"/></g><rect x="8" y="72" width="64" height="4" rx="2" fill={PL}/></svg>,
  curl:()=><svg viewBox="0 0 80 80" style={{width:"100%",height:"100%"}}><circle cx="40" cy="12" r="8" fill={HD}/><rect x="34" y="20" width="12" height="22" rx="4" fill={BD}/><line x1="34" y1="42" x2="28" y2="72" stroke={BD} strokeWidth="4" strokeLinecap="round"/><line x1="46" y1="42" x2="52" y2="72" stroke={BD} strokeWidth="4" strokeLinecap="round"/><g className="curl-arm"><line x1="36" y1="32" x2="36" y2="50" stroke={BD} strokeWidth="4" strokeLinecap="round"/><line x1="36" y1="50" x2="22" y2="58" stroke={P} strokeWidth="4" strokeLinecap="round"/><ellipse cx="18" cy="60" rx="6" ry="4" fill={BR}/></g><line x1="46" y1="32" x2="46" y2="52" stroke={BD} strokeWidth="4" strokeLinecap="round"/><line x1="46" y1="52" x2="60" y2="60" stroke={P} strokeWidth="4" strokeLinecap="round"/><ellipse cx="64" cy="62" rx="6" ry="4" fill={BR}/><rect x="10" y="70" width="60" height="4" rx="2" fill={PL}/></svg>,
  deadlift:()=><svg viewBox="0 0 80 80" style={{width:"100%",height:"100%"}}><g className="dl-body"><circle cx="40" cy="12" r="7" fill={HD}/><line x1="40" y1="19" x2="40" y2="40" stroke={BD} strokeWidth="5" strokeLinecap="round"/><line x1="40" y1="25" x2="26" y2="38" stroke={BD} strokeWidth="4" strokeLinecap="round"/><line x1="26" y1="38" x2="22" y2="52" stroke={P} strokeWidth="3" strokeLinecap="round"/><line x1="40" y1="25" x2="54" y2="38" stroke={BD} strokeWidth="4" strokeLinecap="round"/><line x1="54" y1="38" x2="58" y2="52" stroke={P} strokeWidth="3" strokeLinecap="round"/><line x1="40" y1="40" x2="32" y2="58" stroke={BD} strokeWidth="4" strokeLinecap="round"/><line x1="40" y1="40" x2="48" y2="58" stroke={BD} strokeWidth="4" strokeLinecap="round"/><rect x="16" y="50" width="48" height="5" rx="2.5" fill={BR}/><circle cx="16" cy="52.5" r="7" fill={P} stroke={PC} strokeWidth="1.5"/><circle cx="64" cy="52.5" r="7" fill={P} stroke={PC} strokeWidth="1.5"/></g></svg>,
  overhead:()=><svg viewBox="0 0 80 80" style={{width:"100%",height:"100%"}}><circle cx="40" cy="10" r="7" fill={HD}/><rect x="35" y="17" width="10" height="20" rx="4" fill={BD}/><line x1="37" y1="37" x2="28" y2="65" stroke={BD} strokeWidth="4" strokeLinecap="round"/><line x1="43" y1="37" x2="52" y2="65" stroke={BD} strokeWidth="4" strokeLinecap="round"/><g className="ohp-arms"><line x1="35" y1="22" x2="18" y2="30" stroke={BD} strokeWidth="4" strokeLinecap="round"/><line x1="45" y1="22" x2="62" y2="30" stroke={BD} strokeWidth="4" strokeLinecap="round"/><rect x="12" y="25" width="56" height="5" rx="2.5" fill={BR}/><circle cx="12" cy="27.5" r="6" fill={P} stroke={PC} strokeWidth="1.5"/><circle cx="68" cy="27.5" r="6" fill={P} stroke={PC} strokeWidth="1.5"/></g><rect x="8" y="72" width="64" height="4" rx="2" fill={PL}/></svg>,
  lateral:()=><svg viewBox="0 0 80 80" style={{width:"100%",height:"100%"}}><circle cx="40" cy="10" r="7" fill={HD}/><rect x="35" y="17" width="10" height="20" rx="4" fill={BD}/><line x1="37" y1="37" x2="28" y2="65" stroke={BD} strokeWidth="4" strokeLinecap="round"/><line x1="43" y1="37" x2="52" y2="65" stroke={BD} strokeWidth="4" strokeLinecap="round"/><g className="lat-l"><line x1="34" y1="25" x2="14" y2="32" stroke={P} strokeWidth="4" strokeLinecap="round"/><ellipse cx="10" cy="33" rx="5" ry="3.5" fill={BR}/></g><g className="lat-r"><line x1="46" y1="25" x2="66" y2="32" stroke={P} strokeWidth="4" strokeLinecap="round"/><ellipse cx="70" cy="33" rx="5" ry="3.5" fill={BR}/></g><rect x="8" y="72" width="64" height="4" rx="2" fill={PL}/></svg>,
  row:()=><svg viewBox="0 0 80 80" style={{width:"100%",height:"100%"}}><rect x="50" y="42" width="24" height="5" rx="2" fill={PL}/><rect x="55" y="47" width="5" height="20" rx="2" fill={PL}/><ellipse cx="36" cy="36" rx="20" ry="6" fill={BD} transform="rotate(-10,36,36)"/><circle cx="18" cy="30" r="7" fill={HD}/><line x1="30" y1="42" x2="28" y2="65" stroke={BD} strokeWidth="4" strokeLinecap="round"/><line x1="42" y1="38" x2="50" y2="62" stroke={BD} strokeWidth="4" strokeLinecap="round"/><g className="row-arm"><line x1="30" y1="35" x2="14" y2="42" stroke={P} strokeWidth="4" strokeLinecap="round"/><ellipse cx="10" cy="43" rx="6" ry="4" fill={BR}/></g></svg>,
  pulldown:()=><svg viewBox="0 0 80 80" style={{width:"100%",height:"100%"}}><rect x="5" y="2" width="70" height="6" rx="3" fill={BR}/><line x1="40" y1="8" x2="40" y2="18" stroke={PL} strokeWidth="2"/><rect x="24" y="16" width="32" height="5" rx="2.5" fill={BR}/><g className="pd-arms"><circle cx="40" cy="32" r="7" fill={HD}/><rect x="35" y="39" width="10" height="16" rx="4" fill={BD}/><line x1="37" y1="42" x2="24" y2="22" stroke={P} strokeWidth="3" strokeLinecap="round"/><line x1="43" y1="42" x2="56" y2="22" stroke={P} strokeWidth="3" strokeLinecap="round"/><line x1="37" y1="55" x2="30" y2="75" stroke={BD} strokeWidth="4" strokeLinecap="round"/><line x1="43" y1="55" x2="50" y2="75" stroke={BD} strokeWidth="4" strokeLinecap="round"/></g></svg>,
  crunch:()=><svg viewBox="0 0 80 80" style={{width:"100%",height:"100%"}}><rect x="5" y="70" width="70" height="4" rx="2" fill={PL}/><line x1="20" y1="65" x2="50" y2="65" stroke={BD} strokeWidth="5" strokeLinecap="round"/><line x1="50" y1="65" x2="65" y2="60" stroke={BD} strokeWidth="4" strokeLinecap="round"/><g className="cr-upper"><rect x="26" y="42" width="28" height="14" rx="5" fill={BD}/><circle cx="40" cy="35" r="8" fill={HD}/><line x1="34" y1="48" x2="26" y2="56" stroke={P} strokeWidth="3" strokeLinecap="round"/><line x1="46" y1="48" x2="54" y2="56" stroke={P} strokeWidth="3" strokeLinecap="round"/></g></svg>,
  legpress:()=><svg viewBox="0 0 80 80" style={{width:"100%",height:"100%"}}><rect x="4" y="48" width="24" height="6" rx="3" fill={PL}/><rect x="4" y="54" width="6" height="18" rx="3" fill={PL}/><circle cx="16" cy="42" r="8" fill={HD}/><rect x="10" y="50" width="12" height="20" rx="4" fill={BD}/><g className="lp-legs"><line x1="22" y1="52" x2="52" y2="38" stroke={P} strokeWidth="5" strokeLinecap="round"/><line x1="22" y1="58" x2="52" y2="48" stroke={P} strokeWidth="5" strokeLinecap="round"/><rect x="50" y="32" width="10" height="22" rx="3" fill={BR}/></g><rect x="60" y="28" width="16" height="30" rx="4" fill={PL}/></svg>,
  calf:()=><svg viewBox="0 0 80 80" style={{width:"100%",height:"100%"}}><rect x="15" y="65" width="50" height="8" rx="3" fill={PL}/><g className="cf-body"><circle cx="40" cy="10" r="7" fill={HD}/><rect x="35" y="17" width="10" height="22" rx="4" fill={BD}/><line x1="37" y1="39" x2="30" y2="58" stroke={BD} strokeWidth="5" strokeLinecap="round"/><line x1="43" y1="39" x2="50" y2="58" stroke={BD} strokeWidth="5" strokeLinecap="round"/><line x1="30" y1="58" x2="28" y2="68" stroke={P} strokeWidth="4" strokeLinecap="round"/><line x1="50" y1="58" x2="52" y2="68" stroke={P} strokeWidth="4" strokeLinecap="round"/></g></svg>,
  facepu:()=><svg viewBox="0 0 80 80" style={{width:"100%",height:"100%"}}><rect x="4" y="8" width="8" height="50" rx="4" fill={BR}/><line x1="12" y1="35" x2="28" y2="35" stroke={PL} strokeWidth="2"/><g style={{animation:"rowPull 1.6s ease-in-out infinite",transformOrigin:"50px 35px"}}><circle cx="42" cy="28" r="7" fill={HD}/><rect x="37" y="35" width="10" height="18" rx="4" fill={BD}/><line x1="38" y1="38" x2="22" y2="32" stroke={P} strokeWidth="3" strokeLinecap="round"/><line x1="47" y1="38" x2="22" y2="38" stroke={P} strokeWidth="3" strokeLinecap="round"/><line x1="39" y1="53" x2="32" y2="72" stroke={BD} strokeWidth="4" strokeLinecap="round"/><line x1="47" y1="53" x2="54" y2="72" stroke={BD} strokeWidth="4" strokeLinecap="round"/></g></svg>,
  default:()=><svg viewBox="0 0 80 80" style={{width:"100%",height:"100%"}}><g className="def-body"><circle cx="40" cy="14" r="8" fill={HD}/><rect x="34" y="22" width="12" height="22" rx="5" fill={BD}/><line x1="34" y1="28" x2="20" y2="40" stroke={P} strokeWidth="4" strokeLinecap="round"/><line x1="46" y1="28" x2="60" y2="40" stroke={P} strokeWidth="4" strokeLinecap="round"/><line x1="37" y1="44" x2="30" y2="68" stroke={BD} strokeWidth="4" strokeLinecap="round"/><line x1="43" y1="44" x2="50" y2="68" stroke={BD} strokeWidth="4" strokeLinecap="round"/></g><rect x="8" y="72" width="64" height="4" rx="2" fill={PL}/></svg>,
};

function getKey(n:string=""){
  const t=n.toLowerCase();
  if(t.includes("bench")||t.includes("incline")||t.includes("fly")||t.includes("pec"))return"bench";
  if(t.includes("squat"))return"squat";
  if(t.includes("curl")&&!t.includes("wrist"))return"curl";
  if(t.includes("deadlift")||t.includes("rdl"))return"deadlift";
  if(t.includes("overhead")||t.includes("ohp")||t.includes("shoulder press"))return"overhead";
  if(t.includes("lateral")||t.includes("raise")||t.includes("delt"))return"lateral";
  if(t.includes("row")||t.includes("seated cable"))return"row";
  if(t.includes("pulldown")||t.includes("pull-up")||t.includes("chin"))return"pulldown";
  if(t.includes("crunch")||t.includes("leg raise")||t.includes("rollout")||t.includes("ab "))return"crunch";
  if(t.includes("leg press")||t.includes("adduct")||t.includes("abduct")||t.includes("leg curl")||t.includes("extension"))return"legpress";
  if(t.includes("calf"))return"calf";
  if(t.includes("face pull")||t.includes("pushdown")||t.includes("tricep"))return"facepu";
  return"default";
}

function ExerciseTile({name,onTap,size=56}:{name:string;onTap:(e:React.MouseEvent)=>void;size?:number}){
  const A=ANIMS[getKey(name)]||ANIMS.default;
  return(
    <div onClick={onTap} className="m3i spring" style={{width:size,height:size,borderRadius:size*.28,background:M.primaryContainer,flexShrink:0,overflow:"hidden",color:"transparent"}}>
      <div style={{width:size-8,height:size-8}}><A/></div>
    </div>
  );
}

const ALL_EX=["Barbell Bench Press","Incline DB Press","Decline Bench Press","Cable Flyes","DB Flyes","Pec Deck","Overhead Press","Lateral Raises","Front Raises","Arnold Press","Rear Delt Flyes","Barbell Rows","DB Rows","Seated Cable Row","Lat Pulldown","Face Pull","Pull-Ups","Chin-Ups","Deadlift","Romanian Deadlift","Trap Bar Deadlift","Barbell Squat","Hack Squat","Leg Press","Leg Curl Machine","Leg Extension","Walking Lunges","Bulgarian Split Squat","Calf Raises","Barbell Curls","Hammer Curls","Preacher Curls","Tricep Pushdown","Skull Crushers","Dips","Cable Crunches","Hanging Leg Raises","Ab Wheel Rollout","Plank","Russian Twists","Adductor Machine","Abductor Machine","Wrist Curls","Farmer's Carry","Neck Flexion"];

interface Sub { name:string; reason:string; match:number; }
const SUBS: Record<string, Sub[]> = {
  "Barbell Bench Press":[{name:"DB Bench Press",reason:"Same pattern, dumbbells",match:98},{name:"Machine Chest Press",reason:"Guided option",match:92},{name:"Weighted Push-Up",reason:"Bodyweight fallback",match:80}],
  "Barbell Squat":[{name:"Hack Squat Machine",reason:"Similar quad drive",match:95},{name:"Leg Press",reason:"Seated alternative",match:88},{name:"Goblet Squat",reason:"DB front-loaded",match:84}],
  "Deadlift":[{name:"Trap Bar Deadlift",reason:"Same hinge, easier on back",match:95},{name:"Romanian Deadlift",reason:"Hamstring-focused",match:88}],
  "Lat Pulldown":[{name:"Pull-Ups",reason:"Bodyweight, same lats",match:97},{name:"DB Pullover",reason:"Lat stretch",match:79}],
};
const DEF_SUBS:Sub[]=[{name:"DB Variation",reason:"Dumbbell version",match:90},{name:"Machine Equivalent",reason:"Guided machine",match:85},{name:"Bodyweight Version",reason:"No equipment",match:75}];

interface Exercise { id:string; name:string; sets:number; reps:string; }
interface Routine { id:number; name:string; emoji:string; tag:string; lastDone:string; daysAgo:number; duration:string; exercises:Exercise[]; }

const INIT:Routine[]=[
  {id:1,name:"Pull Day",emoji:"🏋️",tag:"Back · Biceps · Rear Delts",lastDone:"2 days ago",daysAgo:2,duration:"60 min",exercises:[{id:"e7",name:"Deadlift",sets:4,reps:"5–6"},{id:"e8",name:"Barbell Rows",sets:4,reps:"8–10"},{id:"e9",name:"Lat Pulldown",sets:3,reps:"10–12"},{id:"e10",name:"Seated Cable Row",sets:3,reps:"10–12"},{id:"e11",name:"Face Pull",sets:3,reps:"15–20"},{id:"e12",name:"Barbell Curls",sets:3,reps:"10–12"}]},
  {id:2,name:"Leg Day",emoji:"🦵",tag:"Quads · Hamstrings · Glutes",lastDone:"5 days ago",daysAgo:5,duration:"65 min",exercises:[{id:"e13",name:"Barbell Squat",sets:4,reps:"6–8"},{id:"e14",name:"Romanian Deadlift",sets:3,reps:"10–12"},{id:"e15",name:"Leg Press",sets:3,reps:"12–15"},{id:"e16",name:"Leg Curl Machine",sets:3,reps:"12–15"},{id:"e17",name:"Walking Lunges",sets:3,reps:"12 ea"},{id:"e18",name:"Calf Raises",sets:4,reps:"15–20"}]},
  {id:3,name:"Push Day",emoji:"💪",tag:"Chest · Shoulders · Triceps",lastDone:"3 days ago",daysAgo:3,duration:"55 min",exercises:[{id:"e1",name:"Barbell Bench Press",sets:4,reps:"8–10"},{id:"e2",name:"Incline DB Press",sets:3,reps:"10–12"},{id:"e3",name:"Cable Flyes",sets:3,reps:"12–15"},{id:"e4",name:"Overhead Press",sets:4,reps:"8–10"},{id:"e5",name:"Lateral Raises",sets:3,reps:"15–20"},{id:"e6",name:"Tricep Pushdown",sets:3,reps:"12–15"}]},
  {id:4,name:"Upper Body",emoji:"⬆️",tag:"Full Upper",lastDone:"Today",daysAgo:0,duration:"70 min",exercises:[{id:"e19",name:"Bench Press",sets:4,reps:"8–10"},{id:"e20",name:"Barbell Rows",sets:4,reps:"8–10"},{id:"e21",name:"Overhead Press",sets:3,reps:"8–10"},{id:"e22",name:"Lat Pulldown",sets:3,reps:"10–12"},{id:"e23",name:"Incline DB Press",sets:3,reps:"10–12"}]},
  {id:5,name:"Misc / Isolation",emoji:"⚡",tag:"Abs · Forearms · Adductors",lastDone:"4 days ago",daysAgo:4,duration:"45 min",exercises:[{id:"e24",name:"Cable Crunches",sets:4,reps:"15–20"},{id:"e25",name:"Hanging Leg Raises",sets:3,reps:"12–15"},{id:"e26",name:"Ab Wheel Rollout",sets:3,reps:"10–12"},{id:"e27",name:"Adductor Machine",sets:4,reps:"15–20"},{id:"e28",name:"Abductor Machine",sets:4,reps:"15–20"},{id:"e29",name:"Wrist Curls",sets:3,reps:"15–20"},{id:"e30",name:"Seated Calf Raises",sets:4,reps:"15–20"}]},
];

const DETAILS: Record<string, {muscles:string;steps:string[];tip:string}> = {
  "Barbell Bench Press":{muscles:"Chest · Triceps · Front Delts",steps:["Lie flat, feet on floor","Grip just wider than shoulder-width","Lower bar to mid-chest with control","Press to full extension","Keep shoulder blades retracted"],tip:"Don't bounce the bar. Control the descent."},
  "Deadlift":{muscles:"Hamstrings · Glutes · Back · Traps",steps:["Bar over mid-foot, hip-width stance","Hinge at hips, grip outside knees","Brace core, neutral spine","Drive through floor, lock hips at top","Hinge to lower — never round"],tip:"Bar should stay dragging against your legs."},
  "Barbell Squat":{muscles:"Quads · Glutes · Hamstrings · Core",steps:["Bar on upper traps, feet shoulder-width","Brace core and sit back and down","Chest up, knees track over toes","Hit parallel or below","Drive through heels to stand"],tip:"Record yourself from the side to check depth."},
  "Lat Pulldown":{muscles:"Lats · Biceps · Rear Delts",steps:["Thighs under pads, wide grip","Pull to upper chest","Squeeze lats at bottom","Control the return slowly"],tip:"Drive elbows down, not back."},
  "Overhead Press":{muscles:"Front & Side Delts · Triceps",steps:["Grip just outside shoulders","Brace core, press straight up","Tuck chin as bar passes","Lock out overhead","Lower with control"],tip:"Keep glutes tight. Don't lean back."},
  "Lateral Raises":{muscles:"Side Deltoids",steps:["DBs at sides, slight elbow bend","Raise to shoulder height","Lead with elbows","Pause at top","3–4 second lowering"],tip:"Light and slow beats heavy and sloppy."},
};

function LoginScreen(){
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState<string|null>(null);
  const handleLogin=async()=>{
    setLoading(true);
    setErr(null);
    const {error}=await supabase.auth.signInWithOAuth({
      provider:"google",
      options:{redirectTo:window.location.origin}
    });
    if(error){setErr(error.message);setLoading(false);}
    // On success the browser redirects away — no further action needed here
  };
  return(
    <div style={{minHeight:"100vh",background:M.background,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"0 32px",fontFamily:FONT}}>
      <div style={{animation:"loginFloat 3s ease-in-out infinite",marginBottom:32}}>
        <div style={{width:96,height:96,borderRadius:28,background:M.primary,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <span style={{fontSize:64,fontWeight:900,color:M.onPrimary,fontFamily:FONT,lineHeight:1}}>F</span>
        </div>
      </div>
      <div style={{fontSize:36,fontWeight:900,color:M.onSurface,fontFamily:FONT,letterSpacing:"-.5px",marginBottom:8,textAlign:"center"}}>Fitty</div>
      <div style={{fontSize:15,color:M.onSurfaceVariant,fontFamily:FONT,marginBottom:48,textAlign:"center"}}>Your personal fitness tracker</div>
      <button onClick={handleLogin} disabled={loading} className="m3b" style={{background:M.surface,border:`1.5px solid ${M.outlineVariant}`,borderRadius:100,padding:"14px 28px",display:"flex",alignItems:"center",gap:12,fontFamily:FONT,fontWeight:700,fontSize:15,color:M.onSurface,width:"100%",maxWidth:300,justifyContent:"center",boxShadow:"0 2px 12px rgba(0,0,0,.08)",animation:"scaleIn .5s cubic-bezier(.34,1.56,.64,1)",opacity:loading?.6:1}}>
        <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#4285F4" d="M24 9.5c3.2 0 5.9 1.1 8.1 2.9l6-6C34.3 3.1 29.5 1 24 1 15.1 1 7.5 6.2 4 13.7l7 5.4C12.8 13.3 17.9 9.5 24 9.5z"/><path fill="#34A853" d="M46.1 24.6c0-1.6-.1-2.8-.4-4H24v7.7h12.5c-.5 2.8-2.2 5.2-4.7 6.8l7.3 5.7c4.3-3.9 6.9-9.7 6.9-16.2z"/><path fill="#FBBC05" d="M11 28.1l-7 5.4C6.5 40 14.3 45 24 45c5.6 0 10.3-1.9 13.7-5.1l-7.3-5.7c-1.8 1.2-4.1 1.9-6.4 1.9-6.1 0-11.3-4.1-13.1-9.7l.1-.3z"/><path fill="#EA4335" d="M4 13.7l7 5.4C12.8 13.3 17.9 9.5 24 9.5c3.2 0 5.9 1.1 8.1 2.9l6-6C34.3 3.1 29.5 1 24 1 15.1 1 7.5 6.2 4 13.7z"/></svg>
        {loading?"Signing in...":"Continue with Google"}
      </button>
      {err&&<div style={{fontSize:12,color:M.error,marginTop:12,textAlign:"center",fontFamily:FONT,maxWidth:300}}>{err}</div>}
      <div style={{fontSize:12,color:M.onSurfaceVariant,marginTop:20,textAlign:"center",fontFamily:FONT,maxWidth:260,lineHeight:1.6}}>
        Your data is private and only accessible to your Google account
      </div>
    </div>
  );
}

function ExerciseModal({name,onClose}:{name:string;onClose:()=>void}){
  const A=ANIMS[getKey(name)]||ANIMS.default;
  const d=DETAILS[name]||{muscles:"Multiple muscle groups",steps:["Set up with proper posture","Engage core","Perform with full control","Return to start slowly"],tip:"Focus on the target muscle."};
  const breath=BREATHING[getKey(name)]||BREATHING.default;
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(28,27,31,.6)",backdropFilter:"blur(6px)",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{width:"100%",maxWidth:430,background:M.surface,borderRadius:"28px 28px 0 0",maxHeight:"90vh",overflowY:"auto",animation:"slideUp .5s cubic-bezier(.34,1.56,.64,1)"}}>
        <div className="sheet-handle"/>
        <div style={{margin:"16px 20px 0",background:M.primaryContainer,borderRadius:24,padding:28,display:"flex",justifyContent:"center",position:"relative",minHeight:160}}>
          <div style={{width:144,height:144}}><A/></div>
          <button onClick={onClose} className="m3i" style={{position:"absolute",top:12,right:12,width:36,height:36,background:M.surfaceContainerHighest,color:M.onSurfaceVariant,fontSize:18}}>✕</button>
        </div>
        <div style={{padding:"20px 20px 52px"}}>
          <div style={{fontSize:24,fontWeight:900,color:M.onSurface,fontFamily:FONT,letterSpacing:"-.4px",marginBottom:8}}>{name}</div>
          <div style={{display:"inline-flex",background:M.secondaryContainer,borderRadius:100,padding:"5px 14px",marginBottom:20}}>
            <span style={{fontSize:12,fontWeight:700,color:M.onSecondaryContainer,fontFamily:FONT}}>💪 {d.muscles}</span>
          </div>
          <div style={{fontSize:11,fontWeight:700,color:M.onSurfaceVariant,letterSpacing:".8px",textTransform:"uppercase",marginBottom:12,fontFamily:FONT}}>How To</div>
          {d.steps.map((step,i)=>(
            <div key={i} style={{display:"flex",gap:14,marginBottom:12,alignItems:"flex-start",animation:`stagger .3s ${i*60}ms both`}}>
              <div style={{width:28,height:28,borderRadius:50,background:M.primary,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:12,fontWeight:800,color:M.onPrimary,fontFamily:FONT}}>{i+1}</div>
              <div style={{fontSize:14,color:M.onSurface,paddingTop:4,lineHeight:1.55,fontFamily:FONT}}>{step}</div>
            </div>
          ))}
          <div style={{background:M.secondaryContainer,borderRadius:20,padding:"14px 18px",marginTop:16,marginBottom:12}}>
            <div style={{fontSize:11,fontWeight:800,color:M.onSecondaryContainer,marginBottom:5,fontFamily:FONT,letterSpacing:".5px"}}>🌬️ BREATHING</div>
            <div style={{fontSize:13,color:M.onSecondaryContainer,fontFamily:FONT,lineHeight:1.5}}>{breath}</div>
          </div>
          <div style={{background:M.tertiaryContainer,borderRadius:20,padding:"14px 18px"}}>
            <div style={{fontSize:11,fontWeight:800,color:M.onTertiaryContainer,marginBottom:4,fontFamily:FONT,letterSpacing:".5px"}}>💡 PRO TIP</div>
            <div style={{fontSize:13,color:M.onTertiaryContainer,fontFamily:FONT,lineHeight:1.5}}>{d.tip}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StretchModal({type,onClose}:{type:string;onClose:()=>void}){
  const list=STRETCHES[type]||[];
  const isBefore=type.includes("efore");
  const title=isBefore?"🌅 Warm-Up Stretches":"🧘 Cool-Down Stretches";
  const sub=isBefore?"Do these before you start":"Take your time — you earned it";
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(28,27,31,.6)",backdropFilter:"blur(6px)",zIndex:400,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{width:"100%",maxWidth:430,background:M.surface,borderRadius:"28px 28px 0 0",maxHeight:"80vh",overflowY:"auto",animation:"slideUp .5s cubic-bezier(.34,1.56,.64,1)"}}>
        <div className="sheet-handle"/>
        <div style={{padding:"16px 20px 8px",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{fontSize:22,fontWeight:900,color:M.onSurface,fontFamily:FONT}}>{title}</div>
            <div style={{fontSize:13,color:M.onSurfaceVariant,fontFamily:FONT,marginTop:2}}>{sub}</div>
          </div>
          <button onClick={onClose} className="m3i" style={{width:36,height:36,background:M.surfaceContainerHighest,color:M.onSurfaceVariant,fontSize:18,flexShrink:0}}>✕</button>
        </div>
        <div style={{padding:"8px 20px 48px"}}>
          {list.map((s,i)=>(
            <div key={i} style={{display:"flex",gap:14,padding:"12px 0",borderBottom:i<list.length-1?`1px solid ${M.surfaceContainerHighest}`:"none",animation:`stagger .3s ${i*80}ms both`}}>
              <div style={{width:44,height:44,borderRadius:16,background:isBefore?M.primaryContainer:M.tertiaryContainer,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{s.emoji}</div>
              <div>
                <div style={{fontSize:14,fontWeight:700,color:M.onSurface,fontFamily:FONT,marginBottom:3}}>{s.name}</div>
                <div style={{fontSize:12,color:M.onSurfaceVariant,fontFamily:FONT,lineHeight:1.5}}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SwapDrawer({exerciseName,onSwap,onClose}:{exerciseName:string;onSwap:(sub:Partial<Sub>)=>void;onClose:()=>void}){
  const [search,setSearch]=useState("");
  const subs=SUBS[exerciseName]||DEF_SUBS;
  const results=search.trim().length>1?ALL_EX.filter(e=>e.toLowerCase().includes(search.toLowerCase())&&e!==exerciseName).slice(0,5):[];
  const ms=(m:number)=>m>=95?{bg:M.greenContainer,fg:M.greenPrimary}:m>=85?{bg:M.primaryContainer,fg:M.onPrimaryContainer}:{bg:M.orangeContainer,fg:M.orangePrimary};
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(28,27,31,.6)",backdropFilter:"blur(6px)",zIndex:300,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{width:"100%",maxWidth:430,background:M.surface,borderRadius:"28px 28px 0 0",maxHeight:"84vh",overflowY:"auto",animation:"slideUp .5s cubic-bezier(.34,1.56,.64,1)"}}>
        <div className="sheet-handle"/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 20px 12px"}}>
          <div>
            <div style={{fontSize:22,fontWeight:900,color:M.onSurface,fontFamily:FONT}}>Replace Exercise</div>
            <div style={{fontSize:13,color:M.onSurfaceVariant,fontFamily:FONT,marginTop:2}}>Swapping <b style={{color:M.onSurface}}>{exerciseName}</b></div>
          </div>
          <button onClick={onClose} className="m3i" style={{width:36,height:36,background:M.surfaceContainerHighest,color:M.onSurfaceVariant,fontSize:18}}>✕</button>
        </div>
        <div style={{padding:"0 20px 14px"}}>
          <div style={{position:"relative"}}>
            <svg style={{position:"absolute",left:18,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={M.onSurfaceVariant} strokeWidth="2.2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search any exercise…" style={{width:"100%",background:M.surfaceContainerHighest,border:"none",borderRadius:100,padding:"14px 20px 14px 48px",fontFamily:FONT,fontSize:14,color:M.onSurface,outline:"none"}}/>
          </div>
        </div>
        {results.length>0&&<div style={{padding:"0 20px"}}>
          <div style={{fontSize:11,fontWeight:700,color:M.onSurfaceVariant,letterSpacing:".8px",textTransform:"uppercase",marginBottom:10,fontFamily:FONT}}>Search Results</div>
          {results.map((ex,i)=>(
            <div key={i} onClick={()=>onSwap({name:ex})} className="m3b" style={{display:"flex",alignItems:"center",gap:14,padding:"12px 14px",background:M.surfaceContainerHigh,borderRadius:20,marginBottom:8,cursor:"pointer",animation:`stagger .25s ${i*50}ms both`}}>
              <ExerciseTile name={ex} onTap={e=>e.stopPropagation()} size={48}/>
              <div><div style={{fontSize:14,fontWeight:700,color:M.onSurface,fontFamily:FONT}}>{ex}</div><div style={{fontSize:12,color:M.onSurfaceVariant,fontFamily:FONT}}>Tap to replace</div></div>
            </div>
          ))}
          <div style={{height:1,background:M.outlineVariant,margin:"6px 0 16px"}}/>
        </div>}
        <div style={{padding:"0 20px 16px"}}>
          <div style={{fontSize:11,fontWeight:700,color:M.onSurfaceVariant,letterSpacing:".8px",textTransform:"uppercase",marginBottom:10,fontFamily:FONT}}>Suggested</div>
          {subs.map((sub,i)=>{const s=ms(sub.match||85);return(
            <div key={i} onClick={()=>onSwap(sub)} className="m3b" style={{display:"flex",alignItems:"center",gap:14,padding:"16px",background:M.surfaceContainerHighest,borderRadius:24,marginBottom:10,cursor:"pointer",animation:`stagger .3s ${i*60}ms both`}}>
              <ExerciseTile name={sub.name} onTap={e=>e.stopPropagation()} size={52}/>
              <div style={{flex:1}}><div style={{fontSize:15,fontWeight:800,color:M.onSurface,fontFamily:FONT,marginBottom:3}}>{sub.name}</div><div style={{fontSize:12,color:M.onSurfaceVariant,fontFamily:FONT}}>{sub.reason}</div></div>
              <div style={{background:s.bg,borderRadius:100,padding:"5px 12px",flexShrink:0}}><div style={{fontSize:14,fontWeight:900,color:s.fg,fontFamily:FONT}}>{sub.match||"—"}%</div></div>
            </div>
          );})}
        </div>
      </div>
    </div>
  );
}

function CalendarModal({onClose}:{onClose:()=>void}){
  const [view,setView]=useState("week");
  const [selectedDate,setSelectedDate]=useState<string|null>(null);
  const today="2026-03-29";
  const weekDays=["2026-03-23","2026-03-24","2026-03-25","2026-03-26","2026-03-27","2026-03-28","2026-03-29"];
  const weekLabels=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const marchDays=Array.from({length:31},(_,i)=>i+1);
  const getEntry=(dateStr:string)=>HISTORY[dateStr]||null;
  const getColor=(type:string)=>(TYPE_COLORS[type]||TYPE_COLORS["Rest"]);

  if(selectedDate){
    const entry=getEntry(selectedDate);
    const col=entry?getColor(entry.type):getColor("Rest");
    return(
      <div style={{position:"fixed",inset:0,background:"rgba(28,27,31,.6)",backdropFilter:"blur(6px)",zIndex:400,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
        <div style={{width:"100%",maxWidth:430,background:M.surface,borderRadius:"28px 28px 0 0",maxHeight:"80vh",overflowY:"auto",animation:"slideUp .5s cubic-bezier(.34,1.56,.64,1)"}}>
          <div className="sheet-handle"/>
          <div style={{padding:"16px 20px"}}>
            <button onClick={()=>setSelectedDate(null)} className="m3b" style={{background:M.surfaceContainerHighest,borderRadius:100,border:"none",padding:"8px 16px",fontSize:13,fontWeight:600,color:M.onSurfaceVariant,fontFamily:FONT,marginBottom:16,display:"flex",alignItems:"center",gap:6}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="15 18 9 12 15 6"/></svg>Back
            </button>
            <div style={{fontSize:13,color:M.onSurfaceVariant,fontFamily:FONT,marginBottom:4}}>
              {new Date(selectedDate+"T12:00:00").toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}
            </div>
            {entry?(
              <>
                <div style={{background:col.bg,borderRadius:24,padding:"20px",marginBottom:16,display:"flex",alignItems:"center",gap:16}}>
                  <span style={{fontSize:40}}>{entry.emoji}</span>
                  <div>
                    <div style={{fontSize:22,fontWeight:900,color:col.fg,fontFamily:FONT}}>{entry.type}</div>
                    {entry.miles&&<div style={{fontSize:14,color:col.fg,opacity:.85,fontFamily:FONT,marginTop:2}}>{entry.miles} miles</div>}
                  </div>
                </div>
                {entry.exercises&&entry.exercises.map((ex,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:i<(entry.exercises?.length??0)-1?`1px solid ${M.surfaceContainerHighest}`:"none",animation:`stagger .25s ${i*50}ms both`}}>
                    <ExerciseTile name={ex} onTap={()=>{}} size={44}/>
                    <div style={{fontSize:14,fontWeight:600,color:M.onSurface,fontFamily:FONT}}>{ex}</div>
                  </div>
                ))}
              </>
            ):(
              <div style={{textAlign:"center",padding:"40px 0",color:M.onSurfaceVariant,fontFamily:FONT}}>
                <div style={{fontSize:48,marginBottom:12}}>😴</div>
                <div style={{fontSize:16,fontWeight:700}}>Rest Day</div>
                <div style={{fontSize:13,marginTop:4}}>Recovery is part of the process</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(28,27,31,.6)",backdropFilter:"blur(6px)",zIndex:400,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{width:"100%",maxWidth:430,background:M.surface,borderRadius:"28px 28px 0 0",maxHeight:"85vh",overflowY:"auto",animation:"slideUp .5s cubic-bezier(.34,1.56,.64,1)"}}>
        <div className="sheet-handle"/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 20px 12px"}}>
          <div style={{fontSize:22,fontWeight:900,color:M.onSurface,fontFamily:FONT}}>Activity</div>
          <button onClick={onClose} className="m3i" style={{width:36,height:36,background:M.surfaceContainerHighest,color:M.onSurfaceVariant,fontSize:18}}>✕</button>
        </div>
        <div style={{display:"flex",gap:8,padding:"0 20px 16px"}}>
          {["week","month"].map(v=>(
            <button key={v} onClick={()=>setView(v)} className="m3b spring" style={{background:view===v?M.primaryContainer:M.surfaceContainerHighest,color:view===v?M.onPrimaryContainer:M.onSurfaceVariant,borderRadius:100,padding:"8px 20px",fontWeight:700,fontSize:13,fontFamily:FONT}}>
              {v==="week"?"This Week":"Month"}
            </button>
          ))}
          <div style={{marginLeft:"auto",display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",justifyContent:"flex-end"}}>
            {[["Push","#EADDFF","#21005D"],["Pull","#E8DEF8","#1D192B"],["Legs","#FFD8E4","#31111D"],["Run","#BBDEFB","#0D47A1"]].map(([l,bg,fg])=>(
              <div key={l} style={{background:bg,borderRadius:100,padding:"2px 8px",fontSize:10,fontWeight:700,color:fg,fontFamily:FONT}}>{l}</div>
            ))}
          </div>
        </div>
        {view==="week"&&(
          <div style={{padding:"0 16px 32px",animation:"tabIn .3s cubic-bezier(.2,0,0,1)"}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:6}}>
              {weekDays.map((d,i)=>{
                const entry=getEntry(d);
                const col=entry?getColor(entry.type):null;
                const isToday=d===today;
                return(
                  <div key={d} onClick={()=>setSelectedDate(d)} className="m3b spring" style={{cursor:"pointer",textAlign:"center"}}>
                    <div style={{fontSize:10,color:isToday?M.primary:M.onSurfaceVariant,fontWeight:isToday?800:500,fontFamily:FONT,marginBottom:4}}>{weekLabels[i]}</div>
                    <div style={{height:72,borderRadius:18,background:col?col.bg:M.surfaceContainerHighest,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",border:isToday?`2px solid ${M.primary}`:"2px solid transparent",transition:"transform .25s cubic-bezier(.34,1.56,.64,1)"}}>
                      {entry&&<span style={{fontSize:18}}>{entry.emoji}</span>}
                      {entry?.miles&&<span style={{fontSize:10,fontWeight:700,color:col?.fg,fontFamily:FONT,marginTop:2}}>{entry.miles}mi</span>}
                    </div>
                    <div style={{fontSize:10,fontWeight:isToday?800:400,color:isToday?M.primary:M.onSurfaceVariant,fontFamily:FONT,marginTop:4}}>{new Date(d+"T12:00:00").getDate()}</div>
                  </div>
                );
              })}
            </div>
            <div style={{marginTop:20,fontSize:13,color:M.onSurfaceVariant,textAlign:"center",fontFamily:FONT}}>Tap a day to see workout details</div>
          </div>
        )}
        {view==="month"&&(
          <div style={{padding:"0 16px 32px",animation:"tabIn .3s cubic-bezier(.2,0,0,1)"}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:8}}>
              {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d=>(
                <div key={d} style={{textAlign:"center",fontSize:10,fontWeight:700,color:M.onSurfaceVariant,fontFamily:FONT,padding:"4px 0"}}>{d}</div>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
              {marchDays.map(day=>{
                const dateStr=`2026-03-${String(day).padStart(2,"0")}`;
                const entry=getEntry(dateStr);
                const col=entry?getColor(entry.type):null;
                const isToday=dateStr===today;
                const future=day>29;
                return(
                  <div key={day} onClick={()=>!future&&setSelectedDate(dateStr)} className={future?"":"m3b"} style={{aspectRatio:"1",borderRadius:12,background:future?M.surfaceContainerLow:col?col.bg:M.surfaceContainerHighest,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",border:isToday?`2px solid ${M.primary}`:"2px solid transparent",cursor:future?"default":"pointer",opacity:future?.35:1,transition:"transform .25s cubic-bezier(.34,1.56,.64,1)"}}>
                    <span style={{fontSize:10,fontWeight:isToday?800:600,color:col?col.fg:M.onSurfaceVariant,fontFamily:FONT}}>{day}</span>
                    {entry&&!future&&<span style={{fontSize:12,marginTop:1}}>{entry.emoji}</span>}
                  </div>
                );
              })}
            </div>
            <div style={{marginTop:16,fontSize:13,color:M.onSurfaceVariant,textAlign:"center",fontFamily:FONT}}>Tap any day to see details</div>
          </div>
        )}
      </div>
    </div>
  );
}

function SetBurst({show}:{show:boolean}){
  if(!show)return null;
  return(
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{position:"relative",width:120,height:120,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div className="burst-ring" style={{position:"absolute",width:90,height:90,borderRadius:"50%",border:`3px solid ${M.primary}`,opacity:0}}/>
        <div className="check-pop" style={{fontSize:48,opacity:0,animation:"checkSpring .4s cubic-bezier(.34,1.56,.64,1) forwards"}}>✅</div>
        <div className="xp-fly" style={{position:"absolute",top:"8%",left:"50%",transform:"translateX(-50%)",fontSize:13,fontWeight:800,color:M.onPrimary,background:M.primary,borderRadius:100,padding:"4px 14px",boxShadow:`0 4px 16px ${M.primary}55`,opacity:0,whiteSpace:"nowrap",fontFamily:FONT}}>+10 XP</div>
      </div>
    </div>
  );
}

interface SetRow { weight:number; reps:number; done:boolean; }
interface ActiveExercise extends Exercise { rows:SetRow[]; }

function ActiveScreen({routine,onFinish,onBack}:{routine:Routine;onFinish:()=>void;onBack:()=>void}){
  const [exercises,setExercises]=useState<ActiveExercise[]>(()=>routine.exercises.map(ex=>({...ex,rows:Array.from({length:ex.sets},(_,i)=>({weight:70-i*2.5,reps:parseInt(ex.reps)||10,done:false}))})));
  const [swapIdx,setSwapIdx]=useState<number|null>(null);
  const [swapped,setSwapped]=useState<Record<number,boolean>>({});
  const [modalEx,setModalEx]=useState<string|null>(null);
  const [burst,setBurst]=useState(false);
  const [stretchType,setStretchType]=useState<string|null>(null);
  const total=exercises.reduce((a,e)=>a+e.rows.length,0);
  const done=exercises.reduce((a,e)=>a+e.rows.filter(s=>s.done).length,0);
  const pct=total?(done/total)*100:0;
  const toggle=(ei:number,si:number)=>{const was=exercises[ei].rows[si].done;setExercises(p=>p.map((e,i)=>i!==ei?e:{...e,rows:e.rows.map((r,j)=>j!==si?r:{...r,done:!r.done})}));if(!was){setBurst(true);setTimeout(()=>setBurst(false),900);}};
  const doSwap=(sub:Partial<Sub>)=>{setExercises(p=>p.map((e,i)=>i!==swapIdx?e:{...e,name:sub.name||e.name}));setSwapped(p=>({...p,[swapIdx!]:true}));setSwapIdx(null);};
  return(
    <div style={{background:M.background,minHeight:"100vh"}}>
      {modalEx&&<ExerciseModal name={modalEx} onClose={()=>setModalEx(null)}/>}
      {swapIdx!==null&&<SwapDrawer exerciseName={exercises[swapIdx]?.name} onSwap={doSwap} onClose={()=>setSwapIdx(null)}/>}
      {stretchType&&<StretchModal type={stretchType} onClose={()=>setStretchType(null)}/>}
      <SetBurst show={burst}/>
      <div style={{background:M.surfaceContainer}}>
        <div style={{display:"flex",alignItems:"center",gap:4,padding:"12px 8px 8px"}}>
          <button onClick={onBack} className="m3i" style={{width:44,height:44,background:"transparent",color:M.onSurface}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div style={{flex:1,padding:"0 8px"}}>
            <div style={{fontSize:22,fontWeight:900,color:M.onSurface,fontFamily:FONT,letterSpacing:"-.3px"}}>{routine.emoji} {routine.name}</div>
            <div style={{fontSize:12,color:M.onSurfaceVariant,fontFamily:FONT,marginTop:1}}>{done}/{total} sets · +{done*10} XP</div>
          </div>
          <button onClick={onFinish} className="m3b" style={{background:M.primary,color:M.onPrimary,borderRadius:100,padding:"10px 20px",fontWeight:700,fontSize:13,fontFamily:FONT,marginRight:8}}>Finish ✓</button>
        </div>
        <div style={{height:4,background:M.surfaceContainerHighest}}>
          <div className="ease" style={{height:"100%",width:`${pct}%`,background:M.primary,borderRadius:"0 3px 3px 0"}}/>
        </div>
      </div>
      <div style={{margin:"12px 16px 0",background:M.primaryContainer,borderRadius:20,padding:"12px 16px",display:"flex",alignItems:"center",gap:12}} onClick={()=>setStretchType("before")} className="m3b">
        <span style={{fontSize:24}}>🌅</span>
        <div style={{flex:1}}>
          <div style={{fontSize:13,fontWeight:700,color:M.onPrimaryContainer,fontFamily:FONT}}>Warm-Up Stretches</div>
          <div style={{fontSize:11,color:M.onPrimaryContainer,opacity:.75,fontFamily:FONT}}>Tap to see pre-workout stretches</div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={M.onPrimaryContainer} strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
      <div style={{padding:"12px 16px 100px"}}>
        {exercises.map((ex,ei)=>(
          <div key={ei} style={{marginBottom:12,borderRadius:28,border:`1.5px solid ${swapped[ei]?M.tertiary:M.outlineVariant}`,overflow:"hidden",background:M.surface,animation:`stagger .3s ${ei*60}ms both`}}>
            <div style={{padding:"14px 16px",display:"flex",alignItems:"center",gap:14,borderBottom:`1px solid ${M.surfaceContainerHighest}`}}>
              <ExerciseTile name={ex.name} onTap={()=>setModalEx(ex.name)} size={56}/>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                  <span style={{fontSize:15,fontWeight:800,color:M.onSurface,fontFamily:FONT}}>{ex.name}</span>
                  {swapped[ei]&&<span style={{fontSize:10,fontWeight:700,padding:"2px 10px",background:M.tertiaryContainer,color:M.onTertiaryContainer,borderRadius:100,fontFamily:FONT}}>Swapped</span>}
                </div>
                <div style={{fontSize:12,color:M.onSurfaceVariant,fontFamily:FONT}}>{ex.sets} sets · {ex.reps} reps · tap icon for guide</div>
              </div>
              <button onClick={()=>setSwapIdx(ei)} className="m3b" style={{background:M.surfaceContainerHighest,borderRadius:100,color:M.onSurfaceVariant,padding:"8px 14px",fontSize:12,fontWeight:600,fontFamily:FONT,display:"flex",alignItems:"center",gap:5}}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/></svg>Swap
              </button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"28px 1fr 1fr 48px",gap:8,padding:"10px 16px 4px",fontSize:10,color:M.onSurfaceVariant,fontWeight:700,letterSpacing:".8px",textTransform:"uppercase",fontFamily:FONT}}>
              <span>#</span><span>kg</span><span>Reps</span><span/>
            </div>
            {ex.rows.map((s,si)=>(
              <div key={si} className="fast" style={{display:"grid",gridTemplateColumns:"28px 1fr 1fr 48px",gap:8,padding:"6px 16px",background:s.done?`${M.primaryContainer}70`:"transparent",alignItems:"center"}}>
                <span style={{fontSize:12,fontWeight:700,color:s.done?M.primary:M.onSurfaceVariant,fontFamily:FONT}}>{si+1}</span>
                <div className="fast" style={{background:s.done?M.primaryContainer:M.surfaceContainerHighest,borderRadius:12,padding:"9px 12px",fontSize:14,fontWeight:700,color:s.done?M.onPrimaryContainer:M.onSurface,fontFamily:FONT}}>{s.weight}</div>
                <div className="fast" style={{background:s.done?M.primaryContainer:M.surfaceContainerHighest,borderRadius:12,padding:"9px 12px",fontSize:14,fontWeight:700,color:s.done?M.onPrimaryContainer:M.onSurface,fontFamily:FONT}}>{s.reps}</div>
                <button onClick={()=>toggle(ei,si)} className="m3i spring" style={{width:40,height:40,border:`2px solid ${s.done?M.primary:M.outline}`,background:s.done?M.primary:"transparent",color:s.done?M.onPrimary:M.outline}}>
                  {s.done&&<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                </button>
              </div>
            ))}
            <div style={{padding:"8px 16px 14px"}}>
              <button className="m3b" style={{width:"100%",background:"transparent",border:`1.5px dashed ${M.outlineVariant}`,borderRadius:14,color:M.primary,padding:"9px",fontSize:13,fontWeight:600,fontFamily:FONT}}>+ Add Set</button>
            </div>
          </div>
        ))}
        <div style={{background:M.tertiaryContainer,borderRadius:20,padding:"12px 16px",display:"flex",alignItems:"center",gap:12,marginTop:4}} onClick={()=>setStretchType("after")} className="m3b">
          <span style={{fontSize:24}}>🧘</span>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:700,color:M.onTertiaryContainer,fontFamily:FONT}}>Cool-Down Stretches</div>
            <div style={{fontSize:11,color:M.onTertiaryContainer,opacity:.75,fontFamily:FONT}}>Tap after your last set</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={M.onTertiaryContainer} strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
      </div>
    </div>
  );
}

const TONES=[
  {bg:M.primaryContainer,fg:M.onPrimaryContainer,btn:M.primary,btnFg:M.onPrimary},
  {bg:M.secondaryContainer,fg:M.onSecondaryContainer,btn:M.secondary,btnFg:M.onSecondary},
  {bg:M.tertiaryContainer,fg:M.onTertiaryContainer,btn:M.tertiary,btnFg:M.onTertiary},
  {bg:M.greenContainer,fg:M.onGreenContainer,btn:M.greenPrimary,btnFg:"#fff"},
  {bg:M.orangeContainer,fg:M.onOrangeContainer,btn:M.orangePrimary,btnFg:"#fff"},
];

function RoutinesScreen({routines,setRoutines,onStart}:{routines:Routine[];setRoutines:React.Dispatch<React.SetStateAction<Routine[]>>;onStart:(r:Routine)=>void}){
  const [open,setOpen]=useState<number|null>(null);
  const [editing,setEditing]=useState<number|null>(null);
  const [renaming,setRenaming]=useState<{rIdx:number;eIdx:number}|null>(null);
  const [renameVal,setRenameVal]=useState("");
  const [addingEx,setAddingEx]=useState(false);
  const [exSearch,setExSearch]=useState("");
  const [newExName,setNewExName]=useState("");
  const [modalEx,setModalEx]=useState<string|null>(null);
  const [stretchType,setStretchType]=useState<string|null>(null);
  const [preSwap,setPreSwap]=useState<{rIdx:number;eIdx:number}|null>(null);

  const exResults=exSearch.trim().length>1?ALL_EX.filter(e=>e.toLowerCase().includes(exSearch.toLowerCase())).slice(0,5):[];
  const moveEx=(rIdx:number,from:number,to:number)=>{if(to<0||to>=routines[rIdx].exercises.length)return;setRoutines(p=>p.map((r,ri)=>{if(ri!==rIdx)return r;const exs=[...r.exercises];const[m]=exs.splice(from,1);exs.splice(to,0,m);return{...r,exercises:exs};}));};
  const commitRename=()=>{if(!renaming||!renameVal.trim()){setRenaming(null);return;}setRoutines(p=>p.map((r,ri)=>ri!==renaming.rIdx?r:{...r,exercises:r.exercises.map((e,ei)=>ei!==renaming.eIdx?e:{...e,name:renameVal.trim()})}));setRenaming(null);};
  const removeEx=(rIdx:number,eIdx:number)=>setRoutines(p=>p.map((r,ri)=>ri!==rIdx?r:{...r,exercises:r.exercises.filter((_,ei)=>ei!==eIdx)}));
  const addEx=(rIdx:number,name?:string)=>{const nm=(name||newExName).trim();if(!nm)return;setRoutines(p=>p.map((r,ri)=>ri!==rIdx?r:{...r,exercises:[...r.exercises,{id:"ex"+Date.now(),name:nm,sets:3,reps:"10–12"}]}));setNewExName("");setExSearch("");setAddingEx(false);};
  const doPreSwap=(sub:Partial<Sub>)=>{if(!preSwap)return;setRoutines(p=>p.map((r,ri)=>ri!==preSwap.rIdx?r:{...r,exercises:r.exercises.map((e,ei)=>ei!==preSwap.eIdx?e:{...e,name:sub.name||e.name})}));setPreSwap(null);};

  return(
    <div>
      {modalEx&&<ExerciseModal name={modalEx} onClose={()=>setModalEx(null)}/>}
      {stretchType&&<StretchModal type={stretchType} onClose={()=>setStretchType(null)}/>}
      {preSwap&&<SwapDrawer exerciseName={routines[preSwap.rIdx]?.exercises[preSwap.eIdx]?.name} onSwap={doPreSwap} onClose={()=>setPreSwap(null)}/>}

      <div style={{padding:"4px 20px 20px",animation:"heroIn .5s cubic-bezier(.2,0,0,1)"}}>
        <div style={{fontSize:34,fontWeight:900,color:M.onSurface,fontFamily:FONT,letterSpacing:"-.6px",lineHeight:1.1}}>My Routines</div>
        <div style={{fontSize:14,color:M.onSurfaceVariant,fontFamily:FONT,marginTop:5}}>Tap to expand · Replace before starting</div>
      </div>

      {routines.map((r,rIdx)=>{
        const isOpen=open===r.id,isEditing=editing===rIdx,tone=TONES[rIdx%TONES.length];
        return(
          <div key={r.id} style={{margin:"0 16px 12px",animation:`stagger .3s ${rIdx*50}ms both`}}>
            <div onClick={()=>{if(!isEditing)setOpen(isOpen?null:r.id);}} className="m3b" style={{background:isOpen?tone.bg:M.surfaceContainerHighest,borderRadius:isOpen?"28px 28px 0 0":28,padding:20,cursor:isEditing?"default":"pointer",transition:"background .25s,border-radius .25s"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                    <span style={{fontSize:30}}>{r.emoji}</span>
                    <span style={{fontSize:20,fontWeight:900,color:isOpen?tone.fg:M.onSurface,fontFamily:FONT,letterSpacing:"-.3px"}}>{r.name}</span>
                  </div>
                  <div style={{fontSize:13,color:isOpen?tone.fg:M.onSurfaceVariant,fontFamily:FONT,marginBottom:12,opacity:.85}}>{r.tag}</div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    {[`⏱ ${r.duration}`,`${r.exercises.length} exercises`].map(label=>(
                      <span key={label} style={{fontSize:11,fontWeight:600,background:"rgba(0,0,0,.1)",color:isOpen?tone.fg:M.onSurfaceVariant,padding:"4px 12px",borderRadius:100,fontFamily:FONT}}>{label}</span>
                    ))}
                    <span style={{fontSize:11,fontWeight:r.daysAgo===0?700:400,color:r.daysAgo===0?M.greenPrimary:isOpen?tone.fg:M.onSurfaceVariant,fontFamily:FONT}}>{r.lastDone}</span>
                  </div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:10,alignItems:"flex-end",marginLeft:12}}>
                  <button onClick={e=>{e.stopPropagation();if(!isEditing){setEditing(rIdx);setOpen(r.id);}else setEditing(null);}} className="m3b" style={{background:isEditing?tone.btn:M.surfaceContainer,color:isEditing?tone.btnFg:M.onSurfaceVariant,borderRadius:100,padding:"7px 16px",fontSize:12,fontWeight:700,fontFamily:FONT}}>{isEditing?"Done":"Edit"}</button>
                  <svg className="spring" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isOpen?tone.fg:M.onSurfaceVariant} strokeWidth="2.2" style={{transform:isOpen?"rotate(180deg)":"none",marginTop:2}}><polyline points="6 9 12 15 18 9"/></svg>
                </div>
              </div>
            </div>

            {isOpen&&(
              <div style={{background:M.surface,border:`1.5px solid ${tone.bg}`,borderTop:"none",borderRadius:"0 0 28px 28px",padding:"4px 16px 20px",animation:"scaleIn .35s cubic-bezier(.34,1.56,.64,1)"}}>
                {!isEditing&&(
                  <div style={{display:"flex",gap:8,padding:"10px 4px 4px"}}>
                    <button onClick={()=>setStretchType("before")} className="m3b" style={{flex:1,background:M.primaryContainer,borderRadius:100,color:M.onPrimaryContainer,padding:"8px 12px",fontSize:12,fontWeight:700,fontFamily:FONT,display:"flex",alignItems:"center",gap:6,justifyContent:"center"}}>🌅 Warm-up</button>
                    <button onClick={()=>setStretchType("after")} className="m3b" style={{flex:1,background:M.tertiaryContainer,borderRadius:100,color:M.onTertiaryContainer,padding:"8px 12px",fontSize:12,fontWeight:700,fontFamily:FONT,display:"flex",alignItems:"center",gap:6,justifyContent:"center"}}>🧘 Cool-down</button>
                  </div>
                )}

                {r.exercises.map((ex,eIdx)=>(
                  <div key={ex.id} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 4px",borderBottom:eIdx<r.exercises.length-1?`1px solid ${M.surfaceContainerHighest}`:"none",animation:`stagger .25s ${eIdx*40}ms both`}}>
                    <ExerciseTile name={ex.name} onTap={()=>setModalEx(ex.name)} size={48}/>
                    <div style={{flex:1}}>
                      {renaming?.rIdx===rIdx&&renaming?.eIdx===eIdx?(
                        <div style={{display:"flex",gap:8}}>
                          <input autoFocus value={renameVal} onChange={e=>setRenameVal(e.target.value)} onKeyDown={e=>e.key==="Enter"&&commitRename()} style={{flex:1,background:M.surfaceContainerHighest,border:`2px solid ${M.primary}`,borderRadius:14,padding:"8px 12px",fontSize:13,fontFamily:FONT,color:M.onSurface,outline:"none"}}/>
                          <button onClick={commitRename} className="m3b" style={{background:M.primary,borderRadius:14,color:M.onPrimary,fontWeight:700,fontSize:13,padding:"8px 14px",fontFamily:FONT}}>✓</button>
                        </div>
                      ):(
                        <><div style={{fontSize:14,fontWeight:700,color:M.onSurface,fontFamily:FONT}}>{ex.name}</div><div style={{fontSize:12,color:M.onSurfaceVariant,fontFamily:FONT}}>{ex.sets}×{ex.reps}</div></>
                      )}
                    </div>
                    {!isEditing&&!renaming&&(
                      <button onClick={()=>setPreSwap({rIdx,eIdx})} className="m3b" style={{background:M.surfaceContainerHighest,borderRadius:100,color:M.onSurfaceVariant,padding:"6px 12px",fontSize:11,fontWeight:700,fontFamily:FONT,display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/></svg>Replace
                      </button>
                    )}
                    {isEditing&&renaming?.rIdx!==rIdx&&(
                      <div style={{display:"flex",gap:4}}>
                        <button onClick={()=>{setRenaming({rIdx,eIdx});setRenameVal(ex.name);}} className="m3b" style={{background:M.primaryContainer,borderRadius:100,color:M.onPrimaryContainer,fontSize:11,fontWeight:700,padding:"5px 8px",fontFamily:FONT}}>Rename</button>
                        <button onClick={()=>moveEx(rIdx,eIdx,eIdx-1)} className="m3b" style={{background:M.surfaceContainerHighest,borderRadius:100,color:M.onSurfaceVariant,fontSize:11,padding:"5px 8px"}}>▲</button>
                        <button onClick={()=>moveEx(rIdx,eIdx,eIdx+1)} className="m3b" style={{background:M.surfaceContainerHighest,borderRadius:100,color:M.onSurfaceVariant,fontSize:11,padding:"5px 8px"}}>▼</button>
                        <button onClick={()=>removeEx(rIdx,eIdx)} className="m3b" style={{background:M.errorContainer,borderRadius:100,color:M.error,fontSize:11,fontWeight:700,padding:"5px 8px",fontFamily:FONT}}>✕</button>
                      </div>
                    )}
                  </div>
                ))}

                {isEditing&&(addingEx?(
                  <div style={{paddingTop:12}}>
                    <div style={{position:"relative",marginBottom:8}}>
                      <svg style={{position:"absolute",left:18,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={M.onSurfaceVariant} strokeWidth="2.2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                      <input value={exSearch} onChange={e=>{setExSearch(e.target.value);setNewExName(e.target.value);}} placeholder="Search or type exercise…" style={{width:"100%",background:M.surfaceContainerHighest,border:"none",borderRadius:100,padding:"14px 20px 14px 48px",fontFamily:FONT,fontSize:14,color:M.onSurface,outline:"none"}}/>
                    </div>
                    {exResults.map((ex,i)=>(
                      <div key={i} onClick={()=>addEx(rIdx,ex)} className="m3b" style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",background:M.surfaceContainerHighest,borderRadius:18,marginTop:6,cursor:"pointer"}}>
                        <ExerciseTile name={ex} onTap={e=>{e.stopPropagation();setModalEx(ex);}} size={40}/>
                        <span style={{fontSize:13,fontWeight:600,color:M.onSurface,fontFamily:FONT}}>{ex}</span>
                      </div>
                    ))}
                    <div style={{display:"flex",gap:8,marginTop:10}}>
                      <button onClick={()=>addEx(rIdx)} className="m3b" style={{flex:1,background:M.primary,color:M.onPrimary,borderRadius:20,padding:13,fontSize:14,fontWeight:700,fontFamily:FONT}}>Add</button>
                      <button onClick={()=>{setAddingEx(false);setExSearch("");}} className="m3b" style={{background:"transparent",border:`1.5px solid ${M.outline}`,borderRadius:20,color:M.primary,padding:"12px 20px",fontWeight:600,fontFamily:FONT}}>Cancel</button>
                    </div>
                  </div>
                ):(
                  <button onClick={()=>setAddingEx(true)} className="m3b" style={{width:"100%",background:"transparent",border:`1.5px dashed ${M.outlineVariant}`,borderRadius:18,color:M.primary,fontWeight:700,fontSize:14,padding:13,marginTop:12,fontFamily:FONT}}>+ Add Exercise</button>
                ))}
                {!isEditing&&(
                  <button onClick={()=>onStart(r)} className="m3b spring" style={{width:"100%",background:tone.btn,color:tone.btnFg,borderRadius:20,padding:15,fontSize:15,fontWeight:800,fontFamily:FONT,marginTop:16}}>
                    Start {r.name}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      <div style={{margin:"4px 16px 8px",background:M.surfaceContainerHighest,borderRadius:24,padding:"18px 20px"}}>
        <div style={{fontSize:14,fontWeight:700,color:M.onSurface,fontFamily:FONT,marginBottom:3}}>Want AI workout recommendations?</div>
        <div style={{fontSize:12,color:M.onSurfaceVariant,fontFamily:FONT,lineHeight:1.5}}>Head to your Claude chat and describe what you've been doing — no extra cost, and Claude already knows your full history.</div>
      </div>
    </div>
  );
}

function HomeScreen({onStartWorkout,onOpenCalendar,firstName}:{onStartWorkout:()=>void;onOpenCalendar:()=>void;firstName:string}){
  const now=new Date();
  const hour=now.getHours();
  const greeting=hour<12?"Good morning":hour<17?"Good afternoon":"Good evening";
  const dayName=now.toLocaleDateString("en-US",{weekday:"long"});
  const dateLabel=now.toLocaleDateString("en-US",{month:"long",day:"numeric"});
  return(
    <div style={{padding:"0 16px 16px",animation:"heroIn .55s cubic-bezier(.2,0,0,1)"}}>
      <div style={{background:M.primaryContainer,borderRadius:28,padding:"28px 24px 24px",marginBottom:16,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",right:-30,top:-30,width:130,height:130,borderRadius:"50%",background:M.primary,opacity:.08}}/>
        <div style={{position:"absolute",right:20,bottom:-40,width:90,height:90,borderRadius:"50%",background:M.tertiary,opacity:.12}}/>
        <div style={{fontSize:12,color:M.onPrimaryContainer,fontFamily:FONT,fontWeight:600,opacity:.7,marginBottom:6}}>{dayName} · {dateLabel}</div>
        <div style={{fontSize:30,fontWeight:900,color:M.onPrimaryContainer,fontFamily:FONT,letterSpacing:"-.5px",lineHeight:1.2}}>{greeting},<br/>{firstName} 💪</div>
      </div>
      <div style={{display:"flex",gap:10,marginBottom:16,overflowX:"auto",paddingBottom:4}}>
        {[{icon:"🔥",val:"12",unit:"streak",bg:M.tertiaryContainer,fg:M.onTertiaryContainer},{icon:"📅",val:"4",unit:"this week",bg:M.primaryContainer,fg:M.onPrimaryContainer},{icon:"🏆",val:"7",unit:"PRs",bg:M.secondaryContainer,fg:M.onSecondaryContainer}].map(s=>(
          <div key={s.unit} style={{background:s.bg,borderRadius:20,padding:"14px 18px",flexShrink:0,display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:24}}>{s.icon}</span>
            <div><div style={{fontSize:22,fontWeight:900,color:s.fg,fontFamily:FONT,lineHeight:1}}>{s.val}</div><div style={{fontSize:11,color:s.fg,opacity:.75,fontFamily:FONT,marginTop:1}}>{s.unit}</div></div>
          </div>
        ))}
      </div>
      <button onClick={onStartWorkout} className="m3b" style={{width:"100%",background:M.primaryContainer,color:M.onPrimaryContainer,borderRadius:20,padding:"20px",fontFamily:FONT,fontWeight:800,fontSize:16,display:"flex",alignItems:"center",gap:14,justifyContent:"center",marginBottom:16,boxShadow:`0 2px 12px ${M.primary}28`,animation:"scaleIn .4s cubic-bezier(.34,1.56,.64,1) .1s both"}}>
        <span style={{fontSize:28}}>🏋️</span>Start Workout
      </button>
      <div onClick={onOpenCalendar} className="m3b" style={{background:M.surfaceContainerHighest,borderRadius:28,padding:20,marginBottom:16,cursor:"pointer"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div style={{fontSize:12,fontWeight:700,color:M.onSurfaceVariant,letterSpacing:".5px",textTransform:"uppercase",fontFamily:FONT}}>This Week</div>
          <div style={{fontSize:11,color:M.primary,fontWeight:700,fontFamily:FONT,display:"flex",alignItems:"center",gap:4}}>View all <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg></div>
        </div>
        <div style={{display:"flex",gap:6}}>
          {[
            {d:"M",active:true,type:"Pull Day"},
            {d:"T",active:true,type:"Push Day"},
            {d:"W",active:false,type:"Rest"},
            {d:"T",active:true,type:"Leg Day"},
            {d:"F",active:true,type:"Run"},
            {d:"S",active:true,type:"Upper Body"},
            {d:"S",active:true,type:"Push Day"},
          ].map((item,i)=>{
            const col=TYPE_COLORS[item.type];
            return(
              <div key={i} style={{flex:1,textAlign:"center"}}>
                <div className="spring" style={{height:44,borderRadius:14,marginBottom:5,background:item.active?col.bg:M.surface,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  {item.active&&<span style={{fontSize:14}}>{HISTORY[["2026-03-23","2026-03-24","2026-03-25","2026-03-26","2026-03-27","2026-03-28","2026-03-29"][i]]?.emoji||""}</span>}
                </div>
                <div style={{fontSize:10,fontWeight:item.active?700:400,color:item.active?M.primary:M.onSurfaceVariant,fontFamily:FONT}}>{item.d}</div>
              </div>
            );
          })}
        </div>
        <div style={{fontSize:11,color:M.onSurfaceVariant,fontFamily:FONT,textAlign:"center",marginTop:10,opacity:.7}}>Tap to see full activity history</div>
      </div>
    </div>
  );
}

const NAV=[
  {id:"home",label:"Home",icon:(a:boolean)=><svg width="22" height="22" viewBox="0 0 24 24" fill={a?"currentColor":"none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path fill="none" d="M9 21V12h6v9"/></svg>},
  {id:"workout",label:"Workout",icon:(a:boolean)=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.5:2} strokeLinecap="round"><path d="M6 7v10M18 7v10M6 9H2M6 15H2M18 9h4M18 15h4M6 7h12"/></svg>},
  {id:"running",label:"Running",icon:(a:boolean)=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.5:2} strokeLinecap="round"><circle cx="15" cy="4" r="1.5"/><path d="M9 18l2-6 3 3 2-5M7 21l4-3M17 18l-3-3"/></svg>},
  {id:"progress",label:"Progress",icon:(a:boolean)=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.5:2} strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>},
  {id:"profile",label:"Profile",icon:(a:boolean)=><svg width="22" height="22" viewBox="0 0 24 24" fill={a?"currentColor":"none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="8" r="4"/><path fill="none" d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>},
];

export default function FittyApp(){
  useCSS();
  const [loggedIn,setLoggedIn]=useState(false);
  const [userName,setUserName]=useState("");
  const [userAvatar,setUserAvatar]=useState("");
  const [screen,setScreen]=useState("home");
  const [activeNav,setActiveNav]=useState("home");
  const [routine,setRoutine]=useState<Routine|null>(null);
  const [routines,setRoutines]=useState<Routine[]>(INIT);
  const [calendarOpen,setCalendarOpen]=useState(false);

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{
      if(session){
        setLoggedIn(true);
        const meta=session.user.user_metadata;
        setUserName(meta.full_name||meta.name||session.user.email?.split("@")[0]||"");
        setUserAvatar(meta.avatar_url||meta.picture||"");
      }
    });
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{
      if(session){
        setLoggedIn(true);
        const meta=session.user.user_metadata;
        setUserName(meta.full_name||meta.name||session.user.email?.split("@")[0]||"");
        setUserAvatar(meta.avatar_url||meta.picture||"");
      }else{
        setLoggedIn(false);
        setUserName("");setUserAvatar("");
      }
    });
    return()=>subscription.unsubscribe();
  },[]);

  const finishWorkout=(r:Routine)=>{
    setRoutines(p=>{const u=p.map(rt=>rt.id===r.id?{...rt,lastDone:"Today",daysAgo:0}:rt);return[...u].sort((a,b)=>{if(a.daysAgo===0&&b.daysAgo!==0)return 1;if(b.daysAgo===0&&a.daysAgo!==0)return-1;return b.daysAgo-a.daysAgo;});});
    setScreen("routines");
  };
  const nav=(id:string)=>{setActiveNav(id);setScreen(id==="workout"?"routines":id);};

  const firstName=userName.split(" ")[0]||"there";
  const avatarInitial=firstName[0]?.toUpperCase()||"?";

  if(!loggedIn)return <LoginScreen/>;

  return(
    <div style={{fontFamily:FONT,background:M.background,color:M.onSurface,minHeight:"100vh",display:"flex",justifyContent:"center",WebkitFontSmoothing:"antialiased"}}>
      <div style={{width:"100%",maxWidth:430,position:"relative",paddingBottom:96}}>
        {calendarOpen&&<CalendarModal onClose={()=>setCalendarOpen(false)}/>}
        <div style={{display:"flex",justifyContent:"space-between",padding:"12px 24px 0",fontSize:12,fontWeight:600,color:M.onSurfaceVariant}}><span>9:41</span><span>78%</span></div>
        {screen!=="active"&&(
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 16px 16px"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:38,height:38,borderRadius:14,background:M.primary,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <span style={{fontSize:22,fontWeight:900,color:M.onPrimary,fontFamily:FONT}}>F</span>
              </div>
              <span style={{fontSize:22,fontWeight:900,color:M.onSurface,fontFamily:FONT,letterSpacing:"-.5px"}}>Fitty</span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <button className="m3i" style={{width:42,height:42,background:"transparent",color:M.onSurfaceVariant}}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>
              </button>
              {userAvatar
                ?<img src={userAvatar} alt={firstName} style={{width:40,height:40,borderRadius:50,objectFit:"cover"}}/>
                :<div style={{width:40,height:40,borderRadius:50,background:M.primaryContainer,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:800,color:M.onPrimaryContainer,fontFamily:FONT}}>{avatarInitial}</div>
              }
            </div>
          </div>
        )}
        {screen==="home"&&<HomeScreen onStartWorkout={()=>{setScreen("routines");setActiveNav("workout");}} onOpenCalendar={()=>setCalendarOpen(true)} firstName={firstName}/>}
        {screen==="routines"&&<RoutinesScreen routines={routines} setRoutines={setRoutines} onStart={r=>{setRoutine(r);setScreen("active");setActiveNav("workout");}}/>}
        {screen==="active"&&routine&&<ActiveScreen routine={routine} onFinish={()=>finishWorkout(routine)} onBack={()=>setScreen("routines")}/>}
        {["running","progress","profile"].includes(screen)&&(
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:420,gap:16,animation:"heroIn .5s cubic-bezier(.2,0,0,1)"}}>
            <div style={{width:80,height:80,borderRadius:28,background:M.primaryContainer,display:"flex",alignItems:"center",justifyContent:"center",fontSize:36}}>
              {screen==="running"?"🏃":screen==="progress"?"📊":"👤"}
            </div>
            <div style={{fontSize:22,fontWeight:900,color:M.onSurface,fontFamily:FONT}}>{screen.charAt(0).toUpperCase()+screen.slice(1)}</div>
            <div style={{fontSize:14,color:M.onSurfaceVariant,fontFamily:FONT}}>Coming in the full build</div>
          </div>
        )}
        <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:M.surfaceContainer,borderTop:`1px solid ${M.outlineVariant}`,display:"flex",zIndex:50,paddingBottom:8}}>
          {NAV.map(item=>{const a=activeNav===item.id;return(
            <button key={item.id} onClick={()=>nav(item.id)} className="m3b" style={{flex:1,background:"transparent",display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:"12px 0 4px"}}>
              <div className="nav-pill spring" style={{background:a?M.secondaryContainer:"transparent",color:a?M.onSecondaryContainer:M.onSurfaceVariant,animation:a?"navBounce .3s cubic-bezier(.34,1.56,.64,1)":"none"}}>
                {item.icon(a)}
              </div>
              <span style={{fontSize:11,fontWeight:a?700:500,color:a?M.onSurface:M.onSurfaceVariant,fontFamily:FONT,letterSpacing:".3px"}}>{item.label}</span>
            </button>
          );})}
        </div>
      </div>
    </div>
  );
}
