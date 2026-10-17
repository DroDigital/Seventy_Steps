/** Swept, substepped locomotion for both mount appearances. The investigator keeps their ordinary hurtbox. */
import { turnToward, wrapAngle } from '../core/geom';
import { MOUNT_TRAVERSAL } from '../data/mounts';
import type { Game } from './components';
import { footprintClear } from './mountGround';

export function moveMounted(g: Game, dt: number): boolean {
  const p = g.player;
  const mount = p.mount;
  if (!mount.active) return false;
  const tr = g.ecs.c.transform.get(p.id)!;
  const m = g.ecs.c.mover.get(p.id)!;
  const t = MOUNT_TRAVERSAL;
  if (m.face !== null) {
    const rate = p.sprinting ? t.gallopTurnRate : t.turnRate;
    const yaw = turnToward(tr.yaw, m.face, rate * dt);
    if (footprintClear(g, tr.pos, yaw)) tr.yaw = yaw;
  }
  // Steering turns the whole rig before it accelerates into its new direction; never strafe sideways.
  const alignment = m.face === null ? 1 : Math.max(0, Math.cos(wrapAngle(m.face - tr.yaw)));
  const target = Math.hypot(m.vx, m.vz) * alignment;
  const change = (target > mount.speed ? t.acceleration : t.braking) * dt;
  mount.speed += Math.max(-change, Math.min(change, target - mount.speed));
  const distance = mount.speed * dt;
  const n = Math.max(1, Math.ceil(distance / t.substep));
  const step = distance / n;
  const [sx, sz] = [Math.sin(tr.yaw) * step, Math.cos(tr.yaw) * step];
  for (let i = 0; i < n; i++) {
    const next = { x: tr.pos.x + sx, y: tr.pos.y, z: tr.pos.z + sz };
    next.y = g.world.ground(next.x, next.z);
    if (Math.abs(next.y - tr.pos.y) > Math.max(t.maxStep, step * t.maxSlope) || !footprintClear(g, next, tr.yaw)) {
      mount.speed = 0;
      p.sprinting = false;
      break;
    }
    Object.assign(tr.pos, next);
    mount.phase += step / t.stride;
  }
  return true;
}
