const color1 = document.getElementById("color1");
const color2 = document.getElementById("color2");
const color3 = document.getElementById("color3");
const angle = document.getElementById("angle");
const preview = document.getElementById("preview");
const cssCode = document.getElementById("cssCode");
const typeRadios = document.querySelectorAll("input[name='type']");

function updateGradient() {
  const c1 = color1.value;
  const c2 = color2.value;
  const c3 = color3.value;
  const ang = angle.value;
  const type = document.querySelector("input[name='type']:checked").value;

  let gradient;
  if (type === "linear") {
    gradient = `linear-gradient(${ang}deg, ${c1}, ${c2}, ${c3})`;
  } else {
    gradient = `radial-gradient(circle, ${c1}, ${c2}, ${c3})`;
  }

  preview.style.background = gradient;
  cssCode.textContent = `background: ${gradient};`;
}

function copyCSS() {
  navigator.clipboard.writeText(cssCode.textContent).then(() => {
    alert("CSS code copied to clipboard!");
  });
}

[color1, color2, color3, angle].forEach(el => el.addEventListener("input", updateGradient));
typeRadios.forEach(radio => radio.addEventListener("change", updateGradient));

updateGradient();
