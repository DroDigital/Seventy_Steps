import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { mirrorCamera, MIRROR, pickMirror, planeOf, type MirrorSpot } from '../src/render/mirrorMath';

/** A mirror on the plane z = 0, facing +z (the room), its middle at (0, 1.5, 0). */
const glass: MirrorSpot = { x: 0, y: 1.5, z: 0, nx: 0, ny: 0, nz: 1 };
const camera = (x: number, y: number, z: number, at: [number, number, number]): THREE.PerspectiveCamera => {
  const c = new THREE.PerspectiveCamera(66, 16 / 9, 0.1, 140);
  c.position.set(x, y, z);
  c.lookAt(...at);
  c.updateMatrixWorld();
  return c;
};
const project = (m: THREE.Matrix4, p: THREE.Vector3): THREE.Vector3 => {
  const v = new THREE.Vector4(p.x, p.y, p.z, 1).applyMatrix4(m);
  return new THREE.Vector3(v.x / v.w, v.y / v.w, v.z / v.w);
};

describe('the mirror found among a mirror piece\'s faces (planeOf)', () => {
  it('is the middle of the box about its faces and the mean way they face', () => {
    const geo = new THREE.PlaneGeometry(2, 3).translate(1, 2, 4).toNonIndexed();
    const s = planeOf(geo)!;
    expect([s.x, s.y, s.z]).toEqual([1, 2, 4]);
    expect([s.nx, s.ny, s.nz]).toEqual([0, 0, 1]);
    expect(planeOf(new THREE.BufferGeometry())).toBeNull();
  });
});

describe('which mirror is drawn (pickMirror)', () => {
  const eye = new THREE.Vector3(0, 1.6, 5);
  const toward = new THREE.Vector3(0, 0, -1);
  it('is the one in front of the eye and looked toward, within reach', () => {
    expect(pickMirror([glass], eye, toward)).toBe(glass);
  });
  it('is none from behind the glass, from too far, or with the back turned', () => {
    expect(pickMirror([glass], new THREE.Vector3(0, 1.6, -2), toward)).toBeNull();
    expect(pickMirror([glass], new THREE.Vector3(0, 1.6, MIRROR.reach + 1), toward)).toBeNull();
    expect(pickMirror([glass], eye, new THREE.Vector3(0, 0, 1))).toBeNull();
  });
  it('is the nearest of two', () => {
    const far: MirrorSpot = { ...glass, z: -6 };
    const near: MirrorSpot = { ...glass, z: 1, x: 0.5 };
    expect(pickMirror([far, near], eye, toward)).toBe(near);
  });
});

describe('the picture taken from behind the glass (mirrorCamera)', () => {
  const [virtual, texture] = [new THREE.PerspectiveCamera(), new THREE.Matrix4()];

  it('stands the eye\'s image on the far side of the glass, looking into the room', () => {
    const c = camera(0, 1.5, 5, [0, 1.5, 0]);
    mirrorCamera(virtual, c, glass, texture);
    expect(virtual.position.x).toBeCloseTo(0);
    expect(virtual.position.y).toBeCloseTo(1.5);
    expect(virtual.position.z).toBeCloseTo(-5);
    const look = new THREE.Vector3();
    virtual.getWorldDirection(look);
    expect(look.z).toBeCloseTo(1); // toward the room, as the eye would see through a window
  });

  it('puts the middle of the glass at the middle of the picture, and a thing seen in the glass where the reflected ray meets it', () => {
    const c = camera(2, 1.8, 5, [0, 1.5, 0]);
    mirrorCamera(virtual, c, glass, texture);
    // a point X on the glass, and the point W the eye sees there: along the ray from the eye to X, turned about the plane
    const eye = new THREE.Vector3(2, 1.8, 5);
    const X = new THREE.Vector3(-0.4, 1.2, 0);
    const ray = X.clone().sub(eye).normalize();
    const out = new THREE.Vector3(ray.x, ray.y, -ray.z);
    const W = X.clone().addScaledVector(out, 4);
    const [a, b] = [project(texture, X), project(texture, W)];
    expect(a.x).toBeCloseTo(b.x, 4);
    expect(a.y).toBeCloseTo(b.y, 4);
    const mid = project(texture, new THREE.Vector3(glass.x, glass.y, glass.z));
    expect(mid.x).toBeGreaterThan(0);
    expect(mid.x).toBeLessThan(1);
  });

  it('lays its near plane on the glass: what is behind it is cut, what is before it is not', () => {
    const c = camera(0, 1.5, 5, [0, 1.5, 0]);
    mirrorCamera(virtual, c, glass, texture);
    const clipZ = (z: number): number => project(virtual.projectionMatrix.clone().multiply(virtual.matrixWorldInverse), new THREE.Vector3(0, 1.5, z)).z;
    expect(clipZ(-1)).toBeLessThan(-1); // behind the glass: before the near plane
    expect(clipZ(0.01)).toBeGreaterThan(-1.01); // on it
    expect(clipZ(3)).toBeGreaterThan(-1); // in the room
    expect(clipZ(3)).toBeLessThan(1);
  });
});
