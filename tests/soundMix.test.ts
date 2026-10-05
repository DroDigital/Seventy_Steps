import { existsSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ACT_CUES } from '../src/data/actBeats';
import { ACTS, CLASS_GAIN, HANDS, MIST_CLOSE, mistPass, STINGER_VARY, UI } from '../src/data/foleySounds';
import { SAMPLE_SETS, STINGER_SAMPLES } from '../src/data/samples';
import { SAMPLE_LEVELS as levels } from '../src/data/sampleLevels';
import { takeTrims, TRIM } from '../src/data/takeTrim';
import { STINGERS, type Layer, type Sound } from '../src/data/sounds';
import { render } from './soundRender';

const scaled = (sound: Sound, k: number): Sound => sound.map((l): Layer => ({ ...l, gain: l.gain * k }));
const db = (k: number): number => 20 * Math.log10(k);

describe('the mix: nothing too loud, nothing too quiet (round 40)', () => {
  it('the menus are quiet and brief: a run of them is a patter, not a rattle', () => {
    for (const [id, s] of Object.entries(UI)) {
      const r = render(scaled(s, CLASS_GAIN.ui));
      expect(r.rms, `ui ${id}`).toBeGreaterThan(-44);
      expect(r.rms, `ui ${id}`).toBeLessThan(-30);
      expect(r.peak, `ui ${id}`).toBeLessThan(-14);
      expect(r.sec, `ui ${id}`).toBeLessThan(0.6);
    }
  });

  it("the investigator's hands are in the level of a footfall to a blow; a flask's burst and the anvil are in an impact's", () => {
    for (const [id, s] of Object.entries(HANDS)) {
      const impact = id === 'burst' || id === 'anvil';
      const r = render(scaled(s, CLASS_GAIN[impact ? 'impact' : 'hands']));
      const [lo, hi] = impact ? [-28, -14] : [-36, -22];
      expect(r.rms, `hands ${id}`).toBeGreaterThan(lo);
      expect(r.rms, `hands ${id}`).toBeLessThan(hi);
      expect(r.peak, `hands ${id}`).toBeLessThan(impact ? -1 : -6);
    }
  });

  it("the people's small sounds are soft, and fade in a room's air long before they are a nuisance", () => {
    for (const [id, s] of Object.entries(ACTS)) {
      const r = render(scaled(s, CLASS_GAIN.acts));
      expect(r.rms, `act ${id}`).toBeGreaterThan(-48);
      expect(r.rms, `act ${id}`).toBeLessThan(-28);
      expect(r.peak, `act ${id}`).toBeLessThan(-10);
    }
    for (const cues of Object.values(ACT_CUES)) for (const c of cues!) expect(c.gain ?? 1).toBeLessThanOrEqual(1);
  });

  it('the mist wall is felt before it is heard: in the level of a footfall, not a blow', () => {
    for (const walk of [0.67, 2, 5]) {
      const r = render(scaled(mistPass(walk), CLASS_GAIN.mist));
      expect(r.rms).toBeGreaterThan(-32);
      expect(r.rms).toBeLessThan(-22);
      expect(r.peak).toBeLessThan(-8);
    }
    const close = render(scaled(MIST_CLOSE, CLASS_GAIN.mist));
    expect(close.rms).toBeGreaterThan(-32);
    expect(close.rms).toBeLessThan(-22);
  });

  it('every stinger is audible and none is far over full scale (the limiter takes the rest), and each says how far it varies', () => {
    for (const [id, s] of Object.entries(STINGERS)) {
      const r = render(s);
      const recorded = STINGER_SAMPLES[id as keyof typeof STINGER_SAMPLES];
      expect(r.rms, `stinger ${id}`).toBeGreaterThan(recorded ? -50 : -42);
      expect(r.peak, `stinger ${id}`).toBeLessThan(4);
    }
    for (const [id, v] of Object.entries(STINGER_VARY)) {
      expect(id in STINGERS, id).toBe(true);
      expect(v! > 0 && v! <= 2, id).toBe(true);
    }
  });
});

describe('the recordings, measured (tools/audio_levels.py → data/sampleLevels.ts)', () => {
  it('has every recording, and nothing that is not there', () => {
    const files = ['sfx', 'amb'].flatMap((d) => readdirSync(`public/audio/${d}`).filter((f) => f.endsWith('.mp3')).map((f) => `${d}/${f.slice(0, -4)}`));
    for (const f of files) expect(levels[f], `${f} is not measured: run python3 tools/audio_levels.py`).toBeDefined();
    for (const f of Object.keys(levels)) expect(existsSync(`public/audio/${f}.mp3`), `${f} is measured but gone`).toBe(true);
  });

  it('every set is played at a level between a footfall and a gunshot: the recordings are cut to a common peak, and the set gain places them', () => {
    for (const [id, set] of Object.entries(SAMPLE_SETS)) {
      const g = db(set.gain);
      const trim = takeTrims(set);
      for (const f of set.files) {
        const l = levels[`sfx/${f}`];
        expect(l, f).toBeDefined();
        expect(l.rms + g + trim[f], `${id}: ${f} is too quiet`).toBeGreaterThan(-45);
        expect(l.rms + g + trim[f], `${id}: ${f} is too loud`).toBeLessThan(-10);
        expect(l.peak + g + trim[f], `${id}: ${f} peaks over full scale`).toBeLessThanOrEqual(0);
      }
    }
  });

  it('the takes of one set are brought to one level as they play: within 4 dB of the others (they were up to 13 apart), the trim held back only by its caps', () => {
    for (const [id, set] of Object.entries(SAMPLE_SETS)) {
      const trim = takeTrims(set);
      const at = set.files.map((f) => levels[`sfx/${f}`].rms + trim[f]);
      const was = set.files.map((f) => levels[`sfx/${f}`].rms);
      expect(Math.max(...at) - Math.min(...at), `${id} (was ${(Math.max(...was) - Math.min(...was)).toFixed(1)} dB)`).toBeLessThanOrEqual(4);
    }
  });

  it('a trim never puts a take over -0.5 dBFS, boosts by more than 6 dB or cuts by more than 12; and the set keeps its mean level', () => {
    for (const [id, set] of Object.entries(SAMPLE_SETS)) {
      const trim = takeTrims(set);
      const g = db(set.gain);
      for (const f of set.files) {
        const t = trim[f];
        expect(t, f).toBeDefined();
        expect(t, `${id}: ${f}`).toBeLessThanOrEqual(TRIM.boost);
        expect(t, `${id}: ${f}`).toBeGreaterThanOrEqual(-TRIM.cut);
        expect(levels[`sfx/${f}`].peak + g + t, `${id}: ${f}`).toBeLessThanOrEqual(-0.5 + 1e-9);
      }
    }
    expect(takeTrims({ files: ['boom1', 'boom2'], gain: 0.7 })['boom2']).toBeLessThan(-5); // the hot take is cut
    expect(takeTrims({ files: ['boom1', 'boom2'], gain: 0.7 })['boom1']).toBeGreaterThan(3); // the quiet one is raised
  });
});
