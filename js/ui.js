/* Bead Dojo — UI + game flow */
'use strict';

const $ = s => document.querySelector(s);
const screens = { profiles: $('#screen-profiles'), home: $('#screen-home'), play: $('#screen-play') };
function show(name){
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
}

/* ============ PROFILE SELECT ============ */
function renderProfiles(){
  const box = $('#profile-cards');
  box.innerHTML = '';
  DB.profiles.forEach((prof, i) => {
    const belt = beltFor(prof.xp);
    const card = document.createElement('button');
    card.className = 'profile-card';
    card.innerHTML = `
      <div>
        <div class="profile-name">${escapeHtml(prof.name)}</div>
        <div class="profile-meta">${belt.name} · streak ${prof.streak} · ${prof.totalSolved} solved</div>
      </div>
      <div class="profile-belt" style="background:${belt.color}"></div>`;
    card.onclick = () => {
      if(prof.name.startsWith('Player ')){
        const n = prompt('Name this fighter:', prof.name);
        if(n && n.trim()) { prof.name = n.trim().slice(0,16); saveDB(); }
      }
      selectProfile(i);
      renderHome();
      show('home');
    };
    box.appendChild(card);
  });
}
function escapeHtml(s){ return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

/* ============ HOME ============ */
function renderHome(){
  rolloverDay();
  const belt = beltFor(P.xp);
  $('#belt-title').textContent = `${belt.name}`;
  $('#belt-sub').textContent = `${P.name} · ${P.totalSolved} solved · streak ${P.streak}${P.bestStreak>P.streak?` (best ${P.bestStreak})`:''}`;
  $('#btn-sound').classList.toggle('off', !P.sound);

  /* journey */
  const j = $('#journey'); j.innerHTML = '';
  BELTS.forEach((b, i) => {
    const node = document.createElement('div');
    node.className = 'j-node' + (P.xp >= b.xp && (i===BELTS.length-1 || P.xp < BELTS[i+1].xp) ? ' current' : (P.xp >= b.xp ? ' done' : ''));
    node.style.setProperty('--belt-c', b.color === '#111111' ? '#c9a25a' : b.color);
    node.textContent = b.kanji;
    node.title = b.name + ' — ' + b.xp + ' solves';
    j.appendChild(node);
    if(i < BELTS.length-1){
      const link = document.createElement('div');
      link.className = 'j-link' + (P.xp >= BELTS[i+1].xp ? ' done' : '');
      j.appendChild(link);
    }
  });

  /* sensei greeting (stable per day) */
  $('#sensei-box').innerHTML = `<b>SENSEI</b>${seededPick(SENSEI_GREETINGS, todayStr()+P.name)}`;

  /* daily rounds */
  const dr = $('#daily-rounds'); dr.innerHTML = '';
  for(let i=0;i<DAILY_LIMIT;i++){
    const slot = document.createElement('div');
    slot.className = 'round-slot' + (i < P.todayRounds ? ' done' : '');
    slot.textContent = i < P.todayRounds ? '印' : '';
    dr.appendChild(slot);
  }
  /* bonus slot */
  const bonus = document.createElement('div');
  bonus.className = 'round-slot bonus' + (P.bonusTakenDate === todayStr() ? ' done' : '');
  bonus.textContent = P.bonusTakenDate === todayStr() ? '倍' : '';
  bonus.title = 'double-or-nothing';
  dr.appendChild(bonus);

  const btn = $('#btn-train');
  if(!dailyDone()){
    btn.textContent = P.todayRounds === 0 ? 'Begin training' : `Round ${P.todayRounds+1} of ${DAILY_LIMIT}`;
    btn.disabled = false;
    btn.onclick = () => startDaily();
  } else if(scrollAvailable()){
    btn.textContent = 'Open today\'s scroll';
    btn.disabled = false;
    btn.onclick = () => openScroll();
  } else if(bonusAvailable()){
    btn.textContent = 'Double-or-nothing round';
    btn.disabled = false;
    btn.onclick = () => startBonus();
  } else {
    btn.textContent = 'Training complete — return tomorrow';
    btn.disabled = true;
  }

  $('#shield-row').textContent = P.shields > 0 ? `🛡 ${P.shields} streak shield${P.shields>1?'s':''} held` : '';

  /* modes lock */
  const unlocked = dailyDone();
  document.querySelectorAll('.mode-btn').forEach(b => {
    b.classList.toggle('locked', !unlocked);
    b.onclick = unlocked ? () => startMode(b.dataset.mode) : null;
  });
  $('#modes-lock-note').textContent = unlocked
    ? 'Dojo floor open. Free practice does not spend daily rounds.'
    : 'Finish today\'s training to open the dojo floor.';

  renderGrowth();
}

/* growth mirror */
function renderGrowth(){
  const cv = $('#sparkline'), ctx = cv.getContext('2d');
  ctx.clearRect(0,0,cv.width,cv.height);
  const days = [];
  for(let i=13;i>=0;i--){
    const h = P.history.find(x => x.d === daysAgoStr(i));
    days.push(h ? h.avgMs : null);
  }
  const vals = days.filter(v => v !== null);
  if(vals.length >= 2){
    const min = Math.min(...vals), max = Math.max(...vals);
    const range = Math.max(max-min, 1);
    ctx.strokeStyle = '#c9a25a'; ctx.lineWidth = 2; ctx.beginPath();
    let started = false;
    days.forEach((v,i) => {
      if(v === null) return;
      const x = (i/(days.length-1)) * (cv.width-10) + 5;
      const y = cv.height - 8 - ((max - v)/range) * (cv.height-16);
      /* note: lower ms = better = higher on chart → invert */
      const yy = 8 + ((v - min)/range) * (cv.height-16);
      if(!started){ ctx.moveTo(x, yy); started = true; } else ctx.lineTo(x, yy);
    });
    ctx.stroke();
    ctx.fillStyle = 'rgba(237,230,214,0.4)';
    ctx.font = '9px JetBrains Mono';
    ctx.fillText('answer speed · last 14 days · lower is faster', 6, 10);
  } else {
    ctx.fillStyle = 'rgba(237,230,214,0.3)';
    ctx.font = '11px JetBrains Mono';
    ctx.fillText('your speed line appears after 2 days of training', 6, 34);
  }

  const thisWeek = weekStats(0), lastWeek = weekStats(7);
  let line = 'Train today to begin your record.';
  if(thisWeek && lastWeek && lastWeek.avgMs > 0){
    const speedGain = Math.round((1 - thisWeek.avgMs/lastWeek.avgMs) * 100);
    const accGain = Math.round((thisWeek.acc - lastWeek.acc) * 100);
    const parts = [];
    if(speedGain > 0) parts.push(`<span style="color:#5c7d68">${speedGain}% faster</span> than last week`);
    else if(speedGain < 0) parts.push(`${Math.abs(speedGain)}% slower than last week — tired days count double`);
    if(accGain > 0) parts.push(`accuracy up ${accGain}%`);
    line = parts.length ? 'You are ' + parts.join(', ') + '.' : 'Holding steady — consistency IS the progress.';
  } else if(thisWeek){
    line = `This week: ${Math.round(thisWeek.acc*100)}% accuracy, ${(thisWeek.avgMs/1000).toFixed(1)}s avg answer.`;
  }
  $('#growth-line').innerHTML = line;
  $('#growth-tip').textContent = seededPick(GROWTH_TIPS, todayStr());
}

/* ============ PLAY FLOW ============ */
let game = null;   /* current game state */
let flashTimer = null;

const stage = () => $('#stage-content');
const stageBox = () => $('#stage');

function enterPlay(statusText){
  $('#play-status').textContent = statusText;
  $('#answer-zone').classList.remove('show');
  $('#numpad').classList.remove('show');
  show('play');
}
function quitPlay(){
  clearTimeout(flashTimer);
  game = null;
  renderHome();
  show('home');
}
$('#btn-quit').onclick = quitPlay;

/* ---- daily training ---- */
function startDaily(){
  const belt = beltFor(P.xp);
  const cfg = diffFor(belt.id);
  game = { type:'daily', cfg, round: genSequence(cfg) };
  enterPlay(`Daily · round ${P.todayRounds+1}/${DAILY_LIMIT} · ${belt.name}`);
  runFlash(game.round, cfg, () => askAnswer(ans => resolveDaily(ans)));
}

function resolveDaily(ans){
  const r = game.round;
  const correct = ans === r.answer;
  const elapsed = Date.now() - game.answerStart;
  recordDailySolve(correct, elapsed);
  completeDailyRound();

  const wasBest = correct && P.bestMs === elapsed;
  if(correct){ (wasBest ? sfx.best : sfx.good)(); confettiBurst(stageBox()); }
  else sfx.bad();

  const beltBefore = beltFor(P.xp - (correct?1:0)).id;
  const beltNow = beltFor(P.xp).id;
  const beltUp = beltNow > beltBefore;
  if(beltUp) setTimeout(() => sfx.belt(), 400);

  let html = `<div class="stage-msg">`;
  if(correct){
    html += `<span class="big jade">${r.answer} — correct</span>`;
    html += `<div class="result-time">${(elapsed/1000).toFixed(2)}s${wasBest ? ' · <span style="color:#c9a25a">new personal best</span>' : ''}</div>`;
    html += `<div style="margin-top:10px;font-style:italic;font-size:13px;">${pick(SENSEI_WIN)}</div>`;
  } else {
    html += `<span class="big seal">${r.answer}</span>`;
    html += `<div class="result-time">you answered ${isNaN(ans)?'—':ans}</div>`;
    html += `<div style="margin-top:10px;font-style:italic;font-size:13px;">${pick(SENSEI_LOSS)}</div>`;
  }
  if(beltUp){
    const nb = beltFor(P.xp);
    html += `<div style="margin-top:14px;padding:10px;border:1px solid ${nb.color};border-radius:6px;">
      <span class="gold" style="font-family:'Shippori Mincho',serif;font-weight:700;">🥋 ${nb.name} earned</span></div>`;
  }
  html += `</div>`;
  stage().innerHTML = html;

  const btn = document.createElement('button');
  btn.className = 'primary-btn';
  btn.style.marginTop = '18px';
  if(!dailyDone()){ btn.textContent = 'Next round'; btn.onclick = startDaily; }
  else if(scrollAvailable()){ btn.textContent = 'Training done — open scroll'; btn.onclick = openScroll; }
  else { btn.textContent = 'Return to dojo'; btn.onclick = quitPlay; }
  stage().appendChild(btn);
}

/* ---- scroll (variable reward) ---- */
function openScroll(){
  P.scrollDate = todayStr();
  const roll = Math.random();
  let inner;
  if(roll < 0.18){
    P.shields = Math.min(3, P.shields + 1);
    inner = `<b>A STREAK SHIELD APPEARS</b>The dojo grants one shield. If a day is ever missed, it will be spent silently and the streak will live. (${P.shields} held)`;
    sfx.belt();
  } else {
    const s = pick(SCROLLS);
    inner = `<b>${s.t}</b>${s.body}`;
    sfx.good();
  }
  saveDB();
  enterPlay('Daily scroll');
  stage().innerHTML = `<div class="scroll-card">${inner}</div>`;
  const btn = document.createElement('button');
  btn.className = 'primary-btn'; btn.style.marginTop = '20px';
  btn.textContent = bonusAvailable() ? 'Double-or-nothing?' : 'Return to dojo';
  btn.onclick = bonusAvailable() ? startBonus : quitPlay;
  stage().appendChild(btn);
}

/* ---- double or nothing ---- */
function startBonus(){
  P.bonusTakenDate = todayStr(); saveDB();
  const belt = beltFor(P.xp);
  const cfg = diffFor(Math.min(belt.id + 1, BELTS.length-1));  /* one belt harder */
  game = { type:'bonus', cfg, round: genSequence(cfg) };
  enterPlay('⚡ Double-or-nothing · one belt harder');
  runFlash(game.round, cfg, () => askAnswer(ans => {
    const correct = ans === game.round.answer;
    const elapsed = Date.now() - game.answerStart;
    if(correct){
      P.xp += 2; P.totalSolved += 2;  /* double reward */
      sfx.best(); confettiBurst(stageBox());
      stage().innerHTML = `<div class="stage-msg"><span class="big gold">${game.round.answer} — DOUBLED</span>
        <div class="result-time">${(elapsed/1000).toFixed(2)}s · +2 solves banked</div>
        <div style="margin-top:10px;font-style:italic;font-size:13px;">The bold student eats twice.</div></div>`;
    } else {
      P.xp = Math.max(0, P.xp - 1);   /* lose one — never below zero */
      sfx.bad();
      stage().innerHTML = `<div class="stage-msg"><span class="big seal">${game.round.answer}</span>
        <div class="result-time">the gamble takes one solve back</div>
        <div style="margin-top:10px;font-style:italic;font-size:13px;">Risk teaches what safety cannot. Tomorrow, revenge.</div></div>`;
    }
    saveDB();
    const btn = document.createElement('button');
    btn.className = 'primary-btn'; btn.style.marginTop = '18px';
    btn.textContent = 'Return to dojo'; btn.onclick = quitPlay;
    stage().appendChild(btn);
  }));
}

/* ---- free modes ---- */
function startMode(mode){
  const belt = beltFor(P.xp);
  if(mode === 'survival') startSurvival(belt);
  else if(mode === 'timeattack') startTimeAttack(belt);
  else if(mode === 'operations') startOperations(belt);
  else if(mode === 'zen') startZen(belt);
}

function startSurvival(belt){
  game = { type:'survival', level:0, lives:1 };
  nextSurvivalRound(belt);
}
function nextSurvivalRound(belt){
  const base = diffFor(belt.id);
  const speedup = Math.max(0.45, 1 - game.level*0.06);
  const cfg = { count: base.count + Math.floor(game.level/3), max: base.max, flashMs: Math.round(base.flashMs*speedup), beadOnly: base.beadOnly };
  game.cfg = cfg; game.round = genSequence(cfg);
  enterPlay(`Survival · wave ${game.level+1}`);
  runFlash(game.round, cfg, () => askAnswer(ans => {
    if(ans === game.round.answer){
      sfx.good(); game.level += 1;
      nextSurvivalRound(belt);
    } else {
      sfx.bad();
      stage().innerHTML = `<div class="stage-msg"><span class="big seal">Fallen at wave ${game.level+1}</span>
        <div class="result-time">answer was ${game.round.answer}</div>
        <div style="margin-top:10px;font-style:italic;font-size:13px;">${pick(SENSEI_LOSS)}</div></div>`;
      const btn = document.createElement('button');
      btn.className = 'primary-btn'; btn.style.marginTop = '18px';
      btn.textContent = 'Again'; btn.onclick = () => startSurvival(belt);
      stage().appendChild(btn);
      const btn2 = document.createElement('button');
      btn2.className = 'ghost-btn'; btn2.style.margin = '12px auto 0'; btn2.style.display='block';
      btn2.textContent = 'Return to dojo'; btn2.onclick = quitPlay;
      stage().appendChild(btn2);
    }
  }));
}

function startTimeAttack(belt){
  game = { type:'timeattack', solves:0, endAt: Date.now() + 60000 };
  nextTAround(belt);
}
function nextTAround(belt){
  if(Date.now() >= game.endAt){
    sfx.best();
    stage().innerHTML = `<div class="stage-msg"><span class="big gold">${game.solves} solves</span>
      <div class="result-time">in 60 seconds</div>
      <div style="margin-top:10px;font-style:italic;font-size:13px;">Speed is calm, repeated quickly.</div></div>`;
    const btn = document.createElement('button');
    btn.className = 'primary-btn'; btn.style.marginTop = '18px';
    btn.textContent = 'Return to dojo'; btn.onclick = quitPlay;
    stage().appendChild(btn);
    return;
  }
  const cfg = diffFor(belt.id);
  game.cfg = cfg; game.round = genSequence(cfg);
  const left = Math.ceil((game.endAt - Date.now())/1000);
  enterPlay(`Time Attack · ${left}s left · ${game.solves} solved`);
  runFlash(game.round, cfg, () => askAnswer(ans => {
    if(ans === game.round.answer){ sfx.good(); game.solves += 1; }
    else sfx.bad();
    nextTAround(belt);
  }));
}

function startOperations(belt){
  const cfg = diffFor(belt.id);
  game = { type:'operations', cfg, round: genOpsSequence(cfg) };
  enterPlay('Operations · minus & times');
  runFlash(game.round, cfg, () => askAnswer(ans => {
    const ok = ans === game.round.answer;
    (ok ? sfx.good : sfx.bad)();
    if(ok) confettiBurst(stageBox());
    stage().innerHTML = `<div class="stage-msg"><span class="big ${ok?'jade':'seal'}">${game.round.answer}</span>
      <div class="result-time">${ok?'correct':'you answered '+(isNaN(ans)?'—':ans)}</div></div>`;
    const btn = document.createElement('button');
    btn.className = 'primary-btn'; btn.style.marginTop = '18px';
    btn.textContent = 'Another'; btn.onclick = () => startOperations(belt);
    stage().appendChild(btn);
    const btn2 = document.createElement('button');
    btn2.className = 'ghost-btn'; btn2.style.margin='12px auto 0'; btn2.style.display='block';
    btn2.textContent = 'Return to dojo'; btn2.onclick = quitPlay;
    stage().appendChild(btn2);
  }), true);
}

function startZen(belt){
  const cfg = { ...diffFor(belt.id), flashMs: null };  /* no timer: manual advance */
  game = { type:'zen', cfg, round: genSequence(cfg), idx: 0 };
  enterPlay('Zen · no clock, only beads');
  showZenNumber();
}
function showZenNumber(){
  const r = game.round, i = game.idx;
  stage().innerHTML = sorobanHTML(r.seq[i]) +
    `<div class="flash-num fading">${r.seq[i]}</div>
     <div class="result-time">${i+1} of ${r.seq.length} — breathe, then continue</div>`;
  const btn = document.createElement('button');
  btn.className = 'primary-btn'; btn.style.marginTop = '16px';
  btn.textContent = i+1 < r.seq.length ? 'Next bead' : 'Answer';
  btn.onclick = () => {
    if(game.idx+1 < r.seq.length){ game.idx += 1; sfx.tick(); showZenNumber(); }
    else askAnswer(ans => {
      const ok = ans === r.answer;
      (ok ? sfx.good : sfx.bad)();
      stage().innerHTML = `<div class="stage-msg"><span class="big ${ok?'jade':'seal'}">${r.answer}</span>
        <div style="margin-top:10px;font-style:italic;font-size:13px;">${ok ? 'Still water reflects clearly.' : 'Muddy water settles if you let it. Again.'}</div></div>`;
      const b = document.createElement('button');
      b.className = 'primary-btn'; b.style.marginTop = '18px';
      b.textContent = 'Another'; b.onclick = () => startZen(beltFor(P.xp));
      stage().appendChild(b);
      const b2 = document.createElement('button');
      b2.className = 'ghost-btn'; b2.style.margin='12px auto 0'; b2.style.display='block';
      b2.textContent = 'Return to dojo'; b2.onclick = quitPlay;
      stage().appendChild(b2);
    });
  };
  stage().appendChild(btn);
}

/* ---- shared: flash sequence then collect answer ---- */
function runFlash(round, cfg, done, withOps){
  let i = 0;
  const step = () => {
    sfx.tick();
    const beadOnly = Math.random() < (cfg.beadOnly || 0);
    const opHtml = withOps && round.ops[i] !== '+' ? `<span class="flash-op">${round.ops[i]}</span>` : (withOps && i>0 ? `<span class="flash-op">+</span>` : '');
    stage().innerHTML = sorobanHTML(round.seq[i]) +
      (beadOnly ? `<div class="flash-num fading">·</div>` : `<div class="flash-num">${opHtml}${round.seq[i]}</div>`);
    i += 1;
    if(i < round.seq.length){
      flashTimer = setTimeout(step, cfg.flashMs);
    } else {
      flashTimer = setTimeout(() => {
        stage().innerHTML = `<div class="stage-msg" style="color:var(--paper-dim)">total?</div>`;
        done();
      }, cfg.flashMs);
    }
  };
  step();
}

function askAnswer(cb){
  game.answerStart = Date.now();
  const zone = $('#answer-zone'), input = $('#answer-input');
  zone.classList.add('show');
  input.value = '';
  if(window.innerWidth < 600){
    renderNumpad(input);
    $('#numpad').classList.add('show');
    input.readOnly = true;
  } else {
    input.readOnly = false;
    input.focus();
  }
  const submit = () => {
    if(input.value === '') return;
    zone.classList.remove('show');
    $('#numpad').classList.remove('show');
    const val = parseInt(input.value, 10);
    $('#btn-submit').onclick = null;
    input.onkeydown = null;
    cb(val);
  };
  $('#btn-submit').onclick = submit;
  input.onkeydown = e => { if(e.key === 'Enter') submit(); };
}

function renderNumpad(input){
  const np = $('#numpad');
  if(np.dataset.built) return;
  np.dataset.built = '1';
  const keys = ['1','2','3','4','5','6','7','8','9','⌫','0','−'];
  keys.forEach(k => {
    const b = document.createElement('button');
    b.className = 'np-key'; b.textContent = k;
    b.onclick = () => {
      const inp = $('#answer-input');
      if(k === '⌫') inp.value = inp.value.slice(0,-1);
      else if(k === '−'){ if(inp.value === '') inp.value = '-'; }
      else inp.value += k;
    };
    np.appendChild(b);
  });
}

/* ============ header buttons ============ */
$('#btn-sound').onclick = () => { P.sound = !P.sound; saveDB(); $('#btn-sound').classList.toggle('off', !P.sound); };
$('#btn-switch').onclick = () => { renderProfiles(); show('profiles'); };
$('#btn-export').onclick = exportSave;
$('#btn-import').onclick = () => $('#import-file').click();
$('#import-file').onchange = e => {
  const f = e.target.files[0];
  if(f) importSave(f, ok => {
    alert(ok ? 'Save imported.' : 'That file could not be read.');
    if(ok){ renderProfiles(); show('profiles'); }
  });
  e.target.value = '';
};

/* ============ boot ============ */
loadDB();
renderProfiles();
show('profiles');
