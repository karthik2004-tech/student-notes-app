# UI Color Palette Extractor

An interactive palette extraction and WCAG 2.2 contrast analysis engine that runs entirely client-side in the browser.

---

## Color Mathematics Foundations

### sRGB to Linear Conversion

The relative luminance calculation begins by converting sRGB channel values to linear space. Each sRGB component $C_{sRGB}$ (in the range $[0, 1]$) is transformed using the piecewise function:

$$C_{\text{linear}} = \begin{cases} \frac{C_{sRGB}}{12.92} & \text{if } C_{sRGB} \leq 0.04045 \\ \left(\frac{C_{sRGB} + 0.055}{1.055}\right)^{2.4} & \text{otherwise} \end{cases}$$

### Relative Luminance ($Y$)

The relative luminance of a color is computed as the weighted sum of its linear RGB channels, following the ITU-R BT.709 primaries:

$$Y = 0.2126 \cdot R_{\text{linear}} + 0.7152 \cdot G_{\text{linear}} + 0.0722 \cdot B_{\text{linear}}$$

### Contrast Ratio

The WCAG 2.2 contrast ratio between two colors (with luminances $L_1$ and $L_2$, where $L_1 \geq L_2$) is:

$$\text{Contrast Ratio} = \frac{L_1 + 0.05}{L_2 + 0.05}$$

This ratio ranges from 1:1 (identical luminance) to 21:1 (black on white).

---

## Chromatic Extraction Pipeline Details

### Image Processing Workflow

1. **File Ingestion** — User drops or selects an image file via the upload zone. The file is read as a data URL using `FileReader`.

2. **Canvas Sampling** — The image is drawn onto an offscreen HTML5 canvas at a reduced resolution (max dimension 200px) for performance. The pixel buffer is read via `getImageData`.

3. **Spatial Stepping** — Every $N$th pixel ($N=3$) is sampled to build a representative set of the image's color distribution. Pixels with alpha $< 128$ are discarded.

4. **Color Quantization** — Sampled RGB values are quantized to 16-unit buckets ($\lfloor R/16 \rfloor \cdot 16$) to reduce noise. A Euclidean-distance clustering algorithm groups similar colors (threshold $d < 40$), merging them via weighted averaging.

5. **Dominance Ranking** — Clusters are sorted by frequency (count). The top 5 most dominant colors are returned as the extracted palette and rendered as interactive swatch tiles.

### Manual Input

Users can enter hex codes (`#RGB`, `#RRGGBB`), `rgb(r, g, b)` tuples, or space-separated RGB values. A native color picker provides visual selection. All inputs are validated and normalized before updating the preview and diagnostics.

---

## Accessibility Verification Protocols

### WCAG 2.2 Compliance Tiers

| Level | Contrast Ratio | Usage |
|-------|---------------|-------|
| AAA   | $\geq 7:1$    | Optimal readability for all text |
| AA    | $\geq 4.5:1$  | Normal text (body, captions) |
| AA (large) | $\geq 3:1$ | Large text ($\geq 18$pt or $\geq 14$pt bold) |
| FAIL  | $< 4.5:1$     | Below minimum contrast threshold |

### Automated Text Color Decision

The system evaluates two candidate contrast ratios for the active background color:

- **White text** (#ffffff, $L=1.0$)
- **Dark text** (#111827, $L \approx 0.008$)

If the background luminance exceeds $Y > 0.179$ (approximately #767676), dark text is selected; otherwise, white text is used. This ensures optimal readability is automatically maintained as colors change.

### Real-Time Diagnostics

- **Relative Luminance**: Displayed to 4 decimal places
- **Contrast vs White**: Ratio against pure white
- **Contrast vs Dark**: Ratio against dark charcoal
- **WCAG Flag**: Color-coded badge showing PASS AAA, PASS AA, or FAIL CRITICAL CONTRAST

---

## Operational User Guide

### Extracting a Palette from an Image

1. Drag and drop an image file onto the upload zone, or click to browse
2. The system processes the image and extracts 5 dominant colors
3. The primary color maps to the preview card background
4. The swatch strip updates with extracted hex codes
5. Click any swatch to apply that color and copy its hex

### Testing Individual Colors

1. Type a hex code (`#3b82f6`), `rgb(59, 130, 246)`, or `59 130 246` into the input field
2. Use the color picker for visual selection
3. The preview card updates instantly with adaptive text color
4. The diagnostic panel shows real-time luminance, contrast ratios, and WCAG compliance

### Locking and Exporting

- **LOCK PALETTE SEED**: Freezes the current color to prevent accidental changes while exploring
- **EXPORT CSS DESIGN TOKENS**: Copies a `:root {}` CSS custom properties block with all 5 swatches and active color, plus WCAG analysis comments

---

## File Directory Layout

```
ui-color-palette-extractor/
├── index.html        # Application structure (dual-column layout)
├── style.css         # Dark engineering theme and UI styling
├── script.js         # Luminance engine, contrast pipeline, image extraction
├── README.md         # This documentation file
├── project.json      # Project metadata configuration
└── thumbnail.svg     # Application thumbnail icon
```

### Architecture

- **index.html** — Dual-column layout: Extraction Hub (left) with upload zone, manual input, diagnostic telemetry; Adaptive Preview (right) with hero card and swatch strip
- **style.css** — CSS Grid layout, upload zone with glow state, smooth color transitions, responsive swatch tiles with hover lift
- **script.js** — State management, sRGB-to-linear conversion, relative luminance, contrast ratio, WCAG grading, image canvas pipeline, spatial stepping quantization

---

## Local Deployment Verification

### Prerequisites

- A modern web browser (Chrome, Firefox, Edge, or Safari)
- No build tools, frameworks, or external dependencies required

### Steps

1. Clone or download the repository:
   ```
   git clone <repository-url>
   cd ui-color-palette-extractor
   ```

2. Open `index.html` in your web browser:
   ```
   # On Windows
   start index.html

   # On macOS
   open index.html

   # On Linux
   xdg-open index.html
   ```

3. Verify the application loads with:
   - Dual-column dashboard layout
   - Dark engineering theme (#070a13 background)
   - Upload zone and manual hex/RGB input
   - Preview hero card with sample typography
   - 5-color swatch strip
   - Diagnostic telemetry panel with luminance and contrast values

### Testing

1. Type `#ef4444` in the hex input and verify the preview card updates
2. Drag any JPEG or PNG image onto the upload zone
3. Click the color swatches and verify hex copy
4. Check that WCAG compliance accurately reflects the contrast ratio
5. Click "EXPORT CSS DESIGN TOKENS" and verify clipboard content

---

## Technical Details

- **Color Model**: sRGB with ITU-R BT.709 luminance weights
- **Contrast Standard**: W3C WCAG 2.2 relative luminance method
- **Image Sampling**: Offscreen canvas with spatial stepping and Euclidean clustering
- **Text Decision**: Luminance threshold ($Y > 0.179$) for dark/white text toggle
- **Theme**: Vercel, Figma, and Linear.app inspired dark dashboard
- **Typography**: `ui-monospace, Consolas, monospace` monospaced stack

### Color Reference

| Token | Hex | Usage |
|-------|-----|-------|
| App background | `#070a13` | Main canvas and body |
| Panel surface | `#111827` | Sidebar panels |
| Border | `#1f2937` | Panel dividers and outlines |
| Text primary | `#f8fafc` | Headers and labels |
| Text secondary | `#94a3b8` | Sub-headers and metadata |
| Accessible | `#10b981` | PASS compliance badges |
| Critical | `#ef4444` | FAIL compliance badges |
| Interactive | `#3b82f6` | Focus/active states, upload glow |
