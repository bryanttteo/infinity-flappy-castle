// ============================================================================
//  audio.js — sound effects.
//
//  Placeholder for now: the game already calls play('flap' | 'score' | 'hit')
//  and toggleMute(), but nothing makes a noise yet. Step 3 fills this in with
//  Web Audio beeps (and optional sound files from config.js).
// ============================================================================

export class SoundManager {
  constructor() {
    this.muted = false;
  }

  play(_name) {
    // Implemented in step 3.
  }

  toggleMute() {
    this.muted = !this.muted;
  }
}
