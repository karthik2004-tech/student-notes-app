let assignments = [];

function addAssignment() {
  const subject = document.getElementById("subject").value;
  const dueDate = document.getElementById("dueDate").value;
  const priority = document.getElementById("priority").value;

  if (!subject || !dueDate) {
    alert("Please enter subject and due date.");
    return;
  }

  assignments.push({ subject, dueDate, priority, submitted: false });
  saveData();
  renderAssignments();
  updateFilterOptions();
}

function renderAssignments() {
  const listDiv = document.getElementById("assignmentList");
  listDiv.innerHTML = "";

  const filtered = applyFilters(true);
  const sorted = filtered.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  sorted.forEach((assignment, index) => {
    const card = document.createElement("div");
    card.className = "assignment-card " + getStatusClass(assignment);

    if (assignment.submitted) card.classList.add("submitted");

    card.innerHTML = `
      <div>
        <h3>${assignment.subject}</h3>
        <p>Due: ${assignment.dueDate}</p>
        <p>Priority: ${assignment.priority}</p>
      </div>
      <div>
        <button onclick="markSubmitted(${index})">Mark Submitted</button>
        <button onclick="deleteAssignment(${index})">Delete</button>
      </div>
    `;
    listDiv.appendChild(card);
  });
}

function getStatusClass(assignment) {
  const today = new Date().toISOString().split("T")[0];
  if (assignment.dueDate < today) return "status-overdue";
  if (assignment.dueDate === today) return "status-today";
  return "status-upcoming";
}

function markSubmitted(index) {
  assignments[index].submitted = true;
  saveData();
  renderAssignments();
}

function deleteAssignment(index) {
  assignments.splice(index, 1);
  saveData();
  renderAssignments();
}

function clearAll() {
  assignments = [];
  saveData();
  renderAssignments();
  updateFilterOptions();
}

function applyFilters(returnOnly = false) {
  const subjectFilter = document.getElementById("filterSubject").value;
  const priorityFilter = document.getElementById("filterPriority").value;

  let filtered = assignments;
  if (subjectFilter) filtered = filtered.filter(a => a.subject === subjectFilter);
  if (priorityFilter) filtered = filtered.filter(a => a.priority === priorityFilter);

  if (returnOnly) return filtered;
  renderAssignments();
}

function updateFilterOptions() {
  const subjectSelect = document.getElementById("filterSubject");
  subjectSelect.innerHTML = `<option value="">Filter by Subject</option>`;
  const subjects = [...new Set(assignments.map(a => a.subject))];
  subjects.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s;
    subjectSelect.appendChild(opt);
  });
}

function saveData() {
  localStorage.setItem("assignmentTracker", JSON.stringify(assignments));
}

function loadData() {
  const data = JSON.parse(localStorage.getItem("assignmentTracker"));
  if (data) {
    assignments = data;
    renderAssignments();
    updateFilterOptions();
  }
}

loadData();
