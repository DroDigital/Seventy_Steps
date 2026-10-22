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
export const reach = (kind: MarkKind, r: number): number => (kind === 'person' || kind === 'place' ? r * 0.7 : kind === 'you' ? r * 1.1 : kind === 'marker' ? r * 0.9 : r * 1.15);

/** How far below a marker's centre its pin's tip falls, in radii: the place it marks is the tip (a mark stands centred on its place; the pin does not). */
export const PIN_TIP = 1.55;

/** The dark disc a figure is set on, ringed in its colour, with a black edge about it for ground of any light. */
export function token(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, ring: string, glow = ''): void {
  ctx.save();
  ctx.lineWidth = Math.max(1, r * 0.14) + 2;
  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.stroke();
  if (glow) [ctx.shadowColor, ctx.shadowBlur] = [glow, r * 1.2];
  ctx.fillStyle = 'rgba(11,10,14,0.88)';
  ctx.fill();
  ctx.restore();
  ctx.lineWidth = Math.max(1, r * 0.14);
  ctx.strokeStyle = ring;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.stroke();
}
