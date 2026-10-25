/**
 * The coats of the land (round 80, data/coats.ts, render/coat.ts): what lies on the stones of a realm. Only real realms wear one, none
 * wears a colour the post pass would take for an anomaly, one coat eases into another without a jump, and the world shader lays it on props
 * only, never on the lit, the living or the ground.
 */
import { describe, expect, it } from 'vitest';
import { COAT_EASE, COATS, coatOf, easeCoat, NO_COAT, type CoatLook } from '../src/data/coats';
import { getRegion, REGIONS } from '../src/data/regions';
import { createCoatLayer } from '../src/render/coat';
import { ANOMALY_HUES, rgbToHsv } from '../src/render/palette';
import { WORLD_FRAG } from '../src/render/shaders/world';
import { coatable, worldUniforms } from '../src/render/worldMaterial';

const hueGap = (a: number, b: number): number => Math.min(Math.abs(a - b), 1 - Math.abs(a - b));
/** The post pass's colour isolation (tests/palette.test.ts): an anomaly's hue with more than 0.3 of saturation, not so dark it is ignored. */
const reads = (c: readonly [number, number, number]): boolean => {
  const [h, s, v] = rgbToHsv(c);
  return s > 0.3 && v > 0.08 && ANOMALY_HUES.some((a) => hueGap(h, a) < 0.1);
};

describe('the realms\' coats', () => {
  it('belong to real realms, and every realm without one wears none', () => {
    for (const id of Object.keys(COATS)) expect(getRegion(id), id).toBeDefined();
    for (const r of REGIONS) {
      if (COATS[r.id]) expect(coatOf(r.id).amount, r.id).toBe(1);
      else expect(coatOf(r.id), r.id).toBe(NO_COAT);
    }
    expect(coatOf(null)).toBe(NO_COAT);
    expect(NO_COAT.amount).toBe(0);
    expect(NO_COAT.capShare + NO_COAT.wind + NO_COAT.stainShare).toBe(0);
  });

  it('are colours the isolation does not take for an anomaly, and muted ones', () => {
    for (const [id, def] of Object.entries(COATS)) {
      for (const [what, c] of [['cap', def.cap], ['stain', def.stain]] as const) {
        if (!c) continue;
        expect(reads(c), `${id} ${what}`).toBe(false);
        expect(rgbToHsv(c)[1], `${id} ${what} saturation`).toBeLessThan(0.36);
        for (const x of c) expect(x >= 0 && x <= 1).toBe(true);
      }
      for (const x of [def.capShare, def.wind, def.stainShare, def.crust]) expect(x === undefined || (x >= 0 && x <= 1)).toBe(true);
    }
  });

  it('say what each is: the cold realms are capped, the shore realms stained, and a stain has a line on the realm\'s own ground', () => {
    expect(COATS.mountains.cap).toBeDefined();
    expect(COATS.innsmouth.stain).toBeDefined();
    expect(COATS.rlyeh.stain).toBeDefined();
    const base = getRegion('innsmouth')!.biome.base;
    expect(coatOf('innsmouth').line).toBeCloseTo(base + COATS.innsmouth.line!, 6);
    expect(coatOf('mountains').stainShare).toBe(0); // (no stain: its line is nowhere)
  });

  it('ease from one to the next without a jump: a coat arriving or going keeps its colours and moves its amount', () => {
    const snow = coatOf('mountains');
    const sand = coatOf('pnakotus');
    expect(easeCoat(NO_COAT, snow, 1)).toBe(snow);
    const coming = easeCoat(NO_COAT, snow, 0.25);
    expect(coming.cap).toEqual(snow.cap);
    expect(coming.amount).toBeCloseTo(0.25, 6);
    const going = easeCoat(snow, NO_COAT, 0.4);
    expect(going.cap).toEqual(snow.cap);
    expect(going.amount).toBeCloseTo(0.6, 6);
    const mid = easeCoat(snow, sand, 0.5);
    for (let i = 0; i < 3; i++) expect(mid.cap[i]).toBeCloseTo((snow.cap[i] + sand.cap[i]) / 2, 6);
    expect(mid.amount).toBe(1);
  });
});

describe('the layer that lays it', () => {
  const settle = (layer: ReturnType<typeof createCoatLayer>, region: string | null, enclosed: boolean, seconds: number): CoatLook => {
    for (let i = 0; i < seconds * 60; i++) layer.update(region, enclosed, 1 / 60);
    return layer.now;
  };

  it('lays the realm\'s at once on a journey, eases it over a few seconds on a walk, and takes it off under a roof', () => {
    const layer = createCoatLayer();
    expect(worldUniforms.uCoatA.value.w).toBe(0);
    layer.update('mountains', false, 1e9);
    expect(worldUniforms.uCoatA.value.w).toBe(1);
    expect(worldUniforms.uCoatCol.value.x).toBeCloseTo(COATS.mountains.cap![0], 6);
    layer.update('hub', false, 1 / 60);
    expect(layer.now.amount).toBeGreaterThan(0.95); // (a frame later it has barely begun to go)
    expect(settle(layer, 'hub', false, COAT_EASE.realm * 3).amount).toBeLessThan(0.05);
    layer.update('innsmouth', false, 1e9);
    expect(worldUniforms.uCoatLine.value.x).toBeCloseTo(coatOf('innsmouth').line, 6);
    expect(settle(layer, 'innsmouth', true, COAT_EASE.roofed * 6).amount).toBeLessThan(0.05);
    expect(settle(layer, 'innsmouth', false, COAT_EASE.realm * 3).amount).toBeGreaterThan(0.95);
    layer.update(null, false, 1e9);
    expect(worldUniforms.uCoatA.value.w).toBe(0);
  });
});

describe('what takes a coat', () => {
  it('is the props of stone, wood and cloth, and not the ground, the plants, the flesh, the lit, the living or the glass', () => {
    expect(coatable({ texture: 'stone', seed: 6, vertexColors: true, vary: 0.6 })).toBe(true); // a prop's stone
    expect(coatable({ texture: 'wood', vertexColors: true, vary: 0.4, sway: true })).toBe(true);
    expect(coatable({ texture: 'shingle', vertexColors: true, vary: 0.5 })).toBe(true); // a roof
    expect(coatable({ texture: 'stone', vertexColors: true, vary: 0.7 })).toBe(true); // a dungeon's wall seen from without (under its roof the coat is off)
    expect(coatable({ texture: 'grass', vertexColors: true, vary: 0.9, shore: true })).toBe(false); // the terrain
    expect(coatable({ texture: 'grass', seed: 9, vertexColors: true, vary: 0.4, sway: true })).toBe(false); // leaves and blades
    expect(coatable({ texture: 'flesh', vertexColors: true, vary: 0.4 })).toBe(false);
    expect(coatable({ texture: 'cloth', emissive: 1, vertexColors: true })).toBe(false); // a lamp
    expect(coatable({ texture: 'cloth', vertexColors: true, vary: 0.3, emissive: 0.12, opacity: 0.14 })).toBe(false); // glass
    expect(coatable({ texture: 'cloth', vertexColors: true, vary: 0.4, character: 'creature' })).toBe(false);
    expect(coatable({ texture: 'slab', vertexColors: true })).toBe(false); // (arena floors vary nothing)
    expect(coatable({ texture: 'cloth', vertexColors: true, vary: 0.2, panes: true })).toBe(false);
  });

  it('is laid by the world shader on props only, skipped when there is none, and not on the lit or the living', () => {
    expect(WORLD_FRAG).toContain('uniform float uCoatOn');
    expect(WORLD_FRAG).toMatch(/uCoatOn \* uCoatA\.w > 0\.01 && uEmissive < 0\.5 && uCharacter < 0\.5/);
    expect(WORLD_FRAG).toContain('uCoatStain');
  });
});
