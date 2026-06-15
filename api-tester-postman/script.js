/**
 * PostLite: Core API Tester Interpreter
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

// Application state caches
let requestHistory = [];

// DOM triggers
const methodSelect = document.getElementById("requestMethod");
const urlInput = document.getElementById("requestUrl");
const headersList = document.getElementById("headersList");
const bodyTextarea = document.getElementById("requestBody");
const responseMeta = document.getElementById("responseMeta");
const responseStatus = document.getElementById("responseStatus");
const responseTime = document.getElementById("responseTime");
const responseViewport = document.getElementById("responseViewport");
const historyListContainer = document.getElementById("historyList");
const fetchSnippetCode = document.getElementById("fetchCodeSnippet");

document.addEventListener("DOMContentLoaded", () => {
    // Populate default header
    addHeaderRow("Content-Type", "application/json");
    
    // Load history
    requestHistory = StorageUtil.get("postlite_api_history", []);
    renderHistoryList();
    compileFetchSnippet();
    
    // Bind change update hooks
    methodSelect.addEventListener("change", compileFetchSnippet);
    urlInput.addEventListener("input", compileFetchSnippet);
});

// Switch visual configurator tabs
function switchConfigTab(e, panelId) {
    document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
    document.querySelectorAll(".config-panel").forEach(panel => panel.classList.remove("active"));
    
    e.target.classList.add("active");
    const target = document.getElementById(panelId);
    if (target) target.classList.add("active");
}

// Add Custom Header row dynamically
function addHeaderRow(key = "", val = "") {
    const rowId = `header_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    const div = document.createElement("div");
    div.className = "header-row";
    div.id = rowId;
    
    const inputKey = document.createElement("input");
    inputKey.type = "text";
    inputKey.placeholder = "Key";
    inputKey.value = key;
    inputKey.className = "header-key";
    inputKey.oninput = compileFetchSnippet;
    
    const inputVal = document.createElement("input");
    inputVal.type = "text";
    inputVal.placeholder = "Value";
    inputVal.value = val;
    inputVal.className = "header-value";
    inputVal.oninput = compileFetchSnippet;
    
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn-icon";
    deleteBtn.style.color = "var(--color-delete)";
    deleteBtn.innerHTML = `<i class="fas fa-trash"></i>`;
    deleteBtn.onclick = () => {
        div.remove();
        compileFetchSnippet();
    };
    
    div.appendChild(inputKey);
    div.appendChild(inputVal);
    div.appendChild(deleteBtn);
    
    headersList.appendChild(div);
    compileFetchSnippet();
}

// Compile custom header list into JavaScript objects
function getRequestHeaders() {
    const headers = {};
    const rows = headersList.querySelectorAll(".header-row");
    
    rows.forEach(row => {
        const key = row.querySelector(".header-key").value.trim();
        const val = row.querySelector(".header-value").value.trim();
        if (key) {
            headers[key] = val;
        }
    });
    
    return headers;
}

// Core execution loop making the actual API Fetch requests
async function sendApiRequest() {
    const method = methodSelect.value;
    const url = urlInput.value.trim();
    
    if (!url) {
        alert("Please enter a valid URL.");
        return;
    }
    
    responseViewport.textContent = "Loading response...";
    responseMeta.style.display = "none";
    
    const headers = getRequestHeaders();
    const bodyStr = bodyTextarea.value.trim();
    
    const fetchOptions = {
        method,
        headers
    };
    
    if (method !== "GET" && bodyStr) {
        try {
            // Verify body is valid JSON if not empty
            JSON.parse(bodyStr);
            fetchOptions.body = bodyStr;
        } catch (e) {
            alert(`JSON Payload compilation error: ${e.message}`);
            responseViewport.textContent = "Error: Invalid JSON body payload.";
            return;
        }
    }
    
    const start = performance.now();
    
    try {
        const response = await fetch(url, fetchOptions);
        const end = performance.now();
        const elapsed = Math.round(end - start);
        
        let displayData = "";
        
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const json = await response.json();
            displayData = JSON.stringify(json, null, 2);
        } else {
            displayData = await response.text();
        }
        
        // Render Meta details
        responseMeta.style.display = "flex";
        responseStatus.textContent = `${response.status} ${response.statusText}`;
        responseStatus.className = response.ok ? "status-badge status-success" : "status-badge status-error";
        responseTime.textContent = `${elapsed} ms`;
        
        // Print payload
        responseViewport.textContent = displayData;
        
        // Cache call to history list
        if (response.ok) {
            cacheRequestToHistory(method, url, headers, bodyStr);
        }
        
    } catch (error) {
        const end = performance.now();
        const elapsed = Math.round(end - start);
        
        responseMeta.style.display = "flex";
        responseStatus.textContent = "Error";
        responseStatus.className = "status-badge status-error";
        responseTime.textContent = `${elapsed} ms`;
        
        responseViewport.textContent = `Fetch execution failed.\n\nDetails: ${error.message}\n\nNote: If testing local endpoints, ensure the endpoint supports CORS (Cross-Origin Resource Sharing).`;
    }
}

// Manages local storage history list
function cacheRequestToHistory(method, url, headers, body) {
    // Check if duplicate exists
    requestHistory = requestHistory.filter(item => !(item.method === method && item.url === url));
    
    requestHistory.unshift({
        method,
        url,
        headers,
        body
    });
    
    // Cap at 10 items
    if (requestHistory.length > 10) {
        requestHistory.pop();
    }
    
    StorageUtil.set("postlite_api_history", requestHistory);
    renderHistoryList();
}

// Clear visual history listings
function clearRequestHistory() {
    if (confirm("Are you sure you want to clear request history?")) {
        requestHistory = [];
        StorageUtil.set("postlite_api_history", requestHistory);
        renderHistoryList();
    }
}

// Render dynamic history card list on sidebar panel
function renderHistoryList() {
    historyListContainer.innerHTML = "";
    
    if (requestHistory.length === 0) {
        historyListContainer.innerHTML = `<div class="history-empty">No requests recorded yet.</div>`;
        return;
    }
    
    requestHistory.forEach((item, index) => {
        const div = document.createElement("div");
        div.className = "history-item";
        div.onclick = () => loadHistoryItem(index);
        
        const badge = document.createElement("span");
        badge.className = `history-method method-${item.method}`;
        badge.textContent = item.method;
        
        const urlSpan = document.createElement("span");
        urlSpan.className = "history-url";
        // Extract pathname or host for compact display
        try {
            const parsed = new URL(item.url);
            urlSpan.textContent = parsed.pathname !== "/" ? parsed.pathname : parsed.hostname;
        } catch (e) {
            urlSpan.textContent = item.url;
        }
        
        div.appendChild(badge);
        div.appendChild(urlSpan);
        historyListContainer.appendChild(div);
    });
}

// Loads request attributes back from historical index
function loadHistoryItem(index) {
    const item = requestHistory[index];
    if (!item) return;
    
    methodSelect.value = item.method;
    urlInput.value = item.url;
    bodyTextarea.value = item.body || "";
    
    // Clear current header rows, rebuild
    headersList.innerHTML = "";
    Object.keys(item.headers || {}).forEach(k => {
        addHeaderRow(k, item.headers[k]);
    });
    
    compileFetchSnippet();
}

// Compiles UI inputs into raw JavaScript fetch snippets
function compileFetchSnippet() {
    const method = methodSelect.value;
    const url = urlInput.value.trim() || "https://api.example.com/endpoint";
    const headers = getRequestHeaders();
    const body = bodyTextarea.value.trim();
    
    let options = {
        method
    };
    
    if (Object.keys(headers).length > 0) {
        options.headers = headers;
    }
    
    if (method !== "GET" && body) {
        try {
            options.body = JSON.parse(body);
        } catch (e) {
            options.body = "PLACEHOLDER_INVALID_JSON";
        }
    }
    
    let jsCode = `fetch("${url}", {\n`;
    jsCode += `  method: "${method}",\n`;
    
    if (Object.keys(headers).length > 0) {
        jsCode += `  headers: {\n`;
        Object.keys(headers).forEach(k => {
            jsCode += `    "${k}": "${headers[k]}",\n`;
        });
        jsCode += `  },\n`;
    }
    
    if (method !== "GET" && body) {
        jsCode += `  body: JSON.stringify(${body.replace(/\n/g, '\n  ')})\n`;
    }
    
    // strip trailing comma on object end if no body
    if (jsCode.endsWith(",\n")) {
        jsCode = jsCode.slice(0, -2) + "\n";
    }
    
    jsCode += `})\n.then(response => response.json())\n.then(data => console.log(data))\n.catch(error => console.error(error));`;
    
    fetchSnippetCode.textContent = jsCode;
}

// Copy Code snippets to clipboard
function copyFetchSnippet() {
    const text = fetchSnippetCode.textContent;
    navigator.clipboard.writeText(text).then(() => {
        const copyBtn = document.getElementById("copySnippetIcon");
        copyBtn.className = "fas fa-check";
        copyBtn.style.color = "var(--color-get)";
        
        setTimeout(() => {
            copyBtn.className = "fas fa-copy";
            copyBtn.style.color = "";
        }, 2000);
    });
}
