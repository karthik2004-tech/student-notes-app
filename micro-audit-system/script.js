let audits = JSON.parse(localStorage.getItem("audits")) || [];

/* Elements */

const auditInput = document.getElementById("auditInput");

const addAuditBtn = document.getElementById("addAuditBtn");

const prioritySelect =
    document.getElementById("prioritySelect");

const dueDateInput =
    document.getElementById("dueDateInput");

const auditList = document.getElementById("auditList");

const totalAudits = document.getElementById("totalAudits");

const pendingAudits = document.getElementById("pendingAudits");

const passedAudits = document.getElementById("passedAudits");

const failedAudits = document.getElementById("failedAudits");

const completionPercentage =
    document.getElementById("completionPercentage");

const statsContainer =
    document.querySelector(".stats-container");

const themeToggle = document.getElementById("themeToggle");

const searchInput = document.getElementById("searchInput");

const sortSelect = document.getElementById("sortSelect");

const filterButtons = document.querySelectorAll(".filter-btn");

const registerForm = document.getElementById("registerForm");

const loginForm = document.getElementById("loginForm");

const logoutBtn = document.getElementById("logoutBtn");

const userGreeting = document.getElementById("userGreeting");

const roleBadge = document.getElementById("roleBadge");

let currentFilter = "all";

let editingAuditId = null;

const currentUser =
    JSON.parse(localStorage.getItem("currentUser")) || null;

const currentUserRole = currentUser
    ? currentUser.role || "User"
    : "";

const isDashboardPage = Boolean(auditList);

const isAuthPage = Boolean(registerForm || loginForm);

/* Auth Helpers */

function getUsers(){

    return JSON.parse(localStorage.getItem("users")) || [];
}

function saveUsers(users){

    localStorage.setItem("users", JSON.stringify(users));
}

function setFormMessage(element, message, type){

    if(!element){

        return;
    }

    element.textContent = message;

    element.className = `form-message ${type}`;
}

function isValidEmail(email){

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isAdmin(){

    return currentUserRole === "Admin";
}

function redirectToDashboard(){

    window.location.href = "index.html";
}

function redirectToLogin(){

    window.location.href = "login.html";
}

function protectRoutes(){

    if(isDashboardPage && !currentUser){

        redirectToLogin();
    }

    if(isAuthPage && currentUser){

        redirectToDashboard();
    }
}

protectRoutes();

/* Add Audit */

if(addAuditBtn){

    addAuditBtn.addEventListener("click", addAudit);
}

if(searchInput){

    searchInput.addEventListener("input", renderAudits);
}

if(sortSelect){

    sortSelect.addEventListener("change", renderAudits);
}

if(userGreeting && currentUser){

    userGreeting.textContent = `Welcome, ${currentUser.username}`;
}

if(roleBadge && currentUser){

    roleBadge.textContent = currentUserRole;

    roleBadge.classList.add(currentUserRole.toLowerCase());
}

if(statsContainer && currentUser && !isAdmin()){

    statsContainer.classList.add("hidden");
}

if(logoutBtn){

    logoutBtn.addEventListener("click", logoutUser);
}

if(registerForm){

    registerForm.addEventListener("submit", registerUser);
}

if(loginForm){

    loginForm.addEventListener("submit", loginUser);
}

filterButtons.forEach((btn) => {

    btn.addEventListener("click", () => {

        filterButtons.forEach((b) => b.classList.remove("active"));

        btn.classList.add("active");

        currentFilter = btn.dataset.filter;

        renderAudits();
    });
});

function registerUser(event){

    event.preventDefault();

    const username =
        document.getElementById("registerUsername").value.trim();

    const email =
        document.getElementById("registerEmail").value.trim();

    const password =
        document.getElementById("registerPassword").value;

    const confirmPassword =
        document.getElementById("confirmPassword").value;

    const role =
        document.getElementById("registerRole").value;

    const registerMessage =
        document.getElementById("registerMessage");

    if(!username || !email || !password || !confirmPassword){

        setFormMessage(
            registerMessage,
            "Please fill in all fields",
            "error"
        );

        return;
    }

    if(!isValidEmail(email)){

        setFormMessage(
            registerMessage,
            "Please enter a valid email address",
            "error"
        );

        return;
    }

    if(password !== confirmPassword){

        setFormMessage(
            registerMessage,
            "Passwords do not match",
            "error"
        );

        return;
    }

    const users = getUsers();

    const userExists = users.some((user)=>
        user.username.toLowerCase() === username.toLowerCase() ||
        user.email.toLowerCase() === email.toLowerCase()
    );

    if(userExists){

        setFormMessage(
            registerMessage,
            "Username or email already exists",
            "error"
        );

        return;
    }

    users.push({
        id: Date.now(),
        username: username,
        email: email,
        password: password,
        role: role
    });

    saveUsers(users);

    setFormMessage(
        registerMessage,
        "Registration successful. Redirecting to login...",
        "success"
    );

    setTimeout(redirectToLogin, 700);
}

function loginUser(event){

    event.preventDefault();

    const identifier =
        document.getElementById("loginIdentifier").value.trim();

    const password =
        document.getElementById("loginPassword").value;

    const loginMessage =
        document.getElementById("loginMessage");

    if(!identifier || !password){

        setFormMessage(
            loginMessage,
            "Please enter your username or email and password",
            "error"
        );

        return;
    }

    const users = getUsers();

    const user = users.find((savedUser)=>
        (
            savedUser.username.toLowerCase() ===
                identifier.toLowerCase() ||
            savedUser.email.toLowerCase() ===
                identifier.toLowerCase()
        ) &&
        savedUser.password === password
    );

    if(!user){

        setFormMessage(
            loginMessage,
            "Invalid username, email, or password",
            "error"
        );

        return;
    }

    localStorage.setItem(
        "currentUser",
        JSON.stringify({
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role || "User"
        })
    );

    redirectToDashboard();
}

function logoutUser(){

    localStorage.removeItem("currentUser");

    redirectToLogin();
}

function addAudit(){

    const task = auditInput.value.trim();

    if(task === ""){

        alert("Please enter an audit checkpoint");

        return;
    }

const audit = {

    id:Date.now(),

    task:task,

    status:"pending",

    priority: prioritySelect.value,

    dueDate: dueDateInput.value,

    createdAt:new Date().toLocaleString()
};

    audits.push(audit);

    saveAudits();

    auditInput.value = "";

    renderAudits();
}

/* Due Date Helpers */

function parseLocalDate(dateValue){

    if(!dateValue){

        return null;
    }

    const dateParts = dateValue.split("-");

    return new Date(
        Number(dateParts[0]),
        Number(dateParts[1]) - 1,
        Number(dateParts[2])
    );
}

function getTodayDate(){

    const today = new Date();

    return new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
    );
}

function getDueDateInfo(audit){

    if(!audit.dueDate){

        return {
            badge: "",
            badgeClass: "",
            dueClass: "",
            message: ""
        };
    }

    const dueDate = parseLocalDate(audit.dueDate);

    const today = getTodayDate();

    const millisecondsPerDay = 1000 * 60 * 60 * 24;

    const daysDifference = Math.round(
        (dueDate - today) / millisecondsPerDay
    );

    if(daysDifference === 0){

        return {
            badge: "DUE TODAY",
            badgeClass: "today-badge",
            dueClass: "due-today-text",
            message: "Due today"
        };
    }

    if(audit.status !== "pending"){

        return {
            badge: "",
            badgeClass: "",
            dueClass: "",
            message: ""
        };
    }

    if(daysDifference < 0){

        const overdueDays = Math.abs(daysDifference);

        return {
            badge: "OVERDUE",
            badgeClass: "overdue-badge",
            dueClass: "overdue-text",
            message:
                overdueDays === 1
                    ? "1 day overdue"
                    : `${overdueDays} days overdue`
        };
    }

    if(daysDifference <= 3){

        return {
            badge: "DUE SOON",
            badgeClass: "soon-badge",
            dueClass: "due-soon-text",
            message:
                daysDifference === 1
                    ? "Due in 1 day"
                    : `Due in ${daysDifference} days`
        };
    }

    return {
        badge: "",
        badgeClass: "",
        dueClass: "future-due-text",
        message: `Due in ${daysDifference} days`
    };
}

/* Sorting Helpers */

function getPriorityValue(priority){

    const priorityValues = {
        High: 3,
        Medium: 2,
        Low: 1
    };

    return priorityValues[priority] || priorityValues.Low;
}

function sortAuditsByPriority(filteredAudits){

    if(!sortSelect || sortSelect.value === "default"){

        return filteredAudits;
    }

    return [...filteredAudits].sort((firstAudit, secondAudit)=>{

        const firstPriority =
            getPriorityValue(firstAudit.priority || "Low");

        const secondPriority =
            getPriorityValue(secondAudit.priority || "Low");

        if(sortSelect.value === "high-low"){

            return secondPriority - firstPriority;
        }

        return firstPriority - secondPriority;
    });
}

/* Render Audits */

function renderAudits(){

    auditList.innerHTML = "";

    const searchValue = searchInput.value.toLowerCase();

const filteredAudits = audits.filter((audit)=>{

    const matchesSearch =
        audit.task.toLowerCase().includes(searchValue);

    const matchesFilter =
        currentFilter === "all" ||
        audit.status === currentFilter;

    return matchesSearch && matchesFilter;
});

const sortedAudits = sortAuditsByPriority(filteredAudits);

sortedAudits.forEach((audit)=>{

        const dueDateInfo = getDueDateInfo(audit);

        const isEditing = editingAuditId === audit.id;

        const card = document.createElement("div");

        card.className = [
            "audit-card",
            dueDateInfo.badge === "OVERDUE" ? "overdue-card" : "",
            isEditing ? "editing-card" : ""
        ].filter(Boolean).join(" ");

        if(isEditing){

            card.innerHTML = `

            <div class="audit-info edit-audit-info">

                <span class="edit-mode-badge">
                    Editing Audit
                </span>

                <input
                    type="text"
                    id="editTask-${audit.id}"
                    class="edit-input"
                    value="${escapeHTML(audit.task)}"
                    aria-label="Edit audit task name"
                >

                <select
                    id="editPriority-${audit.id}"
                    class="edit-input"
                    aria-label="Edit priority level"
                >
                    <option value="Low" ${audit.priority === "Low" ? "selected" : ""}>
                        Low Priority
                    </option>
                    <option value="Medium" ${audit.priority === "Medium" ? "selected" : ""}>
                        Medium Priority
                    </option>
                    <option value="High" ${audit.priority === "High" ? "selected" : ""}>
                        High Priority
                    </option>
                </select>

                <input
                    type="date"
                    id="editDueDate-${audit.id}"
                    class="edit-input"
                    value="${audit.dueDate || ""}"
                    aria-label="Edit due date"
                >

            </div>

            <div class="audit-actions">

                <button
                    class="save-btn"
                    onclick="saveEditAudit(${audit.id})"
                >
                    Save
                </button>

                <button
                    class="cancel-btn"
                    onclick="cancelEditAudit()"
                >
                    Cancel
                </button>

            </div>
        `;

        } else {

            card.innerHTML = `

        <div class="audit-info">

            <h3>${escapeHTML(audit.task)}</h3>

            <div class="audit-meta">

            <span class="
            priority-badge
            ${(audit.priority || "Low").toLowerCase()}
            ">
            ${audit.priority || "Low"}
             </span>

             <span class="due-date ${dueDateInfo.dueClass}">

            ${
                audit.dueDate
                ? audit.dueDate
                : "No Due Date"
            }

            </span>

            ${
                dueDateInfo.badge
                ? `<span class="status-badge ${dueDateInfo.badgeClass}">
                    ${dueDateInfo.badge}
                   </span>`
                : ""
            }

            </div>

            ${
                dueDateInfo.message
                ? `<p class="due-message ${dueDateInfo.dueClass}">
                    ${dueDateInfo.message}
                   </p>`
                : ""
            }

            <p>
            Status:
             ${audit.status.toUpperCase()}
            </p>

             <p>
            ${audit.createdAt}
             </p>

            </div>

            <div class="audit-actions">

                ${getAuditActions(audit.id)}

            </div>
        `;
        }

        auditList.appendChild(card);
    });

    updateStats();
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

    const updatedTask = editTaskInput.value.trim();

    if(updatedTask === ""){

        alert("Please enter an audit checkpoint");

        return;
    }

    audits = audits.map((audit)=>{

        if(audit.id === id){

            return {
                ...audit,
                task: updatedTask,
                priority: editPrioritySelect.value,
                dueDate: editDueDateInput.value
            };
        }

        return audit;
    });

    editingAuditId = null;

    saveAudits();

    renderAudits();
}

function cancelEditAudit(){

    editingAuditId = null;

    renderAudits();
}

function escapeHTML(value){

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

/* Mark Pass */

function markPass(id){

    if(!isAdmin()){

        alert("Only admins can update audit status");

        return;
    }

    audits = audits.map((audit)=>{

        if(audit.id === id){

            audit.status = "pass";
        }

        return audit;
    });

    saveAudits();

    renderAudits();
}

/* Mark Fail */

function markFail(id){

    if(!isAdmin()){

        alert("Only admins can update audit status");

        return;
    }

    audits = audits.map((audit)=>{

        if(audit.id === id){

            audit.status = "fail";
        }

        return audit;
    });

    saveAudits();

    renderAudits();
}

/* Delete Audit */

function deleteAudit(id){

    if(!isAdmin()){

        alert("Only admins can delete audits");

        return;
    }

    audits = audits.filter((audit)=> audit.id !== id);

    saveAudits();

    renderAudits();
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

function saveAudits(){

    localStorage.setItem(
        "audits",
        JSON.stringify(audits)
    );
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
