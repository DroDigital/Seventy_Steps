/**
 * The bodies the creatures cast shadows from (round 78; render/creatureCasters.ts): closed and wound outward,
 * so the lantern's map (which draws far faces) and the moon's (depth only) both find them; on the shadow
 * layers alone; sized from the painted figure, capped, shrinking as a picture goes; none far from the
 * investigator.
 */
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { casterBody, createCreatureCasters } from '../src/render/creatureCasters';
import { INSTANCED_POSITION, LANTERN_CASTER } from '../src/render/colliderShadow';
import { FAR_SIDE } from '../src/render/lanternShadow';
import { CASTER } from '../src/render/moonShadow';

function triangles(g: THREE.BufferGeometry): THREE.Vector3[][] {
  const pos = g.getAttribute('position');
  const index = g.getIndex();
  const n = index ? index.count : pos.count;
  const out: THREE.Vector3[][] = [];
  for (let i = 0; i < n; i += 3) out.push([0, 1, 2].map((k) => new THREE.Vector3().fromBufferAttribute(pos, index ? index.getX(i + k) : i + k)));
  return out;
}

describe('a creature\'s caster body', () => {
  const g = casterBody();
  const tris = triangles(g).filter(([a, b, c]) => new THREE.Triangle(a, b, c).getArea() > 1e-9);

  it('is one metre tall and one wide at its broadest, standing on y = 0', () => {
    g.computeBoundingBox();
    const box = g.boundingBox!;
    expect(box.min.y).toBeCloseTo(0, 5);
    expect(box.max.y).toBeCloseTo(1, 5);
    expect(Math.max(box.max.x, box.max.z)).toBeCloseTo(1, 1);
  });

  it('is wound outward: its volume, by the divergence theorem, is positive, and its faces look away from the middle', () => {
    let volume = 0;
    for (const [a, b, c] of tris) volume += a.dot(new THREE.Vector3().crossVectors(b, c)) / 6;
    expect(volume).toBeGreaterThan(1);
    let outward = 0;
    for (const [a, b, c] of tris) {
      const normal = new THREE.Triangle(a, b, c).getNormal(new THREE.Vector3());
      const centre = new THREE.Vector3().add(a).add(b).add(c).divideScalar(3);
      const out = centre.clone().sub(new THREE.Vector3(0, 0.45, 0));
      if (normal.dot(out) > 0) outward++;
    }
    expect(outward / tris.length).toBeGreaterThan(0.95);
  });

  it('is closed: every edge belongs to two faces, once the points the lathe repeats are one', () => {
    const snap = (n: number): number => Math.round(n * 1e4) / 1e4 + 0; // (+ 0: a lathe's seam is -0 as well as 0)
    const key = (v: THREE.Vector3): string => `${snap(v.x)},${snap(v.y)},${snap(v.z)}`;
    const edges = new Map<string, number>();
    for (const t of tris) {
      for (let i = 0; i < 3; i++) {
        const [p, q] = [key(t[i]), key(t[(i + 1) % 3])].sort();
        if (p === q) continue;
        edges.set(`${p}|${q}`, (edges.get(`${p}|${q}`) ?? 0) + 1);
      }
    }
    for (const count of edges.values()) expect(count % 2).toBe(0);
  });
});

describe('the shadow passes\' own materials', () => {
  it('place an instanced body by its instance matrix', () => {
    expect(INSTANCED_POSITION).toMatch(/#ifdef USE_INSTANCING\s+p = instanceMatrix \* p;\s+#endif/);
    expect(FAR_SIDE.vertexShader).toBe(INSTANCED_POSITION);
    expect(FAR_SIDE.side).toBe(THREE.BackSide);
  });
});

describe('the creatures\' casters in a scene', () => {
  const scene = new THREE.Scene();
  const casters = createCreatureCasters(scene);
  const from = { x: 0, z: 0 };
  const sizeOf = (i: number): THREE.Vector3 => {
    const m = new THREE.Matrix4();
    casters.mesh.getMatrixAt(i, m);
    return new THREE.Vector3().setFromMatrixScale(m);
  };

  it('are on the moon\'s and the lantern\'s layers, never the investigator\'s camera\'s', () => {
    const moon = new THREE.Layers();
    moon.set(CASTER);
    expect(casters.mesh.layers.test(moon)).toBe(true);
    const lantern = new THREE.Layers();
    lantern.set(LANTERN_CASTER);
    expect(casters.mesh.layers.test(lantern)).toBe(true);
    const main = new THREE.Layers();
    main.set(0);
    expect(casters.mesh.layers.test(main)).toBe(false);
  });

  it('take the painted breadth and height, and cap them so a colossus does not black out its arena', () => {
    casters.begin();
    casters.put(2, 0, 2, 1.5, 1.8, 1, from);
    casters.put(4, 0, 4, 30, 40, 1, from);
    casters.end();
    expect(casters.mesh.count).toBe(2);
    const [a, b] = [sizeOf(0), sizeOf(1)];
    expect(a.x).toBeCloseTo(0.48, 2);
    expect(a.y).toBeCloseTo(1.62, 2);
    expect(b.x).toBeLessThanOrEqual(2.6 + 1e-6);
    expect(b.y).toBeLessThanOrEqual(6 + 1e-6);
  });

  it('shrink as a picture goes, vanish when it is gone, and leave out what is far away or not there', () => {
    casters.begin();
    casters.put(1, 0, 1, 2, 2, 1, from);
    casters.put(1, 0, 1, 2, 2, 0.5, from);
    casters.put(1, 0, 1, 2, 2, 0, from);
    casters.put(500, 0, 0, 2, 2, 1, from);
    casters.end();
    expect(casters.mesh.count).toBe(2);
    expect(sizeOf(1).y).toBeCloseTo(sizeOf(0).y / 2, 5);
  });

  it('hold no more than their capacity, and none at all after a frame with none', () => {
    casters.begin();
    for (let i = 0; i < 200; i++) casters.put(i * 0.1, 0, 0, 1, 1, 1, from);
    casters.end();
    expect(casters.mesh.count).toBeLessThanOrEqual(64);
    casters.begin();
    casters.end();
    expect(casters.mesh.count).toBe(0);
  });
});
