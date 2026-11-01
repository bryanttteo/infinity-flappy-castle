// ============================================================================
//  skins.js — Kanao's outfits, unlocked by best score.
//
//  An outfit is just a set of colour overrides on top of colors.kanao (and an
//  optional sprite). "Unlocked" is not stored anywhere: it's worked out from
//  the best score each time, so it can never get out of sync. The only thing
//  saved is which outfit you picked.
// ============================================================================

import { CONFIG } from './config.js';
import { loadString, saveString } from './storage.js';

export function skinList() {
  return CONFIG.skins.enabled ? CONFIG.skins.list : CONFIG.skins.list.slice(0, 1);
}

export function isUnlocked(skin, best) {
  return best >= skin.unlockScore;
}

// Full colour set for an outfit: the defaults, with the outfit's changes on top.
// ({...a, ...b} copies a, then b; keys in b replace the same keys from a.)
export function paletteFor(skin) {
  return { ...CONFIG.colors.kanao, ...(skin.colors || {}) };
}

// Index of the saved outfit, or the first one if it's missing or now locked.
export function loadSelectedIndex(best) {
  const id = loadString(CONFIG.storage.skinKey, '');
  const i = skinList().findIndex((s) => s.id === id);
  return i >= 0 && isUnlocked(skinList()[i], best) ? i : 0;
}

export function saveSelected(skin) {
  saveString(CONFIG.storage.skinKey, skin.id);
}

// Outfits whose unlock score lies in (oldBest, newBest].
export function newlyUnlocked(oldBest, newBest) {
  return skinList().filter((s) => s.unlockScore > oldBest && s.unlockScore <= newBest);
}

// { 'skin:crimson': 'assets/…png', … } for outfits that name a sprite, so
// they can be loaded with the other images.
export function skinSpritePaths() {
  const map = {};
  for (const s of skinList()) if (s.sprite) map[`skin:${s.id}`] = s.sprite;
  return map;
}
