export class CanvasManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.devicePixelRatio = 1;
    this.bounds = null;
    this.resize();
  }

  resize() {
    this.devicePixelRatio = window.devicePixelRatio || 1;
    this.bounds = this.canvas.getBoundingClientRect();
    const width = Math.max(0, Math.floor(this.bounds.width * this.devicePixelRatio));
    const height = Math.max(0, Math.floor(this.bounds.height * this.devicePixelRatio));

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }

    this.context.setTransform(this.devicePixelRatio, 0, 0, this.devicePixelRatio, 0, 0);
  }

  get width() {
    return this.bounds?.width || 0;
  }

  get height() {
    return this.bounds?.height || 0;
  }
}
