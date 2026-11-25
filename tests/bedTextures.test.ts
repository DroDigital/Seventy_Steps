import { describe, expect, it } from 'vitest';
import { DUNGEON_ACCENTS, KIT_AMBIENCE } from '../src/data/dungeonAmbience';
import { AMBIENCE, BED_MANNER, DUNGEON_AMBIENCE, type Ambience } from '../src/data/samples';
import { bedTexture, GEN, GENERATED_BEDS, generatedOf, TEXTURE, type GeneratedBed } from '../src/render/audio/bedTextures';

const made = new Map<GeneratedBed, Float32Array>(GENERATED_BEDS.map((id) => [id, bedTexture(id)]));

const rmsDb = (x: Float32Array): number => 10 * Math.log10(x.reduce((s, v) => s + v * v, 0) / x.length);

/** The share of a loop's energy below `hz` (a one-pole split, run twice round so it is the loop's own). */
function below(x: Float32Array, hz: number): number {
  const k = 1 - Math.exp((-2 * Math.PI * hz) / TEXTURE.rate);
  let [low, eLow, eAll] = [0, 0, 0];
  for (let pass = 0; pass < 2; pass++) {
    for (const v of x) {
      low += k * (v - low);
      if (pass === 1) [eLow, eAll] = [eLow + low * low, eAll + v * v];
    }
  }
  return eLow / Math.max(eAll, 1e-12);
}

describe('the beds made in code (round 124, render/audio/bedTextures.ts)', () => {
  it('each is a mono loop at the recordings\' level, its peak held, the same each time it is drawn', () => {
    for (const [id, x] of made) {
      const seconds = id === 'embers' ? TEXTURE.flame : TEXTURE.seconds;
      expect(x.length, id).toBe(Math.round(TEXTURE.rate * seconds));
      expect(x.every(Number.isFinite), id).toBe(true);
      expect(rmsDb(x), id).toBeGreaterThan(-23.5);
      expect(rmsDb(x), id).toBeLessThan(-21.5);
      expect(x.reduce((m, v) => Math.max(m, Math.abs(v)), 0), id).toBeLessThan(TEXTURE.peak + 1e-6);
      expect(bedTexture(id)).toEqual(x);
    }
  });

  it('each closes on itself: the step from its last sample to its first is no larger than its steps within', () => {
    for (const [id, x] of made) {
      const steps = Array.from({ length: x.length - 1 }, (_, i) => Math.abs(x[i + 1]! - x[i]!)).sort((a, b) => a - b);
      const seam = Math.abs(x[0]! - x[x.length - 1]!);
      expect(seam, id).toBeLessThanOrEqual(steps[Math.floor(steps.length * 0.999)]! + 1e-9); // (as any step of the loop: no click where it turns)
    }
  });

  it('each sounds where it should: the shut air, the void and the fire low; the water babbling in the middle; the hum on its partials', () => {
    expect(below(made.get('still')!, 700)).toBeGreaterThan(0.7); // (a hollow low air, its weight under a kilohertz...)
    expect(below(made.get('still')!, 60)).toBeLessThan(0.3); // (...and above the rumble no small speaker carries)
    expect(below(made.get('abyss')!, 150)).toBeGreaterThan(0.6); // (the void the deepest of them)
    expect(below(made.get('embers')!, 300)).toBeGreaterThan(0.6);
    expect(below(made.get('hum')!, 60)).toBeLessThan(0.3); // (its partials, not a sub-bass)
    expect(below(made.get('trickle')!, 300)).toBeLessThan(0.2);
    expect(below(made.get('trickle')!, 3000)).toBeGreaterThan(0.6); // (its weight under 3 kHz, the split being gentle: bubbles of 0.4 to 1.75 kHz climbing as they rise)
    const hum = made.get('hum')!;
    const at = (hz: number): number => { // the loop's own magnitude at `hz` (a whole number of cycles of the loop)
      let [re, im] = [0, 0];
      for (let i = 0; i < hum.length; i++) [re, im] = [re + hum[i]! * Math.cos((2 * Math.PI * hz * i) / TEXTURE.rate), im + hum[i]! * Math.sin((2 * Math.PI * hz * i) / TEXTURE.rate)];
      return Math.hypot(re, im) / hum.length;
    };
    const f0 = Math.round(86 * TEXTURE.seconds) / TEXTURE.seconds;
    expect(at(f0)).toBeGreaterThan(at(f0 * 1.5) * 20); // (on its partials, not between them)
    expect(at(2 * f0)).toBeGreaterThan(at(f0 * 2.5) * 10);
  });

  it('a bed is made only when it is named so, and every made bed a place names exists and breathes', () => {
    expect(generatedOf(`${GEN}still`)).toBe('still');
    expect(generatedOf('still')).toBeNull();
    expect(generatedOf(`${GEN}nothing`)).toBeNull();
    expect(generatedOf('cave')).toBeNull();
    const places: Partial<Ambience>[] = [...Object.values(AMBIENCE), ...Object.values(DUNGEON_AMBIENCE), ...Object.values(KIT_AMBIENCE), ...Object.values(DUNGEON_ACCENTS)];
    const named = places.flatMap((a) => (a.beds ?? []).map(([f]) => f)).filter((f) => f.startsWith(GEN));
    expect(new Set(named)).toEqual(new Set(GENERATED_BEDS.map((id) => `${GEN}${id}`))); // (every made bed is played somewhere, and nothing names one that is not made)
    for (const f of named) expect(BED_MANNER[f], f).toBeDefined();
  });
});
