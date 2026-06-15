const habitForm = document.getElementById("habit-form");
const habitInput = document.getElementById("habit-input");
const habitList = document.getElementById("habit-list");

let habits = JSON.parse(localStorage.getItem("habits")) || [];

function saveHabits() {
  localStorage.setItem("habits", JSON.stringify(habits));
}

function renderHabits() {
  habitList.innerHTML = "";
  habits.forEach((habit, index) => {
    const habitDiv = document.createElement("div");
    habitDiv.className = "habit";

    const header = document.createElement("div");
    header.className = "habit-header";
    header.innerHTML = `
      <span>${habit.name}</span>
      <span>🔥 Streak: ${habit.streak}</span>
      <button onclick="deleteHabit(${index})" style="background:none;border:none;color:red;cursor:pointer;">🗑️</button>
    `;
    habitDiv.appendChild(header);

    const weekGrid = document.createElement("div");
    weekGrid.className = "week-grid";

    habit.days.forEach((done, dayIndex) => {
      const day = document.createElement("div");
      day.className = "day" + (done ? " completed" : "");
      day.addEventListener("click", () => {
        habit.days[dayIndex] = !habit.days[dayIndex];
        habit.streak = habit.days.every(Boolean) ? habit.streak + 1 : habit.streak;
        saveHabits();
        renderHabits();
      });
      weekGrid.appendChild(day);
    });

    habitDiv.appendChild(weekGrid);
    habitList.appendChild(habitDiv);
  });
}

function deleteHabit(index) {
  habits.splice(index, 1);
  saveHabits();
  renderHabits();
}

habitForm.addEventListener("submit", e => {
  e.preventDefault();
  const newHabit = {
    name: habitInput.value,
    streak: 0,
    days: Array(7).fill(false)
  };
  habits.push(newHabit);
  habitInput.value = "";
  saveHabits();
  renderHabits();
});

renderHabits();
