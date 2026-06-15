let history = [];

function cleanText(text) {
  return text.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function checkPalindrome() {
  const input = document.getElementById("textInput").value.trim();
  if (!input) {
    alert("Please enter some text!");
    return;
  }

  const cleaned = cleanText(input);
  const reversed = cleaned.split("").reverse().join("");
  const isPalindrome = cleaned === reversed;

  document.getElementById("result").textContent = isPalindrome
    ? `"${input}" is a Palindrome ✅`
    : `"${input}" is NOT a Palindrome ❌`;

  animateComparison(cleaned, reversed);

  history.unshift({ text: input, result: isPalindrome });
  renderHistory();
}

function animateComparison(cleaned, reversed) {
  const animationDiv = document.getElementById("animation");
  animationDiv.innerHTML = "";

  for (let i = 0; i < cleaned.length; i++) {
    const charDiv = document.createElement("div");
    charDiv.className = "char";
    charDiv.textContent = cleaned[i];

    setTimeout(() => {
      if (cleaned[i] === reversed[i]) {
        charDiv.classList.add("match");
      } else {
        charDiv.classList.add("mismatch");
      }
    }, i * 300);

    animationDiv.appendChild(charDiv);
  }
}

function renderHistory() {
  const list = document.getElementById("historyList");
  list.innerHTML = "";
  history.forEach(item => {
    const li = document.createElement("li");
    li.textContent = `${item.text} → ${item.result ? "Palindrome ✅" : "Not Palindrome ❌"}`;
    list.appendChild(li);
  });
}
