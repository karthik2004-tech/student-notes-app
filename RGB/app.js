const red = document.getElementById("red");
const green = document.getElementById("green");
const blue = document.getElementById("blue");

const preview = document.getElementById("preview");
const rgbText = document.getElementById("rgbText");

const rVal = document.getElementById("rVal");
const gVal = document.getElementById("gVal");
const bVal = document.getElementById("bVal");

const copyBtn = document.getElementById("copyBtn");

function updateColor() {
  const r = red.value;
  const g = green.value;
  const b = blue.value;

  const rgb = `rgb(${r}, ${g}, ${b})`;

  preview.style.background = rgb;
  rgbText.textContent = rgb;

  rVal.textContent = r;
  gVal.textContent = g;
  bVal.textContent = b;
}

red.addEventListener("input", updateColor);
green.addEventListener("input", updateColor);
blue.addEventListener("input", updateColor);

copyBtn.addEventListener("click", () => {
  navigator.clipboard.writeText(rgbText.textContent);

  copyBtn.textContent = "Copied ✔";

  setTimeout(() => {
    copyBtn.textContent = "Copy RGB";
  }, 1000);
});

updateColor();