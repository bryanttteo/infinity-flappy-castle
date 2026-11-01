# assets/

Everything is drawn with canvas code for now. To use your own files:

1. Drop a PNG (or MP3/OGG/WAV for sounds, from step 3) in this folder.
2. Open `src/config.js` and set the matching path under `assets`, for example:

   ```js
   sprites: { player: 'assets/kanao.png', ... }
   ```

3. Reload. If a file is missing or broken, the game logs a warning and
   uses the built-in drawing instead.

Tips
- `player`: facing right, roughly square, transparent background. It is drawn
  `player.size` units wide.
- `obstacleBody`: a tile that repeats vertically inside each block (84 units wide by default).
- `obstacleCap`: the roof at the gap edge. It is flipped automatically for top blocks.
- `backgroundFar` / `backgroundMid`: wide images that repeat horizontally and are
  scaled to the screen height. Use transparency on the mid layer.
