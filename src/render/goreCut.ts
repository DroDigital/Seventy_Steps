/**
 * A killing cut, planned (round 113; pure, render only): where the blade's line runs through a creature's picture, which side of it is
 * thrown, and how that piece flies, turns and comes to rest. The line is in the frame's own terms (x across the art as drawn, y down)
 * so the body's billboard, its shadow's (shaders/castSprite.ts) and the piece's all agree, whichever way the picture is turned.
 */

import { GORE_FX, type GoreBreak } from '../data/gore';

export interface CutInput {
  kind: Exclude<GoreBreak, 'none'>;
  /** The blade's way, level and unit (from the attacker toward the body). */
  blow: { x: number; z: number };
  /** The camera's right, level and unit. */
  across: { x: number; z: number };
  /** Which way the body faces, level and unit. */
  facing: { x: number; z: number };
  /** The picture is drawn turned about (its frame read right to left). */
  mirror: boolean;
  /** How high the blow fell, a share of the billboard's height from its feet. */
  wound: number;
  /** Where the body is painted in its billboard, shares of it: [bottom, top] up and [left, right] across. */
  span: { bottom: number; top: number; left: number; right: number };
  /** Metres: the billboard's breadth and height. */
  size: { w: number; h: number };
  /** A body long and low (a beast, a serpent, a winged thing) seen from its side: the head is cut off sideways, not across. */
  long: boolean;
  heavy: boolean;
  rand: () => number;
}

export interface CutPlan {
  kind: Exclude<GoreBreak, 'none'>;
  /** A point of the line, in the frame (x across as drawn, y down), and the angle of its normal, toward the piece. */
  point: readonly [number, number];
  angle: number;
  /** The piece's middle, in the frame. */
  middle: readonly [number, number];
  /** The piece's breadth and height, shares of the billboard's. */
  extent: readonly [number, number];
  /** World metres per second it is thrown at, and radians per second it turns at. */
  velocity: { x: number; y: number; z: number };
  spin: number;
}

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const between = (r: () => number, [a, b]: readonly [number, number]): number => lerp(a, b, r());

/** Where the line runs and which way the piece goes, on the screen (x right, y up, in shares of the billboard), then put in the frame's terms. */
export function planCut(i: CutInput): CutPlan {
  const { span, rand } = i;
  const tall = Math.max(1e-3, span.top - span.bottom);
  const wide = Math.max(1e-3, span.right - span.left);
  const towardScreen = (i.facing.x * i.across.x + i.facing.z * i.across.z) >= 0 ? 1 : -1; // the head's side on the screen
  let point: [number, number];
  let normal: [number, number];
  if (i.long && i.kind === 'sever') { // the head off at the neck, sideways; or a heavy blow halves it
    const at = i.heavy && rand() < 0.5 ? 0.5 : 0.7 + 0.08 * rand();
    point = [towardScreen > 0 ? span.left + wide * at : span.right - wide * at, span.bottom + tall * 0.5];
    const tilt = (rand() - 0.5) * 0.5;
    normal = [towardScreen * Math.cos(tilt), Math.sin(tilt)];
  } else {
    const rel = (i.wound - span.bottom) / tall; // where on the body the blade met it
    const low = i.heavy && rel < 0.45 && rand() < 0.6;
    const neck = !low && (rel > 0.62 ? rand() < 0.75 : rand() < 0.35);
    const share = i.kind === 'split' ? 0.42 + 0.18 * rand() : i.kind === 'chip' ? 0.62 + 0.14 * rand() : low ? 0.3 : neck ? 0.8 : 0.52;
    point = [span.left + wide * (0.5 + (rand() - 0.5) * 0.12), span.bottom + tall * share];
    const most = i.kind === 'sever' ? (i.heavy ? 0.6 : 0.38) : 0.85; // a blade's swing runs near level; a tear or a break runs where it will
    const tilt = (rand() - 0.5) * 2 * most;
    normal = [-Math.sin(tilt), Math.cos(tilt)];
  }
  // the piece's middle: half way from the line to the far edge of the body that way
  const far: [number, number] = [normal[0] > 0.5 ? span.right : normal[0] < -0.5 ? span.left : point[0], normal[1] > 0.5 ? span.top : normal[1] < -0.5 ? span.bottom : point[1]];
  const middle: [number, number] = [(point[0] + far[0]) / 2, (point[1] + far[1]) / 2];
  const sideways = Math.abs(normal[0]) > 0.5;
  const extent: [number, number] = [sideways ? Math.max(0.08, Math.abs(far[0] - point[0])) : wide, sideways ? tall : Math.max(0.08, Math.abs(far[1] - point[1]))];
  // thrown away from the blade, to its own side of the screen, and up; a torn lump slides, a broken chunk drops
  const scale = Math.min(2.2, Math.max(0.7, Math.sqrt(i.size.h / 2)));
  const share = i.kind === 'split' ? GORE_FX.splitSlide : i.kind === 'chip' ? GORE_FX.chipDrop : 1;
  const speed = between(rand, GORE_FX.speed) * scale * share;
  const side = (normal[0] >= 0 ? 1 : -1) * (Math.abs(normal[0]) > 0.3 ? 0.9 : 0.35);
  const velocity = {
    x: (i.blow.x * 0.75 + i.across.x * side) * speed,
    y: between(rand, GORE_FX.lift) * scale * (i.kind === 'sever' ? 1 : 0.25),
    z: (i.blow.z * 0.75 + i.across.z * side) * speed,
  };
  const turns = i.kind === 'sever' ? between(rand, GORE_FX.turns) : 0.05 + 0.08 * rand();
  const air = (2 * velocity.y) / 9.8 + 0.35; // about how long it is in the air
  const spin = ((normal[0] >= 0 ? -1 : 1) * turns * Math.PI * 2) / air; // falling the way it was thrown
  const toFrame = (x: number, y: number): [number, number] => [i.mirror ? 1 - x : x, 1 - y];
  return {
    kind: i.kind,
    point: toFrame(point[0], point[1]),
    angle: Math.atan2(-normal[1], i.mirror ? -normal[0] : normal[0]), // (the normal in the frame: x flips with a mirror, y always)
    middle: toFrame(middle[0], middle[1]),
    extent,
    velocity,
    spin,
  };
}

/** A severed piece in flight, then at rest: where its middle is, how far it has turned. */
export interface Piece {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  turn: number;
  spin: number;
  rests: number; // times it has come down
  /** Metres from its middle to its lowest point, as it lies turned: [as drawn, turned a quarter]. */
  half: readonly [number, number];
}

export function startPiece(plan: CutPlan, at: { x: number; y: number; z: number }, half: readonly [number, number]): Piece {
  return { ...at, vx: plan.velocity.x, vy: plan.velocity.y, vz: plan.velocity.z, turn: 0, spin: plan.spin, rests: 0, half };
}

/** How far below its middle the piece reaches, turned `turn` radians. */
export const reachDown = (p: Piece): number => Math.abs(Math.cos(p.turn)) * p.half[0] + Math.abs(Math.sin(p.turn)) * p.half[1];

/** One step of `dt` seconds over ground at height `ground`: it falls, turns, comes down, gives a little and lies. Returns whether it struck the ground this step. */
export function stepPiece(p: Piece, dt: number, ground: number): boolean {
  p.vy -= 9.8 * dt;
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  p.z += p.vz * dt;
  p.turn += p.spin * dt;
  const rest = ground + reachDown(p);
  if (p.y > rest) return false;
  p.y = rest;
  const struck = p.vy < -0.6;
  if (p.rests === 0) [p.vy, p.vx, p.vz, p.spin] = [-p.vy * 0.22, p.vx * 0.35, p.vz * 0.35, p.spin * 0.3];
  else {
    p.vy = 0;
    const k = Math.exp(-7 * dt);
    [p.vx, p.vz, p.spin] = [p.vx * k, p.vz * k, p.spin * k];
  }
  p.rests++;
  return struck;
}

