// ============================================================================
//  ui.js — everything drawn on top of the game: menu, score, pause, game over.
//  These are plain functions: they read values and draw, nothing else.
// ============================================================================

import { CONFIG } from './config.js';
import { roundRect } from './player.js';

const C = CONFIG.colors;
const T = CONFIG.text;
const F = CONFIG.fonts;

// Text with an outline so it's readable over any background.
function text(ctx, str, x, y, size, opts = {}) {
  const {
    color = C.hudText,
    outline = C.hudOutline,
    font = F.ui,
    weight = 700,
    align = 'center',
    maxWidth = Infinity,
  } = opts;

  ctx.font = `${weight} ${size}px ${font}`;
  // Shrink to fit if the text is wider than maxWidth (narrow phones).
  const measured = ctx.measureText(str).width;
  if (measured > maxWidth) {
    size = Math.floor(size * (maxWidth / measured));
    ctx.font = `${weight} ${size}px ${font}`;
  }

  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  if (outline) {
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(3, size * 0.16);
    ctx.strokeStyle = outline;
    ctx.strokeText(str, x, y);
  }
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

function panel(ctx, x, y, w, h) {
  roundRect(ctx, x, y, w, h, 14);
  ctx.fillStyle = C.panel;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = C.panelBorder;
  ctx.stroke();
}

// ---------------------------------------------------------------- screens

export function drawLoading(ctx, world) {
  const s = world.scale * world.dpr;
  ctx.setTransform(s, 0, 0, s, 0, 0);
  ctx.fillStyle = C.skyTop;
  ctx.fillRect(0, 0, world.width, world.height);
  text(ctx, T.loading, world.width / 2, world.height / 2, 22, { font: 'Georgia, serif' });
}

export function drawMenu(ctx, world, best, time) {
  const cx = world.width / 2;
  const h = world.height;
  const maxW = world.width - 32;

  // Darken the top a little so the title pops.
  const fade = ctx.createLinearGradient(0, 0, 0, h * 0.45);
  fade.addColorStop(0, 'rgba(13,10,26,0.75)');
  fade.addColorStop(1, 'rgba(13,10,26,0)');
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, world.width, h * 0.45);

  text(ctx, T.titleTop, cx, h * 0.14, 24, { font: F.title, color: C.accent, maxWidth: maxW });
  text(ctx, T.titleMain, cx, h * 0.22, 46, {
    font: F.title,
    weight: 800,
    outline: C.danger,
    maxWidth: maxW,
  });
  text(ctx, `${T.starring} ${T.characterName}`, cx, h * 0.3, 18, { color: C.accent, maxWidth: maxW });

  // Pulsing "tap to start" hint.
  ctx.globalAlpha = 0.6 + 0.4 * Math.sin(time * 4);
  text(ctx, T.startHint, cx, h * 0.64, 22, { maxWidth: maxW });
  ctx.globalAlpha = 1;

  if (best > 0) text(ctx, `${T.bestLabel}: ${best}`, cx, h * 0.72, 20, { color: C.lantern });
  text(ctx, T.controlsHint, cx, h * 0.78, 14, { maxWidth: maxW });
}

export function drawHUD(ctx, world, score) {
  text(ctx, String(score), world.width / 2, world.ceiling + 46, 52, { weight: 800 });
  drawPauseButton(ctx, world);
}

// Brief message when the difficulty goes up. Fades in and out over its lifetime.
export function drawLevelUp(ctx, world, timeLeft) {
  const total = CONFIG.difficulty.levelUpBannerTime;
  if (timeLeft <= 0 || total <= 0) return;
  const t = 1 - timeLeft / total; // 0 → 1 over the banner's life
  ctx.globalAlpha = Math.sin(t * Math.PI); // fade in, then out
  text(ctx, T.levelUp, world.width / 2, world.ceiling + 96, 22, {
    font: F.title,
    color: C.accent,
    maxWidth: world.width - 32,
  });
  ctx.globalAlpha = 1;
}

export function drawPaused(ctx, world) {
  ctx.fillStyle = C.overlay;
  ctx.fillRect(0, 0, world.width, world.height);
  text(ctx, T.paused, world.width / 2, world.height * 0.42, 48, { font: F.title, weight: 800 });
  text(ctx, T.resumeHint, world.width / 2, world.height * 0.52, 18, { maxWidth: world.width - 32 });
}

export function drawGameOver(ctx, world, { score, best, isNewBest, canRestart, time }) {
  ctx.fillStyle = C.overlay;
  ctx.fillRect(0, 0, world.width, world.height);

  const w = Math.min(340, world.width - 40);
  const h = 240;
  const x = (world.width - w) / 2;
  const y = world.height * 0.42 - h / 2;
  const cx = world.width / 2;

  panel(ctx, x, y, w, h);
  text(ctx, T.gameOver, cx, y + 36, 28, { font: F.title, weight: 800, color: C.danger, outline: null, maxWidth: w - 24 });

  text(ctx, T.scoreLabel, cx - w / 4, y + 82, 16, { color: C.accent, outline: null });
  text(ctx, String(score), cx - w / 4, y + 120, 44, { weight: 800 });
  text(ctx, T.bestLabel, cx + w / 4, y + 82, 16, { color: C.accent, outline: null });
  text(ctx, String(best), cx + w / 4, y + 120, 44, { weight: 800, color: C.lantern });

  if (isNewBest) {
    const pop = 1 + 0.08 * Math.sin(time * 8);
    text(ctx, T.newBest, cx, y + 168, 20 * pop, { color: C.accent });
  }

  if (canRestart) {
    ctx.globalAlpha = 0.6 + 0.4 * Math.sin(time * 4);
    text(ctx, T.retryHint, cx, y + h - 26, 17, { outline: null, maxWidth: w - 24 });
    ctx.globalAlpha = 1;
  }
}

// ----------------------------------------------------------- pause button
// Touch players can't press P, so there's an on-screen button.

function pauseButtonRect(world) {
  return { x: world.width - 54, y: world.ceiling + 12, w: 42, h: 42 };
}

export function hitPauseButton(world, x, y) {
  const r = pauseButtonRect(world);
  const pad = 8; // slightly bigger touch target than the drawing
  return x >= r.x - pad && x <= r.x + r.w + pad && y >= r.y - pad && y <= r.y + r.h + pad;
}

function drawPauseButton(ctx, world) {
  const r = pauseButtonRect(world);
  roundRect(ctx, r.x, r.y, r.w, r.h, 8);
  ctx.fillStyle = 'rgba(13,10,26,0.5)';
  ctx.fill();
  ctx.fillStyle = C.hudText;
  ctx.fillRect(r.x + 13, r.y + 11, 6, 20);
  ctx.fillRect(r.x + 23, r.y + 11, 6, 20);
}
