// ============================================================================
//  coins.js — collectible gold coins and their floating "+5" popups.
//
//  WHERE COINS GO
//  When a new obstacle spawns, we may place a coin halfway between it and the
//  previous one, at a height between the two gaps. That puts coins roughly on
//  the path you're already flying, with a little random offset so you have to
//  steer for them.
//
//  COLLISION: CIRCLE vs CIRCLE
//  Two circles overlap when the distance between their centres is less than
//  the sum of their radii. As with circle-vs-rectangle, we compare squared
//  distances to skip the square root. The coin's pickup radius is bigger than
//  its drawing: for things you WANT to touch, generous feels better.
// ============================================================================

import { CONFIG } from './config.js';
import { drawText } from './ui.js';

export class CoinManager {
  constructor(images = {}) {
    this.image = images.coin || null;
    this.reset();
  }

  reset() {
    this.list = [];   // { x, y, phase }
    this.popups = []; // { x, y, age }
  }

  // Called by game.js whenever a new obstacle appears.
  spawnBetween(previous, next, world) {
    const c = CONFIG.coins;
    if (!c.enabled || !previous || Math.random() > c.spawnChance) return;

    // Centre of the empty space between the two obstacles (they can differ in width).
    const x = (previous.x + previous.w + next.x) / 2;
    let y = (previous.gapY + next.gapY) / 2 + (Math.random() * 2 - 1) * c.yJitter;

    // Keep it well clear of the ceiling and floor.
    const margin = c.hitboxRadius + 10;
    y = Math.max(world.ceiling + margin, Math.min(world.groundTop - margin, y));

    this.list.push({ x, y, phase: Math.random() * Math.PI * 2 });
  }

  // Scroll, animate, check pickups. Pass `hitbox = null` to skip pickups
  // (e.g. on the game-over screen, where only the popups keep animating).
  // `attractor` ({x, y, radius, pullSpeed} or null) is the magnet power-up.
  update(dt, speed, hitbox, onCollect, attractor = null) {
    const c = CONFIG.coins;

    for (const coin of this.list) {
      coin.x -= speed * dt;
      coin.phase += dt;

      // Magnet: coins within range move straight toward the player.
      // Normalising (dx, dy) by the distance gives a direction of length 1,
      // which we then multiply by the pull speed.
      if (attractor) {
        const dx = attractor.x - coin.x;
        const dy = attractor.y - coin.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0 && dist < attractor.radius) {
          const step = Math.min(dist, attractor.pullSpeed * dt);
          coin.x += (dx / dist) * step;
          coin.y += (dy / dist) * step;
        }
      }
    }

    if (hitbox) {
      this.list = this.list.filter((coin) => {
        const dx = coin.x - hitbox.x;
        const dy = this.drawY(coin) - hitbox.y;
        const reach = hitbox.r + c.hitboxRadius;
        if (dx * dx + dy * dy < reach * reach) {
          this.popups.push({ x: coin.x, y: coin.y, age: 0 });
          onCollect(coin);
          return false; // remove collected coin
        }
        return true;
      });
    }

    // Forget coins that scrolled off the left edge.
    this.list = this.list.filter((coin) => coin.x > -c.radius * 2);

    for (const p of this.popups) p.age += dt;
    this.popups = this.popups.filter((p) => p.age < c.popupTime);
  }

  // Current y including the gentle bob.
  drawY(coin) {
    return coin.y + Math.sin(coin.phase * 2.5) * CONFIG.coins.bobAmplitude;
  }

  // ---------------------------------------------------------------- draw

  draw(ctx) {
    for (const coin of this.list) this.drawCoin(ctx, coin);
    this.drawPopups(ctx);
  }

  drawHitboxes(ctx) {
    ctx.strokeStyle = '#ffd400';
    ctx.lineWidth = 1.5;
    for (const coin of this.list) {
      ctx.beginPath();
      ctx.arc(coin.x, this.drawY(coin), CONFIG.coins.hitboxRadius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // A Japanese-style coin with a square hole. "Spinning" is faked by
  // squashing it horizontally with cos(): wide → thin → wide.
  drawCoin(ctx, coin) {
    const c = CONFIG.coins;
    const C = CONFIG.colors;
    const r = c.radius;
    const y = this.drawY(coin);
    const squash = Math.max(0.15, Math.abs(Math.cos(coin.phase * c.spinSpeed)));

    // Soft glow so coins stand out against the dark castle.
    const glow = ctx.createRadialGradient(coin.x, y, r * 0.5, coin.x, y, r * 2.6);
    glow.addColorStop(0, C.coinGlow);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(coin.x - r * 2.6, y - r * 2.6, r * 5.2, r * 5.2);

    ctx.save();
    ctx.translate(coin.x, y);
    ctx.scale(squash, 1);

    if (this.image) {
      ctx.drawImage(this.image, -r, -r, r * 2, r * 2);
    } else {
      ctx.fillStyle = C.coin;
      ctx.strokeStyle = C.coinEdge;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Inner ring.
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.7, 0, Math.PI * 2);
      ctx.stroke();

      // Square hole.
      const h = r * 0.32;
      ctx.fillStyle = C.coinHole;
      ctx.fillRect(-h, -h, h * 2, h * 2);

      // Shine.
      ctx.strokeStyle = C.coinShine;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.82, Math.PI * 1.1, Math.PI * 1.45);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawPopups(ctx) {
    const c = CONFIG.coins;
    const text = CONFIG.text.coinPopup.replace('{value}', c.value);
    for (const p of this.popups) {
      const t = p.age / c.popupTime; // 0 → 1
      ctx.globalAlpha = 1 - t * t;   // fade out, faster towards the end
      drawText(ctx, text, p.x, p.y - t * c.popupRise, 22, { color: CONFIG.colors.coin, weight: 800 });
    }
    ctx.globalAlpha = 1;
  }
}
