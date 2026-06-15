# Electric Circuit Simulator

An interactive, high-fidelity DC electronics laboratory and schematic design simulator that runs entirely client-side in the browser.

---

## Mathematical Nodal Physics Overview

The simulator models linear Direct Current (DC) circuits using fundamental electrical laws:

### Ohm's Law
$$V = I \cdot R$$

The voltage across a resistor is proportional to the current flowing through it and its resistance.

### Kirchhoff's Current Law (KCL)
$$\sum I_{\text{in}} = \sum I_{\text{out}}$$

At any node in the circuit, the sum of currents entering equals the sum of currents leaving. This charge conservation principle forms the basis of the nodal analysis solver.

### Kirchhoff's Voltage Law (KVL)
$$\sum V = 0$$

The sum of all voltage drops around any closed loop equals zero, ensuring energy conservation in the circuit.

---

## Network Solver Specifications

### Modified Nodal Analysis (MNA)

The solver implements Modified Nodal Analysis, a robust method for solving general linear circuits:

1. **Node Identification** — All unique connection points are identified and numbered. One node is selected as the ground reference ($V = 0$).

2. **Matrix Construction** — The system is formulated as $Ax = b$ where:
   - $A$ combines the conductance matrix $G$ and voltage source incidence matrix $B$
   - $x$ contains unknown node voltages and voltage source currents
   - $b$ contains known current sources and voltage values

3. **Gaussian Elimination** — The linear system is solved using Gaussian elimination with partial pivoting for numerical stability.

4. **Post-Processing** — Node voltages, branch currents, and power dissipations are computed from the solution vector.

### Short Circuit Detection

The system detects short circuits by monitoring:
- Matrix singularity during Gaussian elimination
- Branch currents exceeding safe thresholds ($> 500\text{A}$)
- Zero-resistance paths across voltage sources

When a short circuit is detected, the solver halts computation, flags the warning state, and renders the faulty path with a flashing crimson animation.

---

## Interactive Control Operations

### Component Toolbox

| Component | Symbol | Parameters |
|-----------|--------|------------|
| DC Voltage Source | Battery icon | Voltage: $0\text{V} - 50\text{V}$ |
| Linear Resistor | Zigzag line | Resistance: $1\,\Omega - 1000\,\Omega$ |
| SPST Toggle Switch | Hinged contact | State: OPEN / CLOSED |
| Ground Node | Ground symbol | Reference node ($0\text{V}$) |

### Usage Workflow

1. Click a component button in the Inventory Deck to enter placement mode
2. Click on the schematic canvas grid to place the component
3. Click a placed component to select it and view properties
4. Adjust parameters using the sliders in the Inspector Panel
5. Toggle switches by clicking the toggle control
6. Press `Delete` or use the "REMOVE COMPONENT" button to delete
7. Press `Escape` to exit placement mode

### Real-Time Feedback

- **Status Header** — Displays simulation state (STEADY STATE or SHORT CIRCUIT)
- **Live Telemetry** — Shows Node Voltage, Branch Current, and Power Dissipation for selected components
- **Electron Animation** — Glowing green particles flow along active wires at speed proportional to current
- **Node/Branch Count** — Real-time circuit topology statistics

---

## File Directory Layout

```
electric-circuit-simulator/
├── index.html        # Main application structure (three-column layout)
├── style.css         # Dark engineering theme and layout styling
├── script.js         # Circuit solver, renderer, and interaction engine
├── README.md         # This documentation file
├── project.json      # Project metadata configuration
└── thumbnail.svg     # Application thumbnail icon
```

### Architecture

- **index.html** — Defines the DOM structure: Inventory Deck (left), Schematic Canvas (center), Inspector Panel (right)
- **style.css** — CSS Grid layout, dot-grid canvas background, custom range sliders, dark engineering theme
- **script.js** — State management, Modified Nodal Analysis solver, Canvas rendering with `requestAnimationFrame`, electron particle animation, interaction handling

---

## Local Deployment Verification

### Prerequisites

- A modern web browser (Chrome, Firefox, Edge, or Safari)
- No build tools, frameworks, or external dependencies required

### Steps

1. Clone or download the repository:
   ```
   git clone <repository-url>
   cd electric-circuit-simulator
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
   - Three-column dashboard layout
   - Dark engineering theme ($070a13 background)
   - Component toolbox with Battery, Resistor, Switch, Ground buttons
   - 10×7 node grid on the schematic canvas
   - Empty inspector panel with "Select a component to inspect" message

### Testing

1. Click "DC Voltage Source" → click canvas to place a battery
2. Click "Linear Resistor" → click adjacent grid edge to place a resistor
3. Click "SIMULATE NETWORK ANALYSIS" to run the solver
4. Select the resistor to view voltage, current, and power in telemetry
5. Adjust values using the sliders and observe real-time updates

---

## Technical Details

- **Grid System**: 9×6 cell matrix (10×7 node points)
- **Canvas Rendering**: HTML5 Canvas with device-pixel-ratio scaling
- **Animation**: `requestAnimationFrame` with particle-based electron flow
- **Solver**: Modified Nodal Analysis with Gaussian elimination
- **Theme**: Inspired by Vercel, Linear.app, and professional CAD tools
- **Typography**: `ui-monospace, Consolas, monospace` monospaced stack

### Color Reference

| Token | Hex | Usage |
|-------|-----|-------|
| App background | `#070a13` | Main canvas and body |
| Panel surface | `#111827` | Sidebar and inspector |
| Border | `#1f2937` | Panel dividers and outlines |
| Text primary | `#f8fafc` | Headers and labels |
| Text secondary | `#94a3b8` | Sub-headers and metadata |
| Active accent | `#10b981` | Electron flow and live paths |
| Interactive | `#3b82f6` | Hover states and selection |
| Critical | `#ef4444` | Short circuit warning |
| Switch closed | `#f59e0b` | Closed switch state |
