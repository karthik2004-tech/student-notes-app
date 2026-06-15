/**
 * Interactive SQL Database Query Playground Logic
 */

// Mock Databases Schemas & Seed Scripts
const MOCK_SCHEMAS = {
    ecommerce: {
        setup: `
            CREATE TABLE customers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE,
                city TEXT
            );
            CREATE TABLE products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                price REAL NOT NULL,
                category TEXT,
                stock INTEGER
            );
            CREATE TABLE orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_id INTEGER,
                order_date TEXT,
                total REAL,
                FOREIGN KEY (customer_id) REFERENCES customers(id)
            );
            CREATE TABLE order_details (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER,
                product_id INTEGER,
                quantity INTEGER,
                FOREIGN KEY (order_id) REFERENCES orders(id),
                FOREIGN KEY (product_id) REFERENCES products(id)
            );

            INSERT INTO customers (name, email, city) VALUES 
            ('Alice Johnson', 'alice@gmail.com', 'New York'),
            ('Bob Smith', 'bob@yahoo.com', 'San Francisco'),
            ('Charlie Brown', 'charlie@gmail.com', 'Chicago'),
            ('Diana Prince', 'diana@amazon.com', 'Boston');

            INSERT INTO products (name, price, category, stock) VALUES 
            ('Wireless Headphones', 99.99, 'Electronics', 50),
            ('Ergonomic Keyboard', 49.99, 'Electronics', 30),
            ('Leather Journal', 19.99, 'Stationery', 100),
            ('Stainless Flask', 24.99, 'Home Goods', 75);

            INSERT INTO orders (customer_id, order_date, total) VALUES 
            (1, '2026-06-01', 149.98),
            (2, '2026-06-02', 19.99),
            (3, '2026-06-03', 124.98),
            (1, '2026-06-04', 24.99);

            INSERT INTO order_details (order_id, product_id, quantity) VALUES 
            (1, 1, 1),
            (1, 2, 1),
            (2, 3, 1),
            (3, 1, 1),
            (3, 4, 1),
            (4, 4, 1);
        `,
        defaultQuery: `-- Find details of all orders including customer and product names\nSELECT \n    o.id AS order_id,\n    c.name AS customer_name,\n    p.name AS product_name,\n    od.quantity,\n    p.price,\n    o.order_date\nFROM orders o\nJOIN customers c ON o.customer_id = c.id\nJOIN order_details od ON od.order_id = o.id\nJOIN products p ON od.product_id = p.id;`,
        erd: [
            { table: "customers", fields: ["id (PK)", "name", "email", "city"], fks: [] },
            { table: "products", fields: ["id (PK)", "name", "price", "category", "stock"], fks: [] },
            { table: "orders", fields: ["id (PK)", "customer_id (FK)", "order_date", "total"], fks: ["customer_id -> customers.id"] },
            { table: "order_details", fields: ["id (PK)", "order_id (FK)", "product_id (FK)", "quantity"], fks: ["order_id -> orders.id", "product_id -> products.id"] }
        ]
    },
    university: {
        setup: `
            CREATE TABLE students (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                major TEXT,
                enrollment_year INTEGER
            );
            CREATE TABLE books (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                author TEXT,
                copies INTEGER
            );
            CREATE TABLE borrowings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id INTEGER,
                book_id INTEGER,
                borrow_date TEXT,
                return_date TEXT,
                FOREIGN KEY (student_id) REFERENCES students(id),
                FOREIGN KEY (book_id) REFERENCES books(id)
            );

            INSERT INTO students (name, major, enrollment_year) VALUES 
            ('Emma Watson', 'Computer Science', 2024),
            ('Liam Neeson', 'History', 2023),
            ('Sophia Loren', 'Literature', 2025),
            ('Noah Centineo', 'Mathematics', 2024);

            INSERT INTO books (title, author, copies) VALUES 
            ('Introduction to Algorithms', 'Thomas H. Cormen', 5),
            ('A History of the World', 'Andrew Marr', 3),
            ('The Great Gatsby', 'F. Scott Fitzgerald', 8),
            ('Calculus Vol 1', 'Tom M. Apostol', 4);

            INSERT INTO borrowings (student_id, book_id, borrow_date, return_date) VALUES 
            (1, 1, '2026-05-10', '2026-05-24'),
            (2, 2, '2026-05-12', NULL),
            (3, 3, '2026-05-15', '2026-05-30'),
            (1, 4, '2026-05-18', NULL);
        `,
        defaultQuery: `-- Retrieve books that are currently borrowed but not returned yet\nSELECT \n    s.name AS student,\n    b.title AS book_title,\n    br.borrow_date\nFROM borrowings br\nJOIN students s ON br.student_id = s.id\nJOIN books b ON br.book_id = b.id\nWHERE br.return_date IS NULL;`,
        erd: [
            { table: "students", fields: ["id (PK)", "name", "major", "enrollment_year"], fks: [] },
            { table: "books", fields: ["id (PK)", "title", "author", "copies"], fks: [] },
            { table: "borrowings", fields: ["id (PK)", "student_id (FK)", "book_id (FK)", "borrow_date", "return_date"], fks: ["student_id -> students.id", "book_id -> books.id"] }
        ]
    },
    hr: {
        setup: `
            CREATE TABLE departments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                budget REAL
            );
            CREATE TABLE employees (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                role TEXT,
                hire_date TEXT,
                department_id INTEGER,
                FOREIGN KEY (department_id) REFERENCES departments(id)
            );
            CREATE TABLE salaries (
                employee_id INTEGER PRIMARY KEY,
                amount REAL,
                bonus REAL,
                FOREIGN KEY (employee_id) REFERENCES employees(id)
            );

            INSERT INTO departments (name, budget) VALUES 
            ('Engineering', 250000.00),
            ('Marketing', 100000.00),
            ('Sales', 150000.00),
            ('Human Resources', 60000.00);

            INSERT INTO employees (name, role, hire_date, department_id) VALUES 
            ('John Doe', 'Senior Software Engineer', '2022-03-15', 1),
            ('Jane Miller', 'Marketing Manager', '2023-08-01', 2),
            ('William Foster', 'Account Executive', '2024-01-10', 3),
            ('Sophia Davis', 'HR Coordinator', '2024-06-20', 4),
            ('James Wilson', 'Junior Web Developer', '2025-02-01', 1);

            INSERT INTO salaries (employee_id, amount, bonus) VALUES 
            (1, 95000.00, 10000.00),
            (2, 75000.00, 5000.00),
            (3, 60000.00, 15000.00),
            (4, 50000.00, 2000.00),
            (5, 45000.00, 1000.00);
        `,
        defaultQuery: `-- Calculate total compensation (salary + bonus) grouped by department\nSELECT \n    d.name AS department,\n    COUNT(e.id) AS employee_count,\n    SUM(s.amount + s.bonus) AS total_department_compensation\nFROM employees e\nJOIN departments d ON e.department_id = d.id\nJOIN salaries s ON s.employee_id = e.id\nGROUP BY d.name\nORDER BY total_department_compensation DESC;`,
        erd: [
            { table: "departments", fields: ["id (PK)", "name", "budget"], fks: [] },
            { table: "employees", fields: ["id (PK)", "name", "role", "hire_date", "department_id (FK)"], fks: ["department_id -> departments.id"] },
            { table: "salaries", fields: ["employee_id (PK/FK)", "amount", "bonus"], fks: ["employee_id -> employees.id"] }
        ]
    }
};

// Global DB Instances
let SQL = null;
let activeDb = null;
let activeSchemaKey = "ecommerce";

// Initialize sql.js WebAssembly
document.addEventListener("DOMContentLoaded", () => {
    const locateWasmFile = filename => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${filename}`;
    
    // Check if initSqlJs is loaded
    if (typeof initSqlJs !== 'undefined') {
        initSqlJs({ locateFile: locateWasmFile })
            .then(sql => {
                SQL = sql;
                switchDatabase();
            })
            .catch(err => {
                showErrorConsole(`WASM SQL engine load crash:\n${err.message}`);
            });
    } else {
        showErrorConsole("Failed to resolve SQLite WASM dependency. Ensure internet connection is active.");
    }
});

function switchDatabase() {
    activeSchemaKey = document.getElementById("databaseSelect").value;
    resetActiveDatabase();
}

function resetActiveDatabase() {
    if (!SQL) return;

    try {
        // Create new SQLite memory Database
        activeDb = new SQL.Database();
        
        const schema = MOCK_SCHEMAS[activeSchemaKey];
        if (schema) {
            // Run seeding tables and rows
            activeDb.run(schema.setup);
            
            // Set query editor text
            document.getElementById("sqlEditorInput").value = schema.defaultQuery;
            
            // Refresh Schema and ERD HUDs
            refreshSchemaVisualizer();
            refreshErdVisualizer(schema.erd);
            
            // Clear result grids
            clearViewportConsole();
        }
    } catch (e) {
        showErrorConsole(`Database Reset Error:\n${e.message}`);
    }
}

// Intercept and Execute queries
function runSqlQuery() {
    if (!activeDb) return;

    const query = document.getElementById("sqlEditorInput").value.trim();
    if (!query) {
        alert("Please write a query first!");
        return;
    }

    try {
        // Run SQL execution
        const res = activeDb.exec(query);
        
        // Render Output table or success logs
        if (res.length > 0) {
            renderResultsTable(res[0]);
        } else {
            // Write commands like UPDATE/DELETE/INSERT don't return values
            const modified = activeDb.getRowsModified();
            renderSuccessConsole(`Query executed successfully.\nRows modified/affected: ${modified}`);
            
            // Auto update schema in case users created or altered tables
            refreshSchemaVisualizer();
        }
    } catch (e) {
        showErrorConsole(`SQL Execution Error:\n${e.message}`);
    }
}

// Render Results HTML Data Grid
function renderResultsTable(resultSet) {
    const container = document.getElementById("resultsViewport");
    container.innerHTML = "";

    const tableWrapper = document.createElement("div");
    tableWrapper.className = "results-table-container";

    const table = document.createElement("table");
    table.className = "results-table";

    // Headers
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    resultSet.columns.forEach(col => {
        const th = document.createElement("th");
        th.textContent = col;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Rows values
    const tbody = document.createElement("tbody");
    resultSet.values.forEach(row => {
        const tr = document.createElement("tr");
        row.forEach(val => {
            const td = document.createElement("td");
            td.textContent = val !== null ? val : "NULL";
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    tableWrapper.appendChild(table);
    container.appendChild(tableWrapper);
}

// Schema sidebar visualizer drawer
function refreshSchemaVisualizer() {
    const schemaList = document.getElementById("schemaList");
    if (!schemaList || !activeDb) return;

    schemaList.innerHTML = "";

    try {
        // Query list of user tables in sqlite_master
        const tablesRes = activeDb.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';");
        if (tablesRes.length === 0) {
            schemaList.innerHTML = "<p style='font-size: 0.8rem; opacity: 0.7;'>No tables defined.</p>";
            return;
        }

        const tables = tablesRes[0].values;
        tables.forEach(tableRow => {
            const tableName = tableRow[0];

            const tableItem = document.createElement("div");
            tableItem.className = "schema-table-item";

            // Header block
            const header = document.createElement("div");
            header.className = "schema-table-header";
            header.innerHTML = `<span>📂 ${tableName}</span><span>▾</span>`;
            
            // Columns sub-list block
            const columnsList = document.createElement("div");
            columnsList.className = "schema-table-columns";
            columnsList.id = `cols-${tableName}`;

            // Fetch columns structure via PRAGMA
            const colsRes = activeDb.exec(`PRAGMA table_info(${tableName});`);
            if (colsRes.length > 0) {
                colsRes[0].values.forEach(colInfo => {
                    const colName = colInfo[1];
                    const colType = colInfo[2];
                    const isPk = colInfo[5] === 1;

                    const colRow = document.createElement("div");
                    colRow.className = "schema-column-row";
                    colRow.innerHTML = `
                        <span>${isPk ? "🔑 " : ""}${colName}</span>
                        <span>${colType}</span>
                    `;
                    columnsList.appendChild(colRow);
                });
            }

            // Accordion toggle click handler
            header.onclick = () => {
                const isHidden = columnsList.style.display === "none";
                columnsList.style.display = isHidden ? "block" : "none";
                header.querySelector("span:last-child").textContent = isHidden ? "▾" : "▸";
            };

            tableItem.appendChild(header);
            tableItem.appendChild(columnsList);
            schemaList.appendChild(tableItem);
        });

    } catch (e) {
        schemaList.innerHTML = `<p style='color: var(--color-error); font-size: 0.8rem;'>Error loading schema:\n${e.message}</p>`;
    }
}

// Renders the visual ERD layout
function refreshErdVisualizer(erdData) {
    const erdList = document.getElementById("erdList");
    if (!erdList) return;

    erdList.innerHTML = "";

    erdData.forEach(entity => {
        const card = document.createElement("div");
        card.className = "erd-card";

        // Header Title
        const header = document.createElement("div");
        card.appendChild(header);
        header.className = "erd-card-header";
        header.innerHTML = `<span>📋</span> <strong>${entity.table}</strong>`;

        // Attributes row list
        const rowsContainer = document.createElement("div");
        card.appendChild(rowsContainer);
        rowsContainer.className = "erd-card-rows";

        entity.fields.forEach(field => {
            const row = document.createElement("div");
            row.className = "erd-field-row";

            const isPk = field.includes("(PK)");
            const isFk = field.includes("(FK)");

            row.innerHTML = `
                <span>${field}</span>
                <span class="key-icon">${isPk ? "🔑 PK" : isFk ? "🔗 FK" : ""}</span>
            `;
            rowsContainer.appendChild(row);
        });

        erdList.appendChild(card);
    });
}

// Console helper states
function showErrorConsole(message) {
    const container = document.getElementById("resultsViewport");
    container.innerHTML = `
        <div class="console-alert console-error">${message}</div>
    `;
}

function renderSuccessConsole(message) {
    const container = document.getElementById("resultsViewport");
    container.innerHTML = `
        <div class="console-alert console-success">${message}</div>
    `;
}

function clearViewportConsole() {
    const container = document.getElementById("resultsViewport");
    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">🤖</div>
            <h3 style="font-weight: 700; font-size: 1.15rem; margin-top: 0.5rem;">SQL Sandbox Active</h3>
            <p style="font-size: 0.8rem; opacity: 0.8;">Run a query in the SQL Editor to display output datasets in this console.</p>
        </div>
    `;
}
