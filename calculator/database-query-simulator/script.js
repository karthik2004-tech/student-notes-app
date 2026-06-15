document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Initialize Sample Database using AlaSQL
    alasql("CREATE TABLE users (id INT, name STRING, email STRING, role STRING, created_at DATE)");
    alasql("INSERT INTO users VALUES (1, 'Alice Smith', 'alice@example.com', 'Admin', '2023-01-15')");
    alasql("INSERT INTO users VALUES (2, 'Bob Jones', 'bob@example.com', 'User', '2023-02-20')");
    alasql("INSERT INTO users VALUES (3, 'Charlie Brown', 'charlie@example.com', 'User', '2023-03-10')");
    alasql("INSERT INTO users VALUES (4, 'Diana Prince', 'diana@example.com', 'Manager', '2023-04-05')");
    alasql("INSERT INTO users VALUES (5, 'Evan Wright', 'evan@example.com', 'User', '2023-05-12')");

    alasql("CREATE TABLE products (id INT, title STRING, category STRING, price NUMBER, stock INT)");
    alasql("INSERT INTO products VALUES (101, 'Laptop Pro', 'Electronics', 1299.99, 45)");
    alasql("INSERT INTO products VALUES (102, 'Wireless Mouse', 'Electronics', 49.99, 120)");
    alasql("INSERT INTO products VALUES (103, 'Coffee Mug', 'Home', 12.50, 300)");
    alasql("INSERT INTO products VALUES (104, 'Mechanical Keyboard', 'Electronics', 159.00, 60)");
    alasql("INSERT INTO products VALUES (105, 'Desk Lamp', 'Home', 35.00, 85)");

    // Define schema metadata for the UI sidebar
    const schemaMeta = [
        {
            name: 'users',
            columns: [
                { name: 'id', type: 'INT' },
                { name: 'name', type: 'STRING' },
                { name: 'email', type: 'STRING' },
                { name: 'role', type: 'STRING' },
                { name: 'created_at', type: 'DATE' }
            ]
        },
        {
            name: 'products',
            columns: [
                { name: 'id', type: 'INT' },
                { name: 'title', type: 'STRING' },
                { name: 'category', type: 'STRING' },
                { name: 'price', type: 'NUMBER' },
                { name: 'stock', type: 'INT' }
            ]
        }
    ];

    // 2. Render Schema in Sidebar
    const schemaList = document.getElementById('schema-list');
    schemaMeta.forEach(table => {
        const tableDiv = document.createElement('div');
        tableDiv.className = 'table-item';
        
        let colsHtml = table.columns.map(col => `
            <li>
                <span class="col-name">${col.name}</span>
                <span class="col-type">${col.type}</span>
            </li>
        `).join('');

        tableDiv.innerHTML = `
            <div class="table-name">
                <i class="ph ph-table"></i> ${table.name}
            </div>
            <ul class="column-list">
                ${colsHtml}
            </ul>
        `;
        schemaList.appendChild(tableDiv);
    });

    // 3. UI Elements
    const editor = document.getElementById('sql-editor');
    const runBtn = document.getElementById('run-btn');
    const clearBtn = document.getElementById('clear-btn');
    const statusBadge = document.getElementById('status-badge');
    const errorMsg = document.getElementById('error-message');
    const emptyState = document.getElementById('empty-state');
    const resultsTable = document.getElementById('results-table');
    const resultsThead = document.getElementById('results-thead');
    const resultsTbody = document.getElementById('results-tbody');

    // 4. Run Query Logic
    runBtn.addEventListener('click', () => {
        const query = editor.value.trim();
        
        // Reset UI state
        errorMsg.classList.add('hidden');
        resultsTable.classList.add('hidden');
        emptyState.classList.add('hidden');
        resultsThead.innerHTML = '';
        resultsTbody.innerHTML = '';

        if (!query) {
            showError("Please enter a SQL query.");
            return;
        }

        try {
            // Execute using AlaSQL
            const result = alasql(query);
            
            // Handle SELECT queries (returns array of objects)
            if (Array.isArray(result)) {
                if (result.length === 0) {
                    setStatus('Success', 'success');
                    emptyState.innerHTML = `<i class="ph ph-check-circle"></i><p>Query executed successfully. 0 rows returned.</p>`;
                    emptyState.classList.remove('hidden');
                } else {
                    renderTable(result);
                    setStatus(`Success (${result.length} rows)`, 'success');
                }
            } else {
                // Handle non-SELECT queries (returns number of affected rows)
                setStatus('Success', 'success');
                emptyState.innerHTML = `<i class="ph ph-check-circle"></i><p>Query executed successfully. Rows affected: ${result}</p>`;
                emptyState.classList.remove('hidden');
            }
        } catch (err) {
            showError(err.message);
        }
    });

    // Handle Clear logic
    clearBtn.addEventListener('click', () => {
        editor.value = '';
        editor.focus();
    });

    // Helpers
    function renderTable(data) {
        // Generate Headers
        const columns = Object.keys(data[0]);
        const headerRow = document.createElement('tr');
        columns.forEach(col => {
            const th = document.createElement('th');
            th.textContent = col;
            headerRow.appendChild(th);
        });
        resultsThead.appendChild(headerRow);

        // Generate Rows
        data.forEach(row => {
            const tr = document.createElement('tr');
            columns.forEach(col => {
                const td = document.createElement('td');
                td.textContent = row[col] !== null ? row[col] : 'NULL';
                tr.appendChild(td);
            });
            resultsTbody.appendChild(tr);
        });

        resultsTable.classList.remove('hidden');
    }

    function showError(msg) {
        errorMsg.textContent = `Error: ${msg}`;
        errorMsg.classList.remove('hidden');
        setStatus('Error', 'error');
    }

    function setStatus(text, type) {
        statusBadge.textContent = text;
        statusBadge.className = `status-badge ${type}`;
    }
});
