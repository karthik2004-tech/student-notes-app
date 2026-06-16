export class ChartRenderer {
  constructor(context, width, height, config) {
    this.ctx = context;
    this.width = width;
    this.height = height;
    this.config = config;
  }

  updateDimensions(width, height) {
    this.width = width;
    this.height = height;
  }

  clear() {
    this.ctx.save();
    this.ctx.fillStyle = this.config.background;
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.restore();
  }

  drawGrid(mapper) {
    const lines = mapper.getGridLines(6);
    this.ctx.save();
    this.ctx.strokeStyle = this.config.gridColor;
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([4, 8]);

    lines.forEach((value) => {
      const y = mapper.toPoint(0, value).y;
      this.ctx.beginPath();
      this.ctx.moveTo(this.config.padding.left, y);
      this.ctx.lineTo(this.width - this.config.padding.right, y);
      this.ctx.stroke();
    });

    this.ctx.restore();
  }

  drawAxes(mapper) {
    const { left, top, bottom, right } = this.config.padding;
    const xStart = left;
    const yStart = this.height - bottom;
    const xEnd = this.width - right;

    this.ctx.save();
    this.ctx.strokeStyle = this.config.axisColor;
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.moveTo(xStart, yStart);
    this.ctx.lineTo(xEnd, yStart);
    this.ctx.lineTo(xEnd, top);
    this.ctx.stroke();
    this.ctx.restore();

    this.ctx.save();
    this.ctx.fillStyle = this.config.labelColor;
    this.ctx.font = '0.95rem Inter, system-ui, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';

    mapper.data.forEach((entry, index) => {
      const point = mapper.toPoint(index, entry.value);
      this.ctx.fillText(entry.label, point.x, yStart + 12);
    });

    this.ctx.restore();
  }

  drawLine(points) {
    this.ctx.save();
    this.ctx.strokeStyle = this.config.lineColor;
    this.ctx.lineWidth = 3;
    this.ctx.lineJoin = 'round';
    this.ctx.lineCap = 'round';
    this.ctx.beginPath();

    points.forEach((point, index) => {
      if (index === 0) this.ctx.moveTo(point.x, point.y);
      else this.ctx.lineTo(point.x, point.y);
    });

    this.ctx.stroke();
    this.ctx.restore();
  }

  drawPoints(points) {
    points.forEach((point) => {
      this.ctx.save();
      this.ctx.fillStyle = this.config.pointFill;
      this.ctx.beginPath();
      this.ctx.arc(point.x, point.y, this.config.pointRadius + 2, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.strokeStyle = this.config.pointColor;
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      this.ctx.restore();
    });
  }

  drawHoverLabel(point, label, value) {
    this.ctx.save();
    this.ctx.fillStyle = '#f7fbff';
    this.ctx.font = '700 0.94rem Inter, system-ui, sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'bottom';
    this.ctx.fillText(`${label}: ${value}`, point.x + 12, point.y - 10);
    this.ctx.restore();
  }
}
