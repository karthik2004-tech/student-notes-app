const STORAGE_KEYS = {
    users: "users",
    currentUser: "currentUser",
    audits: "audits",
    theme: "theme"
};

const pageName = document.body.dataset.page || "";
const isAnalyticsPage = pageName === "analytics";
const isDashboardPage = pageName === "dashboard";
const isAuthPage = pageName === "login" || pageName === "register";
const requiresAuth = document.body.dataset.requiresAuth === "true";

const $ = (id)=> document.getElementById(id);
const currentUser = readJSON(STORAGE_KEYS.currentUser, null);
let currentFilter = "all";
let editingAuditId = null;
let newAuditImageData = "";
let currentAnalyticsSnapshot = null;
const editImageCache = {};

const auditList = $("auditList");
const searchInput = $("searchInput");
const sortSelect = $("sortSelect");
const addAuditBtn = $("addAuditBtn");
const exportAuditsBtn = $("exportAuditsBtn");
const logoutBtn = $("logoutBtn");
const themeToggle = $("themeToggle");
const auditInput = $("auditInput");
const descriptionInput = $("descriptionInput");
const prioritySelect = $("prioritySelect");
const dueDateInput = $("dueDateInput");
const imageInput = $("imageInput");
const imagePreview = $("imagePreview");
const imagePreviewImg = $("imagePreviewImg");
const removeImageBtn = $("removeImageBtn");
const imageValidationMessage = $("imageValidationMessage");
const totalAuditsEl = $("totalAudits");
const pendingAuditsEl = $("pendingAudits");
const passedAuditsEl = $("passedAudits");
const failedAuditsEl = $("failedAudits");
const completionPercentageEl = $("completionPercentage");

const analyticsSummaryTotal = $("summaryTotalActions");
const analyticsSummaryPending = $("summaryOnTimeActions");
const analyticsSummaryPassed = $("summaryDelayedActions");
const analyticsSummaryFailed = $("summaryAverageDelay");
const statusDistributionChart = $("statusDistributionChart");
const statusDistributionLegend = $("statusDistributionLegend");
const committeePerformanceChart = $("committeePerformanceChart");
const averageDelayChart = $("averageDelayChart");
const timelinessChart = $("timelinessChart");
const monthlyTrendChart = $("monthlyTrendChart");
const priorityChart = $("priorityChart");
const memberAccountabilityChart = $("memberAccountabilityChart");
const topDelayedActionsTable = $("topDelayedActionsTable");

function readJSON(key, fallback){
    try{
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
    }catch{
        return fallback;
    }
}

function writeJSON(key, value){
    localStorage.setItem(key, JSON.stringify(value));
}

function escapeHTML(value){
    return String(value || "").replace(/[&<>"]+/g, (match)=> ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;"
    })[match]);
}

function formatPercent(value){
    return `${Math.round(value)}%`;
}

function formatDays(value){
    const days = Math.abs(Math.round(value));
    return days === 1 ? "1 day" : `${days} days`;
}

function normalizeStatus(status){
    const value = String(status || "pending").toLowerCase();
    if(value === "pass" || value === "passed") return "pass";
    if(value === "fail" || value === "failed") return "fail";
    return "pending";
}

function normalizePriority(priority){
    const value = String(priority || "Low");
    if(value === "High" || value === "Medium") return value;
    return "Low";
}

function getAuditTitle(audit){
    return audit.task || audit.title || `Audit ${audit.id}`;
}

function getAuditDescription(audit){
    return audit.description || "";
}

function getToday(){
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function parseLocalDate(value){
    if(!value) return null;
    const parts = value.split("-").map(Number);
    if(parts.length !== 3 || parts.some(Number.isNaN)) return null;
    return new Date(parts[0], parts[1] - 1, parts[2]);
}

function getDueDateInfo(audit){
    const dueDate = parseLocalDate(audit.dueDate);
    if(!dueDate){
        return { state: "none", badge: "", badgeClass: "", dueClass: "", message: "" };
    }

    if(normalizeStatus(audit.status) !== "pending"){
        return { state: "none", badge: "", badgeClass: "", dueClass: "", message: "" };
    }

    const diff = Math.round((dueDate - getToday()) / 86400000);
    if(diff < 0){
        const days = Math.abs(diff);
        return {
            state: "overdue",
            badge: "OVERDUE",
            badgeClass: "overdue-badge",
            dueClass: "overdue-text",
            message: `${formatDays(days)} overdue`
        };
    }
    if(diff === 0){
        return {
            state: "today",
            badge: "DUE TODAY",
            badgeClass: "today-badge",
            dueClass: "due-today-text",
            message: "Due today"
        };
    }
    if(diff <= 3){
        return {
            state: "soon",
            badge: "DUE SOON",
            badgeClass: "soon-badge",
            dueClass: "due-soon-text",
            message: `Due in ${formatDays(diff)}`
        };
    }
    return { state: "future", badge: "", badgeClass: "", dueClass: "future-due-text", message: `Due in ${formatDays(diff)}` };
}

function loadAudits(){
    return readJSON(STORAGE_KEYS.audits, []);
}

function saveAudits(audits){
    writeJSON(STORAGE_KEYS.audits, audits);
    refreshVisiblePage();
}

function loadUsers(){
    return readJSON(STORAGE_KEYS.users, []);
}

function saveUsers(users){
    writeJSON(STORAGE_KEYS.users, users);
}

function isAdmin(){
    return String(currentUser?.role || "User") === "Admin";
}

function redirectToLogin(){
    window.location.href = "login.html";
}

function redirectToDashboard(){
    window.location.href = "index.html";
}

function setTheme(isDark){
    document.body.classList.toggle("dark-mode", isDark);
    if(themeToggle){
        themeToggle.textContent = isDark ? "☀️" : "🌙";
    }
}

function applyStoredTheme(){
    setTheme(localStorage.getItem(STORAGE_KEYS.theme) === "dark");
}

function toggleTheme(){
    const isDark = !document.body.classList.contains("dark-mode");
    localStorage.setItem(STORAGE_KEYS.theme, isDark ? "dark" : "light");
    setTheme(isDark);
}

function protectRoutes(){
    if(requiresAuth && !currentUser) redirectToLogin();
    if(isAuthPage && currentUser) redirectToDashboard();
}

function refreshVisiblePage(){
    applyStoredTheme();
    syncUserHeader();
    if(isDashboardPage) renderDashboard();
    if(isAnalyticsPage) renderAnalyticsDashboard();
}

function syncUserHeader(){
    const sidebarUserName = $("sidebarUserName");
    const userGreeting = $("userGreeting");
    const roleBadge = $("roleBadge");
    if(sidebarUserName && currentUser) sidebarUserName.textContent = currentUser.username;
    if(userGreeting && currentUser) userGreeting.textContent = `Welcome, ${currentUser.username}`;
    if(roleBadge && currentUser) roleBadge.textContent = currentUser.role || "User";
}

function parseStatusLabel(status){
    return normalizeStatus(status) === "pass" ? "Passed" : normalizeStatus(status) === "fail" ? "Failed" : "Pending";
}

function buildAnalyticsSnapshot(audits){
    const normalized = audits.map((audit)=> ({
        ...audit,
        status: normalizeStatus(audit.status),
        priority: normalizePriority(audit.priority)
    }));
    const total = normalized.length;
    const pending = normalized.filter((audit)=> audit.status === "pending");
    const passed = normalized.filter((audit)=> audit.status === "pass");
    const failed = normalized.filter((audit)=> audit.status === "fail");
    const completed = passed.length + failed.length;
    const completionPercentage = total ? Math.round((completed / total) * 100) : 0;
    const passRate = total ? Math.round((passed.length / total) * 100) : 0;
    const failRate = total ? Math.round((failed.length / total) * 100) : 0;
    const pendingRate = total ? Math.round((pending.length / total) * 100) : 0;

        const statusDistribution = [
        { label: "Pending", value: pending.length, color: "#f59e0b", percent: pendingRate },
        { label: "Passed", value: passed.length, color: "#16a34a", percent: passRate },
        { label: "Failed", value: failed.length, color: "#dc2626", percent: failRate }
    ];

    const priorityOrder = ["High", "Medium", "Low"];
    const priorityDistribution = priorityOrder.map((priority)=> {
        const items = normalized.filter((audit)=> audit.priority === priority);
        return {
            label: priority,
            value: items.length,
            percent: total ? Math.round((items.length / total) * 100) : 0,
            color: priority === "High" ? "#dc2626" : priority === "Medium" ? "#f59e0b" : "#2563eb"
        };
    });

    const dueDateCounts = { overdue: 0, today: 0, soon: 0, future: 0 };
    const overdueByPriority = { High: [], Medium: [], Low: [] };
    const delayedAudits = [];

    normalized.forEach((audit)=> {
        const dueDate = parseLocalDate(audit.dueDate);
        if(audit.status === "pending" && dueDate){
            const diff = Math.round((dueDate - getToday()) / 86400000);
            if(diff < 0){
                dueDateCounts.overdue += 1;
            }else if(diff === 0){
                dueDateCounts.today += 1;
            }else if(diff <= 7){
                dueDateCounts.soon += 1;
            }else{
                dueDateCounts.future += 1;
            }
        }

        const info = getDueDateInfo(audit);
        if(info.state === "overdue"){
            const delayDays = Math.abs(Math.round((dueDate - getToday()) / 86400000));
            overdueByPriority[audit.priority].push(delayDays);
            delayedAudits.push({
                id: audit.id,
                task: getAuditTitle(audit),
                description: getAuditDescription(audit),
                priority: audit.priority,
                status: parseStatusLabel(audit.status),
                delayDays,
                dueDate: audit.dueDate || ""
            });
        }
    });

    const dueDateAnalytics = [
        { label: "Overdue", value: dueDateCounts.overdue, color: "#dc2626" },
        { label: "Due Today", value: dueDateCounts.today, color: "#2563eb" },
        { label: "Due Soon", value: dueDateCounts.soon, color: "#f59e0b" },
        { label: "Future", value: dueDateCounts.future, color: "#16a34a" }
    ];

    const averageOverdueByPriority = priorityOrder.map((priority)=> {
        const values = overdueByPriority[priority];
        return {
            label: priority,
            value: values.length ? Math.round(values.reduce((sum, item)=> sum + item, 0) / values.length) : 0,
            color: priority === "High" ? "#dc2626" : priority === "Medium" ? "#f59e0b" : "#2563eb"
        };
    });

    const monthlyTrend = Array.from({ length: 6 }, (_, index)=> {
        const offset = 5 - index;
        const reference = new Date();
        const monthDate = new Date(reference.getFullYear(), reference.getMonth() - offset, 1);
        const month = monthDate.toLocaleString(undefined, { month: "short" });
        const year = monthDate.getFullYear();
        const value = normalized.filter((audit)=> {
            const dueDate = parseLocalDate(audit.dueDate);
            return dueDate && dueDate.getFullYear() === year && dueDate.getMonth() === monthDate.getMonth();
        }).length;
        return { month, value };
    });

    const coverage = [
        { label: "With Description", value: total ? Math.round((normalized.filter((audit)=> getAuditDescription(audit).trim()).length / total) * 100) : 0, color: "#2563eb" },
        { label: "With Image", value: total ? Math.round((normalized.filter((audit)=> audit.image).length / total) * 100) : 0, color: "#16a34a" },
        { label: "With Due Date", value: total ? Math.round((normalized.filter((audit)=> audit.dueDate).length / total) * 100) : 0, color: "#f59e0b" }
    ];

    return {
        total,
        pending: pending.length,
        passed: passed.length,
        failed: failed.length,
        completed,
        completionPercentage,
        passRate,
        failRate,
        pendingRate,
        statusDistribution,
        priorityDistribution,
        priorityAnalytics: priorityDistribution,
        overdueCount: dueDateCounts.overdue,
        dueTodayCount: dueDateCounts.today,
        dueSoonCount: dueDateCounts.soon,
        futureCount: dueDateCounts.future,
        dueDateAnalytics,
        dueDateDistribution: dueDateAnalytics,
        delayedAudits: delayedAudits.sort((first, second)=> second.delayDays - first.delayDays).slice(0, 5),
        averageOverdueByPriority,
        dueMonthTrend: monthlyTrend,
        dataCoverage: coverage
    };
}

function renderDashboard(){
    if(!isDashboardPage) return;
    const audits = loadAudits();
    const snapshot = buildAnalyticsSnapshot(audits);
    if(totalAuditsEl) totalAuditsEl.textContent = snapshot.total;
    if(pendingAuditsEl) pendingAuditsEl.textContent = snapshot.pending;
    if(passedAuditsEl) passedAuditsEl.textContent = snapshot.passed;
    if(failedAuditsEl) failedAuditsEl.textContent = snapshot.failed;
    if(completionPercentageEl) completionPercentageEl.textContent = `${snapshot.completionPercentage}%`;
    renderAudits(audits);
}

function renderAuditCard(audit){
    const status = normalizeStatus(audit.status);
    const info = getDueDateInfo(audit);
    const title = escapeHTML(getAuditTitle(audit));
    const description = escapeHTML(getAuditDescription(audit));
    const image = audit.image ? `<div class="audit-image"><img src="${audit.image}" alt="Audit attachment for ${title}" loading="lazy"></div>` : "";
    const meta = `
        <span class="priority-badge ${(audit.priority || "Low").toLowerCase()}">${escapeHTML(normalizePriority(audit.priority))}</span>
        <span class="due-date ${info.dueClass}">${audit.dueDate ? escapeHTML(audit.dueDate) : "No Due Date"}</span>
        ${info.badge ? `<span class="status-badge ${info.badgeClass}">${info.badge}</span>` : ""}
    `;
    if(editingAuditId === audit.id){
        const cachedImage = editImageCache[audit.id] || audit.image || "";
        return `
            <div class="audit-card editing-card">
                <div class="audit-info edit-audit-info">
                    <span class="edit-mode-badge">Editing Audit</span>
                    <input type="text" class="edit-input" data-edit-field="task" value="${title}" aria-label="Edit audit title">
                    <textarea class="edit-input edit-textarea" data-edit-field="description" rows="3" placeholder="Add description (optional)...">${description}</textarea>
                    <select class="edit-input" data-edit-field="priority" aria-label="Edit priority">
                        <option value="Low" ${normalizePriority(audit.priority) === "Low" ? "selected" : ""}>Low Priority</option>
                        <option value="Medium" ${normalizePriority(audit.priority) === "Medium" ? "selected" : ""}>Medium Priority</option>
                        <option value="High" ${normalizePriority(audit.priority) === "High" ? "selected" : ""}>High Priority</option>
                    </select>
                    <input type="date" class="edit-input" data-edit-field="dueDate" value="${escapeHTML(audit.dueDate || "")}" aria-label="Edit due date">
                    <div class="image-field">
                        <label class="image-label">Audit image (optional)</label>
                        <input type="file" class="edit-input image-input" data-edit-image="${audit.id}" accept="image/jpeg,image/png,image/webp">
                        <p class="image-message" data-edit-image-message="${audit.id}"></p>
                        <div class="image-preview ${cachedImage ? "" : "hidden"}" data-edit-preview="${audit.id}">
                            <img src="${cachedImage}" alt="Selected audit image preview" data-edit-preview-img="${audit.id}">
                            <div class="image-actions">
                                <button type="button" class="remove-image-btn ${cachedImage ? "" : "hidden"}" data-action="remove-edit-image" data-id="${audit.id}">Remove Image</button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="audit-actions">
                    <button class="save-btn" data-action="save-edit" data-id="${audit.id}">Save</button>
                    <button class="cancel-btn" data-action="cancel-edit" data-id="${audit.id}">Cancel</button>
                </div>
            </div>
        `;
    }
    return `
        <div class="audit-card ${info.state === "overdue" ? "overdue-card" : ""}">
            <div class="audit-info">
                <h3>${title}</h3>
                <div class="audit-meta">${meta}</div>
                ${info.message ? `<p class="due-message ${info.dueClass}">${info.message}</p>` : ""}
                ${audit.description ? `<p class="audit-description">${description}</p>` : ""}
                ${image}
                <p>Status: ${parseStatusLabel(status).toUpperCase()}</p>
                ${audit.createdAt ? `<p>${escapeHTML(audit.createdAt)}</p>` : ""}
            </div>
            <div class="audit-actions">${getAuditActions(audit.id)}</div>
        </div>
    `;
}

function getAuditActions(id){
    if(!isAdmin()) return `<span class="permission-note">View Only</span>`;
    return `
        <button class="pass-btn" data-action="pass" data-id="${id}">Pass</button>
        <button class="fail-btn" data-action="fail" data-id="${id}">Fail</button>
        <button class="edit-btn" data-action="edit" data-id="${id}">Edit</button>
        <button class="delete-btn" data-action="delete" data-id="${id}">Delete</button>
    `;
}

function sortAuditsByPriority(items){
    if(!sortSelect || sortSelect.value === "default") return items;
    const rank = { High: 3, Medium: 2, Low: 1 };
    return [...items].sort((a, b)=> sortSelect.value === "high-low"
        ? rank[normalizePriority(b.priority)] - rank[normalizePriority(a.priority)]
        : rank[normalizePriority(a.priority)] - rank[normalizePriority(b.priority)]);
}

function renderAudits(audits = loadAudits()){
    if(!auditList) return;
    const term = (searchInput?.value || "").trim().toLowerCase();
    const filtered = sortAuditsByPriority(audits.filter((audit)=> {
        const title = getAuditTitle(audit).toLowerCase();
        const description = getAuditDescription(audit).toLowerCase();
        const status = normalizeStatus(audit.status);
        return (currentFilter === "all" || status === currentFilter) && (title.includes(term) || description.includes(term));
    }));

    if(!filtered.length){
        auditList.innerHTML = `<div class="audit-card"><div class="audit-info"><h3>No audits found</h3><p class="audit-description">Create an audit or clear your filters to see results.</p></div></div>`;
        return;
    }

    auditList.innerHTML = filtered.map(renderAuditCard).join("");
}

function updateNewImagePreview(dataUrl){
    if(!imagePreview || !imagePreviewImg) return;
    if(dataUrl){
        imagePreviewImg.src = dataUrl;
        imagePreview.classList.remove("hidden");
    }else{
        imagePreviewImg.removeAttribute("src");
        imagePreview.classList.add("hidden");
    }
}

function setImageMessage(element, message, type){
    if(!element) return;
    element.textContent = message;
    element.className = type ? `image-message ${type}` : "image-message";
}

function clearNewImageState(){
    newAuditImageData = "";
    if(imageInput) imageInput.value = "";
    updateNewImagePreview("");
    setImageMessage(imageValidationMessage, "", "");
}

function isSupportedImageFile(file){
    if(!file) return false;
    const name = file.name.toLowerCase();
    return ["image/jpeg", "image/png", "image/webp"].includes(file.type) || [".jpg", ".jpeg", ".png", ".webp"].some((ext)=> name.endsWith(ext));
}

function readImageFileAsDataUrl(file, callback){
    const reader = new FileReader();
    reader.onload = ()=> callback(String(reader.result || ""));
    reader.readAsDataURL(file);
}

function handleNewImageChange(event){
    const file = event.target.files && event.target.files[0];
    if(!file){
        clearNewImageState();
        return;
    }
    if(!isSupportedImageFile(file)){
        event.target.value = "";
        setImageMessage(imageValidationMessage, "Please upload a JPG, JPEG, PNG, or WEBP image.", "error");
        updateNewImagePreview("");
        newAuditImageData = "";
        return;
    }
    readImageFileAsDataUrl(file, (dataUrl)=> {
        newAuditImageData = dataUrl;
        updateNewImagePreview(dataUrl);
        setImageMessage(imageValidationMessage, "Image ready to save.", "success");
    });
}

function addAudit(){
    const task = auditInput?.value.trim();
    if(!task){
        alert("Please enter an audit checkpoint");
        return;
    }
    const audits = loadAudits();
    audits.push({
        id: Date.now(),
        task,
        description: descriptionInput ? descriptionInput.value.trim() : "",
        status: "pending",
        priority: prioritySelect ? prioritySelect.value : "Low",
        dueDate: dueDateInput ? dueDateInput.value : "",
        createdAt: new Date().toLocaleString(),
        image: newAuditImageData
    });
    saveAudits(audits);
    if(auditInput) auditInput.value = "";
    if(descriptionInput) descriptionInput.value = "";
    if(dueDateInput) dueDateInput.value = "";
    clearNewImageState();
}

function editAudit(id){
    if(!isAdmin()) return alert("Only admins can edit audits");
    editingAuditId = id;
    renderDashboard();
}

function cancelEditAudit(){
    editingAuditId = null;
    renderDashboard();
}

function handleEditImageChange(id, file){
    if(!file) return;
    const messageEl = document.querySelector(`[data-edit-image-message="${id}"]`);
    if(!isSupportedImageFile(file)){
        setImageMessage(messageEl, "Please upload a JPG, JPEG, PNG, or WEBP image.", "error");
        return;
    }
    readImageFileAsDataUrl(file, (dataUrl)=> {
        editImageCache[id] = dataUrl;
        const preview = document.querySelector(`[data-edit-preview="${id}"]`);
        const previewImg = document.querySelector(`[data-edit-preview-img="${id}"]`);
        const removeBtn = document.querySelector(`[data-id="${id}"][data-action="remove-edit-image"]`);
        if(preview && previewImg){
            previewImg.src = dataUrl;
            preview.classList.remove("hidden");
        }
        if(removeBtn) removeBtn.classList.remove("hidden");
        setImageMessage(messageEl, "Image ready to save.", "success");
    });
}

function removeEditImage(id){
    editImageCache[id] = "";
    const preview = document.querySelector(`[data-edit-preview="${id}"]`);
    const previewImg = document.querySelector(`[data-edit-preview-img="${id}"]`);
    const removeBtn = document.querySelector(`[data-id="${id}"][data-action="remove-edit-image"]`);
    const messageEl = document.querySelector(`[data-edit-image-message="${id}"]`);
    if(preview) preview.classList.add("hidden");
    if(previewImg) previewImg.removeAttribute("src");
    if(removeBtn) removeBtn.classList.add("hidden");
    setImageMessage(messageEl, "Image removed.", "");
}

function saveEditAudit(id){
    const card = document.querySelector(`.audit-card.editing-card`);
    if(!card) return;
    const audits = loadAudits();
    const audit = audits.find((item)=> String(item.id) === String(id));
    if(!audit) return;
    const titleInput = card.querySelector('[data-edit-field="task"]');
    const descriptionInputField = card.querySelector('[data-edit-field="description"]');
    const priorityInput = card.querySelector('[data-edit-field="priority"]');
    const dueDateInputField = card.querySelector('[data-edit-field="dueDate"]');
    audit.task = titleInput ? titleInput.value.trim() : audit.task;
    audit.description = descriptionInputField ? descriptionInputField.value.trim() : (audit.description || "");
    audit.priority = priorityInput ? priorityInput.value : audit.priority;
    audit.dueDate = dueDateInputField ? dueDateInputField.value : audit.dueDate;
    if(Object.prototype.hasOwnProperty.call(editImageCache, id)) audit.image = editImageCache[id];
    editingAuditId = null;
    delete editImageCache[id];
    saveAudits(audits);
}

function markAuditStatus(id, nextStatus){
    if(!isAdmin()) return alert("Only admins can update audit status");
    const audits = loadAudits();
    const audit = audits.find((item)=> String(item.id) === String(id));
    if(!audit) return;
    audit.status = nextStatus;
    saveAudits(audits);
}

function deleteAudit(id){
    if(!isAdmin()) return alert("Only admins can delete audits");
    if(!confirm("Delete this audit?")) return;
    const audits = loadAudits().filter((audit)=> String(audit.id) !== String(id));
    if(editingAuditId === id) editingAuditId = null;
    saveAudits(audits);
}

function exportAudits(){
    const blob = new Blob([JSON.stringify(loadAudits(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "micro-audits.json";
    link.click();
    URL.revokeObjectURL(url);
}

function handleAuditListClick(event){
    const button = event.target.closest("[data-action]");
    if(!button) return;
    const action = button.dataset.action;
    const id = Number(button.dataset.id);
    if(action === "edit") editAudit(id);
    if(action === "cancel-edit") cancelEditAudit();
    if(action === "save-edit") saveEditAudit(id);
    if(action === "delete") deleteAudit(id);
    if(action === "pass") markAuditStatus(id, "pass");
    if(action === "fail") markAuditStatus(id, "fail");
    if(action === "remove-edit-image") removeEditImage(id);
}

function handleAuditListChange(event){
    const input = event.target;
    if(input.matches('[data-edit-image]')){
        const id = Number(input.dataset.editImage);
        const file = input.files && input.files[0];
        handleEditImageChange(id, file);
    }
}

function updateFilterButtons(activeFilter){
    document.querySelectorAll(".filter-btn").forEach((button)=> {
        button.classList.toggle("active", button.dataset.filter === activeFilter);
    });
}

function buildLineChartSvg(series){
    if(!series.length || series.every((item)=> item.value === 0)) return "";
    const width = 900;
    const height = 260;
    const padX = 44;
    const padY = 30;
    const max = Math.max(1, ...series.map((item)=> item.value));
    const points = series.map((item, index)=> ({
        x: padX + (index * (width - padX * 2)) / Math.max(series.length - 1, 1),
        y: height - padY - ((item.value / max) * (height - padY * 2)),
        ...item
    }));
    const grid = [0.25, 0.5, 0.75].map((ratio)=> {
        const y = padY + (height - padY * 2) * ratio;
        return `<line x1="${padX}" x2="${width - padX}" y1="${y}" y2="${y}" stroke="rgba(148,163,184,0.18)" stroke-dasharray="4 4"></line>`;
    }).join("");
    const line = `<polyline fill="none" stroke="#2563eb" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" points="${points.map((point)=> `${point.x},${point.y}`).join(" ")}"></polyline>`;
    const dots = points.map((point)=> `<circle cx="${point.x}" cy="${point.y}" r="5" fill="#2563eb" stroke="#ffffff" stroke-width="2"></circle>`).join("");
    const labels = points.map((point)=> `<text x="${point.x}" y="235" text-anchor="middle" fill="currentColor" font-size="12">${escapeHTML(point.month)}</text>`).join("");
    return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Monthly audit trend chart">${grid}${line}${dots}${labels}</svg>`;
}

function renderAnalyticsCardList(el, items, emptyMessage, itemRenderer){
    if(!el) return;
    if(!items.length){
        el.innerHTML = `<div class="analytics-placeholder">${emptyMessage}</div>`;
        return;
    }
    el.innerHTML = itemRenderer(items);
}

function renderAnalyticsDashboard(){
    if(!isAnalyticsPage) return;
    currentAnalyticsSnapshot = buildAnalyticsSnapshot(loadAudits());
    const snapshot = currentAnalyticsSnapshot;
    if(analyticsSummaryTotal) analyticsSummaryTotal.textContent = snapshot.total;
    if(analyticsSummaryPending) analyticsSummaryPending.textContent = snapshot.pending;
    if(analyticsSummaryPassed) analyticsSummaryPassed.textContent = snapshot.passed;
    if(analyticsSummaryFailed) analyticsSummaryFailed.textContent = snapshot.failed;

        if(statusDistributionChart && statusDistributionLegend){
        const totalAudits = snapshot.total;
        if(totalAudits === 0){
            statusDistributionChart.innerHTML = '<div class="analytics-placeholder analytics-placeholder--donut">No audit status data yet.</div>';
            statusDistributionLegend.innerHTML = snapshot.statusDistribution.map((item)=> `
                <div class="analytics-legend-item">
                    <div class="analytics-legend-label">
                        <span class="analytics-legend-swatch" style="background:${item.color};"></span>
                        <span>${item.label}</span>
                    </div>
                    <span class="analytics-legend-value">0 (0%)</span>
                </div>
            `).join("");
        }else{
            let running = 0;
            const segments = snapshot.statusDistribution.map((item)=> {
                const start = (running / totalAudits) * 100;
                running += item.value;
                const end = (running / totalAudits) * 100;
                return `${item.color} ${start}% ${end}%`;
            });
            statusDistributionChart.innerHTML = `<div class="analytics-donut" style="background:conic-gradient(${segments.join(", ")});"><div class="analytics-donut-center"><strong>${totalAudits}</strong><span>Total</span></div></div>`;
            statusDistributionLegend.innerHTML = snapshot.statusDistribution.map((item)=> `
                <div class="analytics-legend-item">
                    <div class="analytics-legend-label">
                        <span class="analytics-legend-swatch" style="background:${item.color};"></span>
                        <span>${item.label}</span>
                    </div>
                    <span class="analytics-legend-value">${item.value} (${item.percent}%)</span>
                </div>
            `).join("");
        }
    }

    if(committeePerformanceChart){
        const items = snapshot.priorityDistribution;
        if(!items.some((item)=> item.value)){
            committeePerformanceChart.innerHTML = '<div class="analytics-placeholder analytics-placeholder--bars">No priority data available.</div>';
        }else{
            const max = Math.max(...items.map((item)=> item.value));
            committeePerformanceChart.innerHTML = `<div class="analytics-bar-list">${items.map((item)=> `<div class="analytics-bar-item"><div class="analytics-bar-head"><span>${item.label}</span><span>${item.value} audits (${item.percent}%)</span></div><div class="analytics-bar-track"><div class="analytics-bar-fill" style="width:${max ? (item.value / max) * 100 : 0}%; background:${item.color};"></div></div></div>`).join("")}</div>`;
        }
    }

    if(averageDelayChart){
        const items = snapshot.averageOverdueByPriority;
        if(!items.some((item)=> item.value)){
            averageDelayChart.innerHTML = '<div class="analytics-placeholder analytics-placeholder--list">No overdue audits yet.</div>';
        }else{
            const max = Math.max(...items.map((item)=> item.value));
            averageDelayChart.innerHTML = `<div class="analytics-bar-list">${items.map((item)=> `<div class="analytics-bar-item"><div class="analytics-bar-head"><span>${item.label}</span><span>${item.value} days</span></div><div class="analytics-bar-track"><div class="analytics-bar-fill" style="width:${max ? (item.value / max) * 100 : 0}%; background:${item.color};"></div></div></div>`).join("")}</div>`;
        }
    }

    if(timelinessChart){
        const items = snapshot.dueDateAnalytics || [];
        if(!items.some((item)=> item.value)){
            timelinessChart.innerHTML = '<div class="analytics-placeholder analytics-placeholder--split">No due date analytics available yet.</div>';
        }else{
            const total = items.reduce((sum, item)=> sum + item.value, 0);
            timelinessChart.innerHTML = `<div class="analytics-score-list">${items.map((item)=> `<div class="analytics-score-item"><div class="analytics-score-head"><span>${item.label}</span><span>${item.value}</span></div><div class="analytics-progress-track"><div class="analytics-progress-fill" style="width:${total ? (item.value / total) * 100 : 0}%; background:${item.color};"></div></div><span class="analytics-score-caption">${item.label} audits</span></div>`).join("")}</div>`;
        }
    }

    if(monthlyTrendChart){
        const items = snapshot.dueMonthTrend;
        if(!items.some((item)=> item.value)){
            monthlyTrendChart.innerHTML = '<div class="analytics-placeholder analytics-placeholder--wide">No monthly due date activity yet.</div>';
        }else{
            monthlyTrendChart.innerHTML = `<div class="analytics-line-legend"><span><i class="analytics-line-dot" style="background:#2563eb;"></i> Audits due</span></div><div class="analytics-line-chart">${buildLineChartSvg(items)}</div>`;
        }
    }

    if(priorityChart){
        const items = snapshot.priorityAnalytics || [];
        const totalAudits = snapshot.total || 0;

        if(totalAudits === 0){
            priorityChart.innerHTML = '<div class="analytics-placeholder analytics-placeholder--bars">No priority analytics data yet.</div>';
        }else{
            priorityChart.innerHTML = `<div class="analytics-bar-list">${items.map((item)=> `<div class="analytics-bar-item"><div class="analytics-bar-head"><span>${item.label}</span><span>${item.value} audits (${item.percent}%)</span></div><div class="analytics-bar-track"><div class="analytics-bar-fill" style="width:${item.percent}%; background:${item.color};"></div></div></div>`).join("")}</div>`;
        }
    }

    if(memberAccountabilityChart){
        memberAccountabilityChart.innerHTML = `<div class="analytics-score-list"><div class="analytics-score-item"><div class="analytics-score-head"><span>Completion</span><span>${snapshot.completionPercentage}%</span></div><div class="analytics-progress-track"><div class="analytics-progress-fill" style="width:${snapshot.completionPercentage}%; background:#2563eb;"></div></div><span class="analytics-score-caption">Completed audits</span></div><div class="analytics-score-item"><div class="analytics-score-head"><span>Pass Rate</span><span>${snapshot.passRate}%</span></div><div class="analytics-progress-track"><div class="analytics-progress-fill" style="width:${snapshot.passRate}%; background:#16a34a;"></div></div><span class="analytics-score-caption">Passed audits</span></div><div class="analytics-score-item"><div class="analytics-score-head"><span>Fail Rate</span><span>${snapshot.failRate}%</span></div><div class="analytics-progress-track"><div class="analytics-progress-fill" style="width:${snapshot.failRate}%; background:#dc2626;"></div></div><span class="analytics-score-caption">Failed audits</span></div><div class="analytics-score-item"><div class="analytics-score-head"><span>Pending Rate</span><span>${snapshot.pendingRate}%</span></div><div class="analytics-progress-track"><div class="analytics-progress-fill" style="width:${snapshot.pendingRate}%; background:#f59e0b;"></div></div><span class="analytics-score-caption">Open audits</span></div></div>`;
    }

    if(topDelayedActionsTable){
        const items = snapshot.delayedAudits;
        if(!items.length){
            topDelayedActionsTable.innerHTML = `<div class="analytics-table-row analytics-table-row--head"><span>ID</span><span>Title</span><span>Description</span><span>Priority</span><span>Status</span><span>Delay</span></div><div class="analytics-placeholder analytics-placeholder--wide">No delayed audits found. All current audits are on time.</div>`;
        }else{
            topDelayedActionsTable.innerHTML = `<div class="analytics-table-row analytics-table-row--head"><span>ID</span><span>Title</span><span>Description</span><span>Priority</span><span>Status</span><span>Delay</span></div>${items.map((item)=> `<div class="analytics-table-row"><span>${escapeHTML(item.id)}</span><span>${escapeHTML(item.task)}</span><span>${escapeHTML(item.description || "No description")}</span><span>${escapeHTML(item.priority)}</span><span>${escapeHTML(item.status)}</span><span>${item.delayDays} days</span></div>`).join("")}`;
        }
    }
}

function handleAuthForms(){
    const registerForm = $("registerForm");
    const loginForm = $("loginForm");
    if(registerForm){
        registerForm.addEventListener("submit", (event)=> {
            event.preventDefault();
            const username = $("registerUsername")?.value.trim();
            const email = $("registerEmail")?.value.trim().toLowerCase();
            const password = $("registerPassword")?.value;
            const confirmPassword = $("confirmPassword")?.value;
            const role = $("registerRole")?.value || "User";
            const message = $("registerMessage");
            if(!username || !email || !password || !confirmPassword){
                if(message) message.textContent = "Please fill in every field.";
                return;
            }
            if(password !== confirmPassword){
                if(message) message.textContent = "Passwords do not match.";
                return;
            }
            const users = loadUsers();
            if(users.some((user)=> user.username === username || user.email === email)){
                if(message) message.textContent = "Username or email already exists.";
                return;
            }
            users.push({ id: Date.now(), username, email, password, role });
            saveUsers(users);
            localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify({ username, email, role }));
            redirectToDashboard();
        });
    }
    if(loginForm){
        loginForm.addEventListener("submit", (event)=> {
            event.preventDefault();
            const identifier = $("loginIdentifier")?.value.trim().toLowerCase();
            const password = $("loginPassword")?.value;
            const message = $("loginMessage");
            if(!identifier || !password){
                if(message) message.textContent = "Please enter your username or email and password.";
                return;
            }
            const user = loadUsers().find((item)=> item.username.toLowerCase() === identifier || item.email.toLowerCase() === identifier);
            if(!user || user.password !== password){
                if(message) message.textContent = "Invalid username, email, or password.";
                return;
            }
            localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify({ username: user.username, email: user.email, role: user.role || "User" }));
            redirectToDashboard();
        });
    }
}

function initDashboard(){
    if(themeToggle) themeToggle.addEventListener("click", toggleTheme);
    if(logoutBtn) logoutBtn.addEventListener("click", ()=> { localStorage.removeItem(STORAGE_KEYS.currentUser); redirectToLogin(); });
    if(addAuditBtn) addAuditBtn.addEventListener("click", addAudit);
    if(exportAuditsBtn) exportAuditsBtn.addEventListener("click", exportAudits);
    if(imageInput) imageInput.addEventListener("change", handleNewImageChange);
    if(removeImageBtn) removeImageBtn.addEventListener("click", clearNewImageState);
    if(searchInput) searchInput.addEventListener("input", ()=> renderAudits());
    if(sortSelect) sortSelect.addEventListener("change", ()=> renderAudits());
    document.querySelectorAll(".filter-btn").forEach((button)=> {
        button.addEventListener("click", ()=> {
            currentFilter = button.dataset.filter || "all";
            updateFilterButtons(currentFilter);
            renderAudits();
        });
    });
    if(auditList){
        auditList.addEventListener("click", handleAuditListClick);
        auditList.addEventListener("change", handleAuditListChange);
    }
    syncUserHeader();
    renderDashboard();
}

function initAnalytics(){
    if(themeToggle) themeToggle.addEventListener("click", toggleTheme);
    syncUserHeader();
    renderAnalyticsDashboard();
}

function init(){
    applyStoredTheme();
    protectRoutes();
    handleAuthForms();
    if(isDashboardPage) initDashboard();
    if(isAnalyticsPage) initAnalytics();
    updateFilterButtons(currentFilter);
}

function getAuditActions(id){

    if(!isAdmin()){

        return `
            <span class="permission-note">
                View Only
            </span>
        `;
    }

    return `
        <button
            class="pass-btn"
            onclick="markPass(${id})"
        >
            Pass
        </button>

        <button
            class="fail-btn"
            onclick="markFail(${id})"
        >
            Fail
        </button>

        <button
            class="edit-btn"
            onclick="editAudit(${id})"
        >
            Edit
        </button>

        <button
            class="delete-btn"
            onclick="deleteAudit(${id})"
        >
            Delete
        </button>
    `;
}

/* Edit Audit */

function editAudit(id){

    if(!isAdmin()){

        alert("Only admins can edit audits");

        return;
    }

    editingAuditId = id;

    renderAudits();
}

function saveEditAudit(id){

    if(!isAdmin()){

        alert("Only admins can edit audits");

        return;
    }

    const editTaskInput =
        document.getElementById(`editTask-${id}`);

    const editPrioritySelect =
        document.getElementById(`editPriority-${id}`);

    const editDueDateInput =
        document.getElementById(`editDueDate-${id}`);

    const editDescriptionInput =
        document.getElementById(`editDescription-${id}`);

    const updatedTask = editTaskInput.value.trim();

    if(updatedTask === ""){

        alert("Please enter an audit checkpoint");

        return;
    }

    audits = audits.map((audit)=>{

        if(audit.id === id){

            const cachedImage = editImageCache[id];

            const updatedImage = cachedImage
                ? cachedImage.dataUrl
                : audit.image || "";

            return {
                ...audit,
                task: updatedTask,
                description: editDescriptionInput
                    ? editDescriptionInput.value.trim()
                    : "",
                priority: editPrioritySelect.value,
                dueDate: editDueDateInput.value,
                image: updatedImage
            };
        }

        return audit;
    });

    editingAuditId = null;

    delete editImageCache[id];

    saveAudits();

    renderAudits();
}

function cancelEditAudit(){

    editingAuditId = null;

    editImageCache = {};

    renderAudits();
}

function handleEditImageChange(id){

    const editImageInput =
        document.getElementById(`editImage-${id}`);

    const editImagePreview =
        document.getElementById(`editImagePreview-${id}`);

    const editImagePreviewImg =
        document.getElementById(`editImagePreviewImg-${id}`);

    const editImageMessage =
        document.getElementById(`editImageMessage-${id}`);

    const editImageRemove =
        document.getElementById(`editImageRemove-${id}`);

    const file = editImageInput.files[0];

    if(!file){

        return;
    }

    if(!isSupportedImageFile(file)){

        setImageMessage(
            editImageMessage,
            "Please upload a JPG, JPEG, PNG, or WEBP image.",
            "error"
        );

        editImageInput.value = "";

        return;
    }

    readImageFileAsDataUrl(file, (imageData)=>{

        editImageCache[id] = {
            dataUrl: imageData
        };

        if(editImagePreview && editImagePreviewImg){

            editImagePreviewImg.src = imageData;

            editImagePreview.classList.remove("hidden");
        }

        if(editImageRemove){

            editImageRemove.classList.remove("hidden");
        }

        setImageMessage(
            editImageMessage,
            "Image ready to save.",
            "success"
        );
    });
}

function removeEditImage(id){

    const editImagePreview =
        document.getElementById(`editImagePreview-${id}`);

    const editImagePreviewImg =
        document.getElementById(`editImagePreviewImg-${id}`);

    const editImageMessage =
        document.getElementById(`editImageMessage-${id}`);

    const editImageInput =
        document.getElementById(`editImage-${id}`);

    const editImageRemove =
        document.getElementById(`editImageRemove-${id}`);

    editImageCache[id] = {
        dataUrl: ""
    };

    if(editImageInput){

        editImageInput.value = "";
    }

    if(editImagePreview){

        editImagePreview.classList.add("hidden");
    }

    if(editImagePreviewImg){

        editImagePreviewImg.removeAttribute("src");
    }

    if(editImageRemove){

        editImageRemove.classList.add("hidden");
    }

    setImageMessage(
        editImageMessage,
        "Image will be removed after saving.",
        "success"
    );
}

function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    }[tag]));
}

/* Mark Pass */

function markPass(id){

    if(!isAdmin()){

        alert("Only admins can update audit status");

        return;
    }

    const updatedAudits = loadAudits().map((audit)=>{

        if(String(audit.id) === String(id)){

            audit.status = "pass";
        }

        return audit;
    });

    saveAudits(updatedAudits);
}

/* Mark Fail */

function markFail(id){

    if(!isAdmin()){

        alert("Only admins can update audit status");

        return;
    }

    const updatedAudits = loadAudits().map((audit)=>{

        if(String(audit.id) === String(id)){

            audit.status = "fail";
        }

        return audit;
    });

    saveAudits(updatedAudits);
}

/* Delete Audit */

function deleteAudit(id){

    if(!isAdmin()){

        alert("Only admins can delete audits");

        return;
    }

    const updatedAudits = loadAudits().filter(
        (audit)=> String(audit.id) !== String(id)
    );

    saveAudits(updatedAudits);
}

/* Update Stats */

function updateStats(){

    totalAudits.textContent = audits.length;

    const passed = audits.filter(
        audit => audit.status === "pass"
    ).length;

    const failed = audits.filter(
        audit => audit.status === "fail"
    ).length;

    const pending = audits.filter(
        audit => audit.status === "pending"
    ).length;

    const completed = passed + failed;

    const completion = audits.length === 0
        ? 0
        : Math.round((completed / audits.length) * 100);

    passedAudits.textContent = passed;

    failedAudits.textContent = failed;

    pendingAudits.textContent = pending;

    completionPercentage.textContent = `${completion}%`;
}

/* Save Local Storage */

function saveAudits(auditsToSave){

    localStorage.setItem(
        "audits",
        JSON.stringify(auditsToSave || [])
    );

    refreshVisiblePage();
}

function getAuditsForExport(){

    const storedAuditsRaw = localStorage.getItem("audits");

    if(!storedAuditsRaw){

        return Array.isArray(audits) ? audits.slice() : [];
    }

    try {

        const parsed = JSON.parse(storedAuditsRaw);

        return Array.isArray(parsed) ? parsed : [];

    } catch (error) {

        return Array.isArray(audits) ? audits.slice() : [];
    }
}

function getExportDateStamp(){

    return new Date().toISOString().split("T")[0];
}

function exportAudits(){

    const auditsToExport = getAuditsForExport();

    const exportPayload = {
        exportDate: new Date().toISOString(),
        auditCount: auditsToExport.length,
        audits: auditsToExport
    };

    const exportJson = JSON.stringify(exportPayload, null, 2);

    const exportBlob = new Blob([exportJson], {
        type: "application/json"
    });

    const exportUrl = URL.createObjectURL(exportBlob);

    const downloadLink = document.createElement("a");

    downloadLink.href = exportUrl;
    downloadLink.download =
        `audit-backup-${getExportDateStamp()}.json`;

    document.body.appendChild(downloadLink);

    downloadLink.click();

    downloadLink.remove();

    URL.revokeObjectURL(exportUrl);
}

/* Theme Toggle */

themeToggle.addEventListener("click", ()=>{

    document.body.classList.toggle("dark-mode");

    if(document.body.classList.contains("dark-mode")){

        localStorage.setItem("theme","dark");

        themeToggle.textContent = "☀️";

    } else {

        localStorage.setItem("theme","light");

        themeToggle.textContent = "🌙";
    }
});

/* Load Theme */

const savedTheme = localStorage.getItem("theme");

if(savedTheme === "dark"){

    document.body.classList.add("dark-mode");

    themeToggle.textContent = "☀️";
}

/* Initial Render */

if(isDashboardPage && currentUser){

    renderAudits();
}

window.addEventListener("storage", refreshVisiblePage);
window.addEventListener("focus", refreshVisiblePage);
document.addEventListener("DOMContentLoaded", init);
