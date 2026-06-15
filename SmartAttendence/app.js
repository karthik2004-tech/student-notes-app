let students = [];

function addStudent() {
    const input = document.getElementById("studentName");
    const name = input.value.trim();

    if (name === "") {
        alert("Please enter student name");
        return;
    }

    students.push({
        name: name,
        status: "Absent"
    });

    input.value = "";
    renderStudents();
}

function markAttendance(index) {
    students[index].status =
        students[index].status === "Present"
            ? "Absent"
            : "Present";

    renderStudents();
}

function renderStudents() {
    const studentList = document.getElementById("studentList");
    studentList.innerHTML = "";

    let present = 0;
    let absent = 0;

    students.forEach((student, index) => {
        if (student.status === "Present") {
            present++;
        } else {
            absent++;
        }

        studentList.innerHTML += `
            <tr>
                <td>${index + 1}</td>
                <td>${student.name}</td>
                <td class="${student.status.toLowerCase()}">
                    ${student.status}
                </td>
                <td>
                    <button
                        class="${
                            student.status === "Present"
                                ? "absent-btn"
                                : "present-btn"
                        }"
                        onclick="markAttendance(${index})">
                        ${
                            student.status === "Present"
                                ? "Mark Absent"
                                : "Mark Present"
                        }
                    </button>
                </td>
            </tr>
        `;
    });

    document.getElementById("totalStudents").textContent =
        students.length;
    document.getElementById("presentCount").textContent =
        present;
    document.getElementById("absentCount").textContent =
        absent;
}