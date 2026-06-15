# Interactive Git Command Visualizer & Sandbox

An interactive web application designed to help beginners and students visualize how Git commands affect local repositories, staging areas, branches, and commit graphs in real-time.

## 🚀 Live Demo & Sandbox
Launch and experiment with Git commands right in your browser with zero terminal installations. Avoid code repository damage while practicing!

## ✨ Key Features
- **Simulated Terminal Console:** Type git commands directly (`git commit`, `git checkout`, `git branch`, `git merge`, `git rebase`, etc.) to run them instantly.
- **Dynamic Commit Tree Graph:** Interactive, animated SVG visual representation representing repository nodes, branches, HEAD positions, and merges.
- **Staging & Working Directory Simulator:** Visually track and modify file states (Untracked, Staged, Committed).
- **Interactive Quests (5 Levels):** Learn git step-by-step with verify-completion prompts:
  1. *Your First Commit* - Working with staging areas and commit hashes.
  2. *Branching Out* - Isolated environment creation.
  3. *Diverging Timelines* - Parallel branches from common ancestors.
  4. *Fast-Forward & Merge* - Combining development branches.
  5. *The Power of Rebase* - Linearizing histories.
- **Centralized Dark/Light Theme Integration:** Uses the workspace-wide layout vars (`--bg-color`, `--text-color`) for theme support.

## 🛠️ Built With
- **HTML5** & **CSS3** (using shared CSS variable design tokens)
- **Vanilla JavaScript** (Git model, CLI interpreter, custom SVG rendering logic)
- **SVG Elements** (procedurally generated commit branches and connectors)

## 📋 How to Run Locally
Open the `index.html` file inside this folder directly in any browser:
`interactive-git-visualizer/index.html`

## 🤝 Contributing Guidelines
If you want to contribute features, fix rendering bugs, or write new quest levels:
1. Keep the style consistent with the global theme colors.
2. Link the global theme style files using standard relative paths (`../global-theme.css` and `../global-theme.js`).
3. Ensure no external frameworks (like React or Tailwind) are introduced without approval, as this project is lightweight vanilla JS.
