# IndexedDB Ledger Studio

A local-first transactional finance ledger built with native browser IndexedDB.

## Overview

This module demonstrates a responsive, non-blocking storage architecture for academic financial ledgers and transactional tracking. It uses IndexedDB to support:

- Atomic `readwrite` transactions
- Schema versioning via `onupgradeneeded`
- Cursor-driven async paging with `openCursor()`
- Relational object stores for account and category references
- Export / import support via JSON
- Live analytics and summary dashboards

## Files

- `index.html` — Main dashboard UI
- `style.css` — Modern dark interface and chart layout
- `script.js` — Core IndexedDB manager, schema upgrades, transaction logic, filters, and analytics

## Features

- Create, remove, and page through ledger entries
- Auto-create account and category reference stores
- Filter by description, account, category, and transaction type
- Demo dataset loader for quick evaluation
- Export ledger data to JSON and import it back
- Live summary cards and category analytics

## Getting Started

1. Open `indexeddb-ledger/index.html` in a browser.
2. Grant IndexedDB access if prompted.
3. Add transactions through the form.
4. Use the filter controls, paging buttons, and analytics dashboard.

## Notes

- The UI is fully client-side and stores data in browser IndexedDB.
- Works best in modern browsers with IndexedDB support.
- Data persists across sessions unless the browser storage is cleared.

## Development

Use the demo loader to seed sample ledger entries and verify analytics.

## License

No license specified.
