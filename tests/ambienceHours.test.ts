import { describe, expect, it } from 'vitest';
import { FAR, FAR_MIX, held, type FarId } from '../src/data/ambienceSounds';
import { SPOT_HOURS, STILL, STILL_DEPTH, hourBed, spotHour, stillLeft, stillOf } from '../src/data/ambienceHours';
import { AMBIENCE, DUNGEON_AMBIENCE, SAMPLE_SETS } from '../src/data/samples';
import { STINGERS, type Sound } from '../src/data/sounds';
import { CLOCK } from '../src/data/tuning';
import { HOUR_FROM, dawnOf, hourOf } from '../src/systems/clock';
import { nextSpot, nextSpotAt } from '../src/render/audio/ambience';
import { render } from './soundRender';

const beds = [...new Set([...Object.values(AMBIENCE), ...Object.values(DUNGEON_AMBIENCE)].flatMap((a) => a.beds.map(([f]) => f)))];
const audible = (hz: number | undefined): boolean => hz === undefined || (hz >= 20 && hz <= 20000);

/** Problems with a recipe, as tests/audio.test.ts finds them: every layer playable and bounded. */
function problems(sound: Sound): string[] {
  const out: string[] = [];
  if (sound.length === 0) out.push('no layers');
  sound.forEach((l, i) => {
    const bad = (why: string): number => out.push(`layer ${i}: ${why}`);
    if (l.src !== 'noise' && !audible(l.hz)) bad(`pitch ${l.hz}`);
    if (l.src !== 'noise' && l.hz === undefined) bad('an oscillator needs a pitch');
    if (l.src === 'noise' && !l.filter) bad('noise needs a filter');
    if (!audible(l.to)) bad(`glide to ${l.to}`);
    if (!(l.dur > 0 && l.dur <= 10)) bad(`duration ${l.dur}`);
    if (!((l.at ?? 0) >= 0 && (l.at ?? 0) < 5)) bad(`start ${l.at}`);
    if (!(l.gain > 0 && l.gain <= 1)) bad(`gain ${l.gain}`);
    if ((l.attack ?? 0) < 0 || (l.attack ?? 0) > l.dur) bad(`attack ${l.attack}`);
    if (l.filter && (!audible(l.filter.hz) || !audible(l.filter.to) || (l.filter.q ?? 1) <= 0)) bad('filter out of range');
    if (l.vibrato && !(l.vibrato[0] > 0 && l.vibrato[0] < 50 && l.vibrato[1] >= 0 && l.vibrato[1] <= 200)) bad('vibrato out of range');
  });
  return out;
}

describe('the night, heard by its hours (round 78)', () => {
  it('a bed never steps: no more than 0.05 between a thousandth of the night and the next, and it turns without a jump at the end', () => {
    for (const file of beds) {
      let worst = 0;
      for (let k = 0; k < 1000; k++) worst = Math.max(worst, Math.abs(hourBed(file, (k + 1) / 1000) - hourBed(file, k / 1000)));
      expect(worst, file).toBeLessThan(0.05);
      expect(Math.abs(hourBed(file, 0.99999) - hourBed(file, 0)), `${file} at the turn`).toBeLessThan(0.01);
      for (let k = 0; k <= 200; k++) {
        const v = hourBed(file, k / 200);
        expect(v, file).toBeGreaterThan(0);
        expect(v, file).toBeLessThanOrEqual(1.3); // (the wind lifts a quarter more at the last grey, no more)
      }
    }
  });

  it('the Still is about a minute and a half at the moon\'s height, and nothing before or after', () => {
    expect(stillOf(0.5)).toBe(1);
    expect(stillOf(0.3)).toBe(0);
    expect(stillOf(0.7)).toBe(0);
    expect(stillOf(0.1)).toBe(0);
    expect(stillOf(STILL.from)).toBe(1);
    expect(stillOf(STILL.to)).toBe(1);
    expect(stillOf(STILL.from - STILL.ease / 2)).toBeGreaterThan(0);
    expect(stillOf(STILL.from - STILL.ease / 2)).toBeLessThan(1);
    expect((STILL.to - STILL.from) * CLOCK.night).toBeGreaterThan(80);
    expect((STILL.to - STILL.from) * CLOCK.night).toBeLessThan(95);
    expect(STILL.from).toBeGreaterThan(HOUR_FROM.deep); // inside the deep of the night
    expect(STILL.to).toBeLessThan(HOUR_FROM.waning);
    expect(stillLeft(0.5)).toBeGreaterThan(40);
    expect(stillLeft(0.3)).toBe(0);
  });

  it('the insects are full at the gloaming, thin through the deep, sink in the Still and come back with the lamps; the wind lifts toward the last grey; the sea and the cave keep still', () => {
    for (const f of ['crickets', 'frogs']) {
      expect(hourBed(f, 0.05), f).toBeGreaterThan(0.95);
      expect(hourBed(f, 0.3), f).toBeLessThan(0.7);
      expect(hourBed(f, 0.5), f).toBeLessThan(0.15);
      expect(hourBed(f, 0.58), f).toBeGreaterThan(hourBed(f, 0.5) * 2); // it begins again
      expect(hourBed(f, 0.85), f).toBeLessThan(hourBed(f, 0.3));
      expect(hourBed(f, 0.99), f).toBeGreaterThan(0.6); // the lamps lit anew
    }
    expect(hourBed('wind', 0.9)).toBeGreaterThan(hourBed('wind', 0.3) * 1.15);
    expect(hourBed('wind', 0.9)).toBeLessThanOrEqual(1.26);
    expect(hourBed('wind', 0.9) / hourBed('wind', 0.3)).toBeCloseTo(1 + 0.25 * dawnOf(0.9), 5);
    expect(hourBed('wind', 0.5)).toBeLessThan(hourBed('wind', 0.3) * 0.7);
    for (const f of ['surf', 'waves', 'cave', 'drips', 'murmur']) for (const p of [0.05, 0.3, 0.5, 0.9]) expect(hourBed(f, p), `${f} ${p}`).toBe(1);
    expect(hourBed('leaves', 0.5)).toBeLessThan(0.6);
    for (const f of Object.keys(STILL_DEPTH)) expect(STILL_DEPTH[f] > 0 && STILL_DEPTH[f] < 1, f).toBe(true);
  });

  it('the hours say which spots come oftener, and only for sets that exist; spots keep their intervals', () => {
    for (const [set, w] of Object.entries(SPOT_HOURS)) {
      expect(SAMPLE_SETS[set as keyof typeof SAMPLE_SETS], set).toBeDefined();
      for (const v of Object.values(w!)) expect(v > 0.3 && v < 2.5).toBe(true);
    }
    expect(spotHour('owl', hourOf(0.3))).toBeGreaterThan(spotHour('owl', hourOf(0.05)));
    expect(spotHour('whippoorwill', hourOf(0.85))).toBeLessThan(1);
    expect(spotHour('creak', 'deep')).toBe(1);
    const s = { set: 'owl' as const, every: [10, 20] as const };
    for (const r of [0, 0.5, 1]) {
      expect(nextSpotAt(s, 100, () => r, 1)).toBe(nextSpot(s, 100, () => r));
      expect(nextSpotAt(s, 100, () => r, 2)).toBe(100 + (10 + 10 * r) / 2);
    }
    expect(nextSpotAt(s, 0, () => 0, 0)).toBe(100); // a weight of nothing waits at most ten times as long
  });
});

describe('the far voices as recipes (data/ambienceSounds.ts)', () => {
  const ids = Object.keys(FAR) as FarId[];

  it('every one is a playable recipe, finite, soft, long and low; none is a cue the game already answers events with', () => {
    expect(Object.keys(FAR_MIX).sort()).toEqual([...ids].sort());
    for (const id of ids) {
      expect(problems(FAR[id]), id).toEqual([]);
      expect(id in STINGERS, id).toBe(false);
      const r = render(FAR[id]);
      expect(r.samples.every(Number.isFinite), id).toBe(true);
      expect(r.peak, id).toBeLessThan(-3);
      expect(r.peak, id).toBeGreaterThan(-16);
      expect(r.rms, id).toBeGreaterThan(-28);
      expect(r.rms, id).toBeLessThan(-17);
      expect(r.sec, id).toBeGreaterThan(1.5);
      expect(r.sec, id).toBeLessThan(8);
    }
  });

  it('a held note holds: the horn is as loud at the end of its second second as at the first, and then lets go', () => {
    const r = render(FAR.foghorn);
    const at = (t: number): number => {
      const [a, b] = [Math.round(t * 22050), Math.round((t + 0.25) * 22050)];
      let e = 0;
      for (let i = a; i < b; i++) e += r.samples[i] ** 2;
      return 10 * Math.log10(e / (b - a));
    };
    expect(Math.abs(at(1.5) - at(0.75))).toBeLessThan(5);
    expect(at(1.5) - at(3.4)).toBeGreaterThan(15); // let go
    expect(held('sine', 100, 2, 0.1).length).toBe(4);
    expect(held('sine', 100, 0.1, 0.1).length).toBe(1);
  });

  it('the foghorn is low and the dry chime high, the toll is cracked (two near pitches) and the buoy strikes uneven', () => {
    const hz = (id: FarId): number[] => FAR[id].filter((l) => l.src !== 'noise').map((l) => l.hz!);
    expect(Math.max(...hz('foghorn'))).toBeLessThan(200);
    expect(Math.min(...hz('dryChime'))).toBeGreaterThan(1000);
    const t = hz('toll').sort((a, b) => a - b);
    expect(t.some((f, i) => i > 0 && f / t[i - 1] > 1.005 && f / t[i - 1] < 1.04)).toBe(true);
    const strokes = [...new Set(FAR.buoy.filter((l) => l.src === 'sine').map((l) => l.at ?? 0))].sort((a, b) => a - b);
    const gaps = strokes.slice(1).map((v, i) => v - strokes[i]);
    expect(strokes.length).toBeGreaterThanOrEqual(4);
    expect(Math.max(...gaps) - Math.min(...gaps)).toBeGreaterThan(0.5);
  });
});
