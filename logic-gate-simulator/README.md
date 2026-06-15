# LogicGate Studio: Interactive Logic Gate Circuit Simulator

An educational digital circuit sandbox designed for computer science students to build, test, and analyze Boolean logic circuits directly inside the browser.

## 🚀 Features
- **Visual Drag-and-Drop Toolbox**: Easily spawn Input Switches, Output Bulbs, and logic gates (AND, OR, NOT, NAND, NOR, XOR).
- **Wire Connector Ports**: Click the output port of any node and click the input port of another to establish a wiring link instantly. Click a wire to remove it.
- **Live Signal Propagation**: Toggling an Input Switch updates boolean states recursively. Glowing visual wires display active high signals (yellow) vs low signals (grey) dynamically.
- **Mathematical Truth Table Generator**: Automatically detects all canvas inputs and outputs, computing $2^n$ state outputs to display the corresponding logic truth table in real time.
- **Local Layout Storage**: Saves your designs automatically.

## 🛠️ Usage
1. Use the **Toolbox** sidebar to add components to the grid.
2. Position cards by dragging their header panels.
3. Wire components: click the output port (right side dot) of a source card, then click the target input port (left side dot) of a destination card.
4. Toggle switches and view outputs on the bulb cards.
