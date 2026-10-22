import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createWayViews } from '../src/render/wayViews';
import { createWorldGame } from '../src/systems/game';
import { wayRuns } from '../src/systems/ways';
import { worldLayout } from '../src/world/placements';
import { goTo, run } from './worldHelpers';

/** Round 62: the built things of a way are made as the eye nears and put away as it leaves (render/wayViews.ts); put away, they give their buffers back. */
describe("a way's built things, put away", () => {
  it('shows the next candle before any mistake, with pale wax distinct from its iron dish', () => {
    const g = createWorldGame();
    const a = worldLayout().arenas.find((x) => x.bosses[0] === 'black_man')!;
    goTo(g, a.x + a.front.x * (a.radius + 14), a.z + a.front.z * (a.radius + 14));
    run(g, 4);
    const rite = wayRuns(g).find((r) => r.plan.boss === 'black_man')!;
    expect(rite.missed).toBe(0);
    const next = rite.lights[0]!;
    const scene = new THREE.Scene();
    const views = createWayViews(scene, g);
    views.update(new THREE.Vector3(next.x + 8, next.y + 2, next.z), 0, false);
    const halos = scene.children.find((o) => o instanceof THREE.Mesh && o.geometry.getAttribute('aHalo')) as THREE.Mesh<THREE.InstancedBufferGeometry>;
    const at = halos.geometry.getAttribute('aHalo');
    const index = Array.from({ length: halos.geometry.instanceCount }, (_, i) => i).find((i) => Math.hypot(at.getX(i) - next.x, at.getZ(i) - next.z) < 0.01)!;
    expect(index, 'the next unlit candle has a visible beacon').toBeDefined();
    expect(at.getW(index), 'it beckons before the player has made a mistake').toBeGreaterThan(1);
    let wax = false;
    let iron = false;
    for (const group of scene.children.filter((o) => o instanceof THREE.Group)) group.traverse((o) => {
      if (!(o instanceof THREE.Group) || Math.hypot(o.position.x - next.x, o.position.z - next.z) > 0.01) return;
      const color = (o.children[0] as THREE.Mesh).geometry.getAttribute('color');
      for (let i = 0; i < color.count; i++) {
        wax ||= color.getX(i) > 0.8;
        iron ||= color.getX(i) < 0.3;
      }
    });
    expect(wax, 'tallow remains pale enough to see in the dark').toBe(true);
    expect(iron, 'the supporting dish keeps its own color').toBe(true);
  });

  it("give back the geometry and the materials made for them, and keep the views' own for good", () => {
    const g = createWorldGame();
    const a = worldLayout().arenas.find((x) => x.bosses[0] === 'simon_orne')!;
    goTo(g, a.x + a.front.x * (a.radius + 14), a.z + a.front.z * (a.radius + 14));
    run(g, 4);
    expect(wayRuns(g).some((r) => r.plates.length > 0)).toBe(true);
    const scene = new THREE.Scene();
    const views = createWayViews(scene, g);
    const eye = new THREE.Vector3(...(() => { const p = g.ecs.c.transform.get(g.player.id)!.pos; return [p.x, p.y + 2, p.z] as const; })());
    views.update(eye, 0, false);
    const [geos, mats, shared] = [new Set<THREE.BufferGeometry>(), new Set<THREE.Material>(), new Set<THREE.Material>()];
    const groups = scene.children.filter((o): o is THREE.Group => o instanceof THREE.Group);
    expect(groups.length, 'a run is made').toBeGreaterThan(0);
    for (const grp of groups) grp.traverse((o) => o instanceof THREE.Mesh && (geos.add(o.geometry), mats.add(o.material as THREE.Material)));
    expect(geos.size).toBeGreaterThan(0);
    const disposed = { geos: 0, mats: new Set<THREE.Material>() };
    for (const geo of geos) geo.addEventListener('dispose', () => disposed.geos++);
    for (const mat of mats) mat.addEventListener('dispose', () => disposed.mats.add(mat));
    views.update(eye, 1, true); // the camera goes under a roof: every run is put away
    expect(scene.children.some((o) => o instanceof THREE.Group)).toBe(false);
    expect(disposed.geos, 'every geometry of the run').toBe(geos.size);
    expect(disposed.mats.size, 'the glow of each plate is its own').toBeGreaterThan(0);
    for (const mat of mats) if (!disposed.mats.has(mat)) shared.add(mat);
    expect(shared.size, 'the stone and the body are the views\' own, kept for the next run').toBeGreaterThan(0);
  });
});
