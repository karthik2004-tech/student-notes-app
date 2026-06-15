const toggleSwitch = document.getElementById('billing-checkbox');
const monthlyLabel = document.getElementById('monthly-label');
const yearlyLabel = document.getElementById('yearly-label');
const priceAmounts = document.querySelectorAll('.amount');

// Set initial state
monthlyLabel.classList.add('active');

toggleSwitch.addEventListener('change', () => {
    if (toggleSwitch.checked) {
        // Switch to yearly
        yearlyLabel.classList.add('active');
        monthlyLabel.classList.remove('active');
        
        priceAmounts.forEach(amount => {
            const yearlyPrice = amount.getAttribute('data-yearly');
            animateValue(amount, parseInt(amount.innerText), parseInt(yearlyPrice), 300);
        });
    } else {
        // Switch to monthly
        monthlyLabel.classList.add('active');
        yearlyLabel.classList.remove('active');
        
        priceAmounts.forEach(amount => {
            const monthlyPrice = amount.getAttribute('data-monthly');
            animateValue(amount, parseInt(amount.innerText), parseInt(monthlyPrice), 300);
        });
    }
});

// Function to animate price counting
function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}
