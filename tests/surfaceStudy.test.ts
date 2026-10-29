import { describe, expect, it } from 'vitest';
import { REGION_LAYOUTS } from '../src/data/regionFeatures';
import { REGIONS } from '../src/data/regions';
import { SURFACE_STUDIES, surfaceStudyIndex } from '../src/render/surfaceStudy';
import { groundMaterial } from '../src/render/terrainMesh';
import { createWorldMaterial, worldUniforms, type WorldMaterialOptions } from '../src/render/worldMaterial';

describe('optional material studies', () => {
  it('selects the three experiments explicitly and leaves missing or unknown choices off', () => {
    for (const flag of [null, '', 'off', 'unknown', 'Carved', '1']) expect(surfaceStudyIndex(flag), String(flag)).toBe(0);
    expect(surfaceStudyIndex('carved')).toBe(1);
    expect(surfaceStudyIndex('ceramic')).toBe(2);
    expect(surfaceStudyIndex('facets')).toBe(3);
    expect(new Set(SURFACE_STUDIES.map((study) => study.id)).size).toBe(4);
  });

  it('shares one live selection across architecture and the hub road within its grass terrain material', () => {
    const hub = REGIONS.find((region) => region.id === 'hub')!;
    const floor = groundMaterial(hub.biome.texture, REGION_LAYOUTS.hub.road, hub.biome.patch);
    const blended = groundMaterial(hub.biome.texture, REGION_LAYOUTS.hub.road, hub.biome.patch,
      { texture: 'mud', road: 'slab', patch: 'gravel' });
    const wall = createWorldMaterial({ texture: 'stone', vertexColors: true, vary: 0.3 });
    const original = worldUniforms.uStudy.value;
    try {
      for (const material of [floor, blended, wall]) {
        expect(material.uniforms.uStudy).toBe(worldUniforms.uStudy);
        expect(material.uniforms.uStudyOn.value).toBe(1);
      }
      expect(floor.uniforms.uMap.value.name).toMatch(/^grass:/);
      expect(floor.uniforms.uMap2.value.name).toMatch(/^cobble:/);
      expect(blended.uniforms.uHasMap4.value).toBe(1);
      expect(blended.uniforms.uHasMap5.value).toBe(1);
      for (const value of [1, 2, 3, 0]) {
        worldUniforms.uStudy.value = value;
        for (const material of [floor, blended, wall]) expect(material.uniforms.uStudy.value).toBe(value);
      }
    } finally {
      worldUniforms.uStudy.value = original;
      wall.dispose();
    }
  });

  it('keeps opaque landscape materials eligible, including organic ground that contains roads', () => {
    for (const texture of ['stone', 'slab', 'cobble', 'brick', 'wood', 'grass', 'leaves', 'rot', 'mud', 'snow'] as const) {
      const material = createWorldMaterial({ texture, shore: true });
      expect(material.uniforms.uStudyOn.value, texture).toBe(1);
      material.dispose();
    }
  });

  it('excludes bodies, foliage, lit panes, translucent and special surfaces', () => {
    const excluded: WorldMaterialOptions[] = [
      { texture: 'stone', character: 'player' },
      { texture: 'stone', character: 'creature' },
      { texture: 'stone', emissive: 1 },
      { texture: 'stone', emissive: 0.001 },
      { texture: 'stone', opacity: 0.6 },
      { texture: 'stone', panes: true },
      { texture: 'grass', sway: true },
      { texture: 'wood', sway: true },
      { texture: 'stone', surface: 'glass' },
      { texture: 'stone', surface: 'liquid' },
      { texture: 'stone', surface: 'wax' },
      { texture: 'stone', surface: 'mirror' },
      { texture: 'flesh' },
      { texture: 'water' },
      { texture: 'hide' },
      { texture: 'cloth' },
    ];
    for (const options of excluded) {
      const material = createWorldMaterial(options);
      expect(material.uniforms.uStudyOn.value, JSON.stringify(options)).toBe(0);
      material.dispose();
    }
  });
});
