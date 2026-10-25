/**
 * What a person met has that moves of itself (round 83; render only, read-only on the simulation), laid over their pose after it is made:
 * the head follows the investigator (figureGaze.ts), a hat, a shawl, a scarf's end and the coat's tails take the breeze and the pace
 * and a turn (figureSway.ts), the eyes blink and, in the waning hour, close (figureBlink.ts), and a merchant shows the rare things
 * they still have to sell. The people only: no creature, and not the investigator, whose lantern and scarf are the player rebuild's.
 * No lean, no breathing, no sway of the body. Under a roof there is no breeze.
 */

import { wrapAngle } from '../core/geom';
import { hash2 } from '../core/rng';
import { FIGURE_LIFE } from '../data/fxTuning';
import type { WareId } from '../data/wares';
import { gustAt } from './airKinds';
import { lidAt, blinkAt } from './figureBlink';
import { easeGaze, gazeAt, gazeTurn, newGaze, type Gaze } from './figureGaze';
import { newHang, stepHang, type Hang, type LooseKind, type SwayIn } from './figureSway';
import type { Figure } from './figures';
import { worldUniforms } from './worldMaterial';

/** Where the wind blows to, in the world's x and z: the very direction the grass is bent in (shaders/world.ts). */
const BLOWS = [0.85, 0.5] as const;

export interface Life {
  gaze: Gaze; // the head, turned toward the investigator
  hang: Record<LooseKind, Hang>;
  yaw: number; // its figure's yaw last frame (NaN: not yet seen), and how fast it is turning, -1..1
  turn: number;
  drowsy: number; // 0..1: how far into a doze on their feet
}

export const newLife = (): Life => ({ gaze: newGaze(), hang: { hat: newHang(), shawl: newHang(), scarf: newHang(), tail: newHang() }, yaw: NaN, turn: 0, drowsy: 0 });

export interface Standing {
  id: number;
  dt: number; // seconds since the last drawn frame
  time: number; // render seconds
  speed: number; // ground speed, m/s
  y: number; // the height they stand at
  /** 0..1: how free they are to look about: at no act, not startled, not carried. */
  free: number;
  /** The investigator, or null when there is no one to look at. */
  me: { x: number; y: number; z: number } | null;
  sheltered: boolean; // under a roof: no breeze
  dozing: boolean; // the waning hour, on their feet, at no post
  stock(ware: WareId): number | undefined; // how many of a ware may still be bought; undefined: no end to them
}

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
const input: SwayIn = { dt: 0, time: 0, phase: 0, fwd: 0, left: 0, walk: 0, turn: 0 };

export function livePerson(f: Figure, life: Life, s: Standing): void {
  const dt = clamp(s.dt, 0, 0.1);
  const root = f.root;
  // the head follows
  const to = s.me && s.free > 0 ? gazeAt(root.rotation.y, s.me.x - root.position.x, s.me.z - root.position.z, s.me.y - s.y) : null;
  easeGaze(life.gaze, to, s.free, dt);
  if (life.gaze.weight > 0) {
    const turn = gazeTurn(life.gaze);
    f.head.rotation.y += turn.yaw;
    f.head.rotation.x += turn.pitch;
  }
  // the breeze on them, in their own frame, and the pace and the turn
  const yaw = root.rotation.y;
  const rate = Number.isNaN(life.yaw) || dt <= 0 ? 0 : wrapAngle(yaw - life.yaw) / dt;
  life.yaw = yaw;
  life.turn += (clamp(rate / 3, -1, 1) - life.turn) * Math.min(1, dt * 6);
  const u = worldUniforms;
  const blow = s.sheltered ? 0 : clamp(Number(u.uWind.value) / FIGURE_LIFE.gale, 0, 1) * (0.3 + 0.7 * gustAt(Number(u.uTime.value), root.position.x, root.position.z));
  input.dt = dt;
  input.time = s.time;
  input.fwd = blow * (BLOWS[0] * Math.sin(yaw) + BLOWS[1] * Math.cos(yaw));
  input.left = blow * (BLOWS[0] * Math.cos(yaw) - BLOWS[1] * Math.sin(yaw));
  input.walk = clamp(s.speed / 1.6, 0, 1);
  input.turn = life.turn;
  const L = f.loose;
  const sway = (kind: LooseKind, part: number, sign: 1 | -1, free = 1): Hang => {
    input.phase = hash2(s.id, part, 3) * Math.PI * 2;
    const fwd = input.fwd;
    const left = input.left;
    input.fwd = fwd * free;
    input.left = left * free;
    const h = stepHang(life.hang[kind], kind, input, sign);
    input.fwd = fwd;
    input.left = left;
    return h;
  };
  if (L?.hat) {
    const h = sway('hat', 0, -1, L.hat.k);
    L.hat.group.rotation.set(h.pitch, 0, h.roll);
  }
  if (L?.shawl) {
    const h = sway('shawl', 1, 1);
    L.shawl.rotation.set(h.pitch, 0, h.roll);
  }
  if (L?.scarf) {
    const h = sway('scarf', 2, 1);
    L.scarf.rotation.set(h.pitch, 0, h.roll);
  }
  if (f.skirt.length) {
    const h = sway('tail', 3, 1);
    for (const panel of f.skirt) {
      panel.rotation.x += h.pitch; // (on the swing of the thighs the pose gave them)
      panel.rotation.z += h.roll;
    }
  }
  // the eyes
  if (L?.eyes) {
    life.drowsy += ((s.dozing && life.gaze.weight < 0.1 ? 1 : 0) - life.drowsy) * Math.min(1, dt * 1.5);
    L.eyes.scale.y = 1 - 0.92 * lidAt(blinkAt(s.time, s.id), life.drowsy);
  }
  // what a merchant still has to sell
  if (L?.wares) for (const ware in L.wares) L.wares[ware as WareId]!.visible = (s.stock(ware as WareId) ?? 0) > 0;
}
