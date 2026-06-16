# 🎨 Canvas Grapher

A professional local-first visualization utility built with vanilla HTML5 Canvas. It renders student performance metrics using raw pixel drawing, coordinate transforms, and custom hover interaction, without external chart libraries.

## 🚀 Project Overview

Canvas Grapher is designed as a lightweight graphing terminal for academic metrics, study progression, and relational data analysis. The application focuses on:

- native canvas rendering for smooth performance
- responsive high-DPI scaling
- modular code structure for readability and extension
- minimal external dependency footprint

## ✨ Features

- Custom line chart rendered using Canvas 2D API
- Responsive pixel-perfect layout for Retina/high-DPI screens
- Interactive hover states with tooltip display
- Dynamic coordinate mapping of raw data values
- Modular architecture for clean separation of concerns
- Touch and mouse support for modern devices

## 🧠 Architecture

The project is broken into single-responsibility modules:

- `CanvasManager` — handles canvas sizing, device pixel ratio, and drawing context setup
- `CoordinateMapper` — converts raw metric values into chart coordinates with axis padding and normalization
- `ChartRenderer` — encapsulates all drawing behavior for grid lines, axes, line series, and markers
- `InteractionController` — manages pointer and touch events, hover detection, tooltip placement, and state updates
- `CanvasGrapher` — orchestrates rendering, resize handling, frame invalidation, and overall app lifecycle

## 📂 File structure

```text
canvas grapher/
├── index.html          # App shell and module entry point
├── style.css           # Theme styling, layout, and tooltip UI
├── script.js           # Browser entrypoint loading the module graph
└── src/
    ├── canvas-manager.js
    ├── coordinate-mapper.js
    ├── chart-renderer.js
    ├── interaction-controller.js
    ├── canvas-grapher.js
    ├── config.js
    └── data.js
```

## 🚦 How to run

1. Open `canvas grapher/index.html` in a browser.
2. If browser modules are blocked over `file://`, serve the folder using a simple local server:

```bash
cd "c:/Users/Admin/simple_calculator/canvas grapher"
python -m http.server 8080
```

3. Open `http://localhost:8080` in your browser.

## 🔧 Customize data

Update `src/data.js` with your own dataset. Each entry should follow the shape:

```js
{
  label: 'Week 1',
  value: 72,
  studyHours: 7,
}
```

## 🧩 Extension ideas

- add a second series for study hours or attendance
- support multiple chart types (bar, area, scatter)
- add configurable axis labels and units
- add animation easing for new data updates
- add export-to-image or snapshot mode

## 💡 Why this is professional

This project demonstrates a readable modular architecture, explicit responsibility boundaries, and a high-quality implementation strategy for a local-first canvas visualization component.

## 🛠️ Tech stack

- HTML5
- CSS3
- Vanilla JavaScript
- HTML5 Canvas API

## 📌 Notes

- No third-party graphing libraries are used.
- The application is fully self-contained and browser-native.
- Focus is on maintainability, extensibility, and performance.
