import { describe, expect, it } from 'vitest';
import { ENTITIES } from '../src/data/registry';
import { createDeveloperCommands } from '../src/systems/developerCommands';
import { createGame, createWorldGame } from '../src/systems/game';
import { morph, spawnCreature } from '../src/systems/creatures';
import { insightSystem } from '../src/systems/insight';
import { worldLayout } from '../src/world/placements';

const flight = () => {
  let enabled = false;
  return { setFlight: (on: boolean) => { enabled = on; }, flightEnabled: () => enabled };
};

describe('developer showcase commands', () => {
  it('lists every enemy and variant, validates input, and controls the camera', () => {
    const control = flight();
    const c = createDeveloperCommands(createGame(), control);
    for (const d of ENTITIES.filter((d) => d.tier !== 'ally')) {
      expect(c.commands.some((x) => x.command === `spawn ${d.id}`)).toBe(true);
      if (d.bossVariant) expect(c.commands.some((x) => x.command === `spawn ${d.id} boss`)).toBe(true);
      if (d.eldritchVariant) expect(c.commands.some((x) => x.command === `spawn ${d.id} eldritch`)).toBe(true);
    }
    expect(c.execute('spawn made_up')).toContain('Unknown');
    expect(c.execute('fly on')).toContain('enabled');
    expect(control.flightEnabled()).toBe(true);
    c.dispose();
    expect(control.flightEnabled()).toBe(false);
  });

  it('spawns real foes without rewards, first sight or pairing with real bosses', () => {
    const g = createWorldGame();
    const c = createDeveloperCommands(g, flight());
    const start = { ...g.ecs.c.transform.get(g.player.id)!.pos };
    const familiar = spawnCreature(g, 'brown_jenkin', { x: start.x + 10, z: start.z, yaw: 0 })!;
    expect(familiar).toBeDefined();
    expect(c.execute('spawn keziah_mason')).toContain('Spawned');
    const [fake] = [...g.ecs.c.combatant].filter(([, v]) => v.showcase).map(([e]) => e);
    expect(g.ecs.c.fight.has(fake)).toBe(true);
    expect(g.ecs.c.combatant.get(fake)!.bounty).toBe(0);
    morph(g, fake, 'keziah_mason', undefined);
    expect(g.ecs.c.combatant.get(fake)!.bounty).toBe(0);
    const insight = g.mind.insight;
    insightSystem(g);
    expect(g.mind.insight).toBe(insight);
    expect(g.mind.seen.has('keziah_mason')).toBe(false);
    const tally = g.overworld!.tally.kills;
    g.events.emit('Died', { entity: fake, killer: g.player.id, at: start });
    expect(g.player.echoes).toBe(0);
    expect(g.overworld!.slain.has('boss:keziah_mason')).toBe(false);
    expect(g.overworld!.tally.kills).toBe(tally);
    expect(g.ecs.c.health.get(familiar)!.hp).toBeGreaterThan(0);
    expect(c.execute('clear')).toContain('Removed 1');
    expect(g.ecs.c.transform.has(fake)).toBe(false);
  });

  it('teleports to named locations without healing, and respects the demo boundary', () => {
    const g = createWorldGame();
    const c = createDeveloperCommands(g, flight());
    for (const spawn of worldLayout().spawns.filter((s) => s.id.startsWith('boss:') && s.arena)) {
      expect(c.commands.some((x) => x.command === `teleport ${spawn.entity} entrance`)).toBe(true);
      expect(c.commands.some((x) => x.command === `teleport ${spawn.entity} room`)).toBe(true);
    }
    expect(c.execute('teleport great_ones room')).toContain('Teleported');
    const kadath = worldLayout().dungeons.flatMap((d) => d.layout.rooms).find((r) => r.def.boss?.includes('great_ones'))!;
    const inside = g.ecs.c.transform.get(g.player.id)!.pos;
    expect(inside.x).toBeGreaterThan(kadath.rect.x0);
    expect(inside.x).toBeLessThan(kadath.rect.x1);
    expect(inside.z).toBeGreaterThan(kadath.rect.z0);
    expect(inside.z).toBeLessThan(kadath.rect.z1);
    const health = g.ecs.c.health.get(g.player.id)!;
    health.hp = 25;
    expect(c.execute('teleport keziah_mason room')).toContain('Teleported');
    expect(health.hp).toBe(25);
    g.demo = true;
    expect(c.execute('teleport cthulhu entrance')).toContain('outside the demo');
  });
});
