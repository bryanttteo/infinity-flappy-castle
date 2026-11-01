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
    controlsHint: '← → outfit · P / Esc pause · M mute',
    paused: 'Paused',
    resumeHint: 'Tap or press P to resume',
    gameOver: 'Fallen in the Castle',
    newBest: 'New best!',
    retryHint: 'Tap or Space to try again',
    scoreLabel: 'Score',
    bestLabel: 'Best',
    loading: 'Entering the Castle…',
    levelUp: 'The Castle shifts…', // shown briefly when difficulty goes up
    dawn: 'Dawn breaks over the Castle',
    bossWarning: 'A Shifting Chamber approaches!',
    skinLocked: 'Best {score} to unlock',   // {score} = unlockScore
    skinUnlocked: 'New outfit: {name}!',     // shown on game over
    skinCounter: '{n} / {total}',
    menuButton: 'Menu (Esc)',
    lbButton: 'Records (L)',
    lbTitle: 'Castle Records',
    lbEmpty: 'No records yet. Be the first!',
    lbBack: 'Tap or Esc to return',
    lbHeaders: ['#', 'Name', 'Score', 'Coins'],
    enterInitials: 'Top 10! Enter your initials',
    entryHint: 'Type, or tap ▲▼ · Enter to save · Esc to skip',
    saveButton: 'OK',
    savedRank: '#{rank} in the Castle Records!',
    coinPopup: '+{value}',         // {value} is replaced with coins.value
    coinsLabel: 'Coins',
    powerupNames: {
      shield: 'Wisteria Ward',
      slow: 'Focused Breath',
      magnet: 'Golden Lure',
    },
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

  // --------------------------------------------------------------- Coins
  // Gold coins appear between obstacles, roughly on the flight path.
  coins: {
    enabled: true,
    value: 5,           // points per coin
    spawnChance: 0.6,   // 0–1: chance a coin appears between two obstacles
    radius: 11,         // drawn size
    hitboxRadius: 16,   // pickup circle — BIGGER than the coin, so grabbing feels generous
    yJitter: 45,        // random up/down offset from the middle of the flight path
    spinSpeed: 4,       // how fast the coin turns
    bobAmplitude: 4,    // gentle float up and down
    popupTime: 0.8,     // seconds the "+5" text floats
    popupRise: 40,      // how far it floats up
  },

  // ----------------------------------------------------------- Power-ups
  // Glowing orbs that sometimes appear between obstacles instead of a coin.
  powerups: {
    enabled: true,
    spawnChance: 0.15,  // 0–1: chance per obstacle gap
    minScore: 3,        // none appear before this score
    radius: 15,         // drawn size of the orb
    hitboxRadius: 20,   // pickup circle (generous)
    bobAmplitude: 5,
    // Relative chance of each type (higher = more common, 0 = never).
    weights: { shield: 1, slow: 1, magnet: 1 },

    shield: {
      invulnerableTime: 1.0,   // seconds of blinking safety after the shield breaks
      protectsFromGround: true, // shield also saves you from floor/ceiling (bounces you)
      bounceSpeed: -480,       // upward speed when bounced off the floor
    },
    slow: {
      duration: 5,      // seconds (real time)
      timeScale: 0.55,  // 0.55 = the world runs at 55% speed
      easeSpeed: 4,     // how quickly time slows down / speeds back up
      affectsPlayer: false, // true = Kanao's gravity and flaps slow down too ("bullet time");
                            // false = only the world slows, so your flap rhythm stays the same
    },
    magnet: {
      duration: 8,      // seconds (real time)
      radius: 190,      // coins inside this distance get pulled in
      pullSpeed: 560,   // how fast they fly to you (units/s)
    },
  },

  // ----------------------------------------------------- Juice / effects
  // Purely visual. Turn any of these off if you prefer a calmer game.
  particles: {
    enabled: true,
    crash: { butterflies: 14, splinters: 18 }, // burst when you crash
    shieldBreak: { petals: 16 },               // wisteria petals when the shield breaks
    coinSparkles: 8,                           // gold stars per coin
    butterflyColors: ['#e9a6c9', '#d98ac0', '#b48ae0', '#fff8ec'],
    gravity: 900,       // pull on splinters (petals use a fraction of it)
    maxParticles: 300,  // safety cap
  },

  screenShake: {
    enabled: true,      // false = no shaking (some players find it uncomfortable)
    crash: { intensity: 9, duration: 0.4 },       // intensity = max offset in world units
    shieldBreak: { intensity: 5, duration: 0.25 },
  },

  flash: {
    enabled: true,
    color: '#fff3e0',
    crashAlpha: 0.45,   // brightness of the white flash on crash (0–1)
    duration: 0.18,     // seconds
  },

  // --------------------------------------------------------- Leaderboard
  // "Castle Records": a local top list saved in this browser (no server).
  leaderboard: {
    enabled: true,
    maxEntries: 10,
    initialsLength: 3,
    allowedChars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', // order used by ▲/▼
  },

  // --------------------------------------------------------------- Skins
  // Outfits for Kanao, unlocked by your BEST score. Pick one on the menu.
  //   colors: any of the colors.kanao keys to change (the rest stay default)
  //   sprite: optional PNG for this outfit, e.g. 'assets/kanao-crimson.png'.
  //           If null, the game uses assets.sprites.player (if set), or
  //           else draws Kanao with this outfit's colours.
  skins: {
    enabled: true,
    list: [
      {
        id: 'butterfly',
        name: 'Butterfly Estate',
        unlockScore: 0,
        colors: {},
        sprite: null,
      },
      {
        id: 'crimson',
        name: 'Crimson Haori',
        unlockScore: 25,
        colors: {
          capeTop: '#f4d0c8', capeBottom: '#c0392b',
          butterfly: '#e05a47', butterflyEdge: '#7a1424',
          swordGuard: '#e05a47', eye: '#b0473f',
        },
        sprite: null,
      },
      {
        id: 'moonlit',
        name: 'Moonlit Wisteria',
        unlockScore: 50,
        colors: {
          capeTop: '#e8e4ff', capeBottom: '#8e6bbf',
          butterfly: '#b48ae0', butterflyEdge: '#4b3a7a',
          uniform: '#1b2340', belt: '#c9cde8', hair: '#141a2e', eye: '#7f8fd9',
        },
        sprite: null,
      },
      {
        id: 'dawn',
        name: 'Dawn Blossom',
        unlockScore: 100,
        colors: {
          capeTop: '#fff4d6', capeBottom: '#f2a65a',
          butterfly: '#f5c542', butterflyEdge: '#a8741a',
          swordGuard: '#f5c542', belt: '#f5e1b0', eye: '#c98a2e',
        },
        sprite: null,
      },
      {
        id: 'mist',
        name: 'Spirit Mist',
        unlockScore: 150,
        colors: {
          hair: '#e8e4ee', skin: '#f3e6e0', eye: '#e05a6a',
          capeTop: '#ffffff', capeBottom: '#bfc8d6', uniform: '#3a3f4f',
          butterfly: '#dfe7f2', butterflyEdge: '#8c97ab',
        },
        sprite: null,
      },
    ],
  },

  // ---------------------------------------------------------------- Boss
  // The Shifting Chamber: every `every` points, a wide ornate block appears
  // whose gap slides up and down while it passes.
  boss: {
    enabled: true,
    every: 50,          // a boss after every 50 points (50, 100, 150…)
    width: 150,         // much wider than a normal block
    gapBonus: 30,       // its gap is this much bigger than the current normal gap (moving = harder)
    amplitude: 70,      // how far the gap slides up/down from its centre
    moveSpeed: 1.6,     // how fast it slides (radians per second; 1.6 ≈ one cycle every 4s)
    extraSpace: 90,     // extra room before and after it
    points: 5,          // score for clearing it (instead of 1)
    bannerTime: 2.2,    // seconds the warning shows
  },

  // ---------------------------------------------------------------- Dawn
  // The Castle has no daytime… until you survive long enough. At startScore,
  // sunlight breaks in: colours blend to colors.dawn and light shafts appear.
  // Purely visual; difficulty is unchanged.
  dawn: {
    enabled: true,
    startScore: 30,
    transitionTime: 4,   // seconds to blend from night to dawn
    bannerTime: 2.6,     // seconds the "Dawn breaks…" message shows
    rays: 5,             // number of light shafts
    motes: 24,           // floating dust specks in the light
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

  // --------------------------------------------------------------- Audio
  // Each sound is a list of tones played together (use `delay` to make
  // a little melody). See playTone() in audio.js for what each field does.
  audio: {
    masterVolume: 0.5, // 0–1
    startMuted: false, // first-time default; after that, the player's choice is remembered
    sounds: {
      // Quick rising "swish" plus a puff of air.
      flap: [
        { wave: 'triangle', from: 420, to: 760, duration: 0.09, volume: 0.22 },
        { wave: 'noise', from: 2600, to: 600, duration: 0.08, volume: 0.06 },
      ],
      // Two plucked notes, like a koto.
      score: [
        { wave: 'triangle', from: 1175, duration: 0.09, volume: 0.2 },
        { wave: 'triangle', from: 1568, duration: 0.16, delay: 0.07, volume: 0.2 },
      ],
      // Low thud sliding down, plus a crunch of splintering wood.
      hit: [
        { wave: 'sawtooth', from: 220, to: 50, duration: 0.35, volume: 0.28 },
        { wave: 'noise', from: 1800, to: 200, duration: 0.3, volume: 0.35 },
      ],
      // Bright, quick sparkle.
      coin: [
        { wave: 'square', from: 1568, duration: 0.05, volume: 0.1 },
        { wave: 'square', from: 2349, duration: 0.14, delay: 0.05, volume: 0.1 },
      ],
      // Soft click when changing outfit on the menu.
      skinSwitch: [
        { wave: 'triangle', from: 880, to: 1100, duration: 0.06, volume: 0.12 },
      ],
      // Quick rising arpeggio.
      powerup: [
        { wave: 'triangle', from: 784, duration: 0.08, volume: 0.18 },
        { wave: 'triangle', from: 988, duration: 0.08, delay: 0.06, volume: 0.18 },
        { wave: 'triangle', from: 1175, duration: 0.08, delay: 0.12, volume: 0.18 },
        { wave: 'triangle', from: 1568, duration: 0.2, delay: 0.18, volume: 0.18 },
      ],
      // Glassy shatter.
      shieldBreak: [
        { wave: 'noise', from: 6000, to: 800, duration: 0.25, volume: 0.3 },
        { wave: 'triangle', from: 1400, to: 300, duration: 0.22, volume: 0.2 },
      ],
      // Low taiko-like rumble as the boss approaches.
      bossWarning: [
        { wave: 'sine', from: 110, to: 70, duration: 0.35, volume: 0.35 },
        { wave: 'noise', from: 400, to: 100, duration: 0.3, volume: 0.25 },
        { wave: 'sine', from: 110, to: 70, duration: 0.35, delay: 0.3, volume: 0.35 },
        { wave: 'sine', from: 98, to: 55, duration: 0.6, delay: 0.6, volume: 0.4 },
      ],
      // Triumphant flourish for clearing the boss.
      bossClear: [
        { wave: 'square', from: 659, duration: 0.1, volume: 0.12 },
        { wave: 'square', from: 784, duration: 0.1, delay: 0.09, volume: 0.12 },
        { wave: 'square', from: 988, duration: 0.1, delay: 0.18, volume: 0.12 },
        { wave: 'triangle', from: 1319, duration: 0.45, delay: 0.27, volume: 0.18 },
      ],
      // Soft, swelling major chord.
      dawn: [
        { wave: 'sine', from: 587, duration: 1.3, volume: 0.13 },
        { wave: 'sine', from: 740, duration: 1.2, delay: 0.15, volume: 0.12 },
        { wave: 'sine', from: 880, duration: 1.1, delay: 0.3, volume: 0.12 },
        { wave: 'triangle', from: 1175, duration: 1.0, delay: 0.45, volume: 0.07 },
      ],
      // Rising phrase on a Japanese "in" scale (D, Eb, G, A, Bb).
      levelUp: [
        { wave: 'triangle', from: 587, duration: 0.14, delay: 0.0, volume: 0.18 },
        { wave: 'triangle', from: 622, duration: 0.14, delay: 0.09, volume: 0.18 },
        { wave: 'triangle', from: 784, duration: 0.14, delay: 0.18, volume: 0.18 },
        { wave: 'triangle', from: 880, duration: 0.14, delay: 0.27, volume: 0.18 },
        { wave: 'triangle', from: 932, duration: 0.3, delay: 0.36, volume: 0.18 },
      ],
    },
  },

  gameOver: {
    restartDelay: 0.6,  // seconds before a tap restarts (stops accidental restarts)
    panelDelay: 0.4,    // seconds before the game-over panel appears (lets the crash play out)
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

    coin: '#f5c542',
    coinEdge: '#a8741a',
    coinHole: '#3d2414',
    coinShine: 'rgba(255, 255, 255, 0.7)',
    coinGlow: 'rgba(245, 197, 66, 0.28)',

    // Dawn palette: any background colour listed here blends toward this
    // value once dawn begins. Colours not listed stay the same.
    dawn: {
      skyTop: '#3d2c5e',
      skyBottom: '#f2a65a',
      farRoom: '#6a4560',
      farWindow: 'rgba(255, 214, 150, 0.35)',
      pillar: '#a3333f',
      pillarShade: '#73303a',
      lanternGlow: 'rgba(245, 166, 35, 0.06)',
      ceiling: '#3a2030',
      floor: '#6b4226',
      tatami: '#9c9858',
    },
    boss: {
      lacquer: '#7a1424',  // deep red body
      trim: '#d4a03a',     // gold trim and eave edges
      glow: 'rgba(192, 57, 43, 0.45)', // pulsing aura around the gap edges
      lantern: '#ff6b4a',
    },

    sunRay: 'rgba(255, 222, 160, 0.22)',
    sunMote: 'rgba(255, 236, 200, 0.8)',
    dawnWarmth: 'rgba(255, 170, 90, 0.08)', // light warm wash over everything

    powerups: {
      shield: '#b48ae0',  // wisteria purple
      slow: '#6fc3df',    // calm water blue
      magnet: '#e0504a',  // lacquer red
      leaf: '#6b9a5a',
      icon: '#fff8ec',
      slowTint: 'rgba(60, 80, 170, 0.22)', // screen tint during slow motion
    },

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
      coin: null,            // square image; spun by squashing it horizontally
      powerupShield: null,   // square images drawn inside the glowing orb
      powerupSlow: null,
      powerupMagnet: null,
    },
    // Sound files (mp3 / ogg / wav). null = use the beep recipe in `audio.sounds`.
    sounds: {
      flap: null,
      score: null,
      hit: null,
      levelUp: null,
      coin: null,
      powerup: null,
      shieldBreak: null,
      dawn: null,
      bossWarning: null,
      bossClear: null,
      skinSwitch: null,
    },
  },

  storage: {
    bestScoreKey: 'infinityFlappyCastle.bestScore',
    mutedKey: 'infinityFlappyCastle.muted',
    skinKey: 'infinityFlappyCastle.skin',
    leaderboardKey: 'infinityFlappyCastle.records',
    initialsKey: 'infinityFlappyCastle.initials', // pre-fills the last initials you used
  },

  debug: {
    showHitboxes: false, // true = draw collision shapes (handy when tuning)
  },
};
