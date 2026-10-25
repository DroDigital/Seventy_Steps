/**
 * The secrets of the land on the map (round 61; systems/pois.ts), in the map's own figures (round 60), set on no token (a later round: "more
 * subtlety"): a plain white "?" where ground near one has been charted and it has not been found; once found, a figure of its kind in a faint grey
 * (fainter once its chest is taken): a ring for a tale, a square for a hoard, a triangle for a rite, a star for an anomaly, a cross for a den.
 */

import type { PoiKind } from '../data/pois';
import { SERIF } from './hudKit';
import { TAU, type MarkState } from './mapIconKit';

const WHITE = '#ffffff';
const FOUND = 'rgba(158,156,150,0.55)'; // a secret found: a faint grey
const SPENT = 'rgba(158,156,150,0.34)'; // and its chest taken: fainter still
const EDGE = 'rgba(0,0,0,0.7)'; // a thin dark edge about each stroke, so a bare figure is read on ground of any light

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

/** A secret: a plain white "?" until it is found (`rumour`), then its kind's figure (`poi`) in a faint grey, fainter once its chest is taken (`spent`). */
export function secret(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, s: MarkState): void {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (s.rumour || !s.poi) {
    ctx.font = `bold ${Math.round(r * 1.9)}px ${SERIF}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = Math.max(2.4, r * 0.34);
    ctx.strokeStyle = EDGE;
    ctx.strokeText('?', x, y + r * 0.06);
    ctx.fillStyle = WHITE;
    [ctx.shadowColor, ctx.shadowBlur] = ['rgba(255,244,214,0.55)', r * 0.7]; // a breath of light about it
    ctx.fillText('?', x, y + r * 0.06);
    return;
  }
  const width = Math.max(1.2, r * 0.17);
  figure(ctx, s.poi, x, y, r);
  ctx.lineWidth = width + 2;
  ctx.strokeStyle = EDGE;
  ctx.stroke();
  ctx.lineWidth = width;
  ctx.strokeStyle = s.spent ? SPENT : FOUND;
  ctx.stroke();
}
