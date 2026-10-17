import { describe, expect, it } from 'vitest';
import { WEATHER } from '../src/data/tuning';
import { createWorldGame } from '../src/systems/game';
import { kindsOf, quietOf, weatherSystem, type WeatherKind } from '../src/systems/weather';

interface Sky {
  share: (k: WeatherKind) => number;
  /** Thunderstorms and wet spells (rain or storm) that begin, an hour. */
  stormsAnHour: number;
  wetAnHour: number;
  /** Minutes before the first rain or storm, and the longest run without either. */
  first: number;
  longest: number;
}

/** `hours` of weather over `region`, from `seed`, as a share of the time each kind is blowing (over a third of its strength) and how often a spell comes. */
function skies(region: string, seed: number, hours: number): Sky {
  const g = createWorldGame({ seed });
  g.overworld!.region = region;
  const time: Partial<Record<WeatherKind, number>> = {};
  let [storms, wet, last, since, longest, first] = [0, 0, 'clear' as WeatherKind, 0, 0, Infinity];
  for (let f = 0; f < hours * 3600 * 60; f++) {
    g.frame++;
    weatherSystem(g, 1 / 60);
    const w = g.overworld!.weather;
    const kind: WeatherKind = w.amount > 0.3 ? w.kind : 'clear';
    time[kind] = (time[kind] ?? 0) + 1 / 60;
    const raining = kind === 'rain' || kind === 'storm';
    if (kind === 'storm' && last !== 'storm') storms++;
    if (raining && last !== 'rain' && last !== 'storm') wet++;
    if (raining && first === Infinity) first = f / 3600;
    since = raining ? 0 : since + 1 / 60;
    longest = Math.max(longest, since / 60);
    last = kind;
  }
  return { share: (k) => (time[k] ?? 0) / (hours * 3600), stormsAnHour: storms / hours, wetAnHour: wet / hours, first, longest };
}

const SEEDS = [1926, 7, 99];
const mean = (xs: number[]): number => xs.reduce((a, b) => a + b, 0) / xs.length;

describe('how often it rains (round 52: none in two hours; round 53: it rained 45% of the time, which is too much)', () => {
  it('the start region has weather, and every region with weather has rain or a storm or a gale in it', () => {
    expect(kindsOf('hub').length).toBeGreaterThan(0);
    for (const region of Object.keys(WEATHER.regions)) expect(kindsOf(region).length, region).toBeGreaterThan(0);
    expect(kindsOf('hub').map(([k]) => k)).toEqual(expect.arrayContaining(['rain', 'storm']));
    for (const region of ['arkham', 'providence', 'vermont', 'dunwich', 'innsmouth', 'rlyeh']) expect(kindsOf(region).map(([k]) => k), region).toContain('storm');
  });

  it.each(['hub', 'arkham', 'providence', 'vermont', 'dunwich', 'innsmouth', 'rlyeh'])('%s: wet about a fifth of the time, a spell every quarter hour or so, a thunderstorm now and then, and clear skies between', (region) => {
    const runs = SEEDS.map((s) => skies(region, s, 4));
    const wet = mean(runs.map((r) => r.share('rain') + r.share('storm')));
    expect(wet, 'wet share').toBeGreaterThan(0.1); // it does rain
    expect(wet, 'wet share').toBeLessThan(0.28); // and not for half the day
    expect(mean(runs.map((r) => r.share('storm'))), 'storm share').toBeLessThan(0.16);
    expect(mean(runs.map((r) => r.share('clear'))), 'clear share').toBeGreaterThan(0.65);
    expect(mean(runs.map((r) => r.wetAnHour)), 'wet spells an hour').toBeGreaterThan(2);
    expect(mean(runs.map((r) => r.wetAnHour)), 'wet spells an hour').toBeLessThan(5); // never one every ten minutes
    expect(mean(runs.map((r) => r.stormsAnHour)), 'storms an hour').toBeGreaterThan(0.7); // one in the first hour and a half, as a rule
    expect(mean(runs.map((r) => r.stormsAnHour)), 'storms an hour').toBeLessThan(3);
    for (const r of runs) expect(r.longest, 'longest dry spell, minutes').toBeLessThan(75); // a test of an hour or two will see rain
  });

  it('a game, or a load, opens on clear skies and the first spell is not before the first few minutes', () => {
    for (const seed of SEEDS) {
      const r = skies('hub', seed, 2);
      expect(r.first, `seed ${seed}`).toBeGreaterThan(4); // minutes
      expect(r.first, `seed ${seed}`).toBeLessThan(60);
    }
  });

  it('the mountains are a place of wind, with a storm a rare thing there', () => {
    const runs = SEEDS.map((s) => skies('mountains', s, 4));
    expect(mean(runs.map((r) => r.share('gale')))).toBeGreaterThan(0.1);
    expect(mean(runs.map((r) => r.share('rain')))).toBe(0);
    expect(mean(runs.map((r) => r.stormsAnHour))).toBeLessThan(1.2);
  });

  it('a thunderstorm hushes footsteps more than rain does, and a gale hushes them too', () => {
    const g = createWorldGame();
    const w = g.overworld!.weather;
    Object.assign(w, { kind: 'rain', want: 'rain', amount: 1 });
    const rain = quietOf(g);
    Object.assign(w, { kind: 'storm', want: 'storm', amount: 1 });
    const storm = quietOf(g);
    expect(storm).toBeLessThan(rain);
    expect(rain).toBeLessThan(1);
    Object.assign(w, { kind: 'clear', want: 'clear', amount: 0 });
    expect(quietOf(g)).toBe(1);
  });
});
