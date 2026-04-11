import { useState, useEffect, useMemo } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { supabase } from "./lib/supabase";
import { TigerLogo } from "./components/TigerLogo";
import { TIGER_ANIMS, TIGER_CSS, getKey } from "./components/TigerAnimations";
import { RestTimer, type RestTimerState, getRestDuration } from "./components/RestTimer";
import { PRModal, PRBadge, type PRInfo, type PRTier } from "./components/PRModal";
import { ProgressAnalytics } from "./components/ProgressAnalytics";
import { BodyMetrics } from "./components/BodyMetrics";
import { RunningScreenFull } from "./components/RunningScreenFull";
import { CustomExerciseModal } from "./components/CustomExerciseModal";
import { FatigueMap, type RoutineFatigue } from "./components/FatigueMap";
import { StreakSheet } from "./components/StreakSheet";
import { PRSheet } from "./components/PRSheet";
import { ProgramsSection, type ProgramDay, type ProgramBlock, type ProgramExercise } from "./components/ProgramsSection";
import { useOfflineSync } from "./hooks/useOfflineSync";
import { useTheme, PALETTES } from "./context/ThemeContext";
import { APP_VERSION } from "./version";
import {
  dbLoadWorkoutsWithExercises, dbLoadPRs, dbSavePR, dbGetBestPR,
  dbLoadBodyMetrics, dbSaveBodyMetric, dbLoadCustomExercises, dbSaveCustomExercise,
  dbLoadRunsFull, dbUpdateRun,
  epley1RM,
  type WorkoutExerciseRow, type PersonalRecord, type BodyMetric,
  type CustomExercise, type Run,
} from "./lib/db";

export type { WorkoutLog };

// ── Design tokens (themed colors use CSS vars injected by ThemeContext) ───
const M = {
  primary:"var(--fp)",onPrimary:"var(--fop)",primaryContainer:"var(--fpc)",onPrimaryContainer:"var(--fopc)",
  secondary:"var(--fs)",onSecondary:"var(--fos)",secondaryContainer:"var(--fsc)",onSecondaryContainer:"var(--fosc)",
  tertiary:"var(--ft)",onTertiary:"var(--fot)",tertiaryContainer:"var(--ftc)",onTertiaryContainer:"var(--fotc)",
  background:"#FFFBFE",surface:"#FFFBFE",surfaceContainer:"#F3EDF7",surfaceContainerLow:"#F7F2FA",
  surfaceContainerHigh:"#ECE6F0",surfaceContainerHighest:"#E6E0EB",
  onSurface:"#1C1B1F",onSurfaceVariant:"#49454F",outline:"#79747E",outlineVariant:"#CAC4D0",
  error:"#B3261E",errorContainer:"#F9DEDC",onErrorContainer:"#410E0B",
  greenPrimary:"#386A20",greenContainer:"#C5EFAA",onGreenContainer:"#072100",
  orangePrimary:"#7D4E00",orangeContainer:"#FFDDB3",onOrangeContainer:"#281900",
};
const FONT = `"Nunito","Google Sans","Helvetica Neue",sans-serif`;

// ── Daily quotes ──────────────────────────────────────────────────────────
const QUOTES=[
  "The only bad workout is the one that didn't happen.",
  "Discipline is choosing between what you want now and what you want most.",
  "Your body can stand almost anything. It's your mind you have to convince.",
  "Strong people are harder to kill than weak people and more useful in general.",
  "The pain you feel today will be the strength you feel tomorrow.",
  "Fall in love with the process and the results will come.",
  "Don't wish it were easier. Wish you were better.",
  "You don't have to be extreme. Just be consistent.",
  "What seems impossible today will one day become your warm-up.",
  "Train hard, recover harder.",
  "Show up, even when you don't feel like it. Especially when you don't feel like it.",
  "Comfort is the enemy of growth.",
  "Every rep is a vote for the person you want to become.",
  "Motivation gets you started. Discipline keeps you going.",
  "You are one workout away from a better mood.",
  "The gym is the one place where you get out exactly what you put in.",
  "Earn the body you want.",
  "Hard work beats talent when talent doesn't work hard.",
  "The only person you should try to be better than is who you were yesterday.",
  "Rest when you need to. Quit never.",
  "Your future self is watching you through your memories.",
  "A year from now you'll wish you started today.",
  "It never gets easier — you just get stronger.",
  "Champions are made in the moments they want to quit.",
  "Do something today your future self will thank you for.",
  "Strength does not come from the body. It comes from the will.",
  "Progress, not perfection.",
  "One more rep. Always one more rep.",
  "The clock is ticking. Get after it.",
  "Sore today. Strong tomorrow.",
  "Your body achieves what your mind believes.",
  "Make yourself uncomfortable. That's where growth lives.",
  "The weight is lighter on the other side of the set.",
  "You didn't come this far to only come this far.",
  "Hard training, easy living. Easy training, hard living.",
  "Success isn't given. It's earned every day in the gym.",
  "Every set is a choice. Choose growth.",
  "When it gets hard, that's when it counts.",
  "The difference between try and triumph is a little umph.",
  "Pain is weakness leaving the body.",
  "Nothing worth having comes without effort.",
  "The last three reps is where champions are built.",
  "Consistency compounds. Show up daily.",
  "Be stronger than your excuses.",
  "Discipline is doing what needs to be done, even when you don't want to.",
  "You have to push past the point where most people quit.",
  "Sweat is just fat crying.",
  "Be proud of every single workout. They add up.",
  "The grind doesn't care about your mood.",
  "Prepare the body. Protect the mind. Dominate the day.",
  "Your greatest competition is your past self.",
  "Goals without reps are just wishes.",
  "Every great athlete was once a beginner who refused to give up.",
  "The iron never lies. It always tells you exactly what you are.",
  "Built in the dark. Revealed in the light.",
  "Breathe. Grind. Grow. Repeat.",
  "Recovery is training too. Treat it that way.",
  "Showing up is 80% of the battle.",
  "Heavy weights build light hearts.",
  "Train with intention. Recover with purpose.",
  "It's not about having time. It's about making time.",
  "Eat clean. Train mean. Stay lean.",
  "The body follows the mind. Train both.",
  "Good things take time. Great things take consistency.",
  "Run your own race at your own pace.",
];
function getDailyQuote():string{
  const d=new Date();
  const seed=d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate();
  return QUOTES[seed%QUOTES.length];
}

// ── Static data ───────────────────────────────────────────────────────────
const STRETCHES: Record<string,{name:string;desc:string;emoji:string}[]> = {
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

const HISTORY: Record<string,{type:string;emoji:string;exercises?:string[];miles?:number}> = {
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

const TYPE_COLORS: Record<string,{bg:string;fg:string}> = {
  "Push Day":{bg:M.primaryContainer,fg:M.onPrimaryContainer},
  "Pull Day":{bg:M.secondaryContainer,fg:M.onSecondaryContainer},
  "Leg Day":{bg:M.tertiaryContainer,fg:M.onTertiaryContainer},
  "Upper Body":{bg:M.greenContainer,fg:M.onGreenContainer},
  "Misc":{bg:M.orangeContainer,fg:M.onOrangeContainer},
  "Run":{bg:"#BBDEFB",fg:"#0D47A1"},
  "Rest":{bg:M.surfaceContainerHighest,fg:M.onSurfaceVariant},
};

const BREATHING: Record<string,string> = {
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

// ── CSS injection ─────────────────────────────────────────────────────────
const BASE_CSS = `
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
@keyframes timerFlash{0%{opacity:.6}100%{opacity:0}}
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
    if(document.getElementById("fv9"))return;
    const s=document.createElement("style");s.id="fv9";
    s.textContent=BASE_CSS+TIGER_CSS;
    document.head.appendChild(s);
  },[]);
}

// ── Exercise tile (uses tiger animations) ─────────────────────────────────
function ExerciseTile({name,onTap,size=56}:{name:string;onTap:(e:React.MouseEvent)=>void;size?:number}){
  const A=TIGER_ANIMS[getKey(name)]||TIGER_ANIMS.default;
  return(
    <div onClick={onTap} className="m3i spring" style={{width:size,height:size,borderRadius:size*.28,background:M.primaryContainer,flexShrink:0,overflow:"hidden",color:"transparent"}}>
      <div style={{width:size-8,height:size-8}}><A/></div>
    </div>
  );
}

// ── Exercise library ──────────────────────────────────────────────────────
const BASE_EX=["Barbell Bench Press","Incline DB Press","Decline Bench Press","Cable Flyes","DB Flyes","Pec Deck","Overhead Press","Lateral Raises","Front Raises","Arnold Press","Rear Delt Flyes","Barbell Rows","DB Rows","Seated Cable Row","Lat Pulldown","Face Pull","Pull-Ups","Chin-Ups","Deadlift","Romanian Deadlift","Trap Bar Deadlift","Barbell Squat","Hack Squat","Leg Press","Leg Curl Machine","Leg Extension","Walking Lunges","Bulgarian Split Squat","Calf Raises","Barbell Curls","Hammer Curls","Preacher Curls","Tricep Pushdown","Skull Crushers","Dips","Cable Crunches","Hanging Leg Raises","Ab Wheel Rollout","Plank","Russian Twists","Adductor Machine","Abductor Machine","Wrist Curls","Farmer's Carry","Neck Flexion"];

interface Sub{name:string;reason:string;match:number;}
const SUBS:Record<string,Sub[]>={
  "Barbell Bench Press":[{name:"DB Bench Press",reason:"Same pattern, dumbbells",match:98},{name:"Machine Chest Press",reason:"Guided option",match:92},{name:"Weighted Push-Up",reason:"Bodyweight fallback",match:80}],
  "Barbell Squat":[{name:"Hack Squat Machine",reason:"Similar quad drive",match:95},{name:"Leg Press",reason:"Seated alternative",match:88},{name:"Goblet Squat",reason:"DB front-loaded",match:84}],
  "Deadlift":[{name:"Trap Bar Deadlift",reason:"Same hinge, easier on back",match:95},{name:"Romanian Deadlift",reason:"Hamstring-focused",match:88}],
  "Lat Pulldown":[{name:"Pull-Ups",reason:"Bodyweight, same lats",match:97},{name:"DB Pullover",reason:"Lat stretch",match:79}],
};
const DEF_SUBS:Sub[]=[{name:"DB Variation",reason:"Dumbbell version",match:90},{name:"Machine Equivalent",reason:"Guided machine",match:85},{name:"Bodyweight Version",reason:"No equipment",match:75}];

// ── Interfaces ────────────────────────────────────────────────────────────
interface Exercise{id:string;name:string;sets:number;reps:string;defaultWeight?:number;}
interface Routine{id:number;name:string;emoji:string;tag:string;lastDone:string;daysAgo:number;duration:string;exercises:Exercise[];}
interface SetRow{weight:number;reps:number;done:boolean;}
interface ActiveExercise extends Exercise{rows:SetRow[];note:string;}
interface WorkoutLog{id:string;routine_name:string;routine_emoji:string;completed_at:string;duration_seconds:number;total_sets:number;total_volume_kg:number;xp_earned:number;}

const INIT:Routine[]=[
  {id:1,name:"Pull Day",emoji:"🏋️",tag:"Back · Biceps · Rear Delts",lastDone:"2 days ago",daysAgo:2,duration:"60 min",exercises:[{id:"e7",name:"Deadlift",sets:4,reps:"5–6"},{id:"e8",name:"Barbell Rows",sets:4,reps:"8–10"},{id:"e9",name:"Lat Pulldown",sets:3,reps:"10–12"},{id:"e10",name:"Seated Cable Row",sets:3,reps:"10–12"},{id:"e11",name:"Face Pull",sets:3,reps:"15–20"},{id:"e12",name:"Barbell Curls",sets:3,reps:"10–12"}]},
  {id:2,name:"Leg Day",emoji:"🦵",tag:"Quads · Hamstrings · Glutes",lastDone:"5 days ago",daysAgo:5,duration:"65 min",exercises:[{id:"e13",name:"Barbell Squat",sets:4,reps:"6–8"},{id:"e14",name:"Romanian Deadlift",sets:3,reps:"10–12"},{id:"e15",name:"Leg Press",sets:3,reps:"12–15"},{id:"e16",name:"Leg Curl Machine",sets:3,reps:"12–15"},{id:"e17",name:"Walking Lunges",sets:3,reps:"12 ea"},{id:"e18",name:"Calf Raises",sets:4,reps:"15–20"}]},
  {id:3,name:"Push Day",emoji:"💪",tag:"Chest · Shoulders · Triceps",lastDone:"3 days ago",daysAgo:3,duration:"55 min",exercises:[{id:"e1",name:"Barbell Bench Press",sets:4,reps:"8–10"},{id:"e2",name:"Incline DB Press",sets:3,reps:"10–12"},{id:"e3",name:"Cable Flyes",sets:3,reps:"12–15"},{id:"e4",name:"Overhead Press",sets:4,reps:"8–10"},{id:"e5",name:"Lateral Raises",sets:3,reps:"15–20"},{id:"e6",name:"Tricep Pushdown",sets:3,reps:"12–15"}]},
  {id:4,name:"Upper Body",emoji:"⬆️",tag:"Full Upper",lastDone:"Today",daysAgo:0,duration:"70 min",exercises:[{id:"e19",name:"Bench Press",sets:4,reps:"8–10"},{id:"e20",name:"Barbell Rows",sets:4,reps:"8–10"},{id:"e21",name:"Overhead Press",sets:3,reps:"8–10"},{id:"e22",name:"Lat Pulldown",sets:3,reps:"10–12"},{id:"e23",name:"Incline DB Press",sets:3,reps:"10–12"}]},
  {id:5,name:"Misc / Isolation",emoji:"⚡",tag:"Abs · Forearms · Adductors",lastDone:"4 days ago",daysAgo:4,duration:"45 min",exercises:[{id:"e24",name:"Cable Crunches",sets:4,reps:"15–20"},{id:"e25",name:"Hanging Leg Raises",sets:3,reps:"12–15"},{id:"e26",name:"Ab Wheel Rollout",sets:3,reps:"10–12"},{id:"e27",name:"Adductor Machine",sets:4,reps:"15–20"},{id:"e28",name:"Abductor Machine",sets:4,reps:"15–20"},{id:"e29",name:"Wrist Curls",sets:3,reps:"15–20"},{id:"e30",name:"Seated Calf Raises",sets:4,reps:"15–20"}]},
];

const DETAILS:Record<string,{muscles:string;steps:string[];tip:string}>={
  "Barbell Bench Press":{muscles:"Chest · Triceps · Front Delts",steps:["Lie flat, feet on floor","Grip just wider than shoulder-width","Lower bar to mid-chest with control","Press to full extension","Keep shoulder blades retracted"],tip:"Don't bounce the bar. Control the descent."},
  "Deadlift":{muscles:"Hamstrings · Glutes · Back · Traps",steps:["Bar over mid-foot, hip-width stance","Hinge at hips, grip outside knees","Brace core, neutral spine","Drive through floor, lock hips at top","Hinge to lower — never round"],tip:"Bar should stay dragging against your legs."},
  "Barbell Squat":{muscles:"Quads · Glutes · Hamstrings · Core",steps:["Bar on upper traps, feet shoulder-width","Brace core and sit back and down","Chest up, knees track over toes","Hit parallel or below","Drive through heels to stand"],tip:"Record yourself from the side to check depth."},
  "Lat Pulldown":{muscles:"Lats · Biceps · Rear Delts",steps:["Thighs under pads, wide grip","Pull to upper chest","Squeeze lats at bottom","Control the return slowly"],tip:"Drive elbows down, not back."},
  "Overhead Press":{muscles:"Front & Side Delts · Triceps",steps:["Grip just outside shoulders","Brace core, press straight up","Tuck chin as bar passes","Lock out overhead","Lower with control"],tip:"Keep glutes tight. Don't lean back."},
  "Lateral Raises":{muscles:"Side Deltoids",steps:["DBs at sides, slight elbow bend","Raise to shoulder height","Lead with elbows","Pause at top","3–4 second lowering"],tip:"Light and slow beats heavy and sloppy."},
};

// ── DB helpers ────────────────────────────────────────────────────────────
async function dbSaveWorkout(userId:string,routine:Routine,exercises:ActiveExercise[],durationSec:number,sessionNote:string){
  const totalSets=exercises.reduce((a,e)=>a+e.rows.filter(r=>r.done).length,0);
  const totalVol=exercises.reduce((a,e)=>a+e.rows.filter(r=>r.done).reduce((b,r)=>b+r.weight*r.reps,0),0);
  const xp=totalSets*10;
  const {data:w,error}=await supabase.from("workouts").insert({user_id:userId,routine_name:routine.name,routine_emoji:routine.emoji,duration_seconds:durationSec,total_sets:totalSets,total_volume_kg:totalVol,xp_earned:xp,session_note:sessionNote||null}).select().single();
  if(error||!w)return;
  const rows=exercises.map(ex=>({workout_id:(w as {id:string}).id,exercise_name:ex.name,sets_json:ex.rows.filter(r=>r.done),note:ex.note||null}));
  if(rows.length)await supabase.from("workout_exercises").insert(rows);
}
function getLastWeight(name:string,weRows:WorkoutExerciseRow[]):number{
  const row=weRows.find(r=>r.exercise_name===name);
  if(!row||!row.sets_json?.length)return 0;
  const done=row.sets_json.filter(s=>s.done);
  const sets=done.length?done:row.sets_json;
  return sets[sets.length-1]?.weight??0;
}
async function dbLoadWorkouts(userId:string):Promise<WorkoutLog[]>{
  const{data}=await supabase.from("workouts").select("*").eq("user_id",userId).order("completed_at",{ascending:false}).limit(50);
  return(data||[]) as WorkoutLog[];
}

function fmtDur(sec:number):string{const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=sec%60;if(h>0)return`${h}h ${m}m`;if(m>0)return`${m}m ${s}s`;return`${s}s`;}
function fmtPace(distMi:number,durSec:number):string{if(!distMi||!durSec)return"—";const pps=durSec/distMi;const m=Math.floor(pps/60),s=Math.round(pps%60);return`${m}:${String(s).padStart(2,"0")}/mi`;}
function computeStreak(logs:WorkoutLog[],runs:Run[]):number{const days=new Set<string>();logs.forEach(w=>days.add(w.completed_at.slice(0,10)));runs.forEach(r=>days.add(r.ran_at.slice(0,10)));let streak=0;const d=new Date();for(let i=0;i<365;i++){const key=d.toISOString().slice(0,10);if(days.has(key)){streak++;d.setDate(d.getDate()-1);}else break;}return streak;}

// Returns Monday of the week containing d
function weekMonday(d:Date):Date{const day=d.getDay();const diff=day===0?-6:1-day;const m=new Date(d);m.setDate(m.getDate()+diff);m.setHours(0,0,0,0);return m;}
function isoDate(d:Date):string{return d.toISOString().slice(0,10);}

function computeWeeklyStreak(logs:WorkoutLog[],weeklyGoal:number):{streak:number;thisWeekCount:number}{
  const weekCounts:Record<string,number>={};
  logs.forEach(w=>{const ws=isoDate(weekMonday(new Date(w.completed_at)));weekCounts[ws]=(weekCounts[ws]||0)+1;});
  const now=new Date();const thisWS=isoDate(weekMonday(now));
  const thisWeekCount=weekCounts[thisWS]||0;
  let streak=0;
  // Check if this week already meets goal
  if(thisWeekCount>=weeklyGoal)streak++;
  // Walk back week by week
  let cursor=new Date(weekMonday(now));cursor.setDate(cursor.getDate()-7);
  for(let i=0;i<52;i++){
    const key=isoDate(cursor);
    if((weekCounts[key]||0)>=weeklyGoal){streak++;cursor.setDate(cursor.getDate()-7);}
    else break;
  }
  return{streak,thisWeekCount};
}

// ── Session persistence ────────────────────────────────────────────────────
const SESSION_KEY="fitty_active_workout";
interface SavedSession{routine:Routine;exercises:ActiveExercise[];startTimestamp:number;sessionNote:string;}
function saveSession(data:SavedSession){localStorage.setItem(SESSION_KEY,JSON.stringify(data));}
function loadSession():SavedSession|null{
  try{
    const raw=localStorage.getItem(SESSION_KEY);
    if(!raw)return null;
    const d=JSON.parse(raw) as SavedSession;
    // Expire after 24 hours
    if(Date.now()-d.startTimestamp>24*60*60*1000){localStorage.removeItem(SESSION_KEY);return null;}
    return d;
  }catch{return null;}
}
function clearSession(){localStorage.removeItem(SESSION_KEY);}

// ── CSV Export ────────────────────────────────────────────────────────────
function exportCSV(logs:WorkoutLog[],runs:Run[],prs:PersonalRecord[],metrics:BodyMetric[]){
  const rows:string[]=[];
  rows.push("=== WORKOUTS ===");
  rows.push("Date,Routine,Sets,Volume (kg),Duration,XP");
  logs.forEach(w=>rows.push(`${w.completed_at.slice(0,10)},${w.routine_name},${w.total_sets},${w.total_volume_kg.toFixed(0)},${fmtDur(w.duration_seconds)},${w.xp_earned}`));
  rows.push("");
  rows.push("=== RUNS ===");
  rows.push("Date,Distance (mi),Duration,Pace,Route,HR,Notes");
  runs.forEach(r=>rows.push(`${r.ran_at.slice(0,10)},${r.distance_miles.toFixed(2)},${fmtDur(r.duration_seconds)},${fmtPace(r.distance_miles,r.duration_seconds)},${r.route_name||""},${r.heart_rate_avg||""},${r.notes||""}`));
  rows.push("");
  rows.push("=== PERSONAL RECORDS ===");
  rows.push("Date,Exercise,Weight (kg),Reps,Est. 1RM (kg)");
  prs.forEach(p=>rows.push(`${p.achieved_at.slice(0,10)},${p.exercise_name},${p.weight},${p.reps},${p.estimated_1rm.toFixed(1)}`));
  rows.push("");
  rows.push("=== BODY METRICS ===");
  rows.push("Date,Bodyweight (kg),Body Fat %,Neck (cm),Waist (cm),Hips (cm)");
  metrics.forEach(m=>rows.push(`${m.logged_at.slice(0,10)},${m.bodyweight},${m.body_fat_pct||""},${m.neck_cm||""},${m.waist_cm||""},${m.hip_cm||""}`));

  const blob=new Blob([rows.join("\n")],{type:"text/csv"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;a.download=`fitty-export-${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);a.click();document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Modals ────────────────────────────────────────────────────────────────
function ExerciseModal({name,onClose}:{name:string;onClose:()=>void}){
  const A=TIGER_ANIMS[getKey(name)]||TIGER_ANIMS.default;
  const d=DETAILS[name]||{muscles:"Multiple muscle groups",steps:["Set up with proper posture","Engage core","Perform with full control","Return to start slowly"],tip:"Focus on the target muscle."};
  const breath=BREATHING[getKey(name)]||BREATHING.default;
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(28,27,31,.6)",backdropFilter:"blur(6px)",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{width:"100%",maxWidth:430,background:M.surface,borderRadius:"28px 28px 0 0",maxHeight:"90dvh",overflowY:"auto",animation:"slideUp .5s cubic-bezier(.34,1.56,.64,1)"}}>
        <div className="sheet-handle"/>
        <div style={{margin:"16px 20px 0",background:M.primaryContainer,borderRadius:24,padding:28,display:"flex",justifyContent:"center",position:"relative",minHeight:160}}>
          <div style={{width:144,height:144}}><A/></div>
          <button onClick={onClose} className="m3i" style={{position:"absolute",top:12,right:12,width:44,height:44,background:M.surfaceContainerHighest,color:M.onSurfaceVariant,fontSize:18}}>✕</button>
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
      <div style={{width:"100%",maxWidth:430,background:M.surface,borderRadius:"28px 28px 0 0",maxHeight:"90dvh",overflowY:"auto",animation:"slideUp .5s cubic-bezier(.34,1.56,.64,1)"}}>
        <div className="sheet-handle"/>
        <div style={{padding:"16px 20px 8px",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div><div style={{fontSize:22,fontWeight:900,color:M.onSurface,fontFamily:FONT}}>{title}</div><div style={{fontSize:13,color:M.onSurfaceVariant,fontFamily:FONT,marginTop:2}}>{sub}</div></div>
          <button onClick={onClose} className="m3i" style={{width:44,height:44,background:M.surfaceContainerHighest,color:M.onSurfaceVariant,fontSize:18,flexShrink:0}}>✕</button>
        </div>
        <div style={{padding:"8px 20px 48px"}}>
          {list.map((s,i)=>(
            <div key={i} style={{display:"flex",gap:14,padding:"12px 0",borderBottom:i<list.length-1?`1px solid ${M.surfaceContainerHighest}`:"none",animation:`stagger .3s ${i*80}ms both`}}>
              <div style={{width:44,height:44,borderRadius:16,background:isBefore?M.primaryContainer:M.tertiaryContainer,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{s.emoji}</div>
              <div><div style={{fontSize:14,fontWeight:700,color:M.onSurface,fontFamily:FONT,marginBottom:3}}>{s.name}</div><div style={{fontSize:12,color:M.onSurfaceVariant,fontFamily:FONT,lineHeight:1.5}}>{s.desc}</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SwapDrawer({exerciseName,onSwap,onClose,allExercises}:{exerciseName:string;onSwap:(sub:Partial<Sub>)=>void;onClose:()=>void;allExercises:string[]}){
  const[search,setSearch]=useState("");
  const subs=SUBS[exerciseName]||DEF_SUBS;
  const results=search.trim().length>1?allExercises.filter(e=>e.toLowerCase().includes(search.toLowerCase())&&e!==exerciseName).slice(0,5):[];
  const ms=(m:number)=>m>=95?{bg:M.greenContainer,fg:M.greenPrimary}:m>=85?{bg:M.primaryContainer,fg:M.onPrimaryContainer}:{bg:M.orangeContainer,fg:M.orangePrimary};
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(28,27,31,.6)",backdropFilter:"blur(6px)",zIndex:300,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{width:"100%",maxWidth:430,background:M.surface,borderRadius:"28px 28px 0 0",maxHeight:"90dvh",overflowY:"auto",animation:"slideUp .5s cubic-bezier(.34,1.56,.64,1)"}}>
        <div className="sheet-handle"/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 20px 12px"}}>
          <div><div style={{fontSize:22,fontWeight:900,color:M.onSurface,fontFamily:FONT}}>Replace Exercise</div><div style={{fontSize:13,color:M.onSurfaceVariant,fontFamily:FONT,marginTop:2}}>Swapping <b style={{color:M.onSurface}}>{exerciseName}</b></div></div>
          <button onClick={onClose} className="m3i" style={{width:44,height:44,background:M.surfaceContainerHighest,color:M.onSurfaceVariant,fontSize:18}}>✕</button>
        </div>
        <div style={{padding:"0 20px 14px"}}>
          <div style={{position:"relative"}}>
            <svg style={{position:"absolute",left:18,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={M.onSurfaceVariant} strokeWidth="2.2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search any exercise…" style={{width:"100%",background:M.surfaceContainerHighest,border:"none",borderRadius:100,padding:"14px 20px 14px 48px",fontFamily:FONT,fontSize:16,color:M.onSurface,outline:"none"}}/>
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

function CalendarModal({onClose,workoutLogs=[],runs=[]}:{onClose:()=>void;workoutLogs:WorkoutLog[];runs:Run[]}){
  const[view,setView]=useState("week");
  const[selectedDate,setSelectedDate]=useState<string|null>(null);
  const today=new Date().toISOString().slice(0,10);
  const weekDays=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));return d.toISOString().slice(0,10);});
  const weekLabels=weekDays.map(d=>new Date(d+"T12:00:00").toLocaleDateString("en-US",{weekday:"short"}).slice(0,3));
  const monthDays=Array.from({length:new Date(new Date().getFullYear(),new Date().getMonth()+1,0).getDate()},(_,i)=>i+1);
  const logsByDate=useMemo(()=>{const m:Record<string,WorkoutLog>={};workoutLogs.forEach(w=>{const d=w.completed_at.slice(0,10);if(!m[d]||w.completed_at>m[d].completed_at)m[d]=w;});return m;},[workoutLogs]);
  const runsByDate=useMemo(()=>{const m:Record<string,Run>={};runs.forEach(r=>{const d=r.ran_at.slice(0,10);if(!m[d]||r.ran_at>m[d].ran_at)m[d]=r;});return m;},[runs]);
  const getEntry=(dateStr:string):{type:string;emoji:string;exercises?:string[];miles?:number;duration?:number}|null=>{
    const w=logsByDate[dateStr];if(w)return{type:w.routine_name,emoji:w.routine_emoji,duration:w.duration_seconds};
    const r=runsByDate[dateStr];if(r)return{type:"Run",emoji:"🏃",miles:r.distance_miles,duration:r.duration_seconds};
    return HISTORY[dateStr]||null;
  };
  const getColor=(type:string)=>(TYPE_COLORS[type]||TYPE_COLORS["Push Day"]);
  if(selectedDate){
    const entry=getEntry(selectedDate);const col=entry?getColor(entry.type):getColor("Rest");
    return(
      <div style={{position:"fixed",inset:0,background:"rgba(28,27,31,.6)",backdropFilter:"blur(6px)",zIndex:400,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
        <div style={{width:"100%",maxWidth:430,background:M.surface,borderRadius:"28px 28px 0 0",maxHeight:"90dvh",overflowY:"auto",animation:"slideUp .5s cubic-bezier(.34,1.56,.64,1)"}}>
          <div className="sheet-handle"/>
          <div style={{padding:"16px 20px"}}>
            <button onClick={()=>setSelectedDate(null)} className="m3b" style={{background:M.surfaceContainerHighest,borderRadius:100,border:"none",padding:"8px 16px",fontSize:13,fontWeight:600,color:M.onSurfaceVariant,fontFamily:FONT,marginBottom:16,display:"flex",alignItems:"center",gap:6}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="15 18 9 12 15 6"/></svg>Back
            </button>
            <div style={{fontSize:13,color:M.onSurfaceVariant,fontFamily:FONT,marginBottom:4}}>{new Date(selectedDate+"T12:00:00").toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}</div>
            {entry?(
              <>
                <div style={{background:col.bg,borderRadius:24,padding:"20px",marginBottom:16,display:"flex",alignItems:"center",gap:16}}>
                  <span style={{fontSize:40}}>{entry.emoji}</span>
                  <div>
                    <div style={{fontSize:22,fontWeight:900,color:col.fg,fontFamily:FONT}}>{entry.type}</div>
                    {entry.miles&&<div style={{fontSize:14,color:col.fg,opacity:.85,fontFamily:FONT,marginTop:2}}>{entry.miles} miles</div>}
                    {entry.duration&&<div style={{fontSize:14,color:col.fg,opacity:.85,fontFamily:FONT,marginTop:2}}>⏱ {fmtDur(entry.duration)}</div>}
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
  const now=new Date();const yr=now.getFullYear();const mo=now.getMonth();const firstDay=new Date(yr,mo,1).getDay();
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(28,27,31,.6)",backdropFilter:"blur(6px)",zIndex:400,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{width:"100%",maxWidth:430,background:M.surface,borderRadius:"28px 28px 0 0",maxHeight:"90dvh",overflowY:"auto",animation:"slideUp .5s cubic-bezier(.34,1.56,.64,1)"}}>
        <div className="sheet-handle"/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 20px 12px"}}>
          <div style={{fontSize:22,fontWeight:900,color:M.onSurface,fontFamily:FONT}}>Activity</div>
          <button onClick={onClose} className="m3i" style={{width:44,height:44,background:M.surfaceContainerHighest,color:M.onSurfaceVariant,fontSize:18}}>✕</button>
        </div>
        <div style={{display:"flex",gap:8,padding:"0 20px 16px"}}>
          {["week","month"].map(v=>(
            <button key={v} onClick={()=>setView(v)} className="m3b spring" style={{background:view===v?M.primaryContainer:M.surfaceContainerHighest,color:view===v?M.onPrimaryContainer:M.onSurfaceVariant,borderRadius:100,padding:"8px 20px",fontWeight:700,fontSize:13,fontFamily:FONT}}>
              {v==="week"?"This Week":"Month"}
            </button>
          ))}
        </div>
        {view==="week"&&(
          <div style={{padding:"0 16px 32px",animation:"tabIn .3s cubic-bezier(.2,0,0,1)"}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:6}}>
              {weekDays.map((d,i)=>{const entry=getEntry(d);const col=entry?getColor(entry.type):null;const isToday=d===today;return(
                <div key={d} onClick={()=>setSelectedDate(d)} className="m3b spring" style={{cursor:"pointer",textAlign:"center"}}>
                  <div style={{fontSize:10,color:isToday?M.primary:M.onSurfaceVariant,fontWeight:isToday?800:500,fontFamily:FONT,marginBottom:4}}>{weekLabels[i]}</div>
                  <div style={{height:72,borderRadius:18,background:col?col.bg:M.surfaceContainerHighest,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",border:isToday?`2px solid ${M.primary}`:"2px solid transparent"}}>
                    {entry&&<span style={{fontSize:18}}>{entry.emoji}</span>}
                    {entry?.miles&&<span style={{fontSize:10,fontWeight:700,color:col?.fg,fontFamily:FONT,marginTop:2}}>{entry.miles}mi</span>}
                  </div>
                  <div style={{fontSize:10,fontWeight:isToday?800:400,color:isToday?M.primary:M.onSurfaceVariant,fontFamily:FONT,marginTop:4}}>{new Date(d+"T12:00:00").getDate()}</div>
                </div>
              );})}
            </div>
          </div>
        )}
        {view==="month"&&(
          <div style={{padding:"0 16px 32px",animation:"tabIn .3s cubic-bezier(.2,0,0,1)"}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:8}}>
              {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d=><div key={d} style={{textAlign:"center",fontSize:10,fontWeight:700,color:M.onSurfaceVariant,fontFamily:FONT,padding:"4px 0"}}>{d}</div>)}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
              {Array.from({length:firstDay},(_,i)=><div key={"e"+i}/>)}
              {monthDays.map(day=>{
                const dateStr=`${yr}-${String(mo+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                const entry=getEntry(dateStr);const col=entry?getColor(entry.type):null;const isToday=dateStr===today;const future=dateStr>today;
                return(
                  <div key={day} onClick={()=>!future&&setSelectedDate(dateStr)} className={future?"":"m3b"} style={{aspectRatio:"1",borderRadius:12,background:future?M.surfaceContainerLow:col?col.bg:M.surfaceContainerHighest,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",border:isToday?`2px solid ${M.primary}`:"2px solid transparent",cursor:future?"default":"pointer",opacity:future?.35:1}}>
                    <span style={{fontSize:10,fontWeight:isToday?800:600,color:col?col.fg:M.onSurfaceVariant,fontFamily:FONT}}>{day}</span>
                    {entry&&!future&&<span style={{fontSize:12,marginTop:1}}>{entry.emoji}</span>}
                  </div>
                );
              })}
            </div>
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

// ── Active Workout screen ─────────────────────────────────────────────────
function ActiveScreen({
  routine,onFinish,onBack,userId,allPRs:_allPRs,onNewPR,startTimestamp,
}:{
  routine:Routine;
  onFinish:(exercises:ActiveExercise[],durationSec:number,sessionNote:string)=>void;
  onBack:()=>void;
  userId:string;
  allPRs:PersonalRecord[];
  onNewPR:(pr:PRInfo)=>void;
  startTimestamp?:number;
}){
  const[startTime]=useState(()=>startTimestamp||Date.now());
  const[elapsed,setElapsed]=useState(0);
  const[restDurations,setRestDurations]=useState<Record<string,number>>({});
  const[exercises,setExercises]=useState<ActiveExercise[]>(()=>
    routine.exercises.map(ex=>({...ex,rows:Array.from({length:ex.sets},()=>({weight:ex.defaultWeight??0,reps:parseInt(ex.reps)||10,done:false})),note:""}))
  );
  const[swapIdx,setSwapIdx]=useState<number|null>(null);
  const[swapped,setSwapped]=useState<Record<number,boolean>>({});
  const[modalEx,setModalEx]=useState<string|null>(null);
  const[burst,setBurst]=useState(false);
  const[stretchType,setStretchType]=useState<string|null>(null);
  const[sessionNote,setSessionNote]=useState("");
  const[noteOpenIdx,setNoteOpenIdx]=useState<number|null>(null);
  const[prBadges,setPrBadges]=useState<Record<number,PRTier>>({});

  useEffect(()=>{
    const id=setInterval(()=>setElapsed(Math.floor((Date.now()-startTime)/1000)),1000);
    return()=>clearInterval(id);
  },[startTime]);

  const fmtElapsed=(sec:number)=>{const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=sec%60;return h>0?`${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`:`${m}:${String(s).padStart(2,"0")}`;};


  // Auto-save session to localStorage on every change
  useEffect(()=>{
    saveSession({routine,exercises,startTimestamp:startTime,sessionNote});
  },[exercises,sessionNote]);

  // Rest timer
  const[restTimer,setRestTimer]=useState<RestTimerState>({active:false,totalSec:90,remaining:90,exerciseName:""});

  const total=exercises.reduce((a,e)=>a+e.rows.length,0);
  const done=exercises.reduce((a,e)=>a+e.rows.filter(s=>s.done).length,0);
  const pct=total?(done/total)*100:0;

  const toggle=async(ei:number,si:number)=>{
    const was=exercises[ei].rows[si].done;
    setExercises(p=>p.map((e,i)=>i!==ei?e:{...e,rows:e.rows.map((r,j)=>j!==si?r:{...r,done:!r.done})}));
    if(!was){
      // Burst animation
      setBurst(true);setTimeout(()=>setBurst(false),900);

      // Start rest timer (use remembered duration for this exercise if set)
      const dur=restDurations[exercises[ei].name]||getRestDuration(exercises[ei].name);
      setRestTimer({active:true,totalSec:dur,remaining:dur,exerciseName:exercises[ei].name});

      // PR detection
      const row=exercises[ei].rows[si];
      const est1rm=epley1RM(row.weight,row.reps);
      if(userId&&row.weight>0&&row.reps>0){
        try{
          const best=await dbGetBestPR(userId,exercises[ei].name);
          const bestEst=best?best.estimated_1rm:0;
          if(est1rm>bestEst){
            // Determine tier
            const now=Date.now();
            let tier:PRTier="gold";
            if(best){
              const ageDays=(now-new Date(best.achieved_at).getTime())/(1000*60*60*24);
              if(ageDays<7)tier="bronze";
              else if(ageDays<30)tier="silver";
              else tier="gold";
            }
            // Save PR
            await dbSavePR(userId,exercises[ei].name,row.weight,row.reps);
            setPrBadges(p=>({...p,[ei]:tier}));
            // Show modal after short delay so burst finishes
            setTimeout(()=>onNewPR({exerciseName:exercises[ei].name,weight:row.weight,reps:row.reps,estimated1RM:est1rm,tier}),800);
          }
        }catch{/* silently ignore */}
      }
    }
  };

  const doSwap=(sub:Partial<Sub>)=>{setExercises(p=>p.map((e,i)=>i!==swapIdx?e:{...e,name:sub.name||e.name}));setSwapped(p=>({...p,[swapIdx!]:true}));setSwapIdx(null);};

  return(
    <div style={{background:M.background,minHeight:"100vh"}}>
      {modalEx&&<ExerciseModal name={modalEx} onClose={()=>setModalEx(null)}/>}
      {swapIdx!==null&&<SwapDrawer exerciseName={exercises[swapIdx]?.name} onSwap={doSwap} onClose={()=>setSwapIdx(null)} allExercises={BASE_EX}/>}
      {stretchType&&<StretchModal type={stretchType} onClose={()=>setStretchType(null)}/>}
      <SetBurst show={burst}/>

      {/* Rest Timer */}
      <RestTimer
        state={restTimer}
        onTick={r=>setRestTimer(s=>({...s,remaining:r}))}
        onComplete={()=>{}}
        onSkip={()=>setRestTimer(s=>({...s,active:false}))}
        onAddThirty={()=>setRestTimer(s=>({...s,remaining:s.remaining+30,totalSec:s.totalSec+30}))}
        onSetDuration={sec=>{setRestDurations(d=>({...d,[restTimer.exerciseName]:sec}));setRestTimer(s=>({...s,totalSec:sec,remaining:sec,active:true}));}}
        onAdjust={delta=>{const newTotal=Math.max(15,restTimer.totalSec+delta);setRestDurations(d=>({...d,[restTimer.exerciseName]:newTotal}));setRestTimer(s=>({...s,remaining:Math.max(0,s.remaining+delta),totalSec:newTotal}));}}
      />

      <div style={{background:M.primaryContainer}}>
        <div style={{display:"flex",alignItems:"center",gap:4,padding:"12px 8px 8px"}}>
          <button onClick={onBack} className="m3i" style={{width:44,height:44,background:"transparent",color:M.onSurface}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div style={{flex:1,padding:"0 8px"}}>
            <div style={{fontSize:22,fontWeight:900,color:M.onSurface,fontFamily:FONT,letterSpacing:"-.3px"}}>{routine.emoji} {routine.name}</div>
            <div style={{fontSize:12,color:M.onSurfaceVariant,fontFamily:FONT,marginTop:1}}>{done}/{total} sets · +{done*10} XP · {fmtElapsed(elapsed)}</div>
          </div>
          <button onClick={()=>{clearSession();onFinish(exercises,Math.round((Date.now()-startTime)/1000),sessionNote);}} className="m3b" style={{background:M.primary,color:M.onPrimary,borderRadius:100,padding:"10px 20px",fontWeight:700,fontSize:13,fontFamily:FONT,marginRight:8}}>Finish ✓</button>
        </div>
        <div style={{height:4,background:M.surfaceContainerHighest}}>
          <div className="ease" style={{height:"100%",width:`${pct}%`,background:M.primary,borderRadius:"0 3px 3px 0"}}/>
        </div>
      </div>

      {/* Session note */}
      <div style={{margin:"12px 16px 0"}}>
        <input value={sessionNote} onChange={e=>setSessionNote(e.target.value)} placeholder="Session note (optional)…" style={{width:"100%",background:M.surfaceContainerHighest,border:"none",borderRadius:14,padding:"10px 16px",fontFamily:FONT,fontSize:16,color:M.onSurface,outline:"none"}}/>
      </div>

      <div style={{margin:"10px 16px 0",background:M.primaryContainer,borderRadius:20,padding:"12px 16px",display:"flex",alignItems:"center",gap:12}} onClick={()=>setStretchType("before")} className="m3b">
        <span style={{fontSize:24}}>🌅</span>
        <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:M.onPrimaryContainer,fontFamily:FONT}}>Warm-Up Stretches</div><div style={{fontSize:11,color:M.onPrimaryContainer,opacity:.75,fontFamily:FONT}}>Tap to see pre-workout stretches</div></div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={M.onPrimaryContainer} strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
      </div>

      <div style={{padding:"12px 16px 120px"}}>
        {exercises.map((ex,ei)=>(
          <div key={ei} style={{marginBottom:12,borderRadius:28,border:`1.5px solid ${swapped[ei]?M.tertiary:M.outlineVariant}`,overflow:"hidden",background:M.surface,animation:`stagger .3s ${ei*60}ms both`}}>
            <div style={{padding:"14px 16px",display:"flex",alignItems:"center",gap:14,borderBottom:`1px solid ${M.surfaceContainerHighest}`}}>
              <ExerciseTile name={ex.name} onTap={()=>setModalEx(ex.name)} size={56}/>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3,flexWrap:"wrap"}}>
                  <span style={{fontSize:15,fontWeight:800,color:M.onSurface,fontFamily:FONT}}>{ex.name}</span>
                  {swapped[ei]&&<span style={{fontSize:10,fontWeight:700,padding:"2px 10px",background:M.tertiaryContainer,color:M.onTertiaryContainer,borderRadius:100,fontFamily:FONT}}>Swapped</span>}
                  {prBadges[ei]&&<PRBadge tier={prBadges[ei]}/>}
                </div>
                <div style={{fontSize:12,color:M.onSurfaceVariant,fontFamily:FONT}}>{ex.sets} sets · {ex.reps} reps · tap icon for guide</div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                <button onClick={()=>setSwapIdx(ei)} className="m3b" style={{background:M.surfaceContainerHighest,borderRadius:100,color:M.onSurfaceVariant,padding:"8px 14px",fontSize:12,fontWeight:600,fontFamily:FONT,display:"flex",alignItems:"center",gap:5}}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/></svg>Swap
                </button>
                <button onClick={()=>setNoteOpenIdx(noteOpenIdx===ei?null:ei)} className="m3b" style={{background:ex.note?M.secondaryContainer:M.surfaceContainerHighest,borderRadius:100,color:ex.note?M.onSecondaryContainer:M.onSurfaceVariant,padding:"6px 12px",fontSize:11,fontWeight:600,fontFamily:FONT}}>
                  📝 Note
                </button>
              </div>
            </div>

            {/* Exercise note field */}
            {noteOpenIdx===ei&&(
              <div style={{padding:"8px 16px",borderBottom:`1px solid ${M.surfaceContainerHighest}`}}>
                <input value={ex.note} onChange={e=>setExercises(p=>p.map((ex2,i)=>i!==ei?ex2:{...ex2,note:e.target.value}))} placeholder="Note for this exercise…" style={{width:"100%",background:M.surfaceContainerHighest,border:"none",borderRadius:12,padding:"8px 14px",fontFamily:FONT,fontSize:16,color:M.onSurface,outline:"none"}}/>
              </div>
            )}

            <div style={{display:"grid",gridTemplateColumns:"28px 1fr 1fr 48px",gap:8,padding:"10px 16px 4px",fontSize:10,color:M.onSurfaceVariant,fontWeight:700,letterSpacing:".8px",textTransform:"uppercase",fontFamily:FONT}}>
              <span>#</span><span>kg</span><span>Reps</span><span/>
            </div>
            {ex.rows.map((s,si)=>(
              <div key={si} className="fast" style={{display:"grid",gridTemplateColumns:"28px 1fr 1fr 48px",gap:8,padding:"6px 16px",background:s.done?`${M.primaryContainer}70`:"transparent",alignItems:"center"}}>
                <span style={{fontSize:12,fontWeight:700,color:s.done?M.primary:M.onSurfaceVariant,fontFamily:FONT}}>{si+1}</span>
                <input type="number" inputMode="numeric" value={s.weight} onChange={e=>{const v=parseFloat(e.target.value)||0;setExercises(p=>p.map((ex2,i)=>i!==ei?ex2:{...ex2,rows:ex2.rows.map((r,j)=>j===si?{...r,weight:v}:j>si&&!r.done?{...r,weight:v}:r)}));}} className="fast" style={{background:s.done?M.primaryContainer:M.surfaceContainerHighest,border:"none",borderRadius:12,padding:"9px 12px",fontSize:16,fontWeight:700,color:s.done?M.onPrimaryContainer:M.onSurface,fontFamily:FONT,outline:"none",width:"100%",textAlign:"center"}}/>
                <input type="number" inputMode="numeric" value={s.reps} onChange={e=>{const v=parseInt(e.target.value)||0;setExercises(p=>p.map((ex2,i)=>i!==ei?ex2:{...ex2,rows:ex2.rows.map((r,j)=>j!==si?r:{...r,reps:v})}));}} className="fast" style={{background:s.done?M.primaryContainer:M.surfaceContainerHighest,border:"none",borderRadius:12,padding:"9px 12px",fontSize:16,fontWeight:700,color:s.done?M.onPrimaryContainer:M.onSurface,fontFamily:FONT,outline:"none",width:"100%",textAlign:"center"}}/>
                <button onClick={()=>toggle(ei,si)} className="m3i spring" style={{width:44,height:44,border:`2px solid ${s.done?M.primary:M.outline}`,background:s.done?M.primary:"transparent",color:s.done?M.onPrimary:M.outline}}>
                  {s.done&&<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                </button>
              </div>
            ))}
            <div style={{padding:"8px 16px 14px"}}>
              <button onClick={()=>setExercises(p=>p.map((e2,i)=>i!==ei?e2:{...e2,rows:[...e2.rows,{weight:e2.rows[e2.rows.length-1]?.weight||70,reps:e2.rows[e2.rows.length-1]?.reps||10,done:false}]}))} className="m3b" style={{width:"100%",background:"transparent",border:`1.5px dashed ${M.outlineVariant}`,borderRadius:14,color:M.primary,padding:"9px",fontSize:13,fontWeight:600,fontFamily:FONT}}>+ Add Set</button>
            </div>
          </div>
        ))}
        <div style={{background:M.tertiaryContainer,borderRadius:20,padding:"12px 16px",display:"flex",alignItems:"center",gap:12,marginTop:4}} onClick={()=>setStretchType("after")} className="m3b">
          <span style={{fontSize:24}}>🧘</span>
          <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:M.onTertiaryContainer,fontFamily:FONT}}>Cool-Down Stretches</div><div style={{fontSize:11,color:M.onTertiaryContainer,opacity:.75,fontFamily:FONT}}>Tap after your last set</div></div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={M.onTertiaryContainer} strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
      </div>
    </div>
  );
}

// ── Profile screen ────────────────────────────────────────────────────────
function ProfileScreen({
  userName,userAvatar,userEmail,logs,runs,bodyMetrics,onSaveBodyMetric,onExport,weeklyGoal,onWeeklyGoalChange,
}:{
  userName:string;userAvatar:string;userEmail:string;
  logs:WorkoutLog[];runs:Run[];bodyMetrics:BodyMetric[];
  onSaveBodyMetric:(bw:number,opts?:{body_fat_pct?:number;neck_cm?:number;waist_cm?:number;hip_cm?:number})=>Promise<void>;
  onExport:()=>void;weeklyGoal:number;onWeeklyGoalChange:(n:number)=>void;
}){
  const {palette:activePalette,setTheme}=useTheme();
  const firstName=userName.split(" ")[0]||"Athlete";
  const avatarInitial=firstName[0]?.toUpperCase()||"A";
  const streak=useMemo(()=>computeStreak(logs,runs),[logs,runs]);
  const totalXP=useMemo(()=>logs.reduce((a,w)=>a+w.xp_earned,0),[logs]);
  const totalMiles=useMemo(()=>runs.reduce((a,r)=>a+r.distance_miles,0),[runs]);
  const totalVol=useMemo(()=>logs.reduce((a,w)=>a+w.total_volume_kg,0),[logs]);
  const totalTime=useMemo(()=>logs.reduce((a,w)=>a+w.duration_seconds,0),[logs]);
  const handleSignOut=async()=>{await supabase.auth.signOut();};
  return(
    <div style={{padding:"0 16px 100px",animation:"heroIn .55s cubic-bezier(.2,0,0,1)"}}>
      <div style={{background:M.primaryContainer,borderRadius:28,padding:"28px 24px",marginBottom:16,display:"flex",alignItems:"center",gap:16}}>
        {userAvatar
          ?<img src={userAvatar} alt={firstName} style={{width:72,height:72,borderRadius:50,objectFit:"cover",flexShrink:0}}/>
          :<div style={{width:72,height:72,borderRadius:50,background:M.primary,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,fontWeight:900,color:M.onPrimary,fontFamily:FONT,flexShrink:0}}>{avatarInitial}</div>
        }
        <div>
          <div style={{fontSize:22,fontWeight:900,color:M.onPrimaryContainer,fontFamily:FONT,letterSpacing:"-.3px"}}>{userName||"Athlete"}</div>
          {userEmail&&<div style={{fontSize:13,color:M.onPrimaryContainer,opacity:.75,fontFamily:FONT,marginTop:2}}>{userEmail}</div>}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16}}>
        {[{icon:"🔥",val:String(streak),unit:"streak"},{icon:"⚡",val:String(totalXP),unit:"total XP"},{icon:"🏃",val:totalMiles.toFixed(0),unit:"miles"}].map(s=>(
          <div key={s.unit} style={{background:M.surfaceContainerHighest,borderRadius:20,padding:"16px 12px",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
            <span style={{fontSize:22}}>{s.icon}</span>
            <div style={{fontSize:20,fontWeight:900,color:M.onSurface,fontFamily:FONT}}>{s.val}</div>
            <div style={{fontSize:11,color:M.onSurfaceVariant,fontFamily:FONT}}>{s.unit}</div>
          </div>
        ))}
      </div>
      <div style={{background:M.surfaceContainerHighest,borderRadius:24,marginBottom:16,overflow:"hidden"}}>
        {[{icon:"🏋️",label:"Total workouts",val:String(logs.length)},{icon:"📊",label:"Total volume",val:`${totalVol.toFixed(0)} kg`},{icon:"⏱",label:"Time trained",val:fmtDur(totalTime)}].map((row,i)=>(
          <div key={row.label} style={{display:"flex",alignItems:"center",padding:"16px 20px",borderBottom:i<2?`1px solid ${M.surface}`:"none"}}>
            <span style={{fontSize:20,marginRight:12}}>{row.icon}</span>
            <div style={{flex:1,fontSize:14,fontWeight:600,color:M.onSurface,fontFamily:FONT}}>{row.label}</div>
            <div style={{fontSize:14,fontWeight:700,color:M.primary,fontFamily:FONT}}>{row.val}</div>
          </div>
        ))}
      </div>

      {/* Body Metrics */}
      <BodyMetrics metrics={bodyMetrics} onSave={onSaveBodyMetric}/>

      {/* Export */}
      <button onClick={onExport} className="m3b" style={{width:"100%",background:M.secondaryContainer,color:M.onSecondaryContainer,borderRadius:20,padding:14,fontWeight:800,fontSize:14,fontFamily:FONT,marginBottom:12,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Export All Data (CSV)
      </button>

      {/* Weekly Goal */}
      <div style={{background:M.surfaceContainerHighest,borderRadius:24,padding:"16px 20px",marginBottom:12}}>
        <div style={{fontSize:13,fontWeight:800,color:M.onSurface,fontFamily:FONT,marginBottom:10}}>🎯 Weekly Workout Goal</div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {[1,2,3,4,5,6,7].map(n=>(
            <button key={n} onClick={()=>onWeeklyGoalChange(n)} className="m3b" style={{flex:1,background:weeklyGoal===n?M.primary:M.surface,color:weeklyGoal===n?"#fff":M.onSurfaceVariant,border:`1.5px solid ${weeklyGoal===n?M.primary:M.outlineVariant}`,borderRadius:14,padding:"8px 0",fontSize:13,fontWeight:700,fontFamily:FONT,cursor:"pointer"}}>{n}</button>
          ))}
        </div>
        <div style={{fontSize:11,color:M.onSurfaceVariant,fontFamily:FONT,marginTop:8}}>{weeklyGoal} workout{weeklyGoal!==1?"s":""} / week target</div>
      </div>

      {/* Theme Selector */}
      <div style={{background:M.surfaceContainerHighest,borderRadius:24,padding:"16px 20px",marginBottom:16}}>
        <div style={{fontSize:13,fontWeight:800,color:M.onSurface,fontFamily:FONT,marginBottom:12}}>🎨 Theme</div>
        {PALETTES.map(p=>(
          <div key={p.id} onClick={()=>setTheme(p.id)} className="m3b" style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",borderRadius:18,marginBottom:6,background:activePalette.id===p.id?M.primaryContainer:M.surface,border:`1.5px solid ${activePalette.id===p.id?M.primary:M.outlineVariant}`,cursor:"pointer"}}>
            <div style={{display:"flex",gap:6}}>
              {p.swatches.map((c,i)=><div key={i} style={{width:18,height:18,borderRadius:5,background:c}}/>)}
            </div>
            <span style={{fontSize:13,fontWeight:700,color:activePalette.id===p.id?M.onPrimaryContainer:M.onSurface,fontFamily:FONT}}>{p.name}</span>
            {activePalette.id===p.id&&<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{color:M.primary}}><polyline points="20 6 9 17 4 12"/></svg>}
          </div>
        ))}
      </div>

      <button onClick={handleSignOut} className="m3b" style={{width:"100%",background:M.errorContainer,color:M.error,borderRadius:20,padding:16,fontWeight:800,fontSize:15,fontFamily:FONT}}>Sign Out</button>
    </div>
  );
}

// ── Routines screen ───────────────────────────────────────────────────────
const TONES=[
  {bg:M.primaryContainer,fg:M.onPrimaryContainer,btn:M.primary,btnFg:M.onPrimary},
  {bg:M.secondaryContainer,fg:M.onSecondaryContainer,btn:M.secondary,btnFg:M.onSecondary},
  {bg:M.tertiaryContainer,fg:M.onTertiaryContainer,btn:M.tertiary,btnFg:M.onTertiary},
  {bg:M.greenContainer,fg:M.onGreenContainer,btn:M.greenPrimary,btnFg:"#fff"},
  {bg:M.orangeContainer,fg:M.onOrangeContainer,btn:M.orangePrimary,btnFg:"#fff"},
];

function RoutinesScreen({routines,setRoutines,onStart,allExercises,userId,onStartProgramDay}:{routines:Routine[];setRoutines:React.Dispatch<React.SetStateAction<Routine[]>>;onStart:(r:Routine)=>void;allExercises:string[];userId:string;onStartProgramDay:(day:ProgramDay,blocks:ProgramBlock[],exercises:ProgramExercise[],programId:string)=>void;}){
  const[open,setOpen]=useState<number|null>(null);
  const[editing,setEditing]=useState<number|null>(null);
  const[renaming,setRenaming]=useState<{rIdx:number;eIdx:number}|null>(null);
  const[renameVal,setRenameVal]=useState("");
  const[addingEx,setAddingEx]=useState(false);
  const[exSearch,setExSearch]=useState("");
  const[newExName,setNewExName]=useState("");
  const[modalEx,setModalEx]=useState<string|null>(null);
  const[stretchType,setStretchType]=useState<string|null>(null);
  const[preSwap,setPreSwap]=useState<{rIdx:number;eIdx:number}|null>(null);
  const[showCustomModal,setShowCustomModal]=useState(false);

  const exResults=exSearch.trim().length>1?allExercises.filter(e=>e.toLowerCase().includes(exSearch.toLowerCase())).slice(0,5):[];
  const moveEx=(rIdx:number,from:number,to:number)=>{if(to<0||to>=routines[rIdx].exercises.length)return;setRoutines(p=>p.map((r,ri)=>{if(ri!==rIdx)return r;const exs=[...r.exercises];const[m]=exs.splice(from,1);exs.splice(to,0,m);return{...r,exercises:exs};}));};
  const commitRename=()=>{if(!renaming||!renameVal.trim()){setRenaming(null);return;}setRoutines(p=>p.map((r,ri)=>ri!==renaming.rIdx?r:{...r,exercises:r.exercises.map((e,ei)=>ei!==renaming.eIdx?e:{...e,name:renameVal.trim()})}));setRenaming(null);};
  const removeEx=(rIdx:number,eIdx:number)=>setRoutines(p=>p.map((r,ri)=>ri!==rIdx?r:{...r,exercises:r.exercises.filter((_,ei)=>ei!==eIdx)}));
  const addEx=(rIdx:number,name?:string)=>{const nm=(name||newExName).trim();if(!nm)return;setRoutines(p=>p.map((r,ri)=>ri!==rIdx?r:{...r,exercises:[...r.exercises,{id:"ex"+Date.now(),name:nm,sets:3,reps:"10–12"}]}));setNewExName("");setExSearch("");setAddingEx(false);};
  const doPreSwap=(sub:Partial<Sub>)=>{if(!preSwap)return;setRoutines(p=>p.map((r,ri)=>ri!==preSwap.rIdx?r:{...r,exercises:r.exercises.map((e,ei)=>ei!==preSwap.eIdx?e:{...e,name:sub.name||e.name})}));setPreSwap(null);};

  const handleSaveCustom=async(name:string,muscleGroup:string,equipment:string)=>{
    await dbSaveCustomExercise(userId,name,muscleGroup,equipment);
    setShowCustomModal(false);
  };

  return(
    <div>
      {modalEx&&<ExerciseModal name={modalEx} onClose={()=>setModalEx(null)}/>}
      {stretchType&&<StretchModal type={stretchType} onClose={()=>setStretchType(null)}/>}
      {preSwap&&<SwapDrawer exerciseName={routines[preSwap.rIdx]?.exercises[preSwap.eIdx]?.name} onSwap={doPreSwap} onClose={()=>setPreSwap(null)} allExercises={allExercises}/>}
      {showCustomModal&&<CustomExerciseModal onSave={handleSaveCustom} onClose={()=>setShowCustomModal(false)}/>}

      <div style={{padding:"4px 20px 20px",animation:"heroIn .5s cubic-bezier(.2,0,0,1)"}}>
        <div style={{fontSize:34,fontWeight:900,color:M.onSurface,fontFamily:FONT,letterSpacing:"-.6px",lineHeight:1.1}}>Workout</div>
        <div style={{fontSize:14,color:M.onSurfaceVariant,fontFamily:FONT,marginTop:5}}>Programs · My Routines</div>
      </div>

      {/* Active Program */}
      <ProgramsSection userId={userId} onStartProgramDay={onStartProgramDay}/>

      <div style={{padding:"4px 20px 8px"}}>
        <div style={{fontSize:18,fontWeight:900,color:M.onSurface,fontFamily:FONT}}>My Routines</div>
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
                          <input autoFocus value={renameVal} onChange={e=>setRenameVal(e.target.value)} onKeyDown={e=>e.key==="Enter"&&commitRename()} style={{flex:1,background:M.surfaceContainerHighest,border:`2px solid ${M.primary}`,borderRadius:14,padding:"8px 12px",fontSize:16,fontFamily:FONT,color:M.onSurface,outline:"none"}}/>
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
                      <input value={exSearch} onChange={e=>{setExSearch(e.target.value);setNewExName(e.target.value);}} placeholder="Search or type exercise…" style={{width:"100%",background:M.surfaceContainerHighest,border:"none",borderRadius:100,padding:"14px 20px 14px 48px",fontFamily:FONT,fontSize:16,color:M.onSurface,outline:"none"}}/>
                    </div>
                    {exResults.map((ex,i)=>(
                      <div key={i} onClick={()=>addEx(rIdx,ex)} className="m3b" style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",background:M.surfaceContainerHighest,borderRadius:18,marginTop:6,cursor:"pointer"}}>
                        <ExerciseTile name={ex} onTap={e=>{e.stopPropagation();setModalEx(ex);}} size={40}/>
                        <span style={{fontSize:13,fontWeight:600,color:M.onSurface,fontFamily:FONT}}>{ex}</span>
                      </div>
                    ))}
                    <div style={{display:"flex",gap:8,marginTop:10,flexWrap:"wrap"}}>
                      <button onClick={()=>addEx(rIdx)} className="m3b" style={{flex:1,background:M.primary,color:M.onPrimary,borderRadius:20,padding:13,fontSize:14,fontWeight:700,fontFamily:FONT}}>Add</button>
                      <button onClick={()=>setShowCustomModal(true)} className="m3b" style={{background:M.secondaryContainer,color:M.onSecondaryContainer,borderRadius:20,padding:"13px 16px",fontSize:13,fontWeight:700,fontFamily:FONT}}>+ Create New</button>
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

// ── Home screen ───────────────────────────────────────────────────────────
function HomeScreen({onStartWorkout,onOpenCalendar,firstName,weeklyStreak,thisWeekCount,weeklyGoal,prCount,routineFatigue,onStreakTap,onPRTap}:{
  onStartWorkout:()=>void;onOpenCalendar:()=>void;firstName:string;
  weeklyStreak:number;thisWeekCount:number;weeklyGoal:number;prCount:number;
  routineFatigue:RoutineFatigue[];
  onStreakTap:()=>void;onPRTap:()=>void;
}){
  const now=new Date();
  const hour=now.getHours();
  const greeting=hour<12?"Good morning":hour<17?"Good afternoon":"Good evening";
  const dayName=now.toLocaleDateString("en-US",{weekday:"long"});
  const dateLabel=now.toLocaleDateString("en-US",{month:"long",day:"numeric"});
  const quote=getDailyQuote();
  return(
    <div style={{padding:"0 16px 16px",animation:"heroIn .55s cubic-bezier(.2,0,0,1)"}}>
      <div style={{background:M.primaryContainer,borderRadius:28,padding:"28px 24px 24px",marginBottom:16,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",right:-30,top:-30,width:130,height:130,borderRadius:"50%",background:M.primary,opacity:.08}}/>
        <div style={{position:"absolute",right:20,bottom:-40,width:90,height:90,borderRadius:"50%",background:M.tertiary,opacity:.12}}/>
        <div style={{fontSize:12,color:M.onPrimaryContainer,fontFamily:FONT,fontWeight:600,opacity:.7,marginBottom:6}}>{dayName} · {dateLabel}</div>
        <div style={{fontSize:30,fontWeight:900,color:M.onPrimaryContainer,fontFamily:FONT,letterSpacing:"-.5px",lineHeight:1.2}}>{greeting},<br/>{firstName} 💪</div>
        <div style={{fontSize:12,fontStyle:"italic",color:M.onPrimaryContainer,fontFamily:FONT,opacity:.7,marginTop:10,lineHeight:1.5}}>"{quote}"</div>
      </div>
      <div style={{display:"flex",gap:10,marginBottom:16,overflowX:"auto",paddingBottom:4}}>
        <div onClick={onStreakTap} className="m3b" style={{background:M.tertiaryContainer,borderRadius:20,padding:"14px 18px",flexShrink:0,display:"flex",alignItems:"center",gap:12,cursor:"pointer"}}>
          <span style={{fontSize:24}}>🔥</span>
          <div><div style={{fontSize:22,fontWeight:900,color:M.onTertiaryContainer,fontFamily:FONT,lineHeight:1}}>{weeklyStreak}</div><div style={{fontSize:11,color:M.onTertiaryContainer,opacity:.75,fontFamily:FONT,marginTop:1}}>wk streak</div></div>
        </div>
        <div style={{background:M.primaryContainer,borderRadius:20,padding:"14px 18px",flexShrink:0,display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:24}}>📅</span>
          <div><div style={{fontSize:22,fontWeight:900,color:M.onPrimaryContainer,fontFamily:FONT,lineHeight:1}}>{thisWeekCount}/{weeklyGoal}</div><div style={{fontSize:11,color:M.onPrimaryContainer,opacity:.75,fontFamily:FONT,marginTop:1}}>this week</div></div>
        </div>
        <div onClick={onPRTap} className="m3b" style={{background:M.secondaryContainer,borderRadius:20,padding:"14px 18px",flexShrink:0,display:"flex",alignItems:"center",gap:12,cursor:"pointer"}}>
          <span style={{fontSize:24}}>🏆</span>
          <div><div style={{fontSize:22,fontWeight:900,color:M.onSecondaryContainer,fontFamily:FONT,lineHeight:1}}>{prCount}</div><div style={{fontSize:11,color:M.onSecondaryContainer,opacity:.75,fontFamily:FONT,marginTop:1}}>PRs</div></div>
        </div>
      </div>
      <button onClick={onStartWorkout} className="m3b" style={{width:"100%",background:M.primaryContainer,color:M.onPrimaryContainer,borderRadius:20,padding:"20px",fontFamily:FONT,fontWeight:800,fontSize:16,display:"flex",alignItems:"center",gap:14,justifyContent:"center",marginBottom:16,animation:"scaleIn .4s cubic-bezier(.34,1.56,.64,1) .1s both"}}>
        <span style={{fontSize:28}}>🏋️</span>Start Workout
      </button>
      <FatigueMap routineFatigue={routineFatigue}/>
      <div onClick={onOpenCalendar} className="m3b" style={{background:M.surfaceContainerHighest,borderRadius:28,padding:20,marginBottom:16,cursor:"pointer"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div style={{fontSize:12,fontWeight:700,color:M.onSurfaceVariant,letterSpacing:".5px",textTransform:"uppercase",fontFamily:FONT}}>This Week</div>
          <div style={{fontSize:11,color:M.primary,fontWeight:700,fontFamily:FONT,display:"flex",alignItems:"center",gap:4}}>View all <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg></div>
        </div>
        <div style={{display:"flex",gap:6}}>
          {Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));const key=d.toISOString().slice(0,10);const entry=HISTORY[key];const col=entry?TYPE_COLORS[entry.type]:null;const isToday=key===new Date().toISOString().slice(0,10);return(
            <div key={i} style={{flex:1,textAlign:"center"}}>
              <div className="spring" style={{height:44,borderRadius:14,marginBottom:5,background:col?col.bg:M.surface,display:"flex",alignItems:"center",justifyContent:"center",border:isToday?`2px solid ${M.primary}`:"2px solid transparent"}}>
                {entry&&<span style={{fontSize:14}}>{entry.emoji}</span>}
              </div>
              <div style={{fontSize:10,color:isToday?M.primary:M.onSurfaceVariant,fontFamily:FONT}}>{["S","M","T","W","T","F","S"][d.getDay()]}</div>
            </div>
          );})}
        </div>
        <div style={{fontSize:11,color:M.onSurfaceVariant,fontFamily:FONT,textAlign:"center",marginTop:10,opacity:.7}}>Tap to see full activity history</div>
      </div>
      <div style={{fontSize:11,color:M.onSurfaceVariant,fontFamily:FONT,textAlign:"center",marginBottom:12,opacity:.55}}>v{APP_VERSION}</div>
    </div>
  );
}

// ── Login screen ──────────────────────────────────────────────────────────
function LoginScreen(){
  const[loading,setLoading]=useState(false);
  const[err,setErr]=useState<string|null>(null);
  const handleLogin=async()=>{
    setLoading(true);setErr(null);
    const{error}=await supabase.auth.signInWithOAuth({provider:"google",options:{redirectTo:import.meta.env.VITE_SITE_URL||window.location.origin}});
    if(error){setErr(error.message);setLoading(false);}
  };
  return(
    <div style={{minHeight:"100vh",background:M.background,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"0 32px",fontFamily:FONT}}>
      <div style={{animation:"loginFloat 3s ease-in-out infinite",marginBottom:32}}>
        <div style={{width:96,height:96,borderRadius:28,background:M.primary,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <TigerLogo size={72}/>
        </div>
      </div>
      <div style={{fontSize:36,fontWeight:900,color:M.onSurface,fontFamily:FONT,letterSpacing:"-.5px",marginBottom:8,textAlign:"center"}}>Fitty</div>
      <div style={{fontSize:15,color:M.onSurfaceVariant,fontFamily:FONT,marginBottom:48,textAlign:"center"}}>Your personal fitness tracker</div>
      <button onClick={handleLogin} disabled={loading} className="m3b" style={{background:M.surface,border:`1.5px solid ${M.outlineVariant}`,borderRadius:100,padding:"14px 28px",display:"flex",alignItems:"center",gap:12,fontFamily:FONT,fontWeight:700,fontSize:15,color:M.onSurface,width:"100%",maxWidth:300,justifyContent:"center",boxShadow:"0 2px 12px rgba(0,0,0,.08)",animation:"scaleIn .5s cubic-bezier(.34,1.56,.64,1)",opacity:loading?.6:1}}>
        <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#4285F4" d="M24 9.5c3.2 0 5.9 1.1 8.1 2.9l6-6C34.3 3.1 29.5 1 24 1 15.1 1 7.5 6.2 4 13.7l7 5.4C12.8 13.3 17.9 9.5 24 9.5z"/><path fill="#34A853" d="M46.1 24.6c0-1.6-.1-2.8-.4-4H24v7.7h12.5c-.5 2.8-2.2 5.2-4.7 6.8l7.3 5.7c4.3-3.9 6.9-9.7 6.9-16.2z"/><path fill="#FBBC05" d="M11 28.1l-7 5.4C6.5 40 14.3 45 24 45c5.6 0 10.3-1.9 13.7-5.1l-7.3-5.7c-1.8 1.2-4.1 1.9-6.4 1.9-6.1 0-11.3-4.1-13.1-9.7l.1-.3z"/><path fill="#EA4335" d="M4 13.7l7 5.4C12.8 13.3 17.9 9.5 24 9.5c3.2 0 5.9 1.1 8.1 2.9l6-6C34.3 3.1 29.5 1 24 1 15.1 1 7.5 6.2 4 13.7z"/></svg>
        {loading?"Signing in...":"Continue with Google"}
      </button>
      {err&&<div style={{fontSize:12,color:M.error,marginTop:12,textAlign:"center",fontFamily:FONT,maxWidth:300}}>{err}</div>}
      <div style={{fontSize:12,color:M.onSurfaceVariant,marginTop:20,textAlign:"center",fontFamily:FONT,maxWidth:260,lineHeight:1.6}}>Your data is private and only accessible to your Google account</div>
    </div>
  );
}

// ── Nav tabs ──────────────────────────────────────────────────────────────
const NAV=[
  {id:"home",label:"Home",icon:(a:boolean)=><svg width="22" height="22" viewBox="0 0 24 24" fill={a?"currentColor":"none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path fill="none" d="M9 21V12h6v9"/></svg>},
  {id:"workout",label:"Workout",icon:(a:boolean)=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.5:2} strokeLinecap="round"><path d="M6 7v10M18 7v10M6 9H2M6 15H2M18 9h4M18 15h4M6 7h12"/></svg>},
  {id:"running",label:"Running",icon:(a:boolean)=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.5:2} strokeLinecap="round"><circle cx="15" cy="4" r="1.5"/><path d="M9 18l2-6 3 3 2-5M7 21l4-3M17 18l-3-3"/></svg>},
  {id:"progress",label:"Progress",icon:(a:boolean)=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.5:2} strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>},
  {id:"profile",label:"Profile",icon:(a:boolean)=><svg width="22" height="22" viewBox="0 0 24 24" fill={a?"currentColor":"none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="8" r="4"/><path fill="none" d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>},
];

// ── Root App component ────────────────────────────────────────────────────
export default function FittyApp(){
  useCSS();
  const{isOffline,safeInsert}=useOfflineSync();
  const{needRefresh:[needRefresh],updateServiceWorker}=useRegisterSW();

  const[loggedIn,setLoggedIn]=useState(false);
  const[userName,setUserName]=useState("");
  const[userAvatar,setUserAvatar]=useState("");
  const[userEmail,setUserEmail]=useState("");
  const[userId,setUserId]=useState("");
  const[screen,setScreen]=useState("home");
  const[activeNav,setActiveNav]=useState("home");
  const[routine,setRoutine]=useState<Routine|null>(null);
  const[activeProgramDayId,setActiveProgramDayId]=useState<string|null>(null);
  const[activeProgramId,setActiveProgramId]=useState<string|null>(null);
  const[routines,setRoutines]=useState<Routine[]>(INIT);
  const[calendarOpen,setCalendarOpen]=useState(false);
  const[workoutLogs,setWorkoutLogs]=useState<WorkoutLog[]>([]);
  const[runs,setRuns]=useState<Run[]>([]);
  const[workoutExercises,setWorkoutExercises]=useState<WorkoutExerciseRow[]>([]);
  const[personalRecords,setPersonalRecords]=useState<PersonalRecord[]>([]);
  const[bodyMetrics,setBodyMetrics]=useState<BodyMetric[]>([]);
  const[customExercises,setCustomExercises]=useState<CustomExercise[]>([]);
  const[pendingPR,setPendingPR]=useState<PRInfo|null>(null);
  const[streakSheetOpen,setStreakSheetOpen]=useState(false);
  const[prSheetOpen,setPrSheetOpen]=useState(false);
  const[weeklyGoal,setWeeklyGoal]=useState(()=>parseInt(localStorage.getItem("fitty_weekly_goal")||"3")||3);
  const[longestStreak,setLongestStreak]=useState(0);
  const[resumeSession,setResumeSession]=useState<SavedSession|null>(null);
  const[workoutStartTime,setWorkoutStartTime]=useState<number>(()=>Date.now());

  // User settings (persisted to localStorage)
  const[targetPaceSec]=useState(()=>parseInt(localStorage.getItem("fitty_target_pace")||"0")||0);
  const[distUnit]=useState<"mi"|"km">(()=>(localStorage.getItem("fitty_dist_unit")||"mi") as "mi"|"km");

  // All exercises = base + custom
  const allExercises=useMemo(()=>[...BASE_EX,...customExercises.map(c=>c.name)],[customExercises]);

  const loadAll=async(uid:string)=>{
    dbLoadWorkouts(uid).then(setWorkoutLogs);
    dbLoadRunsFull(uid).then(setRuns);
    dbLoadWorkoutsWithExercises(uid).then(setWorkoutExercises);
    dbLoadPRs(uid).then(setPersonalRecords);
    dbLoadBodyMetrics(uid).then(setBodyMetrics);
    dbLoadCustomExercises(uid).then(setCustomExercises);
    // Load longest streak from profiles
    supabase.from("profiles").select("longest_streak").eq("id",uid).maybeSingle()
      .then(({data})=>{ if(data)setLongestStreak((data as {longest_streak:number}).longest_streak||0); });
  };

  // Check for unfinished session on mount
  useEffect(()=>{
    const s=loadSession();
    if(s)setResumeSession(s);
  },[]);

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{
      if(session){
        const uid=session.user.id;
        setLoggedIn(true);setUserId(uid);
        const meta=session.user.user_metadata;
        setUserName(meta.full_name||meta.name||session.user.email?.split("@")[0]||"");
        setUserAvatar(meta.avatar_url||meta.picture||"");
        setUserEmail(session.user.email||"");
        loadAll(uid);
      }
    });
    const{data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{
      if(session){
        const uid=session.user.id;
        setLoggedIn(true);setUserId(uid);
        const meta=session.user.user_metadata;
        setUserName(meta.full_name||meta.name||session.user.email?.split("@")[0]||"");
        setUserAvatar(meta.avatar_url||meta.picture||"");
        setUserEmail(session.user.email||"");
        loadAll(uid);
      }else{
        setLoggedIn(false);
        setUserName("");setUserAvatar("");setUserEmail("");setUserId("");
        setWorkoutLogs([]);setRuns([]);setWorkoutExercises([]);setPersonalRecords([]);setBodyMetrics([]);
      }
    });
    return()=>subscription.unsubscribe();
  },[]);

  const finishWorkout=async(r:Routine,exercises:ActiveExercise[],durationSec:number,sessionNote:string)=>{
    setRoutines(p=>{const u=p.map(rt=>rt.id===r.id?{...rt,lastDone:"Today",daysAgo:0}:rt);return[...u].sort((a,b)=>{if(a.daysAgo===0&&b.daysAgo!==0)return 1;if(b.daysAgo===0&&a.daysAgo!==0)return-1;return b.daysAgo-a.daysAgo;});});
    if(userId){
      // Insert program day log first (awaited) so ProgramsSection sees it when re-mounting
      if(activeProgramDayId&&activeProgramId){
        await supabase.from("program_day_logs").insert({user_id:userId,program_id:activeProgramId,day_id:activeProgramDayId,completed_at:new Date().toISOString()});
        setActiveProgramDayId(null);setActiveProgramId(null);
      }
      // Workout save + reload can happen in background
      dbSaveWorkout(userId,r,exercises,durationSec,sessionNote).then(()=>loadAll(userId));
    }
    setScreen("home");setActiveNav("home");
  };

  const handleRunSaved=async(fields:{distanceMiles:number;durationSeconds:number;notes:string;routeName?:string;heartRateAvg?:number;runDate:string},editId?:string)=>{
    if(userId){
      if(editId){
        await dbUpdateRun(editId,{
          distance_miles:fields.distanceMiles,
          duration_seconds:fields.durationSeconds,
          notes:fields.notes,
          route_name:fields.routeName||undefined,
          heart_rate_avg:fields.heartRateAvg||undefined,
          ran_at:fields.runDate,
        });
      }else{
        await safeInsert("runs",{
          user_id:userId,
          distance_miles:fields.distanceMiles,
          duration_seconds:fields.durationSeconds,
          notes:fields.notes,
          route_name:fields.routeName||null,
          heart_rate_avg:fields.heartRateAvg||null,
          ran_at:fields.runDate,
        });
      }
      dbLoadRunsFull(userId).then(setRuns);
    }
  };

  const handleSaveBodyMetric=async(bw:number,opts?:{body_fat_pct?:number;neck_cm?:number;waist_cm?:number;hip_cm?:number})=>{
    if(userId){await dbSaveBodyMetric(userId,bw,opts);dbLoadBodyMetrics(userId).then(setBodyMetrics);}
  };

  const handleExport=()=>exportCSV(workoutLogs,runs,personalRecords,bodyMetrics);

  const handleWeeklyGoalChange=(n:number)=>{
    setWeeklyGoal(n);
    localStorage.setItem("fitty_weekly_goal",String(n));
    if(userId){supabase.from("profiles").upsert({id:userId,weekly_goal:n}).then(()=>{});}
  };

  const nav=(id:string)=>{setActiveNav(id);setScreen(id==="workout"?"routines":id);};
  const firstName=userName.split(" ")[0]||"there";
  const avatarInitial=firstName[0]?.toUpperCase()||"?";

  // Latest body weight for calorie calculations
  const latestBodyweight=bodyMetrics[0]?.bodyweight||80;

  // Weekly streak
  const {streak:weeklyStreak,thisWeekCount}=useMemo(()=>computeWeeklyStreak(workoutLogs,weeklyGoal),[workoutLogs,weeklyGoal]);

  // Fatigue map data — derive last trained date per routine from workout logs
  const routineFatigue:RoutineFatigue[]=useMemo(()=>{
    const map:Record<string,string>={};
    workoutLogs.forEach(w=>{
      const existing=map[w.routine_name];
      if(!existing||w.completed_at>existing)map[w.routine_name]=w.completed_at;
    });
    return[
      {routineName:"Push Day",lastDoneDate:map["Push Day"]||null},
      {routineName:"Pull Day",lastDoneDate:map["Pull Day"]||null},
      {routineName:"Leg Day",lastDoneDate:map["Leg Day"]||null},
      {routineName:"Upper Body",lastDoneDate:map["Upper Body"]||null},
      {routineName:"Misc / Isolation",lastDoneDate:map["Misc / Isolation"]||null},
    ];
  },[workoutLogs]);

  // Count unique exercise PRs
  const prCount=useMemo(()=>{
    const names=new Set(personalRecords.map(p=>p.exercise_name));
    return names.size;
  },[personalRecords]);

  if(!loggedIn)return <LoginScreen/>;

  return(
    <div style={{fontFamily:FONT,background:M.background,color:M.onSurface,minHeight:"100vh",display:"flex",justifyContent:"center",WebkitFontSmoothing:"antialiased"}}>
      <div style={{width:"100%",maxWidth:430,position:"relative",paddingBottom:96}}>
        {calendarOpen&&<CalendarModal onClose={()=>setCalendarOpen(false)} workoutLogs={workoutLogs} runs={runs}/>}
        {pendingPR&&<PRModal pr={pendingPR} onClose={()=>setPendingPR(null)}/>}
        {streakSheetOpen&&<StreakSheet logs={workoutLogs} weeklyGoal={weeklyGoal} longestStreak={longestStreak} onClose={()=>setStreakSheetOpen(false)}/>}
        {prSheetOpen&&<PRSheet prs={personalRecords} onClose={()=>setPrSheetOpen(false)}/>}

        {/* Resume banner */}
        {resumeSession&&screen!=="active"&&(
          <div style={{margin:"8px 16px 0",background:M.tertiaryContainer,borderRadius:20,padding:"12px 16px",display:"flex",alignItems:"center",gap:12,animation:"slideUp .4s cubic-bezier(.34,1.56,.64,1)"}}>
            <span style={{fontSize:22}}>⚡</span>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:800,color:M.onTertiaryContainer,fontFamily:FONT}}>Unfinished workout</div>
              <div style={{fontSize:11,color:M.onTertiaryContainer,opacity:.8,fontFamily:FONT}}>{resumeSession.routine.name}</div>
            </div>
            <button onClick={()=>{setWorkoutStartTime(resumeSession.startTimestamp);setRoutine(resumeSession.routine);setScreen("active");setActiveNav("workout");setResumeSession(null);}} className="m3b" style={{background:M.tertiary,color:M.onTertiary,borderRadius:100,padding:"6px 14px",fontSize:12,fontWeight:700,fontFamily:FONT,flexShrink:0}}>Resume</button>
            <button onClick={()=>{clearSession();setResumeSession(null);}} className="m3b" style={{background:"transparent",border:`1px solid ${M.outlineVariant}`,borderRadius:100,padding:"6px 10px",fontSize:12,color:M.onTertiaryContainer,fontFamily:FONT,flexShrink:0}}>Discard</button>
          </div>
        )}

        {/* Update banner */}
        {needRefresh&&(
          <div style={{margin:"8px 16px 0",background:M.secondaryContainer,borderRadius:20,padding:"12px 16px",display:"flex",alignItems:"center",gap:12,animation:"slideUp .4s cubic-bezier(.34,1.56,.64,1)"}}>
            <span style={{fontSize:22}}>🔄</span>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:800,color:M.onSecondaryContainer,fontFamily:FONT}}>Update available</div>
              <div style={{fontSize:11,color:M.onSecondaryContainer,opacity:.8,fontFamily:FONT}}>Tap to reload and get the latest version</div>
            </div>
            <button onClick={()=>updateServiceWorker(true)} className="m3b" style={{background:M.secondary,color:M.onSecondary,borderRadius:100,padding:"6px 14px",fontSize:12,fontWeight:700,fontFamily:FONT,flexShrink:0}}>Update</button>
          </div>
        )}

        {/* Status bar */}
        {isOffline&&(
          <div style={{display:"flex",justifyContent:"center",padding:"8px 24px 0"}}>
            <div style={{background:M.orangeContainer,borderRadius:100,padding:"3px 14px",fontSize:10,fontWeight:700,color:M.orangePrimary,fontFamily:FONT}}>Offline</div>
          </div>
        )}

        {/* Top bar */}
        {screen!=="active"&&(
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 16px 16px"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:38,height:38,borderRadius:14,background:M.primary,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <TigerLogo size={28}/>
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

        {/* Screens */}
        {screen==="home"&&<HomeScreen onStartWorkout={()=>{setScreen("routines");setActiveNav("workout");}} onOpenCalendar={()=>setCalendarOpen(true)} firstName={firstName} weeklyStreak={weeklyStreak} thisWeekCount={thisWeekCount} weeklyGoal={weeklyGoal} prCount={prCount} routineFatigue={routineFatigue} onStreakTap={()=>setStreakSheetOpen(true)} onPRTap={()=>setPrSheetOpen(true)}/>}
        {screen==="routines"&&<RoutinesScreen routines={routines} setRoutines={setRoutines} onStart={r=>{setWorkoutStartTime(Date.now());setRoutine({...r,exercises:r.exercises.map(ex=>({...ex,defaultWeight:getLastWeight(ex.name,workoutExercises)}))});setScreen("active");setActiveNav("workout");}} allExercises={allExercises} userId={userId} onStartProgramDay={(day,_blocks,exs,programId)=>{setWorkoutStartTime(Date.now());const r:Routine={id:-1,name:`Day ${day.dayNumber} · ${day.title}`,emoji:"🏋️",tag:"SquatCtober",lastDone:"Today",daysAgo:0,duration:"60 min",exercises:exs.filter(ex=>ex.sets&&ex.sets>0).map(ex=>({id:ex.id,name:ex.exerciseName,sets:ex.sets!,reps:ex.reps||"10",defaultWeight:getLastWeight(ex.exerciseName,workoutExercises)}))};setRoutine(r);setActiveProgramDayId(day.id);setActiveProgramId(programId);setScreen("active");setActiveNav("workout");}}/>}
        {screen==="active"&&routine&&(
          <ActiveScreen
            routine={routine}
            onFinish={(exs,dur,note)=>finishWorkout(routine,exs,dur,note)}
            onBack={()=>{setScreen("routines");setActiveProgramDayId(null);setActiveProgramId(null);}}
            userId={userId}
            allPRs={personalRecords}
            onNewPR={pr=>setPendingPR(pr)}
            startTimestamp={workoutStartTime}
          />
        )}
        {screen==="running"&&(
          <RunningScreenFull
            userId={userId}
            runs={runs}
            userBodyweight={latestBodyweight}
            targetPaceSec={targetPaceSec}
            distanceUnit={distUnit}
            onSaveRun={handleRunSaved}
            onTargetPaceChange={()=>{}}
          />
        )}
        {screen==="progress"&&(
          <ProgressAnalytics
            logs={workoutLogs}
            runs={runs}
            workoutExercises={workoutExercises}
            personalRecords={personalRecords}
            userId={userId}
          />
        )}
        {screen==="profile"&&(
          <ProfileScreen
            userName={userName}
            userAvatar={userAvatar}
            userEmail={userEmail}
            logs={workoutLogs}
            runs={runs}
            bodyMetrics={bodyMetrics}
            onSaveBodyMetric={handleSaveBodyMetric}
            onExport={handleExport}
            weeklyGoal={weeklyGoal}
            onWeeklyGoalChange={handleWeeklyGoalChange}
          />
        )}

        {/* Bottom nav */}
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
