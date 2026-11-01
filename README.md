# Demon Slayer: Infinity Flappy Castle

A fan-made flappy-style game in plain HTML5 Canvas + JavaScript (ES modules, no build step).
All art is drawn in code; nothing is copied from other games.

**Play online:** https://bryanttteo.github.io/infinity-flappy-castle/

## Run it

Browsers block ES modules on `file://` pages, so serve the folder with any tiny local server
and open the address it prints. Pick whichever you have:

```bash
npx serve                      # needs Node.js
python3 -m http.server 8000    # needs Python 3 (comes with Apple's Command Line Tools)
ruby -run -e httpd . -p 8000   # works on a stock Mac
```

## Controls

| Action  | Desktop                 | Mobile            |
|---------|-------------------------|-------------------|
| Flap    | Space / ↑ / W / click   | tap               |
| Pause   | P / Esc                 | ❚❚ button         |
| Outfit  | ← → / A D on the menu   | tap the arrows    |
| Menu    | Esc on game over        | Menu button       |
| Records | L on the menu           | Records button    |
| Initials| type letters, ↑↓ ←→, Enter | tap ▲ ▼, OK   |
| Mute    | M                       | 🔊 button         |

## Customise

Everything tunable is in `src/config.js`. To use your own images or sounds, see `assets/README.md`.

## Files

| File | What it does |
|------|--------------|
| `src/config.js`     | all numbers, colours, text and asset paths |
| `src/game.js`       | entry point, game loop, state machine, input |
| `src/player.js`     | Kanao's physics, tilt, hitbox and drawing |
| `src/skins.js`      | outfits unlocked by best score |
| `src/leaderboard.js` | Castle Records: local top 10 with initials |
| `src/obstacles.js`  | castle blocks and the Shifting Chamber boss: spawning, scoring, collision |
| `src/difficulty.js` | score → speed and gap (difficulty curve) |
| `src/coins.js`      | collectible coins and "+5" popups |
| `src/powerups.js`   | shield, slow motion and magnet power-ups |
| `src/particles.js`  | crash butterflies, splinters, petals, sparkles |
| `src/background.js` | parallax castle interior, floor and ceiling, dawn light |
| `src/ui.js`         | menu, score, pause and game-over screens |
| `src/audio.js`      | Web Audio beeps, optional sound files, mute |
| `src/assets.js`     | optional PNG loading with fallback |
| `src/storage.js`    | safe localStorage helpers (best score, settings) |
| `src/color.js`      | colour blending (night → dawn) |
