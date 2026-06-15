export class InteractionController {
  constructor(canvas, tooltip, hitTest, callbacks = {}) {
    this.canvas = canvas;
    this.tooltip = tooltip;
    this.hitTest = hitTest;
    this.callbacks = callbacks;
    this.hoveredIndex = null;

    this.canvas.addEventListener('mousemove', (event) => this.onPointerMove(event));
    this.canvas.addEventListener('mouseleave', () => this.onPointerLeave());
    this.canvas.addEventListener('touchmove', (event) => this.onTouchMove(event), { passive: false });
    this.canvas.addEventListener('touchend', () => this.onPointerLeave());
  }

  onPointerMove(event) {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    this.updateHover(x, y, event.clientX, event.clientY);
  }

  onTouchMove(event) {
    event.preventDefault();
    const touch = event.touches[0];
    if (!touch) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    this.updateHover(x, y, touch.clientX, touch.clientY);
  }

  onPointerLeave() {
    if (this.hoveredIndex !== null && this.callbacks.onPointLeave) {
      this.callbacks.onPointLeave();
    }
    this.hoveredIndex = null;
    this.tooltip.classList.add('hidden');
    this.tooltip.classList.remove('visible');
  }

  updateHover(x, y, pageX, pageY) {
    const closest = this.hitTest(x, y);
    if (!closest || closest.distance > 18) {
      this.onPointerLeave();
      return;
    }

    if (closest.index !== this.hoveredIndex) {
      this.hoveredIndex = closest.index;
      if (this.callbacks.onPointHover) {
        this.callbacks.onPointHover(closest);
      }
    }

    this.tooltip.classList.remove('hidden');
    this.tooltip.classList.add('visible');
    this.tooltip.style.left = `${pageX - this.canvas.getBoundingClientRect().left}px`;
    this.tooltip.style.top = `${pageY - this.canvas.getBoundingClientRect().top}px`;
    this.tooltip.innerHTML = `<strong>${closest.data.label}</strong><br/>Score: ${closest.data.value}<br/>Hours: ${closest.data.studyHours}`;
  }
}
