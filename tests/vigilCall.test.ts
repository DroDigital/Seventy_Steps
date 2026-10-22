/**
 * The place answers the one who keeps its vigil (round 65; systems/vigilCall.ts): every vigil of every discovery is kept by standing at
 * its mark, whatever the hour, the sky and the mind were when one came; nothing is waited on but the vigil's own seconds and the place's
 * answer. The night only runs forward, a vigil whose hour it already is does not hurry it, and the mind is drawn to the state asked.
 */
import { describe, expect, it } from 'vitest';
import { stepKey, type Step } from '../src/data/discoveries';
import { DISCOVERIES } from '../src/data/discoveriesAll';
import { SIM } from '../src/data/tuning';
import { HOUR_FROM, hourOf, NIGHT, phaseOf, type Hour } from '../src/systems/clock';
import type { Game } from '../src/systems/components';
import { discoverySystem, holds } from '../src/systems/discovery';
import { createWorldGame } from '../src/systems/game';
import { bandOf, setSanity } from '../src/systems/sanity';
import { CALL, mindTarget } from '../src/systems/vigilCall';
import { weatherSystem } from '../src/systems/weather';
import { stepPlace } from '../src/world/discoveryPlan';
import { worldLayout } from '../src/world/placements';
import { goTo } from './worldHelpers';

type Vigil = Extract<Step, { kind: 'vigil' }>;
const arenas = worldLayout().arenas.filter((a) => a.house);
const vigils = Object.entries(DISCOVERIES).flatMap(([boss, d]) => d.steps.flatMap((s, i) => (s.kind === 'vigil' ? [{ boss, i, s }] : [])));
const NEXT: Readonly<Record<Hour, Hour>> = { gloaming: 'deep', deep: 'waning', waning: 'gloaming' };

/** A frame just past the start of `hour`, as the clock stands now. */
function frameIn(g: Game, hour: Hour): number {
  for (let f = g.frame; f < g.frame + 1080 * SIM.hz; f += 60) if (hourOf(phaseOf(f / SIM.hz)) === hour && phaseOf(f / SIM.hz) > HOUR_FROM[hour] + 0.03) return f;
  throw new Error(hour);
}

/** A game at the vigil's turn, everything it asks as far from so as it can be: the hour after its own, a calm that will not break, the other end of the mind. */
function against(boss: string, i: number, s: Vigil): Game {
  const g = createWorldGame();
  const a = arenas.find((x) => x.bosses[0] === boss)!;
  const ow = g.overworld!;
  ow.region = a.region;
  for (let k = 0; k < i; k++) ow.told.add(stepKey(boss, k));
  if (s.when.hour) g.frame = frameIn(g, NEXT[s.when.hour[0]!]);
  ow.weather = { kind: 'clear', want: 'clear', amount: 0, until: Infinity };
  if (s.when.mind) setSanity(g, s.when.mind.from === 'lucid' ? 5 : 100);
  const at = stepPlace(a, s)!;
  goTo(g, at.x, at.z);
  return g;
}

/** Steps what the vigil reads for up to `seconds`; the seconds it took, or Infinity. */
function keep(g: Game, boss: string, i: number, seconds: number): number {
  for (let f = 0; f < seconds * SIM.hz; f++) {
    g.frame++;
    weatherSystem(g, 1 / SIM.hz);
    discoverySystem(g);
    if (g.overworld!.told.has(stepKey(boss, i))) return f / SIM.hz;
  }
  return Infinity;
}

describe('the place answers a vigil', () => {
  it('there are vigils of every kind to answer', () => {
    expect(vigils.some((v) => v.s.when.hour)).toBe(true);
    expect(vigils.some((v) => v.s.when.sky)).toBe(true);
    expect(vigils.some((v) => v.s.when.mind)).toBe(true);
  });

  it.each(vigils.map((v) => [`${v.boss} ${v.i}`, v] as const))('%s is kept from the worst of hours, skies and minds, by standing at its mark', (_, { boss, i, s }) => {
    const g = against(boss, i, s);
    const longest = CALL.after + 1080 / CALL.speed + 2 * 12 + s.seconds + 6; // the call, the night's run, a sky eased out and in, the vigil itself
    const took = keep(g, boss, i, longest);
    expect(took, `${boss}: vigil ${i} kept`).toBeLessThan(longest);
    expect(took, `${boss}: not before its own seconds`).toBeGreaterThanOrEqual(s.seconds - 0.1);
  });

  it('runs the night forward only, and not at all when the hour is already the one asked', () => {
    const v = vigils.find((x) => x.s.when.hour && !x.s.when.sky && !x.s.when.mind)!;
    const g = against(v.boss, v.i, v.s);
    g.frame = frameIn(g, v.s.when.hour![0]!);
    keep(g, v.boss, v.i, v.s.seconds + 2);
    expect(g.overworld!.hurried ?? 0).toBe(0);
    const h = against(v.boss, v.i, v.s);
    let last = 0;
    for (let f = 0; f < 15 * SIM.hz; f++) {
      keep(h, v.boss, v.i, 1 / SIM.hz);
      expect(h.overworld!.hurried ?? 0).toBeGreaterThanOrEqual(last);
      last = h.overworld!.hurried ?? 0;
    }
    expect(last, 'it ran on').toBeGreaterThan(0);
    expect(NIGHT.hurried).toBe(last);
    expect(holds(h, { hour: v.s.when.hour }), 'and reached the hour').toBe(true);
  });

  it('draws the mind to the middle of the state asked', () => {
    expect(bandOf(mindTarget({ from: 'lucid', to: 'lucid' }))).toBe('lucid');
    expect(bandOf(mindTarget({ from: 'fractured', to: 'unmoored' }))).toBe('fractured');
    expect(['lucid', 'uneasy']).toContain(bandOf(mindTarget({ from: 'lucid', to: 'uneasy' })));
  });

  it('a new game\'s night is its own again', () => {
    const v = vigils.find((x) => x.s.when.hour)!;
    const g = against(v.boss, v.i, v.s);
    keep(g, v.boss, v.i, CALL.after + 2);
    expect(NIGHT.hurried).toBeGreaterThan(0);
    createWorldGame();
    expect(NIGHT.hurried).toBe(0);
  });
});
