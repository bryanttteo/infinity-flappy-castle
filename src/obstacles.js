// ============================================================================
//  obstacles.js — the castle blocks: spawning, scrolling, scoring, collision.
//
//  Each obstacle is a pair of blocks (one hanging from the ceiling, one rising
//  from the floor) with a gap between them. We store just three numbers:
//      x     — left edge
//      gapY  — centre of the gap
//      gap   — gap height
//  and work out the two rectangles from those whenever we need them.
//
//  COLLISION: CIRCLE vs RECTANGLE
//  Find the point inside the rectangle that is closest to the circle's
//  centre (clamp the centre's x and y into the rectangle). If that point is
//  closer than the radius, they overlap. It's cheap, exact for these shapes,
//  and with a slightly-small hitbox it feels "pixel-accurate enough".
// ============================================================================

import { CONFIG } from './config.js';

export class ObstacleManager {
  constructor(images = {}) {
    this.images = images;
    this.bodyPattern = null; // created lazily if obstacleBody image exists
    this.reset();
  }

  reset() {
    this.list = [];
  }

  // Scroll everything left, spawn new obstacles at a fixed SPACING, remove
  // ones that went off-screen, and call onScore() when one is passed.
  update(dt, speed, world, playerX, onScore) {
    const o = CONFIG.obstacles;

    for (const ob of this.list) {
      ob.x -= speed * dt;
      if (!ob.passed && ob.x + o.width < playerX) {
        ob.passed = true;
        onScore();
      }
    }

    // Drop obstacles that have fully left the screen.
    this.list = this.list.filter((ob) => ob.x + o.width + o.eaveOverhang > 0);

    // Spawn by distance (not time) so spacing stays the same at any speed.
    const last = this.list[this.list.length - 1];
    if (!last) {
      this.spawn(world.width + o.firstOffset, world, null);
    } else if (last.x + o.spacing <= world.width + o.width) {
      this.spawn(last.x + o.spacing, world, last);
    }
  }

  spawn(x, world, previous) {
    const o = CONFIG.obstacles;
    const gap = o.gap;

    // Range where the gap centre can go without touching ceiling/floor.
    let minY = world.ceiling + o.edgeMargin + gap / 2;
    let maxY = world.groundTop - o.edgeMargin - gap / 2;

    // Keep it reachable: don't jump too far from the previous gap.
    if (previous) {
      minY = Math.max(minY, previous.gapY - o.maxGapShift);
      maxY = Math.min(maxY, previous.gapY + o.maxGapShift);
    }

    const gapY = maxY > minY ? minY + Math.random() * (maxY - minY) : (minY + maxY) / 2;
    this.list.push({ x, gapY, gap, passed: false });
  }

  // The two solid rectangles of an obstacle.
  rectsFor(ob, world) {
    const w = CONFIG.obstacles.width;
    const topH = ob.gapY - ob.gap / 2;
    const bottomY = ob.gapY + ob.gap / 2;
    return [
      { x: ob.x, y: 0, w, h: topH },
      { x: ob.x, y: bottomY, w, h: world.groundTop - bottomY },
    ];
  }

  collides(circle, world) {
    for (const ob of this.list) {
      for (const r of this.rectsFor(ob, world)) {
        if (circleHitsRect(circle, r)) return true;
      }
    }
    return false;
  }

  // ---------------------------------------------------------------- draw

  draw(ctx, world) {
    for (const ob of this.list) {
      const [top, bottom] = this.rectsFor(ob, world);
      this.drawBlock(ctx, top.x, top.y, top.h, 'bottom'); // roof faces down into the gap
      this.drawBlock(ctx, bottom.x, bottom.y, bottom.h, 'top');
    }
  }

  drawHitboxes(ctx, world) {
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 1.5;
    for (const ob of this.list) {
      for (const r of this.rectsFor(ob, world)) ctx.strokeRect(r.x, r.y, r.w, r.h);
    }
  }

  // One block: stacked rooms with glowing shoji panels, red pillars on the
  // sides, and a tiled roof at the edge facing the gap. The top block's roof
  // is upside down — the Castle doesn't care which way is up.
  drawBlock(ctx, x, y, h, capSide) {
    if (h <= 0) return;
    const o = CONFIG.obstacles;
    const C = CONFIG.colors;
    const w = o.width;

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip(); // nothing drawn below spills outside the block

    if (this.images.obstacleBody) {
      if (!this.bodyPattern) this.bodyPattern = ctx.createPattern(this.images.obstacleBody, 'repeat');
      ctx.fillStyle = this.bodyPattern;
      ctx.translate(x, 0);
      ctx.fillRect(0, y, w, h);
    } else {
      ctx.fillStyle = C.woodDark;
      ctx.fillRect(x, y, w, h);

      // Rooms are lined up from the gap edge outwards, so the room nearest
      // the gap is always complete.
      const rh = o.roomHeight;
      if (capSide === 'top') {
        for (let ry = y + o.eaveHeight; ry < y + h; ry += rh) this.drawRoom(ctx, x, ry, w, rh);
      } else {
        for (let ry = y + h - o.eaveHeight - rh; ry + rh > y; ry -= rh) this.drawRoom(ctx, x, ry, w, rh);
      }

      // Lacquered side pillars.
      ctx.fillStyle = C.pillar;
      ctx.fillRect(x, y, 7, h);
      ctx.fillRect(x + w - 7, y, 7, h);
      ctx.fillStyle = C.pillarShade;
      ctx.fillRect(x + w - 3, y, 3, h);
      ctx.fillRect(x + 4, y, 3, h);
    }
    ctx.restore();

    // Roof is drawn outside the clip so it can overhang the sides.
    const edgeY = capSide === 'top' ? y : y + h;
    this.drawEave(ctx, x, edgeY, capSide === 'top' ? 1 : -1);
  }

  drawRoom(ctx, x, y, w, h) {
    const C = CONFIG.colors;
    ctx.fillStyle = C.wood;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = C.woodLight; // horizontal beam
    ctx.fillRect(x, y, w, 5);

    // Shoji panel, lit warmly from below.
    const px = x + 12, py = y + 10, pw = w - 24, ph = h - 18;
    ctx.fillStyle = C.shoji;
    ctx.fillRect(px, py, pw, ph);
    ctx.fillStyle = C.shojiGlow;
    ctx.fillRect(px, py + ph * 0.5, pw, ph * 0.5);

    // Lattice.
    ctx.strokeStyle = C.shojiLattice;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 1; i < 3; i++) {
      ctx.moveTo(px + (pw * i) / 3, py);
      ctx.lineTo(px + (pw * i) / 3, py + ph);
    }
    for (let i = 1; i < 4; i++) {
      ctx.moveTo(px, py + (ph * i) / 4);
      ctx.lineTo(px + pw, py + (ph * i) / 4);
    }
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.strokeRect(px, py, pw, ph);
  }

  // dir = +1: roof sits on top of a block (narrow edge at edgeY, widening downward)
  // dir = -1: roof hangs under a block (mirror image)
  drawEave(ctx, x, edgeY, dir) {
    const o = CONFIG.obstacles;
    const C = CONFIG.colors;
    const w = o.width, eh = o.eaveHeight, ov = o.eaveOverhang;
    const baseY = edgeY + dir * eh;

    if (this.images.obstacleCap) {
      ctx.save();
      ctx.translate(x + w / 2, edgeY + (dir * eh) / 2);
      if (dir < 0) ctx.scale(1, -1);
      ctx.drawImage(this.images.obstacleCap, -w / 2 - ov, -eh / 2, w + ov * 2, eh);
      ctx.restore();
      return;
    }

    // Tiled roof shape.
    ctx.fillStyle = C.roofTile;
    ctx.beginPath();
    ctx.moveTo(x + 10, edgeY);
    ctx.lineTo(x + w - 10, edgeY);
    ctx.lineTo(x + w + ov, baseY);
    ctx.lineTo(x - ov, baseY);
    ctx.closePath();
    ctx.fill();

    // Tile ridges.
    ctx.strokeStyle = C.roofRidge;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 1; i < 7; i++) {
      const t = i / 7;
      ctx.moveTo(x + 10 + (w - 20) * t, edgeY);
      ctx.lineTo(x - ov + (w + ov * 2) * t, baseY);
    }
    ctx.stroke();

    // Red lacquered eave edge and a small golden ornament.
    ctx.fillStyle = C.roofEdge;
    ctx.fillRect(x - ov, dir > 0 ? baseY - 1 : baseY - 3, w + ov * 2, 4);
    ctx.fillStyle = C.roofOrnament;
    ctx.beginPath();
    ctx.arc(x + w / 2, edgeY, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Circle vs axis-aligned rectangle overlap test (see explanation at the top).
export function circleHitsRect(c, r) {
  const nearestX = Math.max(r.x, Math.min(c.x, r.x + r.w));
  const nearestY = Math.max(r.y, Math.min(c.y, r.y + r.h));
  const dx = c.x - nearestX;
  const dy = c.y - nearestY;
  return dx * dx + dy * dy < c.r * c.r; // compare squared distances: no sqrt needed
}
