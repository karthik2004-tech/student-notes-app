const stars = document.querySelectorAll(".star");
const selectedRating = document.getElementById("selectedRating");
let lockedRating = 0;

stars.forEach(star => {
  star.addEventListener("mouseover", () => {
    if (lockedRating) return;
    highlightStars(star.dataset.value);
  });

  star.addEventListener("mouseout", () => {
    if (lockedRating) {
      highlightStars(lockedRating);
    } else {
      clearStars();
    }
  });

  star.addEventListener("click", () => {
    lockedRating = star.dataset.value;
    highlightStars(lockedRating);
    selectedRating.textContent = `${lockedRating} out of 5`;
  });
});

function highlightStars(value) {
  stars.forEach(star => {
    star.classList.toggle("active", star.dataset.value <= value);
  });
}

function clearStars() {
  stars.forEach(star => star.classList.remove("active"));
}
