/**
 * The dungeons' traps' hardware (2026-11-27; render/trapViews.ts sets and moves it, systems/dungeonTraps.ts says when): a grate of spikes
 * and the spikes under it, a pressure plate with its sign, the carved slot a dart is loosed from and the dart, a pendulum's rod and blade,
 * a bronze nozzle, a slab hung on chains with points under it, a stone ball, a vent's grille and an eye. Each in its own frame, its foot (or
 * its pivot, or its mouth) at the origin, facing +z. Flat-shaded and low, as the kit is. Render only: geometry.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { box, tint, tileUv } from './meshKit';
import { scaleRgb, type Rgb } from './palette';
import { runeFlat } from './wayShapes';

export const IRON: Rgb = [0.3, 0.29, 0.28];
const RUST: Rgb = [0.38, 0.27, 0.2];
const STONE: Rgb = [0.56, 0.54, 0.5];
const BRONZE: Rgb = [0.52, 0.4, 0.22];

const merged = (parts: THREE.BufferGeometry[]): THREE.BufferGeometry => mergeGeometries(parts.map((p) => (p.index ? p.toNonIndexed() : p)))!;

/** A grate of iron `2 * half` across, flush with the floor, holes in rows where the spikes come through. */
export function grate(half: number): THREE.BufferGeometry {
  const parts = [box(half * 2, 0.04, half * 2, 0, 0.02, 0, IRON)];
  const n = 4;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) parts.push(box(0.13, 0.012, 0.13, ((i + 0.5) / n - 0.5) * half * 2, 0.045, ((j + 0.5) / n - 0.5) * half * 2, [0.06, 0.05, 0.05]));
  parts.push(box(half * 2 + 0.08, 0.05, 0.06, 0, 0.025, half + 0.03, RUST), box(half * 2 + 0.08, 0.05, 0.06, 0, 0.025, -half - 0.03, RUST), box(0.06, 0.05, half * 2, half + 0.03, 0.025, 0, RUST), box(0.06, 0.05, half * 2, -half - 0.03, 0.025, 0, RUST));
  return merged(parts);
}

/** The spikes of a grate: up, their points 0.7 m over the floor; drawn sunk below it until they thrust. */
export function spikes(half: number): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const n = 4;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) parts.push(tint(new THREE.ConeGeometry(0.07, 0.75, 4).translate(((i + 0.5) / n - 0.5) * half * 2, 0.375 - 0.05, ((j + 0.5) / n - 0.5) * half * 2), scaleRgb(IRON, 1.3)));
  return merged(parts);
}

/** A pressure plate: a square of stone a little proud of the floor, its sign cut in it (`sign`: lit by the trap's own colour). */
export function plate(kind: number): { stone: THREE.BufferGeometry; sign: THREE.BufferGeometry } {
  const stone = tileUv(merged([box(1.3, 0.05, 1.3, 0, 0.025, 0, scaleRgb(STONE, 0.85)), box(1.1, 0.03, 1.1, 0, 0.06, 0, STONE)]), 1.3, 1.3);
  return { stone, sign: runeFlat(kind, 0.7, 0.065, [1, 1, 1]) };
}

/** A dart's slot in the wall: a carved head with a mouth, its face along +z (into the room), its mouth at the origin. */
export function slot(): { head: THREE.BufferGeometry; mouth: THREE.BufferGeometry } {
  const head = merged([box(0.7, 0.62, 0.22, 0, 0.05, -0.12, scaleRgb(STONE, 0.9)), box(0.16, 0.5, 0.08, -0.22, 0.05, 0, scaleRgb(STONE, 0.75)), box(0.16, 0.5, 0.08, 0.22, 0.05, 0, scaleRgb(STONE, 0.75)), box(0.7, 0.12, 0.1, 0, 0.32, 0, scaleRgb(STONE, 0.8))]);
  return { head, mouth: box(0.26, 0.14, 0.04, 0, 0, 0.01, [1, 1, 1]) };
}

/** A dart, its point along +z. */
export const dart = (): THREE.BufferGeometry => merged([box(0.035, 0.035, 0.5, 0, 0, 0, RUST), tint(new THREE.ConeGeometry(0.04, 0.12, 4).rotateX(Math.PI / 2).translate(0, 0, 0.31), IRON)]);

/** A pendulum: a rod `length` long hung from the origin and a crescent blade at its foot, swinging in the x–y plane. */
export function pendulum(length: number): THREE.BufferGeometry {
  const rod = box(0.07, length, 0.07, 0, -length / 2, 0, IRON);
  const blade = tint(new THREE.CylinderGeometry(0.75, 0.75, 0.05, 10, 1, false, -Math.PI / 2, Math.PI).rotateX(Math.PI / 2).translate(0, -length + 0.12, 0), scaleRgb(IRON, 1.45)); // the half disc, its edge down
  const hub = tint(new THREE.CylinderGeometry(0.12, 0.12, 0.3, 6).rotateX(Math.PI / 2), RUST);
  return merged([rod, blade, hub]);
}

/** A beam the pendulums hang from, along x, `length` long. */
export const beam = (length: number): THREE.BufferGeometry => box(length, 0.22, 0.26, 0, 0, 0, [0.36, 0.3, 0.24]);

/** A bronze nozzle in the wall, its mouth at the origin looking along +z, and its glowing throat. */
export function nozzle(): { body: THREE.BufferGeometry; throat: THREE.BufferGeometry } {
  const body = merged([tint(new THREE.CylinderGeometry(0.16, 0.24, 0.45, 8).rotateX(Math.PI / 2).translate(0, 0, -0.2), BRONZE), box(0.62, 0.62, 0.08, 0, 0, -0.42, scaleRgb(BRONZE, 0.7))]);
  return { body, throat: tint(new THREE.CircleGeometry(0.12, 8).translate(0, 0, 0.03), [1, 1, 1]) };
}

/** A slab `2 * half` across and its points under it, its underside at the origin; and a chain a metre long (stretched to the ceiling). */
export function slab(half: number): { stone: THREE.BufferGeometry; chain: THREE.BufferGeometry } {
  const parts = [box(half * 2, 0.55, half * 2, 0, 0.275, 0, scaleRgb(STONE, 0.8))];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) parts.push(tint(new THREE.ConeGeometry(0.11, 0.3, 4).rotateX(Math.PI).translate((i - 1) * half * 0.62, -0.15, (j - 1) * half * 0.62), IRON));
  return { stone: tileUv(merged(parts), half * 2, 0.6), chain: box(0.06, 1, 0.06, 0, 0.5, 0, IRON) };
}

/** A stone ball `r` across, a little rough. */
export function ball(r: number): THREE.BufferGeometry {
  const g = new THREE.IcosahedronGeometry(r, 1);
  const p = g.getAttribute('position');
  for (let i = 0; i < p.count; i++) {
    const k = 1 + 0.07 * Math.sin(p.getX(i) * 9.1 + p.getY(i) * 5.3) * Math.cos(p.getZ(i) * 7.7);
    p.setXYZ(i, p.getX(i) * k, p.getY(i) * k, p.getZ(i) * k);
  }
  g.computeVertexNormals();
  return tileUv(tint(g, scaleRgb(STONE, 0.85)), r * 3, r * 3);
}

/** A vent: a round grille of iron in the floor, and the dark under it. */
export function vent(): THREE.BufferGeometry {
  const parts = [tint(new THREE.CylinderGeometry(0.6, 0.62, 0.04, 10).translate(0, 0.02, 0), [0.04, 0.04, 0.04]), tint(new THREE.TorusGeometry(0.58, 0.05, 4, 10).rotateX(Math.PI / 2).translate(0, 0.04, 0), RUST)];
  for (let k = -2; k <= 2; k++) parts.push(box(1.08 * Math.cos(Math.asin(Math.min(0.95, Math.abs(k) * 0.2))), 0.04, 0.05, 0, 0.05, k * 0.2, IRON));
  return merged(parts);
}

/** An eye: the white, and the iris and pupil looking along +z. */
export function eye(): { white: THREE.BufferGeometry; iris: THREE.BufferGeometry } {
  return {
    white: tint(new THREE.SphereGeometry(0.42, 10, 8), [0.82, 0.78, 0.7]),
    iris: merged([tint(new THREE.CircleGeometry(0.2, 10).translate(0, 0, 0.415), [1, 1, 1]), tint(new THREE.CircleGeometry(0.08, 8).translate(0, 0, 0.42), [0.02, 0.02, 0.02])]),
  };
}
