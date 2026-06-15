const btn = document.getElementById("themeBtn");
const card = document.getElementById("card");
const glow = document.querySelector(".glow");

const themes = [
  "linear-gradient(135deg, #ff6a00, #ee0979)",
  "linear-gradient(135deg, #00c6ff, #0072ff)",
  "linear-gradient(135deg, #7f00ff, #e100ff)",
  "linear-gradient(135deg, #00f260, #0575e6)",
  "linear-gradient(135deg, #f7971e, #ffd200)"
];

btn.addEventListener("click", () => {
  const theme = themes[Math.floor(Math.random() * themes.length)];

  // Apply ONLY to card glow (not body)
  card.style.setProperty("--theme", theme);
});