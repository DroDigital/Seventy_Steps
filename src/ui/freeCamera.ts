/** A detached camera for looking around without moving the investigator. */
import { Vector3, type PerspectiveCamera } from 'three';
import type { InputFrame } from '../core/input';

const SPEED = 10; // metres per second
const MAX_PITCH = Math.PI / 2 - 0.01;

export interface FreeCamera {
  readonly active: boolean;
  /** Copy the current view before detaching, so entering flight does not jump. */
  enable(camera: PerspectiveCamera): void;
  disable(): void;
  /** Move with the ordinary movement and look controls. Dodge rises; block descends. */
  step(input: InputFrame, dt: number): void;
  /** Override the rendered view while detached; no-op otherwise. */
  apply(camera: PerspectiveCamera): void;
}

export function createFreeCamera(): FreeCamera {
  let active = false;
  let yaw = 0;
  let pitch = 0;
  const position = new Vector3();
  const direction = new Vector3();

  return {
    get active() { return active; },
    enable(camera) {
      if (active) return;
      position.copy(camera.position);
      camera.getWorldDirection(direction);
      yaw = Math.atan2(direction.x, direction.z);
      pitch = -Math.asin(Math.max(-1, Math.min(1, direction.y)));
      active = true;
    },
    disable() { active = false; },
    step(input, dt) {
      if (!active) return;
      yaw -= input.lookX;
      pitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, pitch + input.lookY));
      const up = Number(input.held.dodge) - Number(input.held.block);
      const len = Math.max(1, Math.hypot(input.moveX, input.moveY, up));
      const k = SPEED * Math.max(0, dt) / len;
      // The game's yaw points along +z at zero, with right along -x.
      position.x += (Math.sin(yaw) * input.moveY - Math.cos(yaw) * input.moveX) * k;
      position.z += (Math.cos(yaw) * input.moveY + Math.sin(yaw) * input.moveX) * k;
      position.y += up * k;
    },
    apply(camera) {
      if (!active) return;
      camera.position.copy(position);
      direction.set(Math.sin(yaw) * Math.cos(pitch), -Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch));
      camera.lookAt(position.x + direction.x, position.y + direction.y, position.z + direction.z);
    },
  };
}
