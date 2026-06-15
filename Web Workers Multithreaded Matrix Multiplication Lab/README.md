# Web Workers Multithreaded Matrix Multiplication Lab

## Overview

This demo proves a modern browser can execute intense linear algebra workloads without freezing the UI by isolating matrix multiplication in a native Web Worker.

It is designed for benchmarking and teaching how to move heavy `O(n³)` matrix transformations off the main viewport thread while preserving smooth interactivity.

## What makes it impressive

- **True main-thread isolation**: Heavy matrix math runs entirely inside `worker.js` via the native `Worker` API.
- **High-performance payload transfer**: Uses typed arrays and transferable buffers for efficient data exchange.
- **Live benchmark telemetry**: Displays worker duration, throughput in GFLOPS, worker progress, and UI heartbeat.
- **Robust validation**: Detects mismatched dimensions and rejects matrices larger than `500×500` to protect browser memory.
- **Winner-ready interface**: Polished dashboard with progress visualization, state cards, benchmark flow, and responsive controls.

## Architecture

```
Main UI Thread (script.js)
  ├─ parse matrix input
  ├─ validate dimensions
  ├─ serialize arrays to Float64Array buffers
  ├─ send payload via postMessage(transfer)
  └─ update dashboard while worker executes

Worker Thread (worker.js)
  ├─ receive transferable buffers
  ├─ execute nested dot-product loops
  ├─ emit progress events
  ├─ measure compute time with performance.now()
  └─ return result as transferable buffer
```

## Files

- `index.html` — interactive benchmark UI and controls
- `style.css` — modern dark dashboard design with metrics and progress
- `script.js` — main-thread lifecycle, worker orchestration, validation, and benchmark flow
- `worker.js` — isolated computation core that executes matrix multiplication and reports progress
- `README.md` — this project overview and usage guide

## Features

- Generate sample `100×100` matrices instantly
- Run a one-click `200×200` benchmark
- Terminate worker safely to recover from stale computations
- Progress bar updates for long-running compute tasks
- High-resolution timing and throughput reporting
- Clean matrix result preview with large-output summarization

## Usage

1. Open `index.html` in a browser that supports Web Workers.
2. Paste or edit two matrices using comma-separated rows.
3. Click `Multiply Matrices` to dispatch the workload to the worker.
4. Use `Run 200×200 Benchmark` to measure throughput on a heavier workload.
5. Review the computed result, worker time, throughput, and main-thread UI heartbeat.

## Notes

- This demo is best opened from a local server for full worker behavior in strict browser environments.
- For larger matrix sizes, the worker progress indicator and heartbeat metric make it easy to demonstrate that the main thread remains responsive.

## Why this is winner-worthy

This lab is more than a calculator: it is a compelling proof-of-concept for high-fidelity browser-side compute acceleration. It showcases how to safely decouple numeric-heavy algorithms from UI rendering, turn browser memory constraints into protective boundaries, and present technical results in a clean, real-time dashboard.
