/**
 * The map's living marks (round 60): a bust for a person, a drop of brass light for lost Echoes, the diamond where the story leads, a small
 * stone for a place found, the investigator's own arrow, and the pin of their own marker. See mapIcons.ts for the rest and mapIconKit.ts for what they share.
 */

import { BONE, BRASS, DIM, TAU, VERDIGRIS, PIN_TIP, sheen, tint, token } from './mapIconKit';

/** A person: a bust on a small medallion (round 68: bare, it was lost on pale ground), bone once met, dim until then; lit from above, a collar's notch cut in the coat. */
export function person(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, met: boolean): void {
  const base = met ? BONE : DIM;
  token(ctx, x, y, r, base);
  const [head, shoulder] = [y - r * 0.2, y + r * 0.2];
  ctx.beginPath();
  ctx.arc(x, head, r * 0.26, 0, TAU);
  ctx.moveTo(x - r * 0.5, y + r * 0.62);
  ctx.quadraticCurveTo(x - r * 0.5, shoulder, x, shoulder);
  ctx.quadraticCurveTo(x + r * 0.5, shoulder, x + r * 0.5, y + r * 0.62);
  ctx.closePath();
  ctx.fillStyle = sheen(ctx, head - r * 0.26, y + r * 0.62, base, 0.4, 0.4);
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.26)'; // the collar's V
  ctx.beginPath();
  ctx.moveTo(x - r * 0.12, shoulder + r * 0.02);
  ctx.lineTo(x, y + r * 0.36);
  ctx.lineTo(x + r * 0.12, shoulder + r * 0.02);
  ctx.closePath();
  ctx.fill();
}

/** Lost Echoes: a drop of brass light, a flame's tail, breathing: lit from within, with a glint's four-pointed star off its shoulder. */
export function echo(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, now: number): void {
  const k = r * (1 + 0.08 * Math.sin(now / 280));
  ctx.save();
  ctx.translate(x, y);
  ctx.shadowColor = BRASS;
  ctx.shadowBlur = r * 1.6;
  ctx.beginPath();
  ctx.moveTo(0, -k * 1.05);
  ctx.bezierCurveTo(k * 0.35, -k * 0.5, k * 0.7, k * 0.05, k * 0.55, k * 0.5);
  ctx.bezierCurveTo(k * 0.4, k * 0.9, -k * 0.4, k * 0.9, -k * 0.55, k * 0.5);
  ctx.bezierCurveTo(-k * 0.7, k * 0.05, -k * 0.35, -k * 0.5, 0, -k * 1.05);
  ctx.closePath();
  ctx.lineJoin = 'round';
  ctx.lineWidth = 2.4;
  ctx.strokeStyle = 'rgba(0,0,0,0.7)';
  ctx.stroke();
  const body = ctx.createRadialGradient(-k * 0.2, -k * 0.1, k * 0.05, 0, k * 0.1, k * 1.05);
  body.addColorStop(0, '#fff3c4');
  body.addColorStop(0.45, BRASS);
  body.addColorStop(1, tint(BRASS, -0.5));
  ctx.fillStyle = body;
  ctx.fill();
  ctx.shadowBlur = 0;
  const core = ctx.createRadialGradient(0, k * 0.3, 0, 0, k * 0.3, k * 0.38); // the flame's heart
  core.addColorStop(0, '#ffffff');
  core.addColorStop(0.5, 'rgba(255,244,200,0.9)');
  core.addColorStop(1, 'rgba(255,244,200,0)');
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(0, k * 0.3, k * 0.38, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#f6ecc4'; // a glint off its upper edge: a star of four points
  const [gx, gy, gs] = [k * 0.95, -k * 0.75, k * 0.32];
  ctx.beginPath();
  ctx.moveTo(gx, gy - gs);
  ctx.quadraticCurveTo(gx, gy, gx + gs, gy);
  ctx.quadraticCurveTo(gx, gy, gx, gy + gs);
  ctx.quadraticCurveTo(gx, gy, gx - gs, gy);
  ctx.quadraticCurveTo(gx, gy, gx, gy - gs);
  ctx.fill();
  ctx.restore();
}

/** Where the story leads: a cut bone jewel, its four faces lit from the upper left, with a ring that breathes out from it. */
export function lead(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, now: number): void {
  const breath = 0.5 + 0.5 * Math.sin(now / 300);
  ctx.save();
  ctx.globalAlpha = 0.55 * (1 - breath);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = BONE;
  ctx.beginPath();
  ctx.arc(x, y, r * (1.1 + 0.9 * breath), 0, TAU);
  ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.translate(x, y);
  const [w, h] = [r * 0.8, r];
  ctx.beginPath();
  ctx.moveTo(0, -h);
  ctx.lineTo(w, 0);
  ctx.lineTo(0, h);
  ctx.lineTo(-w, 0);
  ctx.closePath();
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(3.5, r * 0.5);
  ctx.strokeStyle = 'rgba(0,0,0,0.8)';
  ctx.stroke();
  const t = 0.42; // the table, the flat top of the cut stone, and the four faces that slope down from it to the girdle
  const corners: readonly (readonly [number, number])[] = [[0, -h], [w, 0], [0, h], [-w, 0]];
  const lit = [0.7, 0.05, -0.45, -0.1]; // each face from the upper right about by the clock: how much light it takes
  for (let i = 0; i < 4; i++) {
    const [[ax, ay], [bx, by]] = [corners[(i + 3) % 4], corners[i]];
    ctx.fillStyle = tint(BONE, lit[i]);
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.lineTo(bx * t, by * t);
    ctx.lineTo(ax * t, ay * t);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = tint(BONE, 0.85);
  ctx.beginPath();
  corners.forEach(([cx, cy], i) => (i ? ctx.lineTo(cx * t, cy * t) : ctx.moveTo(cx * t, cy * t)));
  ctx.closePath();
  ctx.fill();
  ctx.lineWidth = Math.max(0.7, r * 0.07);
  ctx.strokeStyle = 'rgba(11,10,14,0.5)'; // the edges between the faces
  ctx.beginPath();
  for (const [cx, cy] of corners) {
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx * t, cy * t);
  }
  ctx.stroke();
  ctx.lineWidth = Math.max(1.2, r * 0.16);
  ctx.strokeStyle = tint(BONE, 0.2);
  ctx.beginPath();
  corners.forEach(([cx, cy], i) => (i ? ctx.lineTo(cx, cy) : ctx.moveTo(cx, cy)));
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

/** A place found, named: a standing stone, its lit side to the upper left, set in a small ring. */
export function place(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  token(ctx, x, y, r * 0.62, DIM);
  ctx.fillStyle = sheen(ctx, y - r * 0.4, y + r * 0.34, BONE, 0.3, 0.4);
  ctx.beginPath();
  ctx.moveTo(x - r * 0.2, y + r * 0.34);
  ctx.lineTo(x - r * 0.14, y - r * 0.3);
  ctx.lineTo(x, y - r * 0.4);
  ctx.lineTo(x + r * 0.14, y - r * 0.3);
  ctx.lineTo(x + r * 0.2, y + r * 0.34);
  ctx.closePath();
  ctx.fill();
}

/** The investigator's arrow, `turn` radians about its centre, in a faint ring so it is found in a crowd: folded down its middle, the left face lit and the right in shade. */
export function you(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, turn: number): void {
  const glow = ctx.createRadialGradient(x, y, r * 0.3, x, y, r * 1.9);
  glow.addColorStop(0, 'rgba(217,208,184,0.5)');
  glow.addColorStop(1, 'rgba(217,208,184,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, r * 1.9, 0, TAU);
  ctx.fill();
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(turn); // yaw 0 faces north (up); +x, a quarter turn of yaw, is on the left
  ctx.beginPath();
  ctx.moveTo(0, -r * 1.05);
  ctx.lineTo(r * 0.75, r * 0.8);
  ctx.lineTo(0, r * 0.4);
  ctx.lineTo(-r * 0.75, r * 0.8);
  ctx.closePath();
  ctx.lineJoin = 'round';
  ctx.lineWidth = 2.6;
  ctx.strokeStyle = '#000';
  ctx.stroke();
  for (const side of [-1, 1]) { // the two faces of the fold
    ctx.fillStyle = side < 0 ? tint(BONE, 0.5) : tint(BONE, -0.25);
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.05);
    ctx.lineTo(side * r * 0.75, r * 0.8);
    ctx.lineTo(0, r * 0.4);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/** The marker: a pin of verdigris metal, its point on the place, its head ringed with a small flag in it and a glint on its shoulder. (x, y) is the head's centre. */
export function marker(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.shadowColor = VERDIGRIS;
  ctx.shadowBlur = r * 1.1;
  ctx.beginPath();
  ctx.moveTo(0, r * PIN_TIP);
  ctx.bezierCurveTo(-r * 0.2, r * 0.95, -r * 0.95, r * 0.55, -r * 0.95, 0);
  ctx.arc(0, 0, r * 0.95, Math.PI, 0);
  ctx.bezierCurveTo(r * 0.95, r * 0.55, r * 0.2, r * 0.95, 0, r * PIN_TIP);
  ctx.closePath();
  ctx.lineJoin = 'round';
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(0,0,0,0.75)';
  ctx.stroke();
  const face = ctx.createRadialGradient(-r * 0.3, -r * 0.4, r * 0.05, 0, 0, r * 1.1);
  face.addColorStop(0, tint(VERDIGRIS, -0.55));
  face.addColorStop(1, tint(VERDIGRIS, -0.9));
  ctx.fillStyle = face;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = Math.max(1.3, r * 0.17);
  ctx.strokeStyle = sheen(ctx, -r, r * PIN_TIP, VERDIGRIS, 0.5, 0.45);
  ctx.stroke();
  ctx.fillStyle = sheen(ctx, -r * 0.55, r * 0.5, VERDIGRIS, 0.5, 0.2); // a pennant on its staff
  ctx.beginPath();
  ctx.moveTo(-r * 0.3, r * 0.5);
  ctx.lineTo(-r * 0.3, -r * 0.55);
  ctx.lineTo(r * 0.5, -r * 0.2);
  ctx.lineTo(-r * 0.12, r * 0.05);
  ctx.lineTo(-r * 0.12, r * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath(); // a glint along the head's lit shoulder
  ctx.arc(0, 0, r * 0.95, Math.PI * 1.08, Math.PI * 1.5);
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(0.8, r * 0.1);
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.stroke();
  ctx.restore();
}
