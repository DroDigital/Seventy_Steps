/** Keeps the active mount aligned with the interpolated investigator and seats the driver. */
import * as THREE from 'three';
import { wrapAngle } from '../core/geom';
import { MOUNT_TURNING } from '../data/mounts';
import { SIM } from '../data/tuning';
import type { Game } from '../systems/components';
import type { Figure } from './figures';
import { createMount, poseMountedRider, type MountVisual } from './mounts';

export function createMountViews(scene: THREE.Scene, g: Game): { place(f: Figure, time: number, dt: number): void } {
  const visuals = new Map<string, MountVisual>();
  let current: MountVisual | null = null;
  let shown = 0;
  let wasActive = false;
  const seatAt = new THREE.Vector3();
  const seatTurn = new THREE.Quaternion();
  const footAt = new THREE.Vector3();
  const footTurn = new THREE.Quaternion();
  const clear = (): void => {
    if (current) current.root.visible = false;
    current = null; shown = 0; wasActive = false;
  };
  g.events.on('Died', ({ entity }) => { if (entity === g.player.id) clear(); });
  g.events.on('Teleported', ({ entity }) => { if (entity === g.player.id) clear(); });
  g.events.on('Respawned', ({ entity }) => { if (entity === g.player.id) clear(); });
  g.events.on('Travelled', clear);
  return {
    place(f, time, dt) {
      const id = g.player.mount.active;
      if (id) {
        let visual = visuals.get(id);
        if (!visual) { visual = createMount(id); visuals.set(id, visual); scene.add(visual.root); }
        if (current !== visual) {
          if (current) current.root.visible = false;
          current = visual;
          shown = 0;
        }
        if (!wasActive) shown = 0;
        current.root.position.copy(f.root.position);
        current.root.rotation.set(0, f.root.rotation.y, 0);
      }
      wasActive = !!id;
      if (!current) return;
      shown = Math.max(0, Math.min(1, shown + (id ? 1 : -1) * dt / 0.35));
      current.root.visible = shown > 0;
      if (!current.root.visible) return;
      const tr = g.ecs.c.transform.get(g.player.id)!;
      const rate = id ? g.player.mount.yawRate : wrapAngle(tr.yaw - tr.prevYaw) * SIM.hz; // the turn the rig is in, in rad/s
      const turn = Math.max(-1, Math.min(1, rate / 1.1));
      const bend = id ? Math.max(-0.32, Math.min(0.32, rate * MOUNT_TURNING[id].lead)) : 0; // a horse leads a turn, the carriage comes after
      const [rx, ry, rz, yaw] = [current.root.position.x, current.root.position.y, current.root.position.z, current.root.rotation.y];
      const [s, c] = [Math.sin(yaw), Math.cos(yaw)];
      const speed = id ? Math.min(22, Math.hypot(tr.pos.x - tr.prev.x, tr.pos.z - tr.prev.z) * SIM.hz) : 0;
      current.update({ time, dt, speed, turn, bend, cycle: g.player.mount.phase, ground: (x, z) => Math.max(-0.7, Math.min(0.7, g.world.ground(rx + x * c + z * s, rz - x * s + z * c) - ry)) });
      for (const material of current.materials) if (material.uniforms.uGhost) material.uniforms.uGhost.value = 1 - shown;
      if (!id) return;
      current.root.updateMatrixWorld(true);
      current.seat.getWorldPosition(seatAt);
      current.seat.getWorldQuaternion(seatTurn);
      footAt.copy(f.root.position); footTurn.copy(f.root.quaternion);
      const blend = shown * shown * (3 - 2 * shown);
      f.root.position.copy(footAt).lerp(seatAt, blend);
      f.root.quaternion.copy(footTurn).slerp(seatTurn, blend);
      poseMountedRider(f, id, time, speed, turn);
    },
  };
}
