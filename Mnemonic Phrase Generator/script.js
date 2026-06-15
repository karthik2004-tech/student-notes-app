const outputDiv = document.getElementById("output");
const savedDiv = document.getElementById("saved");

function generateMnemonics() {
  const words = document.getElementById("words").value.trim().split("\n").map(w => w.trim()).filter(w => w);
  if (words.length === 0) {
    outputDiv.textContent = "Please enter words.";
    return;
  }

  const firstLetters = words.map(w => w[0].toUpperCase());
  const variations = createVariations(firstLetters);

  outputDiv.innerHTML = "";
  variations.forEach(phrase => {
    const card = createCard(phrase, false);
    outputDiv.appendChild(card);
  });
}

function createVariations(letters) {
  // Simple demo variations: join letters into silly sentences
  const base = letters.join("");
  return [
    `My New Memory: ${letters.join(" ")}`,
    `Phrase: ${letters.map(l => randomWord(l)).join(" ")}`,
    `Funny: ${letters.map(l => randomWord(l)).join(" ")}`
  ];
}

function randomWord(letter) {
  const dictionary = {
    A: ["Apple","Ant","Air"],
    B: ["Ball","Book","Bird"],
    C: ["Cat","Code","Cloud"],
    D: ["Dog","Data","Desk"],
    E: ["Elephant","Energy","Earth"],
    // ... add more letters
  };
  const words = dictionary[letter] || [letter];
  return words[Math.floor(Math.random() * words.length)];
}

function createCard(text, saved) {
  const card = document.createElement("div");
  card.className = "mnemonic-card";

  const span = document.createElement("span");
  span.className = "mnemonic-text";
  span.textContent = text;

  const btns = document.createElement("div");
  btns.className = "card-buttons";

  const copyBtn = document.createElement("button");
  copyBtn.textContent = "Copy";
  copyBtn.onclick = () => copyText(text);

  btns.appendChild(copyBtn);

  if (!saved) {
    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Save";
    saveBtn.onclick = () => saveMnemonic(text);
    btns.appendChild(saveBtn);
  }

  card.appendChild(span);
  card.appendChild(btns);
  return card;
}

function copyText(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert("Copied to clipboard!");
  });
}

function saveMnemonic(text) {
  let mnemonics = JSON.parse(localStorage.getItem("mnemonics") || "[]");
  mnemonics.push(text);
  localStorage.setItem("mnemonics", JSON.stringify(mnemonics));
  renderSaved();
}

function renderSaved() {
  savedDiv.innerHTML = "";
  let mnemonics = JSON.parse(localStorage.getItem("mnemonics") || "[]");
  mnemonics.forEach(m => {
    const card = createCard(m, true);
    savedDiv.appendChild(card);
  });
}

// Load saved mnemonics on startup
renderSaved();
