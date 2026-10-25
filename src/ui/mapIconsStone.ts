/**
 * The places cut in stone (overhaul, 2026-10-25): the Elder Sign as a standing stone with the sign carved in its face (a resting place), a
 * gate as a stone portal with a veil of light in it, a dungeon as a cellar's stone curb with its iron-bound door thrown open on the stair.
 * Pure drawing, in the units of the figure's radius (`drawMark` sets them).
 */

import { TAU, glow, groundShadow, lin, lip, mix, poly, rad, rgba, shift, solid, stroke, u, unlip, type Ctx, type Pt } from './mapIconKit';

/** The Elder Sign's strokes, as render/signMeshes.ts carves them: start x and y above the stem's foot, lean from upright (radians), length. */
const SIGN: readonly (readonly [number, number, number, number])[] = [
  [0, 0, 0, 1.35], // the stem
  [0, 0.88, 0.65, 0.5], // the upper branches
  [0, 0.88, -0.65, 0.5],
  [0, 0.46, 0.8, 0.42], // the lower branches
  [0, 0.46, -0.8, 0.42],
];
const SIGN_HEIGHT = 1.35;
const SIGN_LIGHT = '#b79cff';

/**
 * A resting place: a standing stone on a low plinth, its top cut aslant, the Elder Sign carved deep in its face. Unlit, cold slate with the
 * cuts dark and a lip of light under each; lit, the sign burns white-violet, the stone takes the light, and a ring of it lies on the ground.
 */
export function sign(ctx: Ctx, r: number, lit: boolean): void {
  const d: Pt = [0.3, -0.13];
  const [BL, BR, TR, TL]: Pt[] = [[-0.6, 0.8], [0.4, 0.8], [0.3, -0.78], [-0.5, -0.96]];
  const gx = -0.1; // the face's middle
  if (lit) glow(ctx, 0.05, 0.15, 1.55, SIGN_LIGHT, 0.5);
  groundShadow(ctx, 0.4, 1.02, 1.05, 0.22);
  if (lit) {
    ctx.lineWidth = u(r, 0.07, 1.1);
    ctx.strokeStyle = rgba(SIGN_LIGHT, 0.85);
    ctx.beginPath();
    ctx.ellipse(0.05, 0.99, 1.12, 0.3, 0, Math.PI, TAU); // the ring's far half, behind the stone
    ctx.stroke();
  }
  const front = lin(ctx, -0.6, -0.9, 0.45, 0.85, ...(lit ? ['#b4aedb', '#6e6a98', '#34324e'] : ['#9199ad', '#5d6578', '#2f3442']));
  const side = lin(ctx, 0.3, -0.8, 0.7, 0.8, ...(lit ? ['#4b4870', '#222038'] : ['#434a5b', '#1d212b']));
  const top = lin(ctx, -0.5, -1, 0.3, -0.7, ...(lit ? ['#e3dcff', '#aaa4d4'] : ['#cfd5e2', '#8e96aa']));
  const stone: Pt[] = [BL, BR, TR, TL];
  solid(ctx, r, [
    [[[-0.8, 0.86], [0.58, 0.86], [0.58, 1.08], [-0.8, 1.08]], lin(ctx, 0, 0.86, 0, 1.08, '#7d8497', '#3a3f4e')], // the plinth: front, top and side
    [[[-0.8, 0.86], [0.58, 0.86], shift([0.58, 0.86], d), shift([-0.8, 0.86], d)], lin(ctx, 0, 0.7, 0, 0.86, '#b3b9c8', '#7b8295')],
    [[[0.58, 0.86], shift([0.58, 0.86], d), shift([0.58, 1.08], d), [0.58, 1.08]], '#2c303c'],
    [[BR, shift(BR, d), shift(TR, d), TR], side],
    [[TL, TR, shift(TR, d), shift(TL, d)], top],
    [stone, front],
  ]);
  ctx.save(); // the chisel's marks and the light along the cut edges
  poly(ctx, stone);
  ctx.clip();
  if (lit) {
    ctx.fillStyle = rad(ctx, gx, 0.05, 0, 0.95, rgba(SIGN_LIGHT, 0.5), rgba(SIGN_LIGHT, 0.14), rgba(SIGN_LIGHT, 0)); // the sign's light on its own face
    ctx.fillRect(-0.7, -1, 1.2, 1.9);
  }
  ctx.fillStyle = lit ? 'rgba(122,150,96,0.22)' : 'rgba(122,150,96,0.5)'; // lichen where the damp gathers at its foot
  poly(ctx, [[-0.62, 0.72], [-0.5, 0.5], [-0.34, 0.56], [-0.26, 0.7], [-0.36, 0.82], [-0.58, 0.82]]);
  ctx.fill();
  poly(ctx, [[0.24, 0.78], [0.3, 0.64], [0.42, 0.66], [0.44, 0.8]]);
  ctx.fill();
  stroke(ctx, r, [[0.1, 0.55], [0.34, 0.2]], 'rgba(0,0,0,0.3)', 0.03); // two cracks and a pitting
  stroke(ctx, r, [[-0.55, 0.3], [-0.38, 0.12], [-0.42, -0.02]], 'rgba(0,0,0,0.26)', 0.03);
  ctx.restore();
  stroke(ctx, r, [BL, TL, TR], 'rgba(255,255,255,0.42)', 0.04);
  stroke(ctx, r, [shift(TL, d), shift(TR, d)], 'rgba(255,255,255,0.35)', 0.03);
  const [k, foot] = [1.24 / SIGN_HEIGHT, 0.62];
  ctx.beginPath(); // the five strokes of the sign, one path, struck as often as the carving needs
  for (const [x0, y0, lean, len] of SIGN) {
    const [ax, ay] = [gx + x0 * k, foot - y0 * k];
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax + Math.sin(lean) * len * k, ay - Math.cos(lean) * len * k);
  }
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const g = u(r, 0.12, 1.25);
  if (lit) {
    [ctx.shadowColor, ctx.shadowBlur] = [SIGN_LIGHT, Math.max(3, r * 0.7)];
    ctx.lineWidth = g * 2.2;
    ctx.strokeStyle = rgba(SIGN_LIGHT, 0.6);
    ctx.stroke();
    unlip(ctx);
    ctx.lineWidth = g * 1.1;
    ctx.strokeStyle = '#f1eaff';
    ctx.stroke();
    ctx.lineWidth = g * 0.4;
    ctx.strokeStyle = '#fff';
    ctx.stroke();
  } else {
    lip(ctx, 'rgba(214,220,242,0.4)', Math.max(0.6, r * 0.05));
    ctx.lineWidth = g * 1.25;
    ctx.strokeStyle = '#141620';
    ctx.stroke();
    unlip(ctx);
  }
  if (lit) {
    ctx.lineWidth = u(r, 0.07, 1.1);
    ctx.strokeStyle = rgba('#e5dcff', 0.95);
    ctx.beginPath();
    ctx.ellipse(0.05, 0.99, 1.12, 0.3, 0, 0, Math.PI); // and its near half, in front of it
    ctx.stroke();
  }
}

/**
 * A gate: two jambs on flared feet and a lintel of dark blue stone, a pediment on it and bands of glyphs under, and between the jambs the veil,
 * a sheet of cold light, deep indigo under the lintel and nearly white where it meets the ground, with a ripple and a few motes in it.
 */
export function gate(ctx: Ctx, r: number): void {
  const d: Pt = [0.15, -0.09];
  const [top, foot, lo, hi, lintel] = [-0.34, 1.0, 0.62, 0.98, -0.8]; // the opening's roof and floor, the jambs' inner and outer edges, the lintel's top
  glow(ctx, 0, 0.4, 1.55, '#69b4ff', 0.34);
  groundShadow(ctx, 0.35, 1.04, 1.25, 0.2);
  ctx.fillStyle = lin(ctx, 0, top, 0, foot, [0, '#1a2166'], [0.3, '#3558d0'], [0.7, '#7ec8ff'], [1, '#dffaff']);
  ctx.fillRect(-lo - 0.1, top, lo * 2 + 0.2, foot - top);
  ctx.fillStyle = rad(ctx, 0, 0.55, 0, 0.8, 'rgba(255,255,255,0.7)', 'rgba(255,255,255,0.2)', 'rgba(255,255,255,0)');
  ctx.fillRect(-lo - 0.1, top, lo * 2 + 0.2, foot - top);
  for (const [i, dx] of [-0.3, 0.04, 0.34].entries()) { // the ripple, three slow lines down the veil
    ctx.beginPath();
    ctx.lineTo(dx, top + 0.1);
    ctx.bezierCurveTo(dx + 0.14 * (i % 2 ? 1 : -1), 0.1, dx - 0.12 * (i % 2 ? 1 : -1), 0.5, dx + 0.05, foot - 0.08);
    ctx.lineWidth = u(r, 0.04, 0.7);
    ctx.strokeStyle = `rgba(235,250,255,${0.55 - i * 0.1})`;
    ctx.stroke();
  }
  ctx.fillStyle = '#fff';
  for (const [mx, my] of [[-0.2, 0.2], [0.28, 0.46], [0.02, 0.7]] as const) {
    ctx.beginPath();
    ctx.arc(mx, my, u(r, 0.035, 0.6), 0, TAU);
    ctx.fill();
  }
  const jamb = (x0: number, x1: number): readonly [Pt[], CanvasGradient] => [[[x0, top], [x1, top], [x1, foot - 0.12], [x0, foot - 0.12]], lin(ctx, x0, 0, x1, 0, '#8a93ae', '#566082', '#2b3047')];
  const [dark, lit] = ['#2a2f48', '#aab3cc'];
  const base = lin(ctx, 0, foot - 0.14, 0, foot, '#7c86a3', '#3a4160');
  const feet = (x0: number, x1: number): readonly [Pt[], CanvasGradient] => [[[x0, foot - 0.14], [x1, foot - 0.14], [x1, foot + 0.04], [x0, foot + 0.04]], base];
  solid(ctx, r, [
    [[[1.1, foot - 0.14], shift([1.1, foot - 0.14], d), shift([1.1, foot + 0.04], d), [1.1, foot + 0.04]], dark], // the right foot's side
    feet(lo, 1.1),
    [[[hi, top], shift([hi, top], d), shift([hi, foot - 0.12], d), [hi, foot - 0.12]], dark], // the right jamb's side
    jamb(lo, hi),
    feet(-1.1, -lo),
    [[[-lo, top], shift([-lo, top], d), shift([-lo, foot - 0.12], d), [-lo, foot - 0.12]], '#171a2a'], // the left jamb's side, seen across the opening
    jamb(-hi, -lo),
    [[[0, -1.14], [0.56, lintel], shift([0.56, lintel], d), shift([0, -1.14], d)], dark], // the pediment's right slope
    [[[1.08, lintel], shift([1.08, lintel], d), shift([1.08, top], d), [1.08, top]], dark], // the lintel
    [[[-1.08, lintel], [1.08, lintel], shift([1.08, lintel], d), shift([-1.08, lintel], d)], lit],
    [[[-1.08, lintel], [1.08, lintel], [1.08, top], [-1.08, top]], lin(ctx, -1.08, -0.85, 1.08, -0.3, '#8a93ae', '#566082', '#2f3550')],
    [[[-0.56, lintel], [0, -1.14], [0.56, lintel]], lin(ctx, -0.5, -1.1, 0.5, -0.8, '#a0a9c4', '#5f6888')], // the pediment
  ]);
  stroke(ctx, r, [[-hi, foot - 0.12], [-hi, top]], 'rgba(255,255,255,0.4)', 0.04);
  stroke(ctx, r, [[-1.08, top], [-1.08, lintel], [1.08, lintel]], 'rgba(255,255,255,0.4)', 0.04);
  stroke(ctx, r, [[-0.56, lintel], [0, -1.14]], 'rgba(255,255,255,0.45)', 0.035);
  ctx.shadowColor = '#74c0ff';
  ctx.shadowBlur = Math.max(2, r * 0.4);
  ctx.beginPath(); // the glyph band: five bars struck in one stroke, so the glow is paid for once
  for (const gx of [-0.78, -0.4, 0, 0.4, 0.78]) {
    ctx.moveTo(gx, -0.71);
    ctx.lineTo(gx, -0.46 - 0.03 * Math.abs(gx));
  }
  ctx.lineCap = 'round';
  ctx.lineWidth = u(r, 0.07, 1);
  ctx.strokeStyle = '#d6f2ff';
  ctx.stroke();
  unlip(ctx);
  ctx.fillStyle = rad(ctx, 0, foot, 0, 1, 'rgba(190,240,255,0.55)', 'rgba(190,240,255,0)'); // the veil's light on the floor before it
  ctx.save();
  ctx.translate(0, foot);
  ctx.scale(1, 0.22);
  ctx.beginPath();
  ctx.arc(0, 0, 0.95, 0, TAU);
  ctx.fill();
  ctx.restore();
}

/**
 * A dungeon: a door into a hill. A mound of earth and dry stone with a doorway of two jambs and a lintel set low in it, a dark stair going down
 * inside (its treads lit orange by a torch far below), a worn threshold, and the iron-bound door thrown open on the left, brass on its straps.
 * Its crest leans left and the mound falls away to the right, so the upper right is left clear for a horror's badge.
 */
export function dungeon(ctx: Ctx, r: number): void {
  ctx.translate(0, -0.14);
  glow(ctx, 0, 0.45, 1.5, '#ff9a3c', 0.24);
  groundShadow(ctx, 0.4, 1.05, 1.3, 0.2);
  const mound = (): void => {
    ctx.beginPath();
    ctx.lineTo(-1.16, 0.96);
    ctx.bezierCurveTo(-1.14, -0.1, -0.8, -0.68, -0.2, -0.68);
    ctx.bezierCurveTo(0.42, -0.68, 1.04, -0.22, 1.16, 0.96);
    ctx.closePath();
  };
  const [jl, jr, top, floor]: number[] = [-0.34, 0.34, 0.16, 0.96]; // the opening's sides, roof and floor
  const leaf: Pt[] = [[-0.56, 0.18], [-1.0, 0.04], [-1.0, 1.06], [-0.56, 0.94]]; // the door, swung open toward the eye
  const rock = lin(ctx, 0.6, 0.6, 1.3, 1, '#aaa392', '#6a6455', '#38342c');
  solid(ctx, r, [
    [mound, rad(ctx, -0.45, -0.35, 0, 1.9, '#9a8a68', '#6a5a42', '#2c231a')],
    [[[0.62, 0.98], [0.7, 0.74], [0.96, 0.64], [1.16, 0.78], [1.2, 0.98]], rock], // stones fallen at the foot of the mound
    [[[0.7, 0.34], [0.8, 0.14], [1.0, 0.2], [1.04, 0.42], [0.88, 0.5]], rock],
    [[[-0.7, -0.1], [0.7, -0.1], [0.7, top], [-0.7, top]], lin(ctx, 0, -0.1, 0, top, '#e1d8c2', '#a89e88')], // the lintel, a slab wider than the doorway
    [[[-0.56, top], [jl, top], [jl, floor], [-0.56, floor]], lin(ctx, -0.56, 0, jl, 0, '#cfc6b0', '#8a8068')],
    [[[jr, top], [0.56, top], [0.56, floor], [jr, floor]], lin(ctx, jr, 0, 0.56, 0, '#a89e88', '#5a5244')],
    [[[-0.66, floor], [0.66, floor], [0.76, 1.12], [-0.76, 1.12]], '#a89e88'], // the threshold
    [leaf, lin(ctx, -1, 0, -0.56, 0, '#74502f', '#3a2616')],
  ], 0.1);
  ctx.save();
  mound();
  ctx.clip();
  ctx.fillStyle = 'rgba(140,160,84,0.34)'; // moss and turf where the light falls
  ctx.fillRect(-1.3, -0.8, 2.6, 0.7);
  if (r > 9) for (const k of [0.84, 0.62]) stroke(ctx, r, [[-1.16 * k, 0.96], [-1.1 * k, 0.1], [-0.7 * k, -0.5 * k], [-0.2 * k, -0.66 * k - 0.02], [0.4 * k, -0.5 * k], [1.0 * k, 0.1], [1.16 * k, 0.96]], 'rgba(0,0,0,0.22)', 0.03); // the courses of its stone
  ctx.restore();
  poly(ctx, [[jl, top], [jr, top], [jr, floor], [jl, floor]]);
  ctx.fillStyle = rad(ctx, 0.06, floor, 0, 0.9, '#ffb04a', '#8a3c12', '#150b08', '#07050a');
  ctx.fill();
  for (const [i, y] of [0.64, 0.76, 0.88].entries()) { // the treads going down, the nearest widest
    const w = 0.22 + 0.04 * i;
    poly(ctx, [[-w, y], [w, y], [w, y + 0.06], [-w, y + 0.06]]);
    ctx.fillStyle = `rgba(255,${200 - 20 * i},120,${0.5 + 0.12 * i})`;
    ctx.fill();
  }
  stroke(ctx, r, [[jl, floor], [jl, top], [jr, top]], 'rgba(0,0,0,0.55)', 0.05);
  stroke(ctx, r, [[-0.7, -0.1], [0.7, -0.1]], 'rgba(255,255,255,0.55)', 0.035);
  stroke(ctx, r, [[-0.14, 0.04], [0, -0.04], [0.14, 0.04], [0, 0.11], [-0.14, 0.04]], 'rgba(30,24,18,0.7)', 0.035, 0.6); // an eye cut in the lintel
  stroke(ctx, r, [[-0.56, floor], [-0.56, top]], 'rgba(255,255,255,0.35)', 0.03);
  for (const t of [0.34, 0.67]) stroke(ctx, r, [mix(leaf[0], leaf[1], t), mix(leaf[3], leaf[2], t)], 'rgba(0,0,0,0.4)', 0.03); // the planks
  for (const [v0, v1] of [[0.16, 0.3], [0.7, 0.84]] as const) { // the straps across them, with brass on each
    const [a, b, c, e] = [mix(leaf[0], leaf[3], v0), mix(leaf[1], leaf[2], v0), mix(leaf[1], leaf[2], v1), mix(leaf[0], leaf[3], v1)];
    poly(ctx, [a, b, c, e]);
    ctx.fillStyle = '#2f2f37';
    ctx.fill();
    for (const k of [0.2, 0.55, 0.9]) {
      const [sx, sy] = mix(mix(a, b, k), mix(e, c, k), 0.5);
      ctx.fillStyle = '#ecc872';
      ctx.beginPath();
      ctx.arc(sx, sy, u(r, 0.04, 0.6), 0, TAU);
      ctx.fill();
    }
  }
  stroke(ctx, r, [leaf[1], leaf[0]], 'rgba(255,240,200,0.5)', 0.035);
}
