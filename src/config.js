// ============================================================================
//  config.js — EVERY tunable value lives here.
//
//  Units:
//   - Distances are in "world units". The game world is always about
//     640 units tall, and the canvas is scaled to fit your screen, so
//     these numbers feel the same on a phone and on a 4K monitor.
//   - Speeds are in world units PER SECOND (not per frame). That's what
//     makes the game run at the same speed on 60Hz and 144Hz screens.
//   - Times are in seconds.
// ============================================================================

export const CONFIG = {
  // ---------------------------------------------------------------- Text
  text: {
    titleTop: 'Demon Slayer:',
    titleMain: 'Infinity Flappy Castle',
    characterName: 'Kanao Tsuyuri',
    starring: 'starring',
    startHint: 'Tap · Click · Space to flap',
    controlsHint: 'P / Esc pause',
    paused: 'Paused',
    resumeHint: 'Tap or press P to resume',
    gameOver: 'Fallen in the Castle',
    newBest: 'New best!',
    retryHint: 'Tap or Space to try again',
    scoreLabel: 'Score',
    bestLabel: 'Best',
    loading: 'Entering the Castle…',
    levelUp: 'The Castle shifts…', // shown briefly when difficulty goes up
  },

  fonts: {
    // Shippori Mincho is loaded from Google Fonts in index.html.
    // If it can't load (offline), the browser falls back to the next font.
    title: '"Shippori Mincho B1", "Hiragino Mincho ProN", "Yu Mincho", Georgia, serif',
    ui: '"Shippori Mincho B1", "Hiragino Mincho ProN", "Yu Mincho", Georgia, serif',
  },

  // --------------------------------------------------------------- World
  world: {
    referenceHeight: 640, // world height on landscape screens
    minWidth: 420,        // narrow (portrait) screens get at least this much width
    ceilingHeight: 26,    // thickness of the ceiling beam at the top
    groundHeight: 70,     // thickness of the floor at the bottom
    ceilingKills: true,   // false = bump your head instead of dying
    maxDeltaTime: 1 / 30, // cap per-frame time so a lag spike can't teleport you through a wall
  },

  // ------------------------------------------------------------- Physics
  physics: {
    gravity: 1700,      // downward acceleration (units/s²). Higher = heavier.
    flapImpulse: -500,  // upward velocity set on each flap (negative = up)
    maxFallSpeed: 720,  // terminal velocity
  },

  // -------------------------------------------------------------- Player
  player: {
    xFraction: 0.3,     // horizontal position as a fraction of screen width…
    maxX: 320,          // …but never further right than this
    size: 46,           // drawn size (sprite width)
    hitboxRadius: 15,   // collision circle — smaller than the drawing to feel fair
    tiltPerSpeed: 0.0018, // radians of tilt per unit of vertical speed
    maxTiltUp: -0.5,    // radians (nose up)
    maxTiltDown: 1.3,   // radians (nose down, ~75°)
    tiltSmoothing: 10,  // how quickly the tilt catches up (higher = snappier)
    menuBobAmplitude: 10, // gentle float on the menu screen
    menuBobSpeed: 3,
  },

  // ----------------------------------------------------------- Obstacles
  obstacles: {
    width: 84,          // width of each castle block
    gap: 190,           // vertical opening to fly through
    speed: 190,         // scroll speed (units/s)
    spacing: 290,       // horizontal distance between obstacles
    firstOffset: 160,   // extra distance before the first obstacle appears
    edgeMargin: 60,     // gap never gets closer than this to ceiling/floor
    maxGapShift: 210,   // max change in gap height between neighbours (keeps it fair)
    roomHeight: 74,     // height of each stacked "room" in a block
    eaveHeight: 18,     // roof cap at the gap edge
    eaveOverhang: 10,   // how far the roof sticks out sideways (visual only)
  },

  // ---------------------------------------------------------- Difficulty
  // Starts at obstacles.speed / obstacles.gap, then every `pointsPerLevel`
  // points the Castle speeds up and the gaps narrow. See difficulty.js.
  difficulty: {
    pointsPerLevel: 10,           // a new level every 10 points
    speedMultiplierPerLevel: 1.05, // +5% speed per level (compounding)
    maxSpeedMultiplier: 1.8,      // never faster than 1.8× the starting speed
    gapShrinkPerLevel: 8,         // gap gets this much smaller per level…
    minGap: 140,                  // …but never smaller than this
    levelUpBannerTime: 1.4,       // seconds the "level up" message shows (0 = off)
  },

  gameOver: {
    restartDelay: 0.6,  // seconds before a tap restarts (stops accidental restarts)
  },

  // ------------------------------------------------------------- Colours
  colors: {
    skyTop: '#0d0a1a',
    skyBottom: '#2a0f1e',
    farRoom: '#1b1328',
    farWindow: 'rgba(245, 166, 35, 0.16)',
    pillar: '#8b1e2d',
    pillarShade: '#5c1220',
    lantern: '#f5a623',
    lanternCap: '#3d2414',
    lanternGlow: 'rgba(245, 166, 35, 0.22)',
    wood: '#6b4226',
    woodDark: '#3d2414',
    woodLight: '#8a5a36',
    shoji: '#f2e6c9',
    shojiGlow: 'rgba(255, 196, 120, 0.35)',
    shojiLattice: '#3d2414',
    roofTile: '#2b2236',
    roofRidge: '#45394f',
    roofEdge: '#c0392b',
    roofOrnament: '#f5a623',
    ceiling: '#1a0d14',
    floor: '#4a2c1a',
    floorLine: '#2e1a0f',
    tatami: '#7d7a4a',

    hudText: '#f2e6c9',
    hudOutline: '#1a0d14',
    accent: '#e9a6c9',
    danger: '#c0392b',
    panel: 'rgba(13, 10, 26, 0.85)',
    panelBorder: '#c0392b',
    overlay: 'rgba(13, 10, 26, 0.55)',

    kanao: {
      hair: '#1d1424',
      skin: '#f7dccb',
      eye: '#9b6fc9',
      blush: 'rgba(240, 140, 170, 0.5)',
      uniform: '#1f1d33',
      belt: '#e8e2d6',
      capeTop: '#ffffff',
      capeBottom: '#e9a6c9',
      sword: '#2a2238',
      swordGuard: '#d98ac0',
      butterfly: '#d98ac0',
      butterflyEdge: '#7e4fa8',
    },
  },

  // -------------------------------------------------------------- Assets
  // Leave a value as null to use the built-in canvas drawing.
  // Put a path (e.g. 'assets/kanao.png') to use your own image instead.
  // If the file fails to load, the game quietly falls back to the drawing.
  assets: {
    sprites: {
      player: null,          // drawn facing right, centred
      obstacleBody: null,    // tiled vertically inside each block
      obstacleCap: null,     // roof at the gap edge (flipped for top blocks)
      backgroundFar: null,   // tiled horizontally, slow parallax
      backgroundMid: null,   // tiled horizontally, medium parallax
    },
    sounds: {
      // used from step 3 onwards
      flap: null,
      score: null,
      hit: null,
    },
  },

  storage: {
    bestScoreKey: 'infinityFlappyCastle.bestScore',
  },

  debug: {
    showHitboxes: false, // true = draw collision shapes (handy when tuning)
  },
};
