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

    // --- Dropdown Logic ---
    const dropdown = document.getElementById('dropdown');
    const dropdownToggle = document.getElementById('dropdown-toggle');
    const dropdownMenu = document.getElementById('dropdown-menu');
    const dropdownItems = dropdownMenu.querySelectorAll('.dropdown-item');
    const selectionResult = document.getElementById('selection-result');

    // Toggle dropdown open/close state
    function toggleDropdown() {
        const isOpen = dropdown.classList.contains('open');
        if (isOpen) {
            closeDropdown();
        } else {
            openDropdown();
        }
    }

    function openDropdown() {
        dropdown.classList.add('open');
        dropdownToggle.setAttribute('aria-expanded', 'true');
    }

    function closeDropdown() {
        dropdown.classList.remove('open');
        dropdownToggle.setAttribute('aria-expanded', 'false');
    }

    // Toggle on button click
    dropdownToggle.addEventListener('click', (e) => {
        e.preventDefault();
        toggleDropdown();
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target)) {
            closeDropdown();
        }
    });

    // Keyboard navigation accessibility
    dropdown.addEventListener('keydown', (e) => {
        const isOpen = dropdown.classList.contains('open');

        // Toggle on Enter or Space when button is focused
        if (e.key === 'Enter' || e.key === ' ') {
            if (e.target === dropdownToggle) {
                e.preventDefault();
                toggleDropdown();
                // If opening, focus the first item
                if (!isOpen) {
                    setTimeout(() => dropdownItems[0].focus(), 50);
                }
            }
        }

        // Close on Escape
        if (e.key === 'Escape' && isOpen) {
            closeDropdown();
            dropdownToggle.focus();
        }

        // Arrow navigation
        if (isOpen) {
            const focusedElement = document.activeElement;
            const itemsArray = Array.from(dropdownItems);
            const currentIndex = itemsArray.indexOf(focusedElement);

            if (e.key === 'ArrowDown') {
                e.preventDefault(); // Prevent page scroll
                if (currentIndex < itemsArray.length - 1) {
                    itemsArray[currentIndex + 1].focus();
                } else if (currentIndex === -1 || currentIndex === itemsArray.length - 1) {
                    // Loop back to top
                    itemsArray[0].focus();
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault(); // Prevent page scroll
                if (currentIndex > 0) {
                    itemsArray[currentIndex - 1].focus();
                } else if (currentIndex === -1 || currentIndex === 0) {
                    // Loop to bottom
                    itemsArray[itemsArray.length - 1].focus();
                }
            }
        }
    });

    // Handle item selection
    dropdownItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const action = item.textContent.trim();
            selectionResult.textContent = `Selected: ${action}`;
            
            // Special styling for the danger action
            if (item.classList.contains('danger')) {
                selectionResult.style.color = 'var(--danger-color)';
            } else {
                selectionResult.style.color = 'var(--text-color)';
            }
            
            closeDropdown();
            // Return focus to toggle button for accessibility
            dropdownToggle.focus();
        });
    });
});
