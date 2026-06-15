# 🔍 Developer Portfolio SEO & Accessibility Audit Tool

A premium, client-side web application designed to help student developers analyze their index.html portfolios for SEO metadata compliance and WCAG accessibility standards before staging and deployment.

---

## ✨ Features

### 1. 📊 Interactive Scorecard Dashboard
- Features three responsive **SVG radial progress gauges** indicating:
  - **Overall Score** (Aggregate performance)
  - **SEO Score** (Index optimization performance)
  - **A11y Score** (Accessibility compliance status)
- Includes dynamic pills tracking exact totals of **Errors**, **Warnings**, and **Passed Rules**.

### 2. ⚡ Powerful Local Audit Engine
- Runs entirely in the client-side browser using standard `DOMParser`.
- **SEO Rules Checked**:
  - Presence of `<title>` tag and validates length (40–60 characters).
  - Presence of `<meta name="viewport">` for responsive indexation.
  - Presence of `<meta name="description">` tag and validates length (120–160 characters).
  - Validates Facebook Open Graph meta attributes (`og:title`, `og:image`).
  - Checks for canonical link references `<link rel="canonical">`.
  - Audits heading structures to confirm a single `<h1>` page heading exists.
- **Accessibility Checks (WCAG 2.1 AA Compliance)**:
  - Validates `alt` attributes on all image `<img>` elements.
  - Inspects interactive `<a>` and `<button>` components for descriptive text content or `aria-label`/`aria-labelledby` annotations.
  - Reviews form controls (`input`, `textarea`, `select`) to guarantee presence of labels, ids, or aria indicators.
  - Identifies skipped heading outline progressions (e.g. going from H2 to H4).
  - Computes CSS relative luminance and color contrast ratios on elements with inline styles, flagging violations of the WCAG **4.5:1 ratio**.

### 3. 🌓 Unified Theme Synchronization
- Completely integrated with the repository's core `global-theme.css` and `global-theme.js` to support real-time light/dark mode transitions.

---

## 📂 Project Structure

```text
developer-portfolio-seo-accessibility-audit-tool/
│
├── index.html   # Main Dashboard HTML layout
├── style.css    # Responsive components & radial gauge styling
├── script.js    # DOM Parser, audit logic, & contrast calculator
└── README.md    # Documentation
```

---

## 🚀 How to Run Locally

### 1. Setup Python HTTP Server
You can launch this tool locally using Python's built-in HTTP server:
```bash
python -m http.server 8000
```

### 2. Open in Browser
Navigate to the project folder path:
```text
http://localhost:8000/developer-portfolio-seo-accessibility-audit-tool/index.html
```

---

## 🛠️ Technology Stack
- **Structure**: HTML5 Semantic markup
- **Styling**: Vanilla CSS3 using custom CSS variables (variables matching core `global-theme.css` properties)
- **Engine Logic**: Vanilla JavaScript (ES6+), standard Canvas APIs for color normalization, relative luminance calculations, and native `DOMParser`.
