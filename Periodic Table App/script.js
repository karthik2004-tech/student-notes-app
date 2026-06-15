// Sample dataset (you would expand to all 118 elements)
const elements = [
  { symbol: "H", name: "Hydrogen", number: 1, mass: 1.008, category: "Nonmetal" },
  { symbol: "He", name: "Helium", number: 2, mass: 4.0026, category: "Nonmetal" },
  { symbol: "Li", name: "Lithium", number: 3, mass: 6.94, category: "Metal" },
  { symbol: "Be", name: "Beryllium", number: 4, mass: 9.0122, category: "Metal" },
  { symbol: "B", name: "Boron", number: 5, mass: 10.81, category: "Metalloid" },
  { symbol: "C", name: "Carbon", number: 6, mass: 12.011, category: "Nonmetal" },
  { symbol: "N", name: "Nitrogen", number: 7, mass: 14.007, category: "Nonmetal" },
  { symbol: "O", name: "Oxygen", number: 8, mass: 15.999, category: "Nonmetal" },
  { symbol: "F", name: "Fluorine", number: 9, mass: 18.998, category: "Nonmetal" },
  { symbol: "Ne", name: "Neon", number: 10, mass: 20.180, category: "Nonmetal" }
  // ... add all 118 elements here
];

const tableDiv = document.getElementById("periodic-table");
const categoryFilter = document.getElementById("category-filter");
const searchInput = document.getElementById("search-input");

const detailsCard = document.getElementById("element-details");
const elementName = document.getElementById("element-name");
const atomicNumber = document.getElementById("atomic-number");
const atomicMass = document.getElementById("atomic-mass");
const elementCategory = document.getElementById("element-category");

function renderTable() {
  tableDiv.innerHTML = "";
  const filter = categoryFilter.value;
  const search = searchInput.value.toLowerCase();

  elements.forEach(el => {
    if ((filter === "All" || el.category === filter) &&
        (el.name.toLowerCase().includes(search) || el.symbol.toLowerCase().includes(search))) {
      const elDiv = document.createElement("div");
      elDiv.className = "element";
      elDiv.textContent = el.symbol;
      elDiv.addEventListener("click", () => showDetails(el));
      tableDiv.appendChild(elDiv);
    }
  });
}

function showDetails(el) {
  elementName.textContent = el.name;
  atomicNumber.textContent = el.number;
  atomicMass.textContent = el.mass;
  elementCategory.textContent = el.category;
  detailsCard.classList.remove("hidden");
}

categoryFilter.addEventListener("change", renderTable);
searchInput.addEventListener("input", renderTable);

renderTable();
