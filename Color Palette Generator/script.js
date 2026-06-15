const paletteDiv = document.getElementById("palette");
const generateBtn = document.getElementById("generate-btn");

let colors = [];
let locked = [false, false, false, false, false];

function randomColor() {
  return "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0");
}

function generatePalette() {
  colors = colors.map((c, i) => locked[i] ? c : randomColor());
  renderPalette();
}

function renderPalette() {
  paletteDiv.innerHTML = "";
  colors.forEach((color, i) => {
    const card = document.createElement("div");
    card.className = "color-card";
    card.style.background = color;

    const hex = document.createElement("div");
    hex.className = "hex-code";
    hex.textContent = color;
    hex.addEventListener("click", () => {
      navigator.clipboard.writeText(color);
      hex.textContent = "✅ Copied!";
      setTimeout(() => hex.textContent = color, 1000);
    });

    const lockBtn = document.createElement("button");
    lockBtn.className = "lock-btn";
    lockBtn.textContent = locked[i] ? "🔒" : "🔓";
    lockBtn.addEventListener("click", () => {
      locked[i] = !locked[i];
      renderPalette();
    });

    card.appendChild(hex);
    card.appendChild(lockBtn);
    paletteDiv.appendChild(card);
  });
}

generateBtn.addEventListener("click", generatePalette);

// Initialize with random colors
colors = Array(5).fill().map(() => randomColor());
renderPalette();
