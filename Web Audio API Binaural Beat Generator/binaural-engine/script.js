import { BinauralEngine } from './audio-engine.js';
import { PRESETS, DEFAULT_PRESET, findPresetById } from './preset-manager.js';

const engine = new BinauralEngine();
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const volumeRange = document.getElementById('volumeRange');
const statusLabel = document.getElementById('statusLabel');
const frequencyLabel = document.getElementById('frequencyLabel');
const presetButtons = document.querySelectorAll('.preset-btn');

let activePresetId = DEFAULT_PRESET.id;

function renderPresetLabel(preset) {
  frequencyLabel.textContent = `${preset.carrier}Hz / ${preset.offset}Hz`;
}

function setActivePreset(button) {
  presetButtons.forEach((btn) => btn.classList.remove('active'));
  button.classList.add('active');
  activePresetId = button.dataset.presetId;
  renderPresetLabel(findPresetById(activePresetId));
  if (engine.isPlaying) {
    const preset = findPresetById(activePresetId);
    engine.updateFrequencies(preset.carrier, preset.offset);
  }
}

presetButtons.forEach((button) => {
  button.addEventListener('click', () => setActivePreset(button));
});

startBtn.addEventListener('click', async () => {
  const preset = findPresetById(activePresetId);
  await engine.start({
    carrierFrequency: preset.carrier,
    offsetFrequency: preset.offset,
    volume: parseFloat(volumeRange.value)
  });
  statusLabel.textContent = 'Playing';
  startBtn.disabled = true;
  stopBtn.disabled = false;
});

stopBtn.addEventListener('click', () => {
  engine.stop();
  statusLabel.textContent = 'Stopped';
  startBtn.disabled = false;
  stopBtn.disabled = true;
});

volumeRange.addEventListener('input', () => {
  engine.setVolume(parseFloat(volumeRange.value));
});

window.addEventListener('load', () => {
  const initialButton = document.querySelector(`[data-preset-id="${DEFAULT_PRESET.id}"]`);
  if (initialButton) {
    setActivePreset(initialButton);
  } else {
    renderPresetLabel(DEFAULT_PRESET);
  }
});
