import { SAMPLE_DATA } from './src/data.js';
import { UI_CONFIG } from './src/config.js';
import { CanvasGrapher } from './src/canvas-grapher.js';

const canvas = document.querySelector('#chartCanvas');
const tooltip = document.querySelector('#tooltip');

if (!canvas || !tooltip) {
  throw new Error('Canvas Grapher: required DOM elements are missing.');
}

new CanvasGrapher(canvas, tooltip, SAMPLE_DATA, UI_CONFIG);
