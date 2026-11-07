/**
 * The world editor's camera (round 110, development builds only): flown with the right mouse button
 * held (the mouse looks, W A S D move, Q and E sink and rise, Shift hastens, the wheel sets the pace),
 * and framed on a point with F.
 */

import { Vector3, type PerspectiveCamera } from 'three';

const MAX_PITCH = Math.PI / 2 - 0.01;
const LOOK = 0.004; // radians a pixel

export interface EditorCamera {
  readonly position: Vector3;
  /** Takes up the view as it is, so entering the editor does not jump. */
  from(camera: PerspectiveCamera): void;
  look(dx: number, dy: number): void;
  wheel(dy: number): void;
  step(keys: ReadonlySet<string>, dt: number): void;
  /** Stands back from (x, y, z) by `dist`, looking at it. */
  frame(x: number, y: number, z: number, dist: number): void;
  apply(camera: PerspectiveCamera): void;
  readonly speed: number;
}

export function createEditorCamera(): EditorCamera {
  const position = new Vector3();
  const dir = new Vector3();
  let [yaw, pitch, speed] = [0, 0, 12];
  const forward = (): Vector3 => dir.set(Math.sin(yaw) * Math.cos(pitch), -Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch));
  return {
    position,
    get speed() {
      return speed;
    },
    from(camera) {
      position.copy(camera.position);
      camera.getWorldDirection(dir);
      yaw = Math.atan2(dir.x, dir.z);
      pitch = -Math.asin(Math.max(-1, Math.min(1, dir.y)));
    },
    look(dx, dy) {
      yaw -= dx * LOOK;
      pitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, pitch + dy * LOOK));
    },
    wheel(dy) {
      speed = Math.max(1, Math.min(200, speed * (dy > 0 ? 0.8 : 1.25)));
    },
    step(keys, dt) {
      const f = forward();
      const along = Number(keys.has('KeyW')) - Number(keys.has('KeyS'));
      const side = Number(keys.has('KeyD')) - Number(keys.has('KeyA'));
      const up = Number(keys.has('KeyE')) - Number(keys.has('KeyQ'));
      const k = speed * (keys.has('ShiftLeft') || keys.has('ShiftRight') ? 4 : 1) * dt;
      // The game's yaw points along +z at zero, with right along -x.
      position.x += (f.x * along - Math.cos(yaw) * side) * k;
      position.y += (f.y * along + up) * k;
      position.z += (f.z * along + Math.sin(yaw) * side) * k;
    },
    frame(x, y, z, dist) {
      const f = forward();
      position.set(x - f.x * dist, y - f.y * dist, z - f.z * dist);
    },
    apply(camera) {
      const f = forward();
      camera.position.copy(position);
      camera.lookAt(position.x + f.x, position.y + f.y, position.z + f.z);
    },
  };
}
