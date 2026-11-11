/* =========================================================
   KENNEDITO — áudio procedural (WebAudio)
   ========================================================= */
'use strict';

const MUSIC_CFG = {
  title: {
    root: 110.0,
    scale: [220, 261.63, 293.66, 329.63, 392, 440],
    pad: [110, 164.81, 220],
    wave: 'sine',
    tempo: 0.72
  },
  hub: {
    root: 98.0,
    scale: [196, 233.08, 246.94, 293.66, 311.13, 392],
    pad: [98, 146.83, 196],
    wave: 'triangle',
    tempo: 0.66
  },
  classroom: {
    root: 130.81,
    scale: [261.63, 293.66, 311.13, 392, 415.3, 466.16],
    pad: [130.81, 196, 261.63],
    wave: 'triangle',
    tempo: 0.58
  },
  gym: {
    root: 87.31,
    scale: [174.61, 196, 233.08, 261.63, 311.13, 349.23],
    pad: [87.31, 130.81, 174.61],
    wave: 'sawtooth',
    tempo: 0.5
  },
  lab: {
    root: 116.54,
    scale: [233.08, 261.63, 293.66, 349.23, 392, 466.16],
    pad: [116.54, 174.61, 233.08],
    wave: 'sine',
    tempo: 0.54
  },
  boss: {
    root: 82.41,
    scale: [164.81, 196, 207.65, 246.94, 293.66, 329.63],
    pad: [82.41, 123.47, 164.81],
    wave: 'sawtooth',
    tempo: 0.4
  },
  final: {
    root: 73.42,
    scale: [146.83, 174.61, 196, 220, 246.94, 293.66],
    pad: [73.42, 110, 146.83],
    wave: 'sawtooth',
    tempo: 0.36
  },
  ending: {
    root: 130.81,
    scale: [261.63, 329.63, 392, 440, 523.25, 659.25],
    pad: [130.81, 196, 261.63],
    wave: 'sine',
    tempo: 0.78
  }
};

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicBus = null;
    this.sfxBus = null;
    this.delay = null;
    this.musicTimer = null;
    this.theme = 'title';
    this.bossMode = false;
    this.beat = 0;
    this.mutedByChoice = false;
    this.volume = 0.72;
  }

  init() {
    if (this.ctx) { this.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.mutedByChoice ? 0 : this.volume;
      this.master.connect(this.ctx.destination);

      this.musicBus = this.ctx.createGain();
      this.musicBus.gain.value = 0.16;
      this.musicBus.connect(this.master);

      this.sfxBus = this.ctx.createGain();
      this.sfxBus.gain.value = 0.55;
      this.sfxBus.connect(this.master);

      const delay = this.ctx.createDelay(1.0);
      delay.delayTime.value = 0.34;
      const feedback = this.ctx.createGain();
      feedback.gain.value = 0.26;
      const wet = this.ctx.createGain();
      wet.gain.value = 0.22;
      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(wet);
      wet.connect(this.musicBus);
      this.delay = delay;
    } catch (e) {
      this.ctx = null;
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  toggleMute() {
    this.mutedByChoice = !this.mutedByChoice;
    if (this.master && this.ctx) {
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.linearRampToValueAtTime(this.mutedByChoice ? 0 : this.volume, this.ctx.currentTime + 0.12);
    }
    return this.mutedByChoice;
  }

  setMuted(muted) {
    this.mutedByChoice = !!muted;
    if (this.master && this.ctx) {
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.linearRampToValueAtTime(this.mutedByChoice ? 0 : this.volume, this.ctx.currentTime + 0.12);
    }
  }

  setVolume(value) {
    this.volume = clamp(Number(value) || 0.72, 0, 1);
    if (this.master && this.ctx && !this.mutedByChoice) {
      this.master.gain.linearRampToValueAtTime(this.volume, this.ctx.currentTime + 0.1);
    }
  }

  tone(freq, dur, type = 'sine', vol = 0.2, slideTo = null, when = 0, bus = null) {
    if (!this.ctx || this.mutedByChoice) return;
    const t = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, freq), t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, vol), t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(bus || this.sfxBus);
    if (this.delay && bus === this.musicBus) g.connect(this.delay);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  noise(dur, vol = 0.2, filterFreq = 900, when = 0, bus = null) {
    if (!this.ctx || this.mutedByChoice) return;
    const t = this.ctx.currentTime + when;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFreq, t);
    filter.frequency.exponentialRampToValueAtTime(Math.max(80, filterFreq * 0.3), t + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(bus || this.sfxBus);
    src.start(t);
  }

  sfx(name) {
    if (!this.ctx || this.mutedByChoice) return;
    switch (name) {
      case 'jump':
        this.tone(320, 0.14, 'square', 0.09, 620);
        break;
      case 'doubleJump':
        this.tone(480, 0.18, 'sine', 0.11, 920);
        this.tone(760, 0.12, 'sine', 0.05, 1100, 0.03);
        break;
      case 'attack':
        this.noise(0.09, 0.13, 2600);
        this.tone(240, 0.09, 'sawtooth', 0.06, 120);
        break;
      case 'hit':
        this.noise(0.1, 0.18, 1500);
        this.tone(150, 0.11, 'square', 0.07, 70);
        break;
      case 'bossHit':
        this.noise(0.15, 0.22, 850);
        this.tone(90, 0.2, 'sine', 0.16, 50);
        break;
      case 'hurt':
        this.tone(220, 0.24, 'sawtooth', 0.14, 65);
        this.noise(0.14, 0.12, 900);
        break;
      case 'dash':
        this.noise(0.18, 0.12, 3200);
        this.tone(180, 0.12, 'sine', 0.04, 380);
        break;
      case 'book':
        this.tone(520, 0.18, 'triangle', 0.08, 880);
        this.noise(0.08, 0.05, 2200);
        break;
      case 'heal':
        [392, 523, 659, 784].forEach((f, i) => this.tone(f, 0.24, 'sine', 0.08, null, i * 0.06));
        break;
      case 'pickup':
        this.tone(880, 0.09, 'sine', 0.08, 1320);
        this.tone(1320, 0.12, 'sine', 0.05, 1760, 0.04);
        break;
      case 'key':
        [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.4, 'triangle', 0.09, null, i * 0.09));
        this.noise(0.3, 0.05, 2400, 0.2);
        break;
      case 'door':
        this.noise(0.5, 0.14, 280);
        this.tone(70, 0.5, 'sine', 0.14, 45);
        break;
      case 'gate':
        this.noise(1.4, 0.18, 340);
        this.tone(55, 1.2, 'sine', 0.18, 32);
        this.tone(110, 0.8, 'triangle', 0.06, 55, 0.15);
        break;
      case 'laser':
        this.tone(920, 0.38, 'sawtooth', 0.09, 160);
        this.noise(0.28, 0.15, 2600);
        break;
      case 'explosion':
        this.noise(0.55, 0.28, 500);
        this.tone(75, 0.6, 'sine', 0.2, 30);
        break;
      case 'roar':
        this.tone(105, 0.7, 'sawtooth', 0.16, 52);
        this.noise(0.6, 0.18, 320);
        break;
      case 'whistle':
        this.tone(2100, 0.22, 'sine', 0.1, 2600);
        this.tone(2600, 0.18, 'sine', 0.07, 2100, 0.08);
        break;
      case 'shock':
        this.tone(90, 0.35, 'sine', 0.16, 40);
        this.noise(0.3, 0.2, 500);
        break;
      case 'death':
        this.tone(200, 0.9, 'sawtooth', 0.16, 38);
        this.noise(0.7, 0.2, 500);
        break;
      case 'victory':
        [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.7, 'triangle', 0.1, null, i * 0.13));
        break;
      case 'talk':
        this.tone(520 + Math.random() * 120, 0.035, 'square', 0.016);
        break;
      case 'select':
        this.tone(520, 0.08, 'sine', 0.08, 780);
        break;
      case 'thunder':
        this.noise(1.1, 0.22, 420);
        this.tone(48, 1.0, 'sine', 0.12, 30);
        break;
      case 'step':
        this.noise(0.035, 0.035, 500);
        break;
      case 'error':
        this.tone(180, 0.18, 'square', 0.08, 120);
        break;
    }
  }

  startMusic(theme, bossMode = false) {
    this.init();
    if (!this.ctx) return;
    const changed = this.theme !== theme || this.bossMode !== bossMode;
    this.theme = theme;
    this.bossMode = bossMode;
    if (this.musicTimer && !changed) return;
    this.stopMusicScheduler();
    this.beat = 0;
    this.musicTimer = setInterval(() => this.tickMusic(), 220);
    this.tickMusic();
  }

  stopMusicScheduler() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  stopMusic() {
    this.stopMusicScheduler();
  }

  setBossMode(on) {
    if (this.bossMode === on) return;
    this.bossMode = on;
    if (this.ctx) this.startMusic(this.theme, on);
  }

  tickMusic() {
    if (!this.ctx || this.mutedByChoice) return;
    if (this.ctx.state === 'suspended') return;
    const cfg = this.bossMode ? MUSIC_CFG.boss : (MUSIC_CFG[this.theme] || MUSIC_CFG.title);
    this.beat++;
    const b = this.beat;
    const bus = this.musicBus;

    if (b % 4 === 1) {
      this.tone(cfg.root / 2, cfg.tempo * 4.2, 'sine', 0.1, null, 0, bus);
      this.tone(cfg.pad[1] / 2, cfg.tempo * 3.4, 'triangle', 0.035, null, 0.06, bus);
    }
    if (b % 8 === 1) {
      cfg.pad.forEach((f, i) => this.tone(f, cfg.tempo * 7.2, 'sine', 0.018, null, i * 0.05, bus));
    }
    const chance = this.bossMode ? 0.7 : 0.4;
    if (Math.random() < chance) {
      const note = cfg.scale[Math.floor(Math.random() * cfg.scale.length)];
      const oct = Math.random() < 0.2 ? 2 : 1;
      const dur = this.bossMode ? 0.2 : 0.52;
      this.tone(note * oct, dur, cfg.wave, this.bossMode ? 0.04 : 0.032, null, 0, bus);
    }
    if (this.bossMode && b % 8 === 5) this.noise(0.1, 0.04, 280, 0, bus);
    if (!this.bossMode && b % 16 === 9) {
      this.tone(cfg.scale[cfg.scale.length - 1] * 2, 0.9, 'sine', 0.018, null, 0, bus);
    }
    if (this.theme === 'ending' && b % 6 === 1) {
      this.tone(cfg.scale[(b / 2) % cfg.scale.length], 1.4, 'sine', 0.025, null, 0, bus);
    }
  }
}

const audio = new AudioEngine();
