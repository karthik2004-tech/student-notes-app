// Get elements
const cropForm = document.getElementById("cropForm");
const cropList = document.getElementById("cropList");

const expenseForm = document.getElementById("expenseForm");
const expenseList = document.getElementById("expenseList");
const totalExpense = document.getElementById("totalExpense");

const taskForm = document.getElementById("taskForm");
const taskList = document.getElementById("taskList");

// Arrays
let crops = JSON.parse(localStorage.getItem("crops")) || [];
let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

// Save data
function saveData() {
    localStorage.setItem("crops", JSON.stringify(crops));
    localStorage.setItem("expenses", JSON.stringify(expenses));
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

// Render Crops
function renderCrops() {
    cropList.innerHTML = "";

    crops.forEach((crop, index) => {
        const li = document.createElement("li");

        li.innerHTML = `
            🌱 ${crop.name} - Planted on ${crop.date}
            <button onclick="deleteCrop(${index})">Delete</button>
        `;

        cropList.appendChild(li);
    });
}

// Render Expenses
function renderExpenses() {
    expenseList.innerHTML = "";

    let total = 0;

    expenses.forEach((expense, index) => {
        total += expense.amount;

        const li = document.createElement("li");

        li.innerHTML = `
            💰 ${expense.name} - ₹${expense.amount}
            <button onclick="deleteExpense(${index})">Delete</button>
        `;

        expenseList.appendChild(li);
    });

    totalExpense.textContent = total;
}

// Render Tasks
function renderTasks() {
    taskList.innerHTML = "";

    tasks.forEach((task, index) => {
        const li = document.createElement("li");

        li.innerHTML = `
            📋 ${task}
            <button onclick="deleteTask(${index})">Delete</button>
        `;

        taskList.appendChild(li);
    });
}

// Add Crop
cropForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const cropName = document.getElementById("cropName").value;
    const plantDate = document.getElementById("plantDate").value;

    crops.push({
        name: cropName,
        date: plantDate
    });

    saveData();
    renderCrops();

    cropForm.reset();
});

// Add Expense
expenseForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const expenseName = document.getElementById("expenseName").value;
    const expenseAmount = Number(
        document.getElementById("expenseAmount").value
    );

    expenses.push({
        name: expenseName,
        amount: expenseAmount
    });

    saveData();
    renderExpenses();

    expenseForm.reset();
});

// Add Task
taskForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const taskName = document.getElementById("taskName").value;

    tasks.push(taskName);

    saveData();
    renderTasks();

    taskForm.reset();
});

// Delete Crop
function deleteCrop(index) {
    crops.splice(index, 1);

    saveData();
    renderCrops();
}

// Delete Expense
function deleteExpense(index) {
    expenses.splice(index, 1);

    saveData();
    renderExpenses();
}

// Delete Task
function deleteTask(index) {
    tasks.splice(index, 1);

    saveData();
    renderTasks();
}

// Initial Render
renderCrops();
renderExpenses();
renderTasks();