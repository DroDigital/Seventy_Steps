/**
 * The map's living marks (round 60): a bust for a person, a drop of brass light for lost Echoes, the diamond where the story leads, a small
 * stone for a place found, the investigator's own arrow, and the pin of their own marker. See mapIcons.ts for the rest and mapIconKit.ts for what they share.
 */

import { BONE, BRASS, DIM, TAU, VERDIGRIS, PIN_TIP } from './mapIconKit';


export function person(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, met: boolean): void {
  const [head, shoulder] = [y - r * 0.3, y + r * 0.1];
  const bust = (): void => {
    ctx.beginPath();
    ctx.arc(x, head, r * 0.34, 0, TAU);
    ctx.moveTo(x - r * 0.7, y + r * 0.7);
    ctx.quadraticCurveTo(x - r * 0.7, shoulder, x, shoulder);
    ctx.quadraticCurveTo(x + r * 0.7, shoulder, x + r * 0.7, y + r * 0.7);
    ctx.closePath();
  };
  bust();
  ctx.lineJoin = 'round';
  ctx.lineWidth = 2.6;
  ctx.strokeStyle = 'rgba(0,0,0,0.85)';
  ctx.stroke();
  ctx.fillStyle = met ? BONE : DIM;
  ctx.fill();
}

/** Lost Echoes: a drop of brass light, a flame's tail, breathing. */
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
  ctx.lineWidth = 2.4;
  ctx.strokeStyle = 'rgba(0,0,0,0.7)';
  ctx.stroke();
  ctx.fillStyle = BRASS;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#f6ecc4';
  ctx.beginPath();
  ctx.arc(0, k * 0.3, k * 0.2, 0, TAU);
  ctx.fill();
  ctx.restore();
}

/** Where the story leads: a bone diamond with a ring that breathes out from it. */
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
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.lineTo(r * 0.8, 0);
  ctx.lineTo(0, r);
  ctx.lineTo(-r * 0.8, 0);
  ctx.closePath();
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(3.5, r * 0.5);
  ctx.strokeStyle = 'rgba(0,0,0,0.8)';
  ctx.stroke();
  ctx.fillStyle = 'rgba(11,10,14,0.75)';
  ctx.fill();
  ctx.lineWidth = Math.max(1.6, r * 0.22);
  ctx.strokeStyle = BONE;
  ctx.stroke();
  ctx.fillStyle = BONE;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.2, 0, TAU);
  ctx.fill();
  ctx.restore();
}

/** A place found, named: a small round stone. */
export function place(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(0,0,0,0.8)';
  ctx.fillStyle = DIM;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.3, 0, TAU);
  ctx.stroke();
  ctx.fill();
}

/** The investigator's arrow, `turn` radians about its centre, in a faint ring so it is found in a crowd. */
export function you(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, turn: number): void {
  const glow = ctx.createRadialGradient(x, y, r * 0.3, x, y, r * 1.9);
  glow.addColorStop(0, 'rgba(217,208,184,0.38)');
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
  ctx.lineWidth = 2.4;
  ctx.strokeStyle = '#000';
  ctx.stroke();
  ctx.fillStyle = BONE;
  ctx.fill();
  ctx.restore();
}

/** The marker: a pin, its point on the place, its head ringed in verdigris with a small flag in it. (x, y) is the head's centre. */
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
  ctx.fillStyle = 'rgba(11,10,14,0.9)';
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = Math.max(1.3, r * 0.17);
  ctx.strokeStyle = VERDIGRIS;
  ctx.stroke();
  ctx.fillStyle = VERDIGRIS; // a pennant on its staff
  ctx.beginPath();
  ctx.moveTo(-r * 0.3, r * 0.5);
  ctx.lineTo(-r * 0.3, -r * 0.55);
  ctx.lineTo(r * 0.5, -r * 0.2);
  ctx.lineTo(-r * 0.12, r * 0.05);
  ctx.lineTo(-r * 0.12, r * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
