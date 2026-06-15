/**
 * Markdown Documentation Hub & Presentation Slide Compiler
 */

// Preset Demo Template Markdown Content
const DEMO_TEMPLATE = `# 🚀 Next-Gen Web Development
## Building the Future of the Web
**Presenter**: Viswa Mistry
**Date**: June 2026

---

# 🎨 Modern UI Design System
## Core Principles of Premium Design
- **Visual Contrast**: Dark/Light mode tokens
- **Micro-Animations**: Elevating engagement
- **Glassmorphism**: Elegant transparency layers
- **Harmonious Palettes**: Blue, purple, and black

> "Design is not just what it looks like and feels like. Design is how it works."
> — Steve Jobs

---

# 💻 Technology & Performance
## Built with Native Vanilla Web Techs
\`\`\`javascript
// Live Slide Compile Function
function parseMarkdownToSlides(text) {
    const rawSlides = text.split('---');
    return rawSlides.map(slide => {
        return compileMarkdown(slide.trim());
    });
}
\`\`\`
- High performance rendering with zero framework overhead
- Complete responsive viewport flexibility

---

# 🏁 Summary & Roadmap
## What is Next?
1. Support for real-time collaboration decks
2. Seamless PDF print exports templates
3. Markdown to video transitions

*Press Escape (Esc) to exit presentation mode at any time.*
`;

// Startup Initializations
document.addEventListener("DOMContentLoaded", () => {
    // Load Demo Template on initial launch
    document.getElementById("markdownInput").value = DEMO_TEMPLATE;
    onMarkdownChange();
});

function loadDemoTemplate() {
    document.getElementById("markdownInput").value = DEMO_TEMPLATE;
    onMarkdownChange();
}

// Lightweight Markdown Parser
function compileMarkdown(mdText) {
    if (!mdText) return "";

    let html = mdText;

    // Helper to escape HTML tags to avoid breaks
    const escape = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // Code Blocks: ```lang code ```
    html = html.replace(/```([\s\S]*?)```/g, (match, p1) => {
        return `<pre><code>${escape(p1.trim())}</code></pre>`;
    });

    // Code Inline: `code`
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

    // Headers: # H1, ## H2, ### H3
    html = html.replace(/^#\s+(.+)$/gm, "<h1>$1</h1>");
    html = html.replace(/^##\s+(.+)$/gm, "<h2>$1</h2>");
    html = html.replace(/^###\s+(.+)$/gm, "<h3>$1</h3>");

    // Bold: **text**
    html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

    // Italics: *text*
    html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");

    // Blockquotes: > text
    html = html.replace(/^>\s+(.+)$/gm, "<blockquote>$1</blockquote>");

    // Bullet Lists: - item
    // Combine sequential lines starting with '- ' into <ul> list blocks
    html = html.replace(/(?:^-\s+.+\r?\n?)+/gm, (match) => {
        const items = match.trim().split(/\r?\n-/).map(item => {
            let itemText = item.replace(/^-/, "").trim();
            return `<li>${itemText}</li>`;
        }).join("");
        return `<ul>${items}</ul>`;
    });

    // Ordered Lists: 1. item
    html = html.replace(/(?:^\d+\.\s+.+\r?\n?)+/gm, (match) => {
        const items = match.trim().split(/\r?\n\d+\./).map(item => {
            let itemText = item.replace(/^\d+\./, "").replace(/^[^\s]+\s+/, "").trim();
            return `<li>${itemText}</li>`;
        }).join("");
        return `<ol>${items}</ol>`;
    });

    // Paragraph conversion (exclude headings, blockquotes, code, lists, hr tags)
    html = html.replace(/^(?!(?:<h|<ul|<ol|<li|<pre|<block|<hr|<code))(.*)$/gm, (match, p1) => {
        return p1.trim() ? `<p>${p1.trim()}</p>` : "";
    });

    return html;
}

// Markdown Editing handler
function onMarkdownChange() {
    const mdText = document.getElementById("markdownInput").value;
    const previewPane = document.getElementById("previewPane");
    
    // Split slide sections
    const rawSlides = mdText.split(/^-{3,}$/gm);
    
    // Update Slide count badge
    const countBadge = document.getElementById("slideCountBadge");
    countBadge.textContent = `${rawSlides.length} ${rawSlides.length === 1 ? 'Slide' : 'Slides'}`;

    // Render Preview
    let combinedHTML = "";
    rawSlides.forEach((slide, idx) => {
        combinedHTML += compileMarkdown(slide.trim());
        if (idx < rawSlides.length - 1) {
            combinedHTML += "<hr>";
        }
    });

    previewPane.innerHTML = combinedHTML;
}

// Slide Deck Theme Configuration
let activeTheme = "light"; // Default theme mapping

function setSlideTheme(themeName, buttonEl) {
    activeTheme = themeName;
    
    // Toggle active state styling on theme buttons
    const buttons = document.querySelectorAll(".theme-btn");
    buttons.forEach(btn => btn.classList.remove("active"));
    buttonEl.classList.add("active");
}

// Presentation Variables & Engine
let currentSlideIndex = 0;
let totalSlides = 0;
let timerInterval = null;
let elapsedSeconds = 0;
let isTimerRunning = false;

function launchPresentation() {
    const mdText = document.getElementById("markdownInput").value.trim();
    if (!mdText) {
        alert("Please enter some markdown content first!");
        return;
    }

    const rawSlides = mdText.split(/^-{3,}$/gm);
    totalSlides = rawSlides.length;
    currentSlideIndex = 0;

    // Inject Slides into Viewport Frame
    const viewport = document.getElementById("slidesViewport");
    viewport.innerHTML = "";

    rawSlides.forEach((slideMD, idx) => {
        const slideEl = document.createElement("div");
        slideEl.className = `slide-frame theme-preview-${activeTheme}`;
        if (idx === 0) slideEl.classList.add("active");
        slideEl.innerHTML = compileMarkdown(slideMD.trim());
        viewport.appendChild(slideEl);
    });

    // Open Overlay Mode
    const overlay = document.getElementById("presentationOverlay");
    overlay.style.display = "flex";

    // Setup HUD
    updateHudMetrics();

    // Start Timer clock
    resetTimer();
    startTimer();

    // Bind Keyboard event listeners
    document.addEventListener("keydown", handleKeyboardNavigation);
}

function exitPresentation() {
    // Hide Overlay
    const overlay = document.getElementById("presentationOverlay");
    overlay.style.display = "none";

    // Stop Timer
    stopTimer();

    // Remove Event listeners
    document.removeEventListener("keydown", handleKeyboardNavigation);
}

// Presentation Navigation Controls
function navigateSlide(direction) {
    const slides = document.querySelectorAll(".slide-frame");
    if (slides.length === 0) return;

    // Calculate boundary indices
    const targetIndex = currentSlideIndex + direction;
    if (targetIndex < 0 || targetIndex >= totalSlides) return;

    // Toggle active styling triggers
    slides[currentSlideIndex].className = `slide-frame theme-preview-${activeTheme} prev`;
    
    // Set active slide
    currentSlideIndex = targetIndex;
    slides[currentSlideIndex].className = `slide-frame theme-preview-${activeTheme} active`;

    // Reset next slides classes
    for (let i = currentSlideIndex + 1; i < slides.length; i++) {
        slides[i].className = `slide-frame theme-preview-${activeTheme}`;
    }

    // Refresh HUD parameters
    updateHudMetrics();
}

// Keyboard Navigation Handlers
function handleKeyboardNavigation(e) {
    if (e.key === "ArrowRight" || e.key === "Spacebar" || e.key === " ") {
        e.preventDefault();
        navigateSlide(1);
    } else if (e.key === "ArrowLeft" || e.key === "Backspace") {
        e.preventDefault();
        navigateSlide(-1);
    } else if (e.key === "Escape") {
        e.preventDefault();
        exitPresentation();
    }
}

// Click Navigation handler (Left side of viewport = prev, Right side = next)
function handleViewportClick(e) {
    const width = window.innerWidth;
    const clickX = e.clientX;
    
    if (clickX < width / 3) {
        navigateSlide(-1);
    } else {
        navigateSlide(1);
    }
}

// HUD Status & Progress Metrics Update
function updateHudMetrics() {
    document.getElementById("slideIndicatorNum").textContent = `Slide ${currentSlideIndex + 1} of ${totalSlides}`;
    
    // Update progress bar percentage
    const progressFill = document.getElementById("hudProgressFill");
    const percentage = totalSlides > 1 ? (currentSlideIndex / (totalSlides - 1)) * 100 : 100;
    progressFill.style.width = `${percentage}%`;
}

// Presenter clock timer functions
function formatTime(totalSec) {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function startTimer() {
    isTimerRunning = true;
    document.getElementById("timerPlayPauseBtn").textContent = "⏸";
    timerInterval = setInterval(() => {
        elapsedSeconds++;
        document.getElementById("presentationTimer").textContent = formatTime(elapsedSeconds);
    }, 1000);
}

function stopTimer() {
    isTimerRunning = false;
    document.getElementById("timerPlayPauseBtn").textContent = "▶";
    clearInterval(timerInterval);
}

function toggleTimer() {
    if (isTimerRunning) {
        stopTimer();
    } else {
        startTimer();
    }
}

function resetTimer() {
    elapsedSeconds = 0;
    document.getElementById("presentationTimer").textContent = "00:00";
}
