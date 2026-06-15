function calculateAge() {
  const birthdate = document.getElementById("birthdate").value;
  if (!birthdate) {
    alert("Please select your birthdate!");
    return;
  }

  const birthDateObj = new Date(birthdate);
  const today = new Date();

  let years = today.getFullYear() - birthDateObj.getFullYear();
  let months = today.getMonth() - birthDateObj.getMonth();
  let days = today.getDate() - birthDateObj.getDate();

  if (days < 0) {
    months--;
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += prevMonth.getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  document.getElementById("age").textContent = 
    `Your Age: ${years} years, ${months} months, ${days} days`;

  // Next birthday calculation
  let nextBirthday = new Date(today.getFullYear(), birthDateObj.getMonth(), birthDateObj.getDate());
  if (nextBirthday < today) {
    nextBirthday.setFullYear(today.getFullYear() + 1);
  }

  const diffTime = nextBirthday - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  document.getElementById("nextBirthday").textContent = 
    `🎉 Days until next birthday: ${diffDays}`;
}
