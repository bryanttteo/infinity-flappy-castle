// ============================================================================
//  powerups.js — pickups in the world, plus the effects they give.
//
//    shield  (Wisteria Ward)  — absorbs one hit, then a moment of blinking safety
//    slow    (Focused Breath) — the world runs slower for a few seconds
//    magnet  (Golden Lure)    — nearby coins fly to you
//
//  TIME SCALE (how slow motion works)
//  game.js multiplies dt by `timeScale` before handing it to the world:
//      worldDt = dt × timeScale
//  At 0.55, the scrolling world (obstacles, coins, background) advances 55% as
//  far each frame, giving you more time to line up with each gap. Kanao keeps
//  real-time physics by default so your flap rhythm doesn't change (set
//  powerups.slow.affectsPlayer = true for full "bullet time"). Power-up timers
//  use the REAL dt, so "5 seconds" means 5 real seconds. timeScale eases toward its target rather than jumping, so slow
//  motion fades in and out smoothly.
// ============================================================================

import { CONFIG } from './config.js';
import { drawText } from './ui.js';
import { roundRect } from './player.js';

const TYPES = ['shield', 'slow', 'magnet'];

// Pick a type at random, using config weights (e.g. {shield: 2, slow: 1} → shield twice as likely).
function pickWeighted(weights) {
  const total = TYPES.reduce((sum, t) => sum + Math.max(0, weights[t] || 0), 0);
  if (total <= 0) return null;
  let r = Math.random() * total;
  for (const t of TYPES) {
    r -= Math.max(0, weights[t] || 0);
    if (r < 0) return t;
  }
  return TYPES[TYPES.length - 1];
}

export class PowerUpManager {
  constructor(images = {}) {
    this.images = {
      shield: images.powerupShield || null,
      slow: images.powerupSlow || null,
      magnet: images.powerupMagnet || null,
    };
    this.reset();
  }

  reset() {
    this.items = [];          // pickups in the world: { x, y, type, phase }
    this.popups = [];         // name text after pickup: { x, y, age, type }
    this.shield = false;      // shield is up
    this.invulnerableTimer = 0;
    this.slowTimer = 0;
    this.magnetTimer = 0;
    this.timeScale = 1;
    this.time = 0;
  }

  get invulnerable() { return this.invulnerableTimer > 0; }
  get magnetActive() { return this.magnetTimer > 0; }

  // Called when an obstacle spawns. Returns true if a power-up was placed
  // (game.js then skips the coin for that gap so they don't overlap).
  trySpawnBetween(previous, next, world, score) {
    const p = CONFIG.powerups;
    if (!p.enabled || !previous || score < p.minScore || Math.random() > p.spawnChance) return false;

    const type = pickWeighted(p.weights);
    if (!type) return false;

    const margin = p.hitboxRadius + 10;
    const x = (previous.x + previous.w + next.x) / 2; // centre of the empty space between them
    const y = Math.max(world.ceiling + margin, Math.min(world.groundTop - margin, (previous.gapY + next.gapY) / 2));
    this.items.push({ x, y, type, phase: Math.random() * Math.PI * 2 });
    return true;
  }

  // Timers run on REAL time. Returns the (smoothed) time scale for this frame.
  updateEffects(dt) {
    const s = CONFIG.powerups.slow;
    this.time += dt;
    this.invulnerableTimer = Math.max(0, this.invulnerableTimer - dt);
    this.slowTimer = Math.max(0, this.slowTimer - dt);
    this.magnetTimer = Math.max(0, this.magnetTimer - dt);

    const target = this.slowTimer > 0 ? s.timeScale : 1;
    this.timeScale += (target - this.timeScale) * Math.min(1, s.easeSpeed * dt);

    for (const p of this.popups) p.age += dt;
    this.popups = this.popups.filter((p) => p.age < 1.2);
    return this.timeScale;
  }

  // Pickups move with the WORLD (scaled dt), like coins.
  updatePickups(dt, speed, hitbox, onPickup) {
    const p = CONFIG.powerups;
    for (const item of this.items) {
      item.x -= speed * dt;
      item.phase += dt;
    }

    this.items = this.items.filter((item) => {
      const dx = item.x - hitbox.x;
      const dy = this.drawY(item) - hitbox.y;
      const reach = hitbox.r + p.hitboxRadius;
      if (dx * dx + dy * dy < reach * reach) {
        this.activate(item.type);
        this.popups.push({ x: item.x, y: item.y, age: 0, type: item.type });
        onPickup(item.type);
        return false;
      }
      return item.x > -p.radius * 3;
    });
  }

  activate(type) {
    const p = CONFIG.powerups;
    if (type === 'shield') this.shield = true;           // doesn't stack: one hit max
    if (type === 'slow') this.slowTimer = p.slow.duration;   // picking another refreshes the timer
    if (type === 'magnet') this.magnetTimer = p.magnet.duration;
  }

  // Use up the shield, if there is one. Returns true if it saved you.
  consumeShield() {
    if (!this.shield) return false;
    this.shield = false;
    this.invulnerableTimer = CONFIG.powerups.shield.invulnerableTime;
    return true;
  }

  // What coins.js needs to pull coins toward the player (or null).
  attractor(player) {
    if (!this.magnetActive) return null;
    const m = CONFIG.powerups.magnet;
    return { x: player.x, y: player.y, radius: m.radius, pullSpeed: m.pullSpeed };
  }

  drawY(item) {
    return item.y + Math.sin(item.phase * 2.2) * CONFIG.powerups.bobAmplitude;
  }

  // ---------------------------------------------------------------- draw

  // Orbs in the world.
  drawPickups(ctx) {
    const p = CONFIG.powerups;
    for (const item of this.items) {
      const y = this.drawY(item);
      const color = CONFIG.colors.powerups[item.type];
      const pulse = 1 + 0.08 * Math.sin(item.phase * 6);
      const r = p.radius * pulse;

      const glow = ctx.createRadialGradient(item.x, y, r * 0.4, item.x, y, r * 2.8);
      glow.addColorStop(0, hexA(color, 0.45));
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(item.x - r * 3, y - r * 3, r * 6, r * 6);

      ctx.fillStyle = hexA(color, 0.85);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(item.x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      this.drawIcon(ctx, item.type, item.x, y, r * 1.2);
    }

    // Name popups.
    for (const pop of this.popups) {
      const t = pop.age / 1.2;
      ctx.globalAlpha = 1 - t * t;
      drawText(ctx, CONFIG.text.powerupNames[pop.type], pop.x, pop.y - 26 - t * 30, 18, {
        color: CONFIG.colors.powerups[pop.type],
        weight: 800,
      });
    }
    ctx.globalAlpha = 1;
  }

  // Effects drawn around the player (after the player is drawn).
  drawPlayerEffects(ctx, player) {
    const C = CONFIG.colors.powerups;
    const size = CONFIG.player.size;

    if (this.magnetActive) {
      const r = CONFIG.powerups.magnet.radius;
      ctx.save();
      ctx.strokeStyle = hexA(CONFIG.colors.coin, this.fading(this.magnetTimer) * 0.35);
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 10]);
      ctx.lineDashOffset = -this.time * 40; // dashes slowly march around the ring
      ctx.beginPath();
      ctx.arc(player.x, player.y, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (this.shield) {
      const r = size * 0.66;
      ctx.fillStyle = hexA(C.shield, 0.16);
      ctx.strokeStyle = hexA(C.shield, 0.85);
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(player.x, player.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Three wisteria petals orbiting the bubble.
      ctx.fillStyle = C.shield;
      for (let i = 0; i < 3; i++) {
        const a = this.time * 2 + (i * Math.PI * 2) / 3;
        ctx.beginPath();
        ctx.ellipse(player.x + Math.cos(a) * r, player.y + Math.sin(a) * r, 4, 2.5, a, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Whole-screen tint during slow motion (strength follows the time scale).
  drawScreenEffects(ctx, world) {
    const target = CONFIG.powerups.slow.timeScale;
    if (target >= 1) return;
    const strength = (1 - this.timeScale) / (1 - target); // 0 → 1
    if (strength < 0.01) return;
    ctx.globalAlpha = Math.min(1, strength);
    ctx.fillStyle = CONFIG.colors.powerups.slowTint;
    ctx.fillRect(0, 0, world.width, world.height);
    ctx.globalAlpha = 1;
  }

  // Active power-ups in the top-left corner, with timer bars.
  drawHUD(ctx, world) {
    const p = CONFIG.powerups;
    const active = [];
    if (this.shield) active.push({ type: 'shield', fraction: 1, left: Infinity });
    if (this.slowTimer > 0) active.push({ type: 'slow', fraction: this.slowTimer / p.slow.duration, left: this.slowTimer });
    if (this.magnetTimer > 0) active.push({ type: 'magnet', fraction: this.magnetTimer / p.magnet.duration, left: this.magnetTimer });

    const size = 38;
    let x = 12;
    const y = world.ceiling + 14;
    for (const a of active) {
      ctx.globalAlpha = this.fading(a.left);
      roundRect(ctx, x, y, size, size, 8);
      ctx.fillStyle = 'rgba(13,10,26,0.55)';
      ctx.fill();
      ctx.strokeStyle = CONFIG.colors.powerups[a.type];
      ctx.lineWidth = 2;
      ctx.stroke();
      this.drawIcon(ctx, a.type, x + size / 2, y + size / 2, size * 0.5);

      // Timer bar underneath.
      ctx.fillStyle = 'rgba(13,10,26,0.55)';
      ctx.fillRect(x, y + size + 4, size, 4);
      ctx.fillStyle = CONFIG.colors.powerups[a.type];
      ctx.fillRect(x, y + size + 4, size * a.fraction, 4);
      ctx.globalAlpha = 1;
      x += size + 8;
    }
  }

  // Blink during the last second so you can see an effect is ending.
  fading(timeLeft) {
    if (timeLeft > 1.2) return 1;
    return 0.35 + 0.65 * (0.5 + 0.5 * Math.cos(this.time * 18));
  }

  // Simple vector icons (or your own images from config).
  drawIcon(ctx, type, x, y, size) {
    const img = this.images[type];
    if (img) {
      ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
      return;
    }
    const C = CONFIG.colors.powerups;
    const s = size / 20; // icons designed on a 20-unit grid
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);

    if (type === 'shield') {
      // Hanging wisteria cluster: rows of blossoms getting narrower, with a leaf on top.
      ctx.fillStyle = C.leaf;
      ctx.beginPath();
      ctx.ellipse(-3, -8, 4, 2, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = C.icon;
      const rows = [[-4.5, -1.5, 1.5, 4.5], [-3, 0, 3], [-1.5, 1.5], [0]];
      rows.forEach((row, i) => {
        for (const bx of row) {
          ctx.beginPath();
          ctx.arc(bx, -4 + i * 3.6, 1.9, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    } else if (type === 'slow') {
      // Hourglass.
      ctx.fillStyle = C.icon;
      ctx.fillRect(-6, -9, 12, 2);
      ctx.fillRect(-6, 7, 12, 2);
      ctx.beginPath();
      ctx.moveTo(-5, -7);
      ctx.lineTo(5, -7);
      ctx.lineTo(0.8, 0);
      ctx.lineTo(5, 7);
      ctx.lineTo(-5, 7);
      ctx.lineTo(-0.8, 0);
      ctx.closePath();
      ctx.fill();
    } else if (type === 'magnet') {
      // Horseshoe magnet with light tips.
      ctx.strokeStyle = C.icon;
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.arc(0, -1, 5.5, Math.PI, 0, true);
      ctx.moveTo(-5.5, -1);
      ctx.lineTo(-5.5, -7);
      ctx.moveTo(5.5, -1);
      ctx.lineTo(5.5, -7);
      ctx.stroke();
      ctx.fillStyle = CONFIG.colors.coin;
      ctx.fillRect(-7.75, -9.5, 4.5, 3);
      ctx.fillRect(3.25, -9.5, 4.5, 3);
    }
    ctx.restore();
  }
}

// '#rrggbb' + alpha → 'rgba(r,g,b,a)'
function hexA(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}
