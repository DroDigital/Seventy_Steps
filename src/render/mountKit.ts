/** Shared, batched procedural coachwork. No model or texture assets. +z is forward. */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { bevel } from './bodyKit';
import { box, tint } from './meshKit';
import { BASE, mixRgb, scaleRgb, type Rgb } from './palette';
import { createWorldMaterial } from './worldMaterial';
import type { TextureKind } from './textures';

export type Point = readonly [number, number, number];
export const MOUNT_COLORS = {
  black: scaleRgb(BASE.charcoal, 1.75), iron: mixRgb(BASE.charcoal, BASE.seaGrey, 0.48),
  trim: scaleRgb(BASE.seaGrey, 1.45), leather: mixRgb(BASE.charcoal, BASE.rust, 0.38),
  brass: scaleRgb(mixRgb(BASE.bone, BASE.rust, 0.36), 1.2),
  bone: scaleRgb(mixRgb(BASE.bone, BASE.seaGrey, 0.16), 1.35),
  wood: mixRgb(BASE.rust, BASE.bone, 0.26), pale: scaleRgb(BASE.bone, 1.3),
};

export function group(parent: THREE.Object3D, x = 0, y = 0, z = 0): THREE.Group {
  const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g;
}
export const panel = (w: number, h: number, d: number, x: number, y: number, z: number, c: Rgb, r = 0.025): THREE.BufferGeometry => bevel(w, h, d, x, y, z, c, r);
export const orb = (r: number, at: Point, c: Rgb): THREE.BufferGeometry => tint(new THREE.SphereGeometry(r, 8, 5).translate(...at), c);
export function rod(a: Point, b: Point, radius: number, c: Rgb, r1 = radius): THREE.BufferGeometry {
  const p = new THREE.Vector3(...a), q = new THREE.Vector3(...b), delta = q.clone().sub(p);
  const g = new THREE.CylinderGeometry(r1, radius, delta.length(), 6);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize()));
  return tint(g.translate(...p.add(q).multiplyScalar(0.5).toArray()), c);
}
export function tube(points: readonly Point[], radius: number, c: Rgb, closed = false): THREE.BufferGeometry {
  return tint(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)), closed), points.length * 3, radius, 4, closed), c);
}
export function ring(radius: number, width: number, at: Point, c: Rgb): THREE.BufferGeometry {
  return tint(new THREE.TorusGeometry(radius, width, 5, 24).rotateY(Math.PI / 2).translate(...at), c);
}

/** Every static assembly is one draw; its colours live on vertices. Materials are shared across joints. */
export class MountBuilder {
  readonly materials: THREE.ShaderMaterial[] = [];
  private cache = new Map<string, THREE.ShaderMaterial>();
  material(texture: TextureKind = 'cloth', emissive = 0): THREE.ShaderMaterial {
    const key = `${texture}:${emissive}`;
    let m = this.cache.get(key);
    if (!m) {
      m = createWorldMaterial({ texture, vertexColors: true, uvScale: [0.45, 0.45], emissive, character: 'player' });
      // The world's shader deliberately handles ordinary meshes only. Mount limb instances apply
      // their rigid transform before the same lighting, fog, snapping and palette treatment.
      m.vertexShader = m.vertexShader.replace('void main() {', `void main() {
        vec3 mountPosition = position; vec3 mountNormal = normal;
        #ifdef USE_INSTANCING
          mountPosition = (instanceMatrix * vec4(position, 1.0)).xyz;
          mat3 im = mat3(instanceMatrix);
          mountNormal = normalize(im * (normal / vec3(dot(im[0], im[0]), dot(im[1], im[1]), dot(im[2], im[2]))));
        #endif`)
        .replace('vLocal = position /', 'vLocal = mountPosition /')
        .replace('writhe(position, normal) : position', 'writhe(mountPosition, mountNormal) : mountPosition')
        .replace('mat3(modelMatrix) * normal', 'mat3(modelMatrix) * mountNormal');
      m.side = THREE.DoubleSide; this.cache.set(key, m); this.materials.push(m);
    }
    return m;
  }
  add(parent: THREE.Object3D, pieces: THREE.BufferGeometry[], texture: TextureKind = 'cloth', emissive = 0): THREE.Mesh {
    const geometry = mergeGeometries(pieces);
    for (const p of pieces) p.dispose();
    const mesh = new THREE.Mesh(geometry, this.material(texture, emissive));
    parent.add(mesh); return mesh;
  }
}

export interface CoachWheel { pivot: THREE.Group; spin: THREE.Group; radius: number; x: number; z: number; steer: boolean }
export function wheel(b: MountBuilder, parent: THREE.Object3D, x: number, z: number, radius: number, automobile: boolean, steer = false): CoachWheel {
  const { black, brass, iron, wood } = MOUNT_COLORS;
  const pivot = group(parent, x, radius, z), spin = group(pivot);
  const spokes: THREE.BufferGeometry[] = [ring(radius - 0.032, automobile ? 0.052 : 0.032, [0, 0, 0], black), ring(radius - 0.095, 0.035, [0, 0, 0], automobile ? wood : iron)];
  for (let i = 0; i < 12; i++) {
    const a = i * Math.PI / 6;
    spokes.push(rod([0, Math.sin(a) * 0.09, Math.cos(a) * 0.09], [0, Math.sin(a) * (radius - 0.11), Math.cos(a) * (radius - 0.11)], automobile ? 0.022 : 0.018, automobile ? wood : brass));
  }
  spokes.push(rod([-0.11, 0, 0], [0.11, 0, 0], 0.085, iron), rod([-0.13, 0, 0], [0.13, 0, 0], 0.047, brass));
  b.add(spin, spokes);
  return { pivot, spin, radius, x, z, steer };
}

export function leafSpring(x: number, z: number, c = MOUNT_COLORS.iron): THREE.BufferGeometry[] {
  return [0, 1, 2].map(i => tube([[x, 0.51 + i * 0.025, z - 0.52], [x, 0.39 + i * 0.025, z], [x, 0.51 + i * 0.025, z + 0.52]], 0.022, c));
}

export function tuftedSeat(width: number, y: number, z: number): THREE.BufferGeometry[] {
  const { black, leather, brass } = MOUNT_COLORS;
  const out = [panel(width, 0.14, 0.55, 0, y, z, leather), panel(width, 0.52, 0.13, 0, y + 0.26, z - 0.28, black)];
  for (let x = -width / 2 + 0.12; x < width / 2; x += 0.16) {
    out.push(panel(0.032, 0.42, 0.035, x, y + 0.28, z - 0.202, leather, 0.012));
    for (const h of [0.16, 0.36]) out.push(orb(0.018, [x + 0.04, y + h, z - 0.192], brass));
  }
  return out;
}

export function coachLamp(b: MountBuilder, parent: THREE.Object3D, x: number, y: number, z: number, spectral: boolean): void {
  const { brass, iron, pale } = MOUNT_COLORS;
  b.add(parent, [panel(0.18, 0.035, 0.18, x, y - 0.12, z, brass), panel(0.19, 0.045, 0.19, x, y + 0.13, z, brass),
    ...[-1, 1].flatMap(sx => [-1, 1].map(sz => rod([x + sx * 0.07, y - 0.1, z + sz * 0.07], [x + sx * 0.07, y + 0.11, z + sz * 0.07], 0.012, iron))),
    tube([[x - 0.06, y + 0.17, z], [x, y + 0.23, z], [x + 0.06, y + 0.17, z]], 0.013, brass)]);
  b.add(parent, [box(0.115, 0.18, 0.115, x, y, z, spectral ? [0.8, 0.15, 1] : pale)], 'cloth', 0.9);
}
