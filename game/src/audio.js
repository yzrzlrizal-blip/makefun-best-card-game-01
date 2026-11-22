// Ember Court — sounds: every effect is synthesized with WebAudio, so the game
// ships no audio files and makes no network request. Silent until the first
// click or keypress (browsers require a gesture before audio starts).

let ctx = null;
let muted = false;

export function isMuted() {
  return muted;
}

export function setMuted(value) {
  muted = value;
}

/** Unlock the audio context on the first user gesture. */
export function unlockAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume();
    return;
  }
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
  } catch {
    ctx = null;
  }
}

/** One short tone: frequency slide, gain envelope, then silence. */
function tone(freqFrom, freqTo, seconds, type = 'sine', volume = 0.12, when = 0) {
  if (!ctx || muted) return;
  const t0 = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freqFrom, t0);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqTo), t0 + seconds);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(volume, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + seconds + 0.05);
}

/** A card sliding onto the table. */
export function sfxPlay() {
  tone(520, 340, 0.09, 'triangle', 0.1);
  tone(760, 500, 0.07, 'sine', 0.06, 0.03);
}

/** A strike landing. */
export function sfxHit() {
  tone(180, 60, 0.16, 'sawtooth', 0.14);
  tone(90, 40, 0.2, 'square', 0.08, 0.02);
}

/** A heal or a shield rising. */
export function sfxHeal() {
  tone(420, 640, 0.14, 'sine', 0.09);
  tone(640, 880, 0.16, 'sine', 0.07, 0.08);
}

/** Drawing a card. */
export function sfxDraw() {
  tone(700, 900, 0.05, 'triangle', 0.05);
}

/** The turn changing hands. */
export function sfxTurn() {
  tone(330, 330, 0.06, 'sine', 0.06);
  tone(440, 440, 0.08, 'sine', 0.06, 0.07);
}

/** Victory: a rising little fanfare. */
export function sfxWin() {
  [523, 659, 784, 1047].forEach((f, i) => tone(f, f, 0.22, 'triangle', 0.11, i * 0.13));
}

/** Defeat: a low falling line. */
export function sfxLose() {
  [392, 330, 262, 196].forEach((f, i) => tone(f, f * 0.92, 0.26, 'sine', 0.1, i * 0.16));
}
