/**
 * What the investigator leaves and carries on the map (overhaul, 2026-10-25): a place found is a small cairn, the investigator an arrowhead of
 * flint lit by the lantern, turned the way they face, and the marker a surveyor's stake with a pennant, its foot on the place it marks.
 */

import { PIN_TIP, TAU, glow, groundShadow, lin, poly, rad, rgba, solid, stroke, u, type Ctx, type Pt } from './mapIconKit';

/** A place found, named: four stones set one on another, the lit side to the upper left, the lowest broad and the highest a pebble, moss on its north side. Small, and quiet beside the rest. */
export function place(ctx: Ctx, r: number): void {
  groundShadow(ctx, 0.25, 0.52, 0.9, 0.14, 0.38);
  const stones: readonly (readonly [Pt[], string[]])[] = [
    [[[-0.78, 0.52], [-0.74, 0.28], [-0.5, 0.14], [-0.2, 0.18], [0.3, 0.12], [0.62, 0.16], [0.8, 0.34], [0.78, 0.52], [0, 0.6]], ['#d2c9b4', '#8d8574', '#46413a']],
    [[[-0.5, 0.18], [-0.44, -0.12], [-0.12, -0.28], [0.3, -0.24], [0.5, 0.1], [0.42, 0.2], [0, 0.24]], ['#bdb4a0', '#7c7567', '#3e3a33']],
    [[[-0.26, -0.22], [-0.2, -0.46], [0.08, -0.52], [0.3, -0.3], [0.26, -0.18], [0, -0.14]], ['#dad2be', '#948c7b', '#4c473e']],
    [[[-0.12, -0.5], [-0.04, -0.72], [0.1, -0.68], [0.16, -0.5]], ['#e4dcc8', '#a39b89', '#575246']],
  ];
  solid(ctx, r, stones.map(([pts, cols]): [Pt[], CanvasGradient] => [pts, lin(ctx, pts[0][0], pts[1][1] - 0.2, pts[3][0] + 0.3, pts[0][1], ...cols)]), 0.1);
  for (const [pts] of stones) stroke(ctx, r, [pts[pts.length - 1], pts[0], pts[1], pts[2]], 'rgba(0,0,0,0.45)', 0.05); // the dark under each stone
  for (const [pts] of stones) stroke(ctx, r, [pts[2], pts[3]], 'rgba(255,255,255,0.5)', 0.035); // and the light along its top
  ctx.fillStyle = 'rgba(112,142,78,0.62)'; // the moss in the crevice of the lowest two
  poly(ctx, [[-0.66, 0.3], [-0.5, 0.2], [-0.34, 0.2], [-0.4, 0.3], [-0.56, 0.36]]);
  ctx.fill();
}

/**
 * The investigator: an arrowhead of knapped flint, barbed and notched for its haft, `turn` radians about its centre (0 faces north), its left
 * face lit warm by the lantern they carry and the right in shade, a spark of the lantern at its heart, in a wide pool of lantern light so it is
 * found in a crowd of marks.
 */
export function you(ctx: Ctx, r: number, turn: number): void {
  glow(ctx, 0, 0, 1.45, '#ffd88a', 0.4);
  groundShadow(ctx, 0.28, 0.5, 0.8, 0.45, 0.3);
  ctx.save();
  ctx.rotate(turn); // yaw 0 faces north (up); +x, a quarter turn of yaw, is on the left
  ctx.fillStyle = rad(ctx, 0, 0, 0.3, 2.1, 'rgba(255,214,130,0.5)', 'rgba(255,200,110,0.18)', 'rgba(255,200,110,0)'); // the lantern's light thrown ahead, a fan the way they face
  ctx.beginPath();
  ctx.lineTo(0, 0);
  ctx.arc(0, 0, 2.1, -Math.PI / 2 - 0.5, -Math.PI / 2 + 0.5);
  ctx.closePath();
  ctx.fill();
  const outline = (): void => {
    ctx.beginPath();
    ctx.lineTo(0, -1.32);
    ctx.quadraticCurveTo(0.34, -0.62, 0.56, 0.04);
    ctx.lineTo(0.4, 0.2);
    ctx.lineTo(0.86, 0.78);
    ctx.lineTo(0.24, 0.6);
    ctx.lineTo(0.14, 1.0);
    ctx.lineTo(-0.14, 1.0);
    ctx.lineTo(-0.24, 0.6);
    ctx.lineTo(-0.86, 0.78);
    ctx.lineTo(-0.4, 0.2);
    ctx.lineTo(-0.56, 0.04);
    ctx.quadraticCurveTo(-0.34, -0.62, 0, -1.32);
    ctx.closePath();
  };
  solid(ctx, r, [[outline, lin(ctx, 0, -1.2, 0, 1, '#8a806a', '#4a4333')]], 0.14);
  ctx.save();
  outline();
  ctx.clip();
  ctx.fillStyle = lin(ctx, -0.8, -1.2, 0, 0.8, '#fffbe4', '#f1e3b8', '#c9b17a'); // the lit left face
  ctx.fillRect(-1, -1.4, 1, 2.6);
  ctx.fillStyle = rad(ctx, -0.04, 0.12, 0, 0.9, 'rgba(255,214,120,0.8)', 'rgba(255,190,80,0.22)', 'rgba(255,190,80,0)'); // the lantern's warmth
  ctx.fillRect(-1, -1.4, 2, 2.6);
  ctx.fillStyle = 'rgba(255,255,255,0.6)'; // the flaking along the blade's edge: a few small chips
  for (const [cx, cy] of [[-0.3, -0.62], [-0.46, -0.2], [0.3, -0.54], [0.45, -0.1]] as const) {
    poly(ctx, [[cx, cy - 0.06], [cx + 0.07, cy], [cx, cy + 0.06]]);
    ctx.fill();
  }
  ctx.restore();
  stroke(ctx, r, [[0, -1.24], [0, 0.56]], 'rgba(40,30,16,0.55)', 0.045, 0.8); // the ridge between the faces
  outline();
  ctx.lineWidth = u(r, 0.05, 0.8);
  ctx.strokeStyle = 'rgba(255,238,190,0.8)';
  ctx.stroke();
  ctx.fillStyle = rad(ctx, 0, 0.18, 0, 0.26, '#ffffff', 'rgba(255,240,190,0.8)', 'rgba(255,240,190,0)'); // the lantern's own spark
  ctx.beginPath();
  ctx.arc(0, 0.18, 0.26, 0, TAU);
  ctx.fill();
  ctx.restore();
}

/**
 * The marker: a surveyor's stake of brass, its foot driven into the place it marks (that point, PIN_TIP radii below the centre given, is where it
 * stands), a swallow-tailed pennant of verdigris cloth flying from it. (x, y) is the head's centre: the stake's finial.
 */
export function marker(ctx: Ctx, r: number): void {
  const foot = PIN_TIP;
  groundShadow(ctx, 0.25, foot, 0.7, 0.13, 0.5);
  glow(ctx, 0.45, -0.55, 1.4, '#4fe0c4', 0.22);
  const metal = lin(ctx, -0.1, 0, 0.1, 0, '#fff0b8', '#c99a44', '#5e3f16');
  solid(ctx, r, [
    [[[-0.09, -0.92], [0.09, -0.92], [0.09, 1.1], [0, foot], [-0.09, 1.1]], metal],
    [() => {
      ctx.beginPath();
      ctx.lineTo(0.07, -0.88);
      ctx.quadraticCurveTo(0.6, -1.02, 1.14, -0.8);
      ctx.lineTo(0.86, -0.58);
      ctx.lineTo(1.12, -0.34);
      ctx.quadraticCurveTo(0.6, -0.34, 0.07, -0.2);
      ctx.closePath();
    }, lin(ctx, 0, -1, 0, -0.2, '#9be8d6', '#4fb3a0', '#1d6355')],
  ], 0.1);
  ctx.fillStyle = 'rgba(0,30,26,0.32)'; // a fold in the cloth, its lower half in shade
  poly(ctx, [[0.07, -0.54], [0.5, -0.56], [0.86, -0.58], [1.12, -0.34], [0.6, -0.34], [0.07, -0.2]]);
  ctx.fill();
  stroke(ctx, r, [[0.1, -0.86], [0.6, -0.97], [1.08, -0.79]], 'rgba(255,255,255,0.6)', 0.035);
  ctx.fillStyle = rad(ctx, -0.04, -1.0, 0, 0.14, '#fff6cc', '#d9a84e', '#6a4818'); // the finial
  ctx.beginPath();
  ctx.arc(0, -0.98, 0.13, 0, TAU);
  ctx.lineWidth = u(r, 0.06, 1);
  ctx.strokeStyle = 'rgba(8,6,12,0.92)';
  ctx.stroke();
  ctx.fill();
  stroke(ctx, r, [[-0.04, -0.8], [-0.04, 1.0]], 'rgba(255,255,255,0.6)', 0.025, 0.6);
  ctx.fillStyle = rgba('#3a2a1a', 0.7); // the heap of earth about its foot
  ctx.beginPath();
  ctx.ellipse(0, foot - 0.02, 0.2, 0.07, 0, 0, TAU);
  ctx.fill();
}
