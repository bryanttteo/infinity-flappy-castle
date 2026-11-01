// ============================================================================
//  difficulty.js — turns the current score into speed and gap size.
//
//  DIFFICULTY CURVE
//  The score is split into "levels": with pointsPerLevel = 10, scores 0–9 are
//  level 0, 10–19 level 1, and so on. Each level:
//    - multiplies speed by speedMultiplierPerLevel (1.05 = +5%), compounding,
//      so level 3 is 1.05 × 1.05 × 1.05 ≈ 1.16× the starting speed
//    - shrinks the gap by gapShrinkPerLevel, but never below minGap
//  Both have a ceiling (maxSpeedMultiplier / minGap) so the game stays
//  possible however long you survive.
//
//  This is a "pure function": same score in → same numbers out, and it
//  changes nothing else. That makes it easy to test and to tweak.
// ============================================================================

import { CONFIG } from './config.js';

export function getDifficulty(score) {
  const d = CONFIG.difficulty;
  const o = CONFIG.obstacles;

  const level = Math.floor(score / d.pointsPerLevel);
  const speedMultiplier = Math.min(d.speedMultiplierPerLevel ** level, d.maxSpeedMultiplier);
  const gap = Math.max(d.minGap, o.gap - level * d.gapShrinkPerLevel);

  return {
    level,
    speed: o.speed * speedMultiplier,
    speedMultiplier,
    gap,
  };
}
