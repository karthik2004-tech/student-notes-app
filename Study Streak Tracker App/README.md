# AuraStudy - Study Streak Tracker & Productivity Dashboard (Issue #309)

AuraStudy is a state-of-the-art, fully responsive Single Page Application (SPA) designed to help students establish, track, and maintain consistent study habits. Leveraging a premium glassmorphic UI, dynamic gamification models, and robust client-side analytical charts, AuraStudy empowers users to explore and track their dedication.

This project implements the requirements for **Issue #309: Study Streak Tracker Dashboard with Progress Analytics**.

---

## 🚀 Key Features

* **Guest Explore Mode ("Try Before You Buy")**: Allows new users to fully explore the dashboard, browse charts, view contribution heatmaps, inspect the badges shelf, and read the logs table without immediate authentication.
* **Contextual Authentication Modal**: Prompts guest users to register or sign in only when attempting restricted activities (e.g. logging a new study session, custom configuring daily/weekly targets, or removing logs records).
* **Multi-User Registration & Authentication**: Persistent, isolated local account sessions allowing multiple scholars to maintain independent statistics on a single browser.
* **Daily Study Streak Counter**: Automatically calculates active daily study streaks. A walk-back algorithm verifies contiguous study periods, keeping track of your current streak and all-time longest record.
* **Interactive Calendar Heatmap**: A GitHub-style contribution grid representing the last 12 weeks of focused study. Color density levels scale dynamically depending on cumulative daily minutes. Hovering reveals accurate date and duration tooltips.
* **Progress Analytics (Chart.js)**:
  - **Weekly Study Effort**: Visual bar chart aggregating focused minutes per day for the active week.
  - **Subject Concentration**: Doughnut chart charting percentage distribution across academic subjects (Coding, Mathematics, Sciences, Languages, Writing, and Others).
* **Goal Tracking System**: Dynamically configure custom daily study targets and weekly targets, with progress gauges updating in real time.
* **Gamified Achievement Badges**: A dedicated badges shelf unlocking milestones as study parameters are met (e.g. logging the first session, maintaining 3, 7, and 14-day streaks, logging 10 total focused hours, or studying a variety of subjects).
* **Premium Adaptive Design**: Impeccable responsiveness across mobile, tablet, and desktop viewports, with a persistent Light/Dark mode toggle.

---

## 📂 Project Architecture

All source codes are fully isolated inside the `Study Streak Tracker App/` directory:

```
Study Streak Tracker App/
├── index.html       # Single Page Application core structures and templates
├── style.css        # Adaptive CSS stylesheets, heatmap grid configurations, and animations
├── app.js           # Core state engine, auth systems, streak calculators, and charts managers
└── README.md        # Technical specifications and setup documentation (this file)
```

---

## ⚡ How to Run AuraStudy Locally

Since AuraStudy is built on modern, lightweight, vanilla front-end technologies (HTML5, CSS3, ES6 JavaScript), there is **no compile step, no package installations, and no complicated database configurations** required. You can host and run the application locally using one of the following extremely simple methods:

### Method 1: Direct File Launch (No Server Needed)
1. Clone or download this repository to your local machine.
2. Navigate into the project folder:
   `student-notes-app-new/Study Streak Tracker App/`
3. Locate the file named [index.html](file:///v:/Nexus-spring-of-code/student-notes-app-new/Study%20Streak%20Tracker%20App/index.html).
4. **Double-click** the file or right-click and choose **Open With** -> **Google Chrome** (or your preferred web browser like Edge, Firefox, Safari).
5. The application will launch instantly and run entirely in your local browser sandbox!

### Method 2: Node.js Static Server (Recommended)
If you have [Node.js](https://nodejs.org) installed on your machine:
1. Open your terminal or Command Prompt.
2. Navigate to the project directory:
   ```bash
   cd "student-notes-app-new/Study Streak Tracker App"
   ```
3. Launch a lightweight local server instantly using `npx`:
   ```bash
   npx serve
   ```
4. By default, this will spin up a local server hosting the files. Open your web browser and go to:
   👉 **[http://localhost:3000](http://localhost:3000)** (or the port specified in your console).

### Method 3: Python Built-in Server
If you have [Python](https://www.python.org) installed:
1. Open your terminal or command line.
2. Navigate into the project directory:
   ```bash
   cd "student-notes-app-new/Study Streak Tracker App"
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
4. Open your browser and go to:
   👉 **[http://localhost:8000](http://localhost:8000)**

### Method 4: VS Code "Live Server" Extension
If you are using [Visual Studio Code](https://code.visualstudio.com):
1. Open VS Code.
2. Click **File** -> **Open Folder** and select `student-notes-app-new/` or directly `Study Streak Tracker App/`.
3. Install the **Live Server** extension (by Ritwick Dey) if you haven't already.
4. Right-click [index.html](file:///v:/Nexus-spring-of-code/student-notes-app-new/Study%20Streak%20Tracker%20App/index.html) in your file tree and click **Open with Live Server**.
5. It will automatically open in your default browser on port `5500`.

---

## 💡 Pre-seeded Data for New Scholars & Guests

To immediately showcase the analytics dashboard's visual clarity (doughnut focus points, bar charts, and calendar heatmap grids), guest views and newly registered accounts are **automatically pre-seeded with 15 realistic logs** spread across the past 30 days. This includes a continuous 6-day study chain leading up to today to activate a live **6-day Study Streak** instantly!
