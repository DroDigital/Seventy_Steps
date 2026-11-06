import type * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { dressing } from '../src/render/dungeonDressing';
import { KITS } from '../src/data/kits';
import { worldLayout } from '../src/world/placements';

const dress = (d: ReturnType<typeof worldLayout>['dungeons'][number]) => dressing(d.layout, () => [0.8, 0.8, 0.8], { x: 0, z: 0 }, []);
type Dressed = ReturnType<typeof dress>[number];
const solid = (d: ReturnType<typeof worldLayout>['dungeons'][number]): (Dressed & { geo: THREE.BufferGeometry })[] => dress(d).filter((p): p is Dressed & { geo: THREE.BufferGeometry } => !!p.geo);

describe('the dressing of the dungeons (round 30)', () => {
  it('every dungeon is dressed the same way twice, in numbers only, and every halls-and-roofs kit adds something', () => {
    let pieces = 0;
    for (const d of worldLayout().dungeons) {
      const [a, b] = [solid(d), solid(d)];
      expect(a.map((p) => `${p.kind}${p.geo.getAttribute('position').count}`), d.layout.def.id).toEqual(b.map((p) => `${p.kind}${p.geo.getAttribute('position').count}`));
      for (const p of a) {
        for (const v of p.geo.getAttribute('position').array) expect(Number.isFinite(v)).toBe(true);
        expect(p.geo.getAttribute('color'), `${d.layout.def.id} ${p.kind}`).toBeDefined();
        expect(p.geo.getAttribute('uv'), `${d.layout.def.id} ${p.kind}`).toBeDefined();
      }
      pieces += a.length;
    }
    expect(pieces).toBeGreaterThan(100);
  }, 60_000);

  it('braziers are fires, one flame to each (the pixel flame of worldLights: no cone of their own, round 87), and only where the kit keeps flames', () => {
    let fires = 0;
    for (const d of worldLayout().dungeons) {
      for (const p of dress(d)) {
        if (!p.light) continue;
        fires++;
        expect(p.geo, `${d.layout.def.id} brazier`).toBeUndefined();
        expect(p.light.kind).toBe('fire');
        expect(p.kit.flames).toBeGreaterThanOrEqual(0.3);
        expect(Object.values(KITS)).toContain(p.kit);
      }
    }
    expect(fires).toBeGreaterThan(0);
  }, 60_000);
});
