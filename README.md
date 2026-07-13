# 算 Bead Dojo — Anzan Training

A daily flash-anzan (mental abacus) trainer built as a tiny dojo. Numbers flash as soroban beads; you sum them in your head. Designed around habit science: a strict daily limit, streaks with shields, a belt journey, variable-reward scrolls, and a growth mirror that shows real skill improvement.

**No frameworks. No build step. No backend.** Vanilla HTML/CSS/JS, installable as a PWA, works offline.

## Deploy to GitHub Pages

1. Create a new repo (e.g. `bead-dojo`) and push these files to the `main` branch.
2. Repo → **Settings → Pages** → Source: `Deploy from a branch` → Branch: `main`, folder `/ (root)` → Save.
3. Your dojo is live at `https://<username>.github.io/bead-dojo/`.
4. On a phone, open it in the browser → "Add to Home Screen" to install as an app.

## How the game works

- **Two local profiles** — pick your fighter on launch; each has an independent save.
- **Daily Training** — exactly **3 flash rounds per day**. These are the only rounds that count for belts and streaks. Scarcity is the point.
- **The dojo floor** — Survival, Time Attack, Operations, and Zen modes unlock each day *only after* Daily Training is done. Free play, no limits, no XP.
- **Belt journey** — White → Black → 2-Dan, driven purely by daily solves. As belts rise, digits fade and only beads flash: visualization becomes mandatory, which is the actual anzan skill.
- **Daily scroll** — after training, open a scroll: usually sensei wisdom or a technique tip, sometimes a **streak shield** that silently absorbs one missed day.
- **Double-or-nothing** — one optional bonus round per day, one belt harder. Win: +2 solves. Lose: −1.
- **Growth mirror** — 14-day speed sparkline, week-over-week speed/accuracy comparison, and a rotating improvement tip.

## Saves & backup

Progress lives in the browser's `localStorage` (per device, per browser). Use **Export save** on the home screen to download a `bead-dojo-save.json` backup, and **Import save** to restore it on any device.

## File map

```
index.html      app shell (3 screens: profiles, dojo home, play)
css/style.css   dojo aesthetic — ink, paper, seal red, gold
js/state.js     profiles, belts, streak/shield logic, persistence, export/import
js/sensei.js    sensei voice lines, scrolls, growth tips
js/engine.js    difficulty table, sequence generation, soroban renderer, audio, confetti
js/ui.js        screens, daily flow, bonus round, all four modes, growth mirror
manifest.json   PWA manifest
sw.js           offline cache
icon.svg        app icon
```
