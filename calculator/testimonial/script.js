const slides = document.querySelectorAll('.testimonial-slide');
const dots = document.querySelectorAll('.dot');
const prevBtn = document.querySelector('.prev-btn');
const nextBtn = document.querySelector('.next-btn');
const carouselContainer = document.querySelector('.testimonial-carousel');

let currentSlide = 0;
let autoplayInterval;
const autoplayDelay = 5000; // 5 seconds

// Initialize Carousel
function initCarousel() {
    showSlide(currentSlide);
    startAutoplay();
}

// Function to show specific slide
function showSlide(index) {
    // Wrap around logic
    if (index >= slides.length) {
        currentSlide = 0;
    } else if (index < 0) {
        currentSlide = slides.length - 1;
    } else {
        currentSlide = index;
    }

    // Remove active class from all slides and dots
    slides.forEach(slide => slide.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));

    // Add active class to current slide and dot
    slides[currentSlide].classList.add('active');
    dots[currentSlide].classList.add('active');
}

// Next Slide
function nextSlide() {
    showSlide(currentSlide + 1);
}

// Previous Slide
function prevSlide() {
    showSlide(currentSlide - 1);
}

// Autoplay functionality
function startAutoplay() {
    autoplayInterval = setInterval(nextSlide, autoplayDelay);
}

function stopAutoplay() {
    clearInterval(autoplayInterval);
}

// Event Listeners for Navigation Buttons
nextBtn.addEventListener('click', () => {
    nextSlide();
    resetAutoplay();
});

prevBtn.addEventListener('click', () => {
    prevSlide();
    resetAutoplay();
});

// Event Listeners for Dots
dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
        showSlide(index);
        resetAutoplay();
    });
});

// Pause autoplay on hover
carouselContainer.addEventListener('mouseenter', stopAutoplay);
carouselContainer.addEventListener('mouseleave', startAutoplay);

// Reset autoplay timer when user interacts manually
function resetAutoplay() {
    stopAutoplay();
    startAutoplay();
}

// Start the carousel
initCarousel();
