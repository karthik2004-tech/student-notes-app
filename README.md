# GPA Calculator

A modern, efficient web-based GPA calculator built with semantic HTML, responsive CSS, and vanilla JavaScript using advanced patterns like event delegation and template cloning.

## Features

✨ **Real-Time Calculation** – Instant GPA updates as you type
🎨 **Visual Status Indicators** – Color-coded feedback (Green: Excellent, Orange: Good, Red: Needs Improvement)
📱 **Fully Responsive** – Works seamlessly on desktop, tablet, and mobile
⚡ **Performance Optimized** – Event delegation prevents memory bloat; template cloning avoids costly DOM re-parsing
♿ **Accessible** – Semantic HTML with proper ARIA labels
🎯 **Graceful Validation** – Incomplete rows are skipped; filled rows are validated instantly

## GPA Calculation Formula

The calculator uses the **Semester GPA (SGPA)** formula:

$$\text{SGPA} = \frac{\sum (\text{Course Credits} \times \text{Grade Points})}{\sum \text{Total Credits}}$$

### Grade Scale

| Grade | Points |
|-------|--------|
| O     | 10     |
| A+    | 9      |
| A     | 8      |
| B+    | 7      |
| B     | 6      |
| C     | 5      |
| F     | 0      |

## Architectural Highlights

### Event Delegation
Instead of attaching listeners to every input, a single event listener on the parent `<tbody>` catches all bubbling events. This is significantly more memory-efficient.

```javascript
// One listener captures all delete clicks and input changes
DOM.courseTableBody.addEventListener('click', handleTableEvent);
DOM.courseTableBody.addEventListener('input', handleTableEvent);
```

### Template Cloning
Uses the HTML `<template>` tag for efficient row creation. Cloning a template is faster than constructing HTML strings and using `innerHTML +=`, which forces the browser to re-parse the entire DOM tree.

```javascript
const clone = DOM.courseRowTemplate.content.cloneNode(true);
DOM.courseTableBody.appendChild(clone);
```

### Graceful Validation
- Empty rows are silently ignored
- Incomplete rows (missing course name, credits, or grade) are skipped during calculation
- The calculator corrects itself instantly if a student deletes data mid-entry

### State Synchronization
The GPA is always calculated directly from the current DOM state. No hidden state means no out-of-sync bugs.

## File Structure

```
gpa-calculator/
├── index.html      # Semantic HTML structure with template tag
├── styles.css      # Design tokens, responsive layout, state colors
├── app.js          # Calculation engine, event delegation, DOM manipulation
└── README.md       # This file
```

## Implementation Phases

### Phase 1: Foundation
- ✅ Repository structure with semantic HTML
- ✅ CSS design tokens for colors, typography, spacing
- ✅ Responsive layout using flexbox and CSS grid

### Phase 2: State & DOM Manipulation
- ✅ Template setup for course rows
- ✅ Row management: `addNewRow()`, `deleteRow()`, `resetAllRows()`
- ✅ Event delegation on table body

### Phase 3: Calculation Engine
- ✅ Data scraper: `scrapeCourseData()` reads DOM and returns validated courses
- ✅ SGPA formula: `calculateSGPA(courses)` computes weighted average
- ✅ Defensive guardrails: Division by zero handling, validation, clamping to [0, 10]

### Phase 4: UI Polish
- ✅ Dynamic color indicators based on GPA thresholds (>8.5: Green, >7.0: Orange, else: Red)
- ✅ Real-time status messages
- ✅ Smooth transitions and animations
- ✅ Responsive design with media queries

## Usage

1. **Add Course**: Click the "+ Add Course" button to append a new row
2. **Fill Details**: Enter course name, credits, and select a grade
3. **View GPA**: Your SGPA updates in real-time at the top
4. **Delete Course**: Click the 🗑️ button to remove a course
5. **Reset All**: Click "Reset All" to clear the entire table

## Browser Compatibility

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Requires ES6 support (template literals, arrow functions, const/let)

## Performance Characteristics

- **Memory**: O(n) where n = number of courses
- **Calculation**: O(n) – single pass through courses
- **Event Handlers**: O(1) – constant number regardless of row count
- **DOM Operations**: Optimized through template cloning

## Design Tokens

The color system uses CSS custom properties for consistency:

```css
--color-success: #10b981     /* Green: GPA ≥ 8.5 */
--color-warning: #f59e0b     /* Orange: GPA 7.0–8.4 */
--color-danger: #ef4444      /* Red: GPA < 7.0 */
--color-primary: #2563eb     /* Primary action color */
```

## Future Enhancements

- 📊 Download GPA history as CSV
- 🔄 Cumulative GPA tracking across semesters
- 💾 Local storage to persist data between sessions
- 🌙 Dark mode toggle
- 📋 Course presets for common universities

## License

MIT

---


