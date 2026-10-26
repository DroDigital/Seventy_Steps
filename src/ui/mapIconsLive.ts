/**
 * The map's living marks (overhaul, 2026-10-25): someone met is a brass locket with a cameo in it, someone not yet spoken to a letter still sealed;
 * lost Echoes are a wisp in a small glass lamp; the story's lead is a brass key, with a ring of light that breathes out from it. See mapIcons.ts
 * for the rest, mapIconsMine.ts for the investigator's own and mapIconKit.ts for what they share.
 */

import { TAU, glow, groundShadow, lin, poly, rad, rgba, solid, stroke, u, type Ctx, type Pt } from './mapIconKit';

const IVORY: readonly string[] = ['#f6eed8', '#d3c7a4', '#8d8264'];

/** A person: met, a locket of brass on a short ring, a cameo of an ivory bust on blue enamel under glass; not met, a sealed letter, its wax dull, laid slantwise. */
export function person(ctx: Ctx, r: number, met: boolean): void {
  if (!met) return letter(ctx, r);
  groundShadow(ctx, 0.2, 0.92, 0.7, 0.14, 0.4);
  const [cy, rx, ry] = [0.22, 0.7, 0.8];
  const oval = (k: number, dy = 0) => (): void => {
    ctx.beginPath();
    ctx.ellipse(0, cy + dy, rx * k, ry * k, 0, 0, TAU);
  };
  const ringY = cy - ry - 0.12;
  ctx.lineWidth = u(r, 0.1, 1.6); // the ring it hangs from: halo first, then the metal
  ctx.strokeStyle = 'rgba(8,6,12,0.92)';
  ctx.beginPath();
  ctx.arc(0, ringY, 0.17, 0, TAU);
  ctx.stroke();
  ctx.lineWidth = u(r, 0.06, 0.8);
  ctx.strokeStyle = '#d9b45e';
  ctx.stroke();
  solid(ctx, r, [[oval(1), lin(ctx, -0.6, -0.5, 0.6, 0.95, '#fff0b8', '#cf9f48', '#7a5420', '#3d2a10')]], 0.1);
  oval(0.8)();
  ctx.fillStyle = lin(ctx, 0, -0.5, 0, 0.9, '#2b4a7a', '#14233f');
  ctx.fill();
  ctx.lineWidth = u(r, 0.03, 0.6);
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.stroke();
  ctx.save(); // the cameo: a head in profile facing left, a long neck and the sweep of the shoulders
  oval(0.8)();
  ctx.clip();
  const bust = (): void => {
    ctx.beginPath();
    ctx.arc(0.02, cy - 0.2, 0.19, 0, TAU);
    ctx.moveTo(-0.17, cy - 0.17);
    ctx.lineTo(-0.27, cy - 0.1);
    ctx.lineTo(-0.16, cy - 0.06);
    ctx.moveTo(0.12, cy - 0.04);
    ctx.lineTo(0.12, cy + 0.15);
    ctx.quadraticCurveTo(0.5, cy + 0.2, 0.55, cy + 0.7);
    ctx.lineTo(-0.55, cy + 0.7);
    ctx.quadraticCurveTo(-0.5, cy + 0.2, -0.1, cy + 0.15);
    ctx.lineTo(-0.1, cy);
    ctx.closePath();
  };
  bust();
  ctx.fillStyle = lin(ctx, -0.4, cy - 0.45, 0.4, cy + 0.6, ...IVORY);
  ctx.fill();
  ctx.fillStyle = 'rgba(30,20,10,0.35)'; // the hair, a knot at the nape
  ctx.beginPath();
  ctx.arc(0.13, cy - 0.28, 0.14, 0, TAU);
  ctx.fill();
  ctx.fillStyle = lin(ctx, -0.6, cy - 0.7, 0.2, cy + 0.2, 'rgba(255,255,255,0.4)', 'rgba(255,255,255,0)'); // the glass: a streak of daylight across it
  poly(ctx, [[-0.6, cy - 0.5], [-0.12, cy - 0.7], [-0.6, cy + 0.15]]);
  ctx.fill();
  ctx.restore();
  stroke(ctx, r, [[-0.5, cy + 0.45], [-0.62, cy], [-0.45, cy - 0.5], [-0.1, cy - 0.74]], 'rgba(255,255,255,0.55)', 0.045);
}

/** A letter not yet opened: cream paper, its flap folded to a point, the wax at the point; in the dim of what is not yet known. */
function letter(ctx: Ctx, r: number): void {
  ctx.save();
  ctx.rotate(-0.14);
  groundShadow(ctx, 0.2, 0.55, 0.95, 0.15, 0.4);
  const [w, h]: Pt = [0.9, 0.58];
  solid(ctx, r, [
    [[[-w, -h], [w, -h], [w, h], [-w, h]], lin(ctx, -w, -h, w, h, '#b7b09e', '#8c8676', '#5d594d')],
  ], 0.1);
  poly(ctx, [[-w, -h], [0, 0.12], [w, -h]]); // the flap
  ctx.fillStyle = lin(ctx, 0, -h, 0, 0.12, '#cfc8b4', '#9d9784');
  ctx.fill();
  stroke(ctx, r, [[-w, -h], [0, 0.12], [w, -h]], 'rgba(30,26,20,0.55)', 0.04);
  stroke(ctx, r, [[-w, h], [-0.34, -0.04]], 'rgba(30,26,20,0.3)', 0.03);
  stroke(ctx, r, [[w, h], [0.34, -0.04]], 'rgba(30,26,20,0.3)', 0.03);
  stroke(ctx, r, [[-w + 0.03, h - 0.03], [-w + 0.03, -h + 0.03], [w - 0.05, -h + 0.03]], 'rgba(255,255,255,0.35)', 0.035);
  const [sx, sy] = [0, 0.1];
  ctx.fillStyle = rad(ctx, sx - 0.06, sy - 0.07, 0, 0.3, '#a0605c', '#6a3031', '#3a171a'); // the wax: dull, with one sheen
  ctx.beginPath();
  ctx.arc(sx, sy, 0.24, 0, TAU);
  ctx.lineWidth = u(r, 0.05, 0.9);
  ctx.strokeStyle = 'rgba(8,6,12,0.9)';
  ctx.stroke();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,230,220,0.5)';
  ctx.beginPath();
  ctx.arc(sx - 0.08, sy - 0.08, u(r, 0.04, 0.5), 0, TAU);
  ctx.fill();
  ctx.restore();
}

/**
 * Lost Echoes: a small lamp, a ring to carry it by, a cap, a body of glass in a cage of brass and a foot, and in it a wisp of pale gold light
 * that breathes with `now`, its light spilled on the ground about it.
 */
export function echo(ctx: Ctx, r: number, now: number): void {
  const breath = 0.5 + 0.5 * Math.sin(now / 280);
  glow(ctx, 0, 0.1, 1.5 + 0.12 * breath, '#ffc65a', 0.4 + 0.18 * breath);
  groundShadow(ctx, 0.25, 0.98, 0.75, 0.15, 0.4);
  ctx.lineWidth = u(r, 0.1, 1.6);
  ctx.strokeStyle = 'rgba(8,6,12,0.92)';
  ctx.beginPath();
  ctx.arc(0, -0.98, 0.2, 0, TAU);
  ctx.stroke();
  ctx.lineWidth = u(r, 0.06, 0.8);
  ctx.strokeStyle = '#d9b45e';
  ctx.stroke();
  const brass = lin(ctx, -0.55, 0, 0.55, 0, '#fff0b8', '#c99a44', '#6c4a1c', '#3a280f');
  const glass = (): void => poly(ctx, [[-0.4, -0.5], [0.4, -0.5], [0.52, 0.12], [0.4, 0.66], [-0.4, 0.66], [-0.52, 0.12]]);
  solid(ctx, r, [
    [[[-0.2, -0.78], [0.2, -0.78], [0.46, -0.5], [-0.46, -0.5]], brass], // the cap
    [glass, rad(ctx, 0, 0.12, 0, 0.62, '#fff3c0', '#f7c860', '#9a5a1e', '#3b2412')],
    [[[-0.52, 0.66], [0.52, 0.66], [0.6, 0.86], [-0.6, 0.86]], brass], // the foot
  ], 0.1);
  glass();
  ctx.lineWidth = u(r, 0.045, 0.8);
  ctx.strokeStyle = '#c99a44'; // the cage's corner posts
  ctx.stroke();
  if (r > 9) for (const x of [-0.17, 0.17]) stroke(ctx, r, [[x, -0.5], [x, 0.66]], 'rgba(201,154,68,0.55)', 0.035); // the cage's bars
  const k = 1 + 0.12 * breath;
  ctx.fillStyle = rad(ctx, 0, 0.18, 0, 0.5 * k, '#ffffff', '#fff0b0', 'rgba(255,220,120,0)'); // the wisp, a flame's tail curling up
  ctx.beginPath();
  ctx.lineTo(0.02, -0.34 * k);
  ctx.bezierCurveTo(0.2, -0.05, 0.26, 0.2, 0.0, 0.34);
  ctx.bezierCurveTo(-0.26, 0.22, -0.18, -0.04, 0.02, -0.34 * k);
  ctx.fill();
  stroke(ctx, r, [[-0.34, -0.38], [-0.4, 0.1], [-0.34, 0.5]], 'rgba(255,255,255,0.6)', 0.05); // the glass's lit side
}

/** A thin kite of light from the middle out to `len` along the angle `a`, filled with the fade `fade` (a gradient up the figure's north). */
function ray(ctx: Ctx, a: number, len: number, width: number, fade: CanvasGradient): void {
  ctx.save();
  ctx.rotate(a);
  ctx.fillStyle = fade;
  poly(ctx, [[0, -len], [width, -0.1], [-width, -0.1]]);
  ctx.fill();
  ctx.restore();
}

/**
 * Where the story leads: a key of brass laid slantwise, its bow a ring with the ground showing through it, its shaft collared, its bit cut in two teeth;
 * long rays of cold light breathe out from it and a four-pointed star winks at its shoulder, so the eye is drawn to it across the map.
 */
export function lead(ctx: Ctx, r: number, now: number): void {
  const breath = 0.5 + 0.5 * Math.sin(now / 300);
  glow(ctx, 0, 0, 1.3, '#dff1ff', 0.3 + 0.12 * breath);
  const [far, near] = [lin(ctx, 0, 0, 0, -1.9, rgba('#f4fbff', 0.55 + 0.25 * breath), rgba('#dff1ff', 0)), lin(ctx, 0, 0, 0, -1.2, 'rgba(244,251,255,0.4)', 'rgba(223,241,255,0)')];
  for (const a of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) ray(ctx, a, 1.55 + 0.35 * breath, 0.1, far);
  for (const a of [Math.PI / 4, -Math.PI / 4, (3 * Math.PI) / 4, (-3 * Math.PI) / 4]) ray(ctx, a, 1.05 + 0.2 * (1 - breath), 0.07, near);
  groundShadow(ctx, 0.35, 0.95, 0.9, 0.14, 0.34);
  ctx.save();
  ctx.rotate(-Math.PI / 4);
  ctx.translate(0.02, 0);
  const metal = lin(ctx, 0, -0.34, 0, 0.34, '#fff6c8', '#e6b84e', '#9a6a22', '#47310f');
  const bow = (): void => {
    ctx.beginPath();
    ctx.arc(-0.74, 0, 0.34, 0, TAU); // a ring, its middle cut out of it with the opposite turn
    ctx.moveTo(-0.57, 0);
    ctx.arc(-0.74, 0, 0.17, 0, TAU, true);
  };
  const teeth: Pt[] = [[0.6, 0.08], [1.0, 0.08], [1.0, 0.4], [0.9, 0.4], [0.9, 0.24], [0.8, 0.24], [0.8, 0.4], [0.7, 0.4], [0.7, 0.24], [0.6, 0.24]];
  solid(ctx, r, [
    [bow, metal],
    [[[-0.42, -0.08], [1.0, -0.08], [1.0, 0.08], [-0.42, 0.08]], metal], // the shaft
    [teeth, metal], // the bit, two teeth cut in it
    [[[-0.34, -0.15], [-0.2, -0.15], [-0.2, 0.15], [-0.34, 0.15]], metal], // two collars
    [[[0.04, -0.13], [0.18, -0.13], [0.18, 0.13], [0.04, 0.13]], metal],
  ], 0.1);
  ctx.lineWidth = u(r, 0.04, 0.7);
  ctx.strokeStyle = '#fffbe0';
  ctx.beginPath();
  ctx.arc(-0.74, 0, 0.27, Math.PI * 1.1, Math.PI * 1.75); // the lit upper left of the ring
  ctx.stroke();
  ctx.strokeStyle = 'rgba(40,26,8,0.7)';
  ctx.beginPath();
  ctx.arc(-0.74, 0, 0.17, 0, TAU);
  ctx.stroke();
  stroke(ctx, r, [[-0.1, -0.045], [0.95, -0.045]], 'rgba(255,255,255,0.8)', 0.03);
  ctx.restore();
  const [gx, gy, gs] = [0.74, -0.78, 0.3 + 0.12 * breath]; // the glint
  ctx.fillStyle = rgba('#ffffff', 0.75 + 0.25 * breath);
  ctx.beginPath();
  ctx.lineTo(gx, gy - gs);
  ctx.quadraticCurveTo(gx, gy, gx + gs, gy);
  ctx.quadraticCurveTo(gx, gy, gx, gy + gs);
  ctx.quadraticCurveTo(gx, gy, gx - gs, gy);
  ctx.quadraticCurveTo(gx, gy, gx, gy - gs);
  ctx.fill();
}
