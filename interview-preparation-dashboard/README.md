# AuraPrep - Interview Preparation Dashboard & Analytics

AuraPrep is a premium, fully responsive Single Page Application (SPA) designed to help students organize, monitor, and master their interview preparation journey. Built with standard HTML5, CSS3, modern ES6 JavaScript, and persistent LocalStorage, AuraPrep features structured progress trackers, scoring engines, checklist matrices, and real-time Chart.js analytics dashboards.

---

## 🚀 Key Features

* **DSA Progress Tracker**: Segmented progress logs tracking question counts across core algorithmic areas (Arrays & Hashing, Strings, Linked Lists, Stacks & Queues, Trees, Graphs, Dynamic Programming). Solved problems ledger allows logs details (Platform, solution links, dates, and difficulty levels) to be logged.
* **Aptitude Progress Monitor**: Logs mock assessment scores across Quantitative, Logical, and Verbal aptitude subjects, charting score trends over time on interactive line graphs.
* **ATS Resume Checklist**: Detailed checklist validating critical resume ATS parameters (STAR formatting, tags alignment, metrics highlights, valid URL pointers).
* **CS Core Technical Checklist Stack**: Keep track of fundamental revisions across Operating Systems, DBMS databases, OOPs designs, Computer Networks layers, and System Design patterns.
* **BehavioralSTAR Scenarios Checker**: Prepared STAR checkoffs covering standard leadership, technical failure, and interpersonal conflict interview scenarios.
* **Circular Overall Readiness Rating**: A specialized calculation engine dynamically computing overall readiness scores based on weighted counts:
  - **DSA questions solved** (Max 45% weighting)
  - **Aptitude mock test scores** (Max 25% weighting)
  - **Checklists checkboxes completed** (Max 30% weighting)
* **Guest Explore Mode**: Allows guest scholars to fully explore the dashboard, look at sample DSA difficulty doughnuts, and toggle checklists using pre-seeded mock profiles without immediate logins prompts.
* **Dual Light/Dark Mode Switch**: Fully synchronized theme toggles synced to browser LocalStorage.

---

## 📂 Project Structure

All source codes are fully isolated inside the `Interview Preparation Dashboard/` directory:

```
Interview Preparation Dashboard/
├── index.html       # SPA markup, modal sheets overlays, and views panels
├── style.css        # Glassmorphic style templates, themes variables, and checklists animations
├── app.js           # Client states database, readiness math calculations, and Chart.js managers
└── README.md        # Technical specifications and local run instructions (this file)
```

---

## ⚡ Tech Stack Details

* **Core Structure**: HTML5 Semantic Markup
* **Design Systems**: Vanilla CSS3 Custom Variables, CSS Grid Columns, Flexbox Layouts, Glassmorphism backdrop blurs, and Boxicons vector glyphs.
* **State Logic**: Vanilla ES6 JavaScript Modules (State persistence maps, lists, and CRUD databases).
* **Analytics Engine**: [Chart.js](https://www.chartjs.org) (Interactive difficulty doughnuts and test performance scorecard trend curves).
* **Storage Sandbox**: Browser LocalStorage APIs.

---

## 💻 How to Run AuraPrep Locally

AuraPrep is a lightweight, serverless static application. You can easily host and run the dashboard locally in under a minute using one of the following methods:

### Method 1: Double-Click (Direct Launch)
1. Download or clone this repository.
2. Open the directory `Interview Preparation Dashboard/`.
3. Locate the [index.html](file:///v:/Nexus-spring-of-code/student-notes-app-new/Interview%20Preparation%20Dashboard/index.html) file.
4. **Double-click** the file or right-click and open it with Google Chrome, Firefox, Safari, or Edge.
5. The application will launch instantly and run entirely in your local browser sandbox!

### Method 2: Node.js Static Server
If you have [Node.js](https://nodejs.org) installed on your system:
1. Open your terminal or Command Prompt.
2. Navigate to the project directory:
   ```bash
   cd "student-notes-app-new/Interview Preparation Dashboard"
   ```
3. Boot up serve instantly using `npx`:
   ```bash
   npx serve
   ```
4. Open your browser and go to:
   👉 **[http://localhost:3000](http://localhost:3000)** (or the port specified in your console).

### Method 3: Python Built-in Server
If you have [Python](https://www.python.org) installed:
1. Open your terminal or command line.
2. Navigate into the project directory:
   ```bash
   cd "student-notes-app-new/Interview Preparation Dashboard"
   ```
3. Run the built-in HTTP server:
   - For Python 3.x:
     ```bash
     python -m http.server 8000
     ```
   - For Python 2.x:
     ```bash
     python -m SimpleHTTPServer 8000
     ```
4. Open your browser and navigate to:
   👉 **[http://localhost:8000](http://localhost:8000)**

---

## 💡 Pre-seeded Explore Mode Demo Data

To immediately showcase the preparation board's visual gauges (radial interview readiness scores, weekly score trend lines, and difficulty charts), guest explorer profiles are **automatically pre-seeded with 7 solved DSA problems, 4 aptitude mock test scores, and 7 checked checklist tasks** representing a highly realistic baseline!
