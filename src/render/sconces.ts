/**
 * The torches on a dungeon's walls (round 30: they stood where a per-pilaster dice roll put them,
 * crowded in one place and bare in another, on both faces of every wall, outside faces too, and at a
 * fixed height above a wall's lowest point, which on stairs buried some and hung some in the air):
 * now they stand evenly along each stretch of wall, a spacing of the kit's own (`flames`, the share
 * of a four-metre pilaster that bears one), on the faces that look into a room, at a height above the
 * floor of that room, each an iron bracket and cup, and every one a light (round 87: its flame is the
 * pixel flame's, flames.ts, and no cone of one is built). Pure but for the geometry it makes.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { box } from './meshKit';
import type { Rgb } from './palette';
import type { LightSpot } from './worldLights';

const IRON: Rgb = [0.3, 0.29, 0.3];
const HEIGHT = 1.95; // metres above the floor: the flame stands a little over a man's head
const SPAN = [4, 14] as const; // the nearest and the farthest apart two torches stand along a wall
export const EDGE = 1.2; // metres from the end of a stretch of wall (a doorway's jamb, a corner) that a torch keeps

/** Where along a stretch of wall `len` metres long (from its middle, −len/2 … len/2) the torches stand: evenly, none where `flames` is nothing or the stretch is short. */
export function torchStops(len: number, flames: number): number[] {
  if (flames <= 0 || len < 4.5) return [];
  const spacing = Math.min(SPAN[1], Math.max(SPAN[0], 4 / flames));
  const n = Math.max(1, Math.round(len / spacing));
  return Array.from({ length: n }, (_, j) => {
    const t = -len / 2 + ((j + 0.5) * len) / n;
    const edge = Math.max(0, len / 2 - EDGE);
    return Math.min(edge, Math.max(-edge, t));
  });
}

/** Which faces of a wall a torch may stand on: `+1`, `−1` (the sides of its across axis), or both for a wall with a room on each side; `inner` is the one side an outer wall has a room on (0: both). */
export const facesOf = (inner: number, index: number): number => (inner !== 0 ? inner : index % 2 ? 1 : -1);

export interface SconceSite {
  x: number;
  z: number;
  across: number; // +1 or −1: which way the wall's face looks, along its across axis
  alongX: boolean;
  floor: number; // the floor of the room it lights
}

/** The bracket of one torch, and its light (the flame in its cup is the pixel flame's). */
export function sconce(s: SconceSite, thick: number): { iron: THREE.BufferGeometry; light: LightSpot } {
  const off = s.across * (thick / 2 + 0.13); // the plate's centre: on the face of the wall
  const [px, pz] = s.alongX ? [s.x, s.z + off] : [s.x + off, s.z];
  const y = s.floor + HEIGHT;
  const out = (k: number): [number, number] => (s.alongX ? [0, s.across * k] : [s.across * k, 0]);
  const [ox, oz] = out(0.1);
  const plate = box(s.alongX ? 0.18 : 0.06, 0.34, s.alongX ? 0.06 : 0.18, px, y, pz, IRON);
  const arm = box(s.alongX ? 0.05 : 0.2, 0.05, s.alongX ? 0.2 : 0.05, px + ox, y - 0.1, pz + oz, IRON);
  const cup = box(0.15, 0.09, 0.15, px + ox * 2, y - 0.04, pz + oz * 2, IRON);
  const [fx, fz] = [px + ox * 2, pz + oz * 2];
  for (const g of [plate, arm, cup]) if (!g.index) g.setIndex([...Array(g.getAttribute('position').count).keys()]);
  return {
    iron: mergeGeometries([plate, arm, cup]),
    light: { x: fx, y: y + 0.22, z: fz, kind: 'torch' },
  };
}
