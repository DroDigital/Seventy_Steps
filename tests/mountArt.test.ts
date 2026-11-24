import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { MOUNT_IDS } from '../src/data/mounts';
import { buildFigure } from '../src/render/figures';
import { createCarDynamics, stepCarDynamics } from '../src/render/automobileMotion';
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
  it('keeps each appearance inside its geometry budget, with fire on the spectral horses only', () => {
    const limit = { grey: 34, chariot: 42, automobile: 15 } as const;
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
        const at = (name: string): THREE.Vector3 => visual.root.getObjectByName(name)!.getWorldPosition(new THREE.Vector3());
        expect(at('head').z).toBeGreaterThan(at('tail').z + 1.8);
        expect(at('draft-horse').x).toBe(0);
        const bit = at('draft-bit');
        expect(bit.z).toBeGreaterThan(3.8);
        expect(bit.y).toBeGreaterThan(1.2);
        expect(bit.y).toBeLessThan(2.3);
        const horse = new THREE.Box3().setFromObject(visual.root.getObjectByName('draft-horse')!);
        expect(horse.max.y).toBeGreaterThan(2.1); // a draft horse stands sixteen hands, its head up
        expect(horse.max.y).toBeLessThan(2.6);
        expect(horse.min.y).toBeGreaterThan(-0.02);
        expect(horse.max.x - horse.min.x).toBeLessThan(1.3);
        const lumaOf = (mesh: THREE.Mesh): number[] => {
          const col = mesh.geometry.getAttribute('color');
          return Array.from({ length: col.count }, (_, i) => 0.2126 * col.getX(i) + 0.7152 * col.getY(i) + 0.0722 * col.getZ(i));
        };
        const bodyMesh = visual.root.getObjectByName('draft-body') as THREE.Mesh;
        const body = lumaOf(bodyMesh);
        expect(Math.max(...body) - Math.min(...body)).toBeGreaterThan(0.12); // a coat, not a flat colour
        expect((bodyMesh.material as THREE.ShaderMaterial).uniforms.uMap.value.name.startsWith('hide')).toBe(true);
        const mane = lumaOf(visual.root.getObjectByName('draft-neck') as THREE.Mesh);
        expect(Math.max(...mane)).toBeGreaterThan(Math.min(...body) + 0.35); // a pale mane on the chestnut, which reads in the dark
        const face = lumaOf(visual.root.getObjectByName('draft-head') as THREE.Mesh);
        expect(Math.max(...face)).toBeGreaterThan(0.7); // the blaze
        for (const part of ['draft-eyes', 'draft-harness', 'draft-bridle', 'draft-tail']) expect(visual.root.getObjectByName(part), part).toBeTruthy();
        expect(visual.root.getObjectsByProperty('name', 'ear')).toHaveLength(2);
        const hoofs = ['leg-front-left', 'leg-front-right', 'leg-back-left', 'leg-back-right'].map(n => visual.root.getObjectByName(`${n}-hoof`)!);
        const bottoms = (): number[] => hoofs.map(h => new THREE.Box3().setFromObject(h).min.y);
        for (const y of bottoms()) expect(Math.abs(y)).toBeLessThan(0.02); // all four on the ground at rest
        const leg = visual.root.getObjectByName('leg-front-left')!;
        const rest = leg.quaternion.toArray();
        for (const speed of [1.5, 5.5, 11, 18]) for (let i = 0; i < 40; i++) {
          visual.update({ time: i / 60, dt: 1 / 60, speed, turn: 0.2, cycle: (i / 60) * speed / 4.4 });
          visual.root.updateMatrixWorld(true);
          const low = bottoms();
          expect(Math.min(...low), `${speed} m/s`).toBeGreaterThan(-0.03); // never through the ground
          expect(Math.max(...low), `${speed} m/s`).toBeLessThan(0.4);
          if (speed < 4) expect(Math.min(...low), `${speed} m/s`).toBeLessThan(0.02); // a walk always has a foot down
        }
        expect(leg.quaternion.toArray()).not.toEqual(rest);
        visual.root.traverse(o => { expect(o.matrixWorld.elements.every(Number.isFinite)).toBe(true); });
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
    for (const id of MOUNT_IDS) {
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

describe('the Brassbound Motor Car (circa-1914 touring car art & mechanical motion)', () => {
  it('builds every articulated mechanical assembly and animates them cleanly through idle, acceleration, cornering and braking', () => {
    const visual = createMount('automobile');
    for (const part of [
      'brass-era-touring-automobile',
      'automobile-hood',
      'automobile-cooling-fan',
      'automobile-canopy',
      'automobile-steering-wheel',
      'automobile-shifter',
      'automobile-tie-rod',
      'automobile-headlight-beams',
      'automobile-lamp-halos',
    ]) {
      expect(visual.root.getObjectByName(part), part).toBeTruthy();
    }
    const fan = visual.root.getObjectByName('automobile-cooling-fan')!;
    const shifter = visual.root.getObjectByName('automobile-shifter')!;
    const tieRod = visual.root.getObjectByName('automobile-tie-rod')!;
    const steering = visual.root.getObjectByName('automobile-steering-wheel')!;
    visual.update({ time: 0, dt: 0, speed: 0, turn: 0 });
    const fan0 = fan.rotation.z;
    const shifter0 = shifter.rotation.x;
    const tie0 = tieRod.position.x;
    const wheel0 = steering.rotation.z;
    // Accelerate through the gears while turning
    for (let i = 1; i <= 90; i++) {
      const speed = (i / 90) * 14;
      visual.update({ time: i / 60, dt: 1 / 60, speed, turn: 0.7, cycle: i * 0.04 });
    }
    visual.root.updateMatrixWorld(true);
    expect(fan.rotation.z).not.toBe(fan0);
    expect(shifter.rotation.x).not.toBeCloseTo(shifter0, 2);
    expect(Math.abs(tieRod.position.x - tie0)).toBeGreaterThan(0.01);
    expect(Math.abs(steering.rotation.z - wheel0)).toBeGreaterThan(0.2);
    visual.root.traverse(o => { expect(o.matrixWorld.elements.every(Number.isFinite)).toBe(true); });
    visual.dispose();
  });

  it('squats on launch, dives under braking, rolls in turns, shifts gear cleanly and brightens the ruby tail-lamp on brakes', () => {
    const dyn = createCarDynamics();
    let t = 0;
    let dist = 0;
    // Hard launch from 0 -> 12 m/s
    let pose = stepCarDynamics(dyn, { time: 0, dt: 0, speed: 0, steer: 0, distance: 0 });
    const idleTail = pose.tailGain;
    for (let i = 1; i <= 45; i++) {
      const speed = (i / 45) * 12;
      t += 1 / 60;
      dist += speed / 60;
      pose = stepCarDynamics(dyn, { time: t, dt: 1 / 60, speed, steer: 0, distance: dist });
    }
    expect(pose.pitch).toBeLessThan(-0.005); // nose lifts (squat) under acceleration
    expect(pose.gear).toBeGreaterThanOrEqual(2);
    expect(pose.fanAngle).toBeGreaterThan(0);

    // Steady high-speed left cornering rolls the body outward (-z roll)
    for (let i = 0; i < 45; i++) {
      t += 1 / 60;
      dist += 12 / 60;
      pose = stepCarDynamics(dyn, { time: t, dt: 1 / 60, speed: 12, steer: 1, distance: dist });
    }
    expect(pose.roll).toBeLessThan(-0.02);

    // Hard braking from 12 -> 2 m/s dives the nose (+x pitch) and illuminates the ruby brake lamp
    let peakBrake = 0;
    let peakTail = 0;
    for (let i = 1; i <= 40; i++) {
      const speed = 12 - (i / 40) * 10;
      t += 1 / 60;
      dist += speed / 60;
      pose = stepCarDynamics(dyn, { time: t, dt: 1 / 60, speed, steer: 0, distance: dist });
      peakBrake = Math.max(peakBrake, pose.brake);
      peakTail = Math.max(peakTail, pose.tailGain);
    }
    expect(pose.pitch).toBeGreaterThan(0.015); // nose dips under braking
    expect(peakBrake).toBeGreaterThan(0.5);
    expect(peakTail).toBeGreaterThan(idleTail * 1.4);
  });
});

describe('the draft horse stands in four white socks (round 57)', () => {
  it('every leg has its sock, and the foot of each is painted white to the ground', async () => {
    const { LEGS, cannonBone, hoofOf } = await import('../src/render/horseLegs');
    expect(LEGS.map((l) => l.sock > 0.1)).toEqual([true, true, true, true]); // the right fore had none: one dark foot of four
    expect(new Set(LEGS.map((l) => l.sock)).size).toBe(4); // no two socks the same height
    const lowest = (geo: THREE.BufferGeometry): number => { // the average lightness of the lowest vertices (the legs hang down the -y axis)
      const [pos, col] = [geo.getAttribute('position'), geo.getAttribute('color')];
      let low = Infinity;
      for (let i = 0; i < pos.count; i++) low = Math.min(low, pos.getY(i));
      let [sum, n] = [0, 0];
      for (let i = 0; i < pos.count; i++) if (pos.getY(i) < low + 0.03) { sum += (col.getX(i) + col.getY(i) + col.getZ(i)) / 3; n++; }
      return sum / n;
    };
    const lights = LEGS.map((plan) => lowest(cannonBone(plan)));
    for (const l of lights) expect(l).toBeGreaterThan(0.6);
    expect(Math.max(...lights) - Math.min(...lights)).toBeLessThan(0.2); // as white as one another
    expect(hoofOf(LEGS[1]).getAttribute('color').count).toBe(hoofOf(LEGS[0]).getAttribute('color').count);
  });
});
