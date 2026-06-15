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

    // --- Search Logic ---
    const searchInput = document.getElementById('search-input');
    const clearBtn = document.getElementById('clear-btn');
    const searchResults = document.getElementById('search-results');
    
    // Mock data for search demonstration
    const mockData = [
        { title: 'Dashboard Overview', desc: 'Main analytics and user metrics' },
        { title: 'User Settings', desc: 'Manage your account preferences and security' },
        { title: 'Product Catalog', desc: 'Browse all available products in the store' },
        { title: 'Orders & Invoices', desc: 'View your order history and payment receipts' },
        { title: 'API Documentation', desc: 'Learn how to integrate our robust API' },
        { title: 'Customer Support', desc: 'Get help, read FAQs, and contact support team' },
        { title: 'Search Functionality', desc: 'Learn how to use the advanced search bar effectively' },
        { title: 'Dark Mode Setup', desc: 'Guide to implementing themes in your application' }
    ];

    // Toggle clear button visibility and perform search
    searchInput.addEventListener('input', (e) => {
        const value = e.target.value.trim();
        
        if (value.length > 0) {
            clearBtn.classList.add('visible');
            performSearch(value);
        } else {
            clearBtn.classList.remove('visible');
            searchResults.classList.remove('active');
        }
    });

    // Clear search input
    clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchInput.focus();
        clearBtn.classList.remove('visible');
        searchResults.classList.remove('active');
    });

    // Mock search function
    function performSearch(query) {
        const lowerQuery = query.toLowerCase();
        
        // Filter data based on title or description
        const results = mockData.filter(item => 
            item.title.toLowerCase().includes(lowerQuery) || 
            item.desc.toLowerCase().includes(lowerQuery)
        );
        
        displayResults(results, query);
    }

    // Display results in dropdown
    function displayResults(results, query) {
        searchResults.innerHTML = '';
        
        if (results.length === 0) {
            searchResults.innerHTML = `<div class="no-results">No results found for "${query}"</div>`;
        } else {
            results.forEach(result => {
                const resultItem = document.createElement('div');
                resultItem.className = 'result-item';
                
                // Highlight matching text in title
                const titleMatch = highlightText(result.title, query);
                
                resultItem.innerHTML = `
                    <div class="result-title">${titleMatch}</div>
                    <div class="result-desc">${result.desc}</div>
                `;
                
                // Add click event to select a result
                resultItem.addEventListener('click', () => {
                    searchInput.value = result.title;
                    clearBtn.classList.add('visible');
                    searchResults.classList.remove('active');
                });
                
                searchResults.appendChild(resultItem);
            });
        }
        
        searchResults.classList.add('active');
    }

    // Helper to highlight matching characters
    function highlightText(text, query) {
        const lowerText = text.toLowerCase();
        const lowerQuery = query.toLowerCase();
        const index = lowerText.indexOf(lowerQuery);
        
        if (index === -1) return text;
        
        const before = text.substring(0, index);
        const match = text.substring(index, index + query.length);
        const after = text.substring(index + query.length);
        
        return `${before}<span style="color: var(--primary-color); font-weight: bold;">${match}</span>${after}`;
    }

    // Close results dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target) && !clearBtn.contains(e.target)) {
            searchResults.classList.remove('active');
        }
    });
    
    // Re-open results on focus if there's text already
    searchInput.addEventListener('focus', () => {
        if (searchInput.value.trim().length > 0) {
            performSearch(searchInput.value.trim());
        }
    });
    
    // Keyboard navigation placeholder (basic support)
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            searchResults.classList.remove('active');
            searchInput.blur();
        }
    });
});
