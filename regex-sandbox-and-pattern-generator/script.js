/**
 * Regex Sandbox & Pattern Generator Core Script
 */

// Curated Regex Pattern Library
const REGEX_RECIPES = [
    {
        name: "Email Validation",
        pattern: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}",
        flags: "g",
        category: "Validation",
        testText: "Contact the team at admin@portfolio-craft.org or send queries to engineering-lead@domain.co.uk. You can also reach user.name_123@sub.main-site.com.",
        desc: "Matches standard email formats containing local names, domain nodes, and top-level suffixes."
    },
    {
        name: "URLs & Domains",
        pattern: "https?:\\/\\/(?:www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b(?:[-a-zA-Z0-9()@:%_\\+.~#?&\\/=]*)",
        flags: "g",
        category: "Parsing",
        testText: "Visit our homepage at https://google.com or check out http://www.subdomain.my-blog.net/posts/123?q=query&category=tech for details.",
        desc: "Identifies HTTP and HTTPS hyperlinked URLs, domains, port numbers, query paths, and hash fragments."
    },
    {
        name: "Phone Numbers",
        pattern: "\\+?\\d{1,4}?[-.\\s]?\\(?\\d{1,3}?\\)?[-.\\s]?\\d{1,4}[-.\\s]?\\d{1,4}[-.\\s]?\\d{1,9}",
        flags: "g",
        category: "Validation",
        testText: "Call our hotline at +1-555-0199 or office numbers like (91) 98765 43210 or 044-2345-6789.",
        desc: "Extracts local and international telephone formats with country codes, braces, and dash separations."
    },
    {
        name: "Strong Password",
        pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$",
        flags: "g",
        category: "Validation",
        testText: "P@ss123\nSuperSecur3!1\nweakpass\nAdmin2026@Secure!\n12345678",
        desc: "Validates passwords: Minimum 8 characters, at least one uppercase letter, one lowercase letter, one number, and one special character."
    },
    {
        name: "Hex Colors",
        pattern: "#[a-fA-F0-9]{3,6}",
        flags: "g",
        category: "Parsing",
        testText: "The primary button color is #3b82f6, the warning color is #f59e0b, and borders use #eee or #4a5b6c.",
        desc: "Matches hex color codes (both 3-digit shorthand and 6-digit standard format)."
    },
    {
        name: "IPv4 Addresses",
        pattern: "\\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b",
        flags: "g",
        category: "Parsing",
        testText: "Local router is at 192.168.1.1, primary DNS is 8.8.8.8, and loopback is 127.0.0.1. An invalid ip like 300.400.1.1 should be ignored.",
        desc: "Matches valid IPv4 addresses, ensuring values in each octet are between 0 and 255."
    },
    {
        name: "Date Format (YYYY-MM-DD)",
        pattern: "\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])",
        flags: "g",
        category: "Validation",
        testText: "The milestone dates are 2026-06-11, 2026-12-31, and 2027-01-01. Incorrect dates like 2026-13-35 should not match.",
        desc: "Validates YYYY-MM-DD date formats with appropriate month ranges (01-12) and day ranges (01-31)."
    },
    {
        name: "HTML Tags",
        pattern: "<([a-z1-6]+)(?:[^<]+)*(?:>.*<\\/\\1>|\\s*\\/>)",
        flags: "g",
        category: "Parsing",
        testText: "<div>Hello World</div>\n<p class=\"text-bold\">Click <a href=\"#\">here</a> to learn more.</p>\n<img src=\"avatar.png\" />",
        desc: "Captures normal and self-closing HTML markup tags and extracts tags names."
    }
];

// Load Sidebar Recipes on Startup
document.addEventListener("DOMContentLoaded", () => {
    renderRecipesList(REGEX_RECIPES);
    
    // Select first recipe as default selection
    selectRecipe(0);
});

function renderRecipesList(recipes) {
    const listContainer = document.getElementById("recipeList");
    if (!listContainer) return;
    
    listContainer.innerHTML = "";
    
    // Group by Category
    const categories = {};
    recipes.forEach((recipe, idx) => {
        if (!categories[recipe.category]) {
            categories[recipe.category] = [];
        }
        categories[recipe.category].push({ ...recipe, index: idx });
    });

    for (const category in categories) {
        // Category Header
        const titleEl = document.createElement("div");
        titleEl.className = "recipe-category-title";
        titleEl.textContent = category;
        listContainer.appendChild(titleEl);

        categories[category].forEach(recipe => {
            const cardEl = document.createElement("button");
            cardEl.className = "recipe-card";
            cardEl.id = `recipe-card-${recipe.index}`;
            cardEl.onclick = () => selectRecipe(recipe.index);

            cardEl.innerHTML = `
                <div class="recipe-name">${recipe.name}</div>
                <div class="recipe-pattern-preview">/${recipe.pattern}/</div>
            `;
            listContainer.appendChild(cardEl);
        });
    }
}

// Select a Recipe and Update workspace
let selectedRecipeIndex = null;

function selectRecipe(idx) {
    selectedRecipeIndex = idx;
    
    // Remove active styling class from cards
    const cards = document.querySelectorAll(".recipe-card");
    cards.forEach(card => card.classList.remove("active"));

    const selectedCard = document.getElementById(`recipe-card-${idx}`);
    if (selectedCard) {
        selectedCard.classList.add("active");
    }

    const recipe = REGEX_RECIPES[idx];
    if (recipe) {
        document.getElementById("regexInput").value = recipe.pattern;
        document.getElementById("flagsInput").value = recipe.flags;
        document.getElementById("testStringInput").value = recipe.testText;
        
        // Sync flags checks
        syncFlagsCheckboxes(recipe.flags);
        
        // Update dashboard outputs
        onRegexChange();
    }
}

// Sync checklist boxes with flag input string
function syncFlagsCheckboxes(flagsString) {
    const flags = ["g", "i", "m", "s", "u", "y"];
    flags.forEach(f => {
        const checkbox = document.getElementById(`flag-${f}`);
        if (checkbox) {
            checkbox.checked = flagsString.includes(f);
        }
    });
}

// Toggles individual flag checkboxes
function toggleFlag(checkbox) {
    const flagVal = checkbox.value;
    const flagsInput = document.getElementById("flagsInput");
    let flagsStr = flagsInput.value;

    if (checkbox.checked) {
        if (!flagsStr.includes(flagVal)) {
            flagsStr += flagVal;
        }
    } else {
        flagsStr = flagsStr.replace(flagVal, "");
    }
    
    // Keep alphabetical order for consistency
    flagsInput.value = flagsStr.split("").sort().join("");
    onRegexChange();
}

// Action triggers on inputs change
function onFlagsInputChange() {
    const flagsInput = document.getElementById("flagsInput").value;
    syncFlagsCheckboxes(flagsInput);
    onRegexChange();
}

function onRegexChange() {
    updateHighlights();
    updateVisualExplainer();
}

// Filter Sidebar Recipes List
function filterRecipes() {
    const query = document.getElementById("recipeSearch").value.toLowerCase().trim();
    const filtered = REGEX_RECIPES.filter(recipe => 
        recipe.name.toLowerCase().includes(query) || 
        recipe.pattern.toLowerCase().includes(query) ||
        recipe.category.toLowerCase().includes(query)
    );
    renderRecipesList(filtered);
    
    // Highlight selected if still in the list
    if (selectedRecipeIndex !== null) {
        const card = document.getElementById(`recipe-card-${selectedRecipeIndex}`);
        if (card) card.classList.add("active");
    }
}

// Compile Regex String safely and highlight matches
function updateHighlights() {
    const pattern = document.getElementById("regexInput").value;
    const flags = document.getElementById("flagsInput").value;
    const testString = document.getElementById("testStringInput").value;
    const statusBadge = document.getElementById("regexStatus");
    const countSpan = document.getElementById("matchCount");
    const outputDiv = document.getElementById("highlightOutput");

    if (!pattern) {
        statusBadge.textContent = "Empty Pattern";
        statusBadge.className = "match-status-badge status-invalid";
        outputDiv.textContent = testString;
        countSpan.textContent = "0";
        return;
    }

    try {
        const regex = new RegExp(pattern, flags);
        statusBadge.textContent = "Valid Expression";
        statusBadge.className = "match-status-badge status-valid";

        let matches = [];
        let matchCount = 0;

        // Escape helper to avoid breaking output layout HTML structure
        const escapeHtml = (str) => {
            return str
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        };

        if (flags.includes('g')) {
            // Use matchAll to collect all match groups index arrays
            const allMatches = [...testString.matchAll(regex)];
            matches = allMatches.map(m => ({
                index: m.index,
                text: m[0],
                length: m[0].length
            }));
            matchCount = matches.length;
        } else {
            // Single exec check
            const singleMatch = regex.exec(testString);
            if (singleMatch) {
                matches = [{
                    index: singleMatch.index,
                    text: singleMatch[0],
                    length: singleMatch[0].length
                }];
                matchCount = 1;
            }
        }

        countSpan.textContent = matchCount;

        // Build Highlight Markup Output
        if (matchCount === 0) {
            outputDiv.innerHTML = escapeHtml(testString);
            return;
        }

        // Sort match ranges to avoid overlap collision
        matches.sort((a, b) => a.index - b.index);

        let outputHTML = "";
        let currentIndex = 0;

        for (let i = 0; i < matches.length; i++) {
            const match = matches[i];
            const start = match.index;
            const end = start + match.length;

            // Edge check for empty matches to prevent infinite loops (like .* or ^ or \b checks)
            if (match.length === 0) {
                if (start === testString.length) break;
                // Move forward 1 char
                outputHTML += escapeHtml(testString.substring(currentIndex, start + 1));
                currentIndex = start + 1;
                continue;
            }

            // Skip if this overlap is already covered
            if (start < currentIndex) continue;

            // Append standard leading string segment
            outputHTML += escapeHtml(testString.substring(currentIndex, start));
            
            // Append styled highlighted match text block
            outputHTML += `<mark>${escapeHtml(testString.substring(start, end))}</mark>`;
            currentIndex = end;
        }

        // Add trailing block
        if (currentIndex < testString.length) {
            outputHTML += escapeHtml(testString.substring(currentIndex));
        }

        outputDiv.innerHTML = outputHTML;

    } catch (e) {
        statusBadge.textContent = `Error: ${e.message}`;
        statusBadge.className = "match-status-badge status-invalid";
        outputDiv.textContent = testString;
        countSpan.textContent = "0";
    }
}

// Regex Tokenizer visual parser generator
function tokenizeRegex(pattern) {
    const tokens = [];
    let i = 0;

    while (i < pattern.length) {
        const char = pattern[i];

        // 1. Escaped Characters
        if (char === '\\') {
            if (i + 1 < pattern.length) {
                const nextChar = pattern[i + 1];
                let desc = `Escaped character literal \`${nextChar}\`.`;
                let type = "literal";

                // Map standard regex escape classes
                const classes = {
                    'd': "Matches any decimal digit character (0-9). Equivalent to `[0-9]`.",
                    'D': "Matches any non-digit character. Equivalent to `[^0-9]`.",
                    'w': "Matches any alphanumeric character plus underscore. Equivalent to `[a-zA-Z0-9_]`.",
                    'W': "Matches any non-alphanumeric character. Equivalent to `[^a-zA-Z0-9_]`.",
                    's': "Matches any whitespace character (spaces, tabs, line breaks).",
                    'S': "Matches any non-whitespace character.",
                    'b': "Matches a word boundary assertion (position between a word character and a non-word character).",
                    'B': "Matches a non-word boundary assertion.",
                    'n': "Matches a newline character.",
                    'r': "Matches a carriage return.",
                    't': "Matches a tab character."
                };

                if (classes[nextChar]) {
                    desc = classes[nextChar];
                    type = nextChar === 'b' || nextChar === 'B' ? "anchor" : "charclass";
                }

                tokens.push({
                    literal: `\\${nextChar}`,
                    type: type,
                    desc: desc
                });
                i += 2;
                continue;
            }
        }

        // 2. Groups (Capturing / Non-Capturing / Lookaheads)
        if (char === '(') {
            let groupLiteral = "(";
            let groupType = "group";
            let desc = "Starts a capturing group. Remembers the matched substring.";
            
            if (pattern.startsWith('(?:', i)) {
                groupLiteral = "(?:";
                desc = "Starts a non-capturing group. Groups sub-patterns without remembering match values.";
                i += 2;
            } else if (pattern.startsWith('(?=', i)) {
                groupLiteral = "(?=";
                desc = "Positive Lookahead assertion. Ensures the pattern matches ahead, but doesn't capture it.";
                i += 2;
            } else if (pattern.startsWith('(?!', i)) {
                groupLiteral = "(?!";
                desc = "Negative Lookahead assertion. Ensures the pattern does NOT match ahead.";
                i += 2;
            }

            tokens.push({
                literal: groupLiteral,
                type: groupType,
                desc: desc
            });
            i++;
            continue;
        }

        if (char === ')') {
            tokens.push({
                literal: ")",
                type: "group",
                desc: "Ends the group boundary segment."
            });
            i++;
            continue;
        }

        // 3. Brackets Sets [ ... ]
        if (char === '[') {
            let bracketContent = "[";
            let idx = i + 1;
            let isNegated = false;

            if (pattern[idx] === '^') {
                bracketContent += "^";
                isNegated = true;
                idx++;
            }

            // Extract set content
            while (idx < pattern.length && pattern[idx] !== ']') {
                bracketContent += pattern[idx];
                idx++;
            }

            if (idx < pattern.length) {
                bracketContent += "]";
            }

            const cleanDesc = isNegated 
                ? `Negated character class set. Matches any character NOT present inside: \`${bracketContent}\`.`
                : `Character class set. Matches any single character present inside: \`${bracketContent}\`.`;

            tokens.push({
                literal: bracketContent,
                type: "charclass",
                desc: cleanDesc
            });

            i = idx + 1;
            continue;
        }

        // 4. Quantifiers (+, *, ?, {n,m})
        if (char === '+' || char === '*' || char === '?') {
            let name = char === '+' ? "One or more" : char === '*' ? "Zero or more" : "Zero or one";
            let behavior = char === '+' ? "matches the preceding element at least once." : char === '*' ? "matches the preceding element zero or more times." : "makes the preceding element optional.";
            
            // Check for lazy quantifier
            let literalVal = char;
            if (i + 1 < pattern.length && pattern[i + 1] === '?') {
                literalVal += "?";
                behavior += " (Lazy match: consumes as few characters as possible).";
                i++;
            }

            tokens.push({
                literal: literalVal,
                type: "quantifier",
                desc: `${name} quantifier: ${behavior}`
            });
            i++;
            continue;
        }

        // Range curly quantifiers
        if (char === '{') {
            let rangeContent = "{";
            let idx = i + 1;
            while (idx < pattern.length && pattern[idx] !== '}') {
                rangeContent += pattern[idx];
                idx++;
            }
            if (idx < pattern.length) {
                rangeContent += "}";
            }

            tokens.push({
                literal: rangeContent,
                type: "quantifier",
                desc: `Range quantifier specifying exact occurrence limits: \`${rangeContent}\`.`
            });
            i = idx + 1;
            continue;
        }

        // 5. Anchors (^, $)
        if (char === '^') {
            tokens.push({
                literal: "^",
                type: "anchor",
                desc: "Matches beginning of the input string (or beginning of line if multiline flag `m` is set)."
            });
            i++;
            continue;
        }
        if (char === '$') {
            tokens.push({
                literal: "$",
                type: "anchor",
                desc: "Matches end of the input string (or end of line if multiline flag `m` is set)."
            });
            i++;
            continue;
        }

        // 6. Dot wildcard
        if (char === '.') {
            tokens.push({
                literal: ".",
                type: "charclass",
                desc: "Dot wildcard character. Matches any character except newlines (unless dotAll flag `s` is set)."
            });
            i++;
            continue;
        }

        // 7. Alternation (OR)
        if (char === '|') {
            tokens.push({
                literal: "|",
                type: "anchor",
                desc: "Alternation (OR operator). Matches either the expression preceding or following the pipe."
            });
            i++;
            continue;
        }

        // 8. Default Literal characters
        tokens.push({
            literal: char,
            type: "literal",
            desc: `Matches literal character \`${char}\` exactly.`
        });
        i++;
    }

    return tokens;
}

// Generate the Visual explanation nodes
function updateVisualExplainer() {
    const pattern = document.getElementById("regexInput").value.trim();
    const container = document.getElementById("tokenExplainerContainer");
    if (!container) return;

    if (!pattern) {
        container.innerHTML = `<p style="font-size: 0.85rem; opacity: 0.7;">No expression pattern input to explain.</p>`;
        return;
    }

    try {
        const tokens = tokenizeRegex(pattern);

        let cardsHTML = "";
        tokens.forEach(t => {
            const badgeClass = `badge-${t.type}`;
            cardsHTML += `
                <div class="token-card">
                    <div class="token-header">
                        <span class="token-literal-value">${escapeHtml(t.literal)}</span>
                        <span class="token-type-badge ${badgeClass}">${t.type}</span>
                    </div>
                    <p class="token-desc">${t.desc}</p>
                </div>
            `;
        });

        container.innerHTML = `
            <div class="token-list">
                ${cardsHTML}
            </div>
        `;

    } catch (e) {
        container.innerHTML = `<p style="color: var(--color-error); font-size: 0.9rem;">Error tokenizing pattern: ${e.message}</p>`;
    }
}

// Helper escape function
function escapeHtml(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
