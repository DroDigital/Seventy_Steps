/**
 * The map's marks, drawn (round 60: "make all the icons more thematically fitting, e.g. the Elder Sign as the resting sign"). Each
 * thing the map shows has a figure of its own, set on a small dark token so it reads over any ground: the Elder Sign's five strokes
 * for a resting place (bone and haloed once lit), the gate's stone frame with its veil, a dungeon's arched door, the eye of a horror
 * (closed once it is slain), a bust for a person, a wisp for lost Echoes, a diamond for the story's lead, the investigator's arrow.
 * The legend draws these same figures (`drawMark` into a small canvas), so a key and the map never differ. Pure drawing: no state.
 */

import { BONE, BRONZE, DIM, INK, MAGENTA, PURPLE, VEIL, sheen, token, tint, TAU, type MarkKind, type MarkState } from './mapIconKit';
import { echo, lead, marker, person, place, you } from './mapIconsLive';
import { secret } from './mapIconsSecret';

export * from './mapIconKit';

/** The Elder Sign's strokes, as render/signMeshes.ts carves them: start x and y above the stem's foot, lean from upright (radians), length. */
const SIGN: readonly (readonly [number, number, number, number])[] = [
  [0, 0, 0, 1.35], // the stem
  [0, 0.88, 0.65, 0.5], // the upper branches
  [0, 0.88, -0.65, 0.5],
  [0, 0.46, 0.8, 0.42], // the lower branches
  [0, 0.46, -0.8, 0.42],
];
const SIGN_HEIGHT = 1.35;

/**
 * The Elder Sign, `h` pixels high with its stem's foot at the bottom, centred on (x, y): one path of its five strokes, stroked as an aura (lit),
 * as cut stone with a shadow under it, and, lit, with a hot line along its middle.
 */
function elderSign(ctx: CanvasRenderingContext2D, x: number, y: number, h: number, lit: boolean, width: number): void {
  const k = h / SIGN_HEIGHT;
  const foot = y + h / 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (const [x0, y0, lean, len] of SIGN) {
    const [ax, ay] = [x + x0 * k, foot - y0 * k];
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax + Math.sin(lean) * len * k, ay - Math.cos(lean) * len * k);
  }
  if (lit) {
    ctx.lineWidth = width * 2.6;
    ctx.strokeStyle = 'rgba(154,90,208,0.32)'; // the aura it stands in
    ctx.stroke();
    [ctx.shadowColor, ctx.shadowBlur] = [PURPLE, h * 0.45];
  } else [ctx.shadowColor, ctx.shadowOffsetY] = ['rgba(0,0,0,0.7)', Math.max(0.6, h * 0.05)];
  ctx.lineWidth = width;
  ctx.strokeStyle = sheen(ctx, y - h / 2, foot, lit ? '#f4ecd2' : DIM, lit ? 0.35 : 0.3, 0.3);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  if (!lit) return;
  ctx.lineWidth = Math.max(0.7, width * 0.3);
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.stroke();
}

function sign(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, s: MarkState): void {
  const lit = !!s.lit;
  token(ctx, x, y, r * 1.1, lit ? BONE : DIM, lit ? PURPLE : '');
  elderSign(ctx, x, y, r * 1.4, lit, Math.max(1.4, r * 0.22));
}

/** A gate: two pillars of cut stone with a keystone, a round arch over them, and the veil between, brightest at the top and deep at the foot, lit from within, with two motes in it. */
function gate(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  token(ctx, x, y, r * 1.1, PURPLE, PURPLE);
  const [w, foot, spring] = [r * 0.5, y + r * 0.62, y - r * 0.1];
  const opening = (): void => {
    ctx.beginPath();
    ctx.moveTo(x - w, foot);
    ctx.lineTo(x - w, spring);
    ctx.arc(x, spring, w, Math.PI, 0);
    ctx.lineTo(x + w, foot);
    ctx.closePath();
  };
  const veil = ctx.createLinearGradient(0, spring - w, 0, foot);
  veil.addColorStop(0, '#f1e6ff');
  veil.addColorStop(0.35, '#b58cf5');
  veil.addColorStop(0.7, VEIL);
  veil.addColorStop(1, '#2c1462');
  ctx.fillStyle = veil;
  opening();
  ctx.fill();
  const lamp = ctx.createRadialGradient(x, spring + w * 0.5, 0, x, spring + w * 0.5, w * 1.3); // the light behind it
  lamp.addColorStop(0, 'rgba(255,255,255,0.55)');
  lamp.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = lamp;
  opening();
  ctx.fill();
  ctx.fillStyle = '#fff';
  for (const [dx, dy] of [[-0.16, 0.05], [0.18, 0.3]]) {
    ctx.beginPath();
    ctx.arc(x + w * dx * 2, y + r * dy, Math.max(0.7, r * 0.07), 0, TAU);
    ctx.fill();
  }
  ctx.lineCap = 'square';
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(1.6, r * 0.24);
  ctx.strokeStyle = sheen(ctx, spring - w, foot, BONE, 0.45, 0.3);
  ctx.beginPath();
  ctx.moveTo(x - w, foot);
  ctx.lineTo(x - w, spring);
  ctx.arc(x, spring, w, Math.PI, 0);
  ctx.lineTo(x + w, foot);
  ctx.stroke();
  ctx.lineWidth = Math.max(1.6, r * 0.2);
  ctx.beginPath();
  ctx.moveTo(x - w * 1.4, foot);
  ctx.lineTo(x - w * 0.6, foot); // the pillars' feet
  ctx.moveTo(x + w * 0.6, foot);
  ctx.lineTo(x + w * 1.4, foot);
  ctx.stroke();
  ctx.fillStyle = tint(BONE, 0.4); // the keystone
  ctx.beginPath();
  ctx.moveTo(x - r * 0.13, spring - w - r * 0.1);
  ctx.lineTo(x + r * 0.13, spring - w - r * 0.1);
  ctx.lineTo(x + r * 0.08, spring - w + r * 0.12);
  ctx.lineTo(x - r * 0.08, spring - w + r * 0.12);
  ctx.closePath();
  ctx.fill();
}

/** A dungeon's door: a pointed arch of cut stone, its blocks jointed and a keystone set in, torchlight on the steps going down into the dark. */
function dungeon(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  token(ctx, x, y, r * 1.1, BRONZE);
  const [w, foot, spring] = [r * 0.6, y + r * 0.62, y - r * 0.1];
  const inner = w * 0.58;
  const arch = (half: number, base: number): void => {
    ctx.beginPath();
    ctx.moveTo(x - half, base);
    ctx.lineTo(x - half, spring);
    ctx.arc(x, spring, half, Math.PI, 0);
    ctx.lineTo(x + half, base);
    ctx.closePath();
  };
  ctx.fillStyle = sheen(ctx, spring - w, foot, BONE, 0.3, 0.3);
  arch(w, foot);
  ctx.fill();
  const dark = ctx.createRadialGradient(x, foot, 0, x, foot, inner * 2.1); // what the door opens on, warm where a torch lights the stairs
  dark.addColorStop(0, '#8a5424');
  dark.addColorStop(0.45, '#2c1b12');
  dark.addColorStop(1, INK);
  ctx.fillStyle = dark;
  arch(inner, foot);
  ctx.fill();
  ctx.lineWidth = Math.max(0.6, r * 0.05);
  ctx.strokeStyle = 'rgba(11,10,14,0.6)'; // the joints between the arch's blocks, round it from the springing to the crown
  ctx.beginPath();
  for (const k of [1, 2.5, 3.5, 5]) {
    const a = Math.PI * (1 + k / 6);
    ctx.moveTo(x + Math.cos(a) * inner, spring + Math.sin(a) * inner);
    ctx.lineTo(x + Math.cos(a) * w, spring + Math.sin(a) * w);
  }
  ctx.stroke();
  ctx.fillStyle = tint(BONE, 0.5); // the keystone, a little proud of the arch
  ctx.beginPath();
  for (const [k, from] of [[2.5, inner], [3.5, inner], [3.5, w * 1.16], [2.5, w * 1.16]] as const) {
    const a = Math.PI * (1 + k / 6);
    ctx.lineTo(x + Math.cos(a) * from, spring + Math.sin(a) * from);
  }
  ctx.closePath();
  ctx.fill();
  const [left, across] = [x - inner, inner * 2];
  for (const [i, [width, rise]] of ([[1, 0.2], [0.6, 0.14], [0.3, 0.14]] as const).entries()) {
    ctx.fillStyle = tint(BONE, -0.25 + 0.2 * (2 - i)); // the steps going down: the nearest brightest
    ctx.fillRect(left, foot - r * (0.2 + 0.2 * i), across * width, r * rise);
  }
}

/**
 * An eye: open, a horror that lives (a hot almond, a ringed iris, a slit pupil and a glint on it, lit from within and haloed by the token's glow);
 * closed, a horror that is slain (its lid and lashes, grey).
 */
function eye(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, slain: boolean): void {
  const colour = slain ? DIM : MAGENTA;
  token(ctx, x, y, r * 1.1, colour, slain ? '' : MAGENTA);
  const w = r * 0.8;
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(1.4, r * 0.18);
  if (slain) {
    ctx.fillStyle = 'rgba(138,132,116,0.3)'; // the lid, drawn down
    ctx.beginPath();
    ctx.moveTo(x - w, y - r * 0.12);
    ctx.quadraticCurveTo(x, y + r * 0.5, x + w, y - r * 0.12);
    ctx.quadraticCurveTo(x, y - r * 0.14, x - w, y - r * 0.12);
    ctx.fill();
    ctx.strokeStyle = sheen(ctx, y - r * 0.2, y + r * 0.5, DIM, 0.45, 0.2);
    ctx.beginPath();
    ctx.moveTo(x - w, y - r * 0.12);
    ctx.quadraticCurveTo(x, y + r * 0.5, x + w, y - r * 0.12);
    for (const dx of [-0.5, 0, 0.5]) { // the lashes of a closed eye, hanging
      ctx.moveTo(x + w * dx, y + r * (0.2 - 0.16 * Math.abs(dx) * 2));
      ctx.lineTo(x + w * dx * 1.12, y + r * (0.46 - 0.12 * Math.abs(dx) * 2));
    }
    ctx.stroke();
    return;
  }
  const almond = (): void => {
    ctx.beginPath();
    ctx.moveTo(x - w, y);
    ctx.quadraticCurveTo(x, y - r * 0.95, x + w, y);
    ctx.quadraticCurveTo(x, y + r * 0.95, x - w, y);
  };
  const lit = ctx.createRadialGradient(x, y, 0, x, y, w); // the eye's white, lit by the horror's own fire, hottest at its heart
  lit.addColorStop(0, '#ffe0f0');
  lit.addColorStop(0.4, '#ff4fa8');
  lit.addColorStop(1, '#6b0038');
  ctx.fillStyle = lit;
  almond();
  ctx.fill();
  ctx.strokeStyle = tint(MAGENTA, 0.4);
  ctx.stroke();
  const iris = ctx.createRadialGradient(x - r * 0.08, y - r * 0.1, 0, x, y, r * 0.38);
  iris.addColorStop(0, '#ff9ccf');
  iris.addColorStop(1, '#a8004f');
  ctx.fillStyle = iris;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.38, 0, TAU);
  ctx.fill();
  ctx.lineWidth = Math.max(1, r * 0.1);
  ctx.strokeStyle = tint(MAGENTA, -0.55);
  ctx.stroke();
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.1, r * 0.4, 0, 0, TAU); // the slit
  ctx.fill();
  ctx.fillStyle = '#fff'; // a glint on the iris, off the slit
  ctx.beginPath();
  ctx.arc(x - r * 0.2, y - r * 0.2, Math.max(0.6, r * 0.07), 0, TAU);
  ctx.fill();
}

/** Draws one mark of `kind` at (x, y), about `r` pixels in radius. */
export function drawMark(ctx: CanvasRenderingContext2D, kind: MarkKind, x: number, y: number, r: number, s: MarkState = {}): void {
  ctx.save();
  ctx.setLineDash([]);
  if (kind === 'sign') sign(ctx, x, y, r, s);
  else if (kind === 'gate') gate(ctx, x, y, r);
  else if (kind === 'dungeon') dungeon(ctx, x, y, r);
  else if (kind === 'boss') eye(ctx, x, y, r, !!s.slain);
  else if (kind === 'person') person(ctx, x, y, r, !!s.met);
  else if (kind === 'echo') echo(ctx, x, y, r, s.now ?? 0);
  else if (kind === 'lead') lead(ctx, x, y, r, s.now ?? 0);
  else if (kind === 'place') place(ctx, x, y, r);
  else if (kind === 'marker') marker(ctx, x, y, r);
  else if (kind === 'secret') secret(ctx, x, y, r, s);
  else you(ctx, x, y, r, s.turn ?? 0);
  ctx.restore();
}
