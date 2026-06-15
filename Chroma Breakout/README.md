# Chroma Breakout

An interactive HTML5 Canvas brick-breaking arcade game implementing precise color verification physics loops.

---

## Mathematical Collision Mechanics and Ray Vector Math

### Bounding-Box Collision Detection

The game uses axis-aligned bounding box (AABB) collision detection for all game entities. For ball-to-brick collisions, the system computes the closest point on the brick rectangle to the ball center:

$$P_{\text{closest}} = (\max(\text{brick}_x, \min(\text{ball}_x, \text{brick}_x + \text{brick}_w)), \max(\text{brick}_y, \min(\text{ball}_y, \text{brick}_y + \text{brick}_h)))$$

A collision is registered if the squared distance from the ball center to $P_{\text{closest}}$ is less than the ball's radius squared:

$$\text{Collision} \iff (P_{x} - \text{ball}_x)^2 + (P_{y} - \text{ball}_y)^2 < \text{ball}_r^2$$

### Velocity Reflection

Upon brick collision, the reflection axis is determined by comparing the normalized overlap:

$$\text{overlap}_x = \frac{\text{ball}_x - (\text{brick}_x + \text{brick}_w / 2)}{\text{brick}_w / 2}$$

$$\text{overlap}_y = \frac{\text{ball}_y - (\text{brick}_y + \text{brick}_h / 2)}{\text{brick}_h / 2}$$

If $|\text{overlap}_x| > |\text{overlap}_y|$, the ball reflects off the vertical axis ($dx = -dx$); otherwise, it reflects off the horizontal axis ($dy = -dy$).

### Paddle Deflection Angle

Paddle hits use a position-based angle calculation to give the player control over the ball's trajectory:

$$\text{hit} = \frac{\text{ball}_x - (\text{paddle}_x + \text{paddle}_w / 2)}{\text{paddle}_w / 2}$$

$$\text{angle} = \text{hit} \times \frac{\pi}{3}$$

$$dx_{\text{new}} = \sin(\text{angle}) \times \text{speed}, \quad dy_{\text{new}} = -\cos(\text{angle}) \times \text{speed}$$

This maps the center of the paddle to a straight-up trajectory ($\pm 0^\circ$) and the edges to $\pm 60^\circ$ angles.

---

## State Machine Color-Matching Logic

### Ball Chromatic State Cycler

The ball cycles through three color states on a fixed 3-second timer:

```
Timer starts at 0ms → GREEN (#10b981)
At 3000ms → BLUE (#3b82f6)
At 6000ms → RED (#ef4444)
At 9000ms → GREEN (cycle repeats)
```

A shrinking arc rendered around the ball visualizes the countdown — a full circle indicates an imminent color change.

### Collision Verification Filter

$$\text{BrickDestroyed} = \text{Collision} \land (\text{Ball}_{\text{color}} \equiv \text{Brick}_{\text{color}})$$

| Ball Color | Destroys Red Bricks | Destroys Green Bricks | Destroys Blue Bricks |
|------------|---------------------|----------------------|---------------------|
| RED | ✅ | ❌ | ❌ |
| GREEN | ❌ | ✅ | ❌ |
| BLUE | ❌ | ❌ | ✅ |

**On match:** Brick is destroyed, particle burst spawns (12 particles at matching color), score increases by $10 \times \text{difficulty}$.

**On mismatch:** Brick remains intact, ball bounces away, crimson border flash appears on the canvas frame for 200ms, diagnostic banner shows "BRICK MISMATCH REFLECTION".

### Difficulty Scaling

| Level | Speed Multiplier | Score Multiplier |
|-------|-----------------|------------------|
| $1\times$ | $1.0 \times$ base | $1.0 \times$ |
| $2\times$ | $1.3 \times$ base | $2.0 \times$ |
| $3\times$ | $1.6 \times$ base | $3.0 \times$ |

---

## Architectural Directory Layout

```
chroma-breakout/
├── index.html        # Application structure with telemetry and canvas
├── style.css         # Dark theme, canvas glow controlled by CSS variable
├── script.js         # Game engine, physics, color cycler, particle system
├── README.md         # This documentation file
├── project.json      # Project metadata configuration
└── thumbnail.svg     # Application thumbnail icon
```

### Architecture

- **index.html** — Dual-column layout: Telemetry Control Panel (left) with score, high score, ball state, lives, timer, and difficulty toggles; Canvas Arena (right) with DPR-scaled HTML5 Canvas viewport
- **style.css** — CSS Grid dashboard, `--current-ball-glow` CSS variable driving canvas stage box-shadow dynamically, ball state color classes (red/green/blue), difficulty toggle buttons
- **script.js** — State management (ball, paddle, bricks, particles, game phase), `requestAnimationFrame` game loop, AABB collision detection, color-match verification, 3-second color cycler with visual timer arc, particle burst system for brick destruction, paddle control via mouse/touch/keyboard

---

## Operational Instructions

### How to Play

1. Click **LAUNCH SIMULATION INSTANCE** to start a new game
2. Move the mouse (or touch / arrow keys) to position the paddle
3. Click or press Space/Enter to launch the ball
4. The ball cycles through RED → GREEN → BLUE every 3 seconds
5. Destroy bricks by hitting them when the ball matches their color
6. Mismatched colors bounce off without destroying the brick
7. If the ball falls below the paddle, you lose a life
8. Clear all bricks to win

### Controls

| Input | Action |
|-------|--------|
| Mouse move | Move paddle |
| Touch move | Move paddle |
| ← → Arrow keys | Move paddle |
| Click / Space / Enter | Launch ball / Pause |

### Scoring

- Match hit: $10 \times \text{difficulty}$ points
- Difficulty $1\times$: normal speed and scoring
- Difficulty $2\times$: 1.3× speed, 2× points
- Difficulty $3\times$: 1.6× speed, 3× points

---

## Local Deployment Verification

### Prerequisites

- A modern web browser (Chrome, Firefox, Edge, or Safari)
- No build tools, frameworks, or external dependencies required

### Steps

1. Clone or download the repository:
   ```
   git clone <repository-url>
   cd chroma-breakout
   ```

2. Open `index.html` in your web browser:
   ```
   # On Windows
   start index.html

   # On macOS
   open index.html

   # On Linux
   xdg-open index.html
   ```

3. Verify the application loads with:
   - Dual-column dark-theme dashboard
   - 10×6 grid of colored bricks (red, green, blue rows)
   - White paddle at the bottom
   - Green ball at start

### Testing

1. Launch the game — verify ball launches on click
2. Destroy a matching-color brick — verify particle burst and score increment
3. Hit a mismatched brick — verify bounce with red flash
4. Wait 3 seconds — verify ball color changes
5. Let the ball fall — verify life decrement
6. Clear all bricks — verify victory screen

---

## Technical Details

- **Canvas**: 640×480 HTML5 Canvas with device-pixel-ratio scaling
- **Game Loop**: `requestAnimationFrame` at ~60fps with delta-time limiting
- **Collision**: AABB closest-point algorithm with axis reflection
- **Color Cycle**: 3-second timer rotating through Red → Green → Blue
- **Brick Grid**: 10 columns × 6 rows = 60 bricks
- **Particles**: 12-particle burst on brick destruction with gravity and fade
- **Theme**: Vercel, Figma, and Linear.app inspired dark dashboard
- **Typography**: `ui-monospace, Consolas, monospace` monospaced stack

### Color Reference

| Token | Hex | Usage |
|-------|-----|-------|
| App background | `#070a13` | Main canvas and body |
| Panel surface | `#111827` | Sidebar panels |
| Red brick / ball | `#ef4444` | Color state 0 |
| Green brick / ball | `#10b981` | Color state 1 (default) |
| Blue brick / ball | `#3b82f6` | Color state 2 |
