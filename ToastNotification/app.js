class ToastManager {
  constructor() {
    this.container = document.getElementById("toast-container");
    this.limit = 3;
  }

  show(message, type = "success", duration = 3000) {
    const toast = document.createElement("div");
    toast.classList.add("toast", type);

    toast.innerHTML = `
      <span>${message}</span>
      <span class="close">&times;</span>
      <div class="progress"></div>
    `;

    this.container.appendChild(toast);

    const progress = toast.querySelector(".progress");

    progress.style.animationDuration = duration + "ms";

    let timer = setTimeout(() => {
      this.remove(toast);
    }, duration);

    // close button
    toast.querySelector(".close").onclick = () => {
      clearTimeout(timer);
      this.remove(toast);
    };

    // hover pause
    toast.addEventListener("mouseenter", () => {
      clearTimeout(timer);
      progress.style.animationPlayState = "paused";
    });

    toast.addEventListener("mouseleave", () => {
      progress.style.animationPlayState = "running";
      timer = setTimeout(() => {
        this.remove(toast);
      }, 1000);
    });

    if (this.container.children.length > this.limit) {
      this.container.removeChild(this.container.firstChild);
    }
  }

  remove(toast) {
    toast.style.animation = "slideOut 0.3s forwards";
    setTimeout(() => toast.remove(), 300);
  }

  success(msg) { this.show(msg, "success"); }
  error(msg) { this.show(msg, "error"); }
  warning(msg) { this.show(msg, "warning"); }
  info(msg) { this.show(msg, "info"); }
}

const toast = new ToastManager();