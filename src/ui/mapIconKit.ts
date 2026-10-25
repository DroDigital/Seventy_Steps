/**
 * What the map's figures share (round 60; overhauled 2026-10-25, "I want a complete overhaul"): the kinds of mark and what state each can be in,
 * the colours, how far a mark reaches, and the small kit every figure is made with. The marks are no longer glyphs on a medallion: each is a small
 * object found in the dreamlands and pinned to the map, a standing stone, a portal, a trapdoor, an idol's eye, a locket, a lamp, a key, a cairn,
 * an arrowhead, a surveyor's stake. All are drawn in one light (from the upper left, a little above), in the same oblique view (a lit face, a
 * shaded side on the right and a top that takes the most light), each with a soft shadow cast to the lower right and a dark halo about it, so a
 * figure reads on ground from near-black fog to snow. A figure is drawn in units of its radius (`drawMark` translates and scales to it).
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

export type Ctx = CanvasRenderingContext2D;
export type Pt = readonly [number, number];

export const INK = '#0b0a0e';
export const BONE = '#d9d0b8';
export const DIM = '#8a8474';
export const MAGENTA = '#d80073';
export const PURPLE = '#9a5ad0';
export const VERDIGRIS = '#4fb3a0'; // the investigator's own marker: copper gone green, a colour no other mark has
export const BRASS = '#c9b27a'; // lost Echoes and the story's key: pale brass
export const BRONZE = '#c8884e'; // a dungeon's iron and its torch
export const VEIL = '#7b3fc4';
export const TAU = Math.PI * 2;

/** The halo every figure has about it, so a figure of any colour stands out from ground of any light. */
export const EDGE = 'rgba(8,6,12,0.92)';

/** How far each kind reaches, in radii: about its outer edge, for hit-testing and for keeping a name clear of it. */
const REACH: Record<MarkKind, number> = { sign: 1.12, gate: 1.22, dungeon: 1.2, boss: 1.2, person: 0.95, echo: 1.08, lead: 1.15, place: 0.75, you: 1.15, marker: 1.0, secret: 0.85 };

/** The size of a mark about `r`, the radius a kind is drawn at: what a name or another mark should keep clear of. */
export const reach = (kind: MarkKind, r: number): number => r * REACH[kind];

/** How far below a marker's centre its stake's foot falls, in radii: the place it marks is the foot (a mark stands centred on its place; the stake does not). */
export const PIN_TIP = 1.55;

/** `hex` with an alpha, as a CSS colour. */
export function rgba(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
}

/** A width in the figure's units: `units`, but never less than `minPx` pixels, so a hairline survives the minimap. */
export const u = (r: number, units: number, minPx: number): number => Math.max(units, minPx / r);

type Stop = string | readonly [number, string];
function stops(g: CanvasGradient, cols: readonly Stop[]): CanvasGradient {
  cols.forEach((c, i) => (typeof c === 'string' ? g.addColorStop(cols.length < 2 ? 0 : i / (cols.length - 1), c) : g.addColorStop(c[0], c[1])));
  return g;
}
/** A linear gradient from (x0, y0) to (x1, y1); colours spread evenly, or at the positions given. */
export const lin = (ctx: Ctx, x0: number, y0: number, x1: number, y1: number, ...cols: Stop[]): CanvasGradient => stops(ctx.createLinearGradient(x0, y0, x1, y1), cols);
/** A radial gradient about (x, y) from `r0` to `r1`. */
export const rad = (ctx: Ctx, x: number, y: number, r0: number, r1: number, ...cols: Stop[]): CanvasGradient => stops(ctx.createRadialGradient(x, y, r0, x, y, r1), cols);

/** Light spilled on the air and ground about (x, y): `hex` at alpha `a` in the middle, nothing at `radius`. */
export function glow(ctx: Ctx, x: number, y: number, radius: number, hex: string, a: number): void {
  ctx.fillStyle = rad(ctx, x, y, 0, radius, rgba(hex, a), rgba(hex, a * 0.4), rgba(hex, 0));
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  ctx.fill();
}

/** The soft shadow a figure casts on the ground: an ellipse about (x, y), darkest in the middle. */
export function groundShadow(ctx: Ctx, x: number, y: number, rx: number, ry: number, a = 0.42): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, ry / rx);
  ctx.fillStyle = rad(ctx, 0, 0, 0, rx, `rgba(4,3,8,${a})`, `rgba(4,3,8,${a * 0.7})`, 'rgba(4,3,8,0)');
  ctx.beginPath();
  ctx.arc(0, 0, rx, 0, TAU);
  ctx.fill();
  ctx.restore();
}

/** A closed path through `pts` (begun here; not filled). */
export function poly(ctx: Ctx, pts: readonly Pt[]): void {
  ctx.beginPath();
  for (const [x, y] of pts) ctx.lineTo(x, y);
  ctx.closePath();
}

/** A face of a solid: a polygon, or a function that builds its path, and what fills it. */
export type Face = readonly [shape: readonly Pt[] | (() => void), fill: string | CanvasGradient];
const trace = (ctx: Ctx, shape: readonly Pt[] | (() => void)): void => (typeof shape === 'function' ? shape() : poly(ctx, shape));

/**
 * Draws a solid of several faces: first the dark halo about all of them, then each face in order, so a face drawn later covers an earlier one
 * and only the halo outside the whole is left. `halo` is its thickness in units (at least 2.2 px), half of it outside the figure.
 */
export function solid(ctx: Ctx, r: number, faces: readonly Face[], halo = 0.1): void {
  ctx.lineJoin = 'round';
  ctx.lineWidth = u(r, halo, 2.2);
  ctx.strokeStyle = EDGE;
  for (const [shape] of faces) {
    trace(ctx, shape);
    ctx.stroke();
  }
  for (const [shape, fill] of faces) {
    trace(ctx, shape);
    ctx.fillStyle = fill;
    ctx.fill();
  }
}

/** A line through `pts`, open, in `colour` `width` units wide (at least `minPx`): the lit edge of a cut face, a joint, a crack. */
export function stroke(ctx: Ctx, r: number, pts: readonly Pt[], colour: string, width: number, minPx = 0.7): void {
  ctx.beginPath();
  for (const [x, y] of pts) ctx.lineTo(x, y);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = u(r, width, minPx);
  ctx.strokeStyle = colour;
  ctx.stroke();
}

/** A point `k` of the way from `p` to `q`. */
export const mix = (p: Pt, q: Pt, k: number): Pt => [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k];
/** `p` moved by `d` scaled by `k`. */
export const shift = (p: Pt, d: Pt, k = 1): Pt => [p[0] + d[0] * k, p[1] + d[1] * k];

/** Puts a drop shadow of the next fills or strokes `px` pixels to the lower right in `colour`, which is how a cut line gets its lit lip. */
export function lip(ctx: Ctx, colour: string, px: number): void {
  ctx.shadowColor = colour;
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = px * 0.8;
  ctx.shadowOffsetY = px;
}

/** Ends a shadow set by `lip` or by a glow. */
export function unlip(ctx: Ctx): void {
  ctx.shadowColor = 'rgba(0,0,0,0)';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}
