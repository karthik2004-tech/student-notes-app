# FocusFlow Pomodoro Productivity App with Analytics Dashboard

FocusFlow is an ultra-premium, gamified Pomodoro-based productivity dashboard designed to help students, developers, and professionals maintain deep work, manage daily tasks, and analyze study habits. Housing advanced customizable timers, programmatically synthesized soundscapes, custom analytics charts, and localized progression mechanics—FocusFlow is entirely self-sufficient with **zero static assets or external framework dependencies**.

---

## 🌟 Features

### ⏱️ customizable Pomodoro Timer
*   **Modular Presets:** High-efficiency cycles for **Focus Session**, **Short Break**, and **Long Break**.
*   **Aesthetic SVG visualizer:** Circular dynamic SVG counter animating with smooth timing intervals.
*   **Adaptive Browser Context:** The tab titles sync in real-time, letting you follow progress while multitasking.
*   **Automation Switches:** Options to auto-start breaks and next focus iterations seamlessly.

### 📝 Integrated Task Manager
*   **Session Estimation:** Estimate required Pomodoro session slots per task block.
*   **Active Pinning:** Pin a task as your "Active Focus" to automatically increment its completed Pomodoro cycles when a session successfully concludes.
*   **Priority Hierarchy:** Segment tasks into Low, Medium, and High priority labels with adaptive color badges.
*   **Progress Indicators:** Responsive task list counters showing exact completed vs. total percentages.

### 📈 Gamified XP & Progression System
*   **Consistent Levels:** Gain XP for focus sessions (35 XP), break logs (15 XP), and task completion (20 XP).
*   **Dynamic Efficiency Tiers:** Level up through dynamic brackets ("Focus Initiate", "Zen Grandmaster", etc.) as you establish streaks.
*   **Achievement Badges:** Lock and unlock milestone badges (e.g., "First Step", "Deep Work Master", "Zen Master", "Task Slayer") mapped to your analytics metrics.

### 📊 Real-Time Analytics Dashboard
*   **Summary Counters:** Aggregated focus minutes, pomodoros finalized, task tallies, and current efficiency grade.
*   **Programmatic SVG Bar Charts:** Visual weekly activity distributions drawn live without heavy external dependencies.
*   **Hourly Activity Map:** Histogram showcasing which period of the day contains your peak focus zones.
*   **Data Portability:** Export your entire productivity history logs anytime as a standardized CSV file.

### 🎵 Programmatic Ambient Soundscapes
*   **No asset loading issues:** FocusFlow uses the HTML5 **Web Audio API** to synthesize high-quality, continuous white noise, heavy rain, sweeping forest winds, and cozy coffee-shop chatter (with periodic cup clinks and synth bird tweets!) natively on-the-fly.
*   **Subtle Tick Feedback:** Optional clock ticking to help anchor high-focus rhythms.
*   **Session Chime:** Programme-synthesized chime arpeggio triggered at countdown zero.

---

## 🛠️ Tech Stack

FocusFlow is designed for lightweight performance, high compatibility, and rapid load speed:

*   **HTML5:** Semantic architecture with modern accessible layout segments.
*   **Vanilla CSS3:** Curated glassmorphism (`backdrop-filter`), custom color properties for instant theme switching (Dark & Light), custom slider handles, CSS grids/flexboxes, and hardware-accelerated animations.
*   **ES6+ JavaScript:** Object-oriented modular state architecture, Web Audio DSP synthesize pipelines, programmatic SVG canvas rendering algorithms, CSV generator, and LocalStorage state serialization.
*   **Icons & Typography:**
    *   [Phosphor Icons CDN](https://phosphoricons.com/) (Extremely rich modern iconography).
    *   [Google Fonts Outfit](https://fonts.google.com/specimen/Outfit) (Futuristic geometric sans font).

---

## 📂 Folder Structure

```
focusflow-pomodoro/
│
├── index.html       # Semantic DOM structure and Modal layers
├── style.css        # Adaptive dark/light layout, glassmorphic styling, and animations
├── script.js        # Core state manager, SVG charting, and Web Audio synths
└── README.md        # Comprehensive documentation (this file)
```

---

## 🚀 Installation & Setup

Since FocusFlow has **zero dependencies** and no build pipelines, getting it set up takes less than 30 seconds:

1.  Navigate into the project directory:
    ```bash
    cd focusflow-pomodoro
    ```
2.  Open `index.html` directly in any web browser of your choice.
3.  *Alternative (Recommended for local servers):*
    Run a local lightweight server to utilize optimal audio context bindings:
    ```bash
    # using Python
    python -m http.server 8000
    
    # using Node.js
    npx serve
    ```
    Then visit `http://localhost:8000` or `http://localhost:3000` respectively.

---

## 💡 Usage Guide

1.  **Configure Timer:** Adjust your preferred focus minutes inside the Settings panel (Gear icon).
2.  **Queue Tasks:** Type your objective, choose its priority level and estimate how many Pomodoros it will take. Add the task.
3.  **Assign Focus:** Click on the task item or its pin icon to set it as active.
4.  **Tweak Ambience:** Toggle between rain, forest, cafe chatter, or white noise in the ambient panel. Adjust the volume slider.
5.  **Focus & Level Up:** Click **Start Focus** and get to work. As the timer ticks down, you will earn XP and progress towards badges.
6.  **Evaluate:** Inspect your weekly SVG analytics bars and hourly maps to discover your optimal focus habits.

---

## 📈 Future Enhancements

*   **PWA Support:** Convert the app to a Progressive Web App so it runs offline as a desktop or mobile application.
*   **Binaural Beats:** Synthesize precise brainwave synchronization patterns (Alpha/Theta waves) programmatically for improved cognitive flow.
*   **Cloud Syncing:** Add optional integration with third-party APIs (Supabase or Firebase) to secure sync histories across multiple devices.

---

## 📸 Screenshots Section

*Add your visual screenshots here during pull requests to demonstrate FocusFlow UI layouts.*

---

## 🤝 Contribution Guidelines

We welcome contributions to FocusFlow! If you wish to improve the application:

1.  Fork this repository.
2.  Create your feature branch:
    ```bash
    git checkout -b feature/focusflow-improvement
    ```
3.  Follow our vanilla development philosophy (avoid heavy dependencies, prioritize native HTML5/CSS3 features and keep scripts modular).
4.  Ensure both dark and light modes render cleanly on mobile, tablet, and desktop environments.
5.  Commit changes and submit a Pull Request.

---

## 📝 License

This project is open-source and contributed under the **NSOC '26** initiative.
