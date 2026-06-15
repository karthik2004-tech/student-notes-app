# 💾 Interactive SQL Database Query Playground

A premium client-side educational sandbox that allows student developers to write, test, and analyze SQL queries directly in the browser. Powered by SQLite compiled to WebAssembly (`sql.js`), it provides pre-populated mock databases, schema visualizers, and Entity-Relationship Diagrams (ERD).

---

## ✨ Features

### 1. ⚙️ Client-Side WebAssembly SQLite Engine
- Utilizes `sql.js` (SQLite compiled to WebAssembly) to run full SQL query queries entirely in the client-side browser with no server backend needed.
- Safely handles syntax compiler errors and displays clean console alert warnings.

### 2. 🗄️ Pre-Populated Mock Schemas
- Offers **3 database templates** selectable via a dropdown:
  - **E-Commerce Store**: Orders, Products, Customers, Order Details tables.
  - **University Library**: Students, Books, Borrowings tables.
  - **Corporate HR**: Employees, Departments, Salaries tables.
- Built-in reset buttons to easily restore the default tables and rows datasets.

### 3. 📂 Schema & ERD Visualizer Sidebar
- **Dynamic Database Schema Tree**: Inspects database schemas in real-time, displaying all tables and columns, highlighting primary keys (`🔑`), and dynamically updating if tables are created or altered.
- **Visual Entity Relationship Diagram (ERD)**: Renders database entity relationship cards highlighting primary keys (`PK`) and foreign keys (`FK`) to show how tables connect.

### 4. 📊 Live Results Grid
- Automatically generates formatted, responsive HTML tables to show results for `SELECT` queries.
- Displays rows modified and success messages for `INSERT`, `UPDATE`, and `DELETE` queries.

### 5. 🌓 Unified Theme Synchronization
- Completely integrated with the repository's core `global-theme.css` and `global-theme.js` to support real-time dark/light mode layouts.

---

## 📂 Project Structure

```text
interactive-sql-playground/
│
├── index.html   # Main workspace editor, console, & sidebar layout
├── style.css    # Responsive grids, ERD cards, & console styles
├── script.js    # WASM SQLite compiler, database schemas, & ERD loaders
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
http://localhost:8000/interactive-sql-playground/index.html
```

---

## 🛠️ Technology Stack
- **Dashboard Structure**: HTML5 Semantic markup
- **Layout & Styles**: CSS3 grid and flexbox using the core global CSS custom variables (`global-theme.css`)
- **Engine Logic**: ES6+ Javascript, SQLite compiled to WebAssembly (`sql.js`), canvas colors, schemas DOM trees, and error listeners.
