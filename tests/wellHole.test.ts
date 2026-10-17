import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { DUNGEON } from '../src/data/tuning';
import { well } from '../src/render/siteMeshes';
import { roomStyle } from '../src/world/roomStyle';
import { worldLayout } from '../src/world/placements';

/** The top of the floor under a point of a dungeon, or null where there is none (a hole). */
const floorAt = (parts: readonly { shape: string; look: string; min?: THREE.Vector3Like; max?: THREE.Vector3Like }[], x: number, z: number): number | null => {
  let top: number | null = null;
  for (const p of parts) if (p.shape === 'box' && p.look === 'floor' && x >= p.min!.x && x <= p.max!.x && z >= p.min!.z && z <= p.max!.z && (top === null || p.max!.y > top)) top = p.max!.y;
  return top;
};

describe('a well is a hole (round 55)', () => {
  const wells = worldLayout().dungeons.flatMap((d) => d.layout.rooms.filter((r) => r.def.kind === 'well').map((r) => ({ d, r })));

  it('has no floor where the shaft goes down, and floor everywhere the curb and the room stand', () => {
    expect(wells.length).toBeGreaterThan(3);
    for (const { d, r } of wells) {
      const parts = d.parts.filter((p) => p.room === r.index);
      for (const [dx, dz] of [[0, 0], [1.2, 0.4], [-1.7, 1.2], [0.3, -2.1], [2.2, 0.8], [-0.9, -2.2]]) {
        expect(floorAt(parts as never, r.x + dx, r.z + dz), `${d.layout.def.id} open at ${dx},${dz}`).toBeNull();
      }
      for (const ang of [0, 0.7, 1.9, 3.1, 4.4, 5.6]) {
        const at = [r.x + Math.cos(ang) * (DUNGEON.well + 0.36), r.z + Math.sin(ang) * (DUNGEON.well + 0.36)];
        expect(floorAt(parts as never, at[0], at[1]), `${d.layout.def.id} floor under the curb at ${ang}`).not.toBeNull();
      }
      for (const [dx, dz] of [[3.4, 0], [0, -3.6], [-5, 2], [6, 6]]) expect(floorAt(parts as never, r.x + dx, r.z + dz), `${d.layout.def.id} floor beyond at ${dx},${dz}`).not.toBeNull();
      const curb = (d.parts.filter((p) => p.room === r.index && p.shape === 'cyl' && p.look === 'rim') as { y0: number; y1: number }[])[0];
      expect(curb.y1 - curb.y0).toBeGreaterThan(DUNGEON.chasm); // the shaft goes down the whole of the chasm
    }
  });

  it('is drawn down to the water, darkening as it goes, the curb bare on its floor', () => {
    const top = 1;
    const bottom = top - 12.9;
    const parts = well(0, 0, 2.75, top, [1, 1, 1], bottom);
    const box = new THREE.Box3();
    for (const g of parts) box.expandByObject(new THREE.Mesh(g));
    expect(box.min.y).toBeLessThanOrEqual(bottom + 0.06);
    const shade = (g: THREE.BufferGeometry): number => g.getAttribute('color').getX(0);
    const walls = parts.slice(2, -1);
    expect(walls.length).toBeGreaterThan(3);
    for (let i = 1; i < walls.length; i++) expect(shade(walls[i]!), `band ${i}`).toBeLessThan(shade(walls[i - 1]!));
    expect(shade(walls.at(-1)!)).toBeLessThan(0.05); // black at the bottom
    for (const { d, r } of wells) expect(roomStyle(d.layout, r).floor, `${d.layout.def.id} has no inlay about its well`).toBe('plain');
  });
});
