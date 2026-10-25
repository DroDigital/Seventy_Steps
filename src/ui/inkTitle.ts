/**
 * Round 80, the ink of a title: a name that comes out of the dark a letter at a time, from the middle outward, each rising out of a blur
 * and a few pixels below its place, as the people's words do on a page (ui/dialogue.ts UNSAID and SAID), and sinks away the other way. The
 * delays are pure (`inkDelays`, `realmTint`) and tested; the rest draws on the page with the Web Animations API, which the banner
 * (ui/banner.ts) and the veil (ui/veil.ts) share. With reduced motion asked for the letters are simply there and the card fades whole.
 */

import { hash2 } from '../core/rng';
import { LOOKS } from '../data/looks';
import { INK } from '../data/uiMood';
import { blend, BONE } from './hudKit';

/**
 * When each of `n` letters begins, in seconds from the first, over `span`: the middle first, the ends last, each strayed by up to `jitter`
 * either way (by `seed`, the same each time) and kept within 0..span. `inward`: the ends first (a name sinking away).
 */
export function inkDelays(n: number, seed: number, span: number, jitter: number = INK.jitter, inward = false): number[] {
  const mid = (n - 1) / 2;
  return Array.from({ length: n }, (_, i) => {
    const far = mid > 0 ? Math.abs(i - mid) / mid : 0; // 0 at the middle, 1 at the ends
    const base = (inward ? 1 - far : far) * span;
    return Math.min(span, Math.max(0, base + (hash2(i, n, seed) * 2 - 1) * jitter));
  });
}

const luma = (hex: string): number => (0.2126 * parseInt(hex.slice(1, 3), 16) + 0.7152 * parseInt(hex.slice(3, 5), 16) + 0.0722 * parseInt(hex.slice(5, 7), 16)) / 255;
const hexOf = (c: readonly number[]): string => `#${c.map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0')).join('')}`;

/** The colour of a realm's title: bone turned toward the realm's first accent, and never darker than `INK.floor`. */
export function realmTint(region: string | null | undefined): string {
  const look = LOOKS[region ?? ''];
  if (!look) return BONE;
  let tint = blend(BONE, hexOf(look.accents[0]), INK.tint);
  for (let i = 0; i < 3 && luma(tint) < INK.floor; i++) tint = blend(tint, BONE, 0.5); // a dark accent is lifted toward bone
  return tint;
}

const reduced = (): boolean => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Lays `text` into `parent` one inline-block span a glyph (a space is a space), and returns the glyphs' spans. */
export function inkLetters(parent: HTMLElement, text: string): HTMLSpanElement[] {
  parent.replaceChildren();
  const spans: HTMLSpanElement[] = [];
  for (const ch of text) {
    if (ch === ' ') {
      parent.append(' ');
      continue;
    }
    const s = document.createElement('span');
    s.textContent = ch;
    s.style.display = 'inline-block';
    parent.append(s);
    spans.push(s);
  }
  return spans;
}

/** The letters come out of the dark, middle first. Returns the animations (to cancel); none with reduced motion. */
export function playIn(spans: readonly HTMLElement[], seed: number, span: number = INK.span, extra = 0): Animation[] {
  if (reduced()) return [];
  const delays = inkDelays(spans.length, seed, span);
  return spans.map((s, i) =>
    s.animate(
      [
        { opacity: 0, filter: `blur(${INK.blur}px)`, transform: `translateY(${INK.sink}px)` },
        { opacity: 1, filter: 'blur(0px)', transform: 'translateY(0)' },
      ],
      { duration: INK.letter * 1000, delay: (delays[i] + extra) * 1000, easing: 'ease-out', fill: 'both' },
    ),
  );
}

/** The letters sink away, the ends first. Returns the animations. */
export function playOut(spans: readonly HTMLElement[], seed: number, span: number = INK.out): Animation[] {
  if (reduced()) return [];
  const delays = inkDelays(spans.length, seed + 1, span, INK.jitter, true);
  return spans.map((s, i) =>
    s.animate(
      [
        { opacity: Number(getComputedStyle(s).opacity) || 1, filter: 'blur(0px)', transform: 'translateY(0)' },
        { opacity: 0, filter: `blur(${INK.blur * 0.6}px)`, transform: `translateY(${-INK.sink * 0.5}px)` },
      ],
      { duration: INK.outLetter * 1000, delay: delays[i] * 1000, easing: 'ease-in', fill: 'forwards' },
    ),
  );
}

/** A word's seed for its delays: the same word is inked the same way. */
export const inkSeed = (text: string): number => [...text].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7);
