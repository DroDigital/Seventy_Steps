/**
 * Where the trader at the lamps stands, and the street lamp he leans on (2026-11-06; data/traders.ts lists the places he may stand): the first
 * of them with no road under him or his lamp, no house or model in the way and no foe's post within three metres, the ground about him cleared of
 * whatever the plan had put there, and the lamp raised as a prop like the towns' own (so it lights, casts, collides and is heard like theirs).
 * Planned last, with a stream of its own: nothing earlier moves. Pure: no Three.js.
 */

import { createRng } from '../core/rng';
import { TRADER_SITES } from '../data/npcs';
import type { RegionDef } from '../data/regions';
import type { TraderSpot } from '../data/traders';
import { WORLD } from '../data/tuning';
import { reach } from './arenaDecor';
import type { SpawnPoint } from './placements';
import { makeProp, type Prop } from './props';

const SEED = 0x7a1d;
const KEEP = 1.1; // metres kept clear about the lamp and about the man (his own body and his turn)
const HARD: ReadonlySet<Prop['kind']> = new Set(['house', 'set']); // what is not taken down for him: a house, a model of an arena's dressing
const LAMPLESS: ReadonlySet<string> = new Set(['kn_yan']); // under the earth there are no street lamps (landmarks.test.ts, round 12): he stands there with none, the Elder Sign's glow his light

/** The region's traders' places, with their lamps raised into `props` and what stood in their way taken out of it. */
export function planTraderLamps(
  region: RegionDef,
  props: Prop[],
  roadClear: (x: number, z: number, m: number) => boolean,
  offSites: (x: number, z: number, m: number) => boolean,
  spawns: readonly SpawnPoint[],
): TraderSpot[] {
  const spots: TraderSpot[] = [];
  for (const site of TRADER_SITES) {
    if (site.region !== region.id || !site.tries.length) continue;
    const clear = (t: TraderSpot): boolean =>
      [t, t.lamp].every((p) => roadClear(p.x, p.z, 0.9) && offSites(p.x, p.z, 0.3) && !props.some((q) => HARD.has(q.kind) && Math.hypot(q.x - p.x, q.z - p.z) < reach(q) + KEEP)) &&
      spawns.every((s) => Math.hypot(s.at.x - t.x, s.at.z - t.z) > 3);
    const spot = site.tries.find(clear) ?? site.tries[0]!; // (tests/traders.test.ts holds every one to a clear place)
    for (let i = props.length - 1; i >= 0; i--) {
      const p = props[i]!;
      if (!HARD.has(p.kind) && [spot, spot.lamp].some((q) => Math.hypot(p.x - q.x, p.z - q.z) < reach(p) + KEEP)) props.splice(i, 1);
    }
    const rng = createRng([...site.id].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261) ^ SEED ^ WORLD.seed);
    if (!LAMPLESS.has(region.id)) props.push(makeProp('lamp', spot.lamp.x, spot.lamp.z, rng, 0));
    spots.push(spot);
  }
  return spots;
}
