# Skill Gap Analyzer with Career Matching & Learning Recommendations (SkillSync)

An interactive career mapping dashboard that helps students assess their current skills proficiency against required industry benchmarks for core developer roles and provides structured learning paths to bridge the gaps.

## Features

- **Interactive Skills Profile Builder**:
  - Add your custom skills from multiple domain categories (Frontend, Backend, Database, Cloud/DevOps, Utilities).
  - Adjust your current proficiency slider level (1 to 10 scale) in real-time inside the sidebar panel.
- **Predefined Career Benchmarks Library**:
  - Contains predefined target level benchmarks for career paths including Frontend Developer, Backend Engineer, DevOps Specialist, Data Scientist, and AI/ML Engineer.
- **Suitability Match Calculator**:
  - Calculates an overall suitability percentage Match Score (%) based on the difference between user levels and target benchmarks.
  - Live analytics counters indicating Matched Skills ratio, Skills to Improve (Gap list), and Active Learning Plans count.
- **Visual Comparison Grid**:
  - Side-by-side comparison bars demonstrating User Level (represented by purple/orange gradient tracks) and required benchmarks (green line markers) for visual analysis.
- **Dynamic Learning Paths Recommendation**:
  - Lists structured documentation links, tutorials, and tasks for every skill gap.
  - Option to bookmark pathways as "Learning Active" which updates statistics counters live.
- **Orange, Purple, Green & Black Dual Themes**:
  - Professional styling with high contrast tokens for dark and light modes.
- **JSON Profile Backups**:
  - Export and import your skills profile configurations as JSON backup files.

## Project Structure

- `index.html` - App navigation layouts, sidebar inputs, dashboard metrics, comparison tracks grid, study cards, and configuration modals.
- `style.css` - Dual theme styling variable properties (orange/purple/green/black), comparison bars graphics, range sliders, layouts grids, and animations.
- `script.js` - Careers databases benchmarks, suitability calculation algorithms, slider handlers, recommendation checklists, and backup routines.
- `project.json` - Level 3 metadata parameters.

## Running Locally

1. Open `index.html` in any web browser.
2. Alternatively, run the local development server at the root directory:
   ```bash
   npm run dev
   ```
3. Navigate to **SkillSync** in the showcased project menu directory.
