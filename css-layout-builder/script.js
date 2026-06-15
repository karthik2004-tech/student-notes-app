document.addEventListener('DOMContentLoaded', () => {

    // --- State ---
    let currentMode = 'flex'; // 'flex' or 'grid'
    let itemCount = 4;

    // --- DOM Elements ---
    const btnModeFlex = document.getElementById('btn-mode-flex');
    const btnModeGrid = document.getElementById('btn-mode-grid');
    const flexControls = document.getElementById('flex-controls');
    const gridControls = document.getElementById('grid-controls');
    
    const previewContainer = document.getElementById('preview-container');
    const btnAddItem = document.getElementById('btn-add-item');
    const btnRemoveItem = document.getElementById('btn-remove-item');

    const codeCss = document.getElementById('code-css');
    const codeHtml = document.getElementById('code-html');
    const btnCopy = document.getElementById('btn-copy');

    // Flex Inputs
    const flexDir = document.getElementById('flex-direction');
    const flexJustify = document.getElementById('flex-justify');
    const flexAlign = document.getElementById('flex-align');
    const flexWrap = document.getElementById('flex-wrap');
    const flexGap = document.getElementById('flex-gap');

    // Grid Inputs
    const gridCols = document.getElementById('grid-cols');
    const gridRows = document.getElementById('grid-rows');
    const gridJustify = document.getElementById('grid-justify');
    const gridAlign = document.getElementById('grid-align');
    const gridGap = document.getElementById('grid-gap');

    // All Inputs Array (to easily attach event listeners)
    const allInputs = [
        flexDir, flexJustify, flexAlign, flexWrap, flexGap,
        gridCols, gridRows, gridJustify, gridAlign, gridGap
    ];

    // --- 1. Mode Toggling ---
    btnModeFlex.addEventListener('click', () => setMode('flex'));
    btnModeGrid.addEventListener('click', () => setMode('grid'));

    function setMode(mode) {
        currentMode = mode;
        if (mode === 'flex') {
            btnModeFlex.classList.add('active');
            btnModeGrid.classList.remove('active');
            flexControls.style.display = 'flex';
            gridControls.style.display = 'none';
        } else {
            btnModeGrid.classList.add('active');
            btnModeFlex.classList.remove('active');
            gridControls.style.display = 'flex';
            flexControls.style.display = 'none';
        }
        updateLayout();
    }

    // --- 2. Item Management ---
    btnAddItem.addEventListener('click', () => {
        itemCount++;
        renderItems();
        updateLayout();
    });

    btnRemoveItem.addEventListener('click', () => {
        if (itemCount > 1) {
            itemCount--;
            renderItems();
            updateLayout();
        }
    });

    function renderItems() {
        previewContainer.innerHTML = '';
        for (let i = 1; i <= itemCount; i++) {
            const div = document.createElement('div');
            div.className = 'preview-item';
            div.textContent = i;
            previewContainer.appendChild(div);
        }
    }

    // --- 3. Dynamic Styling & Code Generation ---
    allInputs.forEach(input => {
        input.addEventListener('input', updateLayout);
        input.addEventListener('change', updateLayout);
    });

    function updateLayout() {
        // Reset styles first
        previewContainer.style = '';
        
        let cssString = `.container {\n`;
        cssString += `  display: ${currentMode};\n`;
        previewContainer.style.display = currentMode;

        if (currentMode === 'flex') {
            // Apply Flex Styles
            previewContainer.style.flexDirection = flexDir.value;
            previewContainer.style.justifyContent = flexJustify.value;
            previewContainer.style.alignItems = flexAlign.value;
            previewContainer.style.flexWrap = flexWrap.value;
            previewContainer.style.gap = flexGap.value || '0px';

            // Build CSS String
            if (flexDir.value !== 'row') cssString += `  flex-direction: ${flexDir.value};\n`;
            if (flexJustify.value !== 'flex-start') cssString += `  justify-content: ${flexJustify.value};\n`;
            if (flexAlign.value !== 'stretch') cssString += `  align-items: ${flexAlign.value};\n`;
            if (flexWrap.value !== 'nowrap') cssString += `  flex-wrap: ${flexWrap.value};\n`;
            if (flexGap.value) cssString += `  gap: ${flexGap.value};\n`;
            
        } else if (currentMode === 'grid') {
            // Apply Grid Styles
            previewContainer.style.gridTemplateColumns = gridCols.value;
            previewContainer.style.gridTemplateRows = gridRows.value;
            previewContainer.style.justifyItems = gridJustify.value;
            previewContainer.style.alignItems = gridAlign.value;
            previewContainer.style.gap = gridGap.value || '0px';

            // Build CSS String
            if (gridCols.value) cssString += `  grid-template-columns: ${gridCols.value};\n`;
            if (gridRows.value && gridRows.value !== 'auto') cssString += `  grid-template-rows: ${gridRows.value};\n`;
            if (gridJustify.value !== 'stretch') cssString += `  justify-items: ${gridJustify.value};\n`;
            if (gridAlign.value !== 'stretch') cssString += `  align-items: ${gridAlign.value};\n`;
            if (gridGap.value) cssString += `  gap: ${gridGap.value};\n`;
        }

        cssString += `}\n\n`;
        cssString += `.item {\n  /* Add your item styles */\n}`;
        
        // Build HTML String
        let htmlString = `<div class="container">\n`;
        for (let i = 1; i <= itemCount; i++) {
            htmlString += `  <div class="item">${i}</div>\n`;
        }
        htmlString += `</div>`;

        // Render to UI
        codeCss.textContent = cssString;
        codeHtml.textContent = htmlString;
    }

    // --- 4. Copy to Clipboard ---
    btnCopy.addEventListener('click', () => {
        const textToCopy = `/* CSS */\n${codeCss.textContent}\n\n<!-- HTML -->\n${codeHtml.textContent}`;
        navigator.clipboard.writeText(textToCopy).then(() => {
            const originalText = btnCopy.innerHTML;
            btnCopy.innerHTML = '<i class="fas fa-check"></i> Copied!';
            setTimeout(() => {
                btnCopy.innerHTML = originalText;
            }, 2000);
        });
    });

    // Initialize
    renderItems();
    updateLayout();
});
