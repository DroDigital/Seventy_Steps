/**
 * The map's still marks, drawn once and stamped (2026-10-25). A mark of the overhaul is a score of gradients and paths; the minimap redraws
 * a hundred of them thirty times a second, so a mark that never moves (a sign, a gate, a dungeon, a horror, a person, a place, a secret, a
 * stake) is drawn into a small canvas the first time it is asked for and every later one is a copy, set on a whole pixel. A mark that
 * moves with the clock (the echo, the lead, the investigator's arrow) is drawn as it always was. Without a document (the tests) every
 * mark is drawn directly, so `drawMark` itself stays pure.
 */

import { drawMark } from './mapIcons';
import type { MarkKind, MarkState } from './mapIconKit';

/** How far a figure's glow or shadow can fall from its centre, in radii: the sprite's margin. */
const MARGIN = 2;
const MOVING: ReadonlySet<MarkKind> = new Set(['echo', 'lead', 'you']);
const MOST = 96;

const sprites = new Map<string, HTMLCanvasElement>();

const keyOf = (kind: MarkKind, r: number, s: MarkState): string =>
  `${kind}|${Math.round(r * 4)}|${s.lit ? 'l' : ''}${s.slain ? 's' : ''}${s.met ? 'm' : ''}${s.rumour ? 'r' : ''}${s.spent ? 'x' : ''}|${s.poi ?? ''}`;

function sprite(kind: MarkKind, r: number, s: MarkState): HTMLCanvasElement | null {
  const key = keyOf(kind, r, s);
  const have = sprites.get(key);
  if (have) return have;
  const c = document.createElement('canvas');
  const size = Math.ceil(r * MARGIN) * 2; // even, so its middle is a whole pixel
  [c.width, c.height] = [size, size];
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  drawMark(ctx, kind, size / 2, size / 2, Math.round(r * 4) / 4, s);
  if (sprites.size >= MOST) sprites.clear();
  sprites.set(key, c);
  return c;
}

/** Draws one mark as `drawMark` does, from a stamp where the mark is still. */
export function stampMark(ctx: CanvasRenderingContext2D, kind: MarkKind, x: number, y: number, r: number, s: MarkState = {}): void {
  const img = typeof document === 'undefined' || MOVING.has(kind) ? null : sprite(kind, r, s);
  if (!img) return drawMark(ctx, kind, x, y, r, s);
  ctx.drawImage(img, Math.round(x) - img.width / 2, Math.round(y) - img.height / 2);
}
