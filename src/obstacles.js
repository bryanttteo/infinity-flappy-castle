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
    this.onSpawn = null;     // optional callback(newObstacle, previousObstacle)
    this.reset();
  }

  reset() {
    this.list = [];
    this.bossQueued = false;
  }

  // The next obstacle to spawn will be a boss (Shifting Chamber).
  queueBoss() {
    this.bossQueued = true;
  }

  // Scroll everything left, spawn new obstacles at a fixed SPACING, remove
  // ones that went off-screen, and call onScore(obstacle) when one is passed.
  update(dt, speed, gap, world, playerX, onScore) {
    const o = CONFIG.obstacles;
    const b = CONFIG.boss;

    for (const ob of this.list) {
      ob.x -= speed * dt;

      // The boss's gap slides up and down along a sine wave around its centre.
      if (ob.boss) {
        ob.phase += b.moveSpeed * dt;
        ob.gapY = ob.baseY + Math.sin(ob.phase) * ob.amplitude;
      }

      if (!ob.passed && ob.x + ob.w < playerX) {
        ob.passed = true;
        onScore(ob);
      }
    }

    // Drop obstacles that have fully left the screen.
    this.list = this.list.filter((ob) => ob.x + ob.w + o.eaveOverhang > 0);

    // Spawn by distance (not time) so spacing stays the same at any speed.
    // `spacing` is left-edge to left-edge for normal blocks; we keep the same
    // empty space after wider blocks, plus extra room around a boss.
    const last = this.list[this.list.length - 1];
    if (!last) {
      this.spawn(world.width + o.firstOffset, gap, world, null);
    } else {
      const emptySpace = o.spacing - o.width;
      const extra = last.boss || this.bossQueued ? b.extraSpace : 0;
      const nextX = last.x + last.w + emptySpace + extra;
      if (nextX <= world.width + o.width) this.spawn(nextX, gap, world, last);
    }
  }

  spawn(x, gap, world, previous) {
    const o = CONFIG.obstacles;
    const b = CONFIG.boss;
    const isBoss = this.bossQueued && b.enabled;
    if (isBoss) {
      this.bossQueued = false;
      gap += b.gapBonus;
    }

    // Range where the gap centre can go without touching ceiling/floor.
    // A boss's gap moves ±amplitude, so it needs that much extra room.
    const reserve = isBoss ? b.amplitude : 0;
    let minY = world.ceiling + o.edgeMargin + gap / 2 + reserve;
    let maxY = world.groundTop - o.edgeMargin - gap / 2 - reserve;

    // Keep it reachable: don't jump too far from the previous gap.
    if (previous) {
      minY = Math.max(minY, previous.gapY - o.maxGapShift);
      maxY = Math.min(maxY, previous.gapY + o.maxGapShift);
    }

    const gapY = maxY > minY ? minY + Math.random() * (maxY - minY) : (minY + maxY) / 2;
    const ob = { x, gapY, gap, passed: false, w: o.width, boss: false };
    if (isBoss) {
      // On short screens there may be no room for the full slide; shrink it to fit.
      const room = (world.groundTop - o.edgeMargin - gap / 2) - (world.ceiling + o.edgeMargin + gap / 2);
      Object.assign(ob, {
        boss: true,
        w: b.width,
        baseY: gapY,
        amplitude: Math.max(0, Math.min(b.amplitude, room / 2)),
        phase: 0, // starts at the centre, so it's where the previous gap led you
      });
    }
    this.list.push(ob);
    if (this.onSpawn) this.onSpawn(ob, previous); // lets coins and power-ups place themselves
  }

  // The two solid rectangles of an obstacle.
  rectsFor(ob, world) {
    const w = ob.w;
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
      this.drawBlock(ctx, top.x, top.y, top.h, 'bottom', ob); // roof faces down into the gap
      this.drawBlock(ctx, bottom.x, bottom.y, bottom.h, 'top', ob);
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
  //
  // A boss block uses the same structure with richer colours: red lacquer
  // body, gold trim, wider panels, lanterns and a pulsing glow at the gap.
  drawBlock(ctx, x, y, h, capSide, ob) {
    if (h <= 0) return;
    const o = CONFIG.obstacles;
    const C = CONFIG.colors;
    const B = C.boss;
    const w = ob.w;
    const boss = ob.boss;
    const edgeY = capSide === 'top' ? y : y + h;
    const dir = capSide === 'top' ? 1 : -1;

    // Boss aura: a soft red glow spilling into the gap, pulsing.
    if (boss) {
      const pulse = 0.6 + 0.4 * Math.sin(ob.phase * 3);
      const g = ctx.createLinearGradient(0, edgeY, 0, edgeY - dir * 40);
      g.addColorStop(0, B.glow);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = pulse;
      ctx.fillStyle = g;
      ctx.fillRect(x - 12, Math.min(edgeY, edgeY - dir * 40), w + 24, 40);
      ctx.globalAlpha = 1;
    }

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
      ctx.fillStyle = boss ? B.lacquer : C.woodDark;
      ctx.fillRect(x, y, w, h);

      // Rooms are lined up from the gap edge outwards, so the room nearest
      // the gap is always complete.
      const rh = o.roomHeight;
      if (capSide === 'top') {
        for (let ry = y + o.eaveHeight; ry < y + h; ry += rh) this.drawRoom(ctx, x, ry, w, rh, boss);
      } else {
        for (let ry = y + h - o.eaveHeight - rh; ry + rh > y; ry -= rh) this.drawRoom(ctx, x, ry, w, rh, boss);
      }

      // Lacquered side pillars (gold-edged on the boss).
      ctx.fillStyle = C.pillar;
      ctx.fillRect(x, y, 7, h);
      ctx.fillRect(x + w - 7, y, 7, h);
      ctx.fillStyle = boss ? B.trim : C.pillarShade;
      ctx.fillRect(x + w - 3, y, 3, h);
      ctx.fillRect(x + 4, y, 3, h);
    }
    ctx.restore();

    // Roof is drawn outside the clip so it can overhang the sides.
    this.drawEave(ctx, x, edgeY, dir, w, boss);

    // Boss lanterns hanging just inside the gap at each end of the eave.
    if (boss) {
      const ly = edgeY - dir * (o.eaveHeight * 0.3);
      for (const lx of [x + 14, x + w - 14]) {
        ctx.fillStyle = B.lantern;
        ctx.beginPath();
        ctx.ellipse(lx, ly - dir * 9, 6, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = B.trim;
        ctx.fillRect(lx - 4, ly - dir * 9 - 9, 8, 2);
        ctx.fillRect(lx - 4, ly - dir * 9 + 7, 8, 2);
      }
    }
  }

  // One room: a beam across the top and one or more shoji panels side by side
  // (wider blocks get more panels so they don't look stretched).
  drawRoom(ctx, x, y, w, h, boss = false) {
    const C = CONFIG.colors;
    ctx.fillStyle = boss ? C.boss.lacquer : C.wood;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = boss ? C.boss.trim : C.woodLight; // horizontal beam
    ctx.fillRect(x, y, w, 5);

    const panels = Math.max(1, Math.round((w - 12) / 72));
    const inner = w - 24;
    const gapBetween = 6;
    const pw = (inner - gapBetween * (panels - 1)) / panels;
    const py = y + 10, ph = h - 18;

    for (let p = 0; p < panels; p++) {
      const px = x + 12 + p * (pw + gapBetween);

      // Shoji panel, lit warmly from below.
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
  }

  // dir = +1: roof sits on top of a block (narrow edge at edgeY, widening downward)
  // dir = -1: roof hangs under a block (mirror image)
  drawEave(ctx, x, edgeY, dir, w = CONFIG.obstacles.width, boss = false) {
    const o = CONFIG.obstacles;
    const C = CONFIG.colors;
    const eh = o.eaveHeight, ov = o.eaveOverhang;
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
    const ridges = Math.round(w / 12); // keep ridge spacing the same on wider roofs
    for (let i = 1; i < ridges; i++) {
      const t = i / ridges;
      ctx.moveTo(x + 10 + (w - 20) * t, edgeY);
      ctx.lineTo(x - ov + (w + ov * 2) * t, baseY);
    }
    ctx.stroke();

    // Lacquered eave edge (gold on the boss) and a small golden ornament.
    ctx.fillStyle = boss ? C.boss.trim : C.roofEdge;
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
