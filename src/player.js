// ============================================================================
//  player.js — Kanao: physics, tilt, hitbox and drawing.
//
//  PHYSICS IN ONE PARAGRAPH
//  Every frame, gravity adds to the downward velocity (vy += gravity × dt),
//  then velocity moves the position (y += vy × dt). A flap doesn't push
//  gradually; it instantly SETS vy to an upward value. That "snap" is what
//  makes flappy games feel crisp. Fall speed is capped so long drops stay
//  controllable.
// ============================================================================

import { CONFIG } from './config.js';

export class Player {
  constructor(image = null) {
    this.image = image; // optional PNG from config.assets.sprites.player
    this.palette = CONFIG.colors.kanao; // colours used by the drawn Kanao (changed by skins)
    this.reset(0, 0);
  }

  // Switch outfit: a full colour palette, and an optional sprite.
  setSkin(palette, image) {
    this.palette = palette;
    this.image = image;
  }

  reset(x, y) {
    this.x = x;
    this.y = y;
    this.vy = 0;          // vertical velocity (units/s, positive = down)
    this.rotation = 0;    // radians
    this.time = 0;        // drives little animations (cape, butterfly)
    this.flapTimer = 0;   // > 0 right after a flap, for a cape "whoosh"
  }

  flap() {
    this.vy = CONFIG.physics.flapImpulse;
    this.flapTimer = 0.25;
  }

  update(dt) {
    const p = CONFIG.physics;
    this.vy = Math.min(this.vy + p.gravity * dt, p.maxFallSpeed);
    this.y += this.vy * dt;

    this.updateTilt(dt);
    this.time += dt;
    this.flapTimer = Math.max(0, this.flapTimer - dt);
  }

  // Menu screen: float gently instead of falling.
  idle(dt, baseY) {
    const c = CONFIG.player;
    this.time += dt;
    this.y = baseY + Math.sin(this.time * c.menuBobSpeed) * c.menuBobAmplitude;
    this.vy = 0;
    this.rotation = Math.cos(this.time * c.menuBobSpeed) * -0.08;
  }

  // Tilt toward an angle based on vertical speed: nose up when rising,
  // nose down when falling. Easing toward the target (rather than snapping)
  // keeps it smooth.
  updateTilt(dt) {
    const c = CONFIG.player;
    const target = Math.max(c.maxTiltUp, Math.min(c.maxTiltDown, this.vy * c.tiltPerSpeed));
    this.rotation += (target - this.rotation) * Math.min(1, c.tiltSmoothing * dt);
  }

  // The collision circle. Smaller than the drawing on purpose: brushing a
  // wall with the tip of your cape shouldn't kill you.
  get hitbox() {
    return { x: this.x, y: this.y, r: CONFIG.player.hitboxRadius };
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    if (this.image) {
      const w = CONFIG.player.size;
      const h = w * (this.image.height / this.image.width);
      ctx.drawImage(this.image, -w / 2, -h / 2, w, h);
    } else {
      this.drawKanao(ctx);
    }

    ctx.restore();
  }

  // ---------------------------------------------------------------- art
  // A small chibi figure built from simple shapes. Designed on a 46-unit
  // grid centred on (0,0), facing right, then scaled to CONFIG.player.size.
  drawKanao(ctx) {
    const C = this.palette; // current outfit colours
    const s = CONFIG.player.size / 46;
    ctx.scale(s, s);

    // How much the cape and ponytail swing this frame.
    const wave = Math.sin(this.time * 10) * 1.5 + this.flapTimer * 12;

    // Cape (white fading to butterfly pink), flowing behind.
    const cape = ctx.createLinearGradient(-4, -4, -26, 16);
    cape.addColorStop(0, C.capeTop);
    cape.addColorStop(1, C.capeBottom);
    ctx.fillStyle = cape;
    ctx.beginPath();
    ctx.moveTo(-3, -3);
    ctx.quadraticCurveTo(-16, -6 - wave * 0.5, -27, 4 - wave);
    ctx.quadraticCurveTo(-20, 12 - wave * 0.3, -10, 16);
    ctx.lineTo(-2, 14);
    ctx.closePath();
    ctx.fill();

    // Side ponytail.
    ctx.fillStyle = C.hair;
    ctx.beginPath();
    ctx.moveTo(-6, -18);
    ctx.quadraticCurveTo(-22, -22, -25, -8 - wave * 0.6);
    ctx.quadraticCurveTo(-18, -12, -7, -11);
    ctx.closePath();
    ctx.fill();

    // Legs and body.
    ctx.fillStyle = C.uniform;
    ctx.fillRect(-5, 12, 4, 6);
    ctx.fillRect(1, 12, 4, 6);
    roundRect(ctx, -8, -2, 16, 16, 4);
    ctx.fill();

    // Belt.
    ctx.fillStyle = C.belt;
    ctx.fillRect(-8, 6, 16, 2.5);

    // Sword at the hip.
    ctx.strokeStyle = C.sword;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-13, 11);
    ctx.lineTo(9, 4);
    ctx.stroke();
    ctx.fillStyle = C.swordGuard;
    ctx.beginPath();
    ctx.arc(5, 5.3, 2, 0, Math.PI * 2);
    ctx.fill();

    // Head: hair behind, then face, then bangs on top.
    ctx.fillStyle = C.hair;
    ctx.beginPath();
    ctx.arc(1, -13, 12.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = C.skin;
    ctx.beginPath();
    ctx.arc(4.5, -10.5, 9.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = C.hair;
    ctx.beginPath();
    ctx.moveTo(-4, -22);
    ctx.lineTo(14, -19);
    ctx.lineTo(13, -14);
    ctx.lineTo(10.5, -17);
    ctx.lineTo(8.5, -12.5);
    ctx.lineTo(6, -17);
    ctx.lineTo(3, -13);
    ctx.lineTo(1, -18);
    ctx.lineTo(-4, -12);
    ctx.closePath();
    ctx.fill();

    // Eye with a highlight, and a little blush.
    ctx.fillStyle = C.eye;
    ctx.beginPath();
    ctx.ellipse(9, -9.5, 2.2, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(9.7, -10.6, 0.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C.blush;
    ctx.beginPath();
    ctx.ellipse(10.5, -5.5, 2.4, 1.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Butterfly hair ornament, wings gently fluttering.
    this.drawButterfly(ctx, -7, -21);
  }

  drawButterfly(ctx, x, y) {
    const C = this.palette;
    const f = 0.75 + 0.25 * Math.sin(this.time * 14); // wing "open" amount
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = C.butterfly;
    ctx.strokeStyle = C.butterflyEdge;
    ctx.lineWidth = 0.8;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(side * 3.2 * f, -1.5, 3.2 * f, 2.6, side * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(side * 2.4 * f, 2, 2.2 * f, 1.8, -side * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = C.butterflyEdge;
    ctx.fillRect(-0.6, -3, 1.2, 6);
    ctx.restore();
  }
}

// Rounded-rectangle path helper (works in every browser).
export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
