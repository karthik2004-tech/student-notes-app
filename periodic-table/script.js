// We will fetch a subset of elements or hardcode a representative set to make it fully functional without complex external APIs
// For a complete app, we'd load a full JSON. For this implementation, let's use an array of objects.

const elementsData = [
  { number: 1, symbol: 'H', name: 'Hydrogen', mass: '1.008', xpos: 1, ypos: 1, category: 'diatomic-nonmetal', phase: 'Gas', discovered_by: 'Henry Cavendish', summary: 'Hydrogen is the chemical element with the symbol H and atomic number 1. With a standard atomic weight of 1.008, hydrogen is the lightest element in the periodic table.' },
  { number: 2, symbol: 'He', name: 'Helium', mass: '4.0026', xpos: 18, ypos: 1, category: 'noble-gas', phase: 'Gas', discovered_by: 'Pierre Janssen', summary: 'Helium is a chemical element with the symbol He and atomic number 2. It is a colorless, odorless, tasteless, non-toxic, inert, monatomic gas, the first in the noble gas group in the periodic table.' },
  { number: 3, symbol: 'Li', name: 'Lithium', mass: '6.94', xpos: 1, ypos: 2, category: 'alkali-metal', phase: 'Solid', discovered_by: 'Johan August Arfwedson', summary: 'Lithium is a chemical element with the symbol Li and atomic number 3. It is a soft, silvery-white alkali metal.' },
  { number: 4, symbol: 'Be', name: 'Beryllium', mass: '9.0122', xpos: 2, ypos: 2, category: 'alkaline-earth-metal', phase: 'Solid', discovered_by: 'Louis Nicolas Vauquelin', summary: 'Beryllium is a chemical element with the symbol Be and atomic number 4. It is a relatively rare element in the universe.' },
  { number: 5, symbol: 'B', name: 'Boron', mass: '10.81', xpos: 13, ypos: 2, category: 'metalloid', phase: 'Solid', discovered_by: 'Joseph Louis Gay-Lussac', summary: 'Boron is a chemical element with the symbol B and atomic number 5. Produced entirely by cosmic ray spallation and supernovae and not by stellar nucleosynthesis.' },
  { number: 6, symbol: 'C', name: 'Carbon', mass: '12.011', xpos: 14, ypos: 2, category: 'polyatomic-nonmetal', phase: 'Solid', discovered_by: 'Ancient Egypt', summary: 'Carbon is a chemical element with the symbol C and atomic number 6. It is nonmetallic and tetravalent—making four electrons available to form covalent chemical bonds.' },
  { number: 7, symbol: 'N', name: 'Nitrogen', mass: '14.007', xpos: 15, ypos: 2, category: 'diatomic-nonmetal', phase: 'Gas', discovered_by: 'Daniel Rutherford', summary: 'Nitrogen is the chemical element with the symbol N and atomic number 7. It was first discovered and isolated by Scottish physician Daniel Rutherford in 1772.' },
  { number: 8, symbol: 'O', name: 'Oxygen', mass: '15.999', xpos: 16, ypos: 2, category: 'diatomic-nonmetal', phase: 'Gas', discovered_by: 'Carl Wilhelm Scheele', summary: 'Oxygen is the chemical element with the symbol O and atomic number 8. It is a member of the chalcogen group in the periodic table, a highly reactive nonmetal, and an oxidizing agent.' },
  { number: 9, symbol: 'F', name: 'Fluorine', mass: '18.998', xpos: 17, ypos: 2, category: 'diatomic-nonmetal', phase: 'Gas', discovered_by: 'André-Marie Ampère', summary: 'Fluorine is a chemical element with the symbol F and atomic number 9. It is the lightest halogen and exists at standard conditions as a highly toxic, pale yellow diatomic gas.' },
  { number: 10, symbol: 'Ne', name: 'Neon', mass: '20.180', xpos: 18, ypos: 2, category: 'noble-gas', phase: 'Gas', discovered_by: 'Morris Travers', summary: 'Neon is a chemical element with the symbol Ne and atomic number 10. It is a noble gas.' },
  // Adding a few more to show layout
  { number: 11, symbol: 'Na', name: 'Sodium', mass: '22.990', xpos: 1, ypos: 3, category: 'alkali-metal', phase: 'Solid', discovered_by: 'Humphry Davy', summary: 'Sodium is a chemical element with the symbol Na.' },
  { number: 12, symbol: 'Mg', name: 'Magnesium', mass: '24.305', xpos: 2, ypos: 3, category: 'alkaline-earth-metal', phase: 'Solid', discovered_by: 'Joseph Black', summary: 'Magnesium is a chemical element with the symbol Mg.' },
  { number: 26, symbol: 'Fe', name: 'Iron', mass: '55.845', xpos: 8, ypos: 4, category: 'transition-metal', phase: 'Solid', discovered_by: '5000 BC', summary: 'Iron is a chemical element with symbol Fe and atomic number 26. It is a metal that belongs to the first transition series and group 8 of the periodic table.' },
  { number: 79, symbol: 'Au', name: 'Gold', mass: '196.97', xpos: 11, ypos: 6, category: 'transition-metal', phase: 'Solid', discovered_by: 'Middle East', summary: 'Gold is a chemical element with the symbol Au and atomic number 79.' },
];

document.addEventListener('DOMContentLoaded', () => {
  const tableContainer = document.getElementById('periodic-table');
  const modal = document.getElementById('element-modal');
  const closeBtn = document.getElementById('close-modal');

  // Modal elements
  const mSymbol = document.getElementById('modal-symbol');
  const mName = document.getElementById('modal-name');
  const mCategory = document.getElementById('modal-category');
  const mNumber = document.getElementById('modal-number');
  const mMass = document.getElementById('modal-mass');
  const mPhase = document.getElementById('modal-phase');
  const mDiscovered = document.getElementById('modal-discovered');
  const mSummary = document.getElementById('modal-summary');

  // Build the grid
  elementsData.forEach(el => {
    const elDiv = document.createElement('div');
    elDiv.className = `element ${el.category}`;
    // Position using CSS Grid
    elDiv.style.gridColumn = el.xpos;
    elDiv.style.gridRow = el.ypos;

    elDiv.innerHTML = `
      <span class="number">${el.number}</span>
      <span class="symbol">${el.symbol}</span>
      <span class="name">${el.name}</span>
      <span class="mass">${el.mass}</span>
    `;

    elDiv.addEventListener('click', () => {
      openModal(el);
    });

    tableContainer.appendChild(elDiv);
  });

  function openModal(el) {
    mSymbol.textContent = el.symbol;
    
    // Get computed background color of the element for the modal symbol
    const tempDiv = document.createElement('div');
    tempDiv.className = el.category;
    document.body.appendChild(tempDiv);
    const bgColor = getComputedStyle(tempDiv).backgroundColor;
    document.body.removeChild(tempDiv);
    
    mSymbol.style.backgroundColor = bgColor;
    
    mName.textContent = el.name;
    mCategory.textContent = el.category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    mNumber.textContent = el.number;
    mMass.textContent = el.mass;
    mPhase.textContent = el.phase;
    mDiscovered.textContent = el.discovered_by || 'Unknown';
    mSummary.textContent = el.summary;

    modal.classList.add('active');
  }

  closeBtn.addEventListener('click', () => {
    modal.classList.remove('active');
  });

  // Close modal when clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
    }
  });
});
