// ============================================================================
//  color.js — blend between two colours.
//
//  COLOUR INTERPOLATION ("lerp")
//  A colour is just four numbers: red, green, blue (0–255) and alpha (0–1).
//  To blend colour A toward colour B by t (0 = all A, 1 = all B), blend each
//  number separately:   value = a + (b - a) × t
//  Animate t from 0 to 1 over a few seconds and the whole scene fades from
//  night to dawn smoothly.
// ============================================================================

const cache = new Map(); // parsing strings every frame is wasteful, so remember results

// '#rgb', '#rrggbb', 'rgb(...)' or 'rgba(...)' → [r, g, b, a]
export function parseColor(str) {
  if (cache.has(str)) return cache.get(str);
  let rgba = [0, 0, 0, 1];

  if (str[0] === '#') {
    let hex = str.slice(1);
    if (hex.length === 3) hex = hex.split('').map((ch) => ch + ch).join('');
    const n = parseInt(hex, 16);
    rgba = [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1];
  } else {
    const parts = str.slice(str.indexOf('(') + 1, str.indexOf(')')).split(',').map(Number);
    rgba = [parts[0], parts[1], parts[2], parts.length > 3 ? parts[3] : 1];
  }

  cache.set(str, rgba);
  return rgba;
}

export function mixColor(a, b, t) {
  if (t <= 0) return a;
  if (t >= 1) return b;
  const A = parseColor(a);
  const B = parseColor(b);
  const r = Math.round(A[0] + (B[0] - A[0]) * t);
  const g = Math.round(A[1] + (B[1] - A[1]) * t);
  const bl = Math.round(A[2] + (B[2] - A[2]) * t);
  const al = A[3] + (B[3] - A[3]) * t;
  return `rgba(${r}, ${g}, ${bl}, ${al.toFixed(3)})`;
}
