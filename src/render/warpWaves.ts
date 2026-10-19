/**
 * The time of a failing mind's picture (round 58). The warp used to be a steady wobble, two sines over the whole screen for as long as the mind was
 * low; a fixed rhythm is what makes it read as a filter. Now it comes in waves: `surgeAt` is how strong the moment is, 0 to 1, from two slow waves
 * that never line up, so the picture has calm stretches and swells, the calm stretches growing short as the mind goes and never quite gone
 * at the last. The lens drifts the same unevenly (`driftAt`), and a band change for the worse sends a ring out from the middle (`ringAt`).
 * Pure numbers (no Three.js); computeFx (fx.ts) reads them, and the shaders take what it makes.
 */

const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));
const smooth = (a: number, b: number, x: number): number => {
  const k = clamp01((x - a) / (b - a));
  return k * k * (3 - 2 * k);
};

/** How strong the picture's warp is at `time` seconds for a mind at `stress` (0..1): swells and lulls, the lulls filling as the stress grows. */
export function surgeAt(time: number, stress: number): number {
  const slow = 0.5 + 0.5 * Math.sin(time * 0.37 + 1.1 * Math.sin(time * 0.11)); // a wave about every seventeen seconds, itself leaning
  const slower = 0.5 + 0.5 * Math.sin(time * 0.173 + 2.3); // and one about every thirty-six, which they ride on
  const wave = smooth(0.3, 0.95, slow * 0.65 + slower * 0.35);
  const s = clamp01(stress);
  return clamp01(wave * (1 - 0.55 * s) + 0.55 * s * (0.6 + 0.4 * wave));
}

/** A drift of the lens in -1..1, never repeating on any beat a player can learn: three waves that do not line up. */
export function driftAt(time: number, seed = 0): number {
  return 0.55 * Math.sin(time * 0.43 + seed) + 0.3 * Math.sin(time * 0.97 + 1.3 + seed * 2.1) + 0.15 * Math.sin(time * 1.83 + 4.1 + seed * 0.7);
}

/** A ring sent out by a band for the worse: `pulse` 1 as it leaves the middle, 0 when it has gone: its radius (in picture heights) and its strength. */
export function ringAt(pulse: number): { radius: number; strength: number } {
  const age = 1 - clamp01(pulse);
  return { radius: age * 1.15, strength: pulse > 0 ? Math.sin(Math.PI * Math.min(1, age * 1.15)) : 0 };
}
