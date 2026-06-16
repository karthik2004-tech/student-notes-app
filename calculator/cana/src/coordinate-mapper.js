export class CoordinateMapper {
  constructor(data, width, height, padding) {
    this.data = data;
    this.width = width;
    this.height = height;
    this.padding = padding;
    this.axisWidth = Math.max(0, width - padding.left - padding.right);
    this.axisHeight = Math.max(0, height - padding.top - padding.bottom);
    this.domain = this.buildDomain();
  }

  buildDomain() {
    const values = this.data.map((entry) => entry.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = Math.max(1, maxValue - minValue);
    const margin = range * 0.08;
    return {
      min: minValue - margin,
      max: maxValue + margin,
      range: range + margin * 2,
    };
  }

  toPoint(index, value) {
    const step = this.axisWidth / Math.max(1, this.data.length - 1);
    const x = this.padding.left + index * step;
    const normalized = (value - this.domain.min) / this.domain.range;
    const y = this.padding.top + this.axisHeight * (1 - normalized);
    return { x, y };
  }

  getGridLines(divisions = 6) {
    const increment = this.domain.range / Math.max(1, divisions - 1);
    return Array.from({ length: divisions }, (_, index) => this.domain.min + index * increment);
  }
}
