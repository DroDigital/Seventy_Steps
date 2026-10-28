/** A bot that fights whatever stands in the arena (playtest round 24): it closes to the body's edge, strikes, dodges now and again, does what E offers in a boss fight, and cannot be killed. */

import type { Entity } from '../src/core/ecs';
import { createRng } from '../src/core/rng';
import { emptyInput, type Button } from '../src/core/input';
import { ARENA } from '../src/data/arena';
import { LEVELS, REINFORCE } from '../src/data/tuning';
import type { Variant } from '../src/data/registry';
import type { Game } from '../src/systems/components';
import { fightAction } from '../src/systems/fightActions';
import { callsForLaudanum } from '../src/ui/mindHud';
import { applyLevels } from '../src/systems/levels';
import { stepGame } from '../src/systems/game';
import { setLock } from '../src/systems/lockOn';
import { minionsOf } from '../src/systems/specials';
import { bossGame } from './bossHelpers';
import { blowIn } from './blowIn';
import { newLeaving, wayOut } from './cloudBot';

/** How the bot plays. Balance runs use the player's expected build; invariant audits default to legal maximum Might and reinforcement. */
export interface BotStyle {
  levels?: Partial<Record<'vigour' | 'endurance' | 'might', number>>; // Echoes spent on the curve (else capped Might alone)
  reinforced?: number; // levels of star-stones set into the sword-cane
  skill?: number; // 0..1: the share of telegraphed blows it rolls away from, as they are about to land (0: it only rolls now and again)
  floor?: boolean; // stops at the last health point as well as at death, for survival-timer balance runs
  smart?: boolean; // it keeps behind a monolith from a gaze that turns flesh to stone, cuts down the spawning roots before the horror, and a servant or a phantom at its elbow
  mind?: boolean; // it keeps its mind as a person is told to (the HUD's call, ui/mindHud.ts: Fractured, a dose left): it drinks Laudanum, which the bot never did, and so was left Unmoored by round 58's harder mind, taking more and striking less for the rest of a fight
  start?: number; // metres from the boss it begins (7)
  waive?: readonly ('petrify' | 'roots' | 'void')[]; // what it is let off, to measure the rest of a fight whose mechanic the bot plays badly: the gaze never takes hold; the roots are down at once; the void under the hidden platforms never opens (a person with insight keeps to them, round 60)
}

export interface BotFight {
  health: number; // the foe's maximum health after applying this run's player level
  frames: number; // how many it ran (fewer than asked when the foe fell)
  fell: boolean; // the foe fell within them
  dealt: number; // damage the bot did to the foe
  deaths: number; // times it died to what damage cannot be kept off by health (a gaze that turns flesh to stone)
  taken: number; // damage it took (it cannot be killed: the tally is what a person would have had to bear)
  nearest: number; // the least it stood from the edge of the foe's body (metres)
  bad: string[]; // what was left not a number or out of its range
}

/** The bot against `id` (in `variant`) for up to `frames` steps, in the arena. */
export function botFight(id: string, frames: number, variant?: Variant, style: BotStyle = {}): BotFight {
  const { g, boss } = bossGame(id, variant, style.start ?? 7);
  clearFor(g, boss);
  return driveBot(g, boss, frames, false, style);
}

/** A body wider than this is a colossus's (metres of radius). */
const WIDE = 3;

/**
 * A colossus fights in a clear ring (round 60): among the Phase 1 arena's free-standing pillars, low walls, Elder Sign
 * and training dummy a body this wide finds no place to stand, and was thrown metres to and fro between them every
 * step, shoving the bot off its flank (Cthulhu, Shub-Niggurath, Yog-Sothoth, Ghatanothoa, Father Dagon, Mother Hydra
 * and the Colossus). Its own arena in the world has nothing in its way (bossStand.test.ts); only the colonnade stays.
 */
export function clearFor(g: Game, boss: Entity): void {
  const c = g.ecs.c;
  if ((c.body.get(boss)?.radius ?? 0) <= WIDE) return;
  const inner = ARENA.colonnade.radius - 1;
  for (const k of g.world.colliders) if (k.kind !== 'cylinder' || Math.hypot(k.x, k.z) < inner) g.world.off.add(k);
  for (const [e, m] of [...c.model]) if (m === 'dummy') g.ecs.despawn(e);
}

const dist = (a: { x: number; z: number }, b: { x: number; z: number }): number => Math.hypot(a.x - b.x, a.z - b.z);

/** Where to stand out of a boss's sight: a little way behind the nearest standing stone, seen from the boss. */
function coverFrom(g: Game, boss: Entity, stones: Entity[], me: { x: number; z: number }): { x: number; z: number } | null {
  const at = g.ecs.c.transform.get(boss)?.pos;
  if (!at || !stones.length) return null;
  const behind = stones.map((s) => {
    const p = g.ecs.c.transform.get(s)!.pos;
    const d = dist(p, at) || 1;
    return { x: p.x + ((p.x - at.x) / d) * 1.6, z: p.z + ((p.z - at.z) / d) * 1.6 };
  });
  return behind.reduce((a, b) => (dist(a, me) <= dist(b, me) ? a : b));
}

/** The bot against `boss` in `g`, wherever it stands, for up to `frames` steps (or to its first landed blow, if `stopAtHit`). */
export function driveBot(g: Game, boss: Entity, frames: number, stopAtHit = false, style: BotStyle = {}): BotFight {
  const rng = createRng(77);
  const c = g.ecs.c;
  const me = c.health.get(g.player.id)!;
  Object.assign(g.player.levels, style.levels ?? { vigour: 0, endurance: 0, might: LEVELS.might.max });
  applyLevels(g); // refresh player resources and boss scaling together, including in invariant audits
  const health = c.health.get(boss)?.max ?? 0;
  g.player.reinforced[g.player.weapon] = style.reinforced ?? (style.levels ? 0 : REINFORCE.max);
  me.hp = me.max = 1e7;
  const brain = c.brain.get(boss);
  if (brain) Object.assign(brain, { state: 'engage', target: g.player.id, cooldown: 0 });
  const fight = c.fight.get(boss);
  if (fight && style.waive?.includes('void')) fight.script = { ...fight.script, phases: fight.script.phases.map((p) => ({ ...p, realityHooks: p.realityHooks?.filter((h) => h !== 'hidden_platforms') })) }; // this fight's own copy
  let [dealt, taken, deaths] = [0, 0, 0];
  let nearest = Infinity;
  g.events.on('Hit', (e) => {
    if (e.attacker === g.player.id && e.target === boss) dealt += e.damage;
    if (e.target === g.player.id) taken += e.damage;
  });
  g.events.on('Died', (e) => void (e.entity === g.player.id && deaths++));
  const rolled = new Set<string>(); // the blows it has already decided about
  let focus = boss; // what it strikes: the boss, or (smart) the spawning roots first
  let hiding = false;
  const propsOf = (kind: string): Entity[] => (c.fight.get(boss)?.props ?? []).filter((p) => c.prop.get(p)?.kind === kind && (kind !== 'root' || (c.health.get(p)?.hp ?? 0) > 0));
  let held = new Set<Button>();
  const banks = newLeaving(); // the poison it walks out of
  let dodgeIn = 60;
  let dodgeDirection = 0;
  let drank = -Infinity;
  const moves = c.actor.get(g.player.id)!.moves;
  const reserve = moves.roll?.stamina ?? 0;
  const strikeCost = (prefix: 'light' | 'heavy'): number => Math.max(0, ...Object.entries(moves).filter(([id]) => id.startsWith(prefix)).map(([, move]) => move.stamina ?? 0));
  const lightCost = strikeCost('light');
  const heavyCost = strikeCost('heavy');
  let frame = 0;
  for (; frame < frames; frame++) {
    const from = c.transform.get(g.player.id)!;
    const hp = c.health.get(boss);
    if (style.smart && c.transform.has(boss)) {
      const nearest = (list: Entity[]): Entity => list.reduce((a, b) => (dist(c.transform.get(a)!.pos, from.pos) <= dist(c.transform.get(b)!.pos, from.pos) ? a : b));
      const roots = propsOf('root');
      const inWay = [...minionsOf(g, boss), ...c.phantom.keys()].filter((m) => c.transform.has(m) && dist(c.transform.get(m)!.pos, from.pos) - (c.body.get(m)?.radius ?? 0.5) < 2); // a servant or a phantom at its elbow is struck down, as a person would (round 60: a star-spawn, then the Unmoored mind's phantoms, held it off Cthulhu for minutes)
      const next = roots.length ? nearest(roots) : inWay.length ? nearest(inWay) : boss;
      if (next !== focus || frame === 2) setLock(g, (focus = next));
      if (g.reality.petrify > 0.3) hiding = true;
      else if (g.reality.petrify < 0.02) hiding = false;
    }
    const at = c.transform.get(focus) ?? c.transform.get(boss);
    if (!at || c.dead.has(boss) || (stopAtHit && dealt > 0) || (style.floor && hp && hp.hp <= 1.01)) break;
    const reach = Math.hypot(at.pos.x - from.pos.x, at.pos.z - from.pos.z) - (c.body.get(focus)?.radius ?? 0.5) + 0.5; // to the edge of the body
    nearest = Math.min(nearest, reach);
    g.camera.yaw = g.camera.prevYaw = Math.atan2(at.pos.x - from.pos.x, at.pos.z - from.pos.z);
    if (style.waive?.includes('petrify')) g.reality.petrify = 0;
    if (style.waive?.includes('roots') && frame === 3) for (const r of propsOf('root')) c.health.get(r)!.hp = 0;
    if (frame === 2 && !style.smart) setLock(g, boss);
    const want = new Set<Button>();
    const f = emptyInput();
    f.moveY = reach > 2.1 ? 1 : reach < 1.2 ? -0.5 : 0;
    f.moveX = Math.sin(frame / 90) * 0.5;
    const shipPos = style.smart && !c.fight.get(boss)?.sig.sailing ? c.transform.get(propsOf('ship')[0] ?? -1)?.pos : undefined; // the Alert has come: to her helm
    const cover = hiding ? coverFrom(g, boss, propsOf('monolith'), from.pos) : shipPos ? { x: shipPos.x, z: shipPos.z } : null; // out of the gaze: behind the nearest stone
    if (cover) {
      const [dx, dz] = [cover.x - from.pos.x, cover.z - from.pos.z];
      const d = Math.hypot(dx, dz);
      const yaw = g.camera.yaw;
      [f.moveY, f.moveX] = d < 0.3 ? [0, 0] : [(dx * Math.sin(yaw) + dz * Math.cos(yaw)) / d, (dx * -Math.cos(yaw) + dz * Math.sin(yaw)) / d];
    }
    const out = style.skill !== undefined && !cover ? wayOut(g, banks, style.skill, rng) : undefined;
    if (out) { // a person walks out of a bank of poison, straight, and does not stop to strike
      const d = Math.hypot(out.x, out.z);
      const yaw = g.camera.yaw;
      [f.moveY, f.moveX] = [(out.x * Math.sin(yaw) + out.z * Math.cos(yaw)) / d, (out.x * -Math.cos(yaw) + out.z * Math.sin(yaw)) / d];
    }
    if (!cover && !out && reach < 2.6) {
      const stamina = c.stamina.get(g.player.id)?.value ?? Infinity;
      // A player who intends to dodge must leave a roll funded, even after a queued combo move.
      const canStrike = (cost: number): boolean => style.skill === undefined || stamina >= cost + reserve;
      if (frame % 22 === 0 && canStrike(lightCost)) want.add('light');
      else if (frame % 61 === 0 && canStrike(heavyCost)) want.add('heavy');
    }
    if (reach > 4 && frame % 90 === 45) want.add('shoot'); // and, from afar, the revolver
    if (fightAction(g)) want.add('interact'); // the helm, the powder, the incantation
    if (style.mind && callsForLaudanum(g) && frame - drank > 60) {
      want.add('item');
    }
    if (style.skill !== undefined) { // it reads the wind-ups of what is about to strike it, and rolls away from some
      const key = blowIn(g);
      if (key && !rolled.has(key)) {
        rolled.add(key);
        if (rng() < style.skill) {
          want.add('dodge');
          f.moveX = dodgeDirection = rng() < 0.5 ? -1 : 1;
        }
      }
    } else if (--dodgeIn <= 0) {
      want.add('dodge');
      f.moveX = dodgeDirection = rng() < 0.5 ? -1 : 1;
      dodgeIn = 70 + Math.floor(rng() * 60);
    }
    // A tap queues the dodge on release; another action must not overwrite it while it waits to start.
    if (held.has('dodge')) f.moveX = dodgeDirection;
    if (want.has('dodge') || held.has('dodge') || g.player.buffer.action === 'dodge') for (const b of ['light', 'heavy', 'shoot', 'item'] as const) want.delete(b);
    if (want.has('item') && !held.has('item')) drank = frame; // retry if the dodge prevented the press
    for (const b of ['light', 'heavy', 'dodge', 'shoot', 'interact', 'item'] as const) {
      f.held[b] = want.has(b);
      f.pressed[b] = want.has(b) && !held.has(b);
      f.released[b] = held.has(b) && !want.has(b);
    }
    held = want;
    stepGame(g, f);
    if (frame % 300 === 0) me.hp = me.max;
    if (frame % 600 === 0) g.player.rounds = 12;
  }
  const bad: string[] = [];
  for (const [e, t] of c.transform) if (![t.pos.x, t.pos.y, t.pos.z, t.yaw].every(Number.isFinite)) bad.push(`entity ${e} (${c.model.get(e) ?? '?'}) not a number: ${JSON.stringify(t.pos)}`);
  for (const [e, h] of c.health) if (!Number.isFinite(h.hp) || h.hp < 0 || h.hp > h.max + 1e-6) bad.push(`entity ${e} hp ${h.hp}/${h.max}`);
  return { health, frames: frame, fell: frame < frames, dealt, taken, deaths, nearest, bad };
}
