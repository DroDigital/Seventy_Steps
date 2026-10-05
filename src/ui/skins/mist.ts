/**
 * The mist: the menu has no frame at all. The words stand on a dark ground with no edge, feathered out into
 * nothing, and a cold mist with a purple cast drifts about them, thicker beyond the words than behind them. Round 40:
 * it was thirty soft discs on a ring, and a surge gathered them into a blob; now it is a veil: three layers of
 * seamless, domain-warped, ridged noise (drawn once, in code), each drifting its own way at its own scale, so
 * it has tendrils and thin places and no centre. A surge (a page changing, the intro's cards) thickens every layer,
 * rolls them toward the eye at different speeds (a parallax: the near veil sweeps past the far), turns them a
 * little in opposite ways, and lets the mist cross where the words stood, so the middle is never bare; and it
 * settles the same way. It opens as the veil rolls in out of the dark and comes to rest.
 */

import type { Skin } from '../menuSkin';
import { fbm } from '../../core/noise';
import { easeOut, lerp, say, smooth } from './skinKit';

const BLEED = 200; // the canvas reaches this far past the words; the mist and the ground are lost long before its edge
const FEATHER = 96; // how far the dark ground fades out beyond the words
const EDGE = 110; // how far in from the canvas's edge everything on it is faded out, so the canvas itself is never seen

/** A dark rectangle whose edge is lost: solid inside, fading to nothing over `f` pixels outside, sides and corners alike. */
function feathered(g: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, f: number, rgb: string, a: number): void {
  const fade = (grd: CanvasGradient): CanvasGradient => {
    for (const [k, v] of [[0, 1], [0.25, 0.8], [0.5, 0.45], [0.75, 0.16], [1, 0]] as const) grd.addColorStop(k, `rgba(${rgb},${a * v})`);
    return grd;
  };
  g.fillStyle = `rgba(${rgb},${a})`;
  g.fillRect(x0, y0, x1 - x0, y1 - y0);
  const side = (gx0: number, gy0: number, gx1: number, gy1: number, rx: number, ry: number, rw: number, rh: number): void => {
    const grd = g.createLinearGradient(gx0, gy0, gx1, gy1);
    for (const [k, v] of [[0, 0], [0.25, 0.16], [0.5, 0.45], [0.75, 0.8], [1, 1]] as const) grd.addColorStop(k, `rgba(${rgb},${a * v})`);
    g.fillStyle = grd;
    g.fillRect(rx, ry, rw, rh);
  };
  side(0, y0 - f, 0, y0, x0, y0 - f, x1 - x0, f); // top
  side(0, y1 + f, 0, y1, x0, y1, x1 - x0, f); // bottom
  side(x0 - f, 0, x0, 0, x0 - f, y0, f, y1 - y0); // left
  side(x1 + f, 0, x1, 0, x1, y0, f, y1 - y0); // right
  for (const [cx, cy, rx, ry] of [[x0, y0, x0 - f, y0 - f], [x1, y0, x1, y0 - f], [x0, y1, x0 - f, y1], [x1, y1, x1, y1]] as const) {
    g.fillStyle = fade(g.createRadialGradient(cx, cy, 0, cx, cy, f));
    g.fillRect(rx, ry, f, f);
  }
}

/** One mask for the whole canvas: solid within, fading to nothing before its edge (so no cut of the mist is ever seen). */
function edgeMask(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  [c.width, c.height] = [w + BLEED * 2, h + BLEED * 2];
  const g = c.getContext('2d')!;
  g.translate(BLEED, BLEED);
  feathered(g, -BLEED + EDGE, -BLEED + EDGE, w + BLEED - EDGE, h + BLEED - EDGE, EDGE, '255,255,255', 1);
  return c;
}

const TILE = 256;
const PERIOD = 4; // lattice cells across a tile, so it repeats without a seam

/** One tile of veil: the ridges of warped, fractal noise, thin and drifting, with the thick and the clear of it set by a second noise. */
function veilTile(seed: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  [c.width, c.height] = [TILE, TILE];
  const g = c.getContext('2d')!;
  const img = g.createImageData(TILE, TILE);
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const [u, v] = [(x / TILE) * PERIOD, (y / TILE) * PERIOD];
      const wx = (fbm(u, v, seed + 3, 3, PERIOD) - 0.5) * 1.6; // the warp pulls the ridges into curls
      const wy = (fbm(u + 5.2, v + 1.3, seed + 4, 3, PERIOD) - 0.5) * 1.6;
      const ridge = 1 - Math.abs(2 * fbm(u + wx, v + wy, seed, 4, PERIOD) - 1); // 1 along a crest: a filament
      const body = smooth(0.38, 0.78, fbm(u * 0.5 + 9, v * 0.5 + 4, seed + 9, 3, PERIOD / 2)); // where there is mist at all
      const a = Math.min(1, (smooth(0.55, 0.98, ridge) ** 1.4) * 0.85 + 0.22 * ridge * ridge) * body;
      const i = (y * TILE + x) * 4;
      [img.data[i], img.data[i + 1], img.data[i + 2], img.data[i + 3]] = [150 + 40 * ridge, 134 + 36 * ridge, 188 + 40 * ridge, Math.round(255 * a)];
    }
  }
  g.putImageData(img, 0, 0);
  return c;
}

/** The three layers: which tile, how large, how it drifts (px a second), how it turns, how thick it is, and how a surge moves it (zoom, turn). Far to near. */
const LAYERS = [
  { tile: 0, scale: 2.1, drift: [5, -2], spin: 0.00005, alpha: 0.24, zoom: 0.14, turn: 0.1 },
  { tile: 1, scale: 1.35, drift: [-8, 3], spin: -0.00007, alpha: 0.3, zoom: 0.26, turn: -0.14 },
  { tile: 0, scale: 0.85, drift: [4, 9], spin: 0.00009, alpha: 0.26, zoom: 0.46, turn: 0.2 },
] as const;
let tiles: HTMLCanvasElement[] | null = null;
const size = { w: 0, h: 0, at: -1 }; // the ground's size as drawn: it eases to each page's

export const mist: Skin = {
  id: 'mist',
  name: 'Mist',
  bleed: BLEED,
  pad: '40px 46px 34px',
  openMs: 1300,
  maxRatio: 1, // soft all through: drawn at the layout's own size
  build(w, h) {
    const mask = edgeMask(w, h);
    tiles ??= [veilTile(11), veilTile(29)];
    const patterns = new Map<number, CanvasPattern>();
    if (!size.w) [size.w, size.h] = [w, h];
    return {
      draw(g, ms, open, stir) {
        const roll = easeOut(open);
        if (ms < 40) [size.w, size.h, size.at] = [w, h, -1]; // a menu opened anew starts at its own size
        const k = size.at < 0 ? 1 : 1 - Math.exp(-Math.max(0, ms - size.at) / 110);
        size.at = ms;
        [size.w, size.h] = [lerp(size.w, w, k), lerp(size.h, h, k)];
        const [sw, sh] = [size.w, size.h];
        const [cx, cy] = [w / 2, h / 2];
        g.globalCompositeOperation = 'screen';
        LAYERS.forEach((l, n) => { // the veil: each layer its own way
          let pat = patterns.get(n);
          if (!pat) patterns.set(n, (pat = g.createPattern(tiles![l.tile], 'repeat')!));
          g.save();
          g.globalAlpha = l.alpha * roll * smooth(0, 0.7, open) * (1 + 0.45 * stir);
          g.translate(cx, cy);
          g.rotate(l.spin * ms + l.turn * stir + (1 - roll) * 0.25 * (n % 2 ? 1 : -1)); // it turns as it settles in, and as it is stirred
          const zoom = l.scale * (1 + l.zoom * stir) * (1 + (1 - roll) * 0.5); // rolled toward the eye by a surge, and in from afar as it opens
          g.scale(zoom, zoom);
          g.translate((l.drift[0] * ms) / 1000, (l.drift[1] * ms) / 1000);
          g.fillStyle = pat;
          g.fillRect(-1500 / zoom - cx, -1500 / zoom - cy, 3000 / zoom, 3000 / zoom); // (the pattern is in the layer's own space: the fill is as much of it as the canvas shows)
          g.restore();
        });
        g.globalCompositeOperation = 'destination-out'; // the words' own ground is clear of it, in an oval that has no edge...
        g.save();
        g.translate(cx, cy);
        g.scale((sw / 2 + 40) * 1.25 * (1 - 0.5 * stir), (sh / 2 + 40) * 1.25 * (1 - 0.5 * stir)); // ...which a surge closes in on, so the mist crosses where the words stood
        const hole = g.createRadialGradient(0, 0, 0, 0, 0, 1);
        for (const [at, v] of [[0, 1], [0.4, 0.92], [0.58, 0.6], [0.74, 0.22], [1, 0]] as const) hole.addColorStop(at, `rgba(0,0,0,${v})`);
        g.fillStyle = hole;
        g.globalAlpha = 0.9 * (1 - 0.92 * stir) * roll;
        g.fillRect(-1, -1, 2, 2);
        g.restore();
        g.globalCompositeOperation = 'source-over';
        g.globalAlpha = smooth(0, 0.6, open);
        feathered(g, (w - sw) / 2 + 4, (h - sh) / 2 + 4, (w + sw) / 2 - 4, (h + sh) / 2 - 4, FEATHER, '8,7,12', 0.62 * (1 - 0.7 * stir)); // the ground, with no edge to it
        g.globalAlpha = 1;
        g.globalCompositeOperation = 'destination-in';
        g.drawImage(mask, -BLEED, -BLEED, w + BLEED * 2, h + BLEED * 2);
        g.globalCompositeOperation = 'source-over';
      },
      words(panel, open, base) {
        const k = smooth(0.25, 1, open);
        say(panel, base, open >= 1 ? {} : { opacity: k, filter: `blur(${(1 - k) * 9}px)` });
      },
    };
  },
};
