/**
 * The map's marks, drawn (round 60: "make all the icons more thematically fitting, e.g. the Elder Sign as the resting sign"). Each
 * thing the map shows has a figure of its own, set on a small dark token so it reads over any ground: the Elder Sign's five strokes
 * for a resting place (bone and haloed once lit), the gate's stone frame with its veil, a dungeon's arched door, the eye of a horror
 * (closed once it is slain), a bust for a person, a wisp for lost Echoes, a diamond for the story's lead, the investigator's arrow.
 * The legend draws these same figures (`drawMark` into a small canvas), so a key and the map never differ. Pure drawing: no state.
 */

export type MarkKind = 'sign' | 'gate' | 'dungeon' | 'boss' | 'person' | 'echo' | 'lead' | 'place' | 'you';

/** What a mark is like now: a sign lit, a horror slain, a person met; `now` (ms) breathes the echo and the lead; `turn`, the arrow's turn. */
export interface MarkState {
  lit?: boolean;
  slain?: boolean;
  met?: boolean;
  now?: number;
  turn?: number;
}

export const INK = '#0b0a0e';
export const BONE = '#d9d0b8';
export const DIM = '#8a8474';
export const MAGENTA = '#d80073';
export const PURPLE = '#9a5ad0';
export const BRASS = '#c9b27a'; // lost Echoes: pale brass (round 36: the neon green was the one loud colour on the map)
const VEIL = '#7b3fc4';
const TAU = Math.PI * 2;

/** The Elder Sign's strokes, as render/signMeshes.ts carves them: start x and y above the stem's foot, lean from upright (radians), length. */
const SIGN: readonly (readonly [number, number, number, number])[] = [
  [0, 0, 0, 1.35], // the stem
  [0, 0.88, 0.65, 0.5], // the upper branches
  [0, 0.88, -0.65, 0.5],
  [0, 0.46, 0.8, 0.42], // the lower branches
  [0, 0.46, -0.8, 0.42],
];
const SIGN_HEIGHT = 1.35;

/** The size of a mark's token about `r`, the radius a kind is drawn at: what a name or another mark should keep clear of. */
export const reach = (kind: MarkKind, r: number): number => (kind === 'person' || kind === 'place' ? r * 0.7 : kind === 'you' ? r * 1.1 : r * 1.15);

/** The dark disc a figure is set on, ringed in its colour, with a black edge about it for ground of any light. */
function token(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, ring: string, glow = ''): void {
  ctx.save();
  ctx.lineWidth = Math.max(1, r * 0.14) + 2;
  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.stroke();
  if (glow) [ctx.shadowColor, ctx.shadowBlur] = [glow, r * 1.2];
  ctx.fillStyle = 'rgba(11,10,14,0.88)';
  ctx.fill();
  ctx.restore();
  ctx.lineWidth = Math.max(1, r * 0.14);
  ctx.strokeStyle = ring;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.stroke();
}

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
  elderSign(ctx, x, y, r * 1.35, lit ? BONE : DIM, Math.max(1.2, r * 0.2));
}

function gate(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  token(ctx, x, y, r * 1.1, PURPLE, PURPLE);
  const [w, top, foot] = [r * 0.46, y - r * 0.6, y + r * 0.62];
  const veil = ctx.createLinearGradient(0, top, 0, foot);
  veil.addColorStop(0, '#c9a8ff');
  veil.addColorStop(1, VEIL);
  ctx.fillStyle = veil;
  ctx.fillRect(x - w, top, w * 2, foot - top);
  ctx.lineCap = 'square';
  ctx.lineWidth = Math.max(1.4, r * 0.22);
  ctx.strokeStyle = BONE;
  ctx.beginPath();
  ctx.moveTo(x - w, foot);
  ctx.lineTo(x - w, top);
  ctx.lineTo(x + w, top);
  ctx.lineTo(x + w, foot);
  ctx.stroke();
}

function dungeon(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  token(ctx, x, y, r * 1.1, BONE);
  const [w, foot, spring] = [r * 0.56, y + r * 0.6, y - r * 0.12];
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
  arch(w * 0.55, foot);
  ctx.fill();
  ctx.fillStyle = BONE; // steps going down into the dark
  ctx.fillRect(x - w * 0.55, foot - r * 0.2, w * 1.1, r * 0.2);
  ctx.fillRect(x - w * 0.55, foot - r * 0.4, w * 0.55, r * 0.14);
}

/** An eye, open and slit-pupilled for a horror that lives, closed (its lid and lashes) for one that is slain. */
function eye(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, slain: boolean): void {
  const colour = slain ? DIM : MAGENTA;
  token(ctx, x, y, r * 1.1, colour, slain ? '' : MAGENTA);
  const w = r * 0.78;
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(1.2, r * 0.17);
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
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.1, r * 0.4, 0, 0, TAU); // the slit
  ctx.fill();
}

function person(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, met: boolean): void {
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
function echo(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, now: number): void {
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
function lead(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, now: number): void {
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
function place(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(0,0,0,0.8)';
  ctx.fillStyle = DIM;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.3, 0, TAU);
  ctx.stroke();
  ctx.fill();
}

/** The investigator's arrow, `turn` radians about its centre, in a faint ring so it is found in a crowd. */
function you(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, turn: number): void {
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

/** A small badge on a dungeon's door: its horror lives (the open eye) or is slain (the closed one). */
export function drawBadge(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, slain: boolean): void {
  eye(ctx, x, y, r * 0.55, slain);
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
  else you(ctx, x, y, r, s.turn ?? 0);
  ctx.restore();
}
