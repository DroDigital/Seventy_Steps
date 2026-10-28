/** Explicit strategies for encounters whose objective is not simply standing next to the boss. */
import type { Entity } from '../src/core/ecs';
import { distXZ } from '../src/core/geom';
import type { Game } from '../src/systems/components';
import { lampsOf, litNear } from '../src/systems/reality';
import { moveDef } from '../src/systems/actions';

/** A learned punish window, based on the visible attack timeline and the pause between blows. */
export function punishWindow(g: Game, boss: Entity): boolean {
  const c = g.ecs.c;
  const a = c.actor.get(boss);
  const d = a && moveDef(a);
  if (!a?.move || !d) return (c.brain.get(boss)?.cooldown ?? 0) > 20;
  const last = Math.max(d.hit?.window[1] ?? 0, d.sweep?.window[1] ?? 0, d.volley?.frame ?? 0, d.marks?.frame ?? 0, d.wave?.frame ?? 0, d.shot?.frame ?? 0, d.pool?.frame ?? 0, d.barrage?.window[1] ?? 0);
  return last > 0 && a.frame > last + 6;
}

export function lampCover(g: Game, boss: Entity): { x: number; z: number } | null {
  const f = g.ecs.c.fight.get(boss);
  if (!f?.script.phases[f.phase]?.realityHooks?.includes('light_dependency')) return null;
  const c = g.ecs.c;
  const me = c.transform.get(g.player.id)!.pos;
  const lamps = lampsOf(g, f);
  if (!lamps.length) return null;
  const lit = lamps.filter((e) => c.prop.get(e)?.lit);
  if (lit.length && litNear(g, f, boss)) return null;
  const candidates = lit.length ? lit : lamps;
  const nearest = candidates.reduce((a, b) => distXZ(me, c.transform.get(a)!.pos) < distXZ(me, c.transform.get(b)!.pos) ? a : b);
  return c.transform.get(nearest)!.pos;
}

/** Walk out of visible damaging ground; this uses the same marked radii available to a player. */
export function groundEscape(g: Game): { x: number; z: number } | undefined {
  const c = g.ecs.c;
  const me = c.transform.get(g.player.id)!.pos;
  const spots = [...c.hazard].filter(([, h]) => h.faction === 'enemy' && h.damage > 0 && g.player.mended <= 0).map(([e, h]) => ({ at: c.transform.get(e)!.pos, radius: h.radius + 0.7 }));
  for (const [e, m] of c.mark) if (m.faction === 'enemy' && m.delay < 70) spots.push({ at: c.transform.get(e)!.pos, radius: m.radius + 0.8 });
  const inside = spots.filter((s) => distXZ(me, s.at) < s.radius);
  if (!inside.length) return undefined;
  let best = { x: 1, z: 0 };
  let score = -Infinity;
  for (let i = 0; i < 16; i++) {
    const dir = { x: Math.sin(i * Math.PI / 8), z: Math.cos(i * Math.PI / 8) };
    const at = { x: me.x + dir.x * 3, z: me.z + dir.z * 3 };
    const room = Math.min(...spots.map((s) => distXZ(at, s.at) - s.radius));
    if (room > score) { score = room; best = dir; }
  }
  return best;
}

/** Roll on a bolt's approach, rather than at the much earlier casting animation. */
export function incomingBolt(g: Game): string | undefined {
  const c = g.ecs.c;
  const p = c.transform.get(g.player.id)!.pos;
  for (const [e, b] of c.bolt) {
    if (b.faction !== 'enemy') continue;
    const at = c.transform.get(e)!.pos;
    const speed = b.vel.x ** 2 + b.vel.z ** 2;
    if (!speed) continue;
    const t = ((p.x - at.x) * b.vel.x + (p.z - at.z) * b.vel.z) / speed;
    if (t < 0 || t > 0.18) continue;
    if (Math.hypot(at.x + b.vel.x * t - p.x, at.z + b.vel.z * t - p.z) < b.radius + 0.65) return `bolt:${e}`;
  }
  return undefined;
}

/** Go around a colossal body when reaching a lamp or the Alert, rather than pushing into its capsule. */
export function aroundBoss(g: Game, boss: Entity, to: { x: number; z: number }): { x: number; z: number } {
  const c = g.ecs.c;
  const me = c.transform.get(g.player.id)!.pos;
  const at = c.transform.get(boss)!.pos;
  const radius = (c.body.get(boss)?.radius ?? 0) + 1.2;
  const dx = to.x - me.x, dz = to.z - me.z;
  const length = dx * dx + dz * dz;
  const t = length ? Math.max(0, Math.min(1, ((at.x - me.x) * dx + (at.z - me.z) * dz) / length)) : 0;
  if (distXZ(to, at) < radius || Math.hypot(me.x + dx * t - at.x, me.z + dz * t - at.z) >= radius) return to;
  const angle = Math.atan2(me.x - at.x, me.z - at.z);
  const choices = [-1, 1].map((sign) => ({ x: at.x + Math.sin(angle + sign * 0.7) * (radius + 1), z: at.z + Math.cos(angle + sign * 0.7) * (radius + 1) }));
  return choices.reduce((a, b) => distXZ(a, to) < distXZ(b, to) ? a : b);
}
