/**
 * The map's marks, drawn (round 60: "make all the icons more thematically fitting, e.g. the Elder Sign as the resting sign"). Each
 * thing the map shows has a figure of its own, set on a small dark token so it reads over any ground: the Elder Sign's five strokes
 * for a resting place (bone and haloed once lit), the gate's stone frame with its veil, a dungeon's arched door, the eye of a horror
 * (closed once it is slain), a bust for a person, a wisp for lost Echoes, a diamond for the story's lead, the investigator's arrow.
 * The legend draws these same figures (`drawMark` into a small canvas), so a key and the map never differ. Pure drawing: no state.
 */

import { BONE, DIM, INK, MAGENTA, PURPLE, VEIL, token, TAU, type MarkKind, type MarkState } from './mapIconKit';
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

/** The Elder Sign, `h` pixels high with its stem's foot at the bottom, centred on (x, y). */
function elderSign(ctx: CanvasRenderingContext2D, x: number, y: number, h: number, color: string, width: number): void {
  const k = h / SIGN_HEIGHT;
  const foot = y + h / 2;
  ctx.lineCap = 'round';
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.beginPath();
  for (const [x0, y0, lean, len] of SIGN) {
    const [ax, ay] = [x + x0 * k, foot - y0 * k];
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax + Math.sin(lean) * len * k, ay - Math.cos(lean) * len * k);
  }
  ctx.stroke();
}

function sign(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, s: MarkState): void {
  const lit = !!s.lit;
  token(ctx, x, y, r * 1.1, lit ? BONE : DIM, lit ? PURPLE : '');
  if (lit) [ctx.shadowColor, ctx.shadowBlur] = [PURPLE, r * 0.9]; // a lit sign shines
  elderSign(ctx, x, y, r * 1.4, lit ? BONE : DIM, Math.max(1.4, r * 0.22));
  ctx.shadowBlur = 0;
}

/** A gate: two pillars with their capitals, a round arch over them, and the veil between, brightest at the top, with two motes in it. */
function gate(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  token(ctx, x, y, r * 1.1, PURPLE, PURPLE);
  const [w, foot, spring] = [r * 0.5, y + r * 0.62, y - r * 0.1];
  const veil = ctx.createLinearGradient(0, spring - w, 0, foot);
  veil.addColorStop(0, '#e2cfff');
  veil.addColorStop(0.5, '#a778f0');
  veil.addColorStop(1, VEIL);
  ctx.fillStyle = veil;
  ctx.beginPath();
  ctx.moveTo(x - w, foot);
  ctx.lineTo(x - w, spring);
  ctx.arc(x, spring, w, Math.PI, 0);
  ctx.lineTo(x + w, foot);
  ctx.closePath();
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
  ctx.strokeStyle = BONE;
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
}

/** A dungeon's door: a pointed arch of cut stone with a keystone, the dark inside, and the first steps going down. */
function dungeon(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  token(ctx, x, y, r * 1.1, BONE);
  const [w, foot, spring] = [r * 0.6, y + r * 0.62, y - r * 0.1];
  const arch = (half: number, base: number): void => {
    ctx.beginPath();
    ctx.moveTo(x - half, base);
    ctx.lineTo(x - half, spring);
    ctx.arc(x, spring, half, Math.PI, 0);
    ctx.lineTo(x + half, base);
    ctx.closePath();
  };
  ctx.fillStyle = BONE;
  arch(w, foot);
  ctx.fill();
  ctx.fillStyle = INK;
  arch(w * 0.58, foot);
  ctx.fill();
  ctx.fillStyle = BONE; // the keystone
  ctx.beginPath();
  ctx.moveTo(x - w * 0.2, spring - w);
  ctx.lineTo(x + w * 0.2, spring - w);
  ctx.lineTo(x + w * 0.14, spring - w * 0.55);
  ctx.lineTo(x - w * 0.14, spring - w * 0.55);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(x - w * 0.58, foot - r * 0.2, w * 1.16, r * 0.2); // steps going down into the dark
  ctx.fillRect(x - w * 0.58, foot - r * 0.4, w * 0.7, r * 0.14);
  ctx.fillRect(x - w * 0.58, foot - r * 0.6, w * 0.3, r * 0.14);
}

/** An eye, open and slit-pupilled with a ringed iris and rays about it for a horror that lives, closed (its lid and lashes) for one that is slain. */
function eye(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, slain: boolean): void {
  const colour = slain ? DIM : MAGENTA;
  token(ctx, x, y, r * 1.1, colour, slain ? '' : MAGENTA);
  const w = r * 0.8;
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(1.4, r * 0.18);
  ctx.strokeStyle = colour;
  ctx.fillStyle = colour;
  ctx.beginPath();
  if (slain) {
    ctx.moveTo(x - w, y - r * 0.12);
    ctx.quadraticCurveTo(x, y + r * 0.5, x + w, y - r * 0.12);
    for (const dx of [-0.5, 0, 0.5]) { // the lashes of a closed eye, hanging
      ctx.moveTo(x + w * dx, y + r * (0.2 - 0.16 * Math.abs(dx) * 2));
      ctx.lineTo(x + w * dx * 1.12, y + r * (0.46 - 0.12 * Math.abs(dx) * 2));
    }
    ctx.stroke();
    return;
  }
  ctx.moveTo(x - w, y);
  ctx.quadraticCurveTo(x, y - r * 0.95, x + w, y);
  ctx.quadraticCurveTo(x, y + r * 0.95, x - w, y);
  ctx.stroke();
  ctx.save();
  ctx.globalAlpha = 0.45;
  ctx.fill(); // the eye's white, lit by the horror's own colour
  ctx.restore();
  ctx.beginPath();
  ctx.arc(x, y, r * 0.38, 0, TAU); // the iris
  ctx.lineWidth = Math.max(1, r * 0.12);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.1, r * 0.4, 0, 0, TAU); // the slit
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
