/**
 * 2026-11-27, two screenshots of Benefit Street: "there are 2 streetlights right next to each other which makes no logical sense, fix that
 * and also find other logic errors". The trader's lamp was raised 1.8 m from a town's (and 4.7 m from one in Innsmouth); a scan of every realm
 * also found a house's wing through its neighbour in Arkham, trunks through trunks, headstones, crosses, fences and the courts' hedges, and a
 * wayside lamp's post up out of the rock at its foot. In every realm: no two street lamps within LAMP_APART, no house in another, no trunk
 * through anything solid, and no lamp, cross or obelisk in a rock.
 */
import { describe, expect, it } from 'vitest';
import { REGIONS } from '../src/data/regions';
import { propsMeet } from '../src/world/footprints';
import { LAMP_APART, type Prop } from '../src/world/props';
import { regionPlan } from '../src/world/regionPlan';
import { traderSpot } from '../src/world/traderAt';
import { TRADER_SITES } from '../src/data/npcs';

const realms = REGIONS.map((r) => ({ id: r.id, props: [...regionPlan(r).props.values()].flat() }));
const at = (p: Prop): string => `${p.kind} at ${p.x.toFixed(0)}, ${p.z.toFixed(0)}`;
const pairs = (props: readonly Prop[], meet: (a: Prop, b: Prop) => boolean, within = 40): string[] => {
  const out: string[] = [];
  for (let i = 0; i < props.length; i++) {
    for (let j = i + 1; j < props.length; j++) if (Math.hypot(props[i]!.x - props[j]!.x, props[i]!.z - props[j]!.z) < within && meet(props[i]!, props[j]!)) out.push(`${at(props[i]!)} / ${at(props[j]!)}`);
  }
  return out;
};
const TRUNKS = new Set(['tree', 'pine', 'stump', 'log']);

describe('what the planners lay apart, apart (2026-11-27)', () => {
  it('stands no two street lamps within LAMP_APART metres', () => {
    for (const r of realms) expect(pairs(r.props.filter((p) => p.kind === 'lamp'), () => true, LAMP_APART), r.id).toEqual([]);
  });

  it("raises the trader's own lamp at Benefit Street with none other near it", () => {
    const spot = traderSpot(TRADER_SITES.find((t) => t.sign === 'prov_benefit')!.id)!;
    const lamps = realms.find((r) => r.id === 'providence')!.props.filter((p) => p.kind === 'lamp' && Math.hypot(p.x - spot.lamp.x, p.z - spot.lamp.z) < LAMP_APART);
    expect(lamps.map((p) => [p.x, p.z])).toEqual([[spot.lamp.x, spot.lamp.z]]);
  });

  it('stands no house in another', () => {
    for (const r of realms) expect(pairs(r.props.filter((p) => p.kind === 'house'), (a, b) => propsMeet(a, b, -0.05)), r.id).toEqual([]);
  });

  it('stands no trunk through a trunk or anything solid, and no lamp, cross or obelisk in a rock', () => {
    const wrong = (a: Prop, b: Prop): boolean => {
      const marks = new Set(['lamp', 'cross', 'obelisk']);
      const trunk = TRUNKS.has(a.kind) || TRUNKS.has(b.kind);
      const inRock = (a.kind === 'rock' && marks.has(b.kind)) || (b.kind === 'rock' && marks.has(a.kind));
      return (trunk || inRock) && propsMeet(a, b, -0.05);
    };
    for (const r of realms) expect(pairs(r.props, wrong, 20), r.id).toEqual([]);
  });
});
