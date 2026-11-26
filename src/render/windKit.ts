/**
 * Round 125, each point's own wind (shaders/wind.ts `aWind`): its plant's phase (two trees side by side do not swing as one), the reach
 * its bough's sway has there (none on a trunk, the most at an outer twig), how much it flutters (a leaf's or a blade's free tip), and
 * its bough's own phase; four bytes, 0..1. Every geometry a swaying material merges must carry one (render/propMeshes.ts): one that has
 * none is given zeros, and is blown by its lean alone, as before.
 */

import * as THREE from 'three';

/** The attribute over `bytes` (four a point). */
export const windAttribute = (bytes: Uint8Array): THREE.BufferAttribute => new THREE.BufferAttribute(bytes, 4, true);

/** Gives `geo` a still aWind if it has none (so it merges with those that have). */
export function ensureWind(geo: THREE.BufferGeometry): void {
  if (!geo.getAttribute('aWind')) geo.setAttribute('aWind', windAttribute(new Uint8Array(geo.getAttribute('position').count * 4)));
}

/** A point's wind, as the four bytes it is kept in: the plant's phase, the bough's reach, the flutter, the bough's phase (each 0..1). */
export function windBytes(plant: number, reach: number, flutter: number, bough: number): [number, number, number, number] {
  const b = (x: number): number => Math.round(Math.min(1, Math.max(0, x)) * 255);
  return [b(plant - Math.floor(plant)), b(reach), b(flutter), b(bough - Math.floor(bough))];
}
