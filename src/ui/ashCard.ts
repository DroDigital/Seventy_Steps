/**
 * One of the opening's cards, drawn on a canvas so its words can break into ash (ui/ashFx.ts) and come back
 * from it: crisp while it stands, grains in the wind while it goes or arrives. The stage is the card's own
 * box (its width wraps the words); the canvas fills it and says the words to a screen reader.
 */

import { INK, goneAt, makeAsh, paintAsh, soften, type Ash } from './ashFx';
import { SERIF, TYPEWRITER } from './hudKit';

export interface CardWords {
  heading: string;
  body: string;
  telegram: boolean;
}
export interface AshCard {
  /** The words come back out of the ash over `ms`, from however far gone they are now. */
  form(ms: number): Promise<void>;
  /** The words blow away over `ms`, from however whole they are now. */
  dissolve(ms: number): Promise<void>;
  /** Whole, at once. */
  hold(): void;
  remove(): void;
}

const CELL = 0.75; // cells per css pixel of the ash's grid (a little coarser than the screen: grains of a pixel and a bit, and a frame in a few ms)
const PAD_X = 190; // css px of room about the words on each side for the ash to drift into (it blows up to some 140 px along): a canvas the size of the words alone cut the grains off at its edge (round 46)
const PAD_Y = 80;
const SIM = 14;
const EVERY = 30; // ms between frames of the ash (about 30 a second: a frame costs a few ms, and grains in the wind do not need more) // the previews' line of type, in sim units

export function createAshCard(stage: HTMLElement, words: CardWords, seed: number): AshCard {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;pointer-events:none';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', `${words.heading}. ${words.body}`);
  stage.style.position = 'relative';
  stage.append(canvas);
  const g = canvas.getContext('2d')!;
  const size = words.telegram ? 16 : 18;
  const face = words.telegram ? TYPEWRITER : SERIF;
  let p = 0; // progress through the dissolve: 0 whole, 1 gone
  let raf = 0;
  let run = 0;
  let prepared: { w: number; h: number; ratio: number; ash: Ash; mask: Float32Array; soft: Float32Array; buf: HTMLCanvasElement; img: ImageData } | null = null;

  /** The words laid out for a box of `width` css pixels, drawn through `c` (already scaled to css pixels). */
  function layout(c: CanvasRenderingContext2D, width: number, alpha = 1): void {
    c.fillStyle = `rgb(${INK.join(',')})`;
    c.textBaseline = 'top';
    c.font = `12px ${SERIF}`;
    (c as unknown as { letterSpacing: string }).letterSpacing = '2px';
    c.globalAlpha = alpha * 0.7;
    c.fillText(words.heading, 0, 0);
    c.globalAlpha = alpha;
    c.font = `${size}px ${face}`;
    (c as unknown as { letterSpacing: string }).letterSpacing = words.telegram ? '1px' : '0px';
    let [y, line] = [32, ''];
    const out: string[] = [];
    for (const word of words.body.split(/\s+/)) {
      const t = line ? `${line} ${word}` : word;
      if (c.measureText(t).width > width && line) {
        out.push(line);
        line = word;
      } else line = t;
    }
    out.push(line);
    for (const l of out) {
      c.fillText(l, 0, y);
      y += size * 1.75;
    }
  }

  function prepare(): NonNullable<typeof prepared> | null {
    const [cw, ch] = [stage.clientWidth, stage.clientHeight];
    if (!cw || !ch) return null;
    const ratio = Math.min(2, window.devicePixelRatio || 1) * Math.max(1, stage.getBoundingClientRect().width / cw); // (the UI is scaled: draw at what the screen shows)
    if (prepared && prepared.w === cw && prepared.h === ch && prepared.ratio === ratio) return prepared;
    const [ew, eh] = [cw + 2 * PAD_X, ch + 2 * PAD_Y]; // the canvas: the words' box and the room about it
    canvas.style.cssText = `position:absolute;pointer-events:none;left:${-PAD_X}px;top:${-PAD_Y}px;width:${ew}px;height:${eh}px`;
    canvas.width = Math.ceil(ew * ratio);
    canvas.height = Math.ceil(eh * ratio);
    const [w, h] = [Math.ceil(ew * CELL), Math.ceil(eh * CELL)];
    const m = document.createElement('canvas');
    [m.width, m.height] = [w, h];
    const mg = m.getContext('2d', { willReadFrequently: true })!;
    mg.scale(CELL, CELL);
    mg.translate(PAD_X, PAD_Y);
    layout(mg, cw);
    const alpha = mg.getImageData(0, 0, w, h).data;
    const mask = new Float32Array(w * h);
    for (let i = 0; i < mask.length; i++) mask[i] = alpha[i * 4 + 3] / 255;
    const buf = document.createElement('canvas');
    [buf.width, buf.height] = [w, h];
    const k = (size / SIM) * CELL; // cells per sim unit: a sim unit is size/14 css pixels
    prepared = { w: cw, h: ch, ratio, ash: makeAsh(w, h, k, seed, [PAD_X * CELL * 0.55, PAD_Y * CELL * 0.55]), mask, soft: soften(mask, w, h, Math.max(2, Math.round(size * CELL * 0.28))), buf, img: new ImageData(w, h) };
    return prepared;
  }

  function draw(): void {
    const s = prepare();
    if (!s) return;
    const d = goneAt(p);
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, canvas.width, canvas.height);
    const e = d < 0.001 ? 0 : Math.min(1, d / 0.1); // the crisp words give way to the grains over the first tenth
    if (e < 1) {
      g.setTransform(s.ratio, 0, 0, s.ratio, PAD_X * s.ratio, PAD_Y * s.ratio);
      layout(g, s.w, 1 - e);
    }
    if (e > 0) {
      paintAsh(s.ash, s.mask, s.soft, d, s.img.data);
      s.buf.getContext('2d')!.putImageData(s.img, 0, 0);
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalAlpha = e;
      g.imageSmoothingEnabled = true;
      g.drawImage(s.buf, 0, 0, canvas.width, canvas.height);
    }
    g.globalAlpha = 1;
  }

  function go(to: number, ms: number): Promise<void> {
    cancelAnimationFrame(raf);
    const id = ++run;
    const [from, t0] = [p, performance.now()];
    const span = Math.max(1, ms * Math.abs(to - from));
    let shown = -1e9;
    return new Promise((resolve) => {
      const step = (now: number): void => {
        if (id !== run) return resolve(); // another move took over
        const k = Math.min(1, (now - t0) / span);
        p = lerp(from, to, to === 0 ? 1 - (1 - k) * (1 - k) : k); // forming eases out: the first grains return at once, not after a dead third
        if (k >= 1 || now - shown >= EVERY) {
          draw();
          shown = now;
        }
        if (k < 1) raf = requestAnimationFrame(step);
        else resolve();
      };
      raf = requestAnimationFrame(step);
    });
  }
  const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

  p = 1;
  return {
    form: (ms) => go(0, ms),
    dissolve: (ms) => go(1, ms),
    hold() {
      run++;
      cancelAnimationFrame(raf);
      p = 0;
      draw();
    },
    remove() {
      run++;
      cancelAnimationFrame(raf);
      canvas.remove();
    },
  };
}
