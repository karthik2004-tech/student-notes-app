const word1Input = document.getElementById("word1");
const word2Input = document.getElementById("word2");
const resultDiv = document.getElementById("result");
const freq1List = document.getElementById("freq1");
const freq2List = document.getElementById("freq2");

[word1Input, word2Input].forEach(input => {
  input.addEventListener("input", checkAnagram);
});

function cleanText(text) {
  return text.toLowerCase().replace(/[^a-z]/g, "");
}

function getFrequency(text) {
  const freq = {};
  for (let char of text) {
    freq[char] = (freq[char] || 0) + 1;
  }
  return freq;
}

function renderFrequency(freq, listEl) {
  listEl.innerHTML = "";
  Object.keys(freq).sort().forEach(char => {
    const li = document.createElement("li");
    li.textContent = `${char}: ${freq[char]}`;
    listEl.appendChild(li);
  });
}

function checkAnagram() {
  const w1 = cleanText(word1Input.value);
  const w2 = cleanText(word2Input.value);

  if (!w1 || !w2) {
    resultDiv.textContent = "Start typing to check...";
    resultDiv.className = "result";
    freq1List.innerHTML = "";
    freq2List.innerHTML = "";
    return;
  }

  const freq1 = getFrequency(w1);
  const freq2 = getFrequency(w2);

  renderFrequency(freq1, freq1List);
  renderFrequency(freq2, freq2List);

  const isAnagram = compareFrequency(freq1, freq2);

  if (isAnagram) {
    resultDiv.textContent = "YES — They are Anagrams ✅";
    resultDiv.className = "result yes";
  } else {
    resultDiv.textContent = "NO — Not Anagrams ❌";
    resultDiv.className = "result no";
  }
}

function compareFrequency(f1, f2) {
  const keys1 = Object.keys(f1);
  const keys2 = Object.keys(f2);
  if (keys1.length !== keys2.length) return false;

  for (let key of keys1) {
    if (f1[key] !== f2[key]) return false;
  }
  return true;
}
