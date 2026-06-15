document.addEventListener('DOMContentLoaded', () => {
    // Theme Toggle Logic
    const themeBtn = document.getElementById('theme-btn');
    const moonIcon = document.getElementById('moon-icon');
    const sunIcon = document.getElementById('sun-icon');
    
    // Check saved theme or system preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Default to dark mode based on the screenshot provided by user
    if (savedTheme === 'dark' || (!savedTheme && prefersDark) || !savedTheme) {
        document.documentElement.setAttribute('data-theme', 'dark');
        moonIcon.style.display = 'none';
        sunIcon.style.display = 'block';
    }
    
    themeBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        if (currentTheme === 'dark') {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
            moonIcon.style.display = 'block';
            sunIcon.style.display = 'none';
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            moonIcon.style.display = 'none';
            sunIcon.style.display = 'block';
        }
    });

    // Button Loading State Demo
    const demoSubmitBtn = document.getElementById('demo-submit-btn');
    
    if (demoSubmitBtn) {
        demoSubmitBtn.addEventListener('click', () => {
            // Add loading state
            demoSubmitBtn.classList.add('is-loading');
            demoSubmitBtn.disabled = true;
            
            // Simulate an API request or async operation
            setTimeout(() => {
                // Remove loading state after 2 seconds
                demoSubmitBtn.classList.remove('is-loading');
                demoSubmitBtn.disabled = false;
            }, 2000);
        });
    }
});
