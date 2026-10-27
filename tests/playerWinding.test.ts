import { describe, expect, it } from 'vitest';
import { PLAYER_PACK } from '../src/data/player/playerPack';

/** A part's welded points and faces, as data/player/playerPack writes them (render/playerParts.ts reads the same). */
function decode(text: string): { points: Float32Array; faces: Uint16Array } {
  const bytes = Uint8Array.from(atob(text), (ch) => ch.charCodeAt(0));
  const view = new DataView(bytes.buffer);
  const [nv, nf] = [view.getUint16(0, true), view.getUint16(2, true)];
  const box = Array.from({ length: 6 }, (_, i) => view.getFloat32(6 + i * 4, true));
  let at = 30;
  const points = new Float32Array(nv * 3);
  for (let i = 0; i < nv * 3; i++, at += 2) points[i] = box[i % 3] + ((view.getInt16(at, true) + 32768) / 65535) * (box[(i % 3) + 3] - box[i % 3]);
  const faces = new Uint16Array(nf * 3);
  for (let i = 0; i < nf * 3; i++, at += 2) faces[i] = view.getUint16(at, true);
  return { points, faces };
}

describe('the investigator’s baked parts are wound outward (round 81)', () => {
  it('every closed piece has a positive volume, so the faces drawn are its outer ones', () => {
    for (const [id, text] of Object.entries(PLAYER_PACK)) {
      const { points, faces } = decode(text);
      const faceCount = faces.length / 3;
      const root = Array.from({ length: faceCount }, (_, i) => i);
      const find = (x: number): number => (root[x] === x ? x : (root[x] = find(root[x])));
      const edges = new Map<string, number>(); // pieces welded at a corner (a blade at its hilt) are still two: faces are one piece if they share an edge
      for (let t = 0; t < faceCount; t++) {
        for (let e = 0; e < 3; e++) {
          const [a, b] = [faces[t * 3 + e], faces[t * 3 + ((e + 1) % 3)]];
          const key = a < b ? `${a}/${b}` : `${b}/${a}`;
          const other = edges.get(key);
          if (other === undefined) edges.set(key, t);
          else root[find(t)] = find(other);
        }
      }
      const volume = new Map<number, number>();
      for (let t = 0; t < faceCount; t++) {
        const [a, b, c] = [faces[t * 3], faces[t * 3 + 1], faces[t * 3 + 2]].map((i) => [points[i * 3], points[i * 3 + 1], points[i * 3 + 2]]);
        const six = a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) + a[2] * (b[0] * c[1] - b[1] * c[0]);
        volume.set(find(t), (volume.get(find(t)) ?? 0) + six / 6);
      }
      for (const v of volume.values()) expect(v, `${id}: a piece is wound inside out`).toBeGreaterThan(0);
    }
  });
});
