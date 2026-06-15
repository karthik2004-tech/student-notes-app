// Morse Code Dictionary
const morseCodeMap = {
  "A": ".-", "B": "-...", "C": "-.-.", "D": "-..", "E": ".",
  "F": "..-.", "G": "--.", "H": "....", "I": "..", "J": ".---",
  "K": "-.-", "L": ".-..", "M": "--", "N": "-.", "O": "---",
  "P": ".--.", "Q": "--.-", "R": ".-.", "S": "...", "T": "-",
  "U": "..-", "V": "...-", "W": ".--", "X": "-..-", "Y": "-.--",
  "Z": "--..",
  "0": "-----", "1": ".----", "2": "..---", "3": "...--",
  "4": "....-", "5": ".....", "6": "-....", "7": "--...",
  "8": "---..", "9": "----.",
  ".": ".-.-.-", ",": "--..--", "?": "..--..", "'": ".----.",
  "!": "-.-.--", "/": "-..-.", "(": "-.--.", ")": "-.--.-",
  "&": ".-...", ":": "---...", ";": "-.-.-.", "=": "-...-",
  "+": ".-.-.", "-": "-....-", "_": "..--.-", "\"": ".-..-.",
  "$": "...-..-", "@": ".--.-."
};

const textInput = document.getElementById("textInput");
const morseOutput = document.getElementById("morseOutput");
const statusEl = document.getElementById("status");

// Convert Text → Morse
function textToMorse() {
  const text = textInput.value.toUpperCase();
  if (!text) {
    statusEl.textContent = "⚠️ Please enter text!";
    return;
  }

  let morse = "";
  for (let char of text) {
    if (char === " ") {
      morse += " / ";
    } else if (morseCodeMap[char]) {
      morse += morseCodeMap[char] + " ";
    }
  }

  morseOutput.value = morse.trim();
  statusEl.textContent = "✅ Converted text to Morse code.";
}

// Convert Morse → Text
function morseToText() {
  const morse = morseOutput.value.trim();
  if (!morse) {
    statusEl.textContent = "⚠️ Please enter Morse code!";
    return;
  }

  const reverseMap = Object.fromEntries(
    Object.entries(morseCodeMap).map(([k, v]) => [v, k])
  );

  let words = morse.split(" / ");
  let decoded = words.map(word =>
    word.split(" ").map(symbol => reverseMap[symbol] || "").join("")
  ).join(" ");

  textInput.value = decoded;
  statusEl.textContent = "✅ Converted Morse code to text.";
}

// Play Morse Audio
function playMorse() {
  const morse = morseOutput.value.trim();
  if (!morse) {
    statusEl.textContent = "⚠️ No Morse code to play!";
    return;
  }

  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let time = audioCtx.currentTime;

  function playTone(duration) {
    const oscillator = audioCtx.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
    oscillator.connect(audioCtx.destination);
    oscillator.start(time);
    oscillator.stop(time + duration);
    time += duration + 0.1;
  }

  for (let symbol of morse) {
    if (symbol === ".") playTone(0.2);
    else if (symbol === "-") playTone(0.6);
    else if (symbol === " ") time += 0.2;
    else if (symbol === "/") time += 0.8;
  }

  statusEl.textContent = "🔊 Playing Morse audio...";
}

// Copy Output
function copyOutput() {
  const output = morseOutput.value;
  if (!output) {
    statusEl.textContent = "⚠️ Nothing to copy!";
    return;
  }
  navigator.clipboard.writeText(output).then(() => {
    statusEl.textContent = "📋 Output copied to clipboard!";
  });
}

// Clear All
function clearAll() {
  textInput.value = "";
  morseOutput.value = "";
  statusEl.textContent = "🧹 Cleared!";
}

// Extra: Keyboard shortcuts
document.addEventListener("keydown", (event) => {
  if (event.ctrlKey && event.key === "Enter") {
    textToMorse();
  }
  if (event.ctrlKey && event.key === "Backspace") {
    clearAll();
  }
});

// Extra: Auto-convert text in real time
textInput.addEventListener("input", () => {
  textToMorse();
});

// Extra: Save last translation in localStorage
function saveState() {
  localStorage.setItem("lastText", textInput.value);
  localStorage.setItem("lastMorse", morseOutput.value);
}
function loadState() {
  const lastText = localStorage.getItem("lastText");
  const lastMorse = localStorage.getItem("lastMorse");
  if (lastText) textInput.value = lastText;
  if (lastMorse) morseOutput.value = lastMorse;
}
window.addEventListener("beforeunload", saveState);
window.addEventListener("load", loadState);
