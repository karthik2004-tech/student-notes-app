# 🚀 NSOC'26 — 20 Days • 20 Projects Challenge

<div align="center">

### Build • Learn • Contribute • Grow

A beginner-friendly open-source repository where contributors can showcase creativity by building mini-projects, UI components, tools, games, and web applications.

**No contribution limit. No project size restrictions. Just build and learn.**

</div>

---

## 🌟 What is NSOC'26?

NSOC'26 has been transformed into a **20 Days • 20 Projects Challenge** to provide a smoother and more organized contribution experience.

Sorry for the inconvenience. The previous **Student Notes App** project was frequently running into large merge conflicts due to the high number of PRs. Because of that, I've changed it to **20 Days, 20 Projects**.

Drop your crazy frontend projects, UI designs, landing pages, components, dashboards, animations, and anything else you've built. Let's create and showcase as many projects as possible!


---

## 🎯 Why Participate?

### ✅ Beginner Friendly

Perfect for first-time contributors and students exploring open source.

### ✅ Unlimited Contributions

Submit as many projects, improvements, or components as you like.

### ✅ Learn by Building

Create real projects while improving your HTML, CSS, JavaScript, React, and frontend development skills.

### ✅ Showcase Your Creativity

Build anything from calculators and weather apps to games, dashboards, utilities, and UI components.

---

## ⚡ Quick Start

### 1. Fork the Repository

Click the **Fork** button at the top-right corner.

### 2. Clone Your Fork

```bash
git clone https://github.com/YOUR_USERNAME/student-notes-app.git
cd student-notes-app
npm install
npm run dev
```

### 3. Create a New Project Folder

Example:

```text
student-notes-app/
│
├── calculator/
├── weather-app/
├── study-timer/
└── your-project/
```

### 4. Add Your Files

```text
your-project/
├── index.html
├── style.css
└── script.js
```

### 5. Link your Project to the Main Dashboard

Open the root `index.html` file, locate the `<div class="card-container">` section, and add a new HTML card block that hyperlinks to your newly created folder.

### 6. Commit and Create a Pull Request

Push your changes and open a PR.

### ⚠️ Crucial: Linking Your Project to the Main Grid
To prevent severe Git merge conflicts, **DO NOT modify `index.html` directly!** As multiple contributors submit projects simultaneously, directly editing the main HTML file will cause your Pull Request to conflict and fail. 
* **To add your project to the main showcase:** Please add a new entry to the `projects.json` file (or follow the repository's designated safe-linking process). 

### Backend Setup
If you are working with the Node.js backend components, you will need to install the dependencies and start the local server. Run the following commands:
```bash
cd calculator/patternwise-app/backend
npm install
npm start
```

---

## 📂 Project Structure

Each contributor should create a separate folder.

Example:

```text
/project-name
│
├── index.html
├── style.css
└── script.js
```

### Important

* Keep all files inside your project folder.
* Do not modify other contributors' projects.
* Use meaningful folder names.
* Keep pull requests focused on a single project or improvement.

---

## 🏆 Levels & Points System

| Level      | Requirements            | Points    |
| ---------- | ----------------------- | --------- |
| 🟢 Level 1 | HTML + Basic CSS        | 3 Points  |
| 🔵 Level 2 | HTML + Advanced CSS     | 5 Points  |
| 🟣 Level 3 | HTML + CSS + JavaScript | 10 Points |

---

## 💡 Project Ideas

### 🟢 Level 1

* Landing Page
* Portfolio Page
* Navigation Bar
* Profile Card
* Static Website

### 🔵 Level 2

* Responsive Dashboard
* Animated UI Components
* Glassmorphism Designs
* Pricing Cards
* Modern Landing Pages

### 🟣 Level 3

* Calculator
* To-Do App
* Quiz App
* Weather App
* Expense Tracker
* Habit Tracker
* Games
* Productivity Tools

---
## 📂 Featured Projects in This Repository

This repository already contains a growing collection of projects built by contributors across different categories.

### 🎮 Games

* Hangman
* Snake Game
* Tic-Tac-Toe
* Memory Match Game
* Memory Card Game
* Flappy Bird
* Whack-a-Mole
* Dots and Boxes
* Word Scramble
* Word Completion Game
* Identify Word Game
* Maths Calculation Game
* Nebula Game

### 📚 Study & Productivity

* Student Notes App
* Study Streak Tracker
* Study Progress Assessment System
* Revision App
* Study Clock
* Smart Planner
* Deadline Tracker
* Exam Countdown
* Exam Timetable
* Flashcard Quiz
* Focus Flow
* Pomodoro Timer
* Study Topic Spinner
* Interview Preparation Dashboard
* LeetCode Tracker

### ✅ Task & Notes Management

* Todo App
* Google Keep Clone
* Sticky Notes UI
* Digital Diary
* Task Completion System

### 💰 Finance & Calculators

* Expense Tracker
* Student Budget Tracker
* CGPA Calculator
* GPA Calculator
* Fee Calculator
* BMI Calculator
* Calculator
* Unit Converter
* Bit Converter

### 🌐 Utilities & Tools

* GitHub User Finder
* GitHub Explorer
* QR Code Generator
* Password Generator
* Color Picker
* Weather Card
* Utility App
* Calendar
* Decision Wheel

### 📈 Tracking & Monitoring

* Attendance Tracker
* Habit Tracker
* Subject Progress Bars
* Performance Measuring App
* Syllabus Tracker

### 🎨 UI & Frontend Components

* Coding Hub
* Study Group UI
* PatternWise App

### 🚀 And Many More...

New projects are added regularly by contributors. Feel free to explore the repository folders and contribute your own project.

## 🛠 Supported Technologies

You are free to use:

* HTML
* CSS
* JavaScript
* React
* Tailwind CSS
* Bootstrap
* Vite
* Any Frontend Framework or Library

---

## 📜 Contribution Guidelines

### 📁 Where to Put Your Project
To keep this repository organized, **all new projects must be placed in their own dedicated folder at the ROOT level of the repository.** **❌ DO NOT:**
* Do not place your project inside  other existing project's folder.
* Do not place your files loosely in the root directory without a containing folder.

**✅ DO:**
* Create a new folder at the root level named after your project (e.g., `student-notes-app/my-awesome-game/`).
* Place all your HTML, CSS, and JS files strictly inside that new folder.

Before submitting a PR:

* Create a dedicated folder for your project.
* Follow clean folder naming conventions.
* Avoid unnecessary dependency additions.
* Do not overwrite existing work.
* Test your project before submission.
* Keep pull requests small and focused.

### 🎨 Centralized Theme Management
To maintain a consistent UI/UX across all projects, **do not write custom dark mode toggles**. Instead, link the global theme files in your project's `index.html`:
1. Add `<link rel="stylesheet" href="../global-theme.css">` inside your `<head>`.
2. Add `<script src="../global-theme.js"></script>` before the closing `</body>` tag.
3. Use the CSS variables (`var(--bg-color)`, `var(--text-color)`, etc.) in your local CSS files instead of hardcoding colors.

---

## 🎯 Repository Goals

This repository aims to:

* Help beginners start contributing confidently.
* Encourage consistent project building.
* Reduce contribution barriers.
* Promote collaboration and learning.
* Create a collection of creative community projects.

---

## 📈 Roadmap

* [ ] Reach 100+ community projects
* [ ] Add project showcase section
* [ ] Add contributor leaderboard
* [ ] Improve project categorization
* [ ] Add contribution statistics
* [ ] Create project gallery page

---

## 🤝 Contributing

Every contribution matters.

Whether you build a complete application, a reusable component, or a creative experiment, your work helps grow the community.

**Build something useful. Build something fun. Build something unique.**

Happy Contributing! 🚀

## Responsive Design & Testing Guidelines

To ensure all applications provide a consistent user experience across devices, contributors must adhere to the following mobile-first design and testing guidelines:

### LocalStorage Utility Standard
When implementing `localStorage` across any component, you **must** use `try/catch` blocks to prevent the application from crashing if the browser's storage quota is exceeded or if storage is restricted (e.g., in Private/Incognito mode).

Use the following standard utility pattern for all LocalStorage interactions:

\`\`\`javascript
const StorageUtil = {
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('LocalStorage quota exceeded or unavailable:', error);
      // Optional: Alert the user or fallback to memory storage
      return false;
    }
  },
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error reading from LocalStorage:', error);
      return defaultValue;
    }
  }
};
\`\`\`

