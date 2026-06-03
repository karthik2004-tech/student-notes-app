# NEBULA — Memory Match

A premium, space-themed memory card matching game built with vanilla HTML, CSS, and JavaScript. No frameworks, no dependencies — just open and play.

---

## How to Play

1. Click any card to flip it and reveal the emoji
2. Click a second card to find its pair
3. Matching pairs stay face-up and glow green
4. Wrong guesses flip back — remember the positions!
5. Match all pairs as fast as possible with as few moves as possible

---

## Features

- **3D card flip animation** — CSS `rotateY` perspective flip on every card
- **Three difficulty modes** — Easy (4×4, 8 pairs), Medium (5×4, 10 pairs), Hard (6×6, 18 pairs)
- **Live timer** — starts on first flip, stops when all pairs are matched
- **Move counter** — every second flip counts as a move
- **Particle burst** — colorful particle explosion on every correct match
- **Score system** — calculated from time, moves, and difficulty
- **Win modal** — animated results screen with confetti, time, moves, and score
- **Wrong guess shake** — cards shake when a pair doesn't match
- **Animated star field** — twinkling canvas background
- **Keyboard shortcut** — press `R` to restart anytime

---

## Scoring Formula

```
Score = (pairs × 100) + time_bonus + move_bonus
time_bonus  = max(0, 300 - seconds) × 2
move_bonus  = max(0, (pairs × 3) - moves) × 10
```

---

## Project Structure

```
memory-game/
├── index.html   — Markup: board, stats bar, modal, particle containers
├── style.css    — All styles: space theme, card 3D flip, animations
├── app.js       — Game logic: state, timer, match detection, particles
└── README.md    — This file
```

---

## Getting Started

No build step needed:

```bash
# Option 1: Just open index.html in a browser

# Option 2: Local dev server
npx serve .
# or
python3 -m http.server 3000
```

---

## Customization

**Add more emojis** — extend `EMOJI_POOL` array in `app.js`:
```js
const EMOJI_POOL = ["🌙","⭐", /* add more here */ ];
```

**Change difficulty grid sizes** — edit `DIFFICULTY` in `app.js`:
```js
const DIFFICULTY = {
  easy:   { pairs: 8,  cols: 4 },
  medium: { pairs: 10, cols: 5 },
  hard:   { pairs: 18, cols: 6 },
};
```

**Retheme colors** — all tokens are CSS variables at the top of `style.css`:
```css
:root {
  --cyan:    #63b3ed;
  --magenta: #f687b3;
  --bg:      #06080f;
}
```

---

## Browser Support

All modern browsers. Uses CSS `perspective`, `backface-visibility`, `backdrop-filter`, and Canvas 2D API.

---

## License

MIT — free to use and modify.
