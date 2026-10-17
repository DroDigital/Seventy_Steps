import { describe, expect, it } from 'vitest';
import type * as THREE from 'three';
import { GROUND_CONTACT } from '../src/data/fxTuning';
import { baseCoverJob } from '../src/render/baseCover';
import type { PropMat } from '../src/render/propShapes';
import { chunkContent } from '../src/world/chunks';
import { contactsOf, edgeDistance } from '../src/world/groundContact';

type Cover = Partial<Record<PropMat, THREE.BufferGeometry>>;
const build = (cx: number, cz: number): Cover => {
  const c = chunkContent(cx, cz);
  let out: Cover = {};
  const job = baseCoverJob(c.props, c.region!, c.roads, (v) => (out = v));
  while (!job.next().done);
  return out;
};

/** A chunk of open country with trees and stones in it. */
function country(): { cx: number; cz: number } {
  for (let cz = 3; cz < 12; cz++) {
    for (let cx = 0; cx < 12; cx++) {
      const c = chunkContent(cx, cz);
      if (c.region && c.props.filter((p) => p.kind === 'tree' || p.kind === 'pine').length >= 6 && c.props.some((p) => p.kind === 'rock')) return { cx, cz };
    }
  }
  throw new Error('no country chunk');
}

describe('the plants and roots where things meet the ground (round 54)', () => {
  const { cx, cz } = country();
  const cover = build(cx, cz);
  const props = chunkContent(cx, cz).props;

  it('stands plants and pebbles about the bases, and roots about the trees', () => {
    expect(cover.leaf?.getAttribute('position').count ?? 0).toBeGreaterThan(100);
    expect(cover.wood?.getAttribute('position').count ?? 0).toBeGreaterThan(0);
    const trees = props.filter((p) => p.kind === 'tree' || p.kind === 'pine' || p.kind === 'stump').length;
    const roots = (cover.wood?.getAttribute('position').count ?? 0) / 18; // three triangles, both faces, to a root
    expect(roots).toBeGreaterThanOrEqual(trees * GROUND_CONTACT.cover.roots * 0.5);
    expect(cover.wood?.getAttribute('aSway')).toBeDefined(); // the wood material bends, so what merges with it must carry the attribute
    expect(cover.leaf?.getAttribute('aSway')).toBeDefined();
  });

  it('keeps every plant within reach of some footprint: it is about the bases, not a scatter', () => {
    const cs = contactsOf(props);
    const pos = cover.leaf!.getAttribute('position');
    let far = 0;
    for (let i = 0; i < pos.count; i += 6) { // one vertex of each triangle's pair of faces
      const d = Math.min(...cs.map((c) => edgeDistance(c, pos.getX(i), pos.getZ(i))));
      if (d > GROUND_CONTACT.reachMax + 1.6) far++; // (a tall stem leans out a little; a prop of another chunk may be the one it stands by)
    }
    expect(far / (pos.count / 6)).toBeLessThan(0.1);
  });

  it('is the same each time it is made', () => {
    const again = build(cx, cz);
    expect(again.leaf!.getAttribute('position').count).toBe(cover.leaf!.getAttribute('position').count);
    expect(again.wood!.getAttribute('position').array).toEqual(cover.wood!.getAttribute('position').array);
  });
});
