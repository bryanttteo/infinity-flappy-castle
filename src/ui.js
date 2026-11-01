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
// Exported as drawText so other modules (e.g. coin popups) can use it.
export function drawText(ctx, str, x, y, size, opts = {}) {
  text(ctx, str, x, y, size, opts);
}

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

// Brief message under the score (level-up, dawn…). Fades in and out.
// `banner` is { text, timer, duration }.
export function drawBanner(ctx, world, banner) {
  if (banner.timer <= 0) return;
  const t = 1 - banner.timer / banner.duration; // 0 → 1 over the banner's life
  ctx.globalAlpha = Math.sin(t * Math.PI);      // fade in, then out
  text(ctx, banner.text, world.width / 2, world.ceiling + 96, 22, {
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

// Extra panel height for the leaderboard part: initials entry, or the saved rank.
const ENTRY_HEIGHT = { entering: 130, saved: 30 };

// Panel size and position, shared by drawing and the hit tests, so taps
// always line up with what's drawn. `mode` is 'entering', 'saved' or null.
function gameOverLayout(world, unlockCount, mode) {
  const w = Math.min(340, world.width - 40);
  const h = 262 + unlockCount * 24 + (ENTRY_HEIGHT[mode] || 0);
  const x = (world.width - w) / 2;
  const y = Math.max(world.ceiling + 8, world.height * 0.42 - h / 2);
  const menu = { x: world.width / 2 - 60, y: y + h + 14, w: 120, h: 38 };

  // Initials entry: n letter slots with ▲ above and ▼ below, then an OK button.
  const eTop = y + 210 + unlockCount * 24;
  const n = CONFIG.leaderboard.initialsLength;
  const slotW = 38, slotGap = 10, okW = 64, okGap = 18;
  const rowW = n * slotW + (n - 1) * slotGap + okGap + okW;
  const sx = world.width / 2 - rowW / 2;
  const slots = Array.from({ length: n }, (_, i) => {
    const sxi = sx + i * (slotW + slotGap);
    return {
      up: { x: sxi, y: eTop + 24, w: slotW, h: 24 },
      slot: { x: sxi, y: eTop + 50, w: slotW, h: 44 },
      down: { x: sxi, y: eTop + 96, w: slotW, h: 24 },
    };
  });
  const ok = { x: sx + n * (slotW + slotGap) - slotGap + okGap, y: eTop + 54, w: okW, h: 36 };

  return { x, y, w, h, menu, eTop, slots, ok };
}

export function hitGameOverMenu(world, unlockCount, mode, px, py) {
  return hitRect(gameOverLayout(world, unlockCount, mode).menu, px, py);
}

// What did a tap on the initials entry hit?
// Returns { type: 'up' | 'down' | 'slot', index }, { type: 'ok' }, or null.
export function hitNameEntry(world, unlockCount, px, py) {
  const L = gameOverLayout(world, unlockCount, 'entering');
  if (hitRect(L.ok, px, py, 6)) return { type: 'ok' };
  for (let i = 0; i < L.slots.length; i++) {
    const s = L.slots[i];
    if (hitRect(s.up, px, py, 2)) return { type: 'up', index: i };
    if (hitRect(s.down, px, py, 2)) return { type: 'down', index: i };
    if (hitRect(s.slot, px, py, 2)) return { type: 'slot', index: i };
  }
  return null;
}

// `entry` = { mode: 'entering' | 'saved' | null, letters, cursor, rank }
export function drawGameOver(ctx, world, { score, best, coins, isNewBest, canRestart, time, newSkins = [], entry = {} }) {
  ctx.fillStyle = C.overlay;
  ctx.fillRect(0, 0, world.width, world.height);

  const layout = gameOverLayout(world, newSkins.length, entry.mode);
  const { x, y, w, h, menu } = layout;
  const cx = world.width / 2;

  panel(ctx, x, y, w, h);
  text(ctx, T.gameOver, cx, y + 36, 28, { font: F.title, weight: 800, color: C.danger, outline: null, maxWidth: w - 24 });

  text(ctx, T.scoreLabel, cx - w / 4, y + 82, 16, { color: C.accent, outline: null });
  text(ctx, String(score), cx - w / 4, y + 120, 44, { weight: 800 });
  text(ctx, T.bestLabel, cx + w / 4, y + 82, 16, { color: C.accent, outline: null });
  text(ctx, String(best), cx + w / 4, y + 120, 44, { weight: 800, color: C.lantern });

  if (coins > 0) {
    text(ctx, `${T.coinsLabel}: ${coins}`, cx, y + 160, 17, { color: C.coin, outline: null });
  }

  if (isNewBest) {
    const pop = 1 + 0.08 * Math.sin(time * 8);
    text(ctx, T.newBest, cx, y + 192, 20 * pop, { color: C.accent });
  }

  // One line per outfit unlocked by this run.
  newSkins.forEach((name, i) => {
    text(ctx, T.skinUnlocked.replace('{name}', name), cx, y + 220 + i * 24, 17, {
      color: C.coin,
      outline: null,
      maxWidth: w - 24,
    });
  });

  if (entry.mode === 'entering') {
    drawNameEntry(ctx, layout, entry, time, w);
    return; // no retry / menu until the initials are saved or skipped
  }

  if (entry.mode === 'saved') {
    text(ctx, T.savedRank.replace('{rank}', entry.rank), cx, layout.eTop + 12, 18, {
      color: C.lantern,
      outline: null,
      maxWidth: w - 24,
    });
  }

  if (canRestart) {
    ctx.globalAlpha = 0.6 + 0.4 * Math.sin(time * 4);
    text(ctx, T.retryHint, cx, y + h - 26, 17, { outline: null, maxWidth: w - 24 });
    ctx.globalAlpha = 1;

    // Menu button below the panel (also Esc), for changing outfit.
    roundRect(ctx, menu.x, menu.y, menu.w, menu.h, 10);
    ctx.fillStyle = C.panel;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = C.accent;
    ctx.stroke();
    text(ctx, T.menuButton, cx, menu.y + menu.h / 2, 16, { outline: null, color: C.accent });
  }
}

// Letter slots with ▲/▼, the current slot outlined and blinking, and OK.
function drawNameEntry(ctx, layout, entry, time, panelW) {
  const cx = (layout.x + layout.x + panelW) / 2;
  text(ctx, T.enterInitials, cx, layout.eTop + 8, 17, { color: C.accent, outline: null, maxWidth: panelW - 24 });

  layout.slots.forEach((s, i) => {
    const active = i === entry.cursor;
    roundRect(ctx, s.slot.x, s.slot.y, s.slot.w, s.slot.h, 6);
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fill();
    ctx.lineWidth = active ? 2.5 : 1.5;
    ctx.strokeStyle = active && Math.sin(time * 8) > -0.3 ? C.accent : 'rgba(242,230,201,0.4)';
    ctx.stroke();
    text(ctx, entry.letters[i], s.slot.x + s.slot.w / 2, s.slot.y + s.slot.h / 2 + 1, 26, { weight: 800, outline: null });

    // ▲ and ▼ as small filled triangles.
    ctx.fillStyle = active ? C.hudText : 'rgba(242,230,201,0.55)';
    for (const [r, dir] of [[s.up, -1], [s.down, 1]]) {
      const mx = r.x + r.w / 2, my = r.y + r.h / 2;
      ctx.beginPath();
      ctx.moveTo(mx - 7, my - dir * 4);
      ctx.lineTo(mx + 7, my - dir * 4);
      ctx.lineTo(mx, my + dir * 5);
      ctx.closePath();
      ctx.fill();
    }
  });

  const ok = layout.ok;
  roundRect(ctx, ok.x, ok.y, ok.w, ok.h, 8);
  ctx.fillStyle = C.danger;
  ctx.fill();
  text(ctx, T.saveButton, ok.x + ok.w / 2, ok.y + ok.h / 2 + 1, 17, { weight: 800, outline: null });

  text(ctx, T.entryHint, cx, layout.eTop + 136, 12, { outline: null, color: '#b8aec4', maxWidth: panelW - 20 });
}

// ------------------------------------------------------------- records

function recordsButtonRect(world) {
  return { x: world.width / 2 - 75, y: world.height * 0.85 - 17, w: 150, h: 34 };
}

export function hitRecordsButton(world, x, y) {
  return hitRect(recordsButtonRect(world), x, y);
}

// Small button on the menu that opens the records screen.
export function drawRecordsButton(ctx, world) {
  if (!CONFIG.leaderboard.enabled) return;
  const r = recordsButtonRect(world);
  roundRect(ctx, r.x, r.y, r.w, r.h, 10);
  ctx.fillStyle = C.panel;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = C.lantern;
  ctx.stroke();
  text(ctx, T.lbButton, r.x + r.w / 2, r.y + r.h / 2 + 1, 15, { outline: null, color: C.lantern });
}

// The Castle Records table. `highlightDate` marks the record just saved.
export function drawLeaderboard(ctx, world, entries, highlightDate, time) {
  ctx.fillStyle = C.overlay;
  ctx.fillRect(0, 0, world.width, world.height);

  const rowH = 28;
  const max = CONFIG.leaderboard.maxEntries;
  const w = Math.min(380, world.width - 32);
  const h = 104 + max * rowH + 36;
  const x = (world.width - w) / 2;
  const y = Math.max(world.ceiling + 8, world.height * 0.48 - h / 2);
  const cx = world.width / 2;
  panel(ctx, x, y, w, h);

  text(ctx, T.lbTitle, cx, y + 34, 28, { font: F.title, weight: 800, color: C.lantern, outline: null, maxWidth: w - 24 });

  // Column positions.
  const colRank = x + 28, colDot = x + 54, colName = x + 70, colScore = x + w - 86, colCoins = x + w - 22;
  const headY = y + 74;
  const [hRank, hName, hScore, hCoins] = T.lbHeaders;
  const head = { color: C.accent, outline: null };
  text(ctx, hRank, colRank, headY, 13, head);
  text(ctx, hName, colName, headY, 13, { ...head, align: 'left' });
  text(ctx, hScore, colScore, headY, 13, { ...head, align: 'right' });
  text(ctx, hCoins, colCoins, headY, 13, { ...head, align: 'right' });

  if (entries.length === 0) {
    text(ctx, T.lbEmpty, cx, y + 104 + rowH * 2, 16, { outline: null, color: '#b8aec4', maxWidth: w - 24 });
  }

  entries.forEach((e, i) => {
    const ry = y + 104 + i * rowH;

    if (highlightDate && e.date === highlightDate) {
      ctx.fillStyle = `rgba(233, 166, 201, ${0.14 + 0.08 * Math.sin(time * 5)})`;
      ctx.fillRect(x + 8, ry - rowH / 2, w - 16, rowH);
    }

    // Top three in gold, silver, bronze.
    const rankColor = ['#f5c542', '#d8d8e0', '#d08a4a'][i] || C.hudText;
    text(ctx, String(i + 1), colRank, ry, 16, { outline: null, color: rankColor, weight: 800 });

    // Dot in the colour of the outfit used for that run.
    const skin = CONFIG.skins.list.find((s) => s.id === e.skin);
    ctx.fillStyle = (skin && skin.colors.capeBottom) || CONFIG.colors.kanao.capeBottom;
    ctx.beginPath();
    ctx.arc(colDot, ry, 5, 0, Math.PI * 2);
    ctx.fill();

    text(ctx, e.name, colName, ry, 17, { outline: null, align: 'left', weight: 800 });
    text(ctx, String(e.score), colScore, ry, 17, { outline: null, align: 'right', weight: 800, color: C.lantern });
    text(ctx, String(e.coins), colCoins, ry, 15, { outline: null, align: 'right', color: C.coin });
  });

  ctx.globalAlpha = 0.6 + 0.4 * Math.sin(time * 4);
  text(ctx, T.lbBack, cx, y + h - 22, 15, { outline: null });
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------- outfit picker

const ARROW_OFFSET = 64; // distance of each arrow from the player's centre

function skinArrowRects(px, py) {
  return [
    { dir: -1, x: px - ARROW_OFFSET - 18, y: py - 24, w: 36, h: 48 },
    { dir: 1, x: px + ARROW_OFFSET - 18, y: py - 24, w: 36, h: 48 },
  ];
}

// Returns -1 (left arrow), 1 (right arrow) or 0 (missed both).
export function hitSkinArrow(px, py, x, y) {
  for (const r of skinArrowRects(px, py)) if (hitRect(r, x, y, 8)) return r.dir;
  return 0;
}

// info: { px, py, name, unlocked, unlockScore, index, total, time }
export function drawSkinSelector(ctx, world, info) {
  const { px, py, name, unlocked, unlockScore, index, total, time } = info;
  if (total <= 1) return;

  // Chevron arrows, gently pulsing.
  ctx.strokeStyle = C.hudText;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalAlpha = 0.65 + 0.35 * Math.sin(time * 3);
  for (const r of skinArrowRects(px, py)) {
    const cx = r.x + r.w / 2;
    ctx.beginPath();
    ctx.moveTo(cx + r.dir * -6, py - 12);
    ctx.lineTo(cx + r.dir * 6, py);
    ctx.lineTo(cx + r.dir * -6, py + 12);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  if (!unlocked) drawLock(ctx, px, py);

  const sub = unlocked
    ? T.skinCounter.replace('{n}', index + 1).replace('{total}', total)
    : T.skinLocked.replace('{score}', unlockScore);
  text(ctx, name, px, py + 46, 18, { color: unlocked ? C.hudText : '#9a8fa8' });
  text(ctx, sub, px, py + 68, 14, { color: unlocked ? C.accent : C.danger, outline: null });
}

// Small padlock drawn over a locked outfit.
function drawLock(ctx, x, y) {
  ctx.strokeStyle = C.hudText;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y - 2, 7, Math.PI, 0);
  ctx.stroke();
  roundRect(ctx, x - 10, y - 2, 20, 16, 3);
  ctx.fillStyle = C.hudText;
  ctx.fill();
  ctx.fillStyle = C.hudOutline;
  ctx.fillRect(x - 1.5, y + 3, 3, 6);
}

// ----------------------------------------------------------- pause button
// Touch players can't press P, so there's an on-screen button.

function pauseButtonRect(world) {
  return { x: world.width - 54, y: world.ceiling + 12, w: 42, h: 42 };
}

// Mute button sits just left of the pause button.
function muteButtonRect(world) {
  return { x: world.width - 104, y: world.ceiling + 12, w: 42, h: 42 };
}

// Slightly bigger touch target than the drawing, but never overlapping
// the neighbouring button.
function hitRect(r, x, y, pad = 4) {
  return x >= r.x - pad && x <= r.x + r.w + pad && y >= r.y - pad && y <= r.y + r.h + pad;
}

export function hitPauseButton(world, x, y) {
  return hitRect(pauseButtonRect(world), x, y);
}

export function hitMuteButton(world, x, y) {
  return hitRect(muteButtonRect(world), x, y);
}

function buttonBackground(ctx, r) {
  roundRect(ctx, r.x, r.y, r.w, r.h, 8);
  ctx.fillStyle = 'rgba(13,10,26,0.5)';
  ctx.fill();
}

// Speaker icon, with sound waves or a red cross when muted.
export function drawMuteButton(ctx, world, muted) {
  const r = muteButtonRect(world);
  buttonBackground(ctx, r);

  const x = r.x + 10;
  const cy = r.y + r.h / 2;
  ctx.fillStyle = C.hudText;
  ctx.beginPath();
  ctx.moveTo(x, cy - 5);
  ctx.lineTo(x + 6, cy - 5);
  ctx.lineTo(x + 13, cy - 11);
  ctx.lineTo(x + 13, cy + 11);
  ctx.lineTo(x + 6, cy + 5);
  ctx.lineTo(x, cy + 5);
  ctx.closePath();
  ctx.fill();

  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  if (muted) {
    ctx.strokeStyle = C.danger;
    ctx.beginPath();
    ctx.moveTo(x + 17, cy - 6);
    ctx.lineTo(x + 25, cy + 6);
    ctx.moveTo(x + 25, cy - 6);
    ctx.lineTo(x + 17, cy + 6);
    ctx.stroke();
  } else {
    ctx.strokeStyle = C.hudText;
    ctx.beginPath();
    ctx.arc(x + 14, cy, 6, -0.9, 0.9);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + 14, cy, 11, -0.9, 0.9);
    ctx.stroke();
  }
}

function drawPauseButton(ctx, world) {
  const r = pauseButtonRect(world);
  buttonBackground(ctx, r);
  ctx.fillStyle = C.hudText;
  ctx.fillRect(r.x + 13, r.y + 11, 6, 20);
  ctx.fillRect(r.x + 23, r.y + 11, 6, 20);
}
