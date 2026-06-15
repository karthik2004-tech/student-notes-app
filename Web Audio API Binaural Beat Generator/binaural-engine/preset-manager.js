const PRESETS = [
  {
    id: 'beta',
    label: 'Beta 14Hz',
    carrier: 100,
    offset: 114,
    description: 'High-focus beta entrainment for active work and coding.'
  },
  {
    id: 'alpha',
    label: 'Alpha 10Hz',
    carrier: 100,
    offset: 110,
    description: 'Relaxed alertness for reading and low-stress study.'
  },
  {
    id: 'theta',
    label: 'Theta 7Hz',
    carrier: 100,
    offset: 107,
    description: 'Creative and meditative support for calm focus.'
  }
];

const DEFAULT_PRESET = PRESETS[0];

function findPresetById(id) {
  return PRESETS.find((preset) => preset.id === id) || DEFAULT_PRESET;
}

export { PRESETS, DEFAULT_PRESET, findPresetById };
