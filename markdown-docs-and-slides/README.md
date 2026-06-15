# 📝 Markdown Documentation Hub & Presentation Slide Compiler

A premium client-side productivity tool designed to help student developers write structured markdown documentation and compile it instantly into customizable presentation slide decks.

---

## ✨ Features

### 1. ⚙️ Dual-Pane Markdown Editor
- Write standard markdown code inside a clean syntax-focused text editor.
- View live rendered HTML previews side-by-side.
- Supported Markdown syntax includes:
  - Header Outlines (`#`, `##`, `###`)
  - Typography weights (`**bold**`, `*italics*`)
  - Inline and fenced code blocks
  - Bulleted (`-`) and ordered (`1.`) lists
  - Markdown Blockquotes (`> quote`)

### 2. ✂️ Automatic Slide Splitter
- Splits slides automatically at each `---` separator line.
- Automatically calculates and updates the total slides indicator badge in real-time.

### 3. 🖥️ Fullscreen Presentation Mode
- Launches fullscreen slide presentations with keyboard event bindings:
  - **Next Slide**: `Right Arrow`, `Spacebar`
  - **Previous Slide**: `Left Arrow`, `Backspace`
  - **Exit**: `Escape`
- Click controls: Click the left third of the screen to go backward, and the right two-thirds to go forward.

### 4. 📊 Presenter HUD Bar & Metrics
- Tracks elapsed presentation time using an active timer.
- Toggles play/pause for the elapsed timer.
- Displays visual slide progress percentages via a loading indicator bar.

### 5. 🎨 Custom Theme Presets
- Configures slide backgrounds, headers, and colors dynamically:
  - **Blue Purple Light**: Default light template using clean blue, purple, and black accent lines.
  - **Dark Nebula**: Sleek dark layout using purple and cyan elements.
  - **Cyberpunk Neon**: Neon green and hot pink contrast borders.
  - **Classic Academic**: Traditional layout with serif fonts.
  - **Frosted Glass**: Glassmorphism cards with blurs.

---

## 📂 Project Structure

```text
markdown-docs-and-slides/
│
├── index.html   # Main Dashboard HTML layout
├── style.css    # Typography, editor panes, & slide decks CSS
├── script.js    # Parser logic, splitting algorithms, & HUD timers
└── README.md    # Documentation
```

---

## 🚀 How to Run Locally

### 1. Start Server
Run a local server in the repository root directory:
```bash
python -m http.server 8000
```

### 2. Open URL
Navigate to the project directory in your browser:
```text
http://localhost:8000/markdown-docs-and-slides/index.html
```

---

## 🛠️ Technology Stack
- **Dashboard Structure**: HTML5 Semantic markup
- **Layout & Styles**: CSS3 grid and flexbox using the core global CSS custom variables (`global-theme.css`)
- **Engine Logic**: ES6+ Javascript, regex markdown parsers, splitting engines, and navigation keyboard listeners.
