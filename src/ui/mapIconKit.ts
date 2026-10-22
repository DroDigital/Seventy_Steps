/**
 * What the map's figures share (round 60): the kinds of mark and what state each can be in, the colours, the dark token a figure is set on and how
 * far a mark reaches. mapIcons.ts draws the places, mapIconsLive.ts the people, the Echoes, the story's lead, the marker and the investigator.
 */

import type { PoiKind } from '../data/pois';

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
export const VEIL = '#7b3fc4';
export const TAU = Math.PI * 2;

/** The size of a mark's token about `r`, the radius a kind is drawn at: what a name or another mark should keep clear of. */
export const reach = (kind: MarkKind, r: number): number => (kind === 'place' ? r * 0.75 : kind === 'person' ? r * 0.95 : kind === 'you' ? r * 1.1 : kind === 'marker' ? r * 0.9 : r * 1.15);

/** How far below a marker's centre its pin's tip falls, in radii: the place it marks is the tip (a mark stands centred on its place; the pin does not). */
export const PIN_TIP = 1.55;

/**
 * The medallion a figure is set on (round 66: "enhance the visual design of all map icons"): a dark disc lit a little from above, ringed in its
 * colour with a fainter ring just inside it, and a black edge about it for ground of any light. `glow` lights the ring itself.
 */
export function token(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, ring: string, glow = ''): void {
  ctx.save();
  ctx.lineWidth = Math.max(1.4, r * 0.16) + 2.4;
  ctx.strokeStyle = 'rgba(0,0,0,0.65)';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.stroke();
  if (glow) [ctx.shadowColor, ctx.shadowBlur] = [glow, r * 1.4];
  const face = ctx.createRadialGradient(x, y - r * 0.35, r * 0.1, x, y, r);
  face.addColorStop(0, 'rgba(40,36,48,0.96)');
  face.addColorStop(1, 'rgba(11,10,14,0.94)');
  ctx.fillStyle = face;
  ctx.fill();
  ctx.restore();
  ctx.lineWidth = Math.max(1.4, r * 0.16);
  ctx.strokeStyle = ring;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.stroke();
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.lineWidth = Math.max(0.8, r * 0.07);
  ctx.beginPath();
  ctx.arc(x, y, r * 0.8, 0, TAU);
  ctx.stroke();
  ctx.restore();
}
