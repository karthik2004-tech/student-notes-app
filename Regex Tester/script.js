const regexInput = document.getElementById("regex-input");
const testString = document.getElementById("test-string");
const matchCountEl = document.getElementById("match-count");
const groupsList = document.getElementById("groups-list");
const highlightedOutput = document.getElementById("highlighted-output");

function updateResults() {
  groupsList.innerHTML = "";
  highlightedOutput.innerHTML = "";
  matchCountEl.textContent = "0";

  try {
    const pattern = regexInput.value;
    if (!pattern) return;

    const regex = new RegExp(pattern, "g");
    const text = testString.value;

    let match;
    let count = 0;
    let highlightedText = "";
    let lastIndex = 0;

    while ((match = regex.exec(text)) !== null) {
      count++;
      // Highlight matches
      highlightedText += text.slice(lastIndex, match.index);
      highlightedText += `<span class="highlight">${match[0]}</span>`;
      lastIndex = regex.lastIndex;

      // Show groups
      if (match.length > 1) {
        const li = document.createElement("li");
        li.textContent = `Groups: ${match.slice(1).join(", ")}`;
        groupsList.appendChild(li);
      }
    }

    highlightedText += text.slice(lastIndex);
    highlightedOutput.innerHTML = highlightedText;
    matchCountEl.textContent = count;
  } catch (error) {
    highlightedOutput.innerHTML = `<span style="color:red;">Invalid regex pattern</span>`;
  }
}

regexInput.addEventListener("input", updateResults);
testString.addEventListener("input", updateResults);
