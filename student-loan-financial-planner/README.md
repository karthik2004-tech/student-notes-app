# 📈 Student Loan & Financial Independence Planner

A premium, interactive client-side financial literacy dashboard designed to help student developers calculate their student loan amortization schedule and visualize their 10-year net worth trajectory.

---

## ✨ Features

### 1. 💵 Loan & Career Parameters Inputs
- Features interactive sliders to set:
  - **Loan Principal**: Outstanding student debt values ($5,000 to $150,000).
  - **Interest Rate**: Annual percentage interest (1% to 15%).
  - **Loan Term**: Duration period years (5 to 30 years).
  - **Starting Salary**: Expected annual salary after graduation.
  - **Monthly Savings**: Amount saved and invested monthly.

### 2. 📊 Amortization Visualizer Chart
- Renders a custom **SVG area-line path** mapping outstanding debt balance over the term duration.
- Dynamically updates as parameters change, recalculating coordinates and labels instantly.

### 3. 📈 10-Year Net Worth Trajectory Chart
- Projects asset growth vs. outstanding debt reduction over a 10-year window.
- Plots net worth crossing over from negative (student debt) to positive (financial assets).
- Draws a prominent **Zero Net Worth** threshold axis line.

### 4. 💡 "What-If" Extra Payments Scenario
- Toggle options to simulate paying an extra **+$100**, **+$200**, or **+$500** monthly.
- Live recalculations showing exactly how much **Interest is Saved** and the exact **Payoff Time Saved** in years.

### 5. 🌓 Unified Theme Synchronization
- Completely integrated with the repository's core `global-theme.css` and `global-theme.js` to support real-time dark/light mode layouts.

---

## 📂 Project Structure

```text
student-loan-financial-planner/
│
├── index.html   # Parameters input forms & dashboard KPI widgets layout
├── style.css    # Responsive grids, slider inputs, & SVG chart styling
├── script.js    # Financial calculators, amortization, & SVG plot algorithms
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
http://localhost:8000/student-loan-financial-planner/index.html
```

---

## 🛠️ Technology Stack
- **Dashboard Structure**: HTML5 Semantic markup
- **Layout & Styles**: CSS3 grid and flexbox using the core global CSS custom variables (`global-theme.css`)
- **Engine Logic**: ES6+ Javascript, amortization mathematical formulas, net worth projectors, SVG vector graph generators, and input trackers.
