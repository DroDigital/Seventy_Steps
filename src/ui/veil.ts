/**
 * The veil (playtest round 2): the dark that falls over the screen while the world is made
 * elsewhere (journeys.ts). Ink creeps in from the edges along noise, its fringe dithered and
 * faintly Cosmic Purple; once it covers everything, Lovecraft's branch-like Elder Sign glows at the
 * centre over the name of where the investigator is bound; then it draws back. It is drawn at low
 * resolution and upscaled like the game, so it shares its look. Over the title it only haunts the
 * edges, breathing. While the world is made under it, a line beneath the name fills from its middle
 * outwards as the making goes (playtest round 10: a start was seconds of black with nothing to say
 * that anything was happening). Round 78: the name is larger and inks in a letter at a time once the dark covers all (ui/inkTitle.ts),
 * and the line beneath it comes a moment after the last letter.
 */

import { fbm } from '../core/noise';
import { INK, VEIL } from '../data/uiMood';
import { nextLore } from './loreLine';
import { BONE, SERIF } from './hudKit';
import { inkLetters, inkSeed, playIn } from './inkTitle';

const [W, H] = [240, 135]; // pixels, upscaled nearest-neighbour
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const FRINGE = 0.05; // field units of purple beyond the ink's edge
const HAUNT = 0.24; // coverage while haunting the title's edges
const LINE = { y: 97, half: 34, ease: 5 }; // the making's line: its row, half its length (pixels), how fast it follows (1/s)

export interface Veil {
  /** Draws the dark over the screen; resolves once it covers everything and has been shown. */
  cover(words?: string, seconds?: number, line?: string, light?: Light): Promise<void>; // `line`: said under the words (else the next lore line: loreLine.ts); `light`: a gate's journey (round 60): the dark wells up from the middle of the screen behind a ring of that light, wound into a vortex
  /** Draws it back; resolves once it has gone. */
  lift(seconds?: number): Promise<void>;
  /** Covers at once (over a screen that is already dark). */
  darken(words?: string): void;
  /** Haunts the edges (the title) or stops. */
  haunt(on: boolean): void;
  /** While it covers, the line beneath the name shows the making `share` (0..1) done; it never draws back until the next cover. */
  progress(share: number): void;
  readonly fill: number; // the share last shown (0 without a line)
  readonly covered: boolean;
  readonly active: boolean; // any of it showing
}

/** The light a gate's journey falls in (0..1 a channel): the realm beyond's. */
export type Light = readonly [number, number, number];

/** A gate's journey (round 60): how far the dark has come out from the middle at a pixel, wound into a vortex that turns with `t` seconds (0 at the middle, 1 at the corners). */
export function portalReach(u: number, v: number, t: number): number {
  const r = Math.hypot(u * 1.4, v) / Math.hypot(1.4, 1);
  return r - 0.08 * Math.sin(Math.atan2(v, u) * 5 + r * 11 - t * 5);
}

/** Where the ink reaches first: high at the edges and corners, low at the centre, broken into tendrils by noise. */
export function veilField(w: number, h: number, seed = 1928): Float32Array {
  const f = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const [u, v] = [(x / (w - 1)) * 2 - 1, (y / (h - 1)) * 2 - 1];
      const r = Math.max(Math.abs(u) ** 3, Math.abs(v) ** 3, Math.hypot(u, v) / Math.SQRT2);
      const warp = fbm(x * 0.025, y * 0.025, seed, 2);
      const n = fbm(x * 0.05 + warp * 4, y * 0.05 - warp * 4, seed + 7, 3);
      f[y * w + x] = 0.6 * r + 0.4 * n;
    }
  }
  return f;
}

/** How much of the field the ink covers at `coverage` 0..1: the field values above it are dark. */
export const inkLine = (coverage: number): number => 1.08 - 1.2 * coverage;

/** The line's light at `dx` pixels from its middle, `fill` 0..1 of it made: 1 lit, 0.5 its glinting tip, 0 the dim track. */
export function lineLight(dx: number, fill: number): number {
  const reach = fill * LINE.half;
  if (Math.abs(dx) > LINE.half) return -1;
  if (Math.abs(dx) <= reach - 1) return 1;
  return Math.abs(dx) <= reach + 0.5 && fill > 0 ? 0.5 : 0;
}

/** The Elder Sign as pixels: a stem with two pairs of branches and a twig at its crown. */
function glyphMask(): Float32Array {
  const m = new Float32Array(W * H);
  const [cx, cy] = [W / 2, H / 2 - 8];
  const line = (x0: number, y0: number, angle: number, len: number): void => {
    for (let s = 0; s <= len; s += 0.25) {
      const [x, y] = [Math.round(x0 + Math.sin(angle) * s), Math.round(y0 - Math.cos(angle) * s)];
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const i = (y + dy) * W + x + dx;
          const glow = dx === 0 && dy === 0 ? 1 : 0.35 / (Math.abs(dx) + Math.abs(dy));
          if (i >= 0 && i < m.length) m[i] = Math.max(m[i], glow);
        }
      }
    }
  };
  line(cx, cy + 15, 0, 29);
  line(cx, cy - 4, 0.65, 11);
  line(cx, cy - 4, -0.65, 11);
  line(cx, cy + 5, 0.8, 9);
  line(cx, cy + 5, -0.8, 9);
  return m;
}

const ease = (t: number): number => t * t * (3 - 2 * t);

export function createVeil(): Veil {
  const canvas = document.createElement('canvas');
  canvas.dataset.veil = '';
  [canvas.width, canvas.height] = [W, H];
  canvas.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:8;pointer-events:none;image-rendering:pixelated;display:none';
  const words = document.createElement('div');
  const lore = document.createElement('div'); // a line under the place's name (round 14)
  words.style.cssText = `position:fixed;left:0;right:0;top:61%;z-index:8;pointer-events:none;text-align:center;font:calc(17px * var(--ui, 1)) ${SERIF};letter-spacing:calc(6px * var(--ui, 1));color:${BONE};opacity:0`;
  lore.style.cssText = `margin:calc(22px * var(--ui, 1)) auto 0;max-width:min(640px,80vw);font-style:italic;letter-spacing:.04em;font-size:calc(13px * var(--ui, 1));line-height:1.6;opacity:.6`;
  const said = document.createElement('span');
  words.append(said, lore);
  let name = ''; // the words as said, inked in once the dark covers all
  let inked: Animation[] = [];
  const say = (text: string, line?: string): void => {
    for (const a of inked) a.cancel();
    inked = [];
    name = text;
    said.textContent = text;
    lore.textContent = text ? (line ?? nextLore()) : '';
  };
  /** The name comes out of the dark a letter at a time, and the line beneath it a moment after the last (round 78). */
  const ink = (): void => {
    for (const a of inked) a.cancel();
    inked = playIn(inkLetters(said, name), inkSeed(name));
    if (lore.textContent && inked.length) inked.push(lore.animate([{ opacity: 0 }, { opacity: 0.6 }], { duration: VEIL.loreRise, delay: (INK.span + INK.letter) * 1000, easing: 'ease-out', fill: 'both' }));
  };
  document.body.append(canvas, words);
  const ctx = canvas.getContext('2d');
  const image = ctx?.createImageData(W, H);
  const field = veilField(W, H);
  const phase = veilField(W, H, 77);
  const glyph = glyphMask();

  let coverage = 0;
  let from = 0;
  let to = 0;
  let startedAt = 0;
  let seconds = 1;
  let haunting = false;
  let shownAt = -1; // when full cover was first drawn (for the glyph's fade and the promise)
  let running = false;
  let settle: (() => void) | null = null;
  let [made, shownMade, lastAt] = [-1, 0, 0]; // the making's share (-1: no line), as drawn, and the last frame's time
  let light: Light | null = null; // a gate's journey: the dark wells up from the middle behind a ring of this light

  /** The line beneath the name: a dim purple track, lit bone from the middle outwards in a purple glow, its tips glinting. */
  function drawLine(px: Uint8ClampedArray, k: number): void {
    const row = (y: number, x: number, [r, g, b]: readonly number[], a: number): void => {
      const o = (y * W + x) * 4;
      [px[o], px[o + 1], px[o + 2], px[o + 3]] = [px[o] + (r - px[o]) * a, px[o + 1] + (g - px[o + 1]) * a, px[o + 2] + (b - px[o + 2]) * a, 255];
    };
    for (let dx = -LINE.half; dx <= LINE.half; dx++) {
      const [x, light] = [W / 2 + dx, lineLight(dx, shownMade)];
      if (light === 1) {
        row(LINE.y, x, [217, 208, 184], k);
        for (const y of [LINE.y - 1, LINE.y + 1]) row(y, x, [106, 13, 173], 0.45 * k);
      } else if (light === 0.5) {
        row(LINE.y, x, [255, 246, 226], k);
        for (const y of [LINE.y - 1, LINE.y + 1]) row(y, x, [150, 60, 210], 0.7 * k);
      } else if (dx % 2 === 0) row(LINE.y, x, [106, 13, 173], 0.4 * k);
    }
  }

  function paint(now: number): void {
    if (!ctx || !image) return;
    const px = image.data;
    const t = now / 1000;
    const line = inkLine(coverage);
    const sign = shownAt < 0 ? 0 : Math.min(1, (now - shownAt) / 450) * (0.75 + 0.25 * Math.sin(t * 2.2));
    for (let y = 0, i = 0; y < H; y++) {
      for (let x = 0; x < W; x++, i++) {
        const dither = (BAYER[(y & 3) * 4 + (x & 3)] / 16 - 0.5) * 0.05;
        if (light && shownAt < 0) { // a gate's: the light runs out from the middle, the dark between the worlds behind it
          const o = i * 4;
          const v = 1.08 - portalReach((x / (W - 1)) * 2 - 1, (y / (H - 1)) * 2 - 1, t) + dither - line;
          const k = v > 0 ? Math.max(0, 1 - v / 0.22) : v > -FRINGE * 2 ? 0.55 * (1 + v / (FRINGE * 2)) : 0;
          if (v > 0 || k > 0) [px[o], px[o + 1], px[o + 2], px[o + 3]] = [255 * light[0] * k + (v > 0 ? 6 : 0), 255 * light[1] * k + (v > 0 ? 2 : 0), 255 * light[2] * k + (v > 0 ? 12 : 0), v > 0 ? 255 : 255 * k];
          else px[o + 3] = 0;
          continue;
        }
        const v = field[i] + 0.02 * Math.sin(t * 1.3 + phase[i] * 14) + dither - line;
        const o = i * 4;
        const g = Math.min(1, glyph[i] * sign * 1.6); // the sign: a bone core in a purple glow
        const k = g * g;
        if (v > 0) [px[o], px[o + 1], px[o + 2], px[o + 3]] = [(106 + 111 * k) * g, (13 + 195 * k) * g, (173 + 11 * k) * g, 255];
        else if (v > -FRINGE) [px[o], px[o + 1], px[o + 2], px[o + 3]] = [106, 13, 173, 150 * (1 + v / FRINGE)];
        else px[o + 3] = 0;
      }
    }
    if (made >= 0 && sign > 0) drawLine(px, Math.min(1, sign * 1.15));
    ctx.putImageData(image, 0, 0);
  }

  function frame(now: number): void {
    const p = Math.min(1, (now - startedAt) / (seconds * 1000));
    shownMade += (Math.max(0, made) - shownMade) * Math.min(1, ((now - lastAt) / 1000) * LINE.ease);
    lastAt = now;
    coverage = haunting && p >= 1 ? HAUNT + 0.03 * Math.sin(now / 900) : from + (to - from) * ease(p);
    const full = coverage >= 1;
    if (full && shownAt < 0) {
      shownAt = now;
      ink();
    } else if (!full) shownAt = -1;
    words.style.opacity = full ? `${Math.min(1, (now - shownAt) / 450)}` : '0';
    canvas.style.display = coverage > 0 ? 'block' : 'none';
    if (coverage > 0) paint(now);
    if (p >= 1 && settle && (!full || now > shownAt)) {
      const done = settle; // a full cover resolves only once it has been shown
      settle = null;
      done();
    }
    running = haunting || coverage > 0 || p < 1 || settle !== null;
    if (running) requestAnimationFrame(frame);
  }

  function go(target: number, secs: number): Promise<void> {
    settle?.(); // a journey superseded is done
    [from, to, seconds, startedAt] = [coverage, target, Math.max(0.01, secs), performance.now()];
    if (!running) {
      running = true;
      requestAnimationFrame(frame);
    }
    return new Promise((resolve) => (settle = resolve));
  }

  return {
    cover(text = '', secs = 0.9, line, through) {
      haunting = false;
      light = through ?? null;
      say(text, line);
      [made, shownMade] = [-1, 0];
      return go(1, secs * (1 - coverage));
    },
    lift(secs = 1.2) {
      haunting = false;
      light = null; // it opens as any journey does, from the middle out
      made = -1;
      return go(0, secs);
    },
    darken(text = '') {
      haunting = false;
      say(text);
      void go(1, 0.01);
    },
    haunt(on) {
      haunting = on;
      void go(on ? HAUNT : 0, on ? 2.5 : 0.6);
    },
    progress(share) {
      if (made < 0) shownMade = 0;
      made = Math.max(made, Math.min(1, Math.max(0, share)));
    },
    get fill() {
      return Math.max(0, made);
    },
    get covered() {
      return coverage >= 1 && to === 1;
    },
    get active() {
      return coverage > 0 && !haunting;
    },
  };
}
