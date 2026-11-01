// ============================================================================
//  audio.js — sound effects with the Web Audio API.
//
//  HOW WEB AUDIO WORKS (the short version)
//  You build a little chain of "nodes" and connect them, like guitar pedals:
//
//      OscillatorNode ──► GainNode ──► master GainNode ──► speakers
//      (makes a tone)     (volume       (overall volume
//                          envelope)     and mute)
//
//  An oscillator makes a pure wave at a frequency (440 = the note A).
//  The wave shape changes the character: 'sine' is soft, 'triangle' is
//  flute-like, 'square' is retro-game, 'sawtooth' is buzzy.
//  A short fade-in and fade-out (an "envelope") stops harsh clicks.
//
//  AUTOPLAY RULE
//  Browsers don't let pages make sound until the user interacts with them.
//  So the AudioContext is created (or resumed) inside unlock(), which game.js
//  calls on the first key press or tap.
//
//  SOUND FILES
//  If config.assets.sounds names a file for a sound, that file is played
//  instead of the synthesised beep. If it fails to load, the beep is used.
// ============================================================================

import { CONFIG } from './config.js';
import { loadNumber, saveNumber } from './storage.js';

export class SoundManager {
  constructor() {
    this.ctx = null;      // AudioContext, created on first user gesture
    this.master = null;   // master volume node (mute sets it to 0)
    this.noise = null;    // cached white-noise buffer for crash/whoosh sounds
    this.buffers = {};    // decoded sound files, by name
    const startMuted = CONFIG.audio.startMuted ? 1 : 0;
    this.muted = loadNumber(CONFIG.storage.mutedKey, startMuted) === 1;
  }

  // Call from inside a user input handler (keydown / pointerdown).
  unlock() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return; // very old browser: play silently
      this.ctx = new AudioCtx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : CONFIG.audio.masterVolume;
      this.master.connect(this.ctx.destination);
      this.loadFiles();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  async loadFiles() {
    for (const [name, path] of Object.entries(CONFIG.assets.sounds)) {
      if (!path) continue;
      try {
        const res = await fetch(path);
        if (!res.ok) throw new Error(res.status);
        this.buffers[name] = await this.ctx.decodeAudioData(await res.arrayBuffer());
      } catch {
        console.warn(`[audio] Could not load "${path}" — using built-in beep for "${name}".`);
      }
    }
  }

  play(name) {
    if (this.muted || !this.ctx) return;

    const buffer = this.buffers[name];
    if (buffer) {
      const src = this.ctx.createBufferSource();
      src.buffer = buffer;
      src.connect(this.master);
      src.start();
      return;
    }

    const recipe = CONFIG.audio.sounds[name];
    if (!recipe) return;
    for (const tone of recipe) this.playTone(tone);
  }

  // One tone from a recipe in config.audio.sounds:
  //   wave     'sine' | 'triangle' | 'square' | 'sawtooth' | 'noise'
  //   from     start frequency in Hz (for 'noise': brightness of the hiss)
  //   to       end frequency (slides from `from` to `to`; omit for a flat note)
  //   duration seconds
  //   delay    seconds before it starts (lets one sound play a little melody)
  //   volume   0–1
  playTone({ wave = 'square', from = 440, to = from, duration = 0.1, delay = 0, volume = 0.3 }) {
    const ctx = this.ctx;
    const t0 = ctx.currentTime + delay;
    const t1 = t0 + duration;

    // Volume envelope: quick fade in (avoids a click), then decay to silence.
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t0);
    env.gain.linearRampToValueAtTime(volume, t0 + 0.005);
    env.gain.exponentialRampToValueAtTime(0.0001, t1);
    env.connect(this.master);

    let source;
    if (wave === 'noise') {
      // Random hiss through a low-pass filter: `from` sets how bright it is.
      source = ctx.createBufferSource();
      source.buffer = this.getNoiseBuffer();
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(from, t0);
      filter.frequency.exponentialRampToValueAtTime(Math.max(40, to), t1);
      source.connect(filter).connect(env);
    } else {
      source = ctx.createOscillator();
      source.type = wave;
      source.frequency.setValueAtTime(from, t0);
      source.frequency.exponentialRampToValueAtTime(Math.max(1, to), t1);
      source.connect(env);
    }

    source.start(t0);
    source.stop(t1 + 0.02);
  }

  getNoiseBuffer() {
    if (!this.noise) {
      const length = this.ctx.sampleRate; // 1 second
      this.noise = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
      const data = this.noise.getChannelData(0);
      for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    }
    return this.noise;
  }

  toggleMute() {
    this.muted = !this.muted;
    saveNumber(CONFIG.storage.mutedKey, this.muted ? 1 : 0);
    if (this.master) {
      // A very short glide instead of an instant jump avoids a pop.
      const target = this.muted ? 0 : CONFIG.audio.masterVolume;
      this.master.gain.setTargetAtTime(target, this.ctx.currentTime, 0.01);
    }
    return this.muted;
  }
}
