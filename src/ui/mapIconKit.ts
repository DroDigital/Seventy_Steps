/**
 * What the map's figures share (round 60): the kinds of mark and what state each can be in, the colours, the dark token a figure is set on and how
 * far a mark reaches. mapIcons.ts draws the places, mapIconsLive.ts the people, the Echoes, the story's lead, the marker and the investigator.
 */

import type { PoiKind } from '../data/pois';
import { blend } from './hudKit';

export type MarkKind = 'sign' | 'gate' | 'dungeon' | 'boss' | 'person' | 'echo' | 'lead' | 'place' | 'you' | 'marker' | 'secret';

/** What a mark is like now: a sign lit, a horror slain, a person met, a secret not yet found (`rumour`) or found (`poi`: its kind) and its chest taken (`spent`); `now` (ms) breathes the echo and the lead; `turn`, the arrow's turn. */
export interface MarkState {
  lit?: boolean;
  slain?: boolean;
  met?: boolean;
  rumour?: boolean;
  poi?: PoiKind;
  spent?: boolean;
  now?: number;
  turn?: number;
}

export const INK = '#0b0a0e';
export const BONE = '#d9d0b8';
export const DIM = '#8a8474';
export const MAGENTA = '#d80073';
export const PURPLE = '#9a5ad0';
export const VERDIGRIS = '#4fb3a0'; // the investigator's own marker: copper gone green, a colour no other mark has
export const BRASS = '#c9b27a'; // lost Echoes: pale brass (round 36: the neon green was the one loud colour on the map)
export const BRONZE = '#c8884e'; // a dungeon's door: the bronze of a torch-lit lintel
export const VEIL = '#7b3fc4';
export const TAU = Math.PI * 2;

/** The size of a mark's token about `r`, the radius a kind is drawn at: what a name or another mark should keep clear of. */
export const reach = (kind: MarkKind, r: number): number => (kind === 'place' ? r * 0.75 : kind === 'person' ? r * 0.95 : kind === 'you' ? r * 1.1 : kind === 'marker' ? r * 0.9 : r * 1.15);

/** How far below a marker's centre its pin's tip falls, in radii: the place it marks is the tip (a mark stands centred on its place; the pin does not). */
export const PIN_TIP = 1.55;

const tinted = new Map<string, string>();
/** `hex` ('#rrggbb') lightened toward white by `k` (0 to 1), or darkened toward black by `-k`; kept, for a frame draws hundreds of marks. */
export function tint(hex: string, k: number): string {
  const key = `${hex}${k}`;
  let out = tinted.get(key);
  if (!out) tinted.set(key, (out = k >= 0 ? blend(hex, '#ffffff', k) : blend(hex, '#000000', -k)));
  return out;
}

/** A vertical sheen from `y0` to `y1`: `hex` lit at the top and shaded at the foot, so a flat figure reads as a cut thing. */
export function sheen(ctx: CanvasRenderingContext2D, y0: number, y1: number, hex: string, lift = 0.4, sink = 0.35): CanvasGradient {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, tint(hex, lift));
  g.addColorStop(0.5, hex);
  g.addColorStop(1, tint(hex, -sink));
  return g;
}

/**
 * The medallion a figure is set on (round 68: "enhance the visual design of all map icons"; 2026-10-25: struck like a coin, "they look cheap and
 * dull"): a face lit from above left and tinted by its own colour, a rim that is bright where the light meets it and dark where it turns away, a
 * groove cut just inside, a glint along the lit edge, and a black edge about it for ground of any light. `glow` lights the rim itself.
 */
export function token(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, ring: string, glow = ''): void {
  const rim = Math.max(1.5, r * 0.19);
  ctx.save();
  ctx.lineWidth = rim + 2.4;
  ctx.strokeStyle = 'rgba(0,0,0,0.7)';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.stroke();
  if (glow) [ctx.shadowColor, ctx.shadowBlur] = [glow, r * 1.4];
  const face = ctx.createRadialGradient(x - r * 0.3, y - r * 0.4, r * 0.05, x, y, r);
  face.addColorStop(0, tint(ring, -0.6));
  face.addColorStop(0.55, tint(ring, -0.8));
  face.addColorStop(1, tint(ring, -0.92));
  ctx.fillStyle = face;
  ctx.fill();
  ctx.restore();
  const edge = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
  edge.addColorStop(0, tint(ring, 0.55));
  edge.addColorStop(0.5, ring);
  edge.addColorStop(1, tint(ring, -0.5));
  ctx.lineWidth = rim;
  ctx.strokeStyle = edge;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.stroke();
  ctx.save();
  ctx.beginPath(); // the groove inside the rim, and the lip beside it
  ctx.arc(x, y, r * 0.8, 0, TAU);
  ctx.lineWidth = Math.max(0.8, r * 0.07);
  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, r * 0.72, 0, TAU);
  ctx.globalAlpha = 0.28;
  ctx.strokeStyle = ring;
  ctx.stroke();
  ctx.beginPath(); // a glint along the rim where the light falls
  ctx.arc(x, y, r - rim * 0.1, Math.PI * 1.08, Math.PI * 1.58);
  ctx.globalAlpha = 0.5;
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(0.8, rim * 0.34);
  ctx.strokeStyle = '#fff';
  ctx.stroke();
  ctx.restore();
}
