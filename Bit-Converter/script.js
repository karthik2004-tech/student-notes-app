const decimalInput = document.getElementById("decimal");
const binaryInput = document.getElementById("binary");
const hexInput = document.getElementById("hex");
const octalInput = document.getElementById("octal");

function updateFromDecimal() {
  const value = parseInt(decimalInput.value, 10);
  if (!isNaN(value)) {
    binaryInput.value = value.toString(2);
    hexInput.value = value.toString(16).toUpperCase();
    octalInput.value = value.toString(8);
  }
}

function updateFromBinary() {
  const value = parseInt(binaryInput.value, 2);
  if (!isNaN(value)) {
    decimalInput.value = value;
    hexInput.value = value.toString(16).toUpperCase();
    octalInput.value = value.toString(8);
  }
}

function updateFromHex() {
  const value = parseInt(hexInput.value, 16);
  if (!isNaN(value)) {
    decimalInput.value = value;
    binaryInput.value = value.toString(2);
    octalInput.value = value.toString(8);
  }
}

function updateFromOctal() {
  const value = parseInt(octalInput.value, 8);
  if (!isNaN(value)) {
    decimalInput.value = value;
    binaryInput.value = value.toString(2);
    hexInput.value = value.toString(16).toUpperCase();
  }
}

decimalInput.addEventListener("input", updateFromDecimal);
binaryInput.addEventListener("input", updateFromBinary);
hexInput.addEventListener("input", updateFromHex);
octalInput.addEventListener("input", updateFromOctal);
