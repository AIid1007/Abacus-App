/* Bead Dojo — the sensei speaks */
'use strict';

const SENSEI_GREETINGS = [
  "The beads do not care how you feel today. They only ask that you sit.",
  "A black belt is a white belt who never stopped showing up.",
  "You did not come here to be fast. You came here to return.",
  "Small practice, done daily, defeats grand practice done once.",
  "The abacus in your hands is temporary. The abacus in your mind is forever.",
  "Do not chase the answer. Chase the calm from which the answer comes.",
  "Yesterday's training is gone. Today's has not begun. Begin.",
  "Even one round moves the mountain by one stone.",
  "The student asks: how long until mastery? The sensei answers: how long until you begin?",
  "Your streak is not a number. It is a promise you keep to yourself.",
];

const SENSEI_WIN = [
  "Good. The beads moved before your doubt did.",
  "Clean. Do not celebrate long — return tomorrow.",
  "The mind sharpens. I saw it.",
  "Correct. Speed will come; you brought presence. That is rarer.",
  "Yes. Again tomorrow. That is the whole secret.",
];

const SENSEI_LOSS = [
  "A miss. Good — now we know where the edge of your skill lives.",
  "Wrong answer, right effort. Only one of those matters at white belt.",
  "The bead slipped. Breathe. It will not slip the same way twice.",
  "Every master has missed this exact sum. You are in fine company.",
];

const SCROLLS = [
  { t:"SCROLL OF THE EMPTY HAND", body:"When a number flashes, do not say it in words. See it as beads. Words are slow; images are instant. This is the entire art of anzan." },
  { t:"SCROLL OF THE FIVE", body:"Every digit is only a question of five: is the heaven bead down, or up? Learn to see 7 as 5-and-2 without thinking, and large sums become small ones." },
  { t:"SCROLL OF BREATH", body:"Exhale before the round begins. A held breath is held attention — you will need it free." },
  { t:"SCROLL OF THE MISSED DAY", body:"If you miss a day, your only task tomorrow is to not miss twice. One miss is weather. Two is climate." },
  { t:"SCROLL OF SMALLNESS", body:"On the worst days, do the worst version: one round, eyes half open. The streak does not judge quality. It counts presence." },
  { t:"SCROLL OF THE GHOST", body:"You race no one but yesterday's you. She is fast — but she is always exactly one day behind." },
  { t:"SCROLL OF HANDS", body:"When practicing, twitch your fingers as if moving real beads. The body remembers what the mind rehearses." },
  { t:"SCROLL OF QUIET", body:"If the sums feel loud in your head, you are still translating. Mastery is when the answer appears with no narration at all." },
];

const GROWTH_TIPS = [
  "Tip: read numbers left-to-right as bead positions, never as spoken words.",
  "Tip: when a sum crosses 10, picture the carry as one bead jumping to the next rod.",
  "Tip: slow is smooth, smooth is fast. Accuracy first — the speed follows on its own.",
  "Tip: practice at the same anchor time daily; the brain pre-loads skills it expects to use.",
  "Tip: if you got one wrong, replay it mentally once. One review doubles the retention.",
  "Tip: eyes soft, not squinting. Visualization works best with relaxed focus.",
  "Tip: as belts rise, digits fade — trust the beads. That discomfort is the muscle growing.",
];

function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

function seededPick(arr, seedStr){
  let h = 0;
  for(let i=0;i<seedStr.length;i++){ h = ((h<<5)-h) + seedStr.charCodeAt(i); h|=0; }
  return arr[Math.abs(h) % arr.length];
}
