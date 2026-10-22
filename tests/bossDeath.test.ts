import { describe, expect, it } from 'vitest';
import { ENTITIES, variantOf, type Variant } from '../src/data/registry';
import { strike } from '../src/systems/combat';
import { createWorldGame } from '../src/systems/game';
import { applySave, snapshot } from '../src/systems/save';
import { worldLayout } from '../src/world/placements';
import { bossGame, calm, engage } from './bossHelpers';
import { steps } from './helpers';
import { creatureOf, deathblow, goTo, record, run } from './worldHelpers';

/** Azathoth's bar counts down a survival encounter; every other scripted boss can be slain by damage. */
const DAMAGE_BOSSES: [string, Variant | undefined][] = ENTITIES.flatMap((d) =>
  ([undefined, 'eldritch', 'boss'] as const)
    .filter((v) => d.id !== 'azathoth' && !!(v ? variantOf(d, v) : d)?.bossScript)
    .map((v) => [d.id, v] as [string, Variant | undefined]),
);

describe('bosses fall when their health is depleted', () => {
  it.each(DAMAGE_BOSSES)('%s %s dies in its final phase and releases its arena', (id, variant) => {
    const b = bossGame(id, variant);
    const { g, boss, fight } = b;
    engage(b);
    calm(b);
    const c = g.ecs.c;
    const h = c.health.get(boss)!;
    h.hp = 1;
    steps(g, 1);
    expect(fight.phase).toBe(fight.script.phases.length - 1);
    const deaths = record(g, 'Died');
    const echoes = g.player.echoes;
    expect(strike(g, g.player.id, boss, deathblow)).toBe('kill');
    expect(h.hp).toBe(0);
    expect(c.actor.get(boss)!.move).toBe('death');
    expect(fight.engaged).toBe(false);
    expect(fight.veiled).toBe(false);
    expect(fight.minions).toEqual([]);
    expect(fight.props).toEqual([]);
    expect(deaths.filter((d) => d.entity === boss)).toHaveLength(1);
    expect(g.player.echoes).toBeGreaterThan(echoes);
    if (id === 'dunwich_horror') expect(c.unseen.has(boss)).toBe(false);
    steps(g, 100);
    expect(c.dead.has(boss)).toBe(true);
    expect(deaths.filter((d) => d.entity === boss)).toHaveLength(1);
  });

  it.each(['dunwich_horror', 'cthulhu'])('%s stays slain after a weapon kill and saving', (id) => {
    const g = createWorldGame();
    const spawn = `boss:${id}`;
    const at = worldLayout().spawns.find((s) => s.id === spawn)!.at;
    goTo(g, at.x, at.z + 12);
    run(g, 2);
    const boss = creatureOf(g, spawn)!;
    expect(boss).toBeDefined();
    const h = g.ecs.c.health.get(boss)!;
    h.hp = 1;
    run(g, 1);
    const vanquished = record(g, 'Vanquished');
    expect(strike(g, g.player.id, boss, deathblow)).toBe('kill');
    expect(g.overworld!.slain.has(spawn)).toBe(true);
    expect(vanquished.filter((e) => e.entity === boss)).toHaveLength(1);
    const loaded = createWorldGame();
    applySave(loaded, snapshot(g));
    goTo(loaded, at.x, at.z + 12);
    run(loaded, 100);
    expect(loaded.overworld!.slain.has(spawn)).toBe(true);
    expect(creatureOf(loaded, spawn)).toBeUndefined();
  });
});
