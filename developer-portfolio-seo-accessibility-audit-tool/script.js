/**
 * Developer Portfolio SEO & Accessibility Audit Engine
 */

// Preset HTML Templates for Quick Testing
const DEMO_TEMPLATES = {
    clean: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Jane Doe | Senior Full-Stack Engineer & Architect</title>
    <meta name="description" content="Welcome to the professional portfolio of Jane Doe, a Senior Full-Stack Developer specializing in React, Node.js, and cloud native architectures. Check my projects!">
    
    <!-- Open Graph Metadata -->
    <meta property="og:title" content="Jane Doe | Senior Full-Stack Engineer">
    <meta property="og:description" content="Explore portfolio projects and software engineering case studies by Jane Doe.">
    <meta property="og:image" content="https://janedoe.dev/assets/og-hero.jpg">
    <meta property="og:url" content="https://janedoe.dev">
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Jane Doe | Software Engineer">
    
    <link rel="canonical" href="https://janedoe.dev">
</head>
<body>
    <header>
        <nav>
            <a href="#projects" aria-label="Skip to portfolio projects">Projects</a>
            <a href="#contact" aria-label="Get in touch with Jane">Contact</a>
        </nav>
    </header>

    <main>
        <h1>Building Scalable, Accessible Web Solutions</h1>
        
        <section id="projects">
            <h2>Featured Projects</h2>
            <article>
                <h3>Smart Analytics Platform</h3>
                <p>A high-performance cloud platform built using Next.js.</p>
                <img src="analytics.png" alt="Screenshot of the Smart Analytics interactive charts dashboard">
            </article>
        </section>

        <section id="contact">
            <h2>Contact Me</h2>
            <form action="/submit" method="POST">
                <label for="email-field">Your Email Address</label>
                <input type="email" id="email-field" placeholder="email@example.com" required>
                
                <button type="submit">Send Message</button>
            </form>
        </section>
    </main>
</body>
</html>`,

    buggy: `<!DOCTYPE html>
<html>
<head>
    <!-- Missing lang attribute in html tag -->
    <title>My Portfolio</title>
    <!-- Title is too short -->
    <!-- Missing meta description -->
    <!-- Missing Open Graph cards -->
    <!-- Missing Viewport meta tag -->
</head>
<body>
    <header>
        <nav>
            <!-- Accessibility bug: empty link and missing aria label -->
            <a href="/home"></a>
        </nav>
    </header>

    <!-- SEO & Accessibility: Two h1 tags -->
    <h1>John's Developer Site</h1>
    <h1>Welcome To My Webpage</h1>

    <main>
        <!-- Accessibility: Image missing alt attribute -->
        <img src="avatar.jpg">

        <section>
            <!-- Accessibility: Header level skipped (h3 without h2) -->
            <h3>Recent Projects</h3>
            
            <!-- Accessibility: Low contrast text color inline-style -->
            <p style="color: #bbbbbb; background-color: #ffffff; padding: 10px;">
                I build websites that are extremely hard to read due to poor color contrast choices.
            </p>
        </section>

        <section id="feedback">
            <h2>Leave Feedback</h2>
            <form>
                <!-- Accessibility: input missing corresponding label element and id -->
                <input type="text" placeholder="Your name here">
                
                <!-- Accessibility: empty button with no text or label -->
                <button type="submit" style="color: #666; background-color: #666; width: 40px; height: 40px;"></button>
            </form>
        </section>
    </main>
</body>
</html>`
};

// Dropzone Drag and Drop Handlers
const dropzone = document.getElementById('dropzone');
if (dropzone) {
    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropzone.style.borderColor = 'var(--accent-color)';
            dropzone.style.background = 'var(--card-bg)';
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropzone.style.borderColor = 'var(--border-color)';
            dropzone.style.background = 'var(--dashboard-grid-bg)';
        }, false);
    });

    dropzone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });
}

function handleFileSelect(event) {
    const files = event.target.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

function handleFile(file) {
    if (!file.name.endsWith('.html') && !file.name.endsWith('.htm')) {
        alert('Please upload a valid HTML file.');
        return;
    }
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('htmlCodeInput').value = e.target.result;
    };
    reader.readAsText(file);
}

function loadTemplate(key) {
    if (DEMO_TEMPLATES[key]) {
        document.getElementById('htmlCodeInput').value = DEMO_TEMPLATES[key];
    }
}

function clearInput() {
    document.getElementById('htmlCodeInput').value = '';
    document.getElementById('scorecardSummary').style.display = 'none';
    document.getElementById('metricsPills').style.display = 'none';
    document.getElementById('auditResultsContainer').innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">🤖</div>
            <h3 class="empty-state-title">Audit Engine Ready</h3>
            <p style="font-size: 0.85rem;">Input your portfolio markup HTML code and press "Run Audit Report" to diagnose accessibility checkpoints and search metadata optimizations.</p>
        </div>
    `;
}

// Helper: Configure Circular SVG Progress
function updateCircleProgress(elementId, textId, score) {
    const circle = document.getElementById(elementId);
    const text = document.getElementById(textId);
    if (!circle || !text) return;

    const radius = parseFloat(circle.getAttribute('r'));
    const circumference = 2 * Math.PI * radius;
    
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    
    // Animate score offset
    const offset = circumference - (score / 100) * circumference;
    circle.style.strokeDashoffset = offset;
    text.textContent = `${Math.round(score)}%`;

    // Dynamic Color Coding based on score boundaries
    if (score >= 90) {
        circle.setAttribute('stroke', 'var(--color-success)');
    } else if (score >= 50) {
        circle.setAttribute('stroke', 'var(--color-warning)');
    } else {
        circle.setAttribute('stroke', 'var(--color-error)');
    }
}

// Color Utility: Parse hex/rgb/hsl to RGB Object
function parseToRGB(colorStr) {
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.fillStyle = colorStr;
    const computed = ctx.fillStyle; // Canvas normalizes to #rrggbb or rgba
    
    if (computed.startsWith('#')) {
        const r = parseInt(computed.slice(1, 3), 16);
        const g = parseInt(computed.slice(3, 5), 16);
        const b = parseInt(computed.slice(5, 7), 16);
        return { r, g, b };
    } else if (computed.startsWith('rgba') || computed.startsWith('rgb')) {
        const matches = computed.match(/\d+/g);
        if (matches && matches.length >= 3) {
            return { r: parseInt(matches[0]), g: parseInt(matches[1]), b: parseInt(matches[2]) };
        }
    }
    return null;
}

// WCAG relative luminance calculation
function getLuminance(r, g, b) {
    const a = [r, g, b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

// WCAG Contrast Calculation
function calculateContrast(color1, color2) {
    const rgb1 = parseToRGB(color1);
    const rgb2 = parseToRGB(color2);
    if (!rgb1 || !rgb2) return null;

    const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
}

// Core Audit Engine Execution
function runAudit() {
    const htmlStr = document.getElementById('htmlCodeInput').value.trim();
    if (!htmlStr) {
        alert('Please paste some HTML code first!');
        return;
    }

    // Initialize Parsers
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlStr, 'text/html');
    
    const audits = {
        seo: [],
        accessibility: []
    };

    let passedCount = 0;
    let warningCount = 0;
    let errorCount = 0;

    // --- SEO RULES CHECKS ---

    // 1. Language tag check
    const htmlTag = doc.querySelector('html');
    if (!htmlTag || !htmlTag.getAttribute('lang')) {
        audits.accessibility.push({
            rule: 'HTML lang attribute',
            status: 'error',
            desc: 'The `<html>` element does not have a declared `lang` attribute.',
            fix: 'Add the `lang` attribute specifying the language of the page, e.g., `<html lang="en">`.'
        });
        errorCount++;
    } else {
        passedCount++;
    }

    // 2. Title tag checks
    const titleTag = doc.querySelector('title');
    if (!titleTag) {
        audits.seo.push({
            rule: 'Meta Title Element',
            status: 'error',
            desc: 'The document does not have a `<title>` tag in the `<head>`.',
            fix: 'Add a `<title>` tag inside the `<head>` of your HTML document.'
        });
        errorCount++;
    } else {
        const titleLen = titleTag.textContent.trim().length;
        if (titleLen < 30) {
            audits.seo.push({
                rule: 'Meta Title Length',
                status: 'warning',
                desc: `Title tag is too short (${titleLen} chars). Recommended length is 40–60 characters.`,
                fix: 'Expand the title to include keywords or context. E.g., `Jane Doe | Portfolio - Full Stack Engineer`.'
            });
            warningCount++;
        } else if (titleLen > 65) {
            audits.seo.push({
                rule: 'Meta Title Length',
                status: 'warning',
                desc: `Title tag is too long (${titleLen} chars). Recommended length is 40–60 characters.`,
                fix: 'Shorten your title tag to prevent text truncation in search results.'
            });
            warningCount++;
        } else {
            passedCount++;
        }
    }

    // 3. Viewport tag check
    const viewportMeta = doc.querySelector('meta[name="viewport"]');
    if (!viewportMeta) {
        audits.seo.push({
            rule: 'Viewport Configuration',
            status: 'error',
            desc: 'No mobile viewport meta tag configuration detected.',
            fix: 'Add `<meta name="viewport" content="width=device-width, initial-scale=1.0">` to support responsive ranking metrics.'
        });
        errorCount++;
    } else {
        passedCount++;
    }

    // 4. Meta description checks
    const descMeta = doc.querySelector('meta[name="description"]');
    if (!descMeta) {
        audits.seo.push({
            rule: 'Meta Description Element',
            status: 'error',
            desc: 'Missing `<meta name="description">` tag.',
            fix: 'Add a meta description to summarize page contents for search queries: `<meta name="description" content="My professional portfolio showcasing React and Node.js projects.">`.'
        });
        errorCount++;
    } else {
        const descLen = descMeta.getAttribute('content').trim().length;
        if (descLen < 100) {
            audits.seo.push({
                rule: 'Meta Description Length',
                status: 'warning',
                desc: `Description text is brief (${descLen} chars). Recommended length is 120–160 characters.`,
                fix: 'Add more details about your specialties, tools, and experience.'
            });
            warningCount++;
        } else if (descLen > 165) {
            audits.seo.push({
                rule: 'Meta Description Length',
                status: 'warning',
                desc: `Description text is too long (${descLen} chars). Search engines will truncate it.`,
                fix: 'Shorten the meta description description below 160 characters.'
            });
            warningCount++;
        } else {
            passedCount++;
        }
    }

    // 5. Open Graph checks
    const ogTitle = doc.querySelector('meta[property="og:title"]');
    const ogImage = doc.querySelector('meta[property="og:image"]');
    if (!ogTitle || !ogImage) {
        audits.seo.push({
            rule: 'Open Graph Cards',
            status: 'warning',
            desc: 'Missing basic Open Graph tags (e.g. `og:title` or `og:image`).',
            fix: 'Add Facebook Open Graph properties inside your `<head>` to improve links preview styling when shared.'
        });
        warningCount++;
    } else {
        passedCount++;
    }

    // 6. Canonical link check
    const canonicalLink = doc.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
        audits.seo.push({
            rule: 'Canonical Tag Configuration',
            status: 'warning',
            desc: 'No canonical URL link is defined.',
            fix: 'Add `<link rel="canonical" href="https://yourportfolio.com">` to avoid duplicate content flags.'
        });
        warningCount++;
    } else {
        passedCount++;
    }

    // 7. Heading h1 outline checks
    const h1s = doc.querySelectorAll('h1');
    if (h1s.length === 0) {
        audits.seo.push({
            rule: 'H1 Header Presence',
            status: 'error',
            desc: 'The page has no `<h1>` heading element.',
            fix: 'Add a single `<h1>` wrapping your portfolio primary header title.'
        });
        errorCount++;
    } else if (h1s.length > 1) {
        audits.seo.push({
            rule: 'Multiple H1 Headers',
            status: 'warning',
            desc: `Found ${h1s.length} different H1 tags. Best practices dictate only one H1 per page for layout SEO context.`,
            fix: 'Ensure there is only one `<h1>` containing the main page heading, and use `<h2>` or `<h3>` for sub-sections.'
        });
        warningCount++;
    } else {
        passedCount++;
    }


    // --- ACCESSIBILITY RULES CHECKS ---

    // 1. Image ALT properties checks
    const images = doc.querySelectorAll('img');
    images.forEach(img => {
        const alt = img.getAttribute('alt');
        const src = img.getAttribute('src') || 'image';
        if (alt === null) {
            audits.accessibility.push({
                rule: 'Image Alt Check',
                status: 'error',
                desc: `Image \`${src}\` is missing its \`alt\` text attribute.`,
                fix: `Add an \`alt\` attribute describing the graphic content: \`<img src="${src}" alt="Screenshot of portfolio analytics dashboard">\`.`
            });
            errorCount++;
        } else if (alt.trim() === '') {
            audits.accessibility.push({
                rule: 'Image Alt Decoration Check',
                status: 'warning',
                desc: `Image \`${src}\` has an empty alt attribute (\`alt=""\`).`,
                fix: 'If this image is structural or decorative, an empty alt is fine. If it conveys data, add descriptive text.'
            });
            warningCount++;
        } else {
            passedCount++;
        }
    });

    // 2. Form control labels binding checks
    const formInputs = doc.querySelectorAll('input:not([type="submit"]):not([type="button"]):not([type="hidden"]), textarea, select');
    formInputs.forEach(input => {
        const inputId = input.getAttribute('id');
        let hasLabel = false;
        
        if (inputId) {
            const correspondingLabel = doc.querySelector(`label[for="${inputId}"]`);
            if (correspondingLabel) hasLabel = true;
        }
        
        // Parent label fallback
        if (!hasLabel && input.closest('label')) {
            hasLabel = true;
        }

        // Aria-label fallbacks
        if (!hasLabel && (input.getAttribute('aria-label') || input.getAttribute('aria-labelledby'))) {
            hasLabel = true;
        }

        if (!hasLabel) {
            const inputName = input.getAttribute('name') || input.getAttribute('placeholder') || 'input field';
            audits.accessibility.push({
                rule: 'Form Label Matching',
                status: 'error',
                desc: `Form input field (\`${inputName}\`) lacks a linked text label.`,
                fix: `Create a \`<label>\` element with a \`for\` attribute matching the input's \`id\`, or add an \`aria-label\` attribute.`
            });
            errorCount++;
        } else {
            passedCount++;
        }
    });

    // 3. Anchor link text / button labels checks
    const interactiveElements = doc.querySelectorAll('a, button');
    interactiveElements.forEach(el => {
        const textContent = el.textContent.trim();
        const ariaLabel = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby');
        const tagName = el.tagName.toLowerCase();
        
        if (!textContent && !ariaLabel) {
            const path = el.getAttribute('href') || 'action element';
            audits.accessibility.push({
                rule: `Interactive ${tagName.toUpperCase()} content`,
                status: 'error',
                desc: `The \`<${tagName}>\` pointing to \`${path}\` has no readable text content or accessible aria-label.`,
                fix: `Provide textual content inside the tags, or add an \`aria-label\` description attribute, e.g. \`<a href="..." aria-label="Github Profile"></a>\`.`
            });
            errorCount++;
        } else {
            passedCount++;
        }
    });

    // 4. Skiped Heading levels checks
    const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let prevLevel = 0;
    headings.forEach(h => {
        const currLevel = parseInt(h.tagName.substring(1));
        if (prevLevel > 0 && currLevel - prevLevel > 1) {
            audits.accessibility.push({
                rule: 'Heading Outline Progression',
                status: 'warning',
                desc: `Heading levels skipped directly from H${prevLevel} to H${currLevel} (\`${h.textContent.trim()}\`).`,
                fix: `Structure headings incrementally: transition to an H${prevLevel + 1} before implementing nested layers.`
            });
            warningCount++;
        } else {
            passedCount++;
        }
        prevLevel = currLevel;
    });

    // 5. CSS Color Contrast checks on inline styling
    const styledElements = doc.querySelectorAll('[style]');
    styledElements.forEach(el => {
        const styleStr = el.getAttribute('style');
        // Match hex color codes or basic color names, rgb/rgba properties
        const colorMatch = styleStr.match(/color\s*:\s*([^;]+)/i);
        const bgMatch = styleStr.match(/background(?:-color)?\s*:\s*([^;]+)/i);

        if (colorMatch && bgMatch) {
            const fgColor = colorMatch[1].trim();
            const bgColor = bgMatch[1].trim();
            const contrast = calculateContrast(fgColor, bgColor);

            if (contrast !== null) {
                const roundedContrast = Math.round(contrast * 100) / 100;
                if (contrast < 4.5) {
                    audits.accessibility.push({
                        rule: 'Color Contrast Ratio',
                        status: 'error',
                        desc: `Text container with inline style \`color: ${fgColor}; background-color: ${bgColor}\` has low contrast ratio (${roundedContrast}:1). WCAG AA requires 4.5:1 minimum.`,
                        fix: `Increase the luminosity difference between the background and text color to exceed a 4.5:1 ratio.`
                    });
                    errorCount++;
                } else {
                    passedCount++;
                }
            }
        }
    });

    // --- RENDER SCORES & STATS ---

    // Calculate score metrics
    const totalChecks = passedCount + warningCount + errorCount;
    
    // SEO Score calculation (weighted)
    const totalSeo = audits.seo.length;
    const seoErrors = audits.seo.filter(a => a.status === 'error').length;
    const seoWarnings = audits.seo.filter(a => a.status === 'warning').length;
    const seoScore = totalSeo === 0 ? 100 : Math.max(0, 100 - (seoErrors * 15) - (seoWarnings * 5));

    // A11y Score calculation (weighted)
    const totalA11y = audits.accessibility.length;
    const a11yErrors = audits.accessibility.filter(a => a.status === 'error').length;
    const a11yWarnings = audits.accessibility.filter(a => a.status === 'warning').length;
    const a11yScore = totalA11y === 0 ? 100 : Math.max(0, 100 - (a11yErrors * 15) - (a11yWarnings * 5));

    // Overall Score
    const overallScore = (seoScore + a11yScore) / 2;

    // Display Widgets
    document.getElementById('scorecardSummary').style.display = 'flex';
    document.getElementById('metricsPills').style.display = 'grid';

    updateCircleProgress('overallCircle', 'overallText', overallScore);
    updateCircleProgress('seoCircle', 'seoText', seoScore);
    updateCircleProgress('accessCircle', 'accessText', a11yScore);

    document.getElementById('errorCount').textContent = errorCount;
    document.getElementById('warningCount').textContent = warningCount;
    document.getElementById('passedCount').textContent = passedCount;

    // Build the accordion results container list
    let listHTML = '';

    const allAudits = [...audits.seo.map(a => ({...a, category: 'SEO'})), ...audits.accessibility.map(a => ({...a, category: 'Accessibility'}))];

    if (allAudits.length === 0) {
        listHTML = `
            <div style="text-align: center; padding: 2rem 1rem;">
                <span style="font-size: 2.5rem;">🎉</span>
                <h4 style="font-weight: 700; color: var(--color-success); margin-top: 0.5rem;">100% Audit Complete</h4>
                <p style="font-size: 0.85rem; opacity: 0.8;">Amazing! Your markup portfolio conforms to standard SEO indexes and Accessibility models.</p>
            </div>
        `;
    } else {
        allAudits.forEach((audit, index) => {
            const badgeClass = audit.status;
            const categoryLabel = audit.category;
            
            listHTML += `
                <div class="audit-item">
                    <div class="audit-item-header" onclick="toggleAuditDetails(${index})">
                        <div class="audit-item-title">
                            <span style="font-size: 0.85rem; padding: 0.15rem 0.4rem; background: var(--border-color); border-radius: 4px;">${categoryLabel}</span>
                            <span>${audit.rule}</span>
                        </div>
                        <span class="audit-badge ${badgeClass}">${audit.status}</span>
                    </div>
                    <div class="audit-item-body" id="audit-body-${index}">
                        <p style="font-weight: 500; margin-bottom: 0.5rem;">${audit.desc}</p>
                        <div class="quick-fix">
                            <strong>Quick Fix:</strong> ${audit.fix}
                        </div>
                    </div>
                </div>
            `;
        });
    }

    document.getElementById('auditResultsContainer').innerHTML = `
        <div class="audit-list">
            ${listHTML}
        </div>
    `;
}

function toggleAuditDetails(index) {
    const el = document.getElementById(`audit-body-${index}`);
    if (el) {
        const isVisible = el.style.display === 'block';
        el.style.display = isVisible ? 'none' : 'block';
    }
}
