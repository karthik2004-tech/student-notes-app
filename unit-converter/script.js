const categorySelect = document.getElementById("category");
const fromUnitSelect = document.getElementById("fromUnit");
const toUnitSelect = document.getElementById("toUnit");
const inputValue = document.getElementById("inputValue");
const convertBtn = document.getElementById("convertBtn");
const swapBtn = document.getElementById("swapUnits");
const resultText = document.getElementById("result");

const converterData = {
  currency: {
    label: "Currency",
    units: {
      USD: 1,
      EUR: 0.92,
      GBP: 0.79,
      INR: 83.1,
      JPY: 156.2,
      AUD: 1.51,
      CAD: 1.36
    }
  },
  length: {
    label: "Length",
    units: {
      meter: 1,
      kilometer: 1000,
      centimeter: 0.01,
      millimeter: 0.001,
      mile: 1609.344,
      yard: 0.9144,
      foot: 0.3048,
      inch: 0.0254
    }
  },
  weight: {
    label: "Weight",
    units: {
      kilogram: 1,
      gram: 0.001,
      milligram: 0.000001,
      pound: 0.45359237,
      ounce: 0.028349523125
    }
  },
  temperature: {
    label: "Temperature",
    units: {
      celsius: "celsius",
      fahrenheit: "fahrenheit",
      kelvin: "kelvin"
    }
  }
};

function formatNumber(value) {
  if (!Number.isFinite(value)) {
    return "Invalid result";
  }

  const rounded = Number(value.toFixed(6));
  return rounded.toLocaleString();
}

function updateUnits() {
  const category = categorySelect.value;
  const units = Object.keys(converterData[category].units);

  fromUnitSelect.innerHTML = "";
  toUnitSelect.innerHTML = "";

  units.forEach((unit) => {
    const fromOption = document.createElement("option");
    fromOption.value = unit;
    fromOption.textContent = unit;

    const toOption = document.createElement("option");
    toOption.value = unit;
    toOption.textContent = unit;

    fromUnitSelect.appendChild(fromOption);
    toUnitSelect.appendChild(toOption);
  });

  if (units.length > 1) {
    toUnitSelect.value = units[1];
  }

  resultText.textContent = "Result will appear here.";
}

function convertTemperature(value, from, to) {
  let celsius;

  if (from === "celsius") {
    celsius = value;
  } else if (from === "fahrenheit") {
    celsius = (value - 32) * (5 / 9);
  } else {
    celsius = value - 273.15;
  }

  if (to === "celsius") {
    return celsius;
  }

  if (to === "fahrenheit") {
    return celsius * (9 / 5) + 32;
  }

  return celsius + 273.15;
}

function convert() {
  const category = categorySelect.value;
  const fromUnit = fromUnitSelect.value;
  const toUnit = toUnitSelect.value;
  const value = Number(inputValue.value);

  if (Number.isNaN(value)) {
    resultText.textContent = "Please enter a valid number.";
    return;
  }

  let convertedValue;

  if (category === "temperature") {
    convertedValue = convertTemperature(value, fromUnit, toUnit);
  } else if (category === "currency") {
    const rates = converterData.currency.units;
    const valueInUsd = value / rates[fromUnit];
    convertedValue = valueInUsd * rates[toUnit];
  } else {
    const factors = converterData[category].units;
    const valueInBase = value * factors[fromUnit];
    convertedValue = valueInBase / factors[toUnit];
  }

  resultText.textContent = `${formatNumber(value)} ${fromUnit} = ${formatNumber(convertedValue)} ${toUnit}`;
}

categorySelect.addEventListener("change", updateUnits);
convertBtn.addEventListener("click", convert);
swapBtn.addEventListener("click", () => {
  const temp = fromUnitSelect.value;
  fromUnitSelect.value = toUnitSelect.value;
  toUnitSelect.value = temp;
  convert();
});

inputValue.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    convert();
  }
});

updateUnits();
