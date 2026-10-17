import { describe, expect, it } from 'vitest';
import { groundMaterial } from '../src/render/terrainMesh';

const flag = (m: ReturnType<typeof groundMaterial>, name: string): number => m.uniforms[name]!.value as number;

describe("where two regions' grounds meet, so do their roads and their patches (round 55, review of PR 136)", () => {
  it('alone, a ground has none of it', () => {
    const m = groundMaterial('grass', 'cobble', 'leaves');
    expect([flag(m, 'uHasMap4'), flag(m, 'uHasMap5'), flag(m, 'uPatchFade')]).toEqual([0, 0, 0]);
  });

  it("cross-fades a road with the road style beside it only where the two differ (hub's cobble into Vermont's mud)", () => {
    const differ = groundMaterial('grass', 'cobble', 'leaves', { texture: 'grass', road: 'mud', patch: 'leaves' });
    expect([flag(differ, 'uHasMap4'), flag(differ, 'uHasMap5'), flag(differ, 'uPatchFade')]).toEqual([1, 1, 0]);
    const same = groundMaterial('grass', 'cobble', 'leaves', { texture: 'grass', road: 'cobble', patch: 'leaves' });
    expect([flag(same, 'uHasMap4'), flag(same, 'uHasMap5'), flag(same, 'uPatchFade')]).toEqual([1, 0, 0]);
  });

  it("fades a patch out toward a border only where the region beside has other patches (hub's leaves against Arkham's rot)", () => {
    const rot = groundMaterial('grass', 'cobble', 'leaves', { texture: 'grass', road: 'cobble', patch: 'rot' });
    expect(flag(rot, 'uPatchFade')).toBe(1);
    expect(flag(groundMaterial('grass', 'cobble', 'leaves', { texture: 'grass', road: 'cobble', patch: 'leaves' }), 'uPatchFade')).toBe(0);
    expect(flag(groundMaterial('grass', 'cobble', undefined, { texture: 'grass', road: 'cobble', patch: 'rot' }), 'uPatchFade')).toBe(1);
  });

  it('keeps one material for each combination', () => {
    const a = groundMaterial('grass', 'cobble', 'leaves', { texture: 'mud', road: 'mud', patch: 'gravel' });
    expect(groundMaterial('grass', 'cobble', 'leaves', { texture: 'mud', road: 'mud', patch: 'gravel' })).toBe(a);
    expect(groundMaterial('grass', 'cobble', 'leaves', { texture: 'mud', road: 'mud', patch: 'dirt' })).toBe(a); // (a patch beside only matters for whether it differs)
    expect(groundMaterial('grass', 'cobble', 'leaves', { texture: 'mud', road: 'cobble', patch: 'gravel' })).not.toBe(a);
  });
});
