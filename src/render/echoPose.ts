/** The lost Echoes burn in place: a wavering flame, motes turning around it, and a slow pulse on the ground. */
import * as THREE from 'three';
import type { Figure } from './figures';

interface Part {
  object: THREE.Object3D;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
}

interface EchoParts { flame?: Part; orbit?: Part; halo?: Part }

function find(root: THREE.Object3D, name: string): Part | undefined {
  const object = root.getObjectByName(name);
  return object && { object, position: object.position.clone(), rotation: object.rotation.clone(), scale: object.scale.clone() };
}

/** All motion is evaluated from time and the authored pose, so it cannot drift with frame rate. */
export function poseEcho(f: Figure, time: number): void {
  const parts: EchoParts = f.root.userData.echoParts ??= {
    flame: find(f.root, 'echo-flame'),
    orbit: find(f.root, 'echo-orbit'),
    halo: find(f.root, 'echo-halo'),
  };
  const breath = Math.sin(time * 1.45);
  const flutter = Math.sin(time * 3.7 + 0.6);
  if (parts.flame) {
    const { object, position, rotation, scale } = parts.flame;
    object.position.set(position.x + 0.015 * Math.sin(time * 1.1), position.y + 0.018 * breath, position.z + 0.01 * Math.sin(time * 0.83));
    object.rotation.set(rotation.x + 0.045 * Math.sin(time * 1.3), rotation.y + 0.12 * Math.sin(time * 0.7), rotation.z + 0.075 * Math.sin(time * 1.7));
    object.scale.set(scale.x * (1 + 0.035 * breath), scale.y * (1 + 0.065 * breath + 0.018 * flutter), scale.z * (1 + 0.035 * breath));
  }
  if (parts.orbit) {
    const { object, position, rotation } = parts.orbit;
    object.position.y = position.y + 0.018 * Math.sin(time * 1.1 + 0.9);
    object.rotation.set(rotation.x, rotation.y + time * 0.34, rotation.z);
  }
  if (parts.halo) {
    const { object, rotation, scale } = parts.halo;
    const pulse = 1 + 0.035 * Math.sin(time * 1.45 - 0.5);
    object.rotation.set(rotation.x, rotation.y - time * 0.075, rotation.z);
    object.scale.set(scale.x * pulse, scale.y, scale.z * pulse);
  }
}
