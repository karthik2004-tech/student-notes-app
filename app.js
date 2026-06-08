/* ========================================
   GPA CALCULATOR APPLICATION
   
   Architecture:
   - Event Delegation: Single listeners on parent elements
   - Template Cloning: Efficient DOM manipulation
   - Immutable Data Flow: State calculated from DOM
   - Defensive Guardrails: Comprehensive validation
   ======================================== */

// STATE & DOM REFERENCES
const state = {
    nextRowId: 1,
};

const DOM = {
    courseTableBody: document.getElementById('courseTableBody'),
    courseRowTemplate: document.getElementById('courseRowTemplate'),
    gpaValue: document.getElementById('gpaValue'),
    gpaIndicator: document.getElementById('gpaIndicator'),
    gpaStatus: document.getElementById('gpaStatus'),
    addRowBtn: document.getElementById('addRowBtn'),
    resetBtn: document.getElementById('resetBtn'),
};

// DESIGN TOKENS FOR GPA THRESHOLDS
const GPA_THRESHOLDS = {
    EXCELLENT: 8.5,  // >= 8.5 → Success (Green)
    GOOD: 7.0,       // 7.0 - 8.4 → Warning (Orange)
    // < 7.0 → Danger (Red)
};

const INDICATOR_STATES = {
    SUCCESS: 'gpa-indicator--success',
    WARNING: 'gpa-indicator--warning',
    DANGER: 'gpa-indicator--danger',
    NEUTRAL: 'gpa-indicator--neutral',
};

/* ========================================
   PHASE 1: TEMPLATE MANAGEMENT
   ======================================== */

/**
 * Creates a unique ID for each row
 * @returns {string} Unique row identifier
 */
function generateRowId() {
    return `row-${state.nextRowId++}`;
}

/**
 * Clones the course row template and returns a new row element
 * @returns {HTMLTableRowElement} Cloned row element
 */
function createCourseRow() {
    const rowId = generateRowId();
    const clone = DOM.courseRowTemplate.content.cloneNode(true);
    const row = clone.querySelector('tr');
    
    if (row) {
        row.setAttribute('data-row-id', rowId);
    }
    
    return clone;
}

/* ========================================
   PHASE 2: ROW MANAGEMENT ENGINE
   ======================================== */

/**
 * Adds a new empty course row to the table
 */
function addNewRow() {
    const newRow = createCourseRow();
    DOM.courseTableBody.appendChild(newRow);
    
    // Focus on the course name input of the new row
    const inputs = DOM.courseTableBody.querySelectorAll('tr:last-child input');
    if (inputs.length > 0) {
        inputs[0].focus();
    }
    
    // Recalculate GPA whenever a row is added
    calculateAndUpdateGPA();
}

/**
 * Deletes a specific row from the table
 * @param {string} rowId - The ID of the row to delete
 */
function deleteRow(rowId) {
    const row = document.querySelector(`tr[data-row-id="${rowId}"]`);
    if (row) {
        row.remove();
        calculateAndUpdateGPA();
    }
}

/**
 * Clears all rows from the table
 */
function resetAllRows() {
    DOM.courseTableBody.innerHTML = '';
    state.nextRowId = 1;
    calculateAndUpdateGPA();
}

/* ========================================
   PHASE 3: DATA SCRAPING & VALIDATION
   ======================================== */

/**
 * Data validation rules
 */
const VALIDATORS = {
    courseName: (value) => {
        if (!value) return { valid: false, error: 'Course name is required' };
        if (value.trim().length === 0) return { valid: false, error: 'Course name cannot be empty' };
        return { valid: true };
    },
    
    credits: (value) => {
        const num = parseFloat(value);
        if (!value || isNaN(num)) return { valid: false, error: 'Credits are required' };
        if (num <= 0) return { valid: false, error: 'Credits must be positive' };
        if (num > 4) return { valid: false, error: 'Credits cannot exceed 4' };
        return { valid: true };
    },
    
    grade: (value) => {
        if (!value) return { valid: false, error: 'Grade is required' };
        const gradePoint = parseFloat(value);
        if (isNaN(gradePoint) || gradePoint < 0 || gradePoint > 10) {
            return { valid: false, error: 'Invalid grade' };
        }
        return { valid: true };
    }
};

/**
 * Reads course data from the DOM and returns an array of valid courses
 * Filters out incomplete or invalid rows gracefully
 * @returns {Array<Object>} Array of valid course objects
 */
function scrapeCourseData() {
    const rows = DOM.courseTableBody.querySelectorAll('tr.course-row');
    const courses = [];
    
    rows.forEach((row) => {
        const nameInput = row.querySelector('.input--course-name');
        const creditsInput = row.querySelector('.input--credits');
        const gradeSelect = row.querySelector('.input--grade');
        
        const name = nameInput?.value?.trim() || '';
        const credits = creditsInput?.value?.trim() || '';
        const grade = gradeSelect?.value?.trim() || '';
        
        // Check if the row has at least one field filled
        const isPartiallyFilled = name || credits || grade;
        
        // Only validate complete rows
        if (!isPartiallyFilled) return;
        
        const nameValidation = VALIDATORS.courseName(name);
        const creditsValidation = VALIDATORS.credits(credits);
        const gradeValidation = VALIDATORS.grade(grade);
        
        // Only add courses with all valid fields
        if (nameValidation.valid && creditsValidation.valid && gradeValidation.valid) {
            courses.push({
                name: name,
                credits: parseFloat(credits),
                gradePoint: parseFloat(grade),
                rowId: row.getAttribute('data-row-id'),
            });
        }
    });
    
    return courses;
}

/* ========================================
   PHASE 3: CALCULATION ENGINE
   ======================================== */

/**
 * Calculates the Semester GPA (SGPA) using the weighted average formula
 * SGPA = Σ(Course Credits × Grade Points) / Σ(Total Credits)
 * 
 * @param {Array<Object>} courses - Array of course objects with credits and gradePoint
 * @returns {number} Calculated SGPA, or 0 if no valid courses
 */
function calculateSGPA(courses) {
    // Defensive: Handle empty array
    if (!courses || courses.length === 0) {
        return 0;
    }
    
    // Calculate weighted sum and total credits
    let weightedSum = 0;
    let totalCredits = 0;
    
    courses.forEach((course) => {
        // Defensive: Ensure valid numeric values
        const credits = parseFloat(course.credits) || 0;
        const gradePoint = parseFloat(course.gradePoint) || 0;
        
        weightedSum += credits * gradePoint;
        totalCredits += credits;
    });
    
    // Defensive: Prevent division by zero
    if (totalCredits === 0) {
        return 0;
    }
    
    const sgpa = weightedSum / totalCredits;
    
    // Clamp to valid GPA range [0, 10]
    return Math.max(0, Math.min(10, sgpa));
}

/* ========================================
   PHASE 4: UI STATE & UPDATES
   ======================================== */

/**
 * Determines the GPA status color indicator based on thresholds
 * @param {number} gpa - The calculated GPA value
 * @returns {string} CSS class name for the indicator
 */
function getGPAIndicatorClass(gpa) {
    if (gpa >= GPA_THRESHOLDS.EXCELLENT) {
        return INDICATOR_STATES.SUCCESS;
    } else if (gpa >= GPA_THRESHOLDS.GOOD) {
        return INDICATOR_STATES.WARNING;
    } else if (gpa > 0) {
        return INDICATOR_STATES.DANGER;
    } else {
        return INDICATOR_STATES.NEUTRAL;
    }
}

/**
 * Generates a status message based on GPA value and course count
 * @param {number} gpa - The calculated GPA
 * @param {number} courseCount - Number of valid courses
 * @returns {string} Status message
 */
function getGPAStatusMessage(gpa, courseCount) {
    if (courseCount === 0) {
        return 'Add courses to calculate GPA';
    }
    
    if (gpa >= GPA_THRESHOLDS.EXCELLENT) {
        return `Excellent! Your SGPA is ${gpa.toFixed(2)}`;
    } else if (gpa >= GPA_THRESHOLDS.GOOD) {
        return `Good work! Keep it up. SGPA: ${gpa.toFixed(2)}`;
    } else {
        return `You can do better. Focus on improving. SGPA: ${gpa.toFixed(2)}`;
    }
}

/**
 * Updates the GPA display and status in the UI
 * @param {number} gpa - The calculated GPA value
 * @param {number} courseCount - Number of valid courses
 */
function updateGPADisplay(gpa, courseCount) {
    // Update numeric value
    DOM.gpaValue.textContent = gpa.toFixed(2);
    
    // Update indicator color class
    const indicatorClass = getGPAIndicatorClass(gpa);
    DOM.gpaIndicator.className = `gpa-indicator ${indicatorClass}`;
    
    // Update status message
    const statusMessage = getGPAStatusMessage(gpa, courseCount);
    DOM.gpaStatus.textContent = statusMessage;
}

/* ========================================
   ORCHESTRATION: Calculate & Update
   ======================================== */

/**
 * Main function: Orchestrates the complete GPA calculation and UI update flow
 * Called on every input change to ensure real-time accuracy
 */
function calculateAndUpdateGPA() {
    // Phase 1: Scrape & validate data from DOM
    const validCourses = scrapeCourseData();
    
    // Phase 2: Calculate GPA
    const sgpa = calculateSGPA(validCourses);
    
    // Phase 3: Update UI
    updateGPADisplay(sgpa, validCourses.length);
}

/* ========================================
   EVENT DELEGATION
   ========================================
   
   Instead of attaching listeners to every input/button,
   we attach ONE listener to the parent container and
   catch events as they bubble up. This is efficient
   and prevents memory bloat.
   */

/**
 * Event delegation handler for course table
 * Handles delete button clicks and input changes
 */
function handleTableEvent(event) {
    const deleteButton = event.target.closest('[data-action="delete-row"]');
    const input = event.target.closest('.input');
    
    // Handle delete button click
    if (deleteButton) {
        event.preventDefault();
        const row = deleteButton.closest('tr');
        const rowId = row.getAttribute('data-row-id');
        deleteRow(rowId);
        return;
    }
    
    // Handle input changes (credits, grades, course names)
    if (input && (event.type === 'input' || event.type === 'change')) {
        calculateAndUpdateGPA();
        return;
    }
}

/* ========================================
   INITIALIZATION
   ======================================== */

/**
 * Sets up all event listeners and initializes the application
 */
function initializeApp() {
    // Event delegation: Single listener on table body
    DOM.courseTableBody.addEventListener('click', handleTableEvent);
    DOM.courseTableBody.addEventListener('input', handleTableEvent);
    DOM.courseTableBody.addEventListener('change', handleTableEvent);
    
    // Control buttons
    DOM.addRowBtn.addEventListener('click', addNewRow);
    DOM.resetBtn.addEventListener('click', resetAllRows);
    
    // Initial calculation
    calculateAndUpdateGPA();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

/* ========================================
   EXPORT FOR TESTING (Optional)
   ======================================== */

// Uncomment if using a test framework
// export { calculateSGPA, scrapeCourseData, VALIDATORS };
/**
 * app.js
 * Main orchestrator — initializes all modules, wires cross-module events,
 * handles theme toggle, navigation, and daily streak on load.
 */

document.addEventListener('DOMContentLoaded', () => {
  // ── Init all modules ───────────────────────────────────────────────────
  Quotes.display();
  Pomodoro.init();
  Hydration.init();
  Todo.init();
  Stats.init();

  // ── Theme ──────────────────────────────────────────────────────────────
  const savedTheme = localStorage.getItem('theme') || 'dark';
  applyTheme(savedTheme);

  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem('theme', next);
  });

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
  }

  // ── Mobile nav ─────────────────────────────────────────────────────────
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const target = btn.dataset.section;
      document.querySelectorAll('.section').forEach(s => {
        s.classList.toggle('section--active', s.id === target);
      });
    });
  });

  // Activate first section by default on mobile
  const firstNav = document.querySelector('.nav-btn');
  if (firstNav) firstNav.click();

  // ── Cross-module event wiring ──────────────────────────────────────────

  // Pomodoro session complete → celebrate
  document.addEventListener('pomodoro:complete', e => {
    const { sessionCount } = e.detail;
    Celebrations.showModal('pomodoro', `Session #${sessionCount} complete!`);
    Stats.refresh();
  });

  // Task completed → celebrate
  document.addEventListener('todo:task-completed', e => {
    const { task } = e.detail;
    Celebrations.showModal('task', `"${task.text}"`);
    Stats.refresh();
  });

  // Hydration goal → celebrate
  document.addEventListener('hydration:goal-reached', e => {
    Celebrations.showModal('hydration', `${e.detail.glasses} glasses! Daily goal met! 🎉`);
    Stats.refresh();
  });

  // ── Celebration modal close ────────────────────────────────────────────
  document.getElementById('celebration-close')?.addEventListener('click', () => {
    Celebrations.closeModal();
  });
  document.getElementById('celebration-modal')?.addEventListener('click', e => {
    if (e.target.id === 'celebration-modal') Celebrations.closeModal();
  });

  // ── New quote button ───────────────────────────────────────────────────
  document.getElementById('new-quote-btn')?.addEventListener('click', Quotes.display);

  // ── Settings panel toggle ──────────────────────────────────────────────
  document.getElementById('pomo-settings-toggle')?.addEventListener('click', () => {
    const panel = document.getElementById('pomo-settings-panel');
    if (panel) {
      panel.classList.toggle('pomo-settings--open');
      const isOpen = panel.classList.contains('pomo-settings--open');
      document.getElementById('pomo-settings-toggle').textContent = isOpen ? '✕ Close' : '⚙ Settings';
    }
  });

  // ── Daily greeting ────────────────────────────────────────────────────
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const greetEl = document.getElementById('greeting');
  if (greetEl) greetEl.textContent = greeting + '!';

  // ── Keyboard shortcuts ─────────────────────────────────────────────────
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.code === 'Space') { e.preventDefault(); Pomodoro.start(); }
    if (e.code === 'KeyP' && e.ctrlKey) { e.preventDefault(); Pomodoro.pause(); }
    if (e.code === 'KeyR' && e.ctrlKey) { e.preventDefault(); Pomodoro.reset(); }
  });

  // ── Today's date display ──────────────────────────────────────────────
  const dateEl = document.getElementById('today-date');
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString('en', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  console.log('%c🚀 Focus Dashboard loaded!', 'color:#00f5d4;font-size:16px;font-weight:bold;');
  console.log('%c⌨️ Shortcuts: Space=Start, Ctrl+P=Pause, Ctrl+R=Reset', 'color:#f5a623;');
});
