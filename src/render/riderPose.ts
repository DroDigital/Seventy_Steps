/**
 * The seated driver (round 57 rework of round 50's pose): knees bent on the bench, hands on the reins, weight braced through speed
 * and turns, and now what the hands do (systems/mountReins.ts): a gallop leans the driver into it and slaps the reins, a halt hauls both
 * hands to the chest and sits back, a turn draws the inside hand to its side. Render only.
 */
import type { MountId } from '../data/mounts';
import { REINS, slapAt, type ReinState } from '../systems/mountReins';
import type { Figure } from './figures';

/** What the hands are doing: `pull` and `guide` (-1 right to 1 left) as the simulation keeps them, the slap's arms (`lift`, `snap`), and its ripple (`ripple` on the reins, `arrive` when it reaches the bit). */
export interface RiderCue { pull: number; guide: number; lift: number; snap: number; ripple: number; arrive: number }
export const CALM: RiderCue = Object.freeze({ pull: 0, guide: 0, lift: 0, snap: 0, ripple: -1, arrive: 0 });

/** The cue for this frame; `ahead` seconds carries a slap on to where the picture is between two steps of the simulation. */
export function riderCue(r: ReinState, ahead = 0): RiderCue {
  const s = slapAt(r.slapAge < REINS.total ? r.slapAge + ahead : r.slapAge);
  return { pull: r.pull, guide: r.guide, lift: s.lift, snap: s.snap, ripple: s.ripple, arrive: s.arrive };
}

const smooth = (t: number): number => { const c = Math.min(1, Math.max(0, t)); return c * c * (3 - 2 * c); };

/** A seated driver with bent knees, hands on reins/wheel, weight braced through acceleration and turns. */
export function poseMountedRider(f: Figure, id: MountId, time: number, speed: number, turn = 0, cue: RiderCue = CALM): void {
  const moving = Math.min(1, Math.max(0, speed) / 3), reins = id !== 'automobile';
  const steer = Math.max(-1, Math.min(1, turn));
  const run = reins ? smooth((speed - 7.2) / 3) : 0; // a gallop: leaning into it
  const { pull, lift, snap } = reins ? cue : CALM;
  const carSpeed = !reins ? smooth(speed / 10.5) : 0;
  const carVibe = !reins ? Math.sin(time * 38) * (0.0022 * (1 - 0.6 * moving) + 0.0012 * moving) : 0;
  const lean = reins
    ? 0.1 * run - 0.05 * lift + 0.09 * snap - 0.18 * pull // the torso's pitch for the hands' work: forward into a gallop and the slap's snap, back to wind up and to haul
    : 0.055 * carSpeed; // subtle forward focus at speed in the motor car
  f.body.position.set(0, 0.48 + Math.sin(time * 7) * 0.008 * moving + carVibe, 0);
  f.body.rotation.set(0.045 + moving * 0.035 - 0.05 * pull, 0, -steer * (reins ? 0.025 : 0.055 * (0.35 + 0.65 * moving)));
  f.torso.rotation.set(Math.sin(time * 1.6) * 0.012 + lean, steer * (reins ? 0.05 : 0.12), !reins ? -steer * 0.045 : 0);
  f.head.rotation.set(-0.035 - 0.7 * lean, steer * (reins ? 0.15 : 0.28), !reins ? steer * 0.04 : 0); // eyes track cleanly into the turn
  for (const [leg, knee, foot, side] of [[f.legR, f.kneeR, f.footR, -1], [f.legL, f.kneeL, f.footL, 1]] as const) {
    leg.rotation.set(-1.38 + 0.06 * pull, 0, side * 0.08); knee.rotation.set(1.32 - 0.22 * pull, 0, 0); foot.rotation.set(0.04, 0, 0); // braced against the footboard to haul
  }
  for (const [arm, elbow, hand, side] of [[f.armR, f.elbowR, f.handR, -1], [f.armL, f.elbowL, f.handL, 1]] as const) {
    if (!reins) {
      // Hands grip the mahogany steering wheel rim and articulate naturally as the wheel turns left/right!
      // Left turn (+steer): left hand (side=+1) drops & pulls down; right hand (side=-1) lifts & reaches across.
      const liftHand = -side * steer;
      arm.rotation.set(
        -0.88 - 0.26 * liftHand - 0.04 * carSpeed,
        side * -0.14 - steer * 0.16,
        side * 0.08 + liftHand * 0.12,
      );
      elbow.rotation.set(-0.56 + 0.14 * liftHand, 0, 0);
      hand.rotation.set(0.08 * liftHand, 0, side * 0.14 - steer * 0.22);
      continue;
    }
    const inside = side > 0 ? Math.max(0, cue.guide) : Math.max(0, -cue.guide), outside = side > 0 ? Math.max(0, -cue.guide) : Math.max(0, cue.guide);
    const draw = Math.min(1, pull + 0.45 * inside); // how far this hand is drawn in to the chest: a halt, or the hand of the side it is going to
    arm.rotation.set(-0.65 - 0.1 * run + 0.47 * draw - 0.55 * lift + 0.5 * snap - 0.08 * outside, side * (-0.12 + 0.1 * draw), side * 0.08);
    elbow.rotation.set(-0.93 - 0.08 * run - 0.69 * draw + 0.28 * lift - 0.45 * snap, 0, 0);
    hand.rotation.set(0.25 * draw + 0.6 * lift - 0.9 * snap, 0, side * 0.12); // the wrist cocks to wind up and flicks down on the strike
  }
  for (const skirt of f.skirt) skirt.rotation.x = -1.05;
  for (const weapon of Object.values(f.arms ?? {})) weapon.visible = false;
  if (f.gun) f.gun.visible = false;
  if (f.flash) f.flash.visible = false;
}
