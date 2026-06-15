class BinauralAudioGraph {
  constructor(context) {
    this.context = context;
    this.masterGain = null;
    this.leftGain = null;
    this.rightGain = null;
    this.merger = null;
  }

  build() {
    this.masterGain = this.context.createGain();
    this.leftGain = this.context.createGain();
    this.rightGain = this.context.createGain();
    this.merger = this.context.createChannelMerger(2);

    this.leftGain.gain.value = 1;
    this.rightGain.gain.value = 1;
    this.masterGain.gain.value = 0;

    this.leftGain.connect(this.merger, 0, 0);
    this.rightGain.connect(this.merger, 0, 1);
    this.merger.connect(this.masterGain);
    this.masterGain.connect(this.context.destination);
  }

  setVolume(value, when) {
    if (when === undefined) {
      when = this.context.currentTime;
    }
    this.masterGain.gain.cancelScheduledValues(when);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, when);
    this.masterGain.gain.linearRampToValueAtTime(value, when + 0.08);
  }
}

class BinauralEngine {
  constructor() {
    this.audioContext = null;
    this.audioGraph = null;
    this.leftOscillator = null;
    this.rightOscillator = null;
    this.isPlaying = false;
    this.currentCarrier = 100;
    this.currentOffset = 114;
  }

  createContext() {
    if (this.audioContext) {
      return;
    }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.audioContext = new AudioContext();
    this.audioGraph = new BinauralAudioGraph(this.audioContext);
    this.audioGraph.build();
  }

  createOscillatorPair(carrierFrequency, offsetFrequency) {
    this.leftOscillator = this.audioContext.createOscillator();
    this.rightOscillator = this.audioContext.createOscillator();
    this.leftOscillator.type = 'sine';
    this.rightOscillator.type = 'sine';
    this.leftOscillator.frequency.setValueAtTime(carrierFrequency, this.audioContext.currentTime);
    this.rightOscillator.frequency.setValueAtTime(offsetFrequency, this.audioContext.currentTime);
    this.leftOscillator.connect(this.audioGraph.leftGain);
    this.rightOscillator.connect(this.audioGraph.rightGain);
    this.leftOscillator.start();
    this.rightOscillator.start();
  }

  async resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  async start({ carrierFrequency = 100, offsetFrequency = 114, volume = 0.25 } = {}) {
    this.createContext();
    await this.resume();
    if (this.isPlaying) {
      this.updateFrequencies(carrierFrequency, offsetFrequency);
      this.setVolume(volume);
      return;
    }
    this.createOscillatorPair(carrierFrequency, offsetFrequency);
    this.currentCarrier = carrierFrequency;
    this.currentOffset = offsetFrequency;
    this.setVolume(volume);
    this.isPlaying = true;
  }

  stop() {
    if (!this.isPlaying) {
      return;
    }
    const now = this.audioContext.currentTime;
    this.audioGraph.masterGain.gain.cancelScheduledValues(now);
    this.audioGraph.masterGain.gain.setTargetAtTime(0, now, 0.05);
    if (this.leftOscillator) {
      this.leftOscillator.stop(now + 0.2);
      this.leftOscillator.disconnect();
      this.leftOscillator = null;
    }
    if (this.rightOscillator) {
      this.rightOscillator.stop(now + 0.2);
      this.rightOscillator.disconnect();
      this.rightOscillator = null;
    }
    this.isPlaying = false;
  }

  setVolume(value) {
    if (!this.audioGraph) {
      return;
    }
    this.audioGraph.setVolume(value);
  }

  updateFrequencies(carrierFrequency, offsetFrequency) {
    if (!this.leftOscillator || !this.rightOscillator) {
      return;
    }
    const now = this.audioContext.currentTime;
    this.leftOscillator.frequency.setTargetAtTime(carrierFrequency, now, 0.06);
    this.rightOscillator.frequency.setTargetAtTime(offsetFrequency, now, 0.06);
    this.currentCarrier = carrierFrequency;
    this.currentOffset = offsetFrequency;
  }
}

export { BinauralEngine };
