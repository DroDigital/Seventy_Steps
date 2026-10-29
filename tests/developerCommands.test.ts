import { describe, expect, it } from 'vitest';
import { ENTITIES } from '../src/data/registry';
import { createDeveloperCommands } from '../src/systems/developerCommands';
import { createGame, createWorldGame } from '../src/systems/game';
import { morph, spawnCreature } from '../src/systems/creatures';
import { insightSystem } from '../src/systems/insight';
import { worldLayout } from '../src/world/placements';
import { run } from './worldHelpers';

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

  describe('joining bosses keep to their own kind (a showcase Brown Jenkin is joined to Keziah Mason, but not to a real one)', () => {
    /** A world game with the investigator unhurtable (a fight about them is no part of what is looked at), and what the showcase and real Keziahs and Jenkins are. */
    const stage = () => {
      const g = createWorldGame();
      g.ecs.c.health.get(g.player.id)!.immortal = true;
      const c = createDeveloperCommands(g, flight());
      const at = { ...g.ecs.c.transform.get(g.player.id)!.pos };
      const showcase = (): number[] => [...g.ecs.c.combatant].filter(([, v]) => v.showcase).map(([e]) => e);
      const far = (id: string, dx: number): number => spawnCreature(g, id, { x: at.x + dx, z: at.z + 40, yaw: 0 })!; // a real one, well away (it is alive and in the world, and takes no part in what is looked at)
      const hurt = (e: number, share: number): void => void (g.ecs.c.health.get(e)!.hp = g.ecs.c.health.get(e)!.max * share);
      const state = (e: number) => g.ecs.c.brain.get(e)!.state;
      return { g, c, showcase, far, hurt, state };
    };

    it('lets a showcase Brown Jenkin out at once beside a living, healthy real Keziah Mason, as the console promises', () => {
      const { g, c, showcase, far, state } = stage();
      const keziah = far('keziah_mason', 0);
      expect(g.ecs.c.health.get(keziah)!.hp).toBe(g.ecs.c.health.get(keziah)!.max); // above half, and waiting on nothing
      expect(c.execute('spawn brown_jenkin')).toContain('Spawned');
      const [jenkin] = showcase();
      run(g, 3);
      expect(state(jenkin!), 'out of the walls, and hunting').toBe('engage');
      expect(g.ecs.c.health.get(keziah)!.hp, 'and the real encounter untouched').toBe(g.ecs.c.health.get(keziah)!.max);
    });

    it('does not let a real Brown Jenkin out for a showcase Keziah Mason wounded for the look of it', () => {
      const { g, c, showcase, far, hurt, state } = stage();
      expect(c.execute('spawn keziah_mason')).toContain('Spawned'); // the first of the two Keziahs the world holds: the one a search for her would meet first
      const [fake] = showcase();
      hurt(fake!, 0.3);
      far('keziah_mason', 4);
      const jenkin = far('brown_jenkin', 8); // the real one: in the walls until the real Keziah is half spent
      run(g, 3);
      expect(state(jenkin), 'still waiting on the real Keziah').toBe('hidden');
    });

    it('lets a showcase pair keep the terms of a real one: Jenkin waits for Keziah to be half spent, and goes with her', () => {
      const { g, c, showcase, far, hurt, state } = stage();
      const realJenkin = far('brown_jenkin', 0);
      expect(c.execute('spawn keziah_mason')).toContain('Spawned');
      expect(c.execute('spawn brown_jenkin')).toContain('Spawned');
      const [keziah, jenkin] = showcase() as [number, number];
      run(g, 3);
      expect(state(jenkin), 'in the walls while she is whole').toBe('hidden');
      hurt(keziah, 0.4);
      run(g, 3);
      expect(state(jenkin), 'out once she is below half').toBe('engage');
      g.events.emit('Died', { entity: keziah, killer: g.player.id, at: { ...g.ecs.c.transform.get(keziah)!.pos } });
      expect(g.ecs.c.health.get(jenkin)!.hp, 'and gone with her').toBe(0);
      expect(g.ecs.c.health.get(realJenkin)!.hp, 'a real one is not taken with a showcase Keziah').toBeGreaterThan(0);
    });

    it('does not take a showcase Brown Jenkin with a real Keziah Mason who falls', () => {
      const { g, c, showcase, far } = stage();
      const keziah = far('keziah_mason', 0);
      expect(c.execute('spawn brown_jenkin')).toContain('Spawned');
      const [jenkin] = showcase();
      g.events.emit('Died', { entity: keziah, killer: g.player.id, at: { ...g.ecs.c.transform.get(keziah)!.pos } });
      expect(g.ecs.c.health.get(jenkin!)!.hp).toBeGreaterThan(0);
    });
  });
});
