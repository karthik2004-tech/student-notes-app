# Open Source Contribution Journey Dashboard

A premium client-side tracking application designed to help developers and students monitor their open-source contributions (Issues, Pull Requests, Reviews) across target programs like NSOC, GSSoC, Hacktoberfest, and LFX Mentorship.

## Features

- **GitHub Contributor Profile Info**:
  - Customizable nickname, biography, avatar, and github links.
  - Active program check selectors that toggle visible logs.
- **Contribution Logger**:
  - Track titles, repositories, URLs, types (PR Merged, PR Submitted, Issue Created, Review Given), date, and notes.
- **Weighted Points & Level Progression**:
  - Auto-calculates points based on contribution types:
    - PR Merged: 10 pts
    - PR Submitted: 5 pts
    - Review Given: 5 pts
    - Issue Created: 3 pts
  - Updates ranks: Novice Contributor, Rising Star, Open Source Elite, and Project Maintainer.
- **Milestone Trophy Badges**:
  - Automatically unlocks accomplishment awards based on milestones (points secured, streak size, number of merged PRs, and repositories participated in).
- **Interactive Visualizations (Chart.js)**:
  - Doughnut: Contribution type distributions.
  - Bar: Repository contributions split.
  - Line: Journey points timeline accumulation.
- **Storage & Backup utility**:
  - `localStorage` client-side sync.
  - JSON imports/exports.
- **Centralized Theme Management**:
  - Integrates with the repository's global dark/light theme variables by linking the parent `global-theme.css` and `global-theme.js`.

## Tech Stack

- **Core**: HTML5, CSS3 Custom variables (Design System), Vanilla JavaScript (ES6+).
- **Libraries**: Chart.js, Lucide Icons.

## Setup Instructions

1. Simply double-click `index.html` to run in any browser.
2. Alternatively, run a static file server in the project folder:
   ```bash
   npx http-server -p 8002
   ```
   and navigate to `http://localhost:8002/open-source-contribution-journey/`.
