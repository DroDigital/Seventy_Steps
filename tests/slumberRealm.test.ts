/**
 * The Stairs of Slumber, a realm of their own (round 123, asked: "the whole stairs are visible on the openworld dreamlands map which doesn't
 * make much sense, it should have its own realm"; and "everything is still too overcast and not eerie and dark enough"). The stairs stand in
 * an island of their own that holds them and nothing else, so the Dreamlands' map has nothing of them and theirs nothing of the Dreamlands;
 * and that realm is a dark with no moon and no star in it, whose thick mist swallows the light rather than giving the lantern's back.
 */

import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { FOGS } from '../src/data/fogs';
import { LOOKS } from '../src/data/looks';
import { FOG, SKY, SLUMBER } from '../src/data/tuning';
import type { PostPass } from '../src/render/postPass';
import { createVolumetricFog } from '../src/render/volumetricFog';
import { getRegion, LANDLESS } from '../src/data/regions';
import { mapPlaces, realmOf } from '../src/world/mapData';
import { worldLayout } from '../src/world/placements';
import { regionPlan } from '../src/world/regionPlan';
import { regionAt } from '../src/world/worldMap';

const stairs = worldLayout().dungeons.find((d) => d.layout.def.id === 'slumber')!.layout;
const luma = (c: readonly number[]): number => 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2];

describe('the Stairs of Slumber, a realm of their own (round 123)', () => {
  it('stand in an island that holds them alone: every room, the cavern\'s Elder Sign and the Gate of Deeper Slumber', () => {
    expect(stairs.region).toBe('slumber_stairs');
    expect(realmOf('slumber_stairs').map((r) => r.id)).toEqual(['slumber_stairs']);
    for (const r of stairs.rooms) expect(regionAt(r.x, r.z)?.id, r.def.id).toBe('slumber_stairs');
    const w = worldLayout();
    expect(w.signs.find((s) => s.id === 'dream_cavern')?.region).toBe('slumber_stairs');
    expect(w.gates.find((g) => g.id === 'dream_deeper')?.region).toBe('slumber_stairs');
    expect(regionAt(w.dream!.x, w.dream!.z)?.id).toBe('slumber_stairs'); // the Sleeper's Sign leads to their head
    expect(w.gates.find((g) => g.id === 'dream_wood_gate')?.region).toBe('dreamlands'); // and their foot to the Enchanted Wood
    expect(w.dungeons.filter((d) => d.layout.region === 'slumber_stairs')).toHaveLength(1);
    expect(w.spawns.filter((s) => s.region === 'slumber_stairs').every((s) => s.id.startsWith('room:slumber:') || s.id === 'ally:nasht_kaman_thah')).toBe(true);
    const plan = regionPlan(getRegion('slumber_stairs')!); // and no land is laid out about them: no road, no prop, no foe of the open ground, no secret
    expect(LANDLESS.has('slumber_stairs')).toBe(true);
    expect([plan.roads.length, [...plan.props.values()].flat().length, [...plan.spawns.values()].flat().length, plan.pois.length]).toEqual([0, 0, 0, 0]);
  });

  it('are not on the Dreamlands\' map, and the Dreamlands are not on theirs', () => {
    const dream = new Set(realmOf('dreamlands').map((r) => r.id));
    const marked = mapPlaces().filter((p) => dream.has(p.region)).map((p) => p.id);
    for (const id of ['slumber', 'dream_cavern', 'dream_deeper']) expect(marked, id).not.toContain(id);
    expect(mapPlaces().filter((p) => p.region === 'slumber_stairs').map((p) => p.id).sort()).toEqual(['dream_cavern', 'dream_deeper', 'slumber']);
  });

  it('hang in a dark with no moon and no star, under a mist that swallows the light', () => {
    const look = LOOKS.slumber_stairs;
    expect(SKY.regions.slumber_stairs).toMatchObject({ moon: 0, stars: 0, milky: 0, aurora: 0, meteors: 0 });
    for (const [id, l] of Object.entries(LOOKS)) {
      if (id === 'slumber_stairs') continue;
      expect(luma(look.mist), id).toBeLessThan(luma(l.mist)); // the darkest mist of any realm
      expect(luma(look.ambient), id).toBeLessThan(luma(l.ambient)); // and the least light
    }
    expect(Math.max(...look.zenith, ...look.horizon)).toBeLessThan(0.08); // next to black
    expect(FOGS.slumber_stairs.color).toEqual(look.mist);
  });

  it('on the stairs the mist thickens the dark, not the lantern\'s glow: it lights as much of it as of a crypt\'s', () => {
    const v = (n: number) => ({ value: n === 3 ? new THREE.Vector3() : new THREE.Vector4() });
    const uniforms = { uProjInv: { value: new THREE.Matrix4() }, uCamWorld: { value: new THREE.Matrix4() }, uCamPos: v(3), uFog: v(4), uFogAir: v(4), uFogColor: v(3), uFogDrift: v(3), uFogLantern: { value: 0 }, uFogGlow: { value: 0 } };
    const fog = createVolumetricFog({ uniforms } as unknown as PostPass);
    const camera = new THREE.PerspectiveCamera();
    const frame = (descent: number | null) => ({ region: 'slumber_stairs', enclosed: true, ground: 0, stress: 0, setting: 1, descent });
    fog.update(camera, 1, frame(null));
    const [crypt, lantern, lamps] = [uniforms.uFog.value.x, uniforms.uFogLantern.value, uniforms.uFogGlow.value];
    expect([lantern, lamps]).toEqual([FOG.lantern, FOG.glow]); // off the stairs, as ever
    fog.snap();
    fog.update(camera, 2, frame(1));
    const thick = uniforms.uFog.value.x / crypt;
    expect(thick).toBeCloseTo(SLUMBER.mist.max, 5); // the deepest floor's mist is six times a crypt's...
    expect(uniforms.uFogLantern.value * thick).toBeCloseTo(FOG.lantern, 5); // ...and the lantern's glow in it no more than in a crypt's
    expect(uniforms.uFogGlow.value * thick).toBeCloseTo(FOG.glow * Math.sqrt(SLUMBER.mist.max), 5); // a fire still blooms in it
    expect(Math.max(uniforms.uFogColor.value.x, uniforms.uFogColor.value.y, uniforms.uFogColor.value.z)).toBeLessThan(0.08); // and the mist's own light is next to none
  });
});
