/**
 * ResuMarkdown Core Generator & Print Controls
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

// Preset Demo Software Engineer Resume template
const DEMO_RESUME = `# Alex Mercer
**Seattle, WA** | **(206) 555-0199** | **alex.mercer@email.com** | **github.com/alexmercer**

## Education
**University of Washington** | B.S. in Computer Science | *Expected Graduation: June 2027*
- GPA: 3.85 / 4.00
- Coursework: Data Structures, Algorithms, Systems Programming, Database Management Systems

## Technical Skills
- **Languages:** Python, Java, JavaScript, TypeScript, SQL, HTML/CSS
- **Frameworks & Tools:** React, Node.js, Express, Flask, Git, Docker, PostgreSQL

## Professional Experience
**Software Engineer Intern** | TechFlow Solutions | *June 2025 - September 2025*
- Developed and optimized RESTful APIs using Node.js and Express, reducing server response time by 15%.
- Built a modular analytics dashboard component in React, improving loading performance by 25%.
- Wrote integration test suites using Jest, increasing test coverage from 70% to 88%.

**Web Development Assistant** | UW IT Services | *September 2024 - May 2025*
- Maintained and updated university portal websites servicing over 10,000 active students.
- Collaborated with UX designers to implement fully accessible WCAG 2.1 compliant UI forms.

## Projects
**GitSearch Analytics** | *Python, Flask, React, PostgreSQL* | *January 2025*
- Designed and built a full-stack platform analyzing GitHub repository commit history metrics.
- Leveraged Flask background workers to consume GitHub REST API endpoints concurrently.

**TaskSphere Board** | *React, Tailwind CSS, LocalStorage* | *October 2024*
- Developed a client-side Kanban-style productivity board utilizing drag-and-drop mechanics.
`;

const editor = document.getElementById("markdownEditor");
const paper = document.getElementById("resumePaper");
const templateSelect = document.getElementById("templateSelect");

// Initialize visualizer
document.addEventListener("DOMContentLoaded", () => {
    // Load last draft or preset
    const savedText = StorageUtil.get("resume_markdown_draft", null);
    const savedTemplate = StorageUtil.get("resume_template_style", "classic");
    
    if (savedText) {
        editor.value = savedText;
    } else {
        editor.value = DEMO_RESUME;
    }
    
    templateSelect.value = savedTemplate;
    changeTemplateStyle();
    compileMarkdown();
});

// Convert markdown text to HTML layout
function compileMarkdown() {
    const markdownText = editor.value;
    
    // Marked parsing options
    if (window.marked) {
        const compiledHtml = window.marked.parse(markdownText);
        paper.innerHTML = compiledHtml;
    } else {
        // Fallback simple parsing if library fail to load from CDN
        paper.innerHTML = markdownText.replace(/\n/g, "<br>");
    }
    
    // Caches Draft locally
    StorageUtil.set("resume_markdown_draft", markdownText);
}

// Switches templates classes
function changeTemplateStyle() {
    const val = templateSelect.value;
    
    // Reset classes
    paper.className = "resume-paper";
    
    if (val === "classic") {
        paper.classList.add("template-classic");
    } else if (val === "modern") {
        paper.classList.add("template-modern");
    } else if (val === "minimalist") {
        paper.classList.add("template-minimalist");
    }
    
    StorageUtil.set("resume_template_style", val);
}

// Reset to presets
function loadDemoResume() {
    if (confirm("Reset current draft to demo preset? Any unsaved edits will be lost.")) {
        editor.value = DEMO_RESUME;
        compileMarkdown();
    }
}

// Triggers print dialogue
function exportResumePDF() {
    window.print();
}
