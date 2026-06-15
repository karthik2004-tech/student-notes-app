// ============================================================
//  UI COLOR PALETTE EXTRACTOR — Core Engine
//  Relative luminance, WCAG contrast, image quantization
// ============================================================

// ─── STATE ──────────────────────────────────────────────────

const state = {
  hex: '#3B82F6',
  rgb: [59, 130, 246],
  swatches: ['#1e293b', '#334155', '#475569', '#64748b', '#94a3b8'],
  swatchSource: 'default',
  locked: false,
  textMode: 'dark',
  luminance: 0,
  contrastWhite: 1,
  contrastDark: 1,
  compliance: 'PASS AA',
};

// ─── DOM REFS ───────────────────────────────────────────────

const previewCard = document.getElementById('preview-card');
const previewHeading = document.getElementById('preview-heading');
const previewBody = document.getElementById('preview-body');
const badge1 = document.getElementById('preview-badge-1');
const badge2 = document.getElementById('preview-badge-2');
const hexInput = document.getElementById('hex-input');
const colorPicker = document.getElementById('color-picker');
const uploadZone = document.getElementById('upload-zone');
const fileInput = document.getElementById('file-input');
const swatchStrip = document.getElementById('swatch-strip');
const swatchSource = document.getElementById('swatch-source');
const diagLuminance = document.getElementById('diag-luminance');
const diagContrastWhite = document.getElementById('diag-contrast-white');
const diagContrastDark = document.getElementById('diag-contrast-dark');
const diagCompliance = document.getElementById('diag-compliance');
const diagHex = document.getElementById('diag-hex');
const diagRgb = document.getElementById('diag-rgb');
const btnLock = document.getElementById('btn-lock');
const btnExport = document.getElementById('btn-export');

// ─── COLOR UTILITIES ───────────────────────────────────────

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return [r, g, b];
  }
  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return [r, g, b];
  }
  return [0, 0, 0];
}

function rgbToHex(r, g, b) {
  const toHex = (x) => {
    const clamped = Math.max(0, Math.min(255, Math.round(x)));
    return clamped.toString(16).padStart(2, '0');
  };
  return '#' + toHex(r) + toHex(g) + toHex(b);
}

function parseColorInput(str) {
  str = str.trim();
  // Hex
  const hexMatch = str.match(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (hexMatch) {
    const hex = hexMatch[1];
    return hexToRgb(hexMatch[0].startsWith('#') ? hexMatch[0] : '#' + hex);
  }
  // rgb(r, g, b)
  const rgbMatch = str.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
  if (rgbMatch) {
    return [parseInt(rgbMatch[1]), parseInt(rgbMatch[2]), parseInt(rgbMatch[3])];
  }
  // Space-separated "r g b"
  const spaceMatch = str.match(/^(\d+)\s+(\d+)\s+(\d+)$/);
  if (spaceMatch) {
    return [parseInt(spaceMatch[1]), parseInt(spaceMatch[2]), parseInt(spaceMatch[3])];
  }
  return null;
}

function formatHex(r, g, b) {
  return rgbToHex(r, g, b).toUpperCase();
}

// ─── RELATIVE LUMINANCE & CONTRAST ─────────────────────────

function srgbToLinear(channel) {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function relativeLuminance(r, g, b) {
  const R = srgbToLinear(r);
  const G = srgbToLinear(g);
  const B = srgbToLinear(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function contrastRatio(l1, l2) {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function wcagCompliance(ratio, isLargeText) {
  if (ratio >= 7) return { grade: 'PASS AAA', cls: 'diag-aaa' };
  if (ratio >= 4.5) return { grade: 'PASS AA', cls: 'diag-pass' };
  if (isLargeText && ratio >= 3) return { grade: 'PASS AA (large)', cls: 'diag-pass' };
  return { grade: 'FAIL CRITICAL CONTRAST', cls: 'diag-fail' };
}

// ─── TEXT COLOR DECISION ────────────────────────────────────

function decideTextMode(luminance) {
  return luminance > 0.179 ? 'dark' : 'light';
}

function updatePreviewTextMode(mode) {
  state.textMode = mode;
  previewCard.classList.remove('preview-text-light', 'preview-text-dark');
  previewCard.classList.add(mode === 'light' ? 'preview-text-light' : 'preview-text-dark');
}

// ─── UPDATE PREVIEW & DIAGNOSTICS ──────────────────────────

function updateColor(r, g, b, source) {
  state.rgb = [r, g, b];
  state.hex = formatHex(r, g, b);

  // Update preview background
  previewCard.style.backgroundColor = state.hex;

  // Compute luminance
  state.luminance = relativeLuminance(r, g, b);

  // Compute contrast against white (#fff) and dark (#111827)
  const lumWhite = 1.0;
  const lumDark = relativeLuminance(17, 24, 39); // #111827

  state.contrastWhite = contrastRatio(state.luminance, lumWhite);
  state.contrastDark = contrastRatio(state.luminance, lumDark);

  // Decide text mode
  const mode = decideTextMode(state.luminance);
  updatePreviewTextMode(mode);

  // WCAG compliance (AA: 4.5:1 normal text)
  const comp = wcagCompliance(state.contrastWhite, false);
  state.compliance = comp.grade;

  // Update hex input and picker
  hexInput.value = state.hex;
  colorPicker.value = state.hex.toLowerCase();

  // Update diagnostics
  diagLuminance.textContent = state.luminance.toFixed(4);
  diagContrastWhite.textContent = state.contrastWhite.toFixed(2) + ':1';
  diagContrastDark.textContent = state.contrastDark.toFixed(2) + ':1';
  diagCompliance.textContent = state.compliance;
  diagCompliance.className = 'diag-value ' + comp.cls;
  diagHex.textContent = state.hex;
  diagRgb.textContent = r + ', ' + g + ', ' + b;

  // Update swatch source indicator
  if (source) {
    state.swatchSource = source;
    swatchSource.textContent = 'source: ' + source;
  }
}

// ─── SWATCH MANAGEMENT ─────────────────────────────────────

function renderSwatches(swatches, source) {
  state.swatches = swatches;
  if (source) {
    state.swatchSource = source;
    swatchSource.textContent = 'source: ' + source;
  }

  swatchStrip.innerHTML = '';
  for (const hex of swatches) {
    const tile = document.createElement('div');
    tile.className = 'swatch-tile';
    tile.style.setProperty('--swatch', hex);
    tile.dataset.hex = hex;
    tile.innerHTML = `
      <span class="swatch-hex">${hex.toLowerCase()}</span>
      <span class="swatch-copy-hint">click to copy</span>
    `;
    tile.addEventListener('click', () => {
      copyToClipboard(hex.toLowerCase());
      const rgb = hexToRgb(hex);
      updateColor(rgb[0], rgb[1], rgb[2], 'swatch');
    });
    swatchStrip.appendChild(tile);
  }

  // Map first swatch to preview if no image is being processed
  if (swatches.length > 0 && source === 'image') {
    const firstRgb = hexToRgb(swatches[0]);
    updateColor(firstRgb[0], firstRgb[1], firstRgb[2], 'image');
  }
}

// ─── CLIPBOARD ──────────────────────────────────────────────

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('Copied ' + text + ' to clipboard');
  }).catch(() => {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('Copied ' + text + ' to clipboard');
  });
}

// ─── TOAST NOTIFICATION ────────────────────────────────────

let toastEl = null;
let toastTimer = null;

function showToast(msg) {
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.className = 'toast';
    document.body.appendChild(toastEl);
  }
  toastEl.textContent = msg;
  toastEl.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.classList.remove('visible');
  }, 2000);
}

// ─── IMAGE EXTRACTION ──────────────────────────────────────

function extractPaletteFromImage(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const palette = sampleImagePalette(img);
      renderSwatches(palette, 'image');
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function sampleImagePalette(img) {
  // Offscreen canvas for pixel reading
  const cvs = document.createElement('canvas');
  const ctx = cvs.getContext('2d');
  const maxDim = 200;
  let w = img.naturalWidth;
  let h = img.naturalHeight;
  if (w > maxDim || h > maxDim) {
    const scale = Math.min(maxDim / w, maxDim / h);
    w = Math.round(w * scale);
    h = Math.round(h * scale);
  }
  cvs.width = w;
  cvs.height = h;
  ctx.drawImage(img, 0, 0, w, h);

  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  const pixels = [];

  // Spatial stepping array: sample every Nth pixel
  const step = 3;
  for (let i = 0; i < data.length; i += 4 * step) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    if (a < 128) continue;
    // Quantize to reduce noise
    const qr = Math.round(r / 16) * 16;
    const qg = Math.round(g / 16) * 16;
    const qb = Math.round(b / 16) * 16;
    const hex = rgbToHex(qr, qg, qb);
    pixels.push({ hex, r: qr, g: qg, b: qb, count: 1 });
  }

  // Cluster similar colors (basic quantization)
  const clusters = [];
  for (const p of pixels) {
    let found = false;
    for (const c of clusters) {
      const dist = Math.hypot(c.r - p.r, c.g - p.g, c.b - p.b);
      if (dist < 40) {
        c.count += p.count;
        // Weighted average
        const total = c.count;
        c.r = Math.round((c.r * (total - 1) + p.r) / total);
        c.g = Math.round((c.g * (total - 1) + p.g) / total);
        c.b = Math.round((c.b * (total - 1) + p.b) / total);
        c.hex = rgbToHex(c.r, c.g, c.b);
        found = true;
        break;
      }
    }
    if (!found) {
      clusters.push({ ...p });
    }
  }

  // Sort by frequency, take top 5
  clusters.sort((a, b) => b.count - a.count);
  const top = clusters.slice(0, 5);

  // Ensure we have at least some colors
  if (top.length < 5 && clusters.length > 0) {
    for (let i = top.length; i < 5 && i < clusters.length; i++) {
      top.push(clusters[i]);
    }
  }

  // Fill remaining with default if not enough
  const defaults = ['#1e293b', '#334155', '#475569', '#64748b', '#94a3b8'];
  while (top.length < 5) {
    top.push({ hex: defaults[top.length], r: 0, g: 0, b: 0 });
  }

  return top.map(c => c.hex);
}

// ─── EXPORT CSS TOKENS ─────────────────────────────────────

function exportCssTokens() {
  const swatches = state.swatches;
  let css = ':root {\n';
  css += '  /* Colors extracted by CHROMATIC ENG */\n';
  for (let i = 0; i < swatches.length; i++) {
    const name = '--color-' + (i + 1);
    css += '  ' + name + ': ' + swatches[i].toLowerCase() + ';\n';
  }
  css += '  --color-active: ' + state.hex.toLowerCase() + ';\n';
  css += '}\n\n';
  css += '/* WCAG Analysis */\n';
  css += '/* Relative Luminance: ' + state.luminance.toFixed(4) + ' */\n';
  css += '/* Contrast Ratio (white): ' + state.contrastWhite.toFixed(2) + ':1 */\n';
  css += '/* WCAG: ' + state.compliance + ' */\n';

  copyToClipboard(css);
}

// ─── HEX INPUT HANDLING ────────────────────────────────────

hexInput.addEventListener('input', () => {
  if (state.locked) return;
  const raw = hexInput.value;
  const result = parseColorInput(raw);
  if (result) {
    const [r, g, b] = result;
    updateColor(r, g, b, 'manual');
  }
});

hexInput.addEventListener('blur', () => {
  hexInput.value = state.hex;
});

colorPicker.addEventListener('input', () => {
  if (state.locked) return;
  const hex = colorPicker.value;
  const rgb = hexToRgb(hex);
  updateColor(rgb[0], rgb[1], rgb[2], 'picker');
});

// ─── UPLOAD ZONE EVENTS ────────────────────────────────────

uploadZone.addEventListener('click', () => {
  fileInput.click();
});

uploadZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadZone.classList.add('dragover');
});

uploadZone.addEventListener('dragleave', () => {
  uploadZone.classList.remove('dragover');
});

uploadZone.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadZone.classList.remove('dragover');
  const files = e.dataTransfer.files;
  if (files.length > 0 && files[0].type.startsWith('image/')) {
    extractPaletteFromImage(files[0]);
  }
});

fileInput.addEventListener('change', () => {
  if (fileInput.files.length > 0) {
    extractPaletteFromImage(fileInput.files[0]);
    fileInput.value = '';
  }
});

// ─── ACTION BUTTONS ────────────────────────────────────────

btnLock.addEventListener('click', () => {
  state.locked = !state.locked;
  btnLock.classList.toggle('active');
  btnLock.textContent = state.locked ? 'PALETTE SEED LOCKED' : 'LOCK PALETTE SEED';
});

btnExport.addEventListener('click', exportCssTokens);

// ─── SWATCH CLICK (initial tiles) ──────────────────────────

document.querySelectorAll('.swatch-tile').forEach(tile => {
  tile.addEventListener('click', () => {
    const hex = tile.dataset.hex;
    copyToClipboard(hex);
    const rgb = hexToRgb(hex);
    updateColor(rgb[0], rgb[1], rgb[2], 'swatch');
  });
});

// ─── INIT ───────────────────────────────────────────────────

function init() {
  const [r, g, b] = state.rgb;
  updateColor(r, g, b, 'default');
}

init();
