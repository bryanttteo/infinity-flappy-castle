// ============================================================================
//  storage.js — tiny wrappers around localStorage.
//
//  localStorage can throw (private browsing, storage disabled, quota full),
//  so every call is wrapped in try/catch. If it fails, the game still works;
//  it just won't remember your best score.
// ============================================================================

export function loadNumber(key, fallback = 0) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    const n = Number(raw);
    return Number.isFinite(n) ? n : fallback;
  } catch {
    return fallback;
  }
}

export function loadString(key, fallback = '') {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : raw;
  } catch {
    return fallback;
  }
}

export function saveString(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage unavailable — ignore.
  }
}

export function saveNumber(key, value) {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // Storage unavailable — ignore.
  }
}
