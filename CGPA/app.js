function calculateSGPA() {
    let gradePoints = parseFloat(document.getElementById("gradePoints").value);
    let credits = parseFloat(document.getElementById("credits").value);

    if (!gradePoints || !credits) {
        document.getElementById("sgpaResult").innerText =
            "Please enter valid values!";
        return;
    }

    let sgpa = gradePoints / credits;

    document.getElementById("sgpaResult").innerText =
        "SGPA: " + sgpa.toFixed(2);
}

function calculateCGPA() {
    let totalSGPA = parseFloat(document.getElementById("totalSGPA").value);
    let semesters = parseFloat(document.getElementById("semesters").value);

    if (!totalSGPA || !semesters) {
        document.getElementById("cgpaResult").innerText =
            "Please enter valid values!";
        return;
    }

    let cgpa = totalSGPA / semesters;

    document.getElementById("cgpaResult").innerText =
        "CGPA: " + cgpa.toFixed(2);
}