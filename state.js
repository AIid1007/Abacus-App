/* Bead Dojo — state, profiles, belts, persistence */
'use strict';

const DOJO_KEY = 'bead-dojo-v1';

const BELTS = [
  { id:0, name:'White Belt',  color:'#f2f0e8', xp:0,    kanji:'一' },
  { id:1, name:'Yellow Belt', color:'#e8c84a', xp:12,   kanji:'二' },
  { id:2, name:'Orange Belt', color:'#e08a3c', xp:30,   kanji:'三' },
  { id:3, name:'Green Belt',  color:'#5c7d68', xp:60,   kanji:'四' },
  { id:4, name:'Blue Belt',   color:'#4a6fa5', xp:100,  kanji:'五' },
  { id:5, name:'Purple Belt', color:'#7a5c8a', xp:150,  kanji:'六' },
  { id:6, name:'Brown Belt',  color:'#8a5a3b', xp:220,  kanji:'七' },
  { id:7, name:'Red Belt',    color:'#a8382f', xp:310,  kanji:'八' },
  { id:8, name:'Black Belt',  color:'#111111', xp:420,  kanji:'九' },
  { id:9, name:'Black · 2 Dan', color:'#111111', xp:560, kanji:'十' },
];
/* xp = daily-round solves. ~3/day: yellow ~4 days, black in ~4-5 months, 2-dan beyond. */

const DAILY_LIMIT = 3;

function defaultProfile(name){
  return {
    name,
    xp: 0,
    totalSolved: 0,
    streak: 0,
    bestStreak: 0,
    lastTrainDate: null,
    todayRounds: 0,
    todayDate: null,
    shields: 0,
    shieldUsed: false,
    bestMs: null,
    sound: true,
    history: [],       /* [{d, acc, avgMs, n, ok}] max 60 */
    bonusTakenDate: null,
    scrollDate: null,
  };
}

let DB = null;
let P = null;
let PIDX = 0;

function loadDB(){
  try{
    const raw = localStorage.getItem(DOJO_KEY);
    if(raw){ DB = JSON.parse(raw); }
  }catch(e){ DB = null; }
  if(!DB || !Array.isArray(DB.profiles) || DB.profiles.length !== 2){
    DB = { profiles: [defaultProfile('Player 1'), defaultProfile('Player 2')] };
  }
}

function saveDB(){
  try{ localStorage.setItem(DOJO_KEY, JSON.stringify(DB)); }catch(e){}
}

function selectProfile(i){
  PIDX = i;
  P = DB.profiles[i];
  rolloverDay();
}

function todayStr(){ return new Date().toISOString().slice(0,10); }
function daysAgoStr(n){ const d=new Date(); d.setDate(d.getDate()-n); return d.toISOString().slice(0,10); }

/* day change: reset daily rounds, streak logic with shields */
function rolloverDay(){
  const t = todayStr();
  if(P.todayDate === t) return;
  if(P.lastTrainDate && P.lastTrainDate !== t && P.lastTrainDate !== daysAgoStr(1)){
    const missedDays = Math.floor((new Date(t) - new Date(P.lastTrainDate)) / 86400000) - 1;
    if(missedDays > 0){
      if(P.shields >= missedDays && missedDays <= 2){
        P.shields -= missedDays;
        P.shieldUsed = true;   /* streak survives */
      } else {
        P.streak = 0;
      }
    }
  }
  P.todayDate = t;
  P.todayRounds = 0;
  saveDB();
}

function beltFor(xp){
  let b = BELTS[0];
  for(const belt of BELTS){ if(xp >= belt.xp) b = belt; }
  return b;
}
function nextBelt(xp){
  for(const belt of BELTS){ if(xp < belt.xp) return belt; }
  return null;
}

function recordDailySolve(correct, elapsedMs){
  const t = todayStr();
  if(correct){
    P.totalSolved += 1;
    P.xp += 1;
    if(!P.bestMs || elapsedMs < P.bestMs) P.bestMs = elapsedMs;
  }
  let h = P.history.find(x => x.d === t);
  if(!h){ h = { d:t, acc:0, avgMs:0, n:0, ok:0 }; P.history.push(h); }
  h.n += 1;
  h.ok += correct ? 1 : 0;
  h.avgMs = Math.round((h.avgMs * (h.n-1) + elapsedMs) / h.n);
  h.acc = h.ok / h.n;
  if(P.history.length > 60) P.history = P.history.slice(-60);
  saveDB();
}

function completeDailyRound(){
  P.todayRounds += 1;
  if(P.todayRounds === DAILY_LIMIT){
    const t = todayStr();
    if(P.lastTrainDate === t){
      /* already counted today (shouldn't happen) */
    } else if(P.lastTrainDate === daysAgoStr(1) || P.shieldUsed){
      P.streak += 1;
    } else {
      P.streak = 1;
    }
    P.shieldUsed = false;
    P.lastTrainDate = t;
    P.bestStreak = Math.max(P.bestStreak, P.streak);
  }
  saveDB();
}

function dailyDone(){ return P.todayRounds >= DAILY_LIMIT; }
function bonusAvailable(){ return dailyDone() && P.bonusTakenDate !== todayStr(); }
function scrollAvailable(){ return dailyDone() && P.scrollDate !== todayStr(); }

function weekStats(offsetDays){
  let n=0, acc=0, ms=0;
  for(let i=offsetDays; i<offsetDays+7; i++){
    const h = P.history.find(x => x.d === daysAgoStr(i));
    if(h){ n++; acc += h.acc; ms += h.avgMs; }
  }
  if(n===0) return null;
  return { acc: acc/n, avgMs: ms/n, days:n };
}

function exportSave(){
  const blob = new Blob([JSON.stringify(DB, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'bead-dojo-save.json';
  a.click();
  URL.revokeObjectURL(a.href);
}
function importSave(file, cb){
  const r = new FileReader();
  r.onload = () => {
    try{
      const parsed = JSON.parse(r.result);
      if(parsed && Array.isArray(parsed.profiles)){ DB = parsed; saveDB(); cb(true); }
      else cb(false);
    }catch(e){ cb(false); }
  };
  r.readAsText(file);
}
