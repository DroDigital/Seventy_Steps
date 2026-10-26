/**
 * The secrets of the land on the map (round 61; systems/pois.ts), in the map's own figures and in a quiet voice (a later round: "more subtlety";
 * redrawn with the rest, 2026-10-25): a plain white "?" where ground near one has been charted and it has not been found; once found, a small
 * pewter thing of its kind, half seen (fainter once its chest is taken): an open book for a tale, a coffer for a hoard, a candle for a rite, a
 * four-pointed spark for an anomaly, a skull for a den.
 */

import type { PoiKind } from '../data/pois';
import { TAU, lin, poly, rad, solid, stroke, u, unlip, type Ctx, type MarkState, type Pt } from './mapIconKit';

const PEWTER: readonly string[] = ['#cfcdc4', '#9a988e', '#5c5b55'];

/** A plain white "?", drawn as a path: a hook over a stem and a dot, with a dark halo and a breath of light. */
function rumour(ctx: Ctx, r: number): void {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const mark = (): void => {
    ctx.beginPath();
    ctx.arc(0, -0.36, 0.33, Math.PI * 1.02, Math.PI * 2.4);
    ctx.bezierCurveTo(0.12, 0.0, 0.0, 0.04, 0, 0.2);
  };
  const dot = (): void => {
    ctx.beginPath();
    ctx.arc(0, 0.58, 0.085, 0, TAU);
  };
  ctx.strokeStyle = 'rgba(8,6,12,0.85)';
  ctx.fillStyle = 'rgba(8,6,12,0.85)';
  ctx.lineWidth = u(r, 0.36, 3);
  mark();
  ctx.stroke();
  dot();
  ctx.stroke();
  [ctx.shadowColor, ctx.shadowBlur] = ['rgba(255,244,214,0.6)', r * 0.7];
  ctx.strokeStyle = '#fffaf0';
  ctx.lineWidth = u(r, 0.2, 1.7);
  mark();
  ctx.stroke();
  unlip(ctx);
  dot();
  ctx.fillStyle = '#fffaf0';
  ctx.fill();
}

const FIGURES: Record<PoiKind, (ctx: Ctx, r: number) => void> = {
  tale(ctx, r) { // an open book
    const [lp, rp]: Pt[][] = [[[-0.62, -0.3], [0, -0.16], [0, 0.4], [-0.62, 0.26]], [[0, -0.16], [0.62, -0.3], [0.62, 0.26], [0, 0.4]]];
    solid(ctx, r, [
      [[[-0.7, -0.34], [0, -0.2], [0.7, -0.34], [0.7, 0.4], [0, 0.56], [-0.7, 0.4]], lin(ctx, -0.7, -0.3, 0.7, 0.5, '#7b7468', '#443f37')],
      [lp, lin(ctx, -0.6, -0.3, 0, 0.4, '#f1eee2', '#bdb9a8')],
      [rp, lin(ctx, 0, -0.3, 0.6, 0.4, '#d9d5c6', '#9b978a')],
    ], 0.12);
    for (const y of [-0.02, 0.1, 0.22]) {
      stroke(ctx, r, [[-0.5, y - 0.1], [-0.1, y + 0.0]], 'rgba(60,56,48,0.5)', 0.03, 0.5);
      stroke(ctx, r, [[0.1, y + 0.0], [0.5, y - 0.1]], 'rgba(60,56,48,0.4)', 0.03, 0.5);
    }
    stroke(ctx, r, [[0, -0.16], [0, 0.4]], 'rgba(40,36,30,0.6)', 0.04, 0.6);
  },
  hoard(ctx, r) { // a coffer with a domed lid, its strap and lock
    const lid = (): void => {
      ctx.beginPath();
      ctx.lineTo(-0.6, 0);
      ctx.quadraticCurveTo(0, -0.78, 0.6, 0);
      ctx.closePath();
    };
    solid(ctx, r, [
      [[[0.6, 0], [0.8, -0.12], [0.8, 0.4], [0.6, 0.52]], '#4f4d46'], // its side
      [[[-0.6, 0], [0.6, 0], [0.6, 0.52], [-0.6, 0.52]], lin(ctx, -0.6, 0, 0.6, 0.5, '#aaa79b', '#6a685f', '#3e3d38')],
      [lid, lin(ctx, -0.5, -0.5, 0.5, 0, ...PEWTER)],
      [[[-0.6, 0], [0.6, 0], [0.8, -0.12], [-0.4, -0.12]], '#cfcdc4'], // (the lid's lip, catching the light)
    ], 0.12);
    for (const x of [-0.36, 0.36]) stroke(ctx, r, [[x, -0.36 + Math.abs(x) * 0.5], [x, 0.52]], 'rgba(30,28,24,0.65)', 0.08, 0.8);
    stroke(ctx, r, [[-0.6, 0], [0.6, 0]], 'rgba(30,28,24,0.6)', 0.05, 0.7);
    poly(ctx, [[-0.12, -0.08], [0.12, -0.08], [0.12, 0.16], [-0.12, 0.16]]);
    ctx.fillStyle = '#efe6c4';
    ctx.fill();
    stroke(ctx, r, [[0, 0.0], [0, 0.1]], '#2a2822', 0.05, 0.6);
    stroke(ctx, r, [[-0.5, -0.2], [-0.24, -0.42]], 'rgba(255,255,255,0.55)', 0.04);
  },
  rite(ctx, r) { // a candle on a dish, lit
    solid(ctx, r, [
      [() => {
        ctx.beginPath();
        ctx.ellipse(0, 0.5, 0.46, 0.12, 0, 0, TAU);
      }, lin(ctx, -0.4, 0.4, 0.4, 0.6, '#aaa79b', '#55534c')],
      [[[-0.14, -0.3], [0.14, -0.3], [0.14, 0.5], [-0.14, 0.5]], lin(ctx, -0.14, 0, 0.14, 0, '#f0ede0', '#c4c0ae', '#7b786c')],
    ], 0.12);
    ctx.fillStyle = rad(ctx, 0, -0.52, 0, 0.3, '#ffffff', '#f6efd0', 'rgba(240,230,190,0)');
    ctx.beginPath();
    ctx.lineTo(0, -0.88);
    ctx.bezierCurveTo(0.18, -0.6, 0.18, -0.38, 0, -0.34);
    ctx.bezierCurveTo(-0.18, -0.38, -0.16, -0.6, 0, -0.88);
    ctx.fill();
    stroke(ctx, r, [[0, -0.3], [0, -0.38]], '#1a1814', 0.04, 0.6);
  },
  anomaly(ctx, r) { // a spark of four points
    const star: Pt[] = [[0, -0.8], [0.15, -0.15], [0.8, 0], [0.15, 0.15], [0, 0.8], [-0.15, 0.15], [-0.8, 0], [-0.15, -0.15]];
    solid(ctx, r, [[star, lin(ctx, -0.5, -0.5, 0.5, 0.5, '#e6e4dc', '#9b998f', '#585751')]], 0.12);
    for (const [pts, fill] of [
      [[[0, -0.8], [0.15, -0.15], [0, 0]], 'rgba(255,255,255,0.45)'],
      [[[-0.8, 0], [-0.15, -0.15], [0, 0]], 'rgba(255,255,255,0.3)'],
      [[[0, 0.8], [0.15, 0.15], [0, 0]], 'rgba(0,0,0,0.25)'],
      [[[0.8, 0], [0.15, 0.15], [0, 0]], 'rgba(0,0,0,0.3)'],
    ] as const) {
      poly(ctx, pts);
      ctx.fillStyle = fill;
      ctx.fill();
    }
  },
  den(ctx, r) { // a skull
    solid(ctx, r, [
      [[[-0.27, 0.16], [0.27, 0.16], [0.24, 0.56], [-0.24, 0.56]], lin(ctx, -0.3, 0.2, 0.3, 0.55, '#bdbab0', '#6d6b63')],
      [() => {
        ctx.beginPath();
        ctx.arc(0, -0.12, 0.46, 0, TAU);
      }, rad(ctx, -0.15, -0.3, 0, 0.7, '#f1efe6', '#bab7ab', '#6c6a62')],
    ], 0.12);
    ctx.fillStyle = '#121014';
    for (const x of [-0.17, 0.17]) {
      ctx.beginPath();
      ctx.arc(x, -0.06, u(r, 0.12, 0.9), 0, TAU);
      ctx.fill();
    }
    poly(ctx, [[0, 0.06], [0.07, 0.2], [-0.07, 0.2]]);
    ctx.fill();
    for (const x of [-0.1, 0, 0.1]) stroke(ctx, r, [[x, 0.38], [x, 0.56]], 'rgba(20,18,16,0.6)', 0.03, 0.5);
  },
};

/** A secret: a plain white "?" until it is found (`rumour`), then its kind's pewter figure (`poi`), fainter once its chest is taken (`spent`). */
export function secret(ctx: Ctx, r: number, s: MarkState): void {
  if (s.rumour || !s.poi) return rumour(ctx, r);
  ctx.globalAlpha = s.spent ? 0.42 : 0.76;
  FIGURES[s.poi](ctx, r);
}
