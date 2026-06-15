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

    // Note: The tooltip hover and focus state logic is fully handled via CSS 
    // using the :hover and :focus-visible pseudo-classes on the trigger element.
    // 
    // For a more robust production implementation (e.g. avoiding clipping in overflow: hidden containers),
    // you would typically use a library like Popper.js or Floating UI, or write JavaScript 
    // to dynamically calculate bounding boxes and append the tooltip to the document body.
    // 
    // This current implementation provides a lightweight, pure CSS approach suitable for standard usage.
});
