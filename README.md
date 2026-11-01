# Demon Slayer: Infinity Flappy Castle

A fan-made flappy-style game in plain HTML5 Canvas + JavaScript (ES modules, no build step).
All art is drawn in code; nothing is copied from other games.

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
| Mute    | M (from step 3)         |                   |

## Customise

Everything tunable is in `src/config.js`. To use your own images or sounds, see `assets/README.md`.

## Files

| File | What it does |
|------|--------------|
| `src/config.js`     | all numbers, colours, text and asset paths |
| `src/game.js`       | entry point, game loop, state machine, input |
| `src/player.js`     | Kanao's physics, tilt, hitbox and drawing |
| `src/obstacles.js`  | castle blocks: spawning, scoring, collision |
| `src/background.js` | parallax castle interior, floor and ceiling |
| `src/ui.js`         | menu, score, pause and game-over screens |
| `src/audio.js`      | sound effects (step 3) |
| `src/assets.js`     | optional PNG loading with fallback |
| `src/storage.js`    | safe localStorage helpers (best score) |
