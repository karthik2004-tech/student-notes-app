const colorInput = document.getElementById('colorInput');
const colorPreview = document.getElementById('colorPreview');
const hexValue = document.getElementById('hexValue');
const rgbValue = document.getElementById('rgbValue');
const hslValue = document.getElementById('hslValue');
const paletteColors = document.getElementById('paletteColors');
const copyMsg = document.getElementById('copyMsg');

let recentColors = [];

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return {r, g, b};
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h, s, l = (max+min)/2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d/(2-max-min) : d/(max+min);
    switch(max) {
      case r: h = ((g-b)/d + (g<b?6:0))/6; break;
      case g: h = ((b-r)/d + 2)/6; break;
      case b: h = ((r-g)/d + 4)/6; break;
    }
  }
  return {
    h: Math.round(h*360),
    s: Math.round(s*100),
    l: Math.round(l*100)
  };
}

function updateColor() {
  const hex = colorInput.value;
  const {r,g,b} = hexToRgb(hex);
  const {h,s,l} = rgbToHsl(r,g,b);

  colorPreview.style.background = hex;
  hexValue.textContent = hex.toUpperCase();
  rgbValue.textContent = `rgb(${r}, ${g}, ${b})`;
  hslValue.textContent = `hsl(${h}, ${s}%, ${l}%)`;

  if (!recentColors.includes(hex)) {
    recentColors.unshift(hex);
    if (recentColors.length > 10) recentColors.pop();
    renderPalette();
  }
}

function renderPalette() {
  paletteColors.innerHTML = '';
  recentColors.forEach(color => {
    const swatch = document.createElement('div');
    swatch.className = 'palette-swatch';
    swatch.style.background = color;
    swatch.title = color;
    swatch.onclick = () => {
      colorInput.value = color;
      updateColor();
    };
    paletteColors.appendChild(swatch);
  });
}

function copyValue(id) {
  const text = document.getElementById(id).textContent;
  navigator.clipboard.writeText(text)
    .then(() => {
      copyMsg.classList.add('show');
      setTimeout(() => copyMsg.classList.remove('show'), 1500);
    })
    .catch(err => {
      console.error('Clipboard copy failed:', err);
      alert("Failed to copy color. Please check your clipboard permissions.");
    });
}

colorInput.addEventListener('input', updateColor);
updateColor();