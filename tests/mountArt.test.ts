import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { buildFigure } from '../src/render/figures';
import { createMount, poseMountedRider, type MountVisual } from '../src/render/mounts';
import { CASTER } from '../src/render/moonShadow';
import { WORLD_VERT } from '../src/render/shaders/world';
import { worldUniforms } from '../src/render/worldMaterial';

function meshes(visual: MountVisual): THREE.Mesh[] {
  const result: THREE.Mesh[] = [];
  visual.root.traverse(o => { if (o instanceof THREE.Mesh) result.push(o); });
  return result;
}

describe('procedural mount art', () => {
  it('draws exactly two skeletal horses and keeps the coach and car within their geometry budgets', () => {
    for (const id of ['chariot', 'automobile'] as const) {
      const visual = createMount(id);
      const horses: THREE.Object3D[] = [];
      visual.root.traverse(o => { if (o.name === 'spectral-skeleton-horse') horses.push(o); });
      expect(horses).toHaveLength(id === 'chariot' ? 2 : 0);
      if (id === 'chariot') expect(horses.map(h => h.position.x)).toEqual([-0.67, 0.67]);
      const bodies = meshes(visual);
      expect(bodies.length).toBeLessThanOrEqual(id === 'chariot' ? 35 : 12);
      const triangles = bodies.reduce((sum, m) => sum + (m.geometry.index?.count ?? m.geometry.getAttribute('position').count) / 3 * (m instanceof THREE.InstancedMesh ? m.count : 1), 0);
      expect(triangles).toBeLessThanOrEqual(id === 'chariot' ? 30000 : 15000);
      visual.dispose();
    }
  });

  it('transforms instanced limb vertices before world lighting and excludes their unsupported depth shadows', () => {
    const visual = createMount('chariot');
    const instances = meshes(visual).filter((m): m is THREE.InstancedMesh => m instanceof THREE.InstancedMesh);
    expect(instances).toHaveLength(4);
    for (const limb of instances) {
      const material = limb.material as THREE.ShaderMaterial;
      expect(material.vertexShader).toContain('mountPosition = (instanceMatrix * vec4(position, 1.0)).xyz');
      expect(material.vertexShader).toContain('mat3(modelMatrix) * mountNormal');
      expect(material.uniforms.uTime).toBe(worldUniforms.uTime);
      expect(limb.layers.isEnabled(CASTER)).toBe(false);
    }
    const ordinary = meshes(visual).find(m => !(m instanceof THREE.InstancedMesh) && !(m.material as THREE.Material).transparent)!;
    expect(ordinary.layers.isEnabled(CASTER)).toBe(true);
    expect(WORLD_VERT).not.toContain('mountPosition');
    const other = createMount('automobile');
    expect(visual.materials.some(m => other.materials.includes(m))).toBe(false);
    visual.dispose(); other.dispose();
  });

  it('keeps ground-following rest, cruise and gallop poses finite and actually articulates limbs', () => {
    const visual = createMount('chariot');
    const bone = meshes(visual).find(m => m instanceof THREE.InstancedMesh) as THREE.InstancedMesh;
    visual.update({ time: 0, dt: 0, speed: 0 });
    const rest = Array.from(bone.instanceMatrix.array);
    for (const speed of [0, 3, 11, 18]) for (let i = 0; i < 16; i++) {
      visual.update({ time: i / 10, dt: 0.1, speed, turn: Math.sin(i), ground: (x, z) => Math.sin(x * 0.6 + z * 0.2) * 0.17 });
      visual.root.updateMatrixWorld(true);
      visual.root.traverse(o => {
        expect(o.matrixWorld.elements.every(Number.isFinite)).toBe(true);
        if (o instanceof THREE.InstancedMesh) expect(Array.from(o.instanceMatrix.array).every(Number.isFinite)).toBe(true);
      });
    }
    expect(Array.from(bone.instanceMatrix.array)).not.toEqual(rest);
    visual.dispose();
  });

  it('seats the driver with forward knees, planted feet and hands reaching the controls', () => {
    for (const id of ['chariot', 'automobile'] as const) {
      const visual = createMount(id), rider = buildFigure('player');
      visual.seat.add(rider.root); visual.update({ time: 1, dt: 0, speed: 0 });
      poseMountedRider(rider, id, 1, 11, 0.4); visual.root.updateMatrixWorld(true);
      const pelvis = rider.body.getWorldPosition(new THREE.Vector3());
      for (const [knee, foot, hand] of [[rider.kneeR, rider.footR, rider.handR], [rider.kneeL, rider.footL, rider.handL]]) {
        expect(knee.getWorldPosition(new THREE.Vector3()).z).toBeGreaterThan(pelvis.z + 0.3);
        expect(foot.getWorldPosition(new THREE.Vector3()).y).toBeGreaterThan(0.45);
        expect(hand.getWorldPosition(new THREE.Vector3()).z).toBeGreaterThan(pelvis.z + 0.25);
        expect(hand.getWorldPosition(new THREE.Vector3()).y).toBeGreaterThan(pelvis.y);
      }
      expect(Object.values(rider.arms!).every(weapon => !weapon.visible)).toBe(true);
      rider.root.removeFromParent(); visual.dispose();
    }
  });

  it('releases every owned mesh and shader without disposing shared world textures', () => {
    const visual = createMount('chariot'), scene = new THREE.Scene(); scene.add(visual.root);
    const geoCount = new Map<THREE.BufferGeometry, number>(), matCount = new Map<THREE.Material, number>();
    for (const mesh of meshes(visual)) {
      geoCount.set(mesh.geometry, 0);
      mesh.geometry.addEventListener('dispose', () => geoCount.set(mesh.geometry, geoCount.get(mesh.geometry)! + 1));
    }
    for (const material of visual.materials) {
      matCount.set(material, 0);
      material.addEventListener('dispose', () => matCount.set(material, matCount.get(material)! + 1));
    }
    visual.dispose();
    expect([...geoCount.values()].every(n => n === 1)).toBe(true);
    expect([...matCount.values()].every(n => n === 1)).toBe(true);
    expect(visual.root.parent).toBe(null);
  });
});
