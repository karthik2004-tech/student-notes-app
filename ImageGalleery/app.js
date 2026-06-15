const images = document.querySelectorAll(".gallery img");
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");
const closeBtn = document.getElementById("close");
const nextBtn = document.getElementById("next");
const prevBtn = document.getElementById("prev");
const gallery = document.querySelector(".gallery");

for (let i = 1011; i <= 1070; i += 2) {
  const img = document.createElement("img");
  img.src = `https://picsum.photos/id/${i}/600/400`;
  gallery.appendChild(img);
}

let currentIndex = 0;

images.forEach((img, index) => {
  img.addEventListener("click", () => {
    currentIndex = index;
    openLightbox();
  });
});

function openLightbox() {
  lightbox.style.display = "flex";
  lightboxImg.src = images[currentIndex].src;
}

closeBtn.addEventListener("click", () => {
  lightbox.style.display = "none";
});

nextBtn.addEventListener("click", () => {
  currentIndex = (currentIndex + 1) % images.length;
  openLightbox();
});

prevBtn.addEventListener("click", () => {
  currentIndex = (currentIndex - 1 + images.length) % images.length;
  openLightbox();
});

// close on background click
lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) {
    lightbox.style.display = "none";
  }
});