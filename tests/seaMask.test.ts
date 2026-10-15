import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { WORLD } from '../src/data/tuning';
import { createSea } from '../src/render/sea';
import { seaRoomMask } from '../src/render/seaMask';
import { worldLayout } from '../src/world/placements';

/** Sample exactly as the sea's fragment shader does, before waves and sanity move its surface. */
function masked(mask: ReturnType<typeof seaRoomMask>, x: number, z: number): boolean {
  const { texture, bounds: b } = mask;
  const [u, v] = [(x - b.x) / b.z, (z - b.y) / b.w];
  if (u < 0 || v < 0 || u >= 1 || v >= 1) return false;
  const { data, width, height } = texture.image;
  return data![Math.floor(v * height) * width + Math.floor(u * width)] > 127;
}

describe('the sea stays outside dungeon rooms', () => {
  it('cuts exact room footprints at negative coordinates, leaving branching gaps and the sea beyond them', () => {
    const mask = seaRoomMask([
      { x0: -24, z0: -16, x1: -8, z1: 0 },
      { x0: -8, z0: -16, x1: 8, z1: 0 },
      { x0: -24, z0: 0, x1: -8, z1: 16 },
    ]);
    for (const [x, z] of [[-23.999, -15.999], [-8.001, -0.001], [-8, -8], [0, -8], [-16, 8]]) expect(masked(mask, x, z)).toBe(true);
    for (const [x, z] of [[-24.001, -8], [-16, 16.001], [0, 8], [1000, 1000], [-1000, -1000]]) expect(masked(mask, x, z)).toBe(false);
    expect(mask.texture.minFilter).toBe(THREE.NearestFilter);
    expect(mask.texture.magFilter).toBe(THREE.NearestFilter);
    expect(mask.texture.generateMipmaps).toBe(false);
  });

  it('masks every real room, including stairs, pits, bridges and wells, while leaving their exterior clear', () => {
    const rooms = worldLayout().dungeons.flatMap((d) => d.layout.rooms);
    const mask = seaRoomMask(rooms.map((r) => r.rect));
    const kinds = new Set<string>();
    for (const r of rooms) {
      kinds.add(r.def.kind);
      const { x0, z0, x1, z1 } = r.rect;
      for (const edge of [x0, z0, x1, z1]) expect(Number.isInteger(edge / WORLD.snap), r.def.id).toBe(true);
      for (const x of [x0 + 0.001, r.x, x1 - 0.001]) {
        for (const z of [z0 + 0.001, r.z, z1 - 0.001]) expect(masked(mask, x, z), r.def.id).toBe(true);
      }
    }
    expect(kinds).toEqual(new Set(['hall', 'corridor', 'stair', 'pit', 'bridge', 'well']));
    expect(masked(mask, mask.bounds.x - 1, mask.bounds.y - 1)).toBe(false);
  });

  it('keeps the world mask fixed when every sea ring moves, and supports a sea without rooms', () => {
    const sea = createSea([{ x0: -8, z0: -8, x1: 8, z1: 8 }]);
    const material = (sea.group.children[0] as THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>).material;
    const mask = { texture: material.uniforms.uSeaMask.value, bounds: material.uniforms.uSeaMaskBounds.value };
    sea.update(217, -385);
    expect(masked(mask, 0, 0)).toBe(true);
    expect(masked(mask, 217, -385)).toBe(false);
    expect(material.fragmentShader).toContain('texture(uSeaMask, roomUv).r > 0.5) discard;');
    expect(masked(seaRoomMask([]), 0, 0)).toBe(false);
  });
});
