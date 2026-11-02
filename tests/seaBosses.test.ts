import { describe, expect, it } from 'vitest';
import { ATTACKS } from '../src/data/attacks';
import { getEntity } from '../src/data/registry';
import type { AttackId } from '../src/data/schema';
import { REAGENT, SEA_BOSSES } from '../src/data/tuning';
import { startMove } from '../src/systems/actions';
import { setArena } from '../src/systems/bossFight';
import { teleport } from '../src/systems/checkpoints';
import { spawnCreature } from '../src/systems/creatures';
import { seaPartnerBusy } from '../src/systems/seaBosses';
import { fight } from '../src/systems/tactics';
import { createGame, createWorldGame } from '../src/systems/game';
import { worldLayout } from '../src/world/placements';
import { clearFor, driveBot } from './botHelpers';
import { dosesAt, standings } from './balanceModel';
import { place, steps } from './helpers';

const SEA = ['father_dagon', 'mother_hydra'] as const;

function pair(start = 10) {
  const g = createGame({ creature: SEA[0] });
  const dagon = [...g.ecs.c.fight.keys()][0];
  place(g, dagon, -4, 0, 0);
  const hydra = spawnCreature(g, SEA[1], { x: 4, z: 0, yaw: 0 })!;
  setArena(g, hydra, { ...g.ecs.c.fight.get(dagon)!.arena });
  place(g, g.player.id, 0, start, Math.PI);
  clearFor(g, dagon);
  const bosses = [dagon, hydra];
  for (const id of bosses) {
    Object.assign(g.ecs.c.brain.get(id)!, { state: 'engage', target: g.player.id, cooldown: 0 });
    g.ecs.c.fight.get(id)!.engaged = true;
  }
  return { g, bosses };
}

/** Meet the pair together in their authored temple, including its real collision and flood. */
function temple() {
  const g = createWorldGame();
  const spawn = worldLayout().spawns.find(s => s.entity === SEA[0])!;
  teleport(g, { x: spawn.arena!.x, z: spawn.arena!.z + 12, yaw: Math.PI });
  steps(g, 1);
  const bosses = SEA.map(id => g.overworld!.alive.get(`boss:${id}`)!);
  expect(bosses.every(id => id !== undefined)).toBe(true);
  for (const id of bosses) {
    Object.assign(g.ecs.c.brain.get(id)!, { state: 'engage', target: g.player.id, cooldown: 0 });
    g.ecs.c.fight.get(id)!.engaged = true;
  }
  return { g, bosses };
}

describe('Dagon and Hydra share a readable fight', () => {
  it('holds the partner through the full attack and recovery, then leaves a short rest for the counterattack', () => {
    const { g, bosses: [dagon, hydra] } = pair();
    const actor = g.ecs.c.actor.get(dagon)!;
    startMove(actor, 'slam');
    const end = ATTACKS.slam.windup + ATTACKS.slam.active;
    for (const frame of [0, end - 1, end, end + 23]) {
      actor.frame = frame;
      expect(seaPartnerBusy(g, hydra, g.player.id), `frame ${frame}`).toBe(true);
    }
    actor.frame = actor.moves.slam.frames - 1;
    expect(seaPartnerBusy(g, hydra, g.player.id)).toBe(true);
    Object.assign(actor, { move: null, last: 'slam', idle: 23 });
    expect(seaPartnerBusy(g, hydra, g.player.id)).toBe(true);
    actor.idle = 24;
    expect(seaPartnerBusy(g, hydra, g.player.id)).toBe(false);
    // Even the rest and shortest next wind-up hold a late roll (34 frames) plus light hit (9).
    const blows = SEA.flatMap(id => getEntity(id)!.behavior.attacks).map(id => ATTACKS[id]);
    expect(24 + Math.min(...blows.filter(a => a.kind === 'melee').map(a => a.windup))).toBeGreaterThanOrEqual(43);
  });

  it('keeps a vortex and its burst together and leaves stagger and parry punishable', () => {
    const { g, bosses: [dagon, hydra] } = pair();
    const actor = g.ecs.c.actor.get(dagon)!;
    startMove(actor, 'vortex');
    actor.frame = actor.moves.vortex.frames - 1;
    expect(seaPartnerBusy(g, hydra, g.player.id)).toBe(true);
    startMove(actor, 'vortex_burst');
    expect(seaPartnerBusy(g, hydra, g.player.id)).toBe(true);
    for (const move of ['stagger', 'parried']) {
      startMove(actor, move);
      expect(seaPartnerBusy(g, hydra, g.player.id), move).toBe(false);
    }
  });

  it('returns to solo pacing if the partner dies, disengages, targets someone else or leaves the arena', () => {
    for (const leave of ['dead', 'disengaged', 'other target', 'out of range', 'different arena'] as const) {
      const { g, bosses: [dagon, hydra] } = pair();
      startMove(g.ecs.c.actor.get(dagon)!, 'slam');
      expect(seaPartnerBusy(g, hydra, g.player.id)).toBe(true);
      if (leave === 'dead') g.ecs.c.health.get(dagon)!.hp = 0;
      if (leave === 'disengaged') g.ecs.c.fight.get(dagon)!.engaged = false;
      if (leave === 'other target') g.ecs.c.brain.get(dagon)!.target = hydra;
      if (leave === 'out of range') place(g, dagon, 100, 100, 0);
      if (leave === 'different arena') g.ecs.c.fight.get(dagon)!.arena.x += 100;
      expect(seaPartnerBusy(g, hydra, g.player.id), leave).toBe(false);
    }
  });

  it('the waiting partner yields space without retreating beyond the blade', () => {
    const { g, bosses: [dagon, hydra] } = pair();
    const c = g.ecs.c;
    place(g, g.player.id, 0, 0, Math.PI);
    place(g, hydra, 0, 3.8, Math.PI);
    startMove(c.actor.get(dagon)!, 'slam');
    const m = c.mover.get(hydra)!, br = c.brain.get(hydra)!;
    fight(g, hydra, br, m, g.player.id, c.fight.get(hydra)!.arena);
    expect(m.vz).toBeGreaterThan(0); // opens space instead of pushing toward the investigator
    const blade = c.actor.get(g.player.id)!.moves.light1.hit!;
    expect(SEA_BOSSES.clearance).toBeLessThan(blade.reach + blade.radius);
    place(g, hydra, 0, 5, Math.PI);
    m.vx = m.vz = 0;
    fight(g, hydra, br, m, g.player.id, c.fight.get(hydra)!.arena);
    expect(m.vz).toBe(0); // once clear, it circles; it does not keep backing away
  });

  it('both attack and leave openings over both phases in the real temple, without stacking wind-ups or spawning four servants', () => {
    const { g, bosses } = temple();
    const c = g.ecs.c;
    const me = c.health.get(g.player.id)!;
    me.hp = me.max = 1e7;
    g.player.steady = 1e7;
    const starts = [[0, 0], [0, 0]], recovery = [0, 0];
    const hits = new Set<number>();
    g.events.on('Hit', e => { if (e.target === g.player.id && bosses.includes(e.attacker)) hits.add(e.attacker); });
    for (let frame = 0; frame < 1800; frame++) {
      if (frame === 900) for (const id of bosses) c.health.get(id)!.hp = c.health.get(id)!.max * 0.49;
      steps(g, 1);
      bosses.forEach((id, index) => {
        const a = c.actor.get(id)!;
        const attack = a.move && ATTACKS[a.move as AttackId];
        if (attack && a.frame === 0) {
          starts[frame < 900 ? 0 : 1][index]++;
          expect(seaPartnerBusy(g, id, g.player.id), `${SEA[index]} begins ${a.move} at ${frame}`).toBe(false);
        }
        if (attack && !attack.follow && a.frame >= attack.windup + attack.active) recovery[index]++;
      });
      expect(g.reality.darkness).toBe(0);
    }
    expect(starts.every(phase => phase.every(n => n >= 3)), `attack starts per phase: ${starts}`).toBe(true);
    expect(recovery.every(n => n >= 200), `recovery frames: ${recovery}`).toBe(true);
    expect(hits.size).toBeGreaterThan(0);
    expect(bosses.map(id => c.fight.get(id)!.phase)).toEqual([1, 1]);
    expect(c.minion.size).toBe(0);
    expect(g.reality.flood).toBe(1);
  });

  it.each([8, 10, 12])('the combat bot from %im can defeat both together at their expected standing within a bounded healing budget', start => {
    const { g, bosses } = pair(start);
    const list = standings(), standing = list.find(s => s.id === SEA[0])!;
    const style = { levels: standing.levels, reinforced: standing.reinforced, skill: 0.55, smart: true, mind: true };
    const dealt = new Map<number, number>();
    g.events.on('Hit', e => {
      if (e.attacker === g.player.id && bosses.includes(e.target)) dealt.set(e.target, (dealt.get(e.target) ?? 0) + e.damage);
    });
    let taken = 0, frames = 0;
    for (const id of bosses) {
      if (g.ecs.c.health.get(id)!.hp <= 0) continue; // a swing at one may also catch its partner
      const result = driveBot(g, id, 60 * 300, false, style);
      expect(result.bad).toEqual([]);
      expect(result.fell, cName(g, id)).toBe(true);
      taken += result.taken;
      frames += result.frames;
    }
    for (const id of bosses) {
      expect(dealt.get(id) ?? 0, cName(g, id)).toBeGreaterThan(0);
      expect(g.ecs.c.health.get(id)!.hp, cName(g, id)).toBe(0);
    }
    const budget = standing.hp * (1 + REAGENT.heal * dosesAt(standing.rank, list.length));
    const lives = taken / budget;
    expect(frames / 60).toBeGreaterThan(45);
    expect(frames / 60).toBeLessThan(240);
    expect(lives).toBeGreaterThan(0.4);
    expect(lives).toBeLessThan(2.5);
  });
});

function cName(g: ReturnType<typeof createGame>, id: number): string {
  return g.ecs.c.combatant.get(id)!.name;
}
