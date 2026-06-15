# Local Storage Backup, Restore, and Note Exporting (VaultKeeper)

A utility dashboard that helps students manage their local browser cached data, export individual notes, and execute full database backup/restores.

## Features

- **Database Stats Hero Counters**:
  - Live indicator of total cached keys.
  - Estimated database size calculated from stored data byte size (UTF-16 character length scaling).
  - Track last backup timestamps.
- **Key-Value Explorer Table**:
  - View all localStorage keys and values side-by-side.
  - Inline editing capability to update specific key details.
  - Option to delete records or download individual key backups.
  - Dynamic live key-search filter.
- **Full Database Backup & Restore**:
  - **Download JSON**: Instantly package and download all current localStorage items as a single JSON backup.
  - **Drag & Drop Restore**: Drag your JSON file onto the upload zone. Choose between **Merge Restore** (preserves non-overlapping keys) or **Overwrite Clean Restore** (completely resets database state first).
- **Rich Note Sandbox Exporter**:
  - Clean text editor area featuring standard rich editing toolbar (Bold, Italic, Underline, Lists, Alignments).
  - Export to **Plain Text (TXT)**, **Markdown (MD)**, and **PDF (via System Print layouts)**.
  - Instant live Document Preview panel.

## Folder Contents

- `index.html` - App interface structure, dashboard, and modals.
- `style.css` - Theme styles, layout grids, action buttons, explorer table styling, dropzones, modals, and print style overrides.
- `script.js` - Tab controls, data calculations, JSON packager/validator, drag-and-drop file readers, editing handlers, and document markup translators.
- `project.json` - App metadata configuration with Level 3 annotation.

## Running Locally

1. Open `index.html` directly in any web browser.
2. Alternatively, run the local development server at the root directory:
   ```bash
   npm run dev
   ```
3. Open the portal and select **VaultKeeper** from the showcased menu listings.
