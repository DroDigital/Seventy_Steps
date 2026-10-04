/**
 * The mist: the menu has no frame at all. The words stand on a dark ground with no edge, feathered out into
 * nothing, and a drift of cold mist with a purple cast turns slowly about them, thicker beyond the words than
 * behind them. It opens as the mist rolls in from beyond and settles, the words coming clear out of a blur.
 */

import type { Skin } from '../menuSkin';
import { easeOut, lerp, rng, say, smooth } from './skinKit';

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

// The mist is one weather, kept as the pages change: a new page is another size of the same mist, not a new mist.
const banks = (() => {
  const r = rng(11);
  return Array.from({ length: 30 }, (_, i) => {
    const a = (i / 30) * Math.PI * 2 + r() * 0.5;
    return { a, ring: 0.95 + r() * 0.25, rad: 70 + r() * 90, al: 0.045 + r() * 0.08, spin: (r() - 0.5) * 0.0001, sway: r() * 6 };
  });
})();
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
        g.globalAlpha = smooth(0, 0.6, open);
        feathered(g, (w - sw) / 2 + 4, (h - sh) / 2 + 4, (w + sw) / 2 - 4, (h + sh) / 2 - 4, FEATHER, '8,7,12', 0.7 - stir * 0.12); // the ground, with no edge to it
        g.globalAlpha = roll;
        for (const b of banks) { // the mist, turning (a surge when a page changes: it stirs, closer and brighter)
          const a = b.a + ms * b.spin + stir * 0.35;
          const out = lerp(1.9, b.ring - stir * 0.12, roll); // it comes from far off
          const [x, y] = [cx + Math.cos(a) * (sw / 2) * out + Math.sin(ms * 0.0006 + b.sway) * 10, cy + Math.sin(a) * (sh / 2) * out + Math.cos(ms * 0.0005 + b.sway) * 8];
          const al = b.al * (1 + stir * 1.6);
          const grd = g.createRadialGradient(x, y, 0, x, y, b.rad);
          grd.addColorStop(0, `rgba(132,114,166,${al})`);
          grd.addColorStop(0.5, `rgba(92,84,118,${al * 0.45})`);
          grd.addColorStop(1, 'rgba(60,56,80,0)');
          g.fillStyle = grd;
          g.fillRect(x - b.rad, y - b.rad, b.rad * 2, b.rad * 2);
        }
        if (stir > 0.01) { // a page changing (the intro's cards): the mist gathers over where the words were, so the middle is never bare
          const r = Math.max(sw, sh) * 0.55;
          const grd = g.createRadialGradient(cx, cy, 0, cx, cy, r);
          grd.addColorStop(0, `rgba(120,104,152,${stir * 0.22})`);
          grd.addColorStop(0.6, `rgba(88,80,114,${stir * 0.1})`);
          grd.addColorStop(1, 'rgba(60,56,80,0)');
          g.fillStyle = grd;
          g.fillRect(cx - r, cy - r, r * 2, r * 2);
        }
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
