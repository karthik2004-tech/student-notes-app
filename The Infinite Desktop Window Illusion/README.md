# The Infinite Desktop Window Illusion

A recursive desktop-in-desktop illusion built with native HTML5, CSS3, and JavaScript (ES6+). Double-click any folder icon to spawn a floating window that contains an identical, scaled replica of the entire desktop — icons, taskbar, clock, and recursive folder-launching behaviour included.

## Features

- **Procedural Recursive Replication** — Double-clicking **System Drive**, **Recursive Network**, or **Trash Console** executes a dedicated creation handler that constructs an absolute-positioned floating window. Inside the window's body, the script injects a functionally identical copy of the full desktop — complete with the same three shortcut icons, a taskbar, and recursive launch behaviour.
- **Granular Drag with Axis Tracking** — `mousedown` / `touchstart` on any window's title bar captures vector translation offsets. `mousemove` / `touchmove` slides the window within the parent container's bounds (clamped). Touch handlers are fully implemented for mobile.
- **Dynamic zIndex Stacking** — Clicking any window brings it to the forefront by incrementing its `style.zIndex` above all other elements. The `focused` class adds a brighter cyan border glow.
- **Multi-State Toolbar Controls** — Every window has three `dot` buttons: **Close** (destroys the DOM subtree and purges the window from the tracking array), **Maximize** (toggles full-bleed `100%` dimensions within the parent), and **Minimize** (toggles `display: none`).
- **Real-Time Telemetry** — A fixed overlay in the top-right corner tracks: current nesting depth, total window count across all levels, and the peak depth achieved during the session.
- **Proportional Scaling** — Each nested window is 75% × 68% of its parent's content area, with cascading positional offsets. Font sizes, icon dimensions, and taskbar padding use `clamp()` and shrink proportionally via nested CSS.

## Tech Stack

- **HTML5** — Root workspace with icon grid, floating-window container, bottom taskbar, telemetry overlay
- **CSS3** — `#05060b` midnight backdrop, glassmorphic `rgba(10,13,26,0.96)` windows, neon cyan `#00f0ff` focused borders, amber/cyan/red dot controls, `clamp()` + `vmin` fluid scaling, `position: absolute` z-index stacking
- **Vanilla JS (ES6+)** — Recursive template replication (`openFolder` → `buildIcons` → `openFolder`...), `getBoundingClientRect()` drag coordinate math, `setInterval` clock tick, z-index increment management

## Window Controls

| Button | Action |
|--------|--------|
| 🔴 Close | Remove window and DOM subtree |
| 🟡 Minimize | Toggle `display: none` |
| 🟢 Maximize | Toggle 100% × 100% fit to parent |

*Note: these are styled CSS dots, not emoji — they appear as coloured circles (red/yellow/green).*

## How It Works

1. Double-click any icon on the root desktop → a floating window appears.
2. Inside that window, the same three icons are present.
3. Double-click an icon inside the window → another, smaller window appears inside the first one.
4. Continue recursively up to 8 levels of nesting.
5. Drag windows by their title bars. Click to bring them to the front.
6. Use the telemetry overlay to track nesting depth and window count.

## Project Structure

```
The Infinite Desktop Window Illusion/
├── index.html        # Main entry point
├── style.css         # Cyberpunk OS theme
├── script.js         # Recursive replication engine
├── project.json      # Project metadata
├── thumbnail.svg     # Preview thumbnail
└── README.md         # This file
```

## Author

**Girish Madarkar** — [Girish0902](https://github.com/Girish0902)
