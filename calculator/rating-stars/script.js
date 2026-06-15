document.addEventListener('DOMContentLoaded', () => {
    // Theme Toggle Logic
    const themeBtn = document.getElementById('theme-btn');
    const moonIcon = document.getElementById('moon-icon');
    const sunIcon = document.getElementById('sun-icon');
    
    // Check saved theme or system preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
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

    // --- Rating Stars Logic ---
    const starPath = '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>';

    // Initialize all rating widgets
    const ratingWidgets = document.querySelectorAll('.rating-widget');

    ratingWidgets.forEach(widget => {
        const maxStars = parseInt(widget.getAttribute('data-max')) || 5;
        const initialRating = parseFloat(widget.getAttribute('data-rating')) || 0;
        const isInteractive = widget.getAttribute('data-interactive') === 'true';
        
        let currentRating = initialRating;
        let hoverRating = 0;

        // Render the stars DOM structure
        renderStars(widget, maxStars);
        
        // Initial visual update
        updateStarsVisual(widget, currentRating, maxStars);

        if (isInteractive) {
            const outputElement = document.getElementById('rating-output');
            
            // Mouse movement for hover effect
            widget.addEventListener('mousemove', (e) => {
                const rect = widget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                
                // Calculate rating based on mouse position (half-star precision)
                // Width of a star + gap. Gap is 4px (0.25rem). Star is 32px.
                const starWidthWithGap = 36;
                const exactRating = x / starWidthWithGap;
                
                // Round to nearest 0.5
                hoverRating = Math.ceil(exactRating * 2) / 2;
                
                // Clamp
                if (hoverRating < 0.5) hoverRating = 0.5;
                if (hoverRating > maxStars) hoverRating = maxStars;
                
                widget.classList.add('is-hovering');
                updateStarsVisual(widget, hoverRating, maxStars);
            });

            // Mouse leave to revert to selected rating
            widget.addEventListener('mouseleave', () => {
                widget.classList.remove('is-hovering');
                updateStarsVisual(widget, currentRating, maxStars);
            });

            // Click to lock in the rating
            widget.addEventListener('click', () => {
                currentRating = hoverRating;
                if (outputElement) {
                    outputElement.textContent = currentRating.toFixed(1);
                }
                
                // Optional: add a tiny scale animation to the container
                widget.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    widget.style.transform = 'scale(1)';
                }, 100);
            });
            
            // Keyboard accessibility could be added here (tabindex, arrow keys)
        }
    });

    function renderStars(container, max) {
        container.innerHTML = '';
        for (let i = 1; i <= max; i++) {
            const starContainer = document.createElement('div');
            starContainer.className = 'star-container';
            starContainer.dataset.index = i;
            
            // Background empty star
            const emptySvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            emptySvg.setAttribute('viewBox', '0 0 24 24');
            emptySvg.setAttribute('class', 'star-svg star-empty');
            emptySvg.innerHTML = starPath;
            
            // Wrapper for filled star (controls the percentage fill)
            const filledWrapper = document.createElement('div');
            filledWrapper.className = 'star-filled-wrapper';
            
            // Foreground filled star
            const filledSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            filledSvg.setAttribute('viewBox', '0 0 24 24');
            filledSvg.setAttribute('class', 'star-svg star-filled');
            filledSvg.innerHTML = starPath;
            
            filledWrapper.appendChild(filledSvg);
            starContainer.appendChild(emptySvg);
            starContainer.appendChild(filledWrapper);
            
            container.appendChild(starContainer);
        }
    }

    function updateStarsVisual(container, rating, max) {
        const starContainers = container.querySelectorAll('.star-container');
        
        starContainers.forEach((starContainer, index) => {
            const starIndex = index + 1; // 1-based
            const filledWrapper = starContainer.querySelector('.star-filled-wrapper');
            
            if (rating >= starIndex) {
                // Fully filled
                filledWrapper.style.width = '100%';
            } else if (rating > starIndex - 1 && rating < starIndex) {
                // Partially filled (calculate percentage)
                const decimal = rating - (starIndex - 1);
                filledWrapper.style.width = `${decimal * 100}%`;
            } else {
                // Empty
                filledWrapper.style.width = '0%';
            }
        });
    }
});
