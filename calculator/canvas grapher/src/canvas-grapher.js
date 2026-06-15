import { CanvasManager } from './canvas-manager.js';
import { CoordinateMapper } from './coordinate-mapper.js';
import { ChartRenderer } from './chart-renderer.js';
import { InteractionController } from './interaction-controller.js';

export class CanvasGrapher {
  constructor(canvas, tooltip, data, config) {
    this.canvas = canvas;
    this.tooltip = tooltip;
    this.data = data;
    this.config = config;
    this.hoverInfo = null;
    this.dirty = true;

    this.canvasManager = new CanvasManager(canvas);
    this.chartRenderer = new ChartRenderer(this.canvasManager.context, this.canvasManager.width, this.canvasManager.height, this.config);
    this.mapper = new CoordinateMapper(this.data, this.canvasManager.width, this.canvasManager.height, this.config.padding);
    this.interactionController = new InteractionController(canvas, tooltip, (x, y) => this.findClosestPoint(x, y), {
      onPointHover: (hoverInfo) => this.handleHover(hoverInfo),
      onPointLeave: () => this.handleHover(null),
    });

    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(canvas);

    this.requestFrame();
    this.loop();
  }

  handleResize() {
    this.canvasManager.resize();
    this.chartRenderer.updateDimensions(this.canvasManager.width, this.canvasManager.height);
    this.mapper = new CoordinateMapper(this.data, this.canvasManager.width, this.canvasManager.height, this.config.padding);
    this.requestFrame();
  }

  requestFrame() {
    this.dirty = true;
  }

  handleHover(hoverInfo) {
    this.hoverInfo = hoverInfo;
    this.requestFrame();
  }

  findClosestPoint(x, y) {
    const points = this.getPoints();
    let best = null;

    points.forEach((point, index) => {
      const deltaX = x - point.x;
      const deltaY = y - point.y;
      const distance = Math.hypot(deltaX, deltaY);

      if (!best || distance < best.distance) {
        best = {
          index,
          point,
          distance,
          data: this.data[index],
        };
      }
    });

    return best;
  }

  getPoints() {
    return this.data.map((entry, index) => this.mapper.toPoint(index, entry.value));
  }

  draw() {
    const points = this.getPoints();
    this.chartRenderer.clear();
    this.chartRenderer.drawGrid(this.mapper);
    this.chartRenderer.drawAxes(this.mapper);
    this.chartRenderer.drawLine(points);
    this.chartRenderer.drawPoints(points);

    if (this.hoverInfo) {
      this.chartRenderer.drawHoverLabel(this.hoverInfo.point, this.hoverInfo.data.label, this.hoverInfo.data.value);
    }

    this.dirty = false;
  }

  loop() {
    if (this.dirty) {
      this.draw();
    }
    requestAnimationFrame(() => this.loop());
  }
}
