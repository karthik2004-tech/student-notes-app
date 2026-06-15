// Using FIGlet.js style font definitions (simplified demo)
const fonts = {
  block: {
    A: ["  ##  "," #  # "," #### "," #  # "," #  # "],
    B: [" ### "," #  #"," ### "," #  #"," ### "],
    // ... add more letters
  },
  bubble: {
    A: [" (\\_/)", " (o.o)", " (> <)"],
    // simplified bubble style
  },
  shadow: {
    A: [" ▄█▄ "," █ █ "," ███ "," █ █ "," █ █ "],
    // simplified shadow style
  },
  standard: {
    A: ["  A  "," A A "," AAA "," A A "," A A "],
    // simplified standard style
  }
};

function generateArt() {
  const text = document.getElementById("inputText").value.toUpperCase();
  const font = document.getElementById("fontSelect").value;
  const output = document.getElementById("output");

  if (!text) {
    output.textContent = "Please enter text.";
    return;
  }

  let lines = ["","","","",""];
  for (let char of text) {
    const art = fonts[font][char] || [char,"","","","",""];
    art.forEach((line, i) => {
      lines[i] += line + "  ";
    });
  }

  output.textContent = lines.join("\n");
}

function copyArt() {
  const output = document.getElementById("output").textContent;
  navigator.clipboard.writeText(output).then(() => {
    alert("ASCII art copied to clipboard!");
  });
}

function downloadArt() {
  const output = document.getElementById("output").textContent;
  const blob = new Blob([output], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "ascii_art.txt";
  a.click();
  URL.revokeObjectURL(url);
}
