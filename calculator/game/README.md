# Archery Game

A precision archery simulation built with native HTML5, CSS3, and JavaScript (ES6+). Compete against moving targets, compensate for wind drift, and track your score across Easy, Medium, and Hard difficulties.

## Features

- **Parabolic Trajectory Physics** — Click and drag to aim; the arrow follows a real-time gravity-affected arc. Power and angle are calculated from your drag distance and direction, with a trajectory prediction dotted line.
- **Concentric Multi-Zone Target** — A three-ring target (Gold Bullseye +100, Red Inner +50, Blue Outer +20) slides vertically. Precise Euclidean distance checks determine your scoring ring.
- **Three Difficulty Tiers** — Easy (slow target, light wind), Medium (moderate speed/wind), Hard (fast target, strong wind). Changes take effect between rounds.
- **Dynamic Wind System** — Each shot is assigned a random crosswind that accelerates the arrow mid-flight. A compass-style wind indicator with arrow and numeric value helps you compensate.
- **Visual Hit Feedback** — Particle bursts, floating score text (+100, +50, +20), permanent hit markers on the target face, and ring-coloured info messages.
- **Full Telemetry** — Real-time score, arrow inventory (15 per round), shot accuracy percentage, and localStorage-persisted high score.
- **Cyberpunk Dark Terminal Theme** — `#05070c` canvas with neon cyan accents, glassmorphic score panels, glowing target aura, and gridded background.

## Tech Stack

- HTML5 — Semantic structure with telemetry bar and result overlay
- CSS3 — `backdrop-filter` glassmorphism, `aspect-ratio` responsive canvas, `clamp()` fluid scaling, `@keyframes` fade-up animation
- Vanilla JS (ES6+) — `requestAnimationFrame` game loop, delta-time physics, `Math.atan2` aiming, radial-gradient glow, particle system, `localStorage`

## Rules

1. You have **15 arrows** per round.
2. **Click and drag** on the canvas to aim. A dotted prediction line shows the trajectory.
3. **Release** to fire the arrow. The further from the bow you drag, the more power.
4. The **target oscillates vertically** — time your shot.
5. A **wind indicator** at the top-right shows current crosswind. Compensate by aiming off-centre.
6. Scoring: **Gold** (centre) = 100 pts, **Red** (middle) = 50 pts, **Blue** (outer) = 20 pts.
7. Misses and arrows that fly off-screen count as shots but earn no points.
8. After all 15 arrows, a modal shows your total score, accuracy, ring breakdown, and high score.

## Controls

| Input | Action |
|-------|--------|
| **Click + Drag** | Aim (distance = power, direction = angle) |
| **Release** | Fire arrow |
| **Touch + Drag** | Mobile aim (same mechanic) |
| **EASY / MED / HARD** | Difficulty toggle (between rounds) |
| **NEW ROUND** | Reset the game after round ends |

## Usage

1. Open `index.html` in any modern browser.
2. Select a difficulty (Easy recommended for first play).
3. Drag from anywhere on the canvas toward where you want the arrow to go.
4. Release to fire. Watch the arrow arc through the air.
5. Aim into the wind to keep the arrow on-target.

## Project Structure

```
Archery Game/
├── index.html        # Main entry point
├── style.css         # Cyberpunk dark theme
├── script.js         # Game engine
├── project.json      # Project metadata
├── thumbnail.svg     # Preview thumbnail
└── README.md         # This file
```

## Author

**Girish Madarkar** — [Girish0902](https://github.com/Girish0902)
