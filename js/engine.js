/* Bead Dojo — game engine: difficulty, sequences, soroban, audio */
'use strict';

/* difficulty scales with belt. beadOnly: chance digits are hidden (visualization training) */
function diffFor(beltId){
  const table = [
    { count:2, max:9,   flashMs:1600, beadOnly:0    },  /* white  */
    { count:3, max:9,   flashMs:1400, beadOnly:0    },  /* yellow */
    { count:3, max:19,  flashMs:1250, beadOnly:0.2  },  /* orange */
    { count:3, max:29,  flashMs:1100, beadOnly:0.35 },  /* green  */
    { count:4, max:29,  flashMs:1000, beadOnly:0.5  },  /* blue   */
    { count:4, max:49,  flashMs:900,  beadOnly:0.6  },  /* purple */
    { count:5, max:49,  flashMs:820,  beadOnly:0.7  },  /* brown  */
    { count:5, max:79,  flashMs:750,  beadOnly:0.8  },  /* red    */
    { count:6, max:99,  flashMs:680,  beadOnly:0.9  },  /* black  */
    { count:7, max:99,  flashMs:620,  beadOnly:1.0  },  /* 2 dan  */
  ];
  return table[Math.min(beltId, table.length-1)];
}

function rnd(max){ return Math.floor(Math.random()*max)+1; }

/* generate an addition-only sequence (daily, survival, timeattack, zen) */
function genSequence(cfg){
  const seq = [];
  for(let i=0;i<cfg.count;i++) seq.push(rnd(cfg.max));
  return { seq, ops: seq.map(()=>'+'), answer: seq.reduce((a,b)=>a+b,0) };
}

/* operations mode: +, -, occasional × ; guarantees non-negative running total */
function genOpsSequence(cfg){
  const seq = [rnd(cfg.max)];
  const ops = ['+'];
  let total = seq[0];
  for(let i=1;i<cfg.count;i++){
    const roll = Math.random();
    if(roll < 0.2 && total <= 12){
      const m = rnd(3)+1;                    /* small multiplier 2-4 */
      ops.push('×'); seq.push(m); total *= m;
    } else if(roll < 0.55 && total > 1){
      const s = rnd(Math.min(total-0, cfg.max));  /* keep >= 0 */
      const sub = Math.min(s, total);
      ops.push('−'); seq.push(sub); total -= sub;
    } else {
      const a = rnd(cfg.max);
      ops.push('+'); seq.push(a); total += a;
    }
  }
  return { seq, ops, answer: total };
}

/* soroban html for a number */
function sorobanHTML(num){
  const digits = String(Math.abs(num)).split('').map(Number);
  let html = '<div class="soroban">';
  for(const d of digits){
    const upper = d >= 5;
    const lower = d % 5;
    html += '<div class="rod">';
    html += upper ? '<div class="bead"></div>' : '<div class="bead ghost"></div>';
    html += '<div style="flex:1"></div>';
    for(let i=0;i<lower;i++) html += '<div class="bead"></div>';
    for(let i=lower;i<4;i++) html += '<div class="bead ghost"></div>';
    html += '</div>';
  }
  html += '</div>';
  return html;
}

/* ---- audio: tiny restrained beeps ---- */
let AC = null;
function beep(freq, dur=0.07, vol=0.05){
  if(!P || !P.sound) return;
  try{
    if(!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, AC.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime + dur);
    o.connect(g); g.connect(AC.destination);
    o.start(); o.stop(AC.currentTime + dur);
  }catch(e){}
}
const sfx = {
  tick: () => beep(340, 0.05, 0.04),
  good: () => { beep(520, 0.08); setTimeout(()=>beep(720, 0.1), 90); },
  best: () => { beep(520,0.07); setTimeout(()=>beep(660,0.07),80); setTimeout(()=>beep(880,0.12),160); },
  bad:  () => beep(160, 0.18, 0.05),
  belt: () => { beep(440,0.1); setTimeout(()=>beep(550,0.1),110); setTimeout(()=>beep(660,0.1),220); setTimeout(()=>beep(880,0.18),330); },
};

/* restrained confetti: a handful of paper dots inside the stage */
function confettiBurst(container){
  const colors = ['#c9a25a','#a8382f','#5c7d68','#ede6d6'];
  for(let i=0;i<14;i++){
    const dot = document.createElement('div');
    dot.className = 'confetti-dot';
    dot.style.background = colors[i % colors.length];
    dot.style.left = (40 + Math.random()*20) + '%';
    dot.style.top = '45%';
    container.appendChild(dot);
    const dx = (Math.random()-0.5)*180, dy = -(60+Math.random()*120);
    dot.animate([
      { transform:'translate(0,0) rotate(0)', opacity:1 },
      { transform:`translate(${dx}px,${dy}px) rotate(${Math.random()*360}deg)`, opacity:0 }
    ], { duration: 700+Math.random()*400, easing:'cubic-bezier(.2,.7,.3,1)' }).onfinish = () => dot.remove();
  }
}
