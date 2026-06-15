document.addEventListener('DOMContentLoaded', () => {
    // Sliders
    const sliderJs = document.getElementById('slider-js');
    const sliderCss = document.getElementById('slider-css');
    const sliderImg = document.getElementById('slider-img');
    const sliderFont = document.getElementById('slider-font');
    
    // Value Displays
    const valJs = document.getElementById('val-js');
    const valCss = document.getElementById('val-css');
    const valImg = document.getElementById('val-img');
    const valFont = document.getElementById('val-font');
    
    // Total & Status
    const totalKb = document.getElementById('total-kb');
    const totalProgress = document.getElementById('total-progress');
    const budgetStatus = document.getElementById('budget-status');
    
    // Times
    const timeBroadband = document.getElementById('time-broadband');
    const time4g = document.getElementById('time-4g');
    const timeFast3g = document.getElementById('time-fast3g');
    const timeSlow3g = document.getElementById('time-slow3g');
    
    // Upload
    const uploadInput = document.getElementById('audit-upload');
    
    // Constants
    const RECOMMENDED_BUDGET = 1500; // KB
    const MAX_BUDGET = 5000; // Visual scale max
    
    // Throughput Config (Mbps) -> (KBps)
    // 1 Mbps = 1000 Kbps / 8 = 125 KBps
    const NETWORKS = {
        broadband: 20 * 125, // 2500 KBps
        fourG: 12 * 125,     // 1500 KBps
        fast3g: 1.5 * 125,   // ~187.5 KBps
        slow3g: 0.4 * 125    // 50 KBps
    };

    // Initialize
    updateCalculations();

    // Event Listeners for sliders
    [sliderJs, sliderCss, sliderImg, sliderFont].forEach(slider => {
        slider.addEventListener('input', updateCalculations);
    });

    function updateCalculations() {
        // Get values
        const js = parseInt(sliderJs.value) || 0;
        const css = parseInt(sliderCss.value) || 0;
        const img = parseInt(sliderImg.value) || 0;
        const font = parseInt(sliderFont.value) || 0;
        
        // Update display labels
        valJs.textContent = js;
        valCss.textContent = css;
        valImg.textContent = img;
        valFont.textContent = font;

        // Calculate total
        const total = js + css + img + font;
        totalKb.textContent = total;

        // Update Progress Bar
        const percentage = Math.min((total / MAX_BUDGET) * 100, 100);
        totalProgress.style.width = `${percentage}%`;

        // Update Status & Color
        if (total <= RECOMMENDED_BUDGET) {
            totalProgress.style.background = 'var(--success)';
            budgetStatus.textContent = 'Excellent! Well within recommended budgets.';
            budgetStatus.className = 'budget-status status-good';
        } else if (total <= RECOMMENDED_BUDGET * 1.5) {
            totalProgress.style.background = 'var(--warning)';
            budgetStatus.textContent = 'Warning: Approaching heavy payload limits.';
            budgetStatus.className = 'budget-status status-warning';
        } else {
            totalProgress.style.background = 'var(--danger)';
            budgetStatus.textContent = 'Danger: Payload is too large. Expect slow mobile loads.';
            budgetStatus.className = 'budget-status status-danger';
        }

        // Calculate Time Estimates (Seconds = Total KB / KBps)
        // Add a small baseline latency overhead (e.g. 0.5s for slow nets)
        const calcTime = (networkBw, latency) => {
            if (total === 0) return "0.0s";
            const sec = (total / networkBw) + latency;
            return sec.toFixed(1) + 's';
        };

        timeBroadband.textContent = calcTime(NETWORKS.broadband, 0.1);
        time4g.textContent = calcTime(NETWORKS.fourG, 0.3);
        timeFast3g.textContent = calcTime(NETWORKS.fast3g, 0.6);
        timeSlow3g.textContent = calcTime(NETWORKS.slow3g, 1.2);
    }

    // JSON Parser for Upload Audit
    uploadInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                // Expecting simple format: { "js": 200, "css": 50, "img": 500, "font": 100 }
                if (data.js !== undefined) sliderJs.value = data.js;
                if (data.css !== undefined) sliderCss.value = data.css;
                if (data.img !== undefined) sliderImg.value = data.img;
                if (data.font !== undefined) sliderFont.value = data.font;
                
                // Allow aliases
                if (data.javascript) sliderJs.value = data.javascript;
                if (data.images) sliderImg.value = data.images;
                if (data.fonts) sliderFont.value = data.fonts;

                updateCalculations();
                alert('Audit JSON successfully imported!');
            } catch (err) {
                alert('Invalid JSON file format. Please upload a valid JSON audit file.');
                console.error(err);
            }
        };
        reader.readAsText(file);
        
        // reset input so it can trigger again
        e.target.value = '';
    });
});
