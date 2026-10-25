/**
 * The pace of a spoken line (round 30: a person's words appear as they are said): from the recording,
 * where the voice is sounding (a half-second pause is not counted as speech), a line's words are given
 * the moments they are said at, by how much of the line's text lies before them. Pure.
 */

/** The share of a recording's speech done by the end of each `window`-second stretch (0..1, rising): where the voice sounds, by its loudness against the line's own. */
export function voicedCurve(samples: Float32Array, rate: number, window = 0.04): Float32Array {
  const n = Math.max(1, Math.round(rate * window));
  const count = Math.max(1, Math.floor(samples.length / n));
  const level = new Float32Array(count);
  for (let w = 0; w < count; w++) {
    let sum = 0;
    for (let i = w * n; i < (w + 1) * n; i++) sum += samples[i] * samples[i];
    level[w] = Math.sqrt(sum / n);
  }
  const sorted = [...level].sort((a, b) => a - b);
  const loud = sorted[Math.floor(sorted.length * 0.9)] || 1e-6;
  const curve = new Float32Array(count);
  let total = 0;
  for (let w = 0; w < count; w++) {
    total += level[w] > 0.12 * loud ? 1 : 0.02; // a little weight in a pause keeps the curve rising
    curve[w] = total;
  }
  for (let w = 0; w < count; w++) curve[w] /= total;
  return curve;
}

/** How loudly the voice sounds `since` seconds into a recording played at `rate` (0..1): how fast the curve of speech rises about that moment against how fast it would if the speech were even, so a pause is 0 and a stressed word is near 1 (round 81: a horror's picture follows its voice). */
export function voiceLevel(curve: Float32Array, since: number, rate = 1, window = 0.04): number {
  const at = Math.floor((since * rate) / window);
  if (since < 0 || at < 0 || at >= curve.length || curve.length < 2) return 0;
  const [a, b] = [Math.max(0, at - 3), Math.min(curve.length - 1, at + 3)];
  const ratio = ((curve[b] - curve[a]) / Math.max(1, b - a)) * curve.length; // 1 is an even rise
  return Math.min(1, Math.max(0, (ratio - 0.3) / 0.9));
}

/** The second (of the recording as played at `rate`) by which `share` of its speech is done, given `window` as above. */
export function momentOf(curve: Float32Array, share: number, rate = 1, window = 0.04): number {
  if (share <= 0) return 0;
  let lo = 0;
  let hi = curve.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (curve[mid] < share) lo = mid + 1;
    else hi = mid;
  }
  let top = 0;
  for (let i = 1; i < curve.length; i++) top = Math.max(top, curve[i] - curve[i - 1]);
  const flat = (i: number): boolean => i > 0 && curve[i] - curve[i - 1] < 0.3 * top; // a window with no voice in it
  if (flat(lo)) {
    while (lo < curve.length - 1 && flat(lo)) lo++; // a word after a pause is said as the voice comes back, not as it falls silent
    return (lo * window) / rate;
  }
  const before = lo > 0 ? curve[lo - 1] : 0;
  const frac = curve[lo] > before ? (share - before) / (curve[lo] - before) : 0;
  return ((lo + Math.min(1, Math.max(0, frac))) * window) / rate;
}

/** How much a word weighs in a line: its letters, and a breath more after a mark that stops the voice. */
const weight = (word: string): number => word.replace(/[^\p{L}\p{N}]/gu, '').length + 0.5 + (/[.!?…]$/.test(word) ? 1.5 : /[,;:—-]$/.test(word) ? 0.7 : 0);

/**
 * The moment (seconds from the start of the recording) each of `words` begins to be said, from the
 * curve of the recording, or, without one, spread evenly over `fallback` seconds.
 */
export function wordMoments(words: readonly string[], curve: Float32Array | null, rate = 1, fallback = 0): number[] {
  const weights = words.map(weight);
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  let before = 0;
  return weights.map((w) => {
    const share = before / total;
    before += w;
    return curve ? momentOf(curve, share, rate) : share * fallback;
  });
}
