document.addEventListener('DOMContentLoaded', () => {

    // --- Inputs ---
    const priceStarter = document.getElementById('price-starter');
    const pricePro = document.getElementById('price-pro');
    const priceEnt = document.getElementById('price-ent');

    const distFree = document.getElementById('dist-free');
    const distStarter = document.getElementById('dist-starter');
    const distPro = document.getElementById('dist-pro');
    const distEnt = document.getElementById('dist-ent');
    const distWarning = document.getElementById('dist-warning');

    const sliderUsers = document.getElementById('slider-users');
    const sliderChurn = document.getElementById('slider-churn');
    const sliderCost = document.getElementById('slider-cost');

    const valUsers = document.getElementById('val-users');
    const valChurn = document.getElementById('val-churn');
    const valCost = document.getElementById('val-cost');

    // --- Outputs ---
    const kpiMrr = document.getElementById('kpi-mrr');
    const kpiArr = document.getElementById('kpi-arr');
    const kpiProfit = document.getElementById('kpi-profit');
    const kpiLtv = document.getElementById('kpi-ltv');
    const chartContainer = document.getElementById('svg-chart-container');

    // --- Event Listeners ---
    const allInputs = [
        priceStarter, pricePro, priceEnt,
        distFree, distStarter, distPro, distEnt,
        sliderUsers, sliderChurn, sliderCost
    ];

    allInputs.forEach(input => {
        input.addEventListener('input', calculateROI);
    });

    // --- Formatting ---
    const formatCurrency = (num) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);

    function calculateROI() {
        // 1. Read Values
        const pStart = parseFloat(priceStarter.value) || 0;
        const pPro = parseFloat(pricePro.value) || 0;
        const pEnt = parseFloat(priceEnt.value) || 0;

        const dFree = parseFloat(distFree.value) || 0;
        const dStart = parseFloat(distStarter.value) || 0;
        const dPro = parseFloat(distPro.value) || 0;
        const dEnt = parseFloat(distEnt.value) || 0;

        const users = parseInt(sliderUsers.value) || 0;
        const churn = parseFloat(sliderChurn.value) || 0;
        const cost = parseFloat(sliderCost.value) || 0;

        // Update Slider UI values
        valUsers.textContent = users.toLocaleString();
        valChurn.textContent = churn.toFixed(1) + '%';
        valCost.textContent = formatCurrency(cost);

        // 2. Validate Distribution
        const totalDist = dFree + dStart + dPro + dEnt;
        if (totalDist !== 100) {
            distWarning.style.display = 'block';
            kpiMrr.textContent = "-";
            kpiArr.textContent = "-";
            kpiProfit.textContent = "-";
            kpiLtv.textContent = "-";
            chartContainer.innerHTML = '';
            return;
        } else {
            distWarning.style.display = 'none';
        }

        // 3. Math Time
        // MRR
        const revStart = (users * (dStart / 100)) * pStart;
        const revPro = (users * (dPro / 100)) * pPro;
        const revEnt = (users * (dEnt / 100)) * pEnt;
        const mrr = revStart + revPro + revEnt;
        
        // ARR
        const arr = mrr * 12;

        // Net Profit (Monthly)
        const profit = mrr - cost;

        // LTV (Average Revenue Per User / Churn Rate)
        // Churn is percentage, so divide by 100. If churn is 0, prevent infinity
        const arpu = (users > 0) ? (mrr / users) : 0;
        const churnDec = churn / 100;
        const ltv = (churnDec > 0) ? (arpu / churnDec) : 0;

        // 4. Update KPI Cards
        kpiMrr.textContent = formatCurrency(mrr);
        kpiArr.textContent = formatCurrency(arr);
        
        kpiProfit.textContent = formatCurrency(profit);
        kpiProfit.className = `kpi-value ${profit >= 0 ? 'positive' : 'negative'}`;
        
        kpiLtv.textContent = formatCurrency(ltv);

        // 5. Draw Projection Chart
        drawChart(users, churnDec, pStart, pPro, pEnt, dStart, dPro, dEnt, cost);
    }

    function drawChart(initialUsers, churn, pStart, pPro, pEnt, dStart, dPro, dEnt, cost) {
        // We will project over 12 months. 
        // Assumption for simple simulation: We acquire 10% new users a month, but lose 'churn' % of existing.
        let currentUsers = initialUsers;
        const months = 12;
        const dataPoints = [];
        let maxProfit = 0;
        let minProfit = 0;

        for (let i = 1; i <= months; i++) {
            const revS = (currentUsers * (dStart / 100)) * pStart;
            const revP = (currentUsers * (dPro / 100)) * pPro;
            const revE = (currentUsers * (dEnt / 100)) * pEnt;
            const monthMrr = revS + revP + revE;
            const monthProfit = monthMrr - cost;

            dataPoints.push(monthProfit);

            if (monthProfit > maxProfit) maxProfit = monthProfit;
            if (monthProfit < minProfit) minProfit = monthProfit;

            // Growth simulation for next month
            const newUsers = currentUsers * 0.10;
            const lostUsers = currentUsers * churn;
            currentUsers = currentUsers + newUsers - lostUsers;
        }

        // SVG Canvas rendering
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        svg.setAttribute("preserveAspectRatio", "none");

        // We need to map data values to SVG coordinates
        // Let's assume height is 100% (or say 300 units logically)
        const logicalHeight = 300;
        const barWidth = 100 / (months * 1.5); 
        
        // Find absolute range
        const range = (maxProfit - minProfit) || 1; // avoid divide by zero
        // Calculate the Y position of the Zero line
        const zeroY = logicalHeight - ((0 - minProfit) / range) * logicalHeight;

        dataPoints.forEach((val, idx) => {
            const bar = document.createElementNS(svgNS, "rect");
            
            // X position (spaced out)
            const xPercent = (idx / months) * 100 + 2;
            
            // Calculate height and Y position based on whether value is positive or negative
            const valHeight = (Math.abs(val) / range) * logicalHeight;
            let yPos = 0;
            
            if (val >= 0) {
                yPos = zeroY - valHeight;
                bar.setAttribute("fill", "var(--primary)"); // Green for profit
            } else {
                yPos = zeroY;
                bar.setAttribute("fill", "var(--danger)"); // Red for loss
            }

            bar.setAttribute("x", `${xPercent}%`);
            bar.setAttribute("y", `${(yPos / logicalHeight) * 100}%`);
            bar.setAttribute("width", `${barWidth}%`);
            bar.setAttribute("height", `${(valHeight / logicalHeight) * 100}%`);
            bar.setAttribute("rx", "4");

            // Add tooltip
            const title = document.createElementNS(svgNS, "title");
            title.textContent = `Month ${idx + 1}: ${formatCurrency(val)}`;
            bar.appendChild(title);

            svg.appendChild(bar);

            // Add month label
            const text = document.createElementNS(svgNS, "text");
            text.setAttribute("x", `${xPercent + (barWidth/2)}%`);
            text.setAttribute("y", `98%`);
            text.setAttribute("fill", "var(--text-muted)");
            text.setAttribute("font-size", "12");
            text.setAttribute("text-anchor", "middle");
            text.textContent = `M${idx + 1}`;
            svg.appendChild(text);
        });

        // Draw Zero Line
        const line = document.createElementNS(svgNS, "line");
        line.setAttribute("x1", "0");
        line.setAttribute("y1", `${(zeroY / logicalHeight) * 100}%`);
        line.setAttribute("x2", "100%");
        line.setAttribute("y2", `${(zeroY / logicalHeight) * 100}%`);
        line.setAttribute("stroke", "var(--border-color)");
        line.setAttribute("stroke-width", "2");
        line.setAttribute("stroke-dasharray", "5,5");
        svg.appendChild(line);

        chartContainer.innerHTML = '';
        chartContainer.appendChild(svg);
    }

    // Initial calculation on load
    calculateROI();
});
