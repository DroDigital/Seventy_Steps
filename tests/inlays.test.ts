import { describe, expect, it } from 'vitest';
import { roomStyle } from '../src/world/roomStyle';
import { worldLayout } from '../src/world/placements';
import type { BoxPart, CylPart } from '../src/world/dungeonParts';

/**
 * Round 45: a floor's inlays lie in one plane, a few centimetres over the slabs, and are drawn nearer than them by
 * the offset in the depth buffer; two of them over the same ground fight each other at their edge (the laboratory
 * of the alchemist's cellars: a gilt frame laid over the rug it bordered, and the frame's inner edge flickered as
 * the investigator walked). So none lies over another.
 */
describe('floor inlays', () => {
  it('no inlay lies over another', () => {
    const found: string[] = [];
    for (const d of worldLayout().dungeons) {
      for (const [ri, room] of d.layout.rooms.entries()) {
        const inlays = d.parts.filter((p): p is BoxPart | CylPart => p.look === 'inlay' && d.layout.rooms[p.room] === room);
        const inside = (p: BoxPart | CylPart, x: number, z: number): boolean => {
          if (p.shape === 'box') return x > p.min.x && x < p.max.x && z > p.min.z && z < p.max.z;
          const r = Math.hypot(x - p.x, z - p.z);
          return r < p.radius && r >= (p.inner ?? 0);
        };
        const step = 0.2;
        const hit = new Map<string, number>();
        for (let x = room.x - room.half; x < room.x + room.half; x += step) {
          for (let z = room.z - room.half; z < room.z + room.half; z += step) {
            const on = inlays.map((p, i) => (inside(p, x, z) ? i : -1)).filter((i) => i >= 0);
            for (let a = 0; a < on.length; a++) for (let b = a + 1; b < on.length; b++) hit.set(`${on[a]}/${on[b]}`, (hit.get(`${on[a]}/${on[b]}`) ?? 0) + 1);
          }
        }
        for (const [k, n] of hit) if (n * step * step > 0.02) found.push(`${d.layout.def.id}/${room.def.id} [${roomStyle(d.layout, room).floor}] #${ri}: inlays ${k} overlap ${(n * step * step).toFixed(2)} m2`);
      }
    }
    expect(found).toEqual([]);
  }, 120000);
});
