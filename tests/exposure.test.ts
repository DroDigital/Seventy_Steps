import { describe, expect, it } from 'vitest';
import { SEA_PLACE, SENSE, WIND_PLACE } from '../src/data/ambienceRoles';
import { WORLD } from '../src/data/tuning';
import { PLACED, createExposure, lookAt, read } from '../src/render/audio/exposure';
import { shapeBed, spotPlace, type BedWorld } from '../src/render/audio/bedShape';
import { landHeight } from '../src/world/land';

const SEA = WORLD.seaLevel - 5;
/** A straight coast: land at 3 m for z >= 0, the sea below. */
const coast = (_x: number, z: number): number => (z >= 0 ? 3 : SEA);
/** A coast along x = 0 with the sea to the east. */
const east = (x: number): number => (x <= 0 ? 3 : SEA);
const R = { x: 1, y: 0, z: 0 };
const flat = { sea: true, wind: true };

describe('the sea sensed (render/audio/exposure.ts)', () => {
  it('the shore falls off as one walks inland from a straight coast, and is nothing beyond the last ring', () => {
    const inland = [3, 12, 30, 60, 110, 170, 260].map((z) => read(lookAt(coast, 0, z)).shore);
    for (let i = 1; i < inland.length; i++) expect(inland[i], `${i}`).toBeLessThanOrEqual(inland[i - 1] + 1e-9);
    expect(inland[0]).toBeGreaterThan(0.85); // at the water's edge: whole
    expect(inland[2]).toBeGreaterThan(0.3);
    expect(inland[2]).toBeLessThan(0.8);
    expect(inland[4]).toBeLessThan(0.2);
    expect(inland[6]).toBe(0); // out of reach
    expect(read(lookAt(coast, 0, -4)).shore).toBe(1); // wading
  });

  it('the water\'s bearing: it leans toward the sea, and as the head turns the sea comes round to the other ear', () => {
    const r = read(lookAt(east, -10, 0));
    expect(r.lean.x).toBeGreaterThan(0.5); // east is +x
    expect(Math.abs(r.lean.z)).toBeLessThan(0.1);
    const e = createExposure(east, WORLD.seaLevel);
    const pan = (right: { x: number; y: number; z: number }): number => {
      e.reset();
      e.update(1, { x: -10, y: 3, z: 0 }, right, flat);
      return PLACED.pan;
    };
    expect(pan({ x: 1, y: 0, z: 0 })).toBeGreaterThan(0.3); // facing so that east is to the right
    expect(pan({ x: -1, y: 0, z: 0 })).toBeLessThan(-0.3); // turned about: it is on the left
    expect(Math.abs(pan({ x: 0, y: 0, z: 1 }))).toBeLessThan(0.15); // facing the sea: ahead, in the middle
    // a spit with the sea on every side: no side to it
    const spit = (x: number, z: number): number => (Math.hypot(x, z) < 8 ? 3 : SEA);
    const s = read(lookAt(spit, 0, 0));
    expect(s.shore).toBeGreaterThan(0.8);
    expect(Math.hypot(s.lean.x, s.lean.z)).toBeLessThan(0.15);
  });

  it('the wind: a height reads exposed, a hollow a lee, flat ground neither, and the sea is not a cliff', () => {
    const hill = (x: number, z: number): number => 3 + 8 * Math.exp(-(x * x + z * z) / 900);
    const pit = (x: number, z: number): number => 12 - 8 * Math.exp(-(x * x + z * z) / 900);
    expect(read(lookAt(hill, 0, 0)).exposure).toBeGreaterThan(0.9);
    expect(read(lookAt(pit, 0, 0)).exposure).toBeLessThan(-0.9);
    expect(Math.abs(read(lookAt(() => 4, 5, 5)).exposure)).toBeLessThan(0.01);
    expect(read(lookAt(coast, 0, 1)).exposure).toBeLessThan(0.7); // (a shore is not a summit: the sea counts as its own level)
    expect(read(lookAt(east, 0, 0)).exposure).toBeGreaterThanOrEqual(0);
  });

  it('it is eased: a gap in the coast does not flicker the sound, a jump is taken at once, and a realm with no sea hears none', () => {
    let blip = false;
    const h = (x: number, z: number): number => (blip && Math.hypot(x, z) > 30 && Math.hypot(x, z) < 50 ? SEA : 3);
    const e = createExposure(h, WORLD.seaLevel);
    for (let t = 0; t < 8; t++) e.update(t * 0.25, { x: 0, y: 3, z: 0 }, R, flat);
    expect(PLACED.shore).toBe(0);
    blip = true;
    e.update(2.25, { x: 0, y: 3, z: 0 }, R, flat); // one look sees sea on every bearing at 40 m
    const peak = PLACED.shore;
    expect(peak).toBeGreaterThan(0.05);
    expect(peak).toBeLessThan(0.45); // ... and the bed is not told it is on the shore
    blip = false;
    let last = peak;
    for (let t = 0; t < 8; t++) {
      e.update(2.5 + t * 0.25, { x: 0, y: 3, z: 0 }, R, flat);
      expect(PLACED.shore).toBeLessThan(last + 1e-9); // and falls back, slowly
      last = PLACED.shore;
    }
    expect(PLACED.shore).toBeGreaterThan(peak * 0.3);
    const wet = createExposure(coast, WORLD.seaLevel);
    wet.update(0, { x: 0, y: 3, z: 2 }, R, flat);
    expect(PLACED.shore).toBeGreaterThan(0.8); // on the first look: whole
    wet.update(1, { x: 0, y: 3, z: 400 }, R, flat); // a journey: taken at once
    expect(PLACED.shore).toBe(0);
    const dry = createExposure(coast, WORLD.seaLevel);
    dry.update(0, { x: 0, y: 3, z: 2 }, R, { sea: false, wind: true });
    expect(PLACED.shore).toBe(0);
  });

  it('the sea is found in the real land: loud at Innsmouth\'s east shore, gone in its streets, and the sea\'s bearing is told from afar', () => {
    const quay = read(lookAt(landHeight, 1005, 800)); // a few metres in from the rim
    const streets = read(lookAt(landHeight, 760, 780));
    expect(quay.shore).toBeGreaterThan(0.4);
    expect(quay.lean.x).toBeGreaterThan(0.5); // east
    expect(streets.shore).toBe(0);
    const e = createExposure();
    const b = e.seaward({ x: 760, y: 3, z: 780 })!;
    expect(b).not.toBeNull();
    expect(Math.sin(b)).toBeGreaterThan(0.3); // to the east side
    expect(createExposure().seaward({ x: 0, y: 3, z: 4096 })).toBeNull(); // the heart of the Dreamlands: no sea within reach
  });
});

describe('the beds shaped by the hour and the place (render/audio/bedShape.ts)', () => {
  const world = (o: Partial<BedWorld> = {}): BedWorld => ({ hourly: true, placed: true, phase: 0.3, shore: 0, pan: 0, exposure: 0, ...o });

  it('a sea bed is whole and bright at the water and far and dull inland; a wind bed rises and brightens on a height and drops in a lee', () => {
    const shore = shapeBed('surf', 2800, world({ shore: 1, pan: 0.7 }));
    const inland = shapeBed('surf', 2800, world({ shore: 0 }));
    expect(shore.gain).toBeCloseTo(1, 5);
    expect(shore.cutoff).toBe(2800);
    expect(shore.lean).toBeCloseTo(SEA_PLACE.pan, 5);
    expect(inland.gain).toBeCloseTo(SEA_PLACE.inland, 5);
    expect(inland.cutoff).toBe(SEA_PLACE.low);
    expect(inland.lean).toBe(0);
    const ridge = shapeBed('wind', 2600, world({ exposure: 1 }));
    const lee = shapeBed('wind', 2600, world({ exposure: -1 }));
    expect(ridge.gain).toBeGreaterThan(1.3);
    expect(lee.gain).toBeCloseTo(1 - WIND_PLACE.lee, 5);
    expect(ridge.cutoff!).toBeGreaterThan(3200);
    expect(lee.cutoff!).toBeLessThan(2000);
    expect(shapeBed('wind', undefined, world({ exposure: 1 })).cutoff).toBeNull();
    expect(SENSE.rings.length).toBe(SENSE.share.length);
  });

  it('under a roof, in the arena or in a realm that is not placed, a bed plays as it was; the hour still turns the open air\'s, and the other beds are left to it alone', () => {
    const shut = world({ hourly: false, placed: false, shore: 1, exposure: 1, phase: 0.5 });
    for (const f of ['surf', 'wind', 'crickets', 'cave']) expect(shapeBed(f, 2000, shut).gain, f).toBe(1);
    const open = world({ phase: 0.5, shore: 1, exposure: 1 });
    expect(shapeBed('crickets', 3600, open).gain).toBeLessThan(0.15); // the Still
    expect(shapeBed('cave', 2400, open).gain).toBe(1);
    expect(shapeBed('crickets', 3600, world({ placed: false, phase: 0.05 })).gain).toBeGreaterThan(0.95); // (not placed: the hour alone)
    expect(shapeBed('surf', 2800, world({ placed: false, shore: 0 })).gain).toBe(1);
    expect(shapeBed('wind', 2600, world({ exposure: 1, phase: 0.9 })).gain).toBeLessThanOrEqual(WIND_PLACE.most);
  });

  it('the hull\'s knock and the gurgle come from the water and are softer inland; every other spot from anywhere', () => {
    const near = spotPlace('hull', world({ shore: 1, pan: 0.6 }), 0.5);
    expect(near.pan).toBeGreaterThan(0.4);
    expect(near.gain).toBe(1);
    expect(spotPlace('gurgle', world({ shore: 0.4, pan: -0.5 }), -0.5).pan).toBeLessThan(-0.3);
    expect(spotPlace('hull', world({ shore: 0.2 }), 0).gain).toBeLessThan(0.6);
    expect(spotPlace('owl', world({ shore: 1, pan: 0.9 }), -0.5).pan).toBeCloseTo(-0.425, 5);
    expect(spotPlace('hull', world({ shore: 0 }), 0.5).pan).toBeCloseTo(0.425, 5); // no sea about: anywhere, as it was
    expect(spotPlace('hull', world({ placed: false, shore: 1, pan: 0.9 }), 0.5).pan).toBeCloseTo(0.425, 5);
  });
});
