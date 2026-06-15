# Core8 Emulator: Interactive Assembly & CPU Visualizer

An educational tool designed to help computer science students understand low-level CPU processing, register behaviors, and RAM address allocations.

## 🚀 Features
- **Interactive Assembly Code Editor**: Supports instruction syntax checking and line mapping updates.
- **CPU Registers Panel**: Real-time display of registers (AX, BX, CX, DX) showing both hex and binary layouts.
- **RAM Grid Memory Map**: A 256-cell layout representing RAM indexes, tracking and visually highlighting memory read (yellow glow) and write (green glow) actions.
- **Bi-Directional Debugger**: "Step Forward" to execute single instruction steps, and "Step Back" to restore preceding CPU environments.
- **Branching and Looping Loops**: Custom label scanner supports loop targets, comparisons (`CMP`), and conditional jumps (`JE`, `JNE`, `JMP`).

## 🛠️ Instructions
1. Load a demo program from the **Program dropdown selector** or write your own custom code.
2. Click **Compile** to parse.
3. Click **Step** to trace operations, or **Run** to execute instructions continuously.
