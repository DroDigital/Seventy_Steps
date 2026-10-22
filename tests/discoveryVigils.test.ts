/** Every discovery vigil with real movement, sanity recovery, weather and nearby rendered lamps. */
import { expect, it } from 'vitest';
import { emptyInput } from '../src/core/input';
import { DISCOVERIES } from '../src/data/discoveriesAll';
import { stepKey } from '../src/data/discoveries';
import { REGIONS } from '../src/data/regions';
import { SIM } from '../src/data/tuning';
import { propJob } from '../src/render/propMeshes';
import { createWorldLights } from '../src/render/worldLights';
import { createWorldGame, stepGame } from '../src/systems/game';
import { setSanity } from '../src/systems/sanity';
import { stepPlace } from '../src/world/discoveryPlan';
import { worldLayout } from '../src/world/placements';
import { regionPlan } from '../src/world/regionPlan';
import { goTo } from './worldHelpers';

for (const [boss, d] of Object.entries(DISCOVERIES)) for (const [i, s] of d.steps.entries()) {
  if (s.kind !== 'vigil') continue;
  it(`${boss} vigil in the full simulation and rendered lamps`, () => {
    const a = worldLayout().arenas.find((x) => x.bosses[0] === boss)!;
    const g = createWorldGame();
    const at = stepPlace(a, s)!;
    const region = REGIONS.find((r) => r.id === a.region)!;
    const props = [...regionPlan(region).props.values()].flat().filter((p) => Math.hypot(p.x - at.x, p.z - at.z) < 30);
    const lights = createWorldLights();
    const job = propJob([...props, ...a.decor.filter((p) => Math.hypot(p.x - at.x, p.z - at.z) < 30)], region, (meshes, spots) => {
      lights.add(1, spots);
      for (const m of meshes) m.geometry.dispose();
    });
    while (!job.next().done);
    goTo(g, at.x + 1.6, at.z);
    g.lit = (p) => lights.lightAt(p.x, p.y, p.z, g.frame / SIM.hz);
    stepGame(g, emptyInput());
    // Isolate the puzzle: creatures can otherwise kill the stationary investigator during the vigil.
    for (const [spawn, id] of g.overworld!.alive) {
      g.overworld!.killed.add(spawn);
      g.ecs.despawn(id);
    }
    for (let k = 0; k < i; k++) g.overworld!.told.add(stepKey(boss, k));
    setSanity(g, s.when.mind?.from === 'lucid' ? 5 : 100);
    g.overworld!.weather = { kind: 'clear', want: 'clear', amount: 0, until: Infinity };
    for (let f = 0; f < (s.seconds + 60) * SIM.hz && !g.overworld!.told.has(stepKey(boss, i)); f++) stepGame(g, emptyInput());
    expect(g.overworld!.told.has(stepKey(boss, i)), `${boss}: completes with ambient lamps and natural sanity recovery`).toBe(true);
  });
}
