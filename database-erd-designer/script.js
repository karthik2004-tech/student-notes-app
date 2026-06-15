/**
 * Database ERD Designer & SQL Generator Logic
 */

// LocalStorage Utility Standard
const StorageUtil = { 
    set(key, value) { 
        try { 
            localStorage.setItem(key, JSON.stringify(value)); 
            return true; 
        } catch (error) { 
            console.error('LocalStorage quota exceeded or unavailable:', error); 
            return false; 
        } 
    }, 
    get(key, defaultValue = null) { 
        try { 
            const item = localStorage.getItem(key); 
            return item ? JSON.parse(item) : defaultValue; 
        } catch (error) { 
            console.error('Error reading from LocalStorage:', error); 
            return defaultValue; 
        } 
    } 
};

// Application State
let tables = [];
let activeEditingTableId = null;

// Target elements
const canvasNodes = document.getElementById("canvasNodes");
const connectionsSvg = document.getElementById("connectionsSvg");
const sqlOutput = document.getElementById("sqlOutput");
const tableModal = document.getElementById("tableModal");
const columnsList = document.getElementById("columnsList");

// Supported data types
const DATA_TYPES = [
    "INT", "BIGINT", "VARCHAR(255)", "VARCHAR(100)", "TEXT", "BOOLEAN", "DATE", "TIMESTAMP", "DECIMAL(10,2)", "FLOAT"
];

// Initialize on Load
document.addEventListener("DOMContentLoaded", () => {
    // Attempt to load from localStorage, otherwise fallback to empty or demo
    const saved = StorageUtil.get("erd_designer_tables", null);
    if (saved && saved.length > 0) {
        tables = saved;
        renderCanvas();
    } else {
        loadDemoSchema();
    }
});

// Save to LocalStorage helper
function saveStateToStorage() {
    StorageUtil.set("erd_designer_tables", tables);
}

// Clear visual workspace
function clearCanvas() {
    if (confirm("Are you sure you want to clear the canvas? All tables will be deleted.")) {
        tables = [];
        renderCanvas();
        saveStateToStorage();
    }
}

// Loads a beautiful pre-populated E-Commerce database model
function loadDemoSchema() {
    tables = [
        {
            id: "table_users",
            name: "users",
            x: 50,
            y: 80,
            columns: [
                { id: "u_id", name: "id", type: "INT", isPK: true, isFK: false, fkRefTable: "", fkRefCol: "" },
                { id: "u_name", name: "username", type: "VARCHAR(100)", isPK: false, isFK: false, fkRefTable: "", fkRefCol: "" },
                { id: "u_email", name: "email", type: "VARCHAR(255)", isPK: false, isFK: false, fkRefTable: "", fkRefCol: "" },
                { id: "u_created", name: "created_at", type: "TIMESTAMP", isPK: false, isFK: false, fkRefTable: "", fkRefCol: "" }
            ]
        },
        {
            id: "table_orders",
            name: "orders",
            x: 420,
            y: 60,
            columns: [
                { id: "o_id", name: "id", type: "INT", isPK: true, isFK: false, fkRefTable: "", fkRefCol: "" },
                { id: "o_user", name: "user_id", type: "INT", isPK: false, isFK: true, fkRefTable: "table_users", fkRefCol: "id" },
                { id: "o_date", name: "order_date", type: "DATE", isPK: false, isFK: false, fkRefTable: "", fkRefCol: "" },
                { id: "o_total", name: "amount", type: "DECIMAL(10,2)", isPK: false, isFK: false, fkRefTable: "", fkRefCol: "" }
            ]
        },
        {
            id: "table_items",
            name: "order_items",
            x: 780,
            y: 150,
            columns: [
                { id: "i_id", name: "id", type: "INT", isPK: true, isFK: false, fkRefTable: "", fkRefCol: "" },
                { id: "i_order", name: "order_id", type: "INT", isPK: false, isFK: true, fkRefTable: "table_orders", fkRefCol: "id" },
                { id: "i_product", name: "product_name", type: "VARCHAR(255)", isPK: false, isFK: false, fkRefTable: "", fkRefCol: "" },
                { id: "i_qty", name: "quantity", type: "INT", isPK: false, isFK: false, fkRefTable: "", fkRefCol: "" }
            ]
        }
    ];
    renderCanvas();
    saveStateToStorage();
}

// Redraw workspace components
function renderCanvas() {
    canvasNodes.innerHTML = "";
    
    tables.forEach(table => {
        const card = document.createElement("div");
        card.className = "table-card";
        card.id = table.id;
        card.style.left = `${table.x}px`;
        card.style.top = `${table.y}px`;

        // Card header with drag support
        const header = document.createElement("div");
        header.className = "table-header";
        
        const title = document.createElement("div");
        title.className = "table-title";
        title.innerHTML = `<i class="fas fa-table"></i> ${table.name}`;
        header.appendChild(title);

        const actions = document.createElement("div");
        actions.className = "table-header-actions";
        actions.innerHTML = `
            <button class="btn-icon" onclick="openEditTableModal('${table.id}')" title="Edit schema"><i class="fas fa-edit"></i></button>
            <button class="btn-icon" onclick="deleteTable('${table.id}')" style="color:var(--error-color);" title="Delete Table"><i class="fas fa-trash"></i></button>
        `;
        header.appendChild(actions);
        card.appendChild(header);

        // Card column rows
        const colsContainer = document.createElement("div");
        colsContainer.className = "table-columns";
        
        table.columns.forEach(col => {
            const row = document.createElement("div");
            row.className = "column-row";
            row.id = `col-row-${col.id}`;

            const nameSide = document.createElement("div");
            nameSide.className = "column-name-side";
            
            let keyIcon = "";
            if (col.isPK) {
                keyIcon = `<i class="fas fa-key key-icon key-pk" title="Primary Key"></i>`;
            } else if (col.isFK) {
                keyIcon = `<i class="fas fa-key key-icon key-fk" title="Foreign Key referencing ${col.fkRefTable}.${col.fkRefCol}"></i>`;
            }
            
            nameSide.innerHTML = `${keyIcon} <span>${col.name}</span>`;
            
            const typeSide = document.createElement("div");
            typeSide.className = "column-type-side";
            typeSide.textContent = col.type.toLowerCase();

            row.appendChild(nameSide);
            row.appendChild(typeSide);
            colsContainer.appendChild(row);
        });

        card.appendChild(colsContainer);
        canvasNodes.appendChild(card);

        // Bind Draggable logic
        makeDraggable(card, header, table);
    });

    // Redraw connectors and update SQL logic
    setTimeout(() => {
        drawRelationships();
        generateSQL();
    }, 50);
}

// Make cards draggable inside canvas
function makeDraggable(element, handle, tableObj) {
    let startX = 0, startY = 0;
    
    handle.onmousedown = (e) => {
        // Only trigger on left-click
        if (e.button !== 0) return;
        
        e.preventDefault();
        startX = e.clientX - element.offsetLeft;
        startY = e.clientY - element.offsetTop;
        
        document.onmousemove = (moveEvent) => {
            moveEvent.preventDefault();
            // Restrict bounds of the canvas
            let newX = Math.max(10, Math.min(2200, moveEvent.clientX - startX));
            let newY = Math.max(10, Math.min(2200, moveEvent.clientY - startY));
            
            element.style.left = `${newX}px`;
            element.style.top = `${newY}px`;
            
            tableObj.x = newX;
            tableObj.y = newY;
            
            // Redraw SVG path dynamically on dragging
            drawRelationships();
        };
        
        document.onmouseup = () => {
            document.onmousemove = null;
            document.onmouseup = null;
            saveStateToStorage();
        };
    };
}

// Draws relative bezier connection paths linking Primary and Foreign Keys
function drawRelationships() {
    connectionsSvg.innerHTML = "";
    
    tables.forEach(sourceTable => {
        sourceTable.columns.forEach(sourceCol => {
            if (sourceCol.isFK && sourceCol.fkRefTable) {
                const targetTable = tables.find(t => t.id === sourceCol.fkRefTable);
                if (!targetTable) return;
                
                // Fetch UI Elements to trace absolute positions
                const sourceRowEl = document.getElementById(`col-row-${sourceCol.id}`);
                const targetRowEl = document.getElementById(`col-row-${targetTable.columns.find(c => c.isPK)?.id}`);
                
                if (sourceRowEl && targetRowEl) {
                    const canvasRect = document.getElementById("canvasViewport").getBoundingClientRect();
                    const sRect = sourceRowEl.getBoundingClientRect();
                    const tRect = targetRowEl.getBoundingClientRect();
                    
                    // Coordinates relative to canvas viewport scroll offsets
                    const scrollLeft = document.getElementById("canvasViewport").scrollLeft;
                    const scrollTop = document.getElementById("canvasViewport").scrollTop;
                    
                    const x1 = sRect.left - canvasRect.left + scrollLeft;
                    const y1 = sRect.top - canvasRect.top + scrollTop + (sRect.height / 2);
                    
                    const x2 = tRect.left - canvasRect.left + scrollLeft + tRect.width;
                    const y2 = tRect.top - canvasRect.top + scrollTop + (tRect.height / 2);
                    
                    // Bezier Curve points
                    const controlOffset = Math.abs(x2 - x1) * 0.5;
                    const d = `M ${x1} ${y1} C ${x1 - controlOffset} ${y1}, ${x2 + controlOffset} ${y2}, ${x2} ${y2}`;
                    
                    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                    path.setAttribute("d", d);
                    path.setAttribute("class", "connection-line");
                    connectionsSvg.appendChild(path);
                }
            }
        });
    });
}

// Opens the definition Modal to add a completely new table
function openNewTableModal() {
    activeEditingTableId = null;
    document.getElementById("modalTitle").textContent = "Create New Table";
    document.getElementById("tableName").value = "";
    columnsList.innerHTML = "";
    
    // Auto populate first Row (Primary Key id)
    addColumnRow("id", "INT", true, false, "", "");
    
    tableModal.classList.add("active");
}

// Opens the definition Modal loaded with existing schema info
function openEditTableModal(tableId) {
    activeEditingTableId = tableId;
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    
    document.getElementById("modalTitle").textContent = `Edit Table: ${table.name}`;
    document.getElementById("tableName").value = table.name;
    columnsList.innerHTML = "";
    
    table.columns.forEach(col => {
        addColumnRow(col.name, col.type, col.isPK, col.isFK, col.fkRefTable, col.fkRefCol);
    });
    
    tableModal.classList.add("active");
}

// Closes Table Modal
function closeTableModal() {
    tableModal.classList.remove("active");
}

// Deletes a selected Table
function deleteTable(tableId) {
    if (confirm("Are you sure you want to delete this table?")) {
        tables = tables.filter(t => t.id !== tableId);
        // Clean references pointing to this table
        tables.forEach(t => {
            t.columns.forEach(c => {
                if (c.isFK && c.fkRefTable === tableId) {
                    c.isFK = false;
                    c.fkRefTable = "";
                    c.fkRefCol = "";
                }
            });
        });
        renderCanvas();
        saveStateToStorage();
    }
}

// Appends editable row definitions inside schema configuration modals
function addColumnRow(name = "", type = "INT", isPK = false, isFK = false, fkTable = "", fkCol = "") {
    const rowId = `row_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    const div = document.createElement("div");
    div.className = "edit-column-row";
    div.id = rowId;
    
    // Column Name input
    const inputName = document.createElement("input");
    inputName.type = "text";
    inputName.placeholder = "column_name";
    inputName.value = name;
    inputName.className = "col-edit-name";
    
    // Type Select dropdown
    const selectType = document.createElement("select");
    selectType.className = "col-edit-type";
    DATA_TYPES.forEach(t => {
        const opt = document.createElement("option");
        opt.value = t;
        opt.textContent = t.toLowerCase();
        if (t === type) opt.selected = true;
        selectType.appendChild(opt);
    });
    
    // PK Checkbox
    const labelPK = document.createElement("label");
    labelPK.className = "checkbox-col";
    labelPK.innerHTML = `<input type="checkbox" class="col-edit-pk" ${isPK ? 'checked' : ''}> PK`;
    
    // FK Checkbox
    const labelFK = document.createElement("label");
    labelFK.className = "checkbox-col";
    labelFK.innerHTML = `<input type="checkbox" class="col-edit-fk" ${isFK ? 'checked' : ''} onchange="toggleFkFields('${rowId}')"> FK`;
    
    // Referenced Tables Selector dropdown
    const selectFkTable = document.createElement("select");
    selectFkTable.className = "col-edit-fk-table";
    selectFkTable.style.display = isFK ? "block" : "none";
    selectFkTable.innerHTML = `<option value="">-- Table --</option>`;
    tables.forEach(t => {
        // Prevent linking to the table itself
        if (t.id !== activeEditingTableId) {
            const opt = document.createElement("option");
            opt.value = t.id;
            opt.textContent = t.name;
            if (t.id === fkTable) opt.selected = true;
            selectFkTable.appendChild(opt);
        }
    });
    
    // Delete column button
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn-icon";
    deleteBtn.style.color = "var(--error-color)";
    deleteBtn.innerHTML = `<i class="fas fa-trash"></i>`;
    deleteBtn.onclick = () => div.remove();
    
    div.appendChild(inputName);
    div.appendChild(selectType);
    div.appendChild(labelPK);
    div.appendChild(labelFK);
    div.appendChild(selectFkTable);
    div.appendChild(deleteBtn);
    
    columnsList.appendChild(div);
}

// Display / hide reference dropdown selectors depending on foreign key activation states
function toggleFkFields(rowId) {
    const row = document.getElementById(rowId);
    if (!row) return;
    const isFkChecked = row.querySelector(".col-edit-fk").checked;
    const selectFkTable = row.querySelector(".col-edit-fk-table");
    selectFkTable.style.display = isFkChecked ? "block" : "none";
}

// Saves table structures from modal state to state container
function saveTable() {
    const nameInput = document.getElementById("tableName").value.trim().toLowerCase();
    if (!nameInput) {
        alert("Please specify a table name.");
        return;
    }
    
    const rows = columnsList.querySelectorAll(".edit-column-row");
    const columns = [];
    
    let hasPK = false;
    for (let r of rows) {
        const colName = r.querySelector(".col-edit-name").value.trim().toLowerCase();
        if (!colName) continue;
        
        const type = r.querySelector(".col-edit-type").value;
        const isPK = r.querySelector(".col-edit-pk").checked;
        const isFK = r.querySelector(".col-edit-fk").checked;
        const fkRefTable = r.querySelector(".col-edit-fk-table").value;
        
        if (isPK) hasPK = true;
        
        columns.push({
            id: activeEditingTableId ? `${activeEditingTableId}_col_${colName}` : `new_col_${colName}_${Math.random().toString(36).substr(2, 5)}`,
            name: colName,
            type,
            isPK,
            isFK,
            fkRefTable: isFK ? fkRefTable : "",
            fkRefCol: isFK ? "id" : "" // Simply links to PK 'id' of referencing table for simplicity
        });
    }
    
    if (columns.length === 0) {
        alert("Please add at least one column.");
        return;
    }
    
    if (activeEditingTableId) {
        // Update Table
        const index = tables.findIndex(t => t.id === activeEditingTableId);
        if (index !== -1) {
            tables[index].name = nameInput;
            tables[index].columns = columns;
        }
    } else {
        // Add new Table
        const newId = `table_${Date.now()}`;
        tables.push({
            id: newId,
            name: nameInput,
            x: 100 + (tables.length * 30) % 300,
            y: 100 + (tables.length * 30) % 300,
            columns
        });
    }
    
    closeTableModal();
    renderCanvas();
    saveStateToStorage();
}

// Computes state schemas to standard SQL script syntax (MySQL, SQLite, PostgreSQL)
function generateSQL() {
    const dialect = document.getElementById("sqlDialect").value;
    let sql = "";
    
    if (tables.length === 0) {
        sqlOutput.textContent = "-- Add tables to view generated SQL here...";
        return;
    }

    if (dialect === "postgresql") {
        sql += `-- Generated PostgreSQL Script\n-- ${new Date().toLocaleDateString()}\n\n`;
    } else if (dialect === "mysql") {
        sql += `-- Generated MySQL Script\n-- ${new Date().toLocaleDateString()}\n\n`;
    } else {
        sql += `-- Generated SQLite Script\n-- ${new Date().toLocaleDateString()}\n\n`;
    }

    tables.forEach(table => {
        sql += `CREATE TABLE ${table.name} (\n`;
        
        const lines = [];
        const fks = [];
        
        table.columns.forEach(col => {
            let colDef = `    ${col.name} ${col.type}`;
            
            if (col.isPK) {
                if (dialect === "postgresql") {
                    colDef = `    ${col.name} SERIAL PRIMARY KEY`;
                } else if (dialect === "mysql") {
                    colDef = `    ${col.name} INT AUTO_INCREMENT PRIMARY KEY`;
                } else {
                    colDef = `    ${col.name} INTEGER PRIMARY KEY AUTOINCREMENT`;
                }
            } else {
                colDef += " NOT NULL";
            }
            
            lines.push(colDef);
            
            if (col.isFK && col.fkRefTable) {
                const target = tables.find(t => t.id === col.fkRefTable);
                if (target) {
                    fks.push(`    FOREIGN KEY (${col.name}) REFERENCES ${target.name}(${col.fkRefCol || 'id'})`);
                }
            }
        });
        
        // Append Foreign key definitions inside SQL tables block
        if (fks.length > 0) {
            lines.push(...fks);
        }
        
        sql += lines.join(",\n");
        sql += `\n);\n\n`;
    });
    
    sqlOutput.textContent = sql;
}

// Copies generated SQL script block parameters to clipboard
function copyToClipboard() {
    const text = sqlOutput.textContent;
    navigator.clipboard.writeText(text).then(() => {
        const copyIcon = document.getElementById("copyIcon");
        copyIcon.className = "fas fa-check";
        copyIcon.style.color = "var(--success-color)";
        
        setTimeout(() => {
            copyIcon.className = "fas fa-copy";
            copyIcon.style.color = "";
        }, 2000);
    });
}

// Triggers native browser triggers to download SQL script definitions
function exportSQLFile() {
    const text = sqlOutput.textContent;
    const blob = new Blob([text], { type: "text/plain" });
    const anchor = document.createElement("a");
    anchor.download = "schema.sql";
    anchor.href = window.URL.createObjectURL(blob);
    anchor.click();
}
