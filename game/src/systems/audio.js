const MASTER_GAIN = 1.65;

export class Sfx {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.limiter = null;
    this.muted = false;
  }
  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = MASTER_GAIN;
    this.limiter = this.ctx.createDynamicsCompressor();
    this.limiter.threshold.value = -2;
    this.limiter.knee.value = 0;
    this.limiter.ratio.value = 20;
    this.limiter.attack.value = 0.002;
    this.limiter.release.value = 0.15;
    this.master.connect(this.limiter).connect(this.ctx.destination);
  }
  toggle() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : MASTER_GAIN;
    return this.muted;
  }
  tone(freq, dur, type = "square", gain = 0.5, slide = 0) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }
  noise(dur, gain = 0.4, cutoff = 900) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = cutoff;
    const g = this.ctx.createGain();
    g.gain.value = gain;
    src.connect(f).connect(g).connect(this.master);
    src.start(t0);
  }
  play(name) {
    switch (name) {
      case "click": this.tone(420, 0.05, "square", 0.25); break;
      case "place": this.tone(180, 0.12, "square", 0.35, 120); this.noise(0.1, 0.16, 500); break;
      case "pulse": this.tone(900, 0.05, "square", 0.14, -280); break;
      case "arc": this.tone(220, 0.16, "sawtooth", 0.2, 600); this.noise(0.1, 0.12, 2200); break;
      case "cryo": this.tone(1200, 0.14, "sine", 0.16, -700); break;
      case "kill": this.noise(0.14, 0.24, 1300); break;
      case "leak": this.tone(120, 0.35, "sawtooth", 0.35, -60); break;
      case "warn": this.tone(660, 0.1, "square", 0.16); break;
      case "trip": this.noise(0.5, 0.4, 300); this.tone(90, 0.5, "sawtooth", 0.3, -40); break;
      case "wave": this.tone(520, 0.09, "square", 0.18); this.tone(780, 0.12, "square", 0.14, 60); break;
      case "win": [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.tone(f, 0.18, "square", 0.2), i * 110)); break;
      case "lose": [392, 330, 262, 196].forEach((f, i) => setTimeout(() => this.tone(f, 0.22, "sawtooth", 0.24), i * 140)); break;
      default: break;
    }
  }
}
