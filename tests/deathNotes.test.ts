import { describe, expect, it } from 'vitest';
import { EDGES, FRAGMENTS, GENERIC, SEAS, TIPS } from '../src/data/deathLines';
import { REGIONS } from '../src/data/regions';
import { ATTACK_IDS } from '../src/data/schema';
import { deathLine } from '../src/systems/deathNotes';
import { createWorldGame } from '../src/systems/game';
import { spawnCreature } from '../src/systems/creatures';

describe('what the last blow teaches (round 26)', () => {
  it('has a line for every blow, short, and a fragment for every realm', () => {
    for (const id of ATTACK_IDS) expect(TIPS[id], id).toBeTruthy();
    for (const t of Object.values(TIPS)) expect(t.length).toBeLessThan(120);
    for (const r of Object.keys(FRAGMENTS)) expect(REGIONS.some((x) => x.id === r), r).toBe(true);
    for (const r of REGIONS) expect(FRAGMENTS[r.id]?.length ?? 0, r.id).toBeGreaterThan(0);
  });

  it('reads how the blow that took them is met, else a fragment of the place, never the same twice running', () => {
    const g = createWorldGame();
    const foe = spawnCreature(g, 'deep_one', { x: 0, z: 0, yaw: 0 })!;
    g.ecs.c.actor.get(foe)!.move = 'slam';
    g.events.emit('Hit', { attacker: foe, target: g.player.id, outcome: 'kill', damage: 40 });
    expect(deathLine(g)).toBe(TIPS.slam);
    g.events.emit('Respawned', { entity: g.player.id });
    g.overworld!.region = 'innsmouth';
    const a = deathLine(g);
    const b = deathLine(g);
    expect([...FRAGMENTS.innsmouth, ...GENERIC]).toContain(a);
    expect(b).not.toBe(a);
  });

  it('a gaze that turned them to stone says how it is broken', () => {
    const g = createWorldGame();
    g.events.emit('Petrified', { by: 1 });
    expect(deathLine(g).toLowerCase()).toContain('monolith');
  });

  it('a fall over an edge reads one of its own lines, not the blow taken long before it (round 54)', () => {
    const g = createWorldGame();
    const foe = spawnCreature(g, 'deep_one', { x: 0, z: 0, yaw: 0 })!;
    g.ecs.c.actor.get(foe)!.move = 'slam';
    g.events.emit('Hit', { attacker: foe, target: g.player.id, outcome: 'hit', damage: 10 });
    g.events.emit('Fell', { entity: g.player.id, at: { x: 0, y: 0, z: 0 }, frames: 66 });
    expect(EDGES).toContain(deathLine(g));
    g.events.emit('Respawned', { entity: g.player.id });
    expect(EDGES).not.toContain(deathLine(g));
  });

  it('a fall into the sea reads one of the sea\'s lines, and not an edge\'s (round 55)', () => {
    const g = createWorldGame();
    g.events.emit('Fell', { entity: g.player.id, at: { x: 0, y: -2, z: 0 }, frames: 66, sea: true });
    expect(SEAS).toContain(deathLine(g));
    expect(EDGES).not.toContain(deathLine(g));
  });
});
