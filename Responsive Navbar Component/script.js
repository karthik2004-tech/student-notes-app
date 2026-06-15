// Responsive Navbar Component Script
const hamburger = document.getElementById("hamburger");
const navLinks = document.getElementById("navLinks");
const links = navLinks.querySelectorAll("a");

// Toggle menu open/close
hamburger.addEventListener("click", () => {
  navLinks.classList.toggle("active");
  hamburger.classList.toggle("active");
});

// Close menu when clicking outside
document.addEventListener("click", (event) => {
  if (!navLinks.contains(event.target) && !hamburger.contains(event.target)) {
    navLinks.classList.remove("active");
    hamburger.classList.remove("active");
  }
});

// Close menu with Escape key
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    navLinks.classList.remove("active");
    hamburger.classList.remove("active");
  }
});

// Highlight active link
links.forEach(link => {
  link.addEventListener("click", () => {
    links.forEach(l => l.classList.remove("active-link"));
    link.classList.add("active-link");
    // Close menu after selecting link (mobile UX)
    navLinks.classList.remove("active");
    hamburger.classList.remove("active");
  });
});

// Navbar shrink effect on scroll
const navbar = document.querySelector(".navbar");
window.addEventListener("scroll", () => {
  if (window.scrollY > 50) {
    navbar.classList.add("shrink");
  } else {
    navbar.classList.remove("shrink");
  }
});

// Smooth slide animation (helper)
function animateMenu(open) {
  if (open) {
    navLinks.style.transition = "right 0.4s ease";
    navLinks.classList.add("active");
  } else {
    navLinks.classList.remove("active");
  }
}

// Accessibility: trap focus inside menu when open
navLinks.addEventListener("keydown", (event) => {
  if (event.key === "Tab") {
    const focusable = Array.from(navLinks.querySelectorAll("a"));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});

// Optional: auto-close menu after 5s inactivity
let inactivityTimer;
function resetTimer() {
  clearTimeout(inactivityTimer);
  if (navLinks.classList.contains("active")) {
    inactivityTimer = setTimeout(() => {
      navLinks.classList.remove("active");
      hamburger.classList.remove("active");
    }, 5000);
  }
}
document.addEventListener("mousemove", resetTimer);
document.addEventListener("keydown", resetTimer);
