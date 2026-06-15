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

    // Pagination Logic
    const paginationContainer = document.getElementById('pagination');
    const demoPageTitle = document.getElementById('demo-page-title');
    const demoPageInfo = document.getElementById('demo-page-info');
    
    // State
    let currentPage = 1;
    const totalPages = 10;
    const itemsPerPage = 10;
    const totalItems = totalPages * itemsPerPage;

    function updateDemoContent(page) {
        const startItem = (page - 1) * itemsPerPage + 1;
        const endItem = Math.min(page * itemsPerPage, totalItems);
        
        demoPageTitle.textContent = `Page ${page} Content`;
        demoPageInfo.textContent = `Showing results ${startItem}-${endItem} of ${totalItems}`;
    }

    function createPageButton(pageNumber) {
        const li = document.createElement('li');
        const btn = document.createElement('button');
        btn.textContent = pageNumber;
        btn.setAttribute('aria-label', `Page ${pageNumber}`);
        
        if (pageNumber === currentPage) {
            btn.classList.add('active');
            btn.setAttribute('aria-current', 'page');
        }
        
        btn.addEventListener('click', () => {
            currentPage = pageNumber;
            render();
        });
        
        li.appendChild(btn);
        return li;
    }

    function createEllipsis() {
        const li = document.createElement('li');
        const span = document.createElement('span');
        span.classList.add('dots');
        span.textContent = '...';
        span.setAttribute('aria-hidden', 'true');
        li.appendChild(span);
        return li;
    }

    function createNavButton(type) {
        const li = document.createElement('li');
        const btn = document.createElement('button');
        
        if (type === 'prev') {
            btn.innerHTML = 'Previous';
            btn.setAttribute('aria-label', 'Previous page');
            btn.disabled = currentPage === 1;
            btn.addEventListener('click', () => {
                if (currentPage > 1) {
                    currentPage--;
                    render();
                    setTimeout(() => document.querySelector('[aria-label="Previous page"]').focus(), 0);
                }
            });
        } else {
            btn.innerHTML = 'Next';
            btn.setAttribute('aria-label', 'Next page');
            btn.disabled = currentPage === totalPages;
            btn.addEventListener('click', () => {
                if (currentPage < totalPages) {
                    currentPage++;
                    render();
                    setTimeout(() => document.querySelector('[aria-label="Next page"]').focus(), 0);
                }
            });
        }
        
        li.appendChild(btn);
        return li;
    }

    function renderPagination() {
        paginationContainer.innerHTML = '';
        
        // Previous Button
        paginationContainer.appendChild(createNavButton('prev'));

        let startPage, endPage;
        
        if (totalPages <= 5) {
            startPage = 1;
            endPage = totalPages;
        } else {
            if (currentPage <= 3) {
                startPage = 1;
                endPage = 4;
            } else if (currentPage + 2 >= totalPages) {
                startPage = totalPages - 3;
                endPage = totalPages;
            } else {
                startPage = currentPage - 1;
                endPage = currentPage + 1;
            }
        }

        // First page + ellipsis
        if (startPage > 1) {
            paginationContainer.appendChild(createPageButton(1));
            if (startPage > 2) {
                paginationContainer.appendChild(createEllipsis());
            }
        }

        // Page numbers
        for (let i = startPage; i <= endPage; i++) {
            paginationContainer.appendChild(createPageButton(i));
        }

        // Last page + ellipsis
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationContainer.appendChild(createEllipsis());
            }
            paginationContainer.appendChild(createPageButton(totalPages));
        }

        // Next Button
        paginationContainer.appendChild(createNavButton('next'));
    }

    function render() {
        updateDemoContent(currentPage);
        renderPagination();
    }

    // Initial render
    render();
});
