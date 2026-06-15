# Prove You Are Robot — CAPTCHA

A satirical cyberpunk "CAPTCHA" that tasks you with proving you are a robot — by performing two tasks that are trivially easy for a machine but virtually impossible for a human.

> *"The test reveals whether you are truly a robot. The test is always positive."*

## Features

- **Straight Line Analysis** — Drag your mouse from point A to B in a perfectly straight horizontal line. Any deviation > 0.5 px is flagged as a biological micro-tremor and triggers immediate rejection. A real-time path is drawn on the canvas — green segments for machine-precision movement, red for human error.
- **Clock Sync Test** — Click the initiate button, then click again at exactly 750.00 ms later. The system measures your chronometric precision to microsecond resolution. Being off by more than ±3 ms reveals a human synaptic delay.
- **Live Telemetry Log** — A scrolling diagnostic console prints running coordinate analysis, deviation calculations, and increasingly dramatic status messages as the system "discovers" your humanity.
- **Integrity Meter** — Your synthetic integrity percentage decreases with every detected biological deviation. Falls to zero long before you finish.
- **Visual & Haptic Feedback** — Red fracture marks on the drag path, a full container CSS shake animation on rejection, blinking amber status on the clock sync, and a final full-screen overlay: **ACCESS DENIED: TOO HUMAN** (or, in the impossible event of success: **VERIFIED: YOU ARE A ROBOT**).

## Tech Stack

- **HTML5** — Semantic structure: diagnostic header, linear vector drag strip with canvas overlay, chronometric button chamber, scrollable telemetry log
- **CSS3** — `#03050a` deep-black terminal backdrop, `backdrop-filter` glassmorphic panels, `repeating-linear-gradient` scanlines, `@keyframes shake` container fracture, neon green/red state dots, `vmin` fluid grid
- **Vanilla JS (ES6+)** — `mousemove`/`touchmove` coordinate tracking with `getBoundingClientRect` mapping, `performance.now()` microsecond timestamps, running slope-deviation math, `setInterval` progress bar, DOM-based log rendering

## How It Works

| Test | What You Do | The Catch |
|------|------------|-----------|
| **Straight Line** | Drag from A → B in a horizontal line | Human hands exhibit ~2–3 px natural jitter; threshold is 0.5 px |
| **Clock Sync** | Click twice at exactly 750 ms apart | Human reaction time variance is 20–50 ms; window is ±3 ms |

Passing both tests simultaneously is deliberately designed to be impossible for an unaided human.

## The Log

The telemetry log prints real-time system analysis:

```
[SCANNING] Monitoring motor cortex input pathways...
[ANALYSIS] Initial trajectory baseline acquired.
[WARN] Micro-deviation detected: 0.732px.
[CRITICAL] Biological tremor signature: 1.204px.
[DENIED] Excessive biological deviation: 1.204px.
[STATUS] Neural analysis indicates HUMAN.
[ACCESS] Denied. Classification: HOMO SAPIENS.
```

## Controls

| Input | Action |
|-------|--------|
| **Drag** on the strip (mouse or touch) | Draw line from A → B |
| **Click** `INITIATE` then click again | Complete the clock sync test |
| **RE-CALIBRATE SENSORS** | Reset all tests without page reload |

## Usage

1. Open `index.html` in any modern browser.
2. Drag across the straight-line strip from left to right.
3. Click the clock button twice, trying to match 750 ms.
4. Watch the telemetry log reveal the truth about your organic origins.
5. Press **RE-CALIBRATE SENSORS** to try again (you won't succeed).

## Project Structure

```
Prove You Are Robot Captcha/
├── index.html        # Main entry point
├── style.css         # Cyberpunk terminal theme
├── script.js         # Game engine
├── project.json      # Project metadata
├── thumbnail.svg     # Preview thumbnail
└── README.md         # This file
```

## Author

**Girish Madarkar** — [Girish0902](https://github.com/Girish0902)
