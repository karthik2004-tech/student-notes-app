const formulas = {
  physics: [
    {
      name: "Newton's Second Law",
      expression: "F = m × a",
      variables: "F: Force, m: Mass, a: Acceleration"
    },
    {
      name: "Kinetic Energy",
      expression: "KE = 1/2 × m × v²",
      variables: "KE: Kinetic Energy, m: Mass, v: Velocity"
    },
    {
      name: "Ohm's Law",
      expression: "V = I × R",
      variables: "V: Voltage, I: Current, R: Resistance"
    }
  ],
  chemistry: [
    {
      name: "Ideal Gas Law",
      expression: "PV = nRT",
      variables: "P: Pressure, V: Volume, n: Moles, R: Gas Constant, T: Temperature"
    },
    {
      name: "Molarity",
      expression: "M = n / V",
      variables: "M: Molarity, n: Moles, V: Volume (L)"
    },
    {
      name: "Dilution Formula",
      expression: "M1 × V1 = M2 × V2",
      variables: "M: Molarity, V: Volume"
    }
  ],
  maths: [
    {
      name: "Quadratic Formula",
      expression: "x = (-b ± √(b² - 4ac)) / 2a",
      variables: "a, b, c: Coefficients of quadratic equation"
    },
    {
      name: "Area of Circle",
      expression: "A = π × r²",
      variables: "A: Area, r: Radius"
    },
    {
      name: "Pythagoras Theorem",
      expression: "a² + b² = c²",
      variables: "a, b: Legs of right triangle, c: Hypotenuse"
    }
  ]
};

let currentCategory = "physics";

const formulaGrid = document.getElementById("formulaGrid");
const searchInput = document.getElementById("searchInput");

function showCategory(category) {
  currentCategory = category;
  document.querySelectorAll(".tab").forEach(tab => tab.classList.remove("active"));
  document.querySelector(`.tab[onclick="showCategory('${category}')"]`).classList.add("active");
  renderFormulas();
}

function renderFormulas() {
  formulaGrid.innerHTML = "";
  const query = searchInput.value.toLowerCase();
  const list = formulas[currentCategory].filter(f =>
    f.name.toLowerCase().includes(query) ||
    f.expression.toLowerCase().includes(query) ||
    f.variables.toLowerCase().includes(query)
  );

  if (list.length === 0) {
    formulaGrid.innerHTML = "<p>No formulas found.</p>";
    return;
  }

  list.forEach(f => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h3>${f.name}</h3>
      <p><strong>${f.expression}</strong></p>
      <p class="variables">${f.variables}</p>
    `;
    formulaGrid.appendChild(card);
  });
}

searchInput.addEventListener("input", renderFormulas);

// Initial render
renderFormulas();

// Extra: keyboard shortcut to focus search
document.addEventListener("keydown", (event) => {
  if (event.ctrlKey && event.key === "/") {
    event.preventDefault();
    searchInput.focus();
  }
});

// Extra: add more formulas dynamically
formulas.physics.push({
  name: "Gravitational Potential Energy",
  expression: "PE = m × g × h",
  variables: "PE: Potential Energy, m: Mass, g: Gravity, h: Height"
});

formulas.chemistry.push({
  name: "Density",
  expression: "ρ = m / V",
  variables: "ρ: Density, m: Mass, V: Volume"
});

formulas.maths.push({
  name: "Slope of Line",
  expression: "m = (y2 - y1) / (x2 - x1)",
  variables: "m: Slope, (x1,y1),(x2,y2): Points"
});
