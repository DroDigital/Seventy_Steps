/** Check the Alert route in Cthulhu's actual streamed world arena, including its collision. */
import { describe, expect, it } from 'vitest';
import { emptyInput } from '../src/core/input';
import { JOURNEY_REFERENCE } from '../src/data/ngPlusTuning';
import { CTHULHU } from '../src/data/tuning';
import { parseCarry } from '../src/systems/cycles';
import { teleport } from '../src/systems/checkpoints';
import { fightAction } from '../src/systems/fightActions';
import { createWorldGame, stepGame } from '../src/systems/game';
import { worldLayout } from '../src/world/placements';
import { aroundBoss } from './botMechanics';
import { run } from './worldHelpers';

describe('later journeys in the actual world', () => {
  for (const cycle of [1, 3, 7]) {
    it(`lets the investigator walk to the Alert and finish Cthulhu on NG+${cycle}`, () => {
      const site = worldLayout().spawns.find((s) => s.id === 'boss:cthulhu')!;
      expect(site?.arena).toBeDefined();
      const carry = parseCarry({ cycle, levels: JOURNEY_REFERENCE, reagentMax: 10, reinforced: { cane: 5 } })!;
      const g = createWorldGame({ carry });
      const [dx, dz] = cycle === 1 ? [0, 30] : cycle === 3 ? [30, 0] : [0, -30];
      teleport(g, { x: site.at.x + dx, z: site.at.z + dz, yaw: Math.atan2(-dx, -dz) });
      run(g, 60); // stream the actual arena and its colliders
      const boss = g.overworld!.alive.get(site.id)!;
      expect(boss).toBeDefined();
      const fight = g.ecs.c.fight.get(boss)!;
      Object.assign(g.ecs.c.brain.get(boss)!, { state: 'engage', target: g.player.id, cooldown: 1e6, speed: 0 });
      g.ecs.c.actor.get(boss)!.move = null;
      stepGame(g, emptyInput());
      const h = g.ecs.c.health.get(boss)!;
      h.hp = h.max * 0.32; // isolate the final-phase route from combat difficulty
      stepGame(g, emptyInput());
      expect(fight.phase).toBe(fight.script.phases.length - 1);
      const ship = fight.props.find((e) => g.ecs.c.prop.get(e)?.kind === 'ship')!;
      expect(ship).toBeDefined();
      for (const id of g.ecs.c.minion.keys()) g.ecs.despawn(id);
      for (const id of g.ecs.c.brain.keys()) if (id !== boss) g.ecs.c.brain.delete(id);
      const me = g.ecs.c.health.get(g.player.id)!;
      me.immortal = true; // a geometry test: survival is measured separately
      let reached = false;
      for (let frame = 0; frame < 60 * 45; frame++) {
        const p = g.ecs.c.transform.get(g.player.id)!.pos;
        const target = g.ecs.c.transform.get(ship)!.pos;
        if (Math.hypot(target.x - p.x, target.z - p.z) <= CTHULHU.helm && fightAction(g)?.label === "take the Alert's helm") {
          reached = true;
          break;
        }
        const waypoint = aroundBoss(g, boss, target);
        g.camera.yaw = g.camera.prevYaw = Math.atan2(waypoint.x - p.x, waypoint.z - p.z);
        stepGame(g, { ...emptyInput(), moveY: 1 });
      }
      expect(reached, `NG+${cycle}: the Alert could not be reached through its real arena`).toBe(true);
      fightAction(g)!.run();
      run(g, 60 * 12);
      expect(h.hp).toBe(0);
    }, 45_000);
  }
});
