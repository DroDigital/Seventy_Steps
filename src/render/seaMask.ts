/**
 * The open sea stops at dungeon walls. Room edges lie on WORLD.snap, so one byte per grid cell
 * masks their exact footprints without rebuilding the sea's moving rings. Wells and boss floods
 * draw their own water. Nearest filtering keeps waves out even along a room's edge.
 */
import * as THREE from 'three';
import { WORLD } from '../data/tuning';
import type { Rect } from '../world/worldMap';

export function seaRoomMask(rooms: readonly Rect[]): { texture: THREE.DataTexture; bounds: THREE.Vector4 } {
  const cell = WORLD.snap;
  const x0 = rooms.length ? Math.min(...rooms.map((r) => r.x0)) - cell : 0;
  const z0 = rooms.length ? Math.min(...rooms.map((r) => r.z0)) - cell : 0;
  const width = rooms.length ? Math.ceil((Math.max(...rooms.map((r) => r.x1)) - x0) / cell) + 1 : 1;
  const height = rooms.length ? Math.ceil((Math.max(...rooms.map((r) => r.z1)) - z0) / cell) + 1 : 1;
  const data = new Uint8Array(width * height);
  for (const r of rooms) {
    const [left, right] = [Math.round((r.x0 - x0) / cell), Math.round((r.x1 - x0) / cell)];
    const [bottom, top] = [Math.round((r.z0 - z0) / cell), Math.round((r.z1 - z0) / cell)];
    for (let z = bottom; z < top; z++) data.fill(255, z * width + left, z * width + right);
  }
  const texture = new THREE.DataTexture(data, width, height, THREE.RedFormat);
  texture.minFilter = texture.magFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return { texture, bounds: new THREE.Vector4(x0, z0, width * cell, height * cell) };
}
