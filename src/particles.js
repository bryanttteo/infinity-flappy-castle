// ============================================================================
//  particles.js — little bursts of butterflies, wood splinters, petals and
//  sparkles.
//
//  PARTICLE SYSTEMS
//  A particle is a tiny object with a position, a velocity and a lifetime.
//  Each frame: velocity changes (gravity, drag), position moves by velocity,
//  and the lifetime counts down. When it hits zero, the particle is removed.
//  Spawn a few dozen at once with random speeds and directions and you get
//  an explosion. Nothing here affects gameplay: it's pure decoration, so it
//  can be as random as we like.
//
//  Kinds:
//    butterfly — floats upward, sways, flaps its wings (crash)
//    splinter  — falls with gravity, spins (crash)
//    petal     — wisteria petals drifting down (shield break)
//    sparkle   — tiny gold stars that shrink away (coin pickup)
// ============================================================================

import { CONFIG } from './config.js';

const rand = (min, max) => min + Math.random() * (max - min);
const pick = (list) => list[Math.floor(Math.random() * list.length)];

export class ParticleSystem {
  constructor() {
    this.list = [];
  }

  reset() {
    this.list = [];
  }

  // ------------------------------------------------------------ emitters

  crash(x, y) {
    const p = CONFIG.particles;
    if (!p.enabled) return;
    const C = CONFIG.colors;
    for (let i = 0; i < p.crash.splinters; i++) {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(150, 420);
      this.add({
        kind: 'splinter', x, y,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 120,
        life: rand(0.7, 1.3),
        size: rand(5, 11),
        rot: rand(0, Math.PI), spin: rand(-12, 12),
        color: pick([C.wood, C.woodLight, C.woodDark, C.shoji]),
      });
    }
    for (let i = 0; i < p.crash.butterflies; i++) {
      const angle = rand(-Math.PI * 0.95, -Math.PI * 0.05); // mostly upward
      const speed = rand(60, 200);
      this.add({
        kind: 'butterfly', x, y,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        life: rand(1.4, 2.4),
        size: rand(4, 7),
        phase: rand(0, Math.PI * 2),
        color: pick(p.butterflyColors),
      });
    }
  }

  shieldBreak(x, y) {
    const p = CONFIG.particles;
    if (!p.enabled) return;
    for (let i = 0; i < p.shieldBreak.petals; i++) {
      const angle = (i / p.shieldBreak.petals) * Math.PI * 2 + rand(-0.2, 0.2);
      const speed = rand(120, 260);
      this.add({
        kind: 'petal', x, y,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        life: rand(0.6, 1.1),
        size: rand(3, 5),
        rot: angle, spin: rand(-6, 6),
        color: CONFIG.colors.powerups.shield,
      });
    }
  }

  sparkle(x, y) {
    const p = CONFIG.particles;
    if (!p.enabled) return;
    for (let i = 0; i < p.coinSparkles; i++) {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(40, 140);
      this.add({
        kind: 'sparkle', x, y,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        life: rand(0.3, 0.55),
        size: rand(3, 5),
        color: CONFIG.colors.coin,
      });
    }
  }

  add(particle) {
    particle.age = 0;
    this.list.push(particle);
    // Safety valve so a bug can never spawn thousands of particles.
    if (this.list.length > CONFIG.particles.maxParticles) this.list.shift();
  }

  // -------------------------------------------------------------- update

  update(dt) {
    const g = CONFIG.particles.gravity;
    for (const p of this.list) {
      p.age += dt;
      switch (p.kind) {
        case 'splinter':
          p.vy += g * dt;
          p.rot += p.spin * dt;
          break;
        case 'butterfly':
          // Light, flappy flight: slowed by air, gently drifting up,
          // with a side-to-side sway.
          p.vx *= 1 - 1.5 * dt;
          p.vy = p.vy * (1 - 1.5 * dt) - 40 * dt;
          p.vx += Math.sin(p.age * 6 + p.phase) * 120 * dt;
          break;
        case 'petal':
          p.vx *= 1 - 2.5 * dt;
          p.vy = p.vy * (1 - 2.5 * dt) + g * 0.15 * dt;
          p.rot += p.spin * dt;
          break;
        case 'sparkle':
          p.vx *= 1 - 4 * dt;
          p.vy *= 1 - 4 * dt;
          break;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    this.list = this.list.filter((p) => p.age < p.life);
  }

  // ---------------------------------------------------------------- draw

  draw(ctx) {
    for (const p of this.list) {
      const t = p.age / p.life;          // 0 → 1 over its life
      ctx.globalAlpha = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3; // fade out at the end
      ctx.fillStyle = p.color;
      ctx.save();
      ctx.translate(p.x, p.y);

      switch (p.kind) {
        case 'splinter':
          ctx.rotate(p.rot);
          ctx.fillRect(-p.size / 2, -1.6, p.size, 3.2);
          break;

        case 'butterfly': {
          const flap = 0.25 + 0.75 * Math.abs(Math.sin(p.age * 16 + p.phase));
          ctx.rotate(Math.atan2(p.vy, p.vx) * 0.25); // lean into the flight direction
          for (const side of [-1, 1]) {
            ctx.beginPath();
            ctx.ellipse(side * p.size * 0.55 * flap, -p.size * 0.2, p.size * 0.6 * flap, p.size * 0.5, side * 0.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(side * p.size * 0.4 * flap, p.size * 0.35, p.size * 0.4 * flap, p.size * 0.32, -side * 0.4, 0, Math.PI * 2);
            ctx.fill();
          }
          break;
        }

        case 'petal':
          ctx.rotate(p.rot);
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
          ctx.fill();
          break;

        case 'sparkle': {
          // Four-point star that shrinks as it fades.
          const s = p.size * (1 - t);
          ctx.beginPath();
          ctx.moveTo(0, -s * 2);
          ctx.lineTo(s * 0.5, -s * 0.5);
          ctx.lineTo(s * 2, 0);
          ctx.lineTo(s * 0.5, s * 0.5);
          ctx.lineTo(0, s * 2);
          ctx.lineTo(-s * 0.5, s * 0.5);
          ctx.lineTo(-s * 2, 0);
          ctx.lineTo(-s * 0.5, -s * 0.5);
          ctx.closePath();
          ctx.fill();
          break;
        }
      }
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }
}
