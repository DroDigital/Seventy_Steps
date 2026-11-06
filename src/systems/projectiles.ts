/**
 * Bolts (spec §3E): on its launch frame a volley looses its bolts at the attacker's target, fanned
 * across its spread, flying straight or (lobbed) arcing to land where the target stood. Walls and
 * the ground stop them; the first hostile body one touches takes the blow, which a guard can block
 * and no parry turns; a roll's i-frames let it fly on through. Spit spreads its pool where it
 * lands. Pure: no Three.js.
 */

import type { Entity } from '../core/ecs';
import type { V3 } from '../core/geom';
import type { VolleyDef } from '../data/moves';
import { BOSS, SIM } from '../data/tuning';
import { raycast } from '../world/colliders';
import { moveDef } from './actions';
import { capsuleGap2, hostiles, strike } from './combat';
import { live } from './targets';
import { isAbsent, type Bolt, type Game } from './components';
import { spawnPool } from './hazards';
import { foeDamage } from './cycles';
import { targetOf } from './specials';

const DEG = Math.PI / 180;

/** Where a volley is aimed: the target's chest (the investigator's is the foe locked on), or straight ahead. */
function aimAt(g: Game, id: Entity): V3 | null {
  const t = id === g.player.id ? (g.lock.target ?? id) : targetOf(g, id);
  if (t === id) return null;
  const p = g.ecs.c.transform.get(t)?.pos;
  return p ? { x: p.x, y: p.y + (g.ecs.c.body.get(t)?.aimHeight ?? 1.2), z: p.z } : null;
}

export function launch(g: Game, id: Entity, v: VolleyDef): void {
  const c = g.ecs.c;
  const tr = c.transform.get(id)!;
  const body = c.body.get(id);
  const out = (body?.radius ?? 0.5) + 0.3;
  const from = { x: tr.pos.x + Math.sin(tr.yaw) * out, y: tr.pos.y + Math.min(body?.aimHeight ?? 1.2, 4), z: tr.pos.z + Math.cos(tr.yaw) * out };
  const aim = aimAt(g, id) ?? { x: from.x + Math.sin(tr.yaw) * 10, y: from.y, z: from.z + Math.cos(tr.yaw) * 10 };
  const [dx, dy, dz] = [aim.x - from.x, aim.y - from.y, aim.z - from.z];
  const flat = Math.max(0.5, Math.hypot(dx, dz));
  const yaw0 = Math.atan2(dx, dz);
  for (let i = 0; i < v.count; i++) {
    const yaw = yaw0 + (v.count > 1 ? (i / (v.count - 1) - 0.5) * v.spread * DEG : 0);
    let vel: V3;
    if (v.lob) {
      const reach = Math.min(flat, v.range); // arcs to come down where the target stands, or at the end of its throw: aimed at one that has jumped far away (a travel mid-wind-up) the arc would climb into the clouds (round 34)
      const t = reach / v.speed;
      vel = { x: Math.sin(yaw) * v.speed, y: (dy * (reach / flat) - 1 + 0.5 * BOSS.gravity * t * t) / t, z: Math.cos(yaw) * v.speed };
    } else {
      const len = Math.hypot(flat, dy);
      vel = { x: Math.sin(yaw) * v.speed * (flat / len), y: v.speed * (dy / len), z: Math.cos(yaw) * v.speed * (flat / len) };
    }
    loose(g, id, from, vel, v);
  }
}

/** One bolt from `owner`, leaving `from` at `vel`. */
export function loose(g: Game, owner: Entity, from: V3, vel: V3, v: Pick<VolleyDef, 'speed' | 'radius' | 'range' | 'damage' | 'poise' | 'lob' | 'pool' | 'bounces'>): void {
  const c = g.ecs.c;
  const conjured = c.phantom.has(owner);
  const yaw = Math.atan2(vel.x, vel.z);
  const e = g.ecs.spawn();
  c.transform.set(e, { pos: { ...from }, prev: { ...from }, yaw, prevYaw: yaw });
  const life = Math.min(BOSS.boltLife, Math.ceil((v.range / v.speed) * SIM.hz) + (v.lob ? 60 : 0));
  const faction = c.combatant.get(owner)?.faction ?? 'enemy';
  c.bolt.set(e, { owner, faction, enemyScale: faction === 'enemy' ? foeDamage(g, owner) : undefined, vel, radius: v.radius, damage: conjured ? 0 : v.damage, poise: conjured ? 0 : v.poise, life, lob: v.lob, conjured, passed: [], pool: v.pool, ...(v.bounces && { bounces: v.bounces }) });
  c.model.set(e, 'fx:bolt');
  g.events.emit('BoltLoosed', { owner, at: { ...from }, vel: { ...vel }, fire: !!v.pool?.fire, conjured });
}

function land(g: Game, e: Entity, at: V3, on: 'body' | 'ground' | 'wall' | 'spent'): void {
  const b = g.ecs.c.bolt.get(e)!;
  if (b.pool && !b.conjured) spawnPool(g, b.owner, b.faction, at, b.pool, b.enemyScale);
  g.events.emit('BoltLanded', { owner: b.owner, faction: b.faction, at: { ...at }, vel: { ...b.vel }, on, radius: b.radius, lob: b.lob, fire: !!b.pool?.fire, conjured: b.conjured });
  g.ecs.despawn(e);
}

/**
 * A bolt that may glance (round 105, the rebound) comes off what it struck: of its course turned back across x, across z or across both, the first
 * that leaves the wall clear. A box's face turns it truly; a pillar's round side near enough. The spark and the knock are a landing's, the bolt flies on.
 */
function glance(g: Game, e: Entity, b: Bolt, from: V3, to: V3, hit: number): boolean {
  const k = Math.max(0, hit - 0.05);
  const at = { x: from.x + (to.x - from.x) * k, y: from.y + (to.y - from.y) * k, z: from.z + (to.z - from.z) * k };
  for (const [sx, sz] of FLIPS) {
    const vel = { x: b.vel.x * sx, y: b.vel.y, z: b.vel.z * sz };
    if (raycast(g.world, at, { x: at.x + vel.x * 0.1, y: at.y + vel.y * 0.1, z: at.z + vel.z * 0.1 }) < 1) continue;
    bounce(g, e, b, at, vel);
    return true;
  }
  return false;
}

/** A bolt that may glance comes back off the rim of its caster's court too, where no wall is built (round 105). */
function rim(g: Game, e: Entity, b: Bolt, to: V3): boolean {
  const court = g.ecs.c.fight.get(b.owner)?.arena;
  if (!court) return false;
  const [dx, dz] = [to.x - court.x, to.z - court.z];
  const d = Math.hypot(dx, dz);
  if (d < court.radius - b.radius || d < 1e-6) return false;
  const [nx, nz] = [dx / d, dz / d];
  const along = b.vel.x * nx + b.vel.z * nz;
  if (along <= 0) return false;
  const inside = (court.radius - b.radius - 0.05) / d;
  bounce(g, e, b, { x: court.x + dx * inside, y: to.y, z: court.z + dz * inside }, { x: b.vel.x - 2 * along * nx, y: b.vel.y, z: b.vel.z - 2 * along * nz });
  return true;
}

function bounce(g: Game, e: Entity, b: Bolt, at: V3, vel: V3): void {
  const tr = g.ecs.c.transform.get(e)!;
  g.events.emit('BoltLanded', { owner: b.owner, faction: b.faction, at: { ...at }, vel: { ...b.vel }, on: 'wall', radius: b.radius, lob: b.lob, fire: false, conjured: b.conjured });
  b.vel = vel;
  b.bounces = (b.bounces ?? 1) - 1;
  b.passed = []; // what it flew past before may meet it on the way back
  tr.prev = { ...tr.pos };
  tr.pos = at;
}

const FLIPS = [[-1, 1], [1, -1], [-1, -1]] as const;

/** When each caster's bolt last landed on the investigator, per game (round 17). */
const landedAt = new WeakMap<Game, Map<Entity, number>>();

export function boltSystem(g: Game): void {
  const c = g.ecs.c;
  let landed = landedAt.get(g);
  if (!landed) landedAt.set(g, (landed = new Map()));
  const dt = 1 / SIM.hz;
  for (const [id, a] of c.actor) {
    const v = moveDef(a)?.volley;
    if (v && !a.frozen && a.frame === v.frame && !isAbsent(g, id)) launch(g, id, v);
  }
  for (const [e, b] of c.bolt) {
    const tr = c.transform.get(e)!;
    const from = tr.pos;
    const to = { x: from.x + b.vel.x * dt, y: from.y + b.vel.y * dt, z: from.z + b.vel.z * dt };
    if (b.lob) b.vel.y -= BOSS.gravity * dt;
    tr.prev = { ...from };
    let struck = false;
    for (const t of live(g, hostiles(g, b.faction, b.conjured, false))) {
      const { gap2, radius } = capsuleGap2(g, t, from, to);
      if (b.passed.includes(t) || gap2 > (radius + b.radius) ** 2) continue;
      if (t === g.player.id && g.frame - (landed.get(b.owner) ?? -Infinity) < BOSS.boltGrace) {
        b.passed.push(t); // hard on the last from the same hand: it passes by
        continue;
      }
      const outcome = strike(g, b.owner, t, { damage: b.damage, enemyScale: b.enemyScale, poise: b.poise, guard: b.damage, hitstop: 2, parryable: false, interrupts: false }, from);
      if (outcome === 'dodged') {
        b.passed.push(t); // it flies on through the roll
        continue;
      }
      if (t === g.player.id) landed.set(b.owner, g.frame);
      const p = c.transform.get(t)!.pos;
      land(g, e, { x: p.x, y: p.y + (c.body.get(t)?.aimHeight ?? 1) * 0.7, z: p.z }, 'body');
      struck = true;
      break;
    }
    if (struck) continue;
    const wall = raycast(g.world, from, to);
    const ground = g.world.ground(to.x, to.z);
    if (b.bounces && wall < 1 && glance(g, e, b, from, to, wall)) continue;
    if (b.bounces && wall >= 1 && to.y > ground && rim(g, e, b, to)) continue;
    if (wall < 1) land(g, e, { x: from.x + (to.x - from.x) * wall, y: from.y + (to.y - from.y) * wall, z: from.z + (to.z - from.z) * wall }, 'wall');
    else if (to.y <= ground) land(g, e, { x: to.x, y: ground, z: to.z }, 'ground');
    else if (--b.life <= 0) land(g, e, { ...from }, 'spent');
    else tr.pos = to;
  }
}
