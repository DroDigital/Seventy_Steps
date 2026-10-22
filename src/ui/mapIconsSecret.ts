/**
 * The secrets of the land on the map (round 61; systems/pois.ts), in the map's own figures (round 60): a grey "?" on a dark token where
 * ground near one has been charted and it has not been found; once found, a figure of its kind in bone (dim once its chest is taken): a
 * ring for a tale, a square for a hoard, a triangle for a rite, a star for an anomaly, a cross for a den.
 */

import type { PoiKind } from '../data/pois';
import { BONE, DIM, token, TAU, type MarkState } from './mapIconKit';

function figure(ctx: CanvasRenderingContext2D, kind: PoiKind, x: number, y: number, r: number): void {
  ctx.beginPath();
  if (kind === 'tale') {
    ctx.arc(x, y, r * 0.5, 0, TAU);
    ctx.moveTo(x + r * 0.12, y);
    ctx.arc(x, y, r * 0.12, 0, TAU);
  } else if (kind === 'hoard') {
    ctx.rect(x - r * 0.45, y - r * 0.4, r * 0.9, r * 0.8);
    ctx.moveTo(x - r * 0.45, y - r * 0.06);
    ctx.lineTo(x + r * 0.45, y - r * 0.06);
  } else if (kind === 'rite') {
    ctx.moveTo(x, y - r * 0.55);
    ctx.lineTo(x + r * 0.52, y + r * 0.4);
    ctx.lineTo(x - r * 0.52, y + r * 0.4);
    ctx.closePath();
  } else if (kind === 'anomaly') {
    for (let k = 0; k < 4; k++) {
      const a = (k * Math.PI) / 4;
      ctx.moveTo(x - Math.sin(a) * r * 0.58, y - Math.cos(a) * r * 0.58);
      ctx.lineTo(x + Math.sin(a) * r * 0.58, y + Math.cos(a) * r * 0.58);
    }
  } else {
    ctx.moveTo(x - r * 0.45, y - r * 0.45);
    ctx.lineTo(x + r * 0.45, y + r * 0.45);
    ctx.moveTo(x + r * 0.45, y - r * 0.45);
    ctx.lineTo(x - r * 0.45, y + r * 0.45);
  }
}

/** A secret: a grey "?" until it is found (`rumour`), then its kind's figure (`poi`), dim once its chest is taken (`spent`). */
export function secret(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, s: MarkState): void {
  const colour = s.rumour || s.spent ? DIM : BONE;
  token(ctx, x, y, r * 1.1, colour);
  if (s.rumour || !s.poi) {
    ctx.font = `bold ${Math.round(r * 1.45)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = DIM;
    ctx.fillText('?', x, y + r * 0.06);
    return;
  }
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(1.2, r * 0.17);
  ctx.strokeStyle = colour;
  figure(ctx, s.poi, x, y, r);
  ctx.stroke();
}
