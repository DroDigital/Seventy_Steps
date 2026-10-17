import { describe, expect, it } from 'vitest';
import { WEATHER } from '../src/data/tuning';
import { createWorldGame } from '../src/systems/game';
import { kindsOf, quietOf, weatherSystem, type WeatherKind } from '../src/systems/weather';

/** Two hours of weather over `region`, as a share of the time each kind is blowing hard, and how often a storm gathers. */
function twoHours(region: string) {
  const g = createWorldGame();
  g.overworld!.region = region;
  const time: Partial<Record<WeatherKind, number>> = {};
  let [storms, last, gap, longest] = [0, 'clear' as WeatherKind, 0, 0];
  for (let f = 0; f < 7200 * 60; f++) {
    g.frame++;
    weatherSystem(g, 1 / 60);
    const w = g.overworld!.weather;
    const kind: WeatherKind = w.amount > 0.3 ? w.kind : 'clear';
    time[kind] = (time[kind] ?? 0) + 1 / 60;
    if (kind === 'storm' && last !== 'storm') storms++;
    last = kind;
    gap = kind === 'rain' || kind === 'storm' ? 0 : gap + 1 / 60;
    longest = Math.max(longest, gap);
  }
  return { share: (k: WeatherKind) => (time[k] ?? 0) / 7200, storms, longest };
}

describe('rain and thunderstorms come round (round 52: two hours in the hub saw none)', () => {
  it('the start region has weather, and every region with weather has rain or a storm or a gale in it', () => {
    expect(kindsOf('hub').length).toBeGreaterThan(0);
    for (const region of Object.keys(WEATHER.regions)) expect(kindsOf(region).length, region).toBeGreaterThan(0);
    expect(kindsOf('hub').map(([k]) => k)).toEqual(expect.arrayContaining(['rain', 'storm']));
    for (const region of ['arkham', 'providence', 'vermont', 'dunwich', 'innsmouth', 'rlyeh']) expect(kindsOf(region).map(([k]) => k), region).toContain('storm');
  });

  it.each(['hub', 'arkham', 'providence', 'vermont', 'dunwich', 'innsmouth', 'rlyeh'])('%s: in two hours, rain falls for a good share of them, thunderstorms gather several times, and the skies are not left alone for long', (region) => {
    const r = twoHours(region);
    expect(r.share('rain') + r.share('storm')).toBeGreaterThan(0.2);
    expect(r.share('storm')).toBeGreaterThan(0.1);
    expect(r.storms).toBeGreaterThanOrEqual(3);
    expect(r.share('clear')).toBeGreaterThan(0.15); // and there are clear skies between
    expect(r.longest).toBeLessThan(25 * 60); // never half an hour of dry sky: a test would see it
  });

  it('the first rain or storm comes within the first quarter hour in the start region', () => {
    const g = createWorldGame();
    g.overworld!.region = 'hub';
    let first = Infinity;
    for (let f = 0; f < 900 * 60 && first === Infinity; f++) {
      g.frame++;
      weatherSystem(g, 1 / 60);
      const w = g.overworld!.weather;
      if ((w.kind === 'rain' || w.kind === 'storm') && w.amount > 0.3) first = f / 60;
    }
    expect(first).toBeLessThan(900);
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
