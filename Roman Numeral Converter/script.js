const arabicInput = document.getElementById("arabicInput");
const romanOutput = document.getElementById("romanOutput");
const romanInput = document.getElementById("romanInput");
const arabicOutput = document.getElementById("arabicOutput");
const statusEl = document.getElementById("status");

// Roman numeral map
const romanMap = [
  { value: 1000, numeral: "M" },
  { value: 900, numeral: "CM" },
  { value: 500, numeral: "D" },
  { value: 400, numeral: "CD" },
  { value: 100, numeral: "C" },
  { value: 90, numeral: "XC" },
  { value: 50, numeral: "L" },
  { value: 40, numeral: "XL" },
  { value: 10, numeral: "X" },
  { value: 9, numeral: "IX" },
  { value: 5, numeral: "V" },
  { value: 4, numeral: "IV" },
  { value: 1, numeral: "I" }
];

// Convert Arabic → Roman
function toRoman(num) {
  if (num < 1 || num > 3999) return null;
  let result = "";
  for (let { value, numeral } of romanMap) {
    while (num >= value) {
      result += numeral;
      num -= value;
    }
  }
  return result;
}

// Convert Roman → Arabic
function toArabic(str) {
  str = str.toUpperCase();
  let i = 0, result = 0;
  while (i < str.length) {
    let two = str.substring(i, i+2);
    let one = str.substring(i, i+1);
    let found = romanMap.find(r => r.numeral === two);
    if (found) {
      result += found.value;
      i += 2;
    } else {
      found = romanMap.find(r => r.numeral === one);
      if (found) {
        result += found.value;
        i++;
      } else {
        return null;
      }
    }
  }
  return result;
}

// Event listeners
arabicInput.addEventListener("input", () => {
  const num = parseInt(arabicInput.value);
  const roman = toRoman(num);
  if (roman) {
    romanOutput.textContent = `Roman: ${roman}`;
    statusEl.textContent = "✅ Valid Arabic number converted.";
  } else {
    romanOutput.textContent = "Roman: —";
    statusEl.textContent = "⚠️ Enter a number between 1 and 3999.";
  }
});

romanInput.addEventListener("input", () => {
  const str = romanInput.value.trim();
  const arabic = toArabic(str);
  if (arabic) {
    arabicOutput.textContent = `Arabic: ${arabic}`;
    statusEl.textContent = "✅ Valid Roman numeral converted.";
  } else {
    arabicOutput.textContent = "Arabic: —";
    statusEl.textContent = "⚠️ Invalid Roman numeral.";
  }
});

// Extra: keyboard shortcuts
document.addEventListener("keydown", (event) => {
  if (event.ctrlKey && event.key === "Enter") {
    const num = parseInt(arabicInput.value);
    if (num) romanOutput.textContent = `Roman: ${toRoman(num)}`;
  }
});

// Extra: sample test cases
console.log("Roman of 1999:", toRoman(1999)); // MCMXCIX
console.log("Arabic of MCMXCIX:", toArabic("MCMXCIX")); // 1999
