import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { MOUNT_IDS } from '../src/data/mounts';
import { buildFigure } from '../src/render/figures';
import { solveLeg } from '../src/render/horseGait';
import { createMount, poseMountedRider, type MountVisual } from '../src/render/mounts';
import { CASTER } from '../src/render/moonShadow';
import { WORLD_VERT } from '../src/render/shaders/world';
import { worldUniforms } from '../src/render/worldMaterial';

function meshes(visual: MountVisual): THREE.Mesh[] {
  const result: THREE.Mesh[] = [];
  visual.root.traverse(o => { if (o instanceof THREE.Mesh) result.push(o); });
  return result;
}

describe('carriage horse gait', () => {
  it('stands straight and folds the knee the way that leg bends', () => {
    const straight = solveLeg(0, -1.04, 0.46, 0.58, -1);
    expect(straight.upper).toBeCloseTo(0, 2);
    expect(straight.lower).toBeCloseTo(0, 2);
    expect(straight.hy).toBeCloseTo(-1.04, 2);
    const fore = solveLeg(0.2, -0.72, 0.46, 0.58, -1);
    expect(fore.kz).toBeGreaterThan(fore.hz);
    const hind = solveLeg(0.2, -0.78, 0.48, 0.62, 1);
    expect(hind.kz).toBeLessThan(0);
  });
});

describe('procedural mount art', () => {
  it('keeps each appearance inside its geometry budget, with fire on the spectral horses only', () => {
    const limit = { grey: 16, chariot: 42, automobile: 12 } as const;
    for (const id of MOUNT_IDS) {
      const visual = createMount(id);
      const horses: THREE.Object3D[] = [];
      const flames: THREE.Object3D[] = [];
      visual.root.traverse(o => {
        if (o.name === 'spectral-skeleton-horse') horses.push(o);
        if (o.name === 'spectral-flame' || o.name === 'spectral-flame-neck') flames.push(o);
      });
      expect(horses).toHaveLength(id === 'chariot' ? 2 : 0);
      expect(flames).toHaveLength(id === 'chariot' ? 4 : 0);
      if (id === 'chariot') expect(horses.map(h => h.position.x).sort((a, b) => a - b)).toEqual([-0.67, 0.67]);
      for (const flame of flames) {
        let onHorse = false;
        for (let p: THREE.Object3D | null = flame; p; p = p.parent) if (p.name === 'spectral-skeleton-horse') onHorse = true;
        expect(onHorse).toBe(true);
        expect(flame.parent).not.toBe(visual.root);
      }
      if (id === 'grey') {
        expect(visual.root.getObjectByName('plain-chariot')).toBeTruthy();
        expect(visual.root.getObjectByName('draft-horse')).toBeTruthy();
        expect(visual.root.getObjectByName('gothic-mourning-coach')).toBeFalsy();
        expect(visual.root.getObjectByName('borrowed-grey')).toBeFalsy();
        expect(visual.root.getObjectByName('mount-breath')).toBeFalsy();
        expect(visual.seat.name).toBe('rider-seat-feet-origin');
        expect(visual.seat.position.y).toBeCloseTo(0.79);
        expect(visual.seat.position.z).toBeCloseTo(0.08);
        visual.update({ time: 0, dt: 0, speed: 0 });
        visual.root.updateMatrixWorld(true);
        const head = visual.root.getObjectByName('head')!.getWorldPosition(new THREE.Vector3());
        const tail = visual.root.getObjectByName('tail')!.getWorldPosition(new THREE.Vector3());
        const bit = visual.root.getObjectByName('draft-bit')!.getWorldPosition(new THREE.Vector3());
        expect(head.z).toBeGreaterThan(tail.z + 0.8);
        expect(visual.root.getObjectByName('draft-horse')!.position.x).toBe(0);
        expect(bit.z).toBeGreaterThan(2.5);
        expect(bit.y).toBeGreaterThan(1);
        expect(bit.y).toBeLessThan(2.4);
        const bodyMesh = visual.root.getObjectByName('draft-body') as THREE.Mesh;
        const col = bodyMesh.geometry.getAttribute('color');
        const uv = bodyMesh.geometry.getAttribute('uv');
        const nrm = bodyMesh.geometry.getAttribute('normal');
        const pos = bodyMesh.geometry.getAttribute('position');
        let c0 = Infinity, c1 = -Infinity, span = 0, top = -Infinity, topN = 0;
        for (let i = 0; i < col.count; i++) {
          const y = 0.2126 * col.getX(i) + 0.7152 * col.getY(i) + 0.0722 * col.getZ(i);
          c0 = Math.min(c0, y); c1 = Math.max(c1, y);
          span = Math.max(span, Math.abs(uv.getX(i)), Math.abs(uv.getY(i)));
          if (pos.getY(i) > top) { top = pos.getY(i); topN = nrm.getY(i); }
        }
        expect(c1 - c0).toBeGreaterThan(0.12);
        expect(span).toBeGreaterThan(2);
        expect(topN).toBeGreaterThan(0.4);
        expect((bodyMesh.material as THREE.ShaderMaterial).uniforms.uMap.value.name.startsWith('hide')).toBe(true);
        const leg = visual.root.getObjectByName('leg-front-left')!;
        const hoof = visual.root.getObjectByName('hoof-front-left')!;
        const knee = visual.root.getObjectByName('knee-front-left')!;
        const legMesh = leg.children.find((c): c is THREE.Mesh => c instanceof THREE.Mesh)!;
        const depth = (): number => {
          const p = legMesh.geometry.getAttribute('position');
          let m = Infinity;
          for (let i = 0; i < p.count; i++) m = Math.min(m, p.getY(i));
          return m;
        };
        const lead = (): number => {
          const p = legMesh.geometry.getAttribute('position');
          let m = -Infinity;
          for (let i = 0; i < p.count; i++) if (p.getY(i) > -0.75) m = Math.max(m, p.getZ(i));
          return m;
        };
        const planted = depth();
        let low = Infinity, high = -Infinity, lifted = planted, kneeLead = -Infinity, meshLead = -Infinity;
        for (let i = 0; i < 40; i++) {
          visual.update({ time: i / 20, dt: 0.05, speed: 12, turn: 0 });
          visual.root.updateMatrixWorld(true);
          const hy = hoof.getWorldPosition(new THREE.Vector3()).y;
          low = Math.min(low, hy); high = Math.max(high, hy);
          lifted = Math.max(lifted, depth());
          meshLead = Math.max(meshLead, lead());
          kneeLead = Math.max(kneeLead, knee.getWorldPosition(new THREE.Vector3()).z - leg.getWorldPosition(new THREE.Vector3()).z);
          visual.root.traverse(o => { expect(o.matrixWorld.elements.every(Number.isFinite)).toBe(true); });
        }
        expect(low).toBeLessThan(0.05);
        expect(low).toBeGreaterThan(-0.08);
        expect(high - low).toBeGreaterThan(0.1);
        expect(lifted).toBeGreaterThan(planted + 0.08);
        expect(kneeLead).toBeGreaterThan(0.05);
        expect(meshLead).toBeGreaterThan(0.2);
      }
      const bodies = meshes(visual);
      expect(bodies.length).toBeLessThanOrEqual(limit[id]);
      const triangles = bodies.reduce((sum, m) => sum + (m.geometry.index?.count ?? m.geometry.getAttribute('position').count) / 3 * (m instanceof THREE.InstancedMesh ? m.count : 1), 0);
      expect(triangles).toBeLessThanOrEqual(id === 'automobile' ? 15000 : 30000);
      visual.dispose();
    }
  });

  it('stirs the hoof fire with the gait', () => {
    const visual = createMount('chariot');
    const flame = visual.root.getObjectByName('spectral-flame') as THREE.Mesh;
    visual.update({ time: 0, dt: 0, speed: 0 });
    const rest = Array.from(flame.geometry.getAttribute('position').array as ArrayLike<number>);
    visual.update({ time: 1, dt: 0.1, speed: 12, turn: 0.2 });
    expect(Array.from(flame.geometry.getAttribute('position').array as ArrayLike<number>)).not.toEqual(rest);
    visual.dispose();
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
    const grey = createMount('grey');
    expect(visual.materials.some(m => other.materials.includes(m))).toBe(false);
    expect(visual.materials.some(m => grey.materials.includes(m))).toBe(false);
    visual.dispose(); other.dispose(); grey.dispose();
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
    for (const id of MOUNT_IDS) {
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
    for (const id of ['chariot', 'grey'] as const) {
      const visual = createMount(id), scene = new THREE.Scene(); scene.add(visual.root);
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
    }
  });
});
