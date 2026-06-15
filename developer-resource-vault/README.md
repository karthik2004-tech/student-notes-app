# Developer Resource Vault with Smart Categorization & Learning Dashboard (DevVault)

A personal knowledge base and learning organizer that helps developers save, categorize, and track learning resources (documentation links, articles, videos, tutorials, and code references).

## Features

- **Learning Dashboard Metrics**:
  - Live progress metrics covering Total Assets, Unread/To Read, Active (In Progress), and Completed resources.
  - Overall completion rate percentage indicator and visual gradient progress bar.
- **Smart Categorization & Topics Navigation**:
  - Sidebar dividing resources into primary categories: Front-end, Back-end, DevOps, Database, AI/ML, and Utilities.
  - Sidebar counts update automatically to indicate saved assets per topic.
- **Flexible Filters & Sorting**:
  - Filters by Type: Docs, Videos, Tutorials, Articles, and Snippets.
  - Real-time search bar scanning titles, descriptions, URLs, and tags.
  - Sort resources by Newest Added, Priority Level (High, Medium, Low), or Alphabetical order.
- **Interactive Resource Card Actions**:
  - Hover actions to edit resource parameters or delete cards.
  - Single-click on status badges to cycle learning status (`To Read` -> `In Progress` -> `Completed` -> `To Read`) directly from the dashboard card.
- **Dual Themes (Light & Dark Mode)**:
  - High contrast professional color palettes using Orange, Purple, Green, and Black tokens.
  - Easy toggle switch with smooth transition animations.
- **Backup & Portability**:
  - Export complete list of bookmarks as JSON backup files.
  - Import previously saved JSON files.

## Project Structure

- `index.html` - App interface layouts, sidebar list, dashboard counters, grid, and modal dialog forms.
- `style.css` - Custom color variable tokens (orange/purple/green/black), dark/light overrides, metrics indicators, responsive style parameters, and transitions.
- `script.js` - Mock resources loaders, DOM builders, search filters, state syncs, status cycling controllers, and backup functions.
- `project.json` - Level 3 metadata parameters.

## Running Locally

1. Open `index.html` in any web browser.
2. Alternatively, run the local development server at the root directory:
   ```bash
   npm run dev
   ```
3. Navigate to **DevVault** in showcased project menu pages.
