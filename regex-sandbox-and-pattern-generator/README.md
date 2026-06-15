# 🧩 Regex Sandbox & Pattern Generator

A premium client-side testing application designed to help student developers build, test, and understand Regular Expressions. Users can test custom patterns, apply modifier flags, highlight matched strings, and parse their regex token expressions visually.

---

## ✨ Features

### 1. ⚙️ Regex Composer & Editor
- Dynamic regex input fields with start/end slash delimiters `/pattern/flags`.
- Custom flag checkbox toggles (`g`, `i`, `m`, `s`, `u`, `y`) that automatically synchronize with the input string.
- Safe runtime compilation handling that captures regex syntax errors and displays informative badge warnings instead of crashing.

### 2. 📝 Dual-Pane Testing Board
- Side-by-side split layout:
  - **Left column**: Text input pane containing custom strings to match against the regex.
  - **Right column**: Real-time highlight renderer showing matching positions using color-coded text segments.
- Automatically calculates total matches count.

### 3. 🔍 Interactive Visual Explainer (Tokenizer)
- Visual breakdown cards showing parsed regex sub-components:
  - **Anchors** (`^`, `$`, `\b`)
  - **Quantifiers** (`+`, `*`, `?`, `{n,m}`)
  - **Groups** (`(...)`, `(?:...)`, lookaheads)
  - **Character Classes** (`\d`, `\w`, `\s`, `[...]`)
  - **Literals**
- Explains the functionality of each token in simple, educational terms.

### 4. 📚 Recipe Library
- Curated index containing 8 popular regex patterns: Email Validation, Domain URLs, Phone Numbers, Strong Passwords, Hex Colors, IPv4 Addresses, Date formats (YYYY-MM-DD), and HTML Tags.
- Filterable search bar to query and retrieve recipes instantly.

---

## 📂 Project Structure

```text
regex-sandbox-and-pattern-generator/
│
├── index.html   # Main Dashboard HTML layout
├── style.css    # Layout, typography, & token card styles
├── script.js    # Regex engine, tokenizer parser, & library records
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
http://localhost:8000/regex-sandbox-and-pattern-generator/index.html
```

---

## 🛠️ Technology Stack
- **Dashboard Structure**: HTML5 Semantic markup
- **Layout & Styles**: CSS3 grid and flexbox using the core global CSS custom variables (`global-theme.css`)
- **Engine Logic**: ES6+ Javascript, regex compiler wrappers, matching index trackers, and custom string parsers.
