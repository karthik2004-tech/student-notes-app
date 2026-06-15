const subjectsDiv = document.getElementById("subjects");
const sgpaResultDiv = document.getElementById("sgpaResult");
const cgpaResultDiv = document.getElementById("cgpaResult");
const scaleSelect = document.getElementById("scaleSelect");

let semesters = [];

function addSubject() {
  const div = document.createElement("div");
  div.className = "subject";
  div.innerHTML = `
    <input type="text" placeholder="Subject Name">
    <input type="number" placeholder="Credits" min="1">
    <input type="text" placeholder="Grade/Marks">
  `;
  subjectsDiv.appendChild(div);
}

function gradeToPoint(grade, scale) {
  if (scale === 10) {
    // Indian 10-point scale
    const map = { "O":10, "A+":9, "A":8, "B+":7, "B":6, "C":5, "P":4, "F":0 };
    return map[grade.toUpperCase()] || parseFloat(grade) || 0;
  } else {
    // US 4-point scale
    const map = { "A":4, "B":3, "C":2, "D":1, "F":0 };
    return map[grade.toUpperCase()] || parseFloat(grade) || 0;
  }
}

function calculateSGPA() {
  const scale = parseInt(scaleSelect.value);
  const subjects = document.querySelectorAll(".subject");
  let totalCredits = 0;
  let totalPoints = 0;

  subjects.forEach(sub => {
    const credits = parseFloat(sub.children[1].value);
    const grade = sub.children[2].value;
    if (credits && grade) {
      totalCredits += credits;
      totalPoints += credits * gradeToPoint(grade, scale);
    }
  });

  if (totalCredits === 0) {
    sgpaResultDiv.textContent = "Please enter valid subjects.";
    return;
  }

  const sgpa = (totalPoints / totalCredits).toFixed(2);
  sgpaResultDiv.textContent = `SGPA (Scale ${scale}): ${sgpa}`;
  return sgpa;
}

function saveSemester() {
  const sgpa = calculateSGPA();
  if (sgpa) {
    semesters.push(parseFloat(sgpa));
    sgpaResultDiv.textContent += " | Semester saved!";
  }
}

function calculateCGPA() {
  if (semesters.length === 0) {
    cgpaResultDiv.textContent = "No semesters saved.";
    return;
  }
  const sum = semesters.reduce((a,b) => a+b, 0);
  const cgpa = (sum / semesters.length).toFixed(2);
  cgpaResultDiv.textContent = `CGPA: ${cgpa}`;
}

function exportResults() {
  let content = "GPA Calculator Results\n\n";
  semesters.forEach((s, i) => {
    content += `Semester ${i+1}: ${s}\n`;
  });
  const cgpaText = cgpaResultDiv.textContent || "";
  content += `\n${cgpaText}\n`;

  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "gpa_results.txt";
  a.click();
  URL.revokeObjectURL(url);
}
