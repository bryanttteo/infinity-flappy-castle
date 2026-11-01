// ============================================================================
//  game.js — the entry point.
//  Sets up the canvas, runs the GAME LOOP and the STATE MACHINE.
//
//  THE GAME LOOP
//  -------------
//  A game is a loop that runs ~60 times a second:
//      1. update()  — move everything a tiny bit forward in time
//      2. render()  — draw everything where it is now
//  We use requestAnimationFrame (rAF): the browser calls our function right
//  before it repaints the screen, in sync with the monitor's refresh rate.
//
//  DELTA TIME
//  ----------
//  Monitors refresh at different rates (60Hz, 120Hz, 144Hz…), and slow devices
//  sometimes skip frames. If we moved things "5 pixels per frame", the game
//  would run twice as fast on a 120Hz screen. Instead we measure how many
//  seconds passed since the last frame (dt, usually ~0.016) and move things by
//  speed × dt. Now speed means "units per SECOND" and is the same everywhere.
//
//  THE STATE MACHINE
//  -----------------
//  The game is always in exactly one state: MENU, PLAYING, PAUSED or GAME_OVER.
//  Each state decides what update/render/input do. Switching states goes
//  through setState() so it's easy to see every transition.
// ============================================================================

import { CONFIG } from './config.js';
import { loadSprites } from './assets.js';
import { Player } from './player.js';
import { ObstacleManager } from './obstacles.js';
import { CoinManager } from './coins.js';
import { Background } from './background.js';
import { SoundManager } from './audio.js';
import { loadNumber, saveNumber } from './storage.js';
import { getDifficulty } from './difficulty.js';
import * as UI from './ui.js';

const STATE = Object.freeze({
  MENU: 'menu',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAME_OVER: 'gameOver',
});

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Shared description of the visible world, recalculated on resize.
const world = {
  width: 0,     // world units
  height: 0,    // world units
  scale: 1,     // CSS pixels per world unit
  dpr: 1,       // device pixel ratio (2 on most phones / Retina screens)
  ceiling: CONFIG.world.ceilingHeight, // y of the ceiling's bottom edge
  groundTop: 0, // y of the floor's top edge
};

const game = {
  state: STATE.MENU,
  stateTime: 0, // seconds spent in the current state
  score: 0,
  best: loadNumber(CONFIG.storage.bestScoreKey, 0),
  isNewBest: false,
  coins: 0,          // coins collected this run
  level: 0,          // difficulty level (see difficulty.js)
  levelUpTimer: 0,   // > 0 while the "level up" banner is showing
};

let player, obstacles, coins, background, sound;
let lastTime = 0;

// ------------------------------------------------------------------ helpers

function setState(next) {
  game.state = next;
  game.stateTime = 0;
}

function playerHomeX() {
  return Math.min(world.width * CONFIG.player.xFraction, CONFIG.player.maxX);
}

function playerHomeY() {
  return world.ceiling + (world.groundTop - world.ceiling) * 0.45;
}

// Current speed/gap for this score. On the menu we always use the starting values.
function currentDifficulty() {
  return getDifficulty(game.state === STATE.MENU ? 0 : game.score);
}

function currentSpeed() {
  return currentDifficulty().speed;
}

// Add points and play `soundName`, or the level-up tune if these points
// pushed us into a new difficulty level.
function addScore(points = 1, soundName = 'score') {
  game.score += points;

  const { level } = currentDifficulty();
  if (level > game.level) {
    game.level = level;
    game.levelUpTimer = CONFIG.difficulty.levelUpBannerTime;
    sound.play('levelUp'); // replaces the normal blip on level-up
  } else {
    sound.play(soundName);
  }
}

function collectCoin() {
  game.coins += 1;
  addScore(CONFIG.coins.value, 'coin');
}

// Fit the canvas to the window. The world is ~640 units tall on landscape
// screens; on narrow portrait phones we keep at least `minWidth` units wide
// (so the world gets taller instead of uncomfortably narrow).
function resize() {
  const cssW = window.innerWidth;
  const cssH = window.innerHeight;
  world.dpr = Math.min(window.devicePixelRatio || 1, 2); // cap at 2 for performance

  canvas.width = Math.round(cssW * world.dpr);
  canvas.height = Math.round(cssH * world.dpr);
  canvas.style.width = cssW + 'px';
  canvas.style.height = cssH + 'px';

  world.scale = Math.min(cssH / CONFIG.world.referenceHeight, cssW / CONFIG.world.minWidth);
  world.width = cssW / world.scale;
  world.height = cssH / world.scale;
  world.groundTop = world.height - CONFIG.world.groundHeight;

  if (player) {
    player.x = playerHomeX();
    if (game.state === STATE.MENU) player.y = playerHomeY();
  }
}

// --------------------------------------------------------- state changes

function startGame() {
  game.score = 0;
  game.isNewBest = false;
  game.coins = 0;
  game.level = 0;
  game.levelUpTimer = 0;
  obstacles.reset();
  coins.reset();
  player.reset(playerHomeX(), playerHomeY());
  setState(STATE.PLAYING);
  flap(); // first tap also flaps, so the start feels responsive
}

function endGame() {
  sound.play('hit');
  if (game.score > game.best) {
    game.best = game.score;
    game.isNewBest = true;
    saveNumber(CONFIG.storage.bestScoreKey, game.best);
  }
  setState(STATE.GAME_OVER);
}

function flap() {
  player.flap();
  sound.play('flap');
}

function togglePause() {
  if (game.state === STATE.PLAYING) setState(STATE.PAUSED);
  else if (game.state === STATE.PAUSED) setState(STATE.PLAYING);
}

// The single "action" input: Space, click or tap. What it does depends on state.
function primaryAction() {
  switch (game.state) {
    case STATE.MENU:
      startGame();
      break;
    case STATE.PLAYING:
      flap();
      break;
    case STATE.PAUSED:
      togglePause();
      break;
    case STATE.GAME_OVER:
      if (game.stateTime >= CONFIG.gameOver.restartDelay) startGame();
      break;
  }
}

// ---------------------------------------------------------------- update

function update(dt) {
  game.stateTime += dt;

  switch (game.state) {
    case STATE.MENU:
      background.update(dt, currentSpeed() * 0.5);
      player.idle(dt, playerHomeY());
      break;

    case STATE.PLAYING: {
      const { speed, gap } = currentDifficulty();
      background.update(dt, speed);
      player.update(dt);
      // New obstacles use the current gap; ones already on screen keep theirs.
      obstacles.update(dt, speed, gap, world, player.x, () => addScore(1));
      coins.update(dt, speed, player.hitbox, collectCoin);
      game.levelUpTimer = Math.max(0, game.levelUpTimer - dt);
      if (checkCollisions()) endGame();
      break;
    }

    case STATE.PAUSED:
      // Nothing moves. (dt is simply ignored.)
      break;

    case STATE.GAME_OVER:
      coins.update(dt, 0, null); // world is frozen, but "+5" popups finish fading
      // Let the player tumble down to the floor.
      if (player.y + player.hitbox.r < world.groundTop) {
        player.update(dt);
        player.y = Math.min(player.y, world.groundTop - player.hitbox.r);
      }
      break;
  }
}

// COLLISION: the player is a circle, everything else is a rectangle.
// Floor and ceiling are just horizontal lines, so we compare y values.
function checkCollisions() {
  const hb = player.hitbox;

  if (hb.y + hb.r >= world.groundTop) {
    player.y = world.groundTop - hb.r; // don't sink into the floor
    return true;
  }

  if (hb.y - hb.r <= world.ceiling) {
    if (CONFIG.world.ceilingKills) return true;
    player.y = world.ceiling + hb.r; // bonk: stop at the ceiling
    player.vy = 0;
  }

  return obstacles.collides(hb, world);
}

// ---------------------------------------------------------------- render

function render() {
  // Reset the transform, then scale so 1 unit in our drawing code = 1 world unit.
  const s = world.scale * world.dpr;
  ctx.setTransform(s, 0, 0, s, 0, 0);

  background.drawBack(ctx, world);
  obstacles.draw(ctx, world);
  coins.draw(ctx);
  background.drawFront(ctx, world);
  player.draw(ctx);

  if (CONFIG.debug.showHitboxes) {
    obstacles.drawHitboxes(ctx, world);
    coins.drawHitboxes(ctx);
    const hb = player.hitbox;
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(hb.x, hb.y, hb.r, 0, Math.PI * 2);
    ctx.stroke();
  }

  switch (game.state) {
    case STATE.MENU:
      UI.drawMenu(ctx, world, game.best, game.stateTime);
      break;
    case STATE.PLAYING:
      UI.drawHUD(ctx, world, game.score);
      UI.drawLevelUp(ctx, world, game.levelUpTimer);
      break;
    case STATE.PAUSED:
      UI.drawHUD(ctx, world, game.score);
      UI.drawPaused(ctx, world);
      break;
    case STATE.GAME_OVER:
      UI.drawGameOver(ctx, world, {
        score: game.score,
        best: game.best,
        coins: game.coins,
        isNewBest: game.isNewBest,
        canRestart: game.stateTime >= CONFIG.gameOver.restartDelay,
        time: game.stateTime,
      });
      break;
  }

  // Drawn last so it sits above every overlay, in every state.
  UI.drawMuteButton(ctx, world, sound.muted);
}

// ------------------------------------------------------------- the loop

function frame(now) {
  // `now` is a high-precision timestamp in milliseconds from rAF.
  // Clamp dt so that coming back from a background tab (dt = many seconds)
  // doesn't make everything jump forward at once.
  const dt = Math.min((now - lastTime) / 1000, CONFIG.world.maxDeltaTime);
  lastTime = now;

  update(dt);
  render();

  requestAnimationFrame(frame);
}

// ----------------------------------------------------------------- input

function setupInput() {
  window.addEventListener('keydown', (e) => {
    sound.unlock(); // browsers only allow audio after a user gesture
    switch (e.code) {
      case 'Space':
      case 'ArrowUp':
      case 'KeyW':
      case 'Enter':
        e.preventDefault(); // stop Space from scrolling the page
        if (!e.repeat) primaryAction(); // holding the key shouldn't machine-gun flaps
        break;
      case 'KeyP':
      case 'Escape':
        togglePause();
        break;
      case 'KeyM':
        sound.toggleMute();
        break;
    }
  });

  // pointerdown covers mouse, touch and pen with a single event,
  // and fires immediately (no 300ms "click" delay on mobile).
  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    sound.unlock();
    const rect = canvas.getBoundingClientRect();
    const wx = (e.clientX - rect.left) / world.scale;
    const wy = (e.clientY - rect.top) / world.scale;

    if (UI.hitMuteButton(world, wx, wy)) {
      sound.toggleMute();
      return;
    }

    const inGame = game.state === STATE.PLAYING || game.state === STATE.PAUSED;
    if (inGame && UI.hitPauseButton(world, wx, wy)) {
      togglePause();
    } else {
      primaryAction();
    }
  });

  // Auto-pause if the player switches tab or apps.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && game.state === STATE.PLAYING) setState(STATE.PAUSED);
  });

  window.addEventListener('resize', resize);
}

// ------------------------------------------------------------------ boot

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function init() {
  window.__gameStarted = true; // tells index.html the module loaded fine

  resize();
  UI.drawLoading(ctx, world);

  // Load any PNGs named in config.js, and give the title font up to 1.5s.
  const fontLoad = document.fonts
    ? document.fonts.load(`800 40px ${CONFIG.fonts.title}`).catch(() => {})
    : Promise.resolve();
  const [images] = await Promise.all([
    loadSprites(CONFIG.assets.sprites),
    Promise.race([fontLoad, wait(1500)]),
  ]);

  player = new Player(images.player);
  obstacles = new ObstacleManager(images);
  coins = new CoinManager(images);
  obstacles.onSpawn = (ob, previous) => coins.spawnBetween(previous, ob, world);
  background = new Background(images);
  sound = new SoundManager();

  player.reset(playerHomeX(), playerHomeY());
  setupInput();

  requestAnimationFrame((t) => {
    lastTime = t;
    requestAnimationFrame(frame);
  });
}

init();
