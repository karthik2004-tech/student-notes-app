# Interactive SVG String Pull

A neon-acoustic multimedia toy. Drag vertical strings in an SVG viewport to deform them into quadratic bezier curves; release to trigger a spring-physics oscillation and a polyphonic Web Audio synth tone.

## Features

- **Dynamic SVG Path Deformation** — Six vertical `<path>` strings are evenly spaced across the viewport. Mousedown/touchstart within 32 px locks the nearest string; mousemove warps the path into a `Q` (quadratic bezier) curve with the control point locked to the cursor. On release, the string springs free.
- **Hooke's Law Spring Physics** — `F = −kx − cv` runs every frame via `requestAnimationFrame`. Spring constant `k = 0.032`, damping `c = 0.009`. Displacement decays to zero over ~3–4 seconds, and the path redraws each frame with the oscillating control point.
- **Web Audio API Polyphonic Synth** — Each string maps to a pentatonic-scale frequency: C4 (261.63 Hz), D4 (293.66 Hz), E4 (329.63 Hz), G4 (392.00 Hz), A4 (440.00 Hz), C5 (523.25 Hz). On pluck, a triangle-wave `OscillatorNode` with a `GainNode` envelope (instant attack, 3.5 s exponential decay) is created. Multiple strings can ring simultaneously (polyphonic). Audio context is resumed on the user's click via the splash overlay.
- **Neon Colour Gradient** — Resting strings are electric cyan `#00f0ff`. As displacement increases, the stroke colour shifts toward hot pink `#ff2a5f` and the stroke width grows from 1.5 px to 4 px. An SVG `feGaussianBlur` glow filter intensifies with tension.
- **Real-Time Telemetry** — Active string count, peak tension percentage, damping coefficient, and last-played note update live in a frosted glass header bar.
- **Responsive SVG** — The `viewBox` matches the viewport container on every resize; string positions and hit zones re-calibrate automatically.

## Tech Stack

- **HTML5** — Splash overlay with audio-activation button, telemetry dashboard, full-size SVG viewport with `<defs>` glow filter
- **CSS3** — `#05060b` midnight canvas, `rgba(255,255,255,0.01)` glassmorphic header, radial-gradient viewport background, `vmin` fluid sizing, `backdrop-filter` blur
- **SVG** — Dynamic `<path d="M… Q…">` manipulation, `createSVGPoint` / `getScreenCTM` for coordinate mapping, `feGaussianBlur` glow
- **Vanilla JS (ES6+)** — `requestAnimationFrame` physics pipeline, `OscillatorNode` + `GainNode` audio graph, `performance.now()` delta-time, pointer-velocity tracking for hit zones

## How to Play

1. Open `index.html` in any modern browser.
2. Click **ENABLE AUDIO** on the splash card (required for Web Audio context).
3. **Click/touch and drag** horizontally on any vertical string to pull it.
4. **Release** to hear the string's note — the string oscillates visually while the note decays.
5. Pluck multiple strings to create chords (polyphonic).
6. Watch the telemetry bar for real-time physics data.

## String Map

| String | Note | Frequency |
|--------|------|-----------|
| 1 | C4 | 261.63 Hz |
| 2 | D4 | 293.66 Hz |
| 3 | E4 | 329.63 Hz |
| 4 | G4 | 392.00 Hz |
| 5 | A4 | 440.00 Hz |
| 6 | C5 | 523.25 Hz |

## Project Structure

```
Interactive SVG String Pull/
├── index.html        # Main entry point
├── style.css         # Dark studio theme
├── script.js         # Physics + audio engine
├── project.json      # Project metadata
├── thumbnail.svg     # Preview thumbnail
└── README.md         # This file
```

## Author

**Girish Madarkar** — [Girish0902](https://github.com/Girish0902)
