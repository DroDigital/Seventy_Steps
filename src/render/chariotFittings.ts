/**
 * What the plain chariot wears in place of a roof (round 56): its roof and posts stood between the follow camera and the rider, so it is
 * open now, with a dashboard before the rider, armrests, fenders over the wheels and a step and rail at its tail. A lantern hangs on each
 * side from an iron crook bolted to the box (round 57), beside the driver and clear of the wheels, and swings on its ring as the rig goes
 * (lanternSway.ts).
 */
import * as THREE from 'three';
import { MOUNT_COLORS as C, MountBuilder, coachLamp, group, orb, panel, ring, rod, tube } from './mountKit';
import { createSway, stepSway, type Sway } from './lanternSway';
import type { Rgb } from './palette';

/** A lantern on its hook: `pivot` is where the ring meets the hook, and what swings hangs from it. */
export interface SideLamp { pivot: THREE.Group; sway: Sway; seed: number }
/** What the ride does to them, as the mount's update knows it. */
export interface LampRide { dt: number; time: number; cycle: number; accel: number; lateral: number; speed: number; pitch: number; roll: number }

const LAMP_AT = { x: 1.0, y: 1.42, z: -0.3 } as const; // the hook, in the box's frame: out beside the driver's hip, above the wheel's arch and between the two fenders

export function swayLamps(lamps: readonly SideLamp[], r: LampRide): void {
  for (const l of lamps) {
    stepSway(l.sway, r.dt, { accel: r.accel, lateral: r.lateral, pitch: r.pitch, roll: r.roll, speed: r.speed, time: r.time, cycle: r.cycle, seed: l.seed });
    l.pivot.rotation.set(l.sway.x, 0, l.sway.z);
  }
}

/** A mudguard arching over a wheel: slabs laid along the arc, each tilted to follow it, and a stay down to the body. */
function fender(x: number, z: number, wheel: number, bodyX: number): THREE.BufferGeometry[] {
  const radius = wheel + 0.1, from = 0.32, to = Math.PI - 0.32, slabs = 9;
  const out: THREE.BufferGeometry[] = [];
  for (let i = 0; i < slabs; i++) {
    const a = from + ((to - from) * (i + 0.5)) / slabs;
    out.push(panel(0.26, 0.035, ((radius * (to - from)) / slabs) * 1.14, 0, 0, 0, C.iron, 0.012).rotateX(Math.PI / 2 - a).translate(x, wheel + radius * Math.sin(a), z + radius * Math.cos(a)));
  }
  out.push(rod([x, wheel + radius, z], [bodyX, 0.98, z], 0.022, C.iron));
  return out;
}

export function chariotFittings(b: MountBuilder, body: THREE.Object3D, paint: Rgb): SideLamp[] {
  const pieces: THREE.BufferGeometry[] = [
    // the dashboard before the rider's feet, with its brass cap
    panel(1.5, 0.34, 0.07, 0, 1.08, 0.92, paint), panel(1.58, 0.045, 0.12, 0, 1.27, 0.93, C.brass),
    // the tail: a step, and a rail to hold by
    panel(0.8, 0.06, 0.3, 0, 0.62, -2.05, C.iron),
    rod([-0.55, 1.26, -1.88], [-0.55, 1.46, -1.88], 0.022, C.brass), rod([0.55, 1.26, -1.88], [0.55, 1.46, -1.88], 0.022, C.brass), rod([-0.55, 1.46, -1.88], [0.55, 1.46, -1.88], 0.02, C.brass),
  ];
  const lamps: SideLamp[] = [];
  for (const side of [-1, 1]) {
    pieces.push(
      // the lamp's bracket: a strap bolted down the side of the box, and a crook rising and curling out of it to the hook
      panel(0.03, 0.26, 0.07, side * 0.83, 1.16, LAMP_AT.z, C.iron, 0.008), orb(0.016, [side * 0.85, 1.06, LAMP_AT.z], C.brass), orb(0.016, [side * 0.85, 1.26, LAMP_AT.z], C.brass),
      tube([[side * 0.84, 1.24, LAMP_AT.z], [side * 0.885, 1.33, LAMP_AT.z], [side * 0.95, 1.41, LAMP_AT.z], [side * LAMP_AT.x, 1.445, LAMP_AT.z]], 0.016, C.iron),
      ring(0.03, 0.007, [side * LAMP_AT.x, LAMP_AT.y + 0.005, LAMP_AT.z], C.brass),
      tube([[side * 0.7, 1.31, -0.15], [side * 0.7, 1.52, -0.05], [side * 0.7, 1.52, 0.38], [side * 0.7, 1.42, 0.43]], 0.028, C.brass),
      rod([side * 0.7, 1.5, 0.38], [side * 0.7, 0.93, 0.38], 0.03, paint),
      ...fender(side * 0.96, -1.16, 0.72, side * 0.78), ...fender(side * 0.91, 0.52, 0.51, side * 0.78),
    );
    const pivot = group(body, side * LAMP_AT.x, LAMP_AT.y, LAMP_AT.z);
    pivot.name = 'side-lantern';
    coachLamp(b, pivot, 0, -0.26, 0, false); // the lantern hangs below the hook by its own loop
    lamps.push({ pivot, sway: createSway(), seed: side * 1.7 + 3 });
  }
  b.add(body, pieces, 'wood');
  return lamps;
}
