/**
 * CronTab Flow: Core Cron Builder & Translation Engines
 */

// LocalStorage Utility Standard
const StorageUtil = { 
    set(key, value) { 
        try { 
            localStorage.setItem(key, JSON.stringify(value)); 
            return true; 
        } catch (error) { 
            console.error('LocalStorage quota exceeded or unavailable:', error); 
            return false; 
        } 
    }, 
    get(key, defaultValue = null) { 
        try { 
            const item = localStorage.getItem(key); 
            return item ? JSON.parse(item) : defaultValue; 
        } catch (error) { 
            console.error('Error reading from LocalStorage:', error); 
            return defaultValue; 
        } 
    } 
};

// Months & Weekdays name mappings
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// DOM elements
const cronInput = document.getElementById("cronExpressionInput");
const translationOutput = document.getElementById("cronEnglishTranslation");
const executionList = document.getElementById("executionList");

// Document Load Init
document.addEventListener("DOMContentLoaded", () => {
    buildCheckboxGrids();
    
    // Attempt loading saved state or default
    const saved = StorageUtil.get("cron_expression_saved", "*/15 9-17 * * 1-5");
    cronInput.value = saved;
    updateCronFromInput();
});

// Programmatically generate checkbox fields inside UI tabs
function buildCheckboxGrids() {
    // 1. Minutes specific options (0-59)
    const minGrid = document.getElementById("minSpecificGrid");
    minGrid.innerHTML = "";
    for (let i = 0; i < 60; i++) {
        minGrid.appendChild(createCheckElement("min", i, i.toString().padStart(2, '0')));
    }

    // 2. Hours specific options (0-23)
    const hourGrid = document.getElementById("hourSpecificGrid");
    hourGrid.innerHTML = "";
    for (let i = 0; i < 24; i++) {
        hourGrid.appendChild(createCheckElement("hour", i, i.toString().padStart(2, '0')));
    }

    // 3. Days specific options (1-31)
    const dayGrid = document.getElementById("daySpecificGrid");
    dayGrid.innerHTML = "";
    for (let i = 1; i <= 31; i++) {
        dayGrid.appendChild(createCheckElement("day", i, i));
    }

    // 4. Months specific options (1-12)
    const monthGrid = document.getElementById("monthSpecificGrid");
    monthGrid.innerHTML = "";
    for (let i = 1; i <= 12; i++) {
        monthGrid.appendChild(createCheckElement("month", i, MONTH_NAMES[i - 1]));
    }

    // 5. Weekdays specific options (0-6)
    const weekdayGrid = document.getElementById("weekdaySpecificGrid");
    weekdayGrid.innerHTML = "";
    for (let i = 0; i < 7; i++) {
        weekdayGrid.appendChild(createCheckElement("weekday", i, WEEKDAY_NAMES[i]));
    }
}

// Checkbox grid row builders
function createCheckElement(prefix, val, label) {
    const wrapper = document.createElement("div");
    wrapper.className = "check-item";
    
    const input = document.createElement("input");
    input.type = "checkbox";
    input.id = `chk-${prefix}-${val}`;
    input.value = val;
    input.onchange = () => {
        // Enforce parent Radio selection switch
        const radio = document.querySelector(`input[name="${prefix}Type"][value="specific"]`);
        if (radio) {
            radio.checked = true;
        }
        updateCronFromUI();
    };
    
    const span = document.createElement("label");
    span.className = "check-label";
    span.setAttribute("for", `chk-${prefix}-${val}`);
    span.textContent = label;
    
    wrapper.appendChild(input);
    wrapper.appendChild(span);
    return wrapper;
}

// Switch Tab panels
function switchTab(e, panelId) {
    document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(panel => panel.classList.remove("active"));
    
    e.target.classList.add("active");
    const target = document.getElementById(panelId);
    if (target) target.classList.add("active");
}

// Selects Step radio option programmatically if step dropdown modifies
function triggerStepRadio(radioName) {
    const radio = document.querySelector(`input[name="${radioName}"][value="step"]`);
    if (radio) radio.checked = true;
    updateCronFromUI();
}

// Parses visual tab builders inputs into a single 5-part cron string
function updateCronFromUI() {
    const parts = [
        getCronFieldFromUI("min", 0, 59),
        getCronFieldFromUI("hour", 0, 23),
        getCronFieldFromUI("day", 1, 31),
        getCronFieldFromUI("month", 1, 12),
        getCronFieldFromUI("weekday", 0, 6)
    ];
    
    const expression = parts.join(" ");
    cronInput.value = expression;
    StorageUtil.set("cron_expression_saved", expression);
    
    resolveTranslationAndExecutions(expression);
}

// Decomposes UI choices to single field component
function getCronFieldFromUI(prefix, minVal, maxVal) {
    const type = document.querySelector(`input[name="${prefix}Type"]:checked`).value;
    
    if (type === "every") {
        return "*";
    }
    
    if (type === "step") {
        const step = document.getElementById(`${prefix}StepValue`).value;
        return `*/${step}`;
    }
    
    if (type === "specific") {
        const checked = Array.from(document.querySelectorAll(`input[id^="chk-${prefix}-"]:checked`))
                             .map(el => parseInt(el.value));
        
        if (checked.length === 0) return "*";
        
        // Return sorted, comma-joined
        return checked.sort((a,b) => a - b).join(",");
    }
    
    return "*";
}

// Preset loaders
function loadCronPreset(expression) {
    cronInput.value = expression;
    updateCronFromInput();
}

// Compiles UI check state items back to sync with pasted raw strings
function updateCronFromInput() {
    const val = cronInput.value.trim();
    StorageUtil.set("cron_expression_saved", val);
    
    const parts = val.split(/\s+/);
    if (parts.length === 5) {
        syncUIFields("min", parts[0], 0, 59);
        syncUIFields("hour", parts[1], 0, 23);
        syncUIFields("day", parts[2], 1, 31);
        syncUIFields("month", parts[3], 1, 12);
        syncUIFields("weekday", parts[4], 0, 6);
    }
    
    resolveTranslationAndExecutions(val);
}

// Helper to check-mark values based on parsed inputs
function syncUIFields(prefix, fieldVal, minVal, maxVal) {
    // Reset specific checkboxes first
    document.querySelectorAll(`input[id^="chk-${prefix}-"]`).forEach(el => el.checked = false);
    
    if (fieldVal === "*") {
        document.querySelector(`input[name="${prefix}Type"][value="every"]`).checked = true;
    } else if (fieldVal.startsWith("*/")) {
        document.querySelector(`input[name="${prefix}Type"][value="step"]`).checked = true;
        const step = fieldVal.split("/")[1];
        const select = document.getElementById(`${prefix}StepValue`);
        if (select) {
            // Find best fit or insert
            select.value = step;
        }
    } else {
        // Assume comma joined specific list or ranges
        document.querySelector(`input[name="${prefix}Type"][value="specific"]`).checked = true;
        const resolvedList = parseCronFieldNumbers(fieldVal, minVal, maxVal);
        resolvedList.forEach(num => {
            const chk = document.getElementById(`chk-${prefix}-${num}`);
            if (chk) chk.checked = true;
        });
    }
}

// Resolves and displays outputs
function resolveTranslationAndExecutions(expression) {
    try {
        const translation = translateCronToEnglish(expression);
        translationOutput.textContent = translation;
        translationOutput.style.borderLeftColor = "var(--accent-color)";
        
        calculateNextExecutions(expression);
    } catch (e) {
        translationOutput.textContent = `Error: ${e.message}`;
        translationOutput.style.borderLeftColor = "var(--error-color)";
        executionList.innerHTML = `<div class="execution-row" style="color:var(--error-color);">Invalid expression structure. Dates cannot be computed.</div>`;
    }
}

// ----------------- CRON TRANSLATOR -----------------
function translateCronToEnglish(expression) {
    const parts = expression.trim().split(/\s+/);
    if (parts.length !== 5) {
        throw new Error("Cron expression must consist of exactly 5 components (Minutes Hours Days Months Weekdays).");
    }
    
    const minText = translateFieldComponent(parts[0], "minute", "every minute", val => `at minute ${val}`);
    const hourText = translateFieldComponent(parts[1], "hour", "every hour", val => `at hour ${val}`);
    const dayText = translateFieldComponent(parts[2], "day of month", "every day", val => `on day ${val}`);
    const monthText = translateFieldComponent(parts[3], "month", "every month", val => MONTH_NAMES[val - 1]);
    const weekdayText = translateFieldComponent(parts[4], "day of week", "every weekday", val => WEEKDAY_NAMES[val]);
    
    // Combine
    let sentence = "Runs ";
    
    if (parts[0] === "*" && parts[1] === "*") {
        sentence += "every minute ";
    } else {
        // format time specific
        if (parts[0].indexOf(",") === -1 && parts[1].indexOf(",") === -1 && !parts[0].includes("*") && !parts[1].includes("*")) {
            sentence += `at ${parts[1].padStart(2, '0')}:${parts[0].padStart(2, '0')} `;
        } else {
            sentence += `${minText} of ${hourText} `;
        }
    }
    
    sentence += `${dayText} `;
    
    if (parts[3] !== "*") {
        sentence += `in ${monthText} `;
    }
    
    if (parts[4] !== "*") {
        sentence += `on ${weekdayText} `;
    }
    
    // Clean spaces and capitalize
    return sentence.replace(/\s+/g, ' ').trim() + ".";
}

function translateFieldComponent(field, noun, defaultTxt, formatFn) {
    if (field === "*") return defaultTxt;
    
    if (field.startsWith("*/")) {
        const step = field.split("/")[1];
        return `every ${step} ${noun}s`;
    }
    
    if (field.includes(",")) {
        const items = field.split(",").map(val => formatFn(val));
        const last = items.pop();
        return items.length > 0 ? `${items.join(", ")} and ${last}` : last;
    }
    
    if (field.includes("-")) {
        const [start, end] = field.split("-").map(Number);
        return `from ${formatFn(start)} through ${formatFn(end)}`;
    }
    
    return formatFn(field);
}

// ----------------- NEXT EXECUTIONS CALCULATOR -----------------
function calculateNextExecutions(expression) {
    const parts = expression.trim().split(/\s+/);
    
    const minutesSet = parseCronFieldNumbers(parts[0], 0, 59);
    const hoursSet = parseCronFieldNumbers(parts[1], 0, 23);
    const daysSet = parseCronFieldNumbers(parts[2], 1, 31);
    const monthsSet = parseCronFieldNumbers(parts[3], 1, 12);
    const weekdaysSet = parseCronFieldNumbers(parts[4], 0, 6);
    
    const nextDates = [];
    let current = new Date();
    // Round current date to start of minute + 1 min to search upcoming
    current.setSeconds(0, 0);
    current.setMinutes(current.getMinutes() + 1);
    
    let safetyCounter = 0;
    const maxIterations = 50000; // safety ceiling
    
    const isDayOfWeekWildcard = parts[4] === "*";
    const isDayOfMonthWildcard = parts[2] === "*";
    
    while (nextDates.length < 5 && safetyCounter < maxIterations) {
        safetyCounter++;
        
        const currentMonth = current.getMonth() + 1; // JS months 0-11
        const currentDay = current.getDate();
        const currentHour = current.getHours();
        const currentMin = current.getMinutes();
        const currentWeekday = current.getDay(); // 0 (Sun) - 6 (Sat)
        
        // Month validation
        if (!monthsSet.includes(currentMonth)) {
            // optimized increment: jump to start of next month
            current.setMonth(current.getMonth() + 1, 1);
            current.setHours(0, 0, 0, 0);
            continue;
        }
        
        // Day validation (Standard Cron exception: if both day of month AND day of week are restricted, matching EITHER triggers execution)
        let dayMatches = false;
        if (!isDayOfMonthWildcard && !isDayOfWeekWildcard) {
            dayMatches = daysSet.includes(currentDay) || weekdaysSet.includes(currentWeekday);
        } else {
            dayMatches = daysSet.includes(currentDay) && weekdaysSet.includes(currentWeekday);
        }
        
        if (!dayMatches) {
            current.setDate(current.getDate() + 1);
            current.setHours(0, 0, 0, 0);
            continue;
        }
        
        // Hour validation
        if (!hoursSet.includes(currentHour)) {
            current.setHours(current.getHours() + 1, 0, 0, 0);
            continue;
        }
        
        // Minute validation
        if (!minutesSet.includes(currentMin)) {
            current.setMinutes(current.getMinutes() + 1);
            continue;
        }
        
        // If all match, push timestamp!
        nextDates.push(new Date(current));
        current.setMinutes(current.getMinutes() + 1);
    }
    
    // Render
    executionList.innerHTML = "";
    if (nextDates.length === 0) {
        executionList.innerHTML = `<div class="execution-row" style="color:var(--error-color);">Could not calculate next executions (Out of limits)</div>`;
        return;
    }
    
    nextDates.forEach((date, index) => {
        const row = document.createElement("div");
        row.className = "execution-row";
        
        const count = document.createElement("span");
        count.className = "execution-index";
        count.textContent = index + 1;
        
        const timeSpan = document.createElement("span");
        timeSpan.className = "execution-time";
        timeSpan.textContent = date.toLocaleString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
        
        row.appendChild(count);
        row.appendChild(timeSpan);
        executionList.appendChild(row);
    });
}

// Helper: Parse cron field expression segments into discrete integer lists
function parseCronFieldNumbers(field, minVal, maxVal) {
    const list = [];
    
    if (field === "*") {
        for (let i = minVal; i <= maxVal; i++) list.push(i);
        return list;
    }
    
    // Handle steps: e.g. */5
    if (field.startsWith("*/")) {
        const step = parseInt(field.split("/")[1]);
        if (isNaN(step) || step <= 0) throw new Error("Invalid step parameter.");
        for (let i = minVal; i <= maxVal; i += step) list.push(i);
        return list;
    }
    
    // Split by comma
    const segments = field.split(",");
    for (let seg of segments) {
        if (seg.includes("-")) {
            // Range: e.g. 1-5
            const [start, end] = seg.split("-").map(Number);
            if (isNaN(start) || isNaN(end) || start < minVal || end > maxVal || start > end) {
                throw new Error(`Invalid range parameters: ${seg}`);
            }
            for (let i = start; i <= end; i++) {
                if (!list.includes(i)) list.push(i);
            }
        } else {
            // Integer absolute
            const num = parseInt(seg);
            if (isNaN(num) || num < minVal || num > maxVal) {
                throw new Error(`Value out of bound limits: ${seg}`);
            }
            if (!list.includes(num)) list.push(num);
        }
    }
    
    return list.sort((a,b) => a - b);
}

// Copy to clipboard utility
function copyCronString() {
    const text = cronInput.value;
    navigator.clipboard.writeText(text).then(() => {
        const copyIcon = document.getElementById("copyIcon");
        copyIcon.className = "fas fa-check";
        copyIcon.style.color = "var(--success-color)";
        
        setTimeout(() => {
            copyIcon.className = "fas fa-copy";
            copyIcon.style.color = "";
        }, 2000);
    });
}
