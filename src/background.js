// ============================================================================
//  background.js — the endless Castle interior.
//
//  PARALLAX: layers further away scroll slower than layers close up, which
//  tricks the eye into seeing depth.
//      far rooms    → 15% of game speed
//      pillars      → 45%
//      floor/ceiling→ 100% (they move with the obstacles)
//
//  The background "tiles" are generated from their tile number with a hash
//  function, so the same tile always looks the same without us storing it.
// ============================================================================

import { CONFIG } from './config.js';

const FAR_FACTOR = 0.15;
const MID_FACTOR = 0.45;

// Deterministic pseudo-random number in [0, 1) for any integer n.
function hash(n) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

export class Background {
  constructor(images = {}) {
    this.images = images;
    this.farOffset = 0;
    this.midOffset = 0;
    this.groundOffset = 0;
  }

  update(dt, speed) {
    this.farOffset += speed * FAR_FACTOR * dt;
    this.midOffset += speed * MID_FACTOR * dt;
    this.groundOffset += speed * dt;
  }

  // Everything BEHIND the obstacles.
  drawBack(ctx, world) {
    const C = CONFIG.colors;
    const sky = ctx.createLinearGradient(0, 0, 0, world.height);
    sky.addColorStop(0, C.skyTop);
    sky.addColorStop(1, C.skyBottom);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, world.width, world.height);

    if (this.images.backgroundFar) drawTiled(ctx, this.images.backgroundFar, this.farOffset, world);
    else this.drawFarRooms(ctx, world);

    if (this.images.backgroundMid) drawTiled(ctx, this.images.backgroundMid, this.midOffset, world);
    else this.drawPillarsAndLanterns(ctx, world);
  }

  // Things IN FRONT of the obstacles: ceiling beam and floor.
  drawFront(ctx, world) {
    this.drawCeiling(ctx, world);
    this.drawFloor(ctx, world);
  }

  // Distant rooms floating at odd heights, some upside down.
  drawFarRooms(ctx, world) {
    const C = CONFIG.colors;
    const tileW = 170;
    const first = Math.floor(this.farOffset / tileW);
    const count = Math.ceil(world.width / tileW) + 2;
    const span = world.groundTop - world.ceiling;

    for (let i = first; i < first + count; i++) {
      const sx = i * tileW - this.farOffset;
      const w = 90 + hash(i) * 60;
      const h = 50 + hash(i + 100) * 70;
      const y = world.ceiling + 30 + hash(i + 200) * Math.max(0, span - h - 80);
      const inverted = hash(i + 300) > 0.6;

      ctx.fillStyle = C.farRoom;
      ctx.fillRect(sx, y, w, h);

      // Roof (on top, or underneath if the room is upside down).
      const ry = inverted ? y + h : y;
      const rd = inverted ? 12 : -12;
      ctx.beginPath();
      ctx.moveTo(sx - 6, ry);
      ctx.lineTo(sx + w + 6, ry);
      ctx.lineTo(sx + w - 10, ry + rd);
      ctx.lineTo(sx + 10, ry + rd);
      ctx.closePath();
      ctx.fill();

      // Faint lit windows.
      ctx.fillStyle = C.farWindow;
      const cols = Math.floor((w - 8) / 22);
      for (let c = 0; c < cols; c++) ctx.fillRect(sx + 8 + c * 22, y + 10, 14, h - 20);

      // Thin support post down to the floor or up to the ceiling.
      if (hash(i + 400) > 0.5) {
        ctx.fillStyle = C.farRoom;
        if (inverted) ctx.fillRect(sx + w / 2 - 2, world.ceiling, 4, y - world.ceiling);
        else ctx.fillRect(sx + w / 2 - 2, y + h, 4, world.groundTop - y - h);
      }
    }
  }

  // Red pillars and hanging paper lanterns.
  drawPillarsAndLanterns(ctx, world) {
    const C = CONFIG.colors;
    const tileW = 280;
    const first = Math.floor(this.midOffset / tileW);
    const count = Math.ceil(world.width / tileW) + 2;

    for (let i = first; i < first + count; i++) {
      const sx = i * tileW - this.midOffset;

      // Pillar.
      ctx.fillStyle = C.pillarShade;
      ctx.fillRect(sx, world.ceiling, 24, world.groundTop - world.ceiling);
      ctx.fillStyle = C.pillar;
      ctx.fillRect(sx, world.ceiling, 16, world.groundTop - world.ceiling);

      // Lantern on a string.
      const lx = sx + tileW / 2;
      const ly = world.ceiling + 50 + hash(i + 7) * 90;
      ctx.strokeStyle = C.lanternCap;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(lx, world.ceiling);
      ctx.lineTo(lx, ly - 15);
      ctx.stroke();

      const glow = ctx.createRadialGradient(lx, ly, 2, lx, ly, 46);
      glow.addColorStop(0, C.lanternGlow);
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(lx - 46, ly - 46, 92, 92);

      ctx.fillStyle = C.lantern;
      ctx.beginPath();
      ctx.ellipse(lx, ly, 11, 15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = C.lanternCap;
      ctx.fillRect(lx - 6, ly - 17, 12, 4);
      ctx.fillRect(lx - 6, ly + 13, 12, 4);
    }
  }

  drawCeiling(ctx, world) {
    const C = CONFIG.colors;
    const h = world.ceiling;
    ctx.fillStyle = C.ceiling;
    ctx.fillRect(0, 0, world.width, h);
    ctx.fillStyle = C.woodDark;
    ctx.fillRect(0, h - 5, world.width, 5);

    // Rafter ends, scrolling with the game.
    const step = 46;
    ctx.fillStyle = C.woodLight;
    for (let x = -(this.groundOffset % step); x < world.width; x += step) {
      ctx.fillRect(x, h - 2, 10, 6);
    }
  }

  drawFloor(ctx, world) {
    const C = CONFIG.colors;
    const y = world.groundTop;
    ctx.fillStyle = C.floor;
    ctx.fillRect(0, y, world.width, world.height - y);
    ctx.fillStyle = C.woodLight;
    ctx.fillRect(0, y, world.width, 4);
    ctx.fillStyle = C.tatami;
    ctx.fillRect(0, y + 18, world.width, 10);

    // Plank seams.
    const step = 56;
    ctx.strokeStyle = C.floorLine;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = -(this.groundOffset % step); x < world.width; x += step) {
      ctx.moveTo(x, y + 4);
      ctx.lineTo(x, y + 18);
      ctx.moveTo(x + step / 2, y + 28);
      ctx.lineTo(x + step / 2, world.height);
    }
    ctx.stroke();
  }
}

// Draws an image repeated horizontally, scaled to fill the world height.
function drawTiled(ctx, img, offset, world) {
  const h = world.height;
  const w = img.width * (h / img.height);
  let x = -(offset % w);
  for (; x < world.width; x += w) ctx.drawImage(img, x, 0, w, h);
}
