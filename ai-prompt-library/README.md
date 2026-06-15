# AI Prompt Library Manager & Variable Sandbox Compiler (PromptFlow)

A developer productivity dashboard designed to help you save, tag, organize, search, and compile structured prompt templates for ChatGPT, Gemini, Claude, Midjourney, and other AI models.

## Features

- **Productivity Dashboard Metrics**:
  - Stats indicators tracking Total Prompts saved, overall Times Copied (Usage counts), and Starred Favorites counts.
- **Sleek Platforms Filtering Sidebar**:
  - Segment your prompt library by target AI engine (ChatGPT, Gemini, Claude, Midjourney, or All Platforms).
  - Platform badges display template counts automatically.
- **Advanced Category Tabs, Sorting, & Search**:
  - Filter vault items by Category: Coding & CS, Creative/Design, Writing/Copy, and Analysis & Stats.
  - Sort by Newest Added, Most Copied (Usage frequency), or Alphabetical order.
  - Search inputs matching title, description, tags, and template content.
- **Interactive Prompt Variable Sandbox Compiler**:
  - Select any template from the card list to load it into the Sandbox compiler.
  - Auto-parses variable placeholders wrapped in brackets (e.g., `[language]`, `[snippet]`).
  - Generates input textboxes for each dynamic variable.
  - Compiles final prompt text live as you type variables.
- **Clipboard Utility Integration**:
  - Single-click to copy compiled prompt output. Updates prompt usage metrics automatically.
- **Orange, Purple, Green & Black Dual Themes**: Professional variables styling optimized for both dark and light modes.
- **JSON backups**: Export and import complete prompts databases.

## Folder Directory Structure

- `index.html` - Navigation bars, sidebar platforms, filters tabs, sandbox compiler structures, grids, and modals templates.
- `style.css` - Custom color variable overrides, grid adaptions, input textboxes styling, bubble overlays, and animations.
- `script.js` - Regular expressions variables compilers, clipboard functions, copies counter syncs, JSON backup packages, and filters.
- `project.json` - Level 3 metadata parameters.

## Running Locally

1. Open `index.html` in any web browser.
2. Alternatively, run the local development server at the root directory:
   ```bash
   npm run dev
   ```
3. Navigate to **PromptFlow** in the showcased project menu directory.
