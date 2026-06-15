# SVG Connected Mind Maps (MapWeaver)

An interactive, premium visual mind mapping workspace built with HTML5, CSS3, and Vanilla JavaScript. MapWeaver lets you brainstorm and connect ideas dynamically with auto-adjusting SVG S-curves (Cubic Bezier paths) and real-time canvas manipulations.

## Features

- **Dynamic SVG Connections**: Parent and child nodes are joined with organic Cubic Bezier S-curve links that update live as you drag nodes.
- **Hierarchical Node Management**: Add children nodes to any level. Delete any node recursively (deleting its entire sub-branch of descendants).
- **Inline Editing**: Double-click any node's text to edit its title instantly without forms or modal overlays. Press Enter or click outside to save.
- **Infinity Canvas Pan & Zoom**: Pan around the 5000px by 5000px grid viewport by clicking and dragging on the background canvas. Zoom in and out using mouse wheels or control buttons.
- **Backup & Portability**:
  - **Export JSON**: Save your full mind map node configuration as a JSON file.
  - **Import JSON**: Restore a previously saved JSON map.
  - **Export SVG**: Download a beautifully rendered SVG vector image file of your map, framed dynamically around all nodes.
- **Light Theme Design**: Pure off-white/pastel workspace optimized for long study sessions.

## File Structure

- `index.html` - App interface structure, controllers, and workspace viewport.
- `style.css` - Custom style tokens, dotted grid viewport backgrounds, node shapes, level badges, and interactive styling.
- `script.js` - Dynamic layout mathematics, vector SVG drawing, pan/zoom handlers, drag physics, and save/load utilities.
- `project.json` - System metadata, tags, and Level 3 annotation.

## Setup & Running Locally

1. Open `index.html` directly in any web browser.
2. Alternatively, run a local development server at the repository root:
   ```bash
   npm run dev
   ```
3. Access the browser address returned by the server and navigate to `mind-map-svg-connections/`.

## User Manual

- **Pan Canvas**: Left-click and hold the empty space of the dotted background grid and drag in any direction.
- **Zoom Map**: Scroll your mouse wheel inside the viewport, or use the **Zoom In** (`+`), **Zoom Out** (`-`), and **Reset Zoom** buttons in the header bar.
- **Add Connected Node**: Hover over any node card and click the green `+` action button. A new child node is placed and linked.
- **Edit Node Title**: Double-click the title text inside any node, type your description, and click away or press Enter to save.
- **Delete Node**: Hover over any non-root node and click the red `x` action button. Confirm the deletion to clear the node and all of its sub-branches.
- **Center Workspace**: Click the **Center Map** button to scroll and focus directly onto the Central Idea root node.
