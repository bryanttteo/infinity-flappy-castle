// ============================================================================
//  leaderboard.js — "Castle Records": a local top-10 saved in localStorage.
//
//  SAVING STRUCTURED DATA
//  localStorage only stores strings. JSON.stringify turns our list of
//  records into a string to save; JSON.parse turns it back into objects.
//  Anything read back could be missing, corrupted or edited by hand, so
//  load() checks every field and quietly drops bad entries instead of
//  crashing the game.
// ============================================================================

import { CONFIG } from './config.js';
import { loadString, saveString } from './storage.js';

const L = () => CONFIG.leaderboard;

// Highest score first; on a tie, whoever got there first ranks higher.
function compare(a, b) {
  return b.score - a.score || a.date - b.date;
}

// Returns a clean, sorted list of { name, score, coins, skin, date }.
export function load() {
  try {
    const data = JSON.parse(loadString(CONFIG.storage.leaderboardKey, '[]'));
    if (!Array.isArray(data)) return [];
    return data
      .filter((e) => e && typeof e.name === 'string' && Number.isFinite(e.score))
      .map((e) => ({
        name: e.name.slice(0, L().initialsLength).toUpperCase(),
        score: Math.floor(e.score),
        coins: Number.isFinite(e.coins) ? e.coins : 0,
        skin: typeof e.skin === 'string' ? e.skin : '',
        date: Number.isFinite(e.date) ? e.date : 0,
      }))
      .sort(compare)
      .slice(0, L().maxEntries);
  } catch {
    return []; // unreadable data: start fresh rather than crash
  }
}

// Would this score make the list?
export function qualifies(score) {
  if (!L().enabled || score <= 0) return false;
  const list = load();
  return list.length < L().maxEntries || score > list[list.length - 1].score;
}

// Insert a record, save, and return its rank (1 = top), or 0 if it didn't fit.
export function add(entry) {
  const list = load();
  list.push(entry);
  list.sort(compare);
  const kept = list.slice(0, L().maxEntries);
  saveString(CONFIG.storage.leaderboardKey, JSON.stringify(kept));
  return kept.indexOf(entry) + 1;
}

// Last initials used (so returning players don't retype them).
export function lastInitials() {
  const n = L().initialsLength;
  const saved = loadString(CONFIG.storage.initialsKey, '').toUpperCase();
  const chars = L().allowedChars;
  const clean = [...saved].filter((ch) => chars.includes(ch)).slice(0, n);
  while (clean.length < n) clean.push(chars[0]);
  return clean;
}

export function rememberInitials(letters) {
  saveString(CONFIG.storage.initialsKey, letters.join(''));
}
