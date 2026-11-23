/**
 * Round 116, the grass at the investigator's feet (render/nearGrass.ts): thick where the realm grows it and none where it does not, still in
 * the world as they walk (a cell's clump is its own, made again only when the cell comes back into the square), off the roads, the sites
 * and what stands; and the world shader places a mesh's instances only for those that ask (the near field, a flask in flight), leaving a
 * horse's instanced bones to the patch that places their own.
 */
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { getRegion } from '../src/data/regions';
import { WORLD } from '../src/data/tuning';
import { createNearGrass, NEAR_GRASS } from '../src/render/nearGrass';
import { WORLD_VERT } from '../src/render/shaders/world';
import { createWorldMaterial } from '../src/render/worldMaterial';
import { createWorldGame } from '../src/systems/game';
import { chunkContent } from '../src/world/chunks';
import { contactsOf, edgeDistance } from '../src/world/groundContact';
import { roadShare } from '../src/world/regionPlan';
import { surface } from '../src/world/terrain';
import { chunkOf } from '../src/world/worldMap';

/** An open spot in the middle of a region's tile (no prop within 6 m). */
function openIn(id: string): { x: number; z: number } {
  const [tx, tz] = getRegion(id)!.area;
  for (let k = 0; k < 200; k++) {
    const [x, z] = [(tx * 8 + 3 + (k % 10) * 0.2) * 64, (tz * 8 + 3 + Math.floor(k / 10) * 0.1) * 64];
    const c = chunkContent(chunkOf(x), chunkOf(z));
    if (c.region?.id === id && !c.props.some((p) => Math.hypot(p.x - x, p.z - z) < 6) && surface(x, z) > WORLD.seaLevel + 1) return { x, z };
  }
  throw new Error(`no open spot in ${id}`);
}

/** The field about `at`, made whole: where each clump stands (none for an empty cell). */
function field(id: string, at = openIn(id), enclosed = false): { clumps: THREE.Vector3[]; mesh: THREE.InstancedMesh; move: (dx: number, dz: number) => THREE.Vector3[] } {
  const g = createWorldGame();
  const tr = g.ecs.c.transform.get(g.player.id)!;
  const place = (x: number, z: number): void => void ([tr.pos.x, tr.pos.z, tr.prev.x, tr.prev.z] = [x, z, x, z]);
  place(at.x, at.z);
  const near = createNearGrass(new THREE.Scene(), g);
  const fill = (): THREE.Vector3[] => {
    for (let i = 0; i < 40; i++) near.update(enclosed);
    const out: THREE.Vector3[] = [];
    const m = new THREE.Matrix4();
    for (let i = 0; i < near.mesh.count; i++) {
      near.mesh.getMatrixAt(i, m);
      if (Math.abs(m.elements[5]) > 1e-6) out.push(new THREE.Vector3().setFromMatrixPosition(m));
    }
    return out;
  };
  return { clumps: fill(), mesh: near.mesh, move: (dx, dz) => (place(at.x + dx, at.z + dz), fill()) };
}

describe('the grass at the investigator\'s feet (render/nearGrass.ts)', () => {
  const vermont = field('vermont');
  const cells = NEAR_GRASS.span * NEAR_GRASS.span;

  it('stands thick in the Vermont woods, thin in the desert, and not at all on the ice', () => {
    expect(vermont.clumps.length).toBeGreaterThan(cells * 0.35);
    const sand = field('pnakotus').clumps.length;
    expect(sand).toBeLessThan(vermont.clumps.length * 0.25);
    expect(field('mountains').clumps.length).toBe(0);
  });

  it('is none under a roof', () => {
    const roofed = field('vermont', openIn('vermont'), true);
    expect(roofed.mesh.visible).toBe(false);
  });

  it('stays where it grew as they walk: the cells still in the square keep their clumps', () => {
    const key = (p: THREE.Vector3): string => `${p.x.toFixed(3)},${p.z.toFixed(3)}`;
    const before = new Set(vermont.clumps.map(key));
    const after = vermont.move(3.2, -2.1);
    const reach = (NEAR_GRASS.span * NEAR_GRASS.cell) / 2 - 1.5;
    const centre = openIn('vermont');
    let kept = 0;
    let shared = 0;
    for (const p of after) {
      if (Math.abs(p.x - centre.x) < reach - 3.2 && Math.abs(p.z - centre.z) < reach - 3.2) { // in both squares
        shared++;
        if (before.has(key(p))) kept++;
      }
    }
    expect(shared).toBeGreaterThan(500);
    expect(kept).toBe(shared);
  });

  it('grows on no road, in no site and in nothing that stands, and never under the sea', () => {
    for (const p of vermont.clumps) {
      const c = chunkContent(chunkOf(p.x), chunkOf(p.z));
      expect(roadShare(c.roads, p.x, p.z)).toBeLessThanOrEqual(0.05);
      expect(contactsOf(c.props).every((k) => edgeDistance(k, p.x, p.z) >= 0.1)).toBe(true);
      expect(p.y).toBeGreaterThan(WORLD.seaLevel - 0.1);
      expect(Math.abs(p.y - (surface(p.x, p.z) - 0.02))).toBeLessThan(1e-3);
    }
  });
});

describe('the world shader places instances only for those that ask (round 116)', () => {
  it('the near field and a flask in flight are placed by their instances; a horse\'s bones keep the text their patch reads', () => {
    expect(WORLD_VERT).toContain('#if defined(USE_INSTANCING) && defined(WORLD_INSTANCED)');
    expect(WORLD_VERT).toContain('writhe(position, normal) : position'); // (render/mountKit.ts replaces these)
    expect(WORLD_VERT).toContain('mat3(modelMatrix) * normal');
    expect(createWorldMaterial({ texture: 'grass', sway: true, field: 17 }).defines).toMatchObject({ NEAR_FIELD: '17.00', WORLD_INSTANCED: '' });
    expect(createWorldMaterial({ texture: 'water', instanced: true }).defines).toHaveProperty('WORLD_INSTANCED');
    expect(createWorldMaterial({ texture: 'cloth' }).defines).not.toHaveProperty('WORLD_INSTANCED');
  });
});
