let expenses = [];
let expenseChart = null;

// Initialize Chart
function initChart() {
    const ctx = document.getElementById('expenseChart').getContext('2d');
    expenseChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Food', 'Transport', 'Utilities', 'Shopping', 'Other'],
            datasets: [{
                data: [0, 0, 0, 0, 0],
                backgroundColor: [
                    '#4cc9f0', '#4361ee', '#3a0ca3', '#7209b7', '#f72585'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right' }
            }
        }
    });
}

function updateDashboard() {
    // Update Total
    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    document.getElementById('total-expense').textContent = `$${total.toFixed(2)}`;

    // Update Chart
    const categories = ['Food', 'Transport', 'Utilities', 'Shopping', 'Other'];
    const dataMap = {};
    categories.forEach(c => dataMap[c] = 0);
    expenses.forEach(exp => {
        if(dataMap[exp.category] !== undefined) dataMap[exp.category] += exp.amount;
        else dataMap['Other'] += exp.amount;
    });
    
    if (expenseChart) {
        expenseChart.data.datasets[0].data = categories.map(c => dataMap[c]);
        expenseChart.update();
    }

    // Update Table
    const tbody = document.getElementById('transactions-body');
    const emptyState = document.getElementById('empty-state');
    
    tbody.innerHTML = '';
    if(expenses.length === 0) {
        emptyState.style.display = 'block';
    } else {
        emptyState.style.display = 'none';
        // Show newest first
        [...expenses].reverse().forEach((exp, idx) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${exp.name}</td>
                <td><span style="background:#f1f3f5;padding:4px 8px;border-radius:4px;font-size:0.8rem">${exp.category}</span></td>
                <td style="font-weight:600">$${exp.amount.toFixed(2)}</td>
                <td><button class="delete-btn" onclick="deleteExpense(${expenses.length - 1 - idx})">Delete</button></td>
            `;
            tbody.appendChild(tr);
        });
    }
}

// Add Expense
document.getElementById('expense-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('expense-name').value;
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const category = document.getElementById('expense-category').value;

    if(name && !isNaN(amount)) {
        expenses.push({ name, amount, category });
        updateDashboard();
        e.target.reset();
        document.getElementById('ocr-preview').innerHTML = '';
        document.getElementById('ocr-status').textContent = '';
    }
});

// Delete Expense
window.deleteExpense = function(index) {
    expenses.splice(index, 1);
    updateDashboard();
}

// OCR Integration
const fileInput = document.getElementById('receipt-upload');
const statusMsg = document.getElementById('ocr-status');

fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if(!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('ocr-preview').innerHTML = `<img src="${e.target.result}" alt="Receipt">`;
    }
    reader.readAsDataURL(file);

    statusMsg.textContent = "Scanning receipt with Tesseract OCR...";
    
    try {
        const result = await Tesseract.recognize(file, 'eng', {
            logger: m => {
                if(m.status === 'recognizing text') {
                    statusMsg.textContent = `Scanning... ${Math.round(m.progress * 100)}%`;
                }
            }
        });
        
        const text = result.data.text;
        statusMsg.textContent = "Scan complete! Extracting data...";
        
        // Very basic extraction logic
        // Find largest number with decimal
        const amountRegex = /\$?(\d+\.\d{2})/g;
        let match;
        let maxAmount = 0;
        
        while ((match = amountRegex.exec(text)) !== null) {
            const val = parseFloat(match[1]);
            if (val > maxAmount) maxAmount = val;
        }

        // Try to guess a name (e.g. first line of text)
        const lines = text.split('\n').filter(l => l.trim().length > 3);
        const guessedName = lines.length > 0 ? lines[0].trim() : "Scanned Receipt";

        if(maxAmount > 0) {
            document.getElementById('expense-amount').value = maxAmount;
            document.getElementById('expense-name').value = guessedName;
            statusMsg.textContent = `Found total: $${maxAmount}! Please verify the fields.`;
            statusMsg.style.color = "var(--success)";
        } else {
            statusMsg.textContent = "Could not detect an amount. Please enter manually.";
            statusMsg.style.color = "var(--danger)";
        }

    } catch (err) {
        console.error(err);
        statusMsg.textContent = "Error scanning receipt.";
        statusMsg.style.color = "var(--danger)";
    }
});

// Init
document.addEventListener('DOMContentLoaded', () => {
    initChart();
    updateDashboard();
});
