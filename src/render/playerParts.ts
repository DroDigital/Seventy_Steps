/**
 * The investigator's parts as geometry (round 80): what tools/player/bake_player.py reads out of his .blend, `data/player/playerPack` (a part's welded points in its
 * joint's own frame, its faces, a colour for each, as the game draws them) turned into flat-shaded, vertex-coloured geometry like every other figure's. The data is a
 * module of its own that the figures import; nothing here knows what the parts are (data/player/playerIndex: which joint, which group), and render/investigator.ts
 * hangs them on the figure.
 */

import * as THREE from 'three';
import { PLAYER_PACK } from '../data/player/playerPack';

/** UV density: texture units to the metre, so a cloth's folds (4 texels) and patches (8) come out the size they were on the old boxes. */
const UV_PER_METRE = 3.6;

interface Decoded {
  points: Float32Array;
  faces: Uint16Array;
  colours: Float32Array;
  colour: Uint8Array;
}

const decoded = new Map<string, Decoded>();

function decode(id: string): Decoded {
  const hit = decoded.get(id);
  if (hit) return hit;
  const text = PLAYER_PACK[id];
  if (!text) throw new Error(`player part ${id} is not in the pack`);
  const bytes = Uint8Array.from(atob(text), (ch) => ch.charCodeAt(0));
  const view = new DataView(bytes.buffer);
  const [nv, nf, nc] = [view.getUint16(0, true), view.getUint16(2, true), view.getUint16(4, true)];
  const box = Array.from({ length: 6 }, (_, i) => view.getFloat32(6 + i * 4, true));
  let at = 30;
  const points = new Float32Array(nv * 3);
  for (let i = 0; i < nv * 3; i++, at += 2) {
    const axis = i % 3;
    points[i] = box[axis] + ((view.getInt16(at, true) + 32768) / 65535) * (box[axis + 3] - box[axis]);
  }
  const faces = new Uint16Array(nf * 3);
  for (let i = 0; i < nf * 3; i++, at += 2) faces[i] = view.getUint16(at, true);
  const colour = bytes.slice(at, at + nf);
  at += nf;
  const colours = new Float32Array(nc * 3);
  for (let i = 0; i < nc * 3; i++, at += 4) colours[i] = view.getFloat32(at, true);
  const out = { points, faces, colours, colour };
  decoded.set(id, out);
  return out;
}

/** The parts `ids` as one geometry: faces unwelded so each is flat, a vertex colour for each, UVs by the plane a face lies in. */
export function partGeometry(ids: readonly string[]): THREE.BufferGeometry {
  const parts = ids.map(decode);
  const n = parts.reduce((s, p) => s + p.faces.length, 0);
  const [pos, nor, col, uv] = [new Float32Array(n * 3), new Float32Array(n * 3), new Float32Array(n * 3), new Float32Array(n * 2)];
  let v = 0;
  const [a, b, c, e1, e2, nm] = Array.from({ length: 6 }, () => new THREE.Vector3());
  for (const p of parts) {
    for (let t = 0; t < p.faces.length; t += 3) {
      a.fromArray(p.points, p.faces[t] * 3);
      b.fromArray(p.points, p.faces[t + 1] * 3);
      c.fromArray(p.points, p.faces[t + 2] * 3);
      nm.crossVectors(e1.subVectors(b, a), e2.subVectors(c, a)).normalize();
      const [ax, ay, az] = [Math.abs(nm.x), Math.abs(nm.y), Math.abs(nm.z)];
      const ci = p.colour[t / 3] * 3;
      for (const q of [a, b, c]) {
        pos.set([q.x, q.y, q.z], v * 3);
        nor.set([nm.x, nm.y, nm.z], v * 3);
        col.set([p.colours[ci], p.colours[ci + 1], p.colours[ci + 2]], v * 3);
        const [u, w] = ay >= ax && ay >= az ? [q.x, q.z] : ax >= az ? [q.z, q.y] : [q.x, q.y];
        uv.set([u * UV_PER_METRE, w * UV_PER_METRE], v * 2);
        v++;
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return g;
}
