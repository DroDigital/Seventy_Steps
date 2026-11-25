/**
 * Where a crown's underside lies above a point (2026-11-24): a willow's strands were hung from fixed heights under a crown whose
 * jagged, flattened lumps did not reach them, and hung in the air beneath it. A ray up from the ground finds the lowest face of the
 * crown over (x, z), so a strand can start inside it.
 */
import * as THREE from 'three';

const UP = new THREE.Vector3(0, 1, 0);

/** The heights of the lowest and highest faces of `crown` straight above (x, z), or null if none is over it. */
export function undersideAt(crown: THREE.BufferGeometry, x: number, z: number): [number, number] | null {
  const g = crown.index ? crown.toNonIndexed() : crown;
  const pos = g.getAttribute('position');
  const ray = new THREE.Ray(new THREE.Vector3(x, -100, z), UP);
  const [a, b, c, hit] = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  let [low, high] = [Infinity, -Infinity];
  for (let i = 0; i + 2 < pos.count; i += 3) {
    a.fromBufferAttribute(pos, i);
    b.fromBufferAttribute(pos, i + 1);
    c.fromBufferAttribute(pos, i + 2);
    if (!ray.intersectTriangle(a, b, c, false, hit)) continue;
    low = Math.min(low, hit.y);
    high = Math.max(high, hit.y);
  }
  if (g !== crown) g.dispose();
  return low <= high ? [low, high] : null;
}

/**
 * Where a strand hung at (x, z) under `crown` starts: the point drawn in toward (cx, cz) until the crown is over it, and its top
 * `embed` metres up inside the crown's underside where the crown is at least twice that thick, so it shows through neither face;
 * null if no point on the way in is under so much of the crown.
 */
export function hangFrom(crown: THREE.BufferGeometry, x: number, z: number, cx: number, cz: number, embed: number): [number, number, number] | null {
  for (let s = 1; s > 0.15; s -= 0.1) {
    const [px, pz] = [cx + (x - cx) * s, cz + (z - cz) * s];
    const span = undersideAt(crown, px, pz);
    if (span && span[1] - span[0] >= embed * 2) return [px, span[0] + embed, pz];
  }
  return null;
}
