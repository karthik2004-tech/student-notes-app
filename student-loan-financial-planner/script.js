/**
 * Student Loan & Financial Independence Planner Logic
 */

let extraMonthlyPayment = 0;

function setExtraPayment(amount) {
    extraMonthlyPayment = amount;
    
    // Toggle active state classes on scenario buttons
    const buttons = document.querySelectorAll(".whatif-btn");
    buttons.forEach(btn => btn.classList.remove("active"));
    
    const activeBtn = document.getElementById(`whatif-${amount}`);
    if (activeBtn) activeBtn.classList.add("active");
    
    calculateFinancials();
}

// Format numbers to Currency strings
function formatCurrency(val) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
    }).format(val);
}

function calculateFinancials() {
    // 1. Get input parameter values
    const principal = parseFloat(document.getElementById("sliderPrincipal").value);
    const annualRate = parseFloat(document.getElementById("sliderInterest").value) / 100;
    const termYears = parseInt(document.getElementById("sliderTerm").value);
    const salary = parseFloat(document.getElementById("sliderSalary").value);
    const monthlySavings = parseFloat(document.getElementById("sliderSavings").value);

    // Sync labels text
    document.getElementById("labelPrincipal").textContent = formatCurrency(principal);
    document.getElementById("labelInterest").textContent = `${(annualRate * 100).toFixed(1)}%`;
    document.getElementById("labelTerm").textContent = `${termYears} Years`;
    document.getElementById("labelSalary").textContent = formatCurrency(salary);
    document.getElementById("labelSavings").textContent = formatCurrency(monthlySavings);

    // 2. Financial Amortization calculations
    const monthlyRate = annualRate / 12;
    const totalMonths = termYears * 12;

    // Standard Monthly Payment: M = P * [r(1+r)^n] / [(1+r)^n - 1]
    let standardMonthlyPayment = 0;
    if (monthlyRate === 0) {
        standardMonthlyPayment = principal / totalMonths;
    } else {
        standardMonthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
    }

    // A. Baseline Path (No extra payments)
    const baselineAmortization = getAmortizationSchedule(principal, monthlyRate, standardMonthlyPayment, 0, totalMonths);
    
    // B. What-If Path (With extra payments)
    const whatifAmortization = getAmortizationSchedule(principal, monthlyRate, standardMonthlyPayment, extraMonthlyPayment, totalMonths);

    // C. Calculate Savings Metrics
    const interestSaved = Math.max(0, baselineAmortization.totalInterest - whatifAmortization.totalInterest);
    const monthsSaved = Math.max(0, baselineAmortization.schedule.length - whatifAmortization.schedule.length);
    const yearsSaved = (monthsSaved / 12).toFixed(1);

    // D. Net Worth Projections (10 Years / 120 Months)
    const netWorthData = getNetWorthProjections(principal, monthlySavings, whatifAmortization.schedule);

    // 3. Update HUD Display KPIs
    document.getElementById("kpiMonthlyPayment").textContent = formatCurrency(standardMonthlyPayment);
    document.getElementById("kpiTotalInterest").textContent = formatCurrency(whatifAmortization.totalInterest);
    document.getElementById("kpiInterestSaved").textContent = formatCurrency(interestSaved);
    document.getElementById("kpiYearsSaved").textContent = `${yearsSaved} ${yearsSaved === "1.0" ? "Year" : "Years"}`;

    // 4. Render Graphs via Custom SVG engines
    plotAmortizationChart(whatifAmortization.schedule, totalMonths, principal);
    plotNetWorthChart(netWorthData);
}

// Compiles month-by-month loan balances and interest accumulation
function getAmortizationSchedule(principal, monthlyRate, standardPayment, extraPayment, maxMonths) {
    let balance = principal;
    let totalInterest = 0;
    const schedule = [];

    // Push initial index
    schedule.push({ month: 0, balance: principal });

    for (let m = 1; m <= maxMonths; m++) {
        if (balance <= 0) break;

        const interest = balance * monthlyRate;
        let principalPaid = standardPayment + extraPayment - interest;

        if (principalPaid > balance) {
            principalPaid = balance;
        }

        balance -= principalPaid;
        totalInterest += interest;

        schedule.push({
            month: m,
            balance: Math.max(0, balance),
            interestPaid: interest,
            principalPaid: principalPaid
        });
    }

    return {
        schedule,
        totalInterest
    };
}

// 10-Year Compounding Net Worth (Savings minus outstanding debt)
function getNetWorthProjections(initialDebt, monthlySavings, loanSchedule) {
    const projections = [];
    let assets = 0;
    const assetGrowthRate = 0.06 / 12; // 6% annual compounding

    for (let year = 0; year <= 10; year++) {
        const monthIndex = year * 12;

        // Find remaining debt for this year
        let remainingDebt = 0;
        if (monthIndex < loanSchedule.length) {
            remainingDebt = loanSchedule[monthIndex].balance;
        }

        // Calculate compounding assets
        // Assets compound monthly over the course of the year
        if (year > 0) {
            for (let m = 1; m <= 12; m++) {
                assets = assets * (1 + assetGrowthRate) + monthlySavings;
            }
        }

        const netWorth = assets - remainingDebt;

        projections.push({
            year,
            assets,
            debt: remainingDebt,
            netWorth
        });
    }

    return projections;
}

// SVG Drawing: Amortization curve
function plotAmortizationChart(schedule, totalMonths, initialDebt) {
    const svg = document.getElementById("svgAmortization");
    if (!svg) return;

    svg.innerHTML = "";

    const width = 450;
    const height = 250;
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

    const padding = { top: 20, right: 20, bottom: 30, left: 55 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Draw Grid Lines & Labels
    const yGridCount = 5;
    for (let i = 0; i <= yGridCount; i++) {
        const yVal = padding.top + (chartHeight * i) / yGridCount;
        const gridValue = initialDebt - (initialDebt * i) / yGridCount;

        // Horizontal Line
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", padding.left);
        line.setAttribute("y1", yVal);
        line.setAttribute("x2", width - padding.right);
        line.setAttribute("y2", yVal);
        line.setAttribute("class", "chart-grid-line");
        svg.appendChild(line);

        // Y-axis Label
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", padding.left - 8);
        text.setAttribute("y", yVal + 3);
        text.setAttribute("text-anchor", "end");
        text.setAttribute("class", "chart-axis-label");
        text.textContent = formatCurrency(gridValue);
        svg.appendChild(text);
    }

    // Draw X-axis label points
    const xGridCount = 5;
    for (let i = 0; i <= xGridCount; i++) {
        const xVal = padding.left + (chartWidth * i) / xGridCount;
        const yearValue = Math.round((totalMonths * i) / xGridCount / 12);

        // Vertical Line
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", xVal);
        line.setAttribute("y1", padding.top);
        line.setAttribute("x2", xVal);
        line.setAttribute("y2", height - padding.bottom);
        line.setAttribute("class", "chart-grid-line");
        svg.appendChild(line);

        // X-axis Label
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", xVal);
        text.setAttribute("y", height - padding.bottom + 18);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("class", "chart-axis-label");
        text.textContent = `Yr ${yearValue}`;
        svg.appendChild(text);
    }

    // Build Amortization Path
    let pathD = "";
    schedule.forEach((point, idx) => {
        const x = padding.left + (point.month / totalMonths) * chartWidth;
        const y = padding.top + chartHeight - (point.balance / initialDebt) * chartHeight;

        if (idx === 0) {
            pathD += `M ${x} ${y}`;
        } else {
            pathD += ` L ${x} ${y}`;
        }
    });

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", pathD);
    path.setAttribute("class", "chart-path-loan");
    svg.appendChild(path);
}

// SVG Drawing: Net Worth Projection curve
function plotNetWorthChart(projections) {
    const svg = document.getElementById("svgNetWorth");
    if (!svg) return;

    svg.innerHTML = "";

    const width = 450;
    const height = 250;
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

    const padding = { top: 20, right: 20, bottom: 30, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Calculate Y Boundaries (Net Worth starts negative, goes positive)
    const netWorthValues = projections.map(p => p.netWorth);
    const minVal = Math.min(...netWorthValues);
    const maxVal = Math.max(...netWorthValues, 10000); // Guard minimum peak
    const range = maxVal - minVal;

    // Helper to map Value to Y Coordinate
    const getYCoord = (val) => {
        return padding.top + chartHeight - ((val - minVal) / range) * chartHeight;
    };

    // Draw Grid Lines & Labels
    const yGridCount = 5;
    for (let i = 0; i <= yGridCount; i++) {
        const gridVal = minVal + (range * i) / yGridCount;
        const yCoord = getYCoord(gridVal);

        // Horizontal Line
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", padding.left);
        line.setAttribute("y1", yCoord);
        line.setAttribute("x2", width - padding.right);
        line.setAttribute("y2", yCoord);
        line.setAttribute("class", "chart-grid-line");
        svg.appendChild(line);

        // Y-axis Label
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", padding.left - 8);
        text.setAttribute("y", yCoord + 3);
        text.setAttribute("text-anchor", "end");
        text.setAttribute("class", "chart-axis-label");
        text.textContent = formatCurrency(gridVal);
        svg.appendChild(text);
    }

    // Draw X-axis label points (Years 0-10)
    for (let year = 0; year <= 10; year += 2) {
        const xCoord = padding.left + (year / 10) * chartWidth;

        // Vertical Line
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", xCoord);
        line.setAttribute("y1", padding.top);
        line.setAttribute("x2", xCoord);
        line.setAttribute("y2", height - padding.bottom);
        line.setAttribute("class", "chart-grid-line");
        svg.appendChild(line);

        // X-axis Label
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", xCoord);
        text.setAttribute("y", height - padding.bottom + 18);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("class", "chart-axis-label");
        text.textContent = `Yr ${year}`;
        svg.appendChild(text);
    }

    // Draw Bold Zero Net Worth Threshold line if it lies in viewport range
    if (minVal < 0 && maxVal > 0) {
        const yZero = getYCoord(0);
        const zeroLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
        zeroLine.setAttribute("x1", padding.left);
        zeroLine.setAttribute("y1", yZero);
        zeroLine.setAttribute("x2", width - padding.right);
        zeroLine.setAttribute("y2", yZero);
        zeroLine.setAttribute("class", "chart-zero-line");
        svg.appendChild(zeroLine);
    }

    // Build Net Worth Line Path
    let pathD = "";
    projections.forEach((point, idx) => {
        const x = padding.left + (point.year / 10) * chartWidth;
        const y = getYCoord(point.netWorth);

        if (idx === 0) {
            pathD += `M ${x} ${y}`;
        } else {
            pathD += ` L ${x} ${y}`;
        }
    });

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", pathD);
    path.setAttribute("class", "chart-path-networth");
    svg.appendChild(path);
}

// Initial Calculation Trigger on load
document.addEventListener("DOMContentLoaded", () => {
    calculateFinancials();
});
