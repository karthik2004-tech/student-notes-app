# CronTab Flow: Interactive Cron Expression Builder & Visualizer

An educational tool for backend engineers and DevOps students to easily build, decode, and visualize `cron` schedule expressions.

## 🚀 Features
- **Visual Cron Builder**: Toggle dropdowns and checkboxes to construct standard 5-part crontab schedule expressions (Minutes, Hours, Days, Months, Weekdays).
- **Cron-to-Human Translator**: Paste any standard crontab string to instantly parse it back into a plain, easy-to-read English sentence.
- **Next 5 Executions List**: Incremental datetime logic scans forward from `new Date()` using cron constraints, listing upcoming execution timings in your local timezone.
- **Common Presets**: Select one-click presets for common schedules like "Every 5 minutes" or "Noon Weekdays".
- **Local Cache**: Remembers your expression across browser sessions.

## 🛠️ Usage
1. Use the tabbed panels to adjust schedule properties visually.
2. Observe the changing **Cron Expression String** and its **Plain English Translation** in real-time.
3. Check the **Upcoming Executions** log to confirm the schedule executes at the desired times.
