// Dummy data
const weeklyHours = [2, 3, 4, 1, 5, 6, 2];
const subjects = { Maths: 10, Science: 8, CS: 12, History: 6 };
let streak = JSON.parse(localStorage.getItem("streak")) || 0;

// Weekly Chart
new Chart(document.getElementById("weeklyChart"), {
  type: "line",
  data: {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [{
      label: "Hours",
      data: weeklyHours,
      borderColor: "#4caf50",
      backgroundColor: "rgba(76,175,80,0.2)",
      fill: true
    }]
  }
});

// Subject Breakdown Pie Chart
new Chart(document.getElementById("subjectChart"), {
  type: "pie",
  data: {
    labels: Object.keys(subjects),
    datasets: [{
      data: Object.values(subjects),
      backgroundColor: ["#ffeb3b", "#f48fb1", "#81c784", "#64b5f6"]
    }]
  }
});

// Consistency Streak
document.getElementById("streak").textContent = `🔥 Current Streak: ${streak} days`;

// Daily Heatmap
const heatmap = document.getElementById("heatmap");
for (let i = 0; i < 30; i++) {
  const day = document.createElement("div");
  day.className = "day";
  day.textContent = i + 1;
  day.addEventListener("click", () => {
    day.classList.toggle("active");
    streak = document.querySelectorAll(".day.active").length;
    localStorage.setItem("streak", streak);
    document.getElementById("streak").textContent = `🔥 Current Streak: ${streak} days`;
  });
  heatmap.appendChild(day);
}
