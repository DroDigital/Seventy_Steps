import { describe, expect, it } from 'vitest';
import { FAR } from '../src/data/ambienceSounds';
import { STILL, STILL_HOWL, stillOf } from '../src/data/ambienceHours';
import { GAP, MASKED, PACE, PLACE_VOICES } from '../src/data/placeSounds';
import { REGIONS } from '../src/data/regions';
import { SAMPLE_SETS } from '../src/data/samples';
import { CLOCK } from '../src/data/tuning';
import { hourOf } from '../src/systems/clock';
import { hourWeight, schedule, turnAt, type Chosen, type Scene } from '../src/render/audio/placeVoices';

/** A small seeded generator, so a run is the same every time. */
const seeded = (seed: number): (() => number) => () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);
const phaseAt = (t: number, start = 0.3): number => (t / CLOCK.night + start) % 1;

interface Heard { t: number; id: string; phase: number; bearing: number | null }

/** Plays `nights` nights in `region`, a second at a time, with `scene` changed by `edit`; what was heard. */
function run(region: string, nights: number, edit: (t: number, s: Scene) => void = () => undefined, seaward: number | null = 1.2, seed = 7): Heard[] {
  const heard: Heard[] = [];
  let now = 0;
  let phase = 0;
  const sched = schedule((c: Chosen) => (heard.push({ t: now, id: c.voice === 'howl' ? 'howl' : c.voice.id, phase, bearing: c.bearing }), true), () => seaward, seeded(seed));
  for (let t = 0; t < nights * CLOCK.night; t++) {
    now = t;
    phase = phaseAt(t);
    const s: Scene = { region, phase, outdoors: true, held: false, weather: 'clear', hushed: 0 };
    edit(t, s);
    sched.update(t, s);
  }
  return heard;
}

const regions = Object.keys(PLACE_VOICES);

describe('the places\' voices as data (data/placeSounds.ts)', () => {
  it('belong to real realms, to a recipe that exists or to a recording that is not a cue, and are rare, far, soft and unrepeated in name', () => {
    const ids = new Set<string>();
    for (const [region, voices] of Object.entries(PLACE_VOICES)) {
      expect(REGIONS.some((r) => r.id === region), region).toBe(true);
      expect(voices.length, region).toBeLessThanOrEqual(3);
      for (const v of voices) {
        const name = `${region}/${v.id}`;
        expect(ids.has(v.id), `${name} twice`).toBe(false);
        ids.add(v.id);
        expect(!!v.recipe !== !!v.set, name).toBe(true);
        if (v.recipe) expect(FAR[v.recipe], name).toBeDefined();
        if (v.set) {
          expect(SAMPLE_SETS[v.set], name).toBeDefined();
          expect(['whale', 'ghost', 'bell', 'thunder'].includes(v.set), `${name} is a cue's sound`).toBe(false);
          expect(v.lowpass ?? 99999, `${name}: a recording is shut in`).toBeLessThanOrEqual(2400);
        }
        expect(v.every[0], name).toBeGreaterThanOrEqual(70);
        expect(v.every[1], name).toBeGreaterThanOrEqual(v.every[0]);
        expect(v.far[0], name).toBeGreaterThanOrEqual(60);
        expect(v.far[1], name).toBeGreaterThanOrEqual(v.far[0]);
        expect(v.far[1], name).toBeLessThanOrEqual(320);
        expect(v.gain > 0.2 && v.gain <= 1, name).toBe(true);
        expect(Object.keys(v.hours).length, name).toBeGreaterThan(0);
        for (const w of Object.values(v.hours)) expect(w! > 0 && w! <= 2, name).toBe(true);
        if (v.seaward) expect(region, `${name} seaward away from the sea`).toBe('innsmouth');
      }
    }
    expect(STILL_HOWL.set in SAMPLE_SETS).toBe(true);
    expect(GAP).toBeGreaterThanOrEqual(45);
    expect(MASKED.has('storm') && MASKED.has('gale')).toBe(true);
  });

  it('the realms the brief names have what it names: a horn and a buoy off the reef, a toll and an organ, the hills, the piping, the drum, the chime, the drip', () => {
    const has = (region: string, what: string): boolean => PLACE_VOICES[region].some((v) => v.recipe === what || v.set === what);
    expect(has('innsmouth', 'foghorn') && has('innsmouth', 'buoy') && has('innsmouth', 'chant')).toBe(true);
    expect(has('arkham', 'organ')).toBe(true);
    expect(has('providence', 'toll') && has('providence', 'organ')).toBe(true);
    expect(has('dunwich', 'rumble')).toBe(true);
    expect(has('vermont', 'woodsDrone')).toBe(true);
    expect(has('mountains', 'iceBoom') && has('mountains', 'windpipe')).toBe(true);
    expect(has('dreamlands', 'drum') && has('dreamlands', 'templeBell')).toBe(true);
    expect(has('pnakotus', 'dryChime') && has('kn_yan', 'drip') && has('rlyeh', 'deepSwell')).toBe(true);
  });

  it('a voice\'s turn is drawn within its interval, sooner in the hours it likes, soon again in one it does not', () => {
    const v = PLACE_VOICES.mountains[1]; // the piping: waning 1.5, deep 1
    expect(turnAt(v, 100, 'deep', () => 0)).toBeCloseTo(100 + v.every[0] * PACE, 5);
    expect(turnAt(v, 100, 'waning', () => 1)).toBeCloseTo(100 + (v.every[1] * PACE) / 1.5, 5);
    const toll = PLACE_VOICES.hub[0]; // never in the waning
    expect(hourWeight(toll, 'waning')).toBe(0);
    expect(turnAt(toll, 100, 'waning', () => 0.5)).toBe(140);
  });
});

describe('the places\' voices played out (render/audio/placeVoices.ts schedule)', () => {
  for (const region of regions) {
    it(`${region}: nights of it are far apart, never the same twice running, never in the Still but for the dog that ends it, and only in an hour that likes them`, () => {
      const heard = run(region, 4);
      const voices = heard.filter((h) => h.id !== 'howl');
      expect(voices.length, 'it speaks').toBeGreaterThan(0);
      for (let i = 1; i < voices.length; i++) {
        const hour = hourOf(voices[i].phase);
        const others = PLACE_VOICES[region].filter((v) => v.id !== voices[i].id && hourWeight(v, hour) > 0);
        if (others.length > 0) expect(voices[i].id, `${voices[i - 1].id} twice at ${voices[i].t}`).not.toBe(voices[i - 1].id);
        expect(voices[i].t - voices[i - 1].t, 'too close').toBeGreaterThanOrEqual(GAP);
      }
      const perTenMinutes = (voices.length / (4 * CLOCK.night)) * 600;
      expect(perTenMinutes, "rare enough").toBeLessThanOrEqual(4.5);
      for (const h of voices) {
        expect(stillOf(h.phase), `${h.id} in the Still`).toBeLessThan(0.01);
        const v = PLACE_VOICES[region].find((x) => x.id === h.id)!;
        expect(hourWeight(v, hourOf(h.phase)), `${h.id} at its wrong hour`).toBeGreaterThan(0);
      }
      const howls = heard.filter((h) => h.id === 'howl');
      expect(howls.length).toBe(STILL_HOWL.realms.includes(region) ? 4 : 0); // one for each Still, each after its end, where there are dogs
      for (const h of howls) expect(h.phase).toBeGreaterThan(STILL.to);
      for (const h of howls) expect(h.phase).toBeLessThan(STILL.to + 0.04);
    });
  }

  it('Innsmouth\'s horn and buoy come from the water\'s side, and only where there is water within reach', () => {
    const wet = run('innsmouth', 3, () => undefined, 1.2).filter((h) => h.id !== 'howl');
    expect(wet.length).toBeGreaterThan(3);
    for (const h of wet) expect(h.bearing).toBe(1.2);
    expect(run('innsmouth', 3, () => undefined, null).filter((h) => h.id !== 'howl')).toEqual([]);
  });

  it('nothing sounds in a fight, a cutscene, a pause, under a roof, in a storm or while the ground goes quiet; and nothing bursts out when it ends', () => {
    for (const edit of [(_t: number, s: Scene) => { s.held = true; }, (_t: number, s: Scene) => { s.outdoors = false; }, (_t: number, s: Scene) => { s.weather = 'storm'; }, (_t: number, s: Scene) => { s.weather = 'gale'; }, (_t: number, s: Scene) => { s.hushed = 0.5; }]) {
      expect(run('arkham', 3, edit), 'heard').toEqual([]);
    }
    const heard = run('innsmouth', 3, (t, s) => { if (t > 1500 && t < 2100) s.held = true; });
    const after = heard.filter((h) => h.t >= 2100)[0];
    expect(heard.filter((h) => h.t > 1500 && h.t < 2100)).toEqual([]);
    expect(after.t - 2100, 'a burst as the fight ends').toBeGreaterThan(20);
  });

  it('a realm with no voices is silent, a journey into another starts that one\'s clocks afresh, and a Still jumped over leaves no dog', () => {
    expect(run('beyond', 2)).toEqual([]);
    expect(run('hub', 1, (t, s) => { s.region = t < 400 ? 'beyond' : 'hub'; }).filter((h) => h.t < 400)).toEqual([]);
    const jumped = run('arkham', 2, (t, s) => { if (t > 400 && t < 700) s.phase = 0.6; }); // (seconds 400 to 700 stand at 0.6, past the Still)
    expect(jumped.filter((h) => h.id === 'howl').length).toBeLessThanOrEqual(2);
  });
});
