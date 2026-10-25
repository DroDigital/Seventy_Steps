/**
 * A horror's lair (overhaul, 2026-10-25): a great eye set in a plate of bone, two horns sweeping up from its brow and the tentacles it is rooted in
 * hanging below. Living, the eye is open and lit from within, a slit pupil in a crimson iris; slain, the lid is down and its lashes hang, the bone is
 * cracked and grey, a horn snapped, the tentacles let fall. A dungeon carries it small on its upper right, so it must read at five pixels: its
 * horns, its colour and its dark skirt. (The living eye's slit is the one `ellipse` of the mark; a slain one is drawn without.)
 */

import { TAU, glow, groundShadow, lin, mix, rad, rgba, solid, stroke, u, type Ctx, type Pt } from './mapIconKit';

type Curve = readonly [Pt, Pt, Pt, Pt];

/** A point on a cubic. */
function bez(c: Curve, t: number): Pt {
  const [a, b, d] = [mix(c[0], c[1], t), mix(c[1], c[2], t), mix(c[2], c[3], t)];
  return mix(mix(a, b, t), mix(b, d, t), t);
}

/** The outline of a tapering form along `c`, `w0` wide at its root and `w1` at its tip, as a polygon. */
function taper(c: Curve, w0: number, w1: number): Pt[] {
  const [left, right]: Pt[][] = [[], []];
  const n = 12;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const [p, q] = [bez(c, Math.max(0, t - 0.04)), bez(c, Math.min(1, t + 0.04))];
    const len = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1;
    const [nx, ny] = [-(q[1] - p[1]) / len, (q[0] - p[0]) / len];
    const w = (w0 + (w1 - w0) * t) / 2;
    const m = bez(c, t);
    left.push([m[0] + nx * w, m[1] + ny * w]);
    right.push([m[0] - nx * w, m[1] - ny * w]);
  }
  return [...left, ...right.reverse()];
}

const mirror = (c: Curve): Curve => [c[0], c[1], c[2], c[3]].map(([x, y]): Pt => [-x, y]) as unknown as Curve;

const ARMS: readonly Curve[] = [
  [[-0.5, 0.4], [-1.2, 0.7], [-1.3, 0.15], [-0.98, 0.02]],
  [[-0.22, 0.55], [-0.5, 1.3], [-1.0, 1.2], [-0.86, 0.8]],
];
const LIMP: readonly Curve[] = [
  [[-0.5, 0.4], [-0.95, 0.75], [-1.12, 0.95], [-0.95, 1.12]],
  [[-0.22, 0.55], [-0.4, 0.95], [-0.5, 1.1], [-0.3, 1.2]],
];
const HORN: Curve = [[-0.52, -0.36], [-1.12, -0.28], [-1.36, -0.86], [-0.96, -1.16]];
const STUMP: Curve = [[-0.52, -0.36], [-0.84, -0.34], [-1.02, -0.48], [-1.1, -0.66]];

/** The plate of bone: a squared oval, a little wider than tall, with a chin. */
function plate(): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i < 28; i++) {
    const a = (i * TAU) / 28;
    const [c, s] = [Math.cos(a), Math.sin(a)];
    pts.push([0.9 * Math.sign(c) * Math.abs(c) ** 0.72, -0.04 + 0.66 * Math.sign(s) * Math.abs(s) ** 0.72 * (s > 0 ? 1.04 : 1)]);
  }
  return pts;
}

/** The path of an almond `w` from its middle to either corner and `h` high at most: the opening of the eye (`lid` 1) or its shut lid, full below (`lid` -1). */
function almond(ctx: Ctx, w: number, h: number, lid = 1): void {
  ctx.beginPath();
  ctx.lineTo(-w, 0);
  ctx.quadraticCurveTo(0, -h * 2 * lid, w, 0);
  ctx.quadraticCurveTo(0, h * 2 * lid, -w, 0);
  ctx.closePath();
}

/** A horror's eye: open and lit from within when it lives, shut, cracked and grey when it is slain. */
export function eye(ctx: Ctx, r: number, slain: boolean): void {
  const bone = slain ? ['#c4beb0', '#8f8a7b', '#4d4a42'] : ['#f4ecd4', '#cdc19c', '#756b50'];
  const flesh = slain ? ['#5f5968', '#33303a'] : ['#8f2a5c', '#2b0b21'];
  if (!slain) glow(ctx, 0, 0, 1.6, '#ff2a78', 0.4);
  groundShadow(ctx, 0.3, 1.1, 1.1, 0.2);
  const arms = [...(slain ? LIMP : ARMS), ...(slain ? LIMP : ARMS).map(mirror)];
  solid(ctx, r, arms.map((c): [Pt[], CanvasGradient] => [taper(c, 0.26, 0.05), lin(ctx, 0, 0.4, 0, 1.25, ...flesh)]), 0.09);
  if (r > 10) for (const c of arms) for (const t of [0.3, 0.5, 0.7]) { // the suckers along each one's inner side
    const [p, q] = [bez(c, t), bez(c, t + 0.04)];
    const len = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1;
    ctx.fillStyle = rgba(slain ? '#a8a2b0' : '#f1b6cf', 0.55);
    ctx.beginPath();
    ctx.arc(p[0] + ((q[1] - p[1]) / len) * 0.05, p[1] - ((q[0] - p[0]) / len) * 0.05, u(r, 0.022, 0.5), 0, TAU);
    ctx.fill();
  }
  const horns: Pt[][] = slain ? [taper(STUMP, 0.3, 0.14), taper(mirror(HORN), 0.3, 0.03)] : [taper(HORN, 0.3, 0.03), taper(mirror(HORN), 0.3, 0.03)];
  const hornFill = lin(ctx, -1.2, -1.2, 1.2, -0.3, ...bone);
  solid(ctx, r, [
    ...horns.map((h): [Pt[], CanvasGradient] => [h, hornFill]),
    [[[-0.2, -0.56], [0, -1.0], [0.2, -0.56]], hornFill], // a small crest between them
    [plate(), lin(ctx, -0.9, -0.7, 0.9, 0.7, ...bone)],
  ], 0.1);
  const [w, h] = [0.72, 0.34];
  stroke(ctx, r, [[-0.52, -0.38], [-0.86, -0.3]], 'rgba(0,0,0,0.3)', 0.05); // where each horn grows from the brow
  stroke(ctx, r, [[0.52, -0.38], [0.86, -0.3]], 'rgba(0,0,0,0.3)', 0.05);
  if (slain) {
    almond(ctx, w + 0.06, h + 0.04, 1); // the socket's shadowed rim
    ctx.lineWidth = u(r, 0.12, 1.4);
    ctx.strokeStyle = 'rgba(30,26,30,0.5)';
    ctx.stroke();
    almond(ctx, w, h * 0.7, -1); // the lid, drawn down: fuller below its seam than above
    ctx.fillStyle = lin(ctx, 0, -0.3, 0, 0.35, '#8d8798', '#4b4655', '#2c2833');
    ctx.fill();
    ctx.lineWidth = u(r, 0.06, 1);
    ctx.strokeStyle = 'rgba(8,6,12,0.9)';
    ctx.stroke();
    stroke(ctx, r, [[-w, 0], [-0.5, 0.1], [-0.2, 0.14], [0.2, 0.14], [0.5, 0.1], [w, 0]], '#14121a', 0.07, 1.1); // the seam of the shut lid
    for (const x of [-0.56, -0.28, 0, 0.28, 0.56]) stroke(ctx, r, [[x, 0.13 - 0.08 * Math.abs(x)], [x * 1.07, 0.3 - 0.12 * Math.abs(x)]], '#14121a', 0.045, 0.8); // its lashes, hanging
    stroke(ctx, r, [[-0.3, -0.62], [-0.22, -0.42], [-0.32, -0.3], [-0.24, -0.2]], '#1d1b20', 0.045, 0.9); // a crack down the bone
    stroke(ctx, r, [[0.5, 0.36], [0.4, 0.2], [0.52, 0.08]], '#1d1b20', 0.04, 0.9);
    stroke(ctx, r, [[-0.84, -0.1], [-0.66, -0.46], [-0.3, -0.62]], 'rgba(255,255,255,0.28)', 0.035);
    return;
  }
  if (r > 9) { // old bone: a hairline crack or two and a pitting
    stroke(ctx, r, [[0.42, 0.36], [0.5, 0.2], [0.44, 0.1]], 'rgba(60,40,20,0.45)', 0.03);
    stroke(ctx, r, [[-0.5, -0.42], [-0.4, -0.3], [-0.46, -0.2]], 'rgba(60,40,20,0.4)', 0.03);
    ctx.fillStyle = 'rgba(60,40,20,0.35)';
    for (const [px, py] of [[-0.62, 0.34], [0.64, -0.34], [0.2, 0.5]] as const) {
      ctx.beginPath();
      ctx.arc(px, py, u(r, 0.025, 0.5), 0, TAU);
      ctx.fill();
    }
  }
  almond(ctx, w + 0.07, h + 0.05, 1); // the socket sunk in the bone, dark about its rim
  ctx.lineWidth = u(r, 0.13, 1.5);
  ctx.strokeStyle = 'rgba(48,18,24,0.6)';
  ctx.stroke();
  almond(ctx, w, h, 1);
  ctx.fillStyle = '#12040c';
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = rad(ctx, -0.12, -0.08, 0, 0.85, '#fff2f2', '#f2c4cc', '#b8305a', '#5e0f2e');
  ctx.fillRect(-w, -h, w * 2, h * 2);
  if (r > 9) for (const [vx, vy] of [[-0.64, -0.08], [-0.56, 0.1], [0.62, -0.1], [0.56, 0.1]] as const) stroke(ctx, r, [[vx, vy], [vx * 0.66, vy * 0.6], [vx * 0.5, vy * 0.45]], 'rgba(150,20,60,0.55)', 0.03, 0.5);
  ctx.fillStyle = rad(ctx, -0.04, -0.06, 0, 0.34, '#ffb0d0', '#ff3a86', '#c20062', '#6d0036');
  ctx.beginPath();
  ctx.arc(0, 0, 0.32, 0, TAU);
  ctx.fill();
  ctx.lineWidth = u(r, 0.04, 0.7);
  ctx.strokeStyle = 'rgba(70,0,30,0.8)';
  ctx.stroke();
  ctx.fillStyle = '#05000a';
  ctx.beginPath();
  ctx.ellipse(0, 0, 0.08, 0.29, 0, 0, TAU); // the slit
  ctx.fill();
  ctx.fillStyle = lin(ctx, 0, -h, 0, 0.05, 'rgba(10,0,10,0.6)', 'rgba(10,0,10,0)'); // the upper lid's shadow
  ctx.fillRect(-w, -h, w * 2, h * 1.1);
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(-0.12, -0.12, u(r, 0.06, 0.8), 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0.1, 0.1, u(r, 0.025, 0.5), 0, TAU);
  ctx.fill();
  ctx.restore();
  almond(ctx, w, h, 1);
  ctx.lineWidth = u(r, 0.06, 1);
  ctx.strokeStyle = 'rgba(8,0,6,0.9)';
  ctx.stroke();
  stroke(ctx, r, [[-0.84, -0.12], [-0.7, -0.46], [-0.3, -0.6]], 'rgba(255,255,255,0.5)', 0.035);
}
