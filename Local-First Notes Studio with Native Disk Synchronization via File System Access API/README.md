# Local-First Notes Studio with Native Disk Synchronization

This project demonstrates a simple browser-based notes editor that uses the File System Access API to read and write files directly on the user's local disk.

## Features

- Open a local directory using `window.showDirectoryPicker()`
- Inspect and list `.txt` / `.md` notes in the selected folder
- Edit notes in-browser and save changes directly to disk
- Create new note files with native disk synchronization
- Permission management with `queryPermission` and `requestPermission`

## Usage

1. Open `index.html` in a browser with File System Access API support (Chrome, Edge, or other Chromium-based browser).
2. Click **Open Folder** and select a local directory.
3. Open or create a note.
4. Edit and click **Save** to persist the file natively.

## Notes

- This demo is intended for local development and modern browsers.
- The File System Access API requires a secure context (`https://` or `localhost`).
- The application does not upload notes to a server; files stay on the user's disk.
