/**
 * The blob under every body, and the people among the lantern's shadows (round 81; render/blobShape.ts, shadows.ts, moonShadow.ts,
 * actorViews.ts): the blob as wide as the body is painted and drawn out from the moon, and every person but the investigator, who carries
 * the lantern, standing in the lantern's shadow map as well as the moon's.
 */
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { BLOB } from '../src/data/fxTuning';
import { blobShape } from '../src/render/blobShape';
import { createActorViews } from '../src/render/actorViews';
import { LANTERN_CASTER } from '../src/render/colliderShadow';
import { CASTER, personShadow } from '../src/render/moonShadow';
import { createShadows } from '../src/render/shadows';
import { worldUniforms } from '../src/render/worldMaterial';
import { createWorldGame } from '../src/systems/game';
import { spawnCreature } from '../src/systems/creatures';

describe('the blob shadow', () => {
  it('is as it was where the moon casts none and the body is painted as its capsule', () => {
    const b = blobShape(0.4, undefined, 0, null);
    expect(b.across).toBeCloseTo(0.4 * BLOB.base, 6);
    expect(b.along).toBeCloseTo(b.across, 6);
    expect(b.shift).toBe(0);
    expect(b.alpha).toBeCloseTo(BLOB.dark, 6);
  });

  it('is as wide as a body is painted, up to a limit, and not narrower than its capsule', () => {
    expect(blobShape(1, 3.3, 0, null).across).toBeCloseTo(1 * BLOB.base * 1.65, 6);
    expect(blobShape(1, 30, 0, null).across).toBeCloseTo(1 * BLOB.base * BLOB.grow, 6);
    expect(blobShape(1, 0.5, 0, null).across).toBeCloseTo(1 * BLOB.base, 6);
  });

  it('is drawn out away from the moon, the more the lower it is, and lighter for it', () => {
    const high = blobShape(1, undefined, 0, { x: 0, y: 1, z: 0 });
    expect(high.along).toBeCloseTo(high.across, 6); // overhead: a disc
    const low = blobShape(1, undefined, 0, { x: 0.9, y: 0.3, z: 0 });
    const lower = blobShape(1, undefined, 0, { x: 0.99, y: 0.1, z: 0 });
    expect(low.along).toBeGreaterThan(low.across);
    expect(lower.along).toBeGreaterThanOrEqual(low.along);
    expect(lower.along / lower.across).toBeLessThanOrEqual(BLOB.most + 1e-9);
    expect(low.alpha).toBeLessThan(BLOB.dark);
    expect(Math.sin(low.yaw)).toBeLessThan(-0.9); // the moon is toward +x: the shadow goes toward -x
    expect(low.shift).toBeGreaterThan(0);
  });

  it('is laid under a creature the way shadows.ts is told, and shrinks and fades with a hover', () => {
    const g = createWorldGame();
    const scene = new THREE.Scene();
    const painted = new Map<number, number>();
    const shadows = createShadows(scene, g, painted);
    const batch = scene.children[0] as THREE.InstancedMesh;
    const me = g.ecs.c.transform.get(g.player.id)!.pos;
    const id = spawnCreature(g, 'ghoul', { x: me.x + 4, z: me.z, yaw: 0 })!;
    const at = g.ecs.c.transform.get(id)!.pos;
    worldUniforms.uShadow.value.x = 0;
    shadows.update(1);
    const [m, p, q, sc] = [new THREE.Matrix4(), new THREE.Vector3(), new THREE.Quaternion(), new THREE.Vector3()];
    const find = (): { x: number; sx: number; sz: number } => { // the blob nearest the creature
      let best = { x: 0, sx: 0, sz: 0, d: Infinity };
      for (let i = 0; i < batch.count; i++) {
        batch.getMatrixAt(i, m);
        m.decompose(p, q, sc);
        const d = Math.hypot(p.x - at.x, p.z - at.z);
        if (d < best.d) best = { x: p.x, sx: sc.x, sz: sc.z, d };
      }
      return best;
    };
    const flat = find();
    expect(flat.x).toBeCloseTo(at.x, 4);
    expect(flat.sx).toBeCloseTo(flat.sz, 6);
    worldUniforms.uShadow.value.x = 1;
    worldUniforms.uLightDir.value.set(0.95, 0.25, 0).normalize();
    shadows.update(1);
    const drawn = find();
    expect(drawn.sz).toBeGreaterThan(drawn.sx);
    expect(drawn.x).toBeLessThan(at.x); // away from the moon, which is toward +x
    painted.set(id, 4);
    shadows.update(1);
    expect(find().sx).toBeGreaterThan(drawn.sx);
    worldUniforms.uShadow.value.x = 0;
  });
});

describe('people among the lantern\'s shadows', () => {
  it('stand in the lantern\'s map and the moon\'s, but the one who carries the lantern stands in the moon\'s alone', () => {
    expect(personShadow(0.9).layers.isEnabled(CASTER)).toBe(true);
    expect(personShadow(0.9).layers.isEnabled(LANTERN_CASTER)).toBe(false);
    const lit = personShadow(0.9, true);
    expect(lit.layers.isEnabled(CASTER)).toBe(true);
    expect(lit.layers.isEnabled(LANTERN_CASTER)).toBe(true);
  });

  it('are wound outward, as the lantern\'s far-face map wants', () => {
    const geo = personShadow(0.9, true).geometry;
    const pos = geo.getAttribute('position');
    const index = geo.index!;
    let volume = 0;
    const [a, b, c] = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
    for (let i = 0; i < index.count; i += 3) {
      a.fromBufferAttribute(pos, index.getX(i));
      b.fromBufferAttribute(pos, index.getX(i + 1));
      c.fromBufferAttribute(pos, index.getX(i + 2));
      volume += a.dot(new THREE.Vector3().crossVectors(b, c)) / 6;
    }
    expect(volume).toBeGreaterThan(0.1);
  });

  it('is how the actor views dress them: all but the investigator are in the lantern\'s map', () => {
    const g = createWorldGame();
    const scene = new THREE.Scene();
    const views = createActorViews(scene, g);
    views.update(1, 10, false);
    views.update(1, 10.1, false); // (nobody throws, the merchants and the sleepers included)
    const shadows: THREE.Mesh[] = [];
    scene.traverse((o) => { if (o instanceof THREE.Mesh && o.layers.isEnabled(CASTER)) shadows.push(o); });
    const bare = shadows.filter((m) => !m.layers.isEnabled(LANTERN_CASTER));
    expect(shadows.length).toBeGreaterThan(5);
    expect(bare.length).toBe(1);
    const me = g.ecs.c.transform.get(g.player.id)!.pos;
    const world = bare[0].getWorldPosition(new THREE.Vector3());
    expect(Math.hypot(world.x - me.x, world.z - me.z)).toBeLessThan(0.5);
  });
});
