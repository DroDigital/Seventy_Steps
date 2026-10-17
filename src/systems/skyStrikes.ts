/**
 * Bolts that fall on the ground (round 52). In a thunderstorm that has gathered, now and then a spot near the investigator (a third of the time,
 * one near a foe) is marked by a ring of crackling light; a moment later (`SKY_STRIKE.warn`, a second and a half) a bolt falls on it
 * and hurts whoever stands in the ring, the investigator and the foes alike: strong, and staggering. The ring is the warning, and
 * enough of one: a walk takes a body clear, a roll through the last of it does as well (i-frames), and none is struck under a roof,
 * or on a dungeon floor. From the game's own random stream, so a replay sees the same sky. Pure: no Three.js.
 */

import type { Entity } from '../core/ecs';
import type { V3 } from '../core/geom';
import { SIM, SKY_STRIKE } from '../data/tuning';
import { roofedAt, inDungeon } from '../world/terrain';
import { strike } from './combat';
import { isAbsent, type Game } from './components';

interface Pending {
  at: V3;
  left: number; // frames until it falls
}

interface State {
  pending: Pending[];
  next: number; // the frame the next is chosen
  gathered: boolean; // a storm has gathered
}

const states = new WeakMap<Game, State>();
const state = (g: Game): State => {
  let s = states.get(g);
  if (!s) states.set(g, (s = { pending: [], next: Infinity, gathered: false }));
  return s;
};

const between = (g: Game, [lo, hi]: readonly [number, number]): number => Math.round((lo + (hi - lo) * g.rng()) * SIM.hz);

/** The bolts marked and not yet fallen (for the picture and the tests). */
export const pendingStrikes = (g: Game): readonly Pending[] => state(g).pending;

/** Where, if anywhere, the next bolt falls: near the investigator, or near a foe in reach of them; never under a roof, in a dungeon or on the sea. */
function aim(g: Game): V3 | null {
  const c = g.ecs.c;
  const me = c.transform.get(g.player.id)?.pos;
  if (!me || !g.overworld || inDungeon(me.x, me.z) || roofedAt(me.x, me.z)) return null;
  let centre: V3 = me;
  let reach: readonly [number, number] = SKY_STRIKE.near;
  if (g.rng() < SKY_STRIKE.hunt) {
    const foes: V3[] = [];
    for (const [id, cb] of c.combatant) {
      const p = c.transform.get(id)?.pos;
      if (cb.faction !== 'enemy' || !p || c.dead.has(id) || isAbsent(g, id) || Math.hypot(p.x - me.x, p.z - me.z) > SKY_STRIKE.scan) continue;
      foes.push(p);
    }
    if (foes.length) {
      centre = foes[Math.floor(g.rng() * foes.length)]!;
      reach = [0, 5];
    }
  }
  for (let tries = 0; tries < 6; tries++) { // a spot on land the world can hold a bolt on
    const a = g.rng() * Math.PI * 2;
    const d = reach[0] + (reach[1] - reach[0]) * Math.sqrt(g.rng());
    const x = centre.x + Math.sin(a) * d;
    const z = centre.z + Math.cos(a) * d;
    if (inDungeon(x, z) || roofedAt(x, z)) continue;
    const y = g.world.ground(x, z);
    return { x, y, z };
  }
  return null;
}

/** The bolt falls: everything with a body in the ring is struck. */
function land(g: Game, p: Pending): void {
  const c = g.ecs.c;
  const sky = g.ecs.spawn(); // a body of no kind that the blow comes from: it is gone with the blow
  c.transform.set(sky, { pos: { ...p.at }, prev: { ...p.at }, yaw: 0, prevYaw: 0 });
  g.events.emit('StrikeLanded', { at: { ...p.at }, radius: SKY_STRIKE.radius });
  const victims: Entity[] = [];
  for (const [id] of c.combatant) {
    const pos = c.transform.get(id)?.pos;
    const body = c.body.get(id);
    if (!pos || !c.health.has(id) || !c.actor.has(id) || c.dead.has(id) || isAbsent(g, id)) continue;
    if (Math.hypot(pos.x - p.at.x, pos.z - p.at.z) > SKY_STRIKE.radius + (body?.radius ?? 0.4) * 0.5 || Math.abs(pos.y - p.at.y) > 4) continue;
    victims.push(id);
  }
  for (const id of victims) {
    const [base, share, cap] = SKY_STRIKE.foe;
    const damage = id === g.player.id ? SKY_STRIKE.player : Math.min(cap, base + share * (c.health.get(id)?.max ?? 0));
    strike(g, sky, id, { damage, poise: SKY_STRIKE.poise, guard: 0, hitstop: 6, parryable: false, interrupts: false, unblockable: true }, p.at);
  }
  g.ecs.despawn(sky);
}

export function skyStrikeSystem(g: Game): void {
  const s = state(g);
  for (let i = s.pending.length - 1; i >= 0; i--) {
    const p = s.pending[i]!;
    if (--p.left > 0) continue;
    s.pending.splice(i, 1);
    land(g, p);
  }
  const w = g.overworld?.weather;
  const storm = !!w && w.kind === 'storm' && w.want === 'storm' && w.amount >= SKY_STRIKE.gather && !g.cutscene;
  if (!storm) {
    s.gathered = false;
    s.next = Infinity;
    return;
  }
  if (!s.gathered) {
    s.gathered = true;
    s.next = g.frame + between(g, SKY_STRIKE.first);
  }
  if (g.frame < s.next) return;
  s.next = g.frame + between(g, SKY_STRIKE.every);
  const at = aim(g);
  if (!at) return;
  s.pending.push({ at, left: SKY_STRIKE.warn });
  g.events.emit('StrikeWarned', { at: { ...at }, radius: SKY_STRIKE.radius, frames: SKY_STRIKE.warn });
}
