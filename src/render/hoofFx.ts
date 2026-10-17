/**
 * What a ride throws up (round 50): a puff of dust where each hoof comes down (the gait's own footfalls, the frames the
 * hoofbeats are heard on), a spray where it strikes the shallows, a spark from an iron shoe on stone at the gallop, a violet ember
 * from a skeleton's bone; the wheels of every mount kick a thin dust of their own on loose ground. Render only: read from the
 * simulation's mount state, so the dust, the sound and the picture's feet are one gait.
 */
import type { V3 } from '../core/geom';
import type { Game } from '../systems/components';
import { gaitAt, hoofWeight, touchdowns } from '../systems/mountGait';
import { surfaceAt, type Surface } from './audio/foley';
import { DRAFT_PLACE } from './draftHorse';
import { LEGS } from './horseLegs';
import { BASE, mixRgb, scaleRgb, type Rgb } from './palette';
import type { Particles } from './particles';
import { wetness } from './wetness';

const DIRT: Rgb = mixRgb(BASE.rust, BASE.seaGrey, 0.55);
const ROAD: Rgb = mixRgb(BASE.bone, BASE.seaGrey, 0.5);
const SPLASH: Rgb = mixRgb(BASE.bone, BASE.seaGrey, 0.8);
const SPARK: Rgb = mixRgb(BASE.bone, [1, 0.85, 0.6], 0.6);
const EMBER: Rgb = [0.6, 0.18, 0.95];
const rand = (a: number, b: number): number => a + (b - a) * Math.random();

export interface HoofFx {
  update(time: number): void;
}

export function createHoofFx(g: Game, fx: Particles): HoofFx {
  let was = 0;
  let before = -1;
  let metres = 0;
  const where = (at: V3, yaw: number, x: number, z: number): V3 => {
    const [s, c] = [Math.sin(yaw), Math.cos(yaw)];
    const wx = at.x + x * c + z * s;
    const wz = at.z - x * s + z * c;
    return { x: wx, y: g.world.ground(wx, wz), z: wz };
  };
  const kick = (p: V3, surface: Surface, weight: number, scale = 1): void => {
    const wet = surface !== 'water' && wetness.value > 0.3;
    const n = Math.max(1, Math.round((1 + 2.5 * weight) * scale));
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      if (surface === 'water') fx.spawn({ x: p.x, y: p.y + 0.05, z: p.z, vx: Math.cos(a) * 1.4, vy: rand(1, 3 + 2 * weight), vz: Math.sin(a) * 1.4, life: rand(0.35, 0.6), size: rand(0.07, 0.14), grow: 0.6, color: SPLASH, alpha: 0.8, gravity: 9, drag: 1 });
      else fx.spawn({ x: p.x, y: p.y + 0.08, z: p.z, vx: Math.cos(a) * rand(0.4, 1.2), vy: rand(0.3, 0.9 + weight), vz: Math.sin(a) * rand(0.4, 1.2), life: rand(0.45, 0.9), size: rand(0.2, 0.34) * (0.7 + 0.5 * weight), grow: 2.2, color: wet ? scaleRgb(DIRT, 0.7) : surface === 'dirt' ? DIRT : ROAD, alpha: wet ? 0.5 : 0.38, drag: 3 });
    }
  };
  const sparks = (p: V3): void => {
    for (let i = 0; i < 3; i++) fx.spawn({ x: p.x, y: p.y + 0.05, z: p.z, vx: rand(-1.5, 1.5), vy: rand(0.6, 2), vz: rand(-1.5, 1.5), life: rand(0.15, 0.3), size: rand(0.04, 0.07), grow: 0.5, color: SPARK, glow: true, gravity: 9, drag: 1 });
  };

  return { update(time) {
    const dt = before < 0 ? 0 : Math.min(0.25, Math.max(0, time - before));
    before = time;
    const mount = g.player.mount;
    const tr = g.ecs.c.transform.get(g.player.id);
    if (!mount.active || !tr || g.ecs.c.dead.has(g.player.id) || dt === 0) {
      was = mount.phase;
      metres = 0;
      return;
    }
    const id = mount.active;
    const speed = Math.max(0, mount.speed);
    const surface = surfaceAt(g, tr.pos.x, tr.pos.y, tr.pos.z);
    const weight = hoofWeight(speed);
    if (id !== 'automobile' && speed > 2.5) {
      const horses = id === 'chariot' ? [{ x: -0.67, z: 2.7, d: 0 }, { x: 0.67, z: 2.7, d: 0.059 }] : [{ x: DRAFT_PLACE.x, z: DRAFT_PLACE.z, d: 0 }];
      const gait = gaitAt(speed);
      for (const horse of horses) for (const leg of touchdowns(was + horse.d, mount.phase + horse.d, speed)) {
        const plan = LEGS[leg];
        const p = where(tr.pos, tr.yaw, horse.x + plan.hip[0], horse.z + plan.hip[2] + (plan.front ? 0.04 : 0) + Math.min(1.5, gait.duty * gait.length) / 2);
        if (id === 'chariot') fx.spawn({ x: p.x, y: p.y + 0.1, z: p.z, vx: rand(-0.4, 0.4), vy: rand(0.5, 1.1), vz: rand(-0.4, 0.4), life: rand(0.5, 0.9), size: 0.16, grow: 0.5, color: EMBER, glow: true, alpha: 0.7, drag: 1.5 });
        else {
          kick(p, surface, weight);
          if (surface === 'stone' && weight > 0.6) sparks(p);
        }
      }
    }
    was = mount.phase;
    metres += speed * dt;
    if (metres > 0.7 && speed > 4 && surface !== 'stone') { // the wheels: a thin dust behind each rear wheel
      metres = 0;
      for (const side of [-1, 1]) kick(where(tr.pos, tr.yaw, side * 0.95, -1.16), surface, weight, 0.5);
    }
  } };
}
