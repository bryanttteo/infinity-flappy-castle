// ============================================================================
//  assets.js — loads optional image files listed in config.js.
//
//  Every loader resolves to `null` instead of failing, so a missing or broken
//  file never crashes the game: the drawing code sees null and falls back to
//  the built-in canvas art.
// ============================================================================

export function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      console.warn(`[assets] Could not load "${src}" — using built-in drawing instead.`);
      resolve(null);
    };
    img.src = src;
  });
}

// Takes { name: path|null, ... } and returns { name: Image|null, ... }.
export async function loadSprites(map) {
  const names = Object.keys(map);
  const images = await Promise.all(names.map((name) => loadImage(map[name])));
  const result = {};
  names.forEach((name, i) => (result[name] = images[i]));
  return result;
}
