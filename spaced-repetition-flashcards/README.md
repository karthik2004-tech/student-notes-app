# Spaced-Repetition Flashcards Mode (Leitner Study System)

An offline-first flashcard review application that implements the Leitner Study System to optimize memorization retention of notes, formulas, vocabulary, and definitions.

## Key Features

- **Leitner System Scheduler**:
  - Automatically schedules flashcards across 5 study boxes.
  - Cards inside each box are reviewed at spaced intervals (Box 1: daily, Box 2: 2 days, Box 3: 5 days, Box 4: 9 days, Box 5: 14 days).
  - Answering **Know It** moves cards up a box; answering **Review Again** resets them to Box 1 immediately.
- **Interactive Flashcard Scene**:
  - Beautiful 3D card flipping animations on click.
  - Interactive status trackers detailing remaining cards in the current study session.
- **Deck & Card Manager**:
  - Add, edit, or delete customized study decks.
  - Create and manage individual flashcard QA statements with search filters.
- **Progress Visualizer & Analytics**:
  - Summary panels showing studied metrics, total flashcards, and deck numbers.
  - Interactive Chart.js charts showing Box Share splits and Mastery rates per deck.
- **Centralized Theme Management**:
  - Smooth light/dark mode transitions built using the repository's global CSS variables and scripts (`../global-theme.css` and `../global-theme.js`).
- **Data Persistence**:
  - Saves your decks, flashcards, profiles, and streaks in client-side `localStorage`.
  - JSON imports/exports for configuration file backups.

## Technical Details

- **Core**: HTML5, CSS3 transitions & 3D transforms, JavaScript (ES6+).
- **Libraries**: Chart.js, Lucide Icons.

## Folder Structure

```
spaced-repetition-flashcards/
├── index.html   # HTML study workspace templates and modals
├── style.css    # Responsive variables, 3D card flips, and box progress styling
├── script.js    # Leitner intervals scheduler, data sync, and Chart.js graphs
├── project.json # Level 3 metadata annotations
└── README.md    # Product documentation and setup guides
```

## Setup Instructions

1. Simply double-click `index.html` to run in any browser.
2. Alternatively, run a static file server in the project folder:
   ```bash
   npx http-server -p 8002
   ```
   and navigate to `http://localhost:8002/spaced-repetition-flashcards/`.
