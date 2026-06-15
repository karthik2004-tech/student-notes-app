document.addEventListener('DOMContentLoaded', () => {
    
    // --- Data ---
    const products = [
        {
            id: 1,
            name: "Premium Wireless Headphones",
            price: 299.99,
            category: "electronics",
            rating: 4.8,
            reviews: 124,
            image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600",
            description: "Experience premium sound quality with industry-leading active noise cancellation. Enjoy up to 30 hours of battery life and a comfortable ergonomic design for all-day wear.",
            features: ["Active Noise Cancellation", "30-hour battery life", "Bluetooth 5.0", "Built-in microphone"]
        },
        {
            id: 2,
            name: "Minimalist Watch",
            price: 149.00,
            category: "fashion",
            rating: 4.5,
            reviews: 89,
            image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600",
            description: "A sleek, minimalist timepiece designed for everyday elegance. Features a genuine leather strap and scratch-resistant sapphire crystal glass.",
            features: ["Sapphire crystal glass", "Genuine leather strap", "Water resistant to 30m", "Quartz movement"]
        },
        {
            id: 3,
            name: "Smart Home Speaker",
            price: 99.50,
            category: "electronics",
            rating: 4.7,
            reviews: 210,
            image: "https://images.unsplash.com/photo-1589492477829-5e65395b66cc?auto=format&fit=crop&q=80&w=600",
            description: "Control your smart home and listen to music with voice commands. Compact design with powerful 360-degree sound.",
            features: ["Voice assistant built-in", "360-degree audio", "Smart home control", "Compact design"]
        },
        {
            id: 4,
            name: "Ceramic Coffee Pour-over",
            price: 45.00,
            category: "home",
            rating: 4.9,
            reviews: 56,
            image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&q=80&w=600",
            description: "Brew the perfect cup of coffee with this elegant ceramic pour-over set. Hand-crafted for optimal heat retention and extraction.",
            features: ["Hand-crafted ceramic", "Optimal heat retention", "Dishwasher safe", "Includes 100 filters"]
        },
        {
            id: 5,
            name: "Leather Weekend Bag",
            price: 210.00,
            category: "fashion",
            rating: 4.6,
            reviews: 42,
            image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=600",
            description: "The perfect companion for short trips. Made from full-grain leather that develops a beautiful patina over time.",
            features: ["Full-grain leather", "Spacious interior", "Adjustable shoulder strap", "Cabin sized"]
        },
        {
            id: 6,
            name: "Ergonomic Desk Chair",
            price: 350.00,
            category: "home",
            rating: 4.8,
            reviews: 178,
            image: "https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?auto=format&fit=crop&q=80&w=600",
            description: "Work in comfort with our top-rated ergonomic desk chair. Features adjustable lumbar support, armrests, and a breathable mesh back.",
            features: ["Adjustable lumbar support", "Breathable mesh", "Tilt mechanism", "5-year warranty"]
        }
    ];

    let cart = [];
    let currentFilter = 'all';
    let currentSearch = '';
    let currentSort = 'default';

    // --- DOM Elements ---
    const productsGrid = document.getElementById('products-grid');
    const noResults = document.getElementById('no-results');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const searchInput = document.getElementById('search-input');
    const sortSelect = document.getElementById('sort-select');
    
    const homeView = document.getElementById('home-view');
    const detailsView = document.getElementById('details-view');
    const productDetailsContent = document.getElementById('product-details-content');
    const backToShopBtn = document.getElementById('back-to-shop');
    const logoBtn = document.getElementById('logo-btn');
    
    const cartBtn = document.getElementById('cart-btn');
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartOverlay = document.getElementById('cart-overlay');
    const closeCartBtn = document.getElementById('close-cart-btn');
    const cartItemsContainer = document.getElementById('cart-items');
    const emptyCartDiv = document.getElementById('empty-cart');
    const cartBadge = document.getElementById('cart-badge');
    const cartTotalPrice = document.getElementById('cart-total-price');
    const checkoutBtn = document.getElementById('checkout-btn');
    const startShoppingBtn = document.getElementById('start-shopping-btn');
    
    const toast = document.getElementById('toast');

    // --- Core Functions ---

    function renderProducts() {
        // Filter
        let filtered = products.filter(p => {
            const matchCategory = currentFilter === 'all' || p.category === currentFilter;
            const matchSearch = p.name.toLowerCase().includes(currentSearch.toLowerCase());
            return matchCategory && matchSearch;
        });

        // Sort
        if (currentSort === 'price-low') {
            filtered.sort((a, b) => a.price - b.price);
        } else if (currentSort === 'price-high') {
            filtered.sort((a, b) => b.price - a.price);
        }

        productsGrid.innerHTML = '';

        if (filtered.length === 0) {
            productsGrid.classList.add('hidden');
            noResults.classList.remove('hidden');
            return;
        }

        productsGrid.classList.remove('hidden');
        noResults.classList.add('hidden');

        filtered.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.onclick = () => showProductDetails(product);

            card.innerHTML = `
                <div class="product-img-wrapper">
                    <span class="product-badge">${product.category}</span>
                    <img src="${product.image}" alt="${product.name}">
                </div>
                <div class="product-info">
                    <span class="product-category">${product.category}</span>
                    <h3 class="product-title">${product.name}</h3>
                    <div class="product-rating">
                        <i class="ph-fill ph-star"></i>
                        ${product.rating} <span>(${product.reviews})</span>
                    </div>
                    <div class="product-bottom">
                        <span class="product-price">$${product.price.toFixed(2)}</span>
                        <button class="add-to-cart-btn" onclick="event.stopPropagation(); addToCart(${product.id}, 1)">
                            <i class="ph ph-shopping-bag"></i>
                        </button>
                    </div>
                </div>
            `;
            productsGrid.appendChild(card);
        });
    }

    function showProductDetails(product) {
        let featuresHtml = product.features.map(f => `<li><i class="ph-fill ph-check-circle"></i> ${f}</li>`).join('');

        productDetailsContent.innerHTML = `
            <div class="pd-image">
                <img src="${product.image}" alt="${product.name}">
            </div>
            <div class="pd-info">
                <span class="product-category">${product.category}</span>
                <h1>${product.name}</h1>
                <div class="product-rating">
                    <i class="ph-fill ph-star"></i>
                    ${product.rating} <span>(${product.reviews} reviews)</span>
                </div>
                <div class="pd-price">$${product.price.toFixed(2)}</div>
                <p class="pd-description">${product.description}</p>
                
                <div class="pd-actions">
                    <div class="quantity-control">
                        <button class="qty-btn" id="pd-minus">-</button>
                        <input type="text" class="qty-input" id="pd-qty" value="1" readonly>
                        <button class="qty-btn" id="pd-plus">+</button>
                    </div>
                    <button class="btn btn-accent" id="pd-add-to-cart">Add to Cart</button>
                </div>
                
                <ul class="pd-features">
                    ${featuresHtml}
                </ul>
            </div>
        `;

        // Switch Views
        homeView.classList.remove('active');
        homeView.classList.add('hidden');
        detailsView.classList.remove('hidden');
        detailsView.classList.add('active');
        window.scrollTo(0, 0);

        // Bind Detail actions
        const qtyInput = document.getElementById('pd-qty');
        document.getElementById('pd-minus').onclick = () => {
            let val = parseInt(qtyInput.value);
            if (val > 1) qtyInput.value = val - 1;
        };
        document.getElementById('pd-plus').onclick = () => {
            let val = parseInt(qtyInput.value);
            qtyInput.value = val + 1;
        };
        document.getElementById('pd-add-to-cart').onclick = () => {
            addToCart(product.id, parseInt(qtyInput.value));
        };
    }

    function showHome() {
        detailsView.classList.remove('active');
        detailsView.classList.add('hidden');
        homeView.classList.remove('hidden');
        homeView.classList.add('active');
    }

    // --- Cart Functions ---

    window.addToCart = function(productId, quantity = 1) {
        const product = products.find(p => p.id === productId);
        const existingItem = cart.find(item => item.id === productId);

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.push({ ...product, quantity });
        }

        updateCartUI();
        showToast();
    }

    window.removeFromCart = function(productId) {
        cart = cart.filter(item => item.id !== productId);
        updateCartUI();
    }

    window.updateQuantity = function(productId, delta) {
        const item = cart.find(item => item.id === productId);
        if (item) {
            item.quantity += delta;
            if (item.quantity <= 0) {
                removeFromCart(productId);
            } else {
                updateCartUI();
            }
        }
    }

    function updateCartUI() {
        // Update Badge
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartBadge.textContent = totalItems;

        // Render Items
        // Remove old items but keep empty cart div
        Array.from(cartItemsContainer.children).forEach(child => {
            if (child.id !== 'empty-cart') child.remove();
        });

        if (cart.length === 0) {
            emptyCartDiv.style.display = 'flex';
            checkoutBtn.disabled = true;
            cartTotalPrice.textContent = '$0.00';
            return;
        }

        emptyCartDiv.style.display = 'none';
        checkoutBtn.disabled = false;

        let total = 0;

        cart.forEach(item => {
            total += item.price * item.quantity;
            const itemDiv = document.createElement('div');
            itemDiv.className = 'cart-item';
            itemDiv.innerHTML = `
                <img src="${item.image}" alt="${item.name}" class="cart-item-img">
                <div class="cart-item-info">
                    <h4 class="cart-item-title">${item.name}</h4>
                    <div class="cart-item-price">$${item.price.toFixed(2)}</div>
                    <div class="cart-item-actions">
                        <div class="quantity-control">
                            <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                            <input type="text" class="qty-input" value="${item.quantity}" readonly>
                            <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                        </div>
                        <button class="remove-item" onclick="removeFromCart(${item.id})">Remove</button>
                    </div>
                </div>
            `;
            cartItemsContainer.appendChild(itemDiv);
        });

        cartTotalPrice.textContent = `$${total.toFixed(2)}`;
    }

    function toggleCart() {
        cartSidebar.classList.toggle('active');
        cartOverlay.classList.toggle('active');
    }

    function showToast() {
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    // --- Event Listeners ---

    // Filters
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.getAttribute('data-filter');
            renderProducts();
        });
    });

    // Search
    searchInput.addEventListener('input', (e) => {
        currentSearch = e.target.value;
        renderProducts();
    });

    // Sort
    sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        renderProducts();
    });

    // Navigation
    logoBtn.addEventListener('click', showHome);
    backToShopBtn.addEventListener('click', showHome);
    document.getElementById('shop-now-btn').addEventListener('click', () => {
        document.querySelector('.store-controls').scrollIntoView({ behavior: 'smooth' });
    });

    // Cart Sidebar Toggles
    cartBtn.addEventListener('click', toggleCart);
    closeCartBtn.addEventListener('click', toggleCart);
    cartOverlay.addEventListener('click', toggleCart);
    startShoppingBtn.addEventListener('click', () => {
        toggleCart();
        showHome();
    });

    // Init
    renderProducts();
});
