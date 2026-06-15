document.addEventListener('DOMContentLoaded', () => {
    // Typewriter effect
    const textArray = ["Web Applications.", "User Interfaces.", "Digital Experiences.", "REST APIs."];
    let textIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    const typingTextElement = document.querySelector('.typing-text');
    
    function type() {
        const currentText = textArray[textIndex];
        
        if (isDeleting) {
            typingTextElement.textContent = currentText.substring(0, charIndex - 1);
            charIndex--;
        } else {
            typingTextElement.textContent = currentText.substring(0, charIndex + 1);
            charIndex++;
        }
        
        let typeSpeed = isDeleting ? 50 : 100;
        
        if (!isDeleting && charIndex === currentText.length) {
            typeSpeed = 2000; // Pause at end of word
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            textIndex = (textIndex + 1) % textArray.length;
            typeSpeed = 500; // Pause before typing next word
        }
        
        setTimeout(type, typeSpeed);
    }
    
    // Start typing effect
    setTimeout(type, 1000);

    // Navbar scroll effect
    let lastScrollTop = 0;
    const navbar = document.querySelector('.navbar');

    window.addEventListener('scroll', () => {
        let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > lastScrollTop && scrollTop > 80) {
            // Scroll down -> hide navbar
            navbar.style.transform = 'translateY(-100%)';
        } else {
            // Scroll up -> show navbar
            navbar.style.transform = 'translateY(0)';
            
            // Add shadow if not at top
            if (scrollTop > 10) {
                navbar.style.boxShadow = '0 10px 30px -10px rgba(2,12,27,0.7)';
            } else {
                navbar.style.boxShadow = 'none';
            }
        }
        lastScrollTop = scrollTop;
    });
});
