# 🎨 Canvas Grapher

A lightweight, local-first canvas graphing terminal for data-structure analysis and student metric visualization. This project uses the HTML5 Canvas API directly, avoiding external charting libraries and DOM-heavy SVG to keep the interface fast, dependency-free, and self-contained.

## 🚀 What it does

- Renders a custom chart using raw Canvas pixel drawing.
- Uses `requestAnimationFrame` for smooth frame updates.
- Supports high-DPI screens by dynamically scaling the canvas.
- Maps relational metric arrays onto Cartesian pixel coordinates.
- Implements custom collision detection for interactive hover labels.
- Keeps the visualization self-contained with only HTML, CSS, and JavaScript.

## 📈 Technical architecture blueprint

1. **Asynchronous frame render loop**
   - Uses the native `requestAnimationFrame` lifecycle.
   - Redraws the chart efficiently on each frame during data or resize changes.

2. **Cartesian vector space transformation**
   - Translates arrays of values into 2D pixel coordinates.
   - Handles canvas scaling and coordinate transforms for responsive rendering.

3. **Manual geometric collision detection**
   - Calculates hit regions and distances from mouse coordinates.
   - Shows hover details without relying on DOM element overlays.

4. **High-DPI canvas support**
   - Recalculates canvas pixel density on resize.
   - Prevents stretching and preserves crisp rendering on Retina displays.

## 🧩 Implementation architecture

This project is organized into responsibility-focused components:
- `CanvasManager` handles device-pixel scaling, canvas sizing, and drawing context setup.
- `CoordinateMapper` transforms raw data values into chart coordinates with padding and range normalization.
- `ChartRenderer` draws the grid, axes, line series, and point decorations.
- `InteractionController` handles mouse and touch events, hover detection, and tooltip placement.
- `CanvasGrapher` orchestrates rendering, resize events, and the dirty-frame loop.

## 📂 System file architecture

```text
canvas grapher/
├── index.html          # App shell and module entry point
├── style.css           # Dark-theme UI and tooltip styling
├── script.js           # Entrypoint wiring browser imports
└── src/
    ├── canvas-manager.js
    ├── coordinate-mapper.js
    ├── chart-renderer.js
    ├── interaction-controller.js
    ├── canvas-grapher.js
    ├── config.js
    └── data.js
```

## 💡 Why this project exists

Students and contributors need a small, self-contained visualization utility for academic performance patterns. This project demonstrates pixel-level graphics math, canvas coordinate transforms, and responsive rendering without pulling in a heavy external library.

## 🛠️ Tech stack

- HTML5
- CSS3
- Vanilla JavaScript
- HTML5 Canvas API

## 📌 Notes

- No external graphing libraries are used.
- The visualization is designed to be fast and easy to extend.
- Ideal for learning how low-level canvas rendering works.
