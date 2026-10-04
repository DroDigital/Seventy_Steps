/**
 * The people at what they do (round 39; data/npcActs.ts): each act a pose of the arms, the head and, for those
 * who sit, the legs and the pelvis, moved by time so that it is never still and never the same twice running: a
 * page turned now and then, a glance up, a draw on the pipe, a stroke of the knife with a pause between. `k` is
 * how far they are into it (0 standing about, 1 at it), so that sitting down and getting up are eased. Render only.
 */

import { SEATED, type ActKind } from '../data/npcActs';
import type { Figure } from './figures';

type Joint = Figure['legR'];
type Act = (f: Figure, k: number, t: number) => void;

const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));
const ease = (x: number): number => {
  const c = clamp01(x);
  return c * c * (3 - 2 * c);
};

/** `j` eased toward a pose by `k`. */
function to(j: Joint, k: number, x: number, y = 0, z = 0): void {
  j.rotation.x += (x - j.rotation.x) * k;
  j.rotation.y += (y - j.rotation.y) * k;
  j.rotation.z += (z - j.rotation.z) * k;
}

/** 0 → 1 → 0: from `from` seconds into every `period` seconds, for `len`, rising and falling over `edge`. */
function pulse(t: number, period: number, from: number, len: number, edge = 0.45): number {
  const u = (((t % period) + period) % period) - from;
  return u < 0 || u > len ? 0 : Math.min(ease(u / edge), ease((len - u) / edge));
}

/** Both arms, as one: an upper arm, a forearm bent at the elbow, and how far both are turned in (the right is the first of the pair, the left the same unless given). */
function arms(f: Figure, k: number, [ar, er, yr]: readonly [number, number, number?], [al, el, yl]: readonly [number, number, number?] = [ar, er, yr]): void {
  to(f.armR, k, ar, yr ?? 0);
  to(f.elbowR, k, er);
  to(f.armL, k, al, -(yl ?? 0));
  to(f.elbowL, k, el);
}

/** Down on whatever is under them: the pelvis low, the thighs level, the shins down. */
function sit(f: Figure, k: number): void {
  f.body.position.y -= 0.46 * k;
  to(f.legR, k, -1.5, 0.1);
  to(f.kneeR, k, 1.5);
  to(f.legL, k, -1.5, -0.1);
  to(f.kneeL, k, 1.5);
}

/** The slow rise and fall of breathing, so nobody is a statue. */
function breathe(f: Figure, k: number, t: number): void {
  f.torso.rotation.x += 0.014 * Math.sin(t * 1.7) * k;
  f.head.rotation.y += 0.05 * Math.sin(t * 0.37 + 1) * k;
}

/** The smoker's draw on his pipe, and the breath let out after it (shared with the smoke: render/pipeSmoke.ts). */
export function pipeBeat(t: number): { draw: number; out: number } {
  return { draw: pulse(t, 15, 6, 5, 0.9), out: pulse(t, 15, 11.4, 2.2, 0.5) };
}

const ACTS: Readonly<Record<ActKind, Act>> = {
  // Seated well back in a chair, a book held open in both hands before the chest; a page turned every while, a glance up from it, and now and then the shifting of a leg.
  read(f, k, t) {
    const turn = pulse(t, 11, 8, 1.5);
    const glance = pulse(t, 17, 12, 2.4, 0.7);
    const shift = pulse(t, 23, 15, 2.2, 0.8);
    sit(f, k);
    to(f.legR, k * shift, -1.62, 0.28);
    arms(f, k, [-0.42, -1.5, 0.33], [-0.42 - 0.2 * turn, -1.5 - 0.2 * turn, 0.33 - 0.15 * turn]);
    to(f.torso, k, -0.02 + 0.04 * shift);
    to(f.head, k * (1 - glance), 0.5 + 0.03 * Math.sin(t * 0.5));
    to(f.head, k * glance, -0.05, 0.45 * Math.sin(t * 0.9));
    breathe(f, k, t);
  },
  // Leaning back against a post, one foot crossed over the other, an arm across the chest; the other hand with the pipe: held at the chest, now and then up to the mouth for a long draw, and a breath let out.
  lounge(f, k, t) {
    const { draw, out } = pipeBeat(t);
    const idle = pulse(t, 19, 4, 3.5, 1);
    f.body.rotation.x -= 0.2 * k;
    f.body.position.z -= 0.17 * k;
    f.body.rotation.z += 0.025 * k;
    to(f.legR, k, -0.06, 0.06, -0.22);
    to(f.legL, k, 0.1, 0, 0.04);
    to(f.footR, k, 0.12 * pulse(t, 14, 9, 1.2, 0.3) * Math.sin(t * 9), 0.3);
    arms(f, k, [-0.4 - 0.25 * draw, -1.2 - 1.3 * draw, 0.2], [-0.35, -1.65, 0.55]);
    to(f.torso, k, -0.02 - 0.03 * draw);
    to(f.head, k, -0.1 - 0.12 * out + 0.06 * draw, 0.45 * idle * Math.sin(t * 0.8) + 0.05 * Math.sin(t * 0.3));
    breathe(f, k, t);
  },
  // Seated, a notebook on the knee, a pen: scribbling, then a pause to look up and think.
  write(f, k, t) {
    const think = pulse(t, 14, 9, 3.4, 0.6);
    const scribble = (1 - think) * (Math.sin(t * 13) * 0.08 + Math.sin(t * 2.3) * 0.06);
    sit(f, k);
    arms(f, k, [-0.4 - 0.25 * think, -1.3 - 0.4 * think, 0.45], [-0.3, -1.1, 0.35]);
    to(f.handR, k, 0, scribble, 0);
    to(f.torso, k, 0.3 * (1 - think));
    to(f.head, k * (1 - think), 0.55 + 0.05 * Math.sin(t * 0.8));
    to(f.head, k * think, -0.1, 0.35);
    breathe(f, k, t);
  },
  // Seated, the pipe in the hand on the knee; every while, up to the mouth, a long draw, and down again.
  smoke(f, k, t) {
    const draw = pulse(t, 15, 6, 5, 0.9);
    sit(f, k);
    arms(f, k, [-0.35 - 0.2 * draw, -1.15 - 1.35 * draw, 0.15], [-0.3, -1.1, 0.15]);
    to(f.torso, k, 0.1 - 0.06 * draw);
    to(f.head, k, 0.12 - 0.25 * draw, 0.1 * Math.sin(t * 0.3));
    breathe(f, k, t);
  },
  // Standing, hands clasped behind, the head back; the weight shifting, the face turning a little by little.
  gaze(f, k, t) {
    to(f.armR, k, 0.4, 0, 0.3);
    to(f.armL, k, 0.4, 0, -0.3);
    to(f.elbowR, k, -0.4);
    to(f.elbowL, k, -0.4);
    to(f.torso, k, -0.06);
    to(f.head, k, -0.5 + 0.06 * Math.sin(t * 0.5), 0.45 * Math.sin(t * 0.21));
    f.body.rotation.z += 0.02 * Math.sin(t * 0.4) * k;
    breathe(f, k, t);
  },
  // Seated and swaying, a bottle in the hand on the knee; up it goes, the head back, and down; the head nods.
  drink(f, k, t) {
    const sup = pulse(t, 17, 7, 4.5, 0.9);
    sit(f, k);
    arms(f, k, [-0.3 - 0.25 * sup, -1.1 - 1.4 * sup, 0.12], [-0.3, -1.0, 0.12]);
    to(f.torso, k, 0.12 - 0.12 * sup, 0, 0.06 * Math.sin(t * 0.55));
    to(f.head, k, 0.2 - 0.6 * sup + 0.08 * Math.sin(t * 0.9), 0.15 * Math.sin(t * 0.4));
    breathe(f, k, t);
  },
  // Seated, the stick in the left hand, the knife in the right: strokes toward the body, then a look at the work.
  whittle(f, k, t) {
    const look = pulse(t, 12, 8, 2.5, 0.5);
    const stroke = (1 - look) * (0.5 + 0.5 * Math.sin(t * 5.2));
    sit(f, k);
    arms(f, k, [-0.35 - 0.1 * stroke, -1.3 - 0.2 * stroke, 0.45], [-0.4, -1.2, 0.35]);
    to(f.handR, k, 0.15 * stroke, 0.25 * stroke);
    to(f.torso, k, 0.25);
    to(f.head, k, 0.5 - 0.5 * look, 0.2 * look);
    breathe(f, k, t);
  },
  // Standing, the chart held open in both hands; now and then it is lowered and a hand points at the far hills.
  map(f, k, t) {
    const point = pulse(t, 13, 8, 3.6, 0.7);
    arms(f, k, [-0.5 - 0.95 * point, -1.15 + 0.95 * point, 0.4 - 0.4 * point], [-0.5, -1.15, 0.4]);
    to(f.head, k, 0.3 - 0.35 * point, 0.7 * point * Math.sin(t * 0.35 + 1));
    breathe(f, k, t);
  },
  // Seated, a blade across the knees; a cloth drawn the length of it, over and over, the head bent to it.
  polish(f, k, t) {
    const rest = pulse(t, 16, 12, 2.5, 0.5);
    const rub = (1 - rest) * Math.sin(t * 2.4);
    sit(f, k);
    arms(f, k, [-0.45, -0.9, 0.15 + 0.32 * rub], [-0.4, -0.8, 0.25]);
    to(f.torso, k, 0.22);
    to(f.head, k, 0.5 - 0.5 * rest, 0.3 * rest + 0.25 * rub);
    breathe(f, k, t);
  },
  // Seated, a coil of rope in the lap, both hands working it: small turns, and every while a pull to test it.
  mend(f, k, t) {
    const pull = pulse(t, 10, 6, 1.6, 0.4);
    sit(f, k);
    arms(f, k, [-0.45 - 0.1 * pull, -1.1 - 0.3 * pull, 0.35 - 0.15 * pull]);
    to(f.handR, k, 0.1 * Math.sin(t * 3.1), 0.1 * Math.sin(t * 2.2));
    to(f.handL, k, 0.1 * Math.sin(t * 2.7 + 1), 0, 0.1 * Math.sin(t * 3.4));
    to(f.torso, k, 0.3);
    to(f.head, k, 0.55 - 0.2 * pull);
    breathe(f, k, t);
  },
  // Seated bolt upright, the hands on the knees, and the head turning by degrees, in jerks, a little too far.
  brood(f, k, t) {
    const [a, b] = [Math.floor(t / 6.5), (t / 6.5) % 1];
    const aim = (n: number): number => 0.9 * Math.sin(n * 2.4 + 1) + 0.4 * Math.sin(n * 5.1);
    const turn = aim(a) + (aim(a + 1) - aim(a)) * ease((b - 0.7) / 0.3); // still for most of it, then round
    const twitch = pulse(t, 9.3, 7, 0.12, 0.04);
    sit(f, k);
    arms(f, k, [-0.3, -0.55, 0.1]);
    to(f.torso, k, -0.04);
    to(f.head, k, 0.02 - 0.15 * twitch, turn + 0.2 * twitch);
  },
  // Standing, the silver key held up in the left hand and turned in the light; then lowered and looked past.
  key(f, k, t) {
    const past = pulse(t, 14, 9, 3.2, 0.7);
    to(f.armL, k, -1.0 + 0.6 * past, -0.3 * (1 - past));
    to(f.elbowL, k, -1.7 + 1.1 * past);
    to(f.handL, k, 0, 1.4 * Math.sin(t * 0.9) * (1 - past));
    to(f.head, k, 0.12 - 0.3 * past, 0.35 * past * Math.sin(t * 0.6));
    breathe(f, k, t);
  },
  // Standing, the vial raised to the eye and tilted this way and that; now and then, a shake, a look at the lamp.
  vial(f, k, t) {
    const shake = pulse(t, 12, 8, 1.4, 0.3);
    arms(f, k, [-0.9, -1.9 + 0.15 * Math.sin(t * 0.8), 0.1], [-0.25, -0.9, 0.2]);
    to(f.handR, k, 0.15 * Math.sin(t * 0.8), 0.3 * Math.sin(t * 0.55), 0.4 * shake * Math.sin(t * 22));
    to(f.head, k, 0.05, -0.2 + 0.15 * Math.sin(t * 0.4));
    breathe(f, k, t);
  },
  // Standing, the watch taken out and held in the palm: looked at, held to the ear, looked at again, put away.
  watch(f, k, t) {
    const listen = pulse(t, 13, 7, 3, 0.6);
    const away = pulse(t, 13, 11, 2, 0.5);
    const out = 1 - away;
    arms(f, k, [-0.5 * out - 0.1 * listen, -1.2 * out - 1.2 * listen, 0.25], [-0.1, -0.35, 0.05]);
    to(f.head, k, 0.4 * out * (1 - listen), 0.55 * listen);
    to(f.torso, k, 0, 0.1 * listen);
    breathe(f, k, t);
  },
  // Standing, both hands on the cane planted before them, the weight on it; looking slowly about, a tap of its foot.
  lean(f, k, t) {
    const tap = pulse(t, 8, 6, 0.7, 0.2);
    arms(f, k, [-0.4, -0.4, 0.05], [-0.5, -0.8, 0.3]);
    to(f.torso, k, 0.1);
    to(f.head, k, 0.05 - 0.05 * tap, 0.55 * Math.sin(t * 0.33) + 0.2 * Math.sin(t * 0.9));
    to(f.handR, k, 0.12 * tap * Math.sin(t * 30));
    breathe(f, k, t);
  },
};

/** The pose of `kind` laid over a figure at rest (or mid-stride), `k` of the way into it, `t` seconds on. */
export function actPose(f: Figure, kind: ActKind, k: number, t: number): void {
  const e = ease(k);
  ACTS[kind](f, e, t);
}

export const actSits = (kind: ActKind): boolean => SEATED.has(kind);
