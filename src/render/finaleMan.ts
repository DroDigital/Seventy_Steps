/**
 * The tall man (round 98): Nyarlathotep as Carter met him, a good coat and a patient smile, in the
 * same bevelled figures as the people. The watch-chain ends in an open link. The key is at the sign.
 * Render only.
 */

import * as THREE from 'three';
import { bevel, prism } from './bodyKit';
import { BASE, scaleRgb, type Rgb } from './palette';
import type { TextureKind } from './textures';
import { createWorldMaterial } from './worldMaterial';

const COAT = scaleRgb(BASE.charcoal, 2.7);
const SKIN: Rgb = [0.78, 0.5, 0.36];
const HAIR = scaleRgb(BASE.charcoal, 1.2);
const BRASS: Rgb = [1.05, 0.78, 0.34];
const SHIRT = scaleRgb(BASE.bone, 0.9);
const TROUSER = scaleRgb(BASE.charcoal, 1.85);

/** A man of about six and a third feet, feet at the origin, facing +z. */
export function tallMan(): THREE.Group {
  const root = new THREE.Group();
  const add = (geo: THREE.BufferGeometry, texture: TextureKind, emissive = 0): void => {
    const mat = createWorldMaterial({ texture, uvScale: [0.45, 0.45], vertexColors: true, character: 'creature', emissive, seed: 5 });
    root.add(new THREE.Mesh(geo, mat));
  };
  const leg = (x: number): void => {
    add(prism(x, 0.5, 0.01, 0.12, 0.13, 0.1, 0.11, 0.96, TROUSER, 0.012), 'cloth');
    add(bevel(0.11, 0.055, 0.24, x, 0.028, 0.05, scaleRgb(BASE.charcoal, 1.35), 0.008), 'cloth');
  };
  leg(-0.09);
  leg(0.09);
  add(prism(0, 1.08, 0.015, 0.32, 0.18, 0.4, 0.22, 0.78, COAT, 0.016), 'cloth'); // the frock, to the knee
  add(prism(0, 1.52, 0, 0.42, 0.2, 0.26, 0.16, 0.2, COAT, 0.014), 'cloth'); // shoulders into the collar
  add(bevel(0.14, 0.1, 0.02, 0, 1.28, 0.1, SHIRT, 0.004), 'cloth');
  for (const x of [-0.24, 0.24]) {
    add(prism(x, 1.32, 0.02, 0.09, 0.09, 0.08, 0.08, 0.58, COAT, 0.01), 'cloth');
    add(bevel(0.07, 0.09, 0.05, x * 1.02, 0.98, 0.05, SKIN, 0.006), 'flesh');
  }
  add(bevel(0.15, 0.2, 0.16, 0, 1.74, 0.02, SKIN, 0.01), 'flesh');
  add(prism(0, 1.86, -0.01, 0.16, 0.15, 0.14, 0.13, 0.07, HAIR, 0.006), 'cloth');
  for (const x of [-0.038, 0.038]) add(bevel(0.018, 0.012, 0.01, x, 1.78, 0.095, scaleRgb(BASE.charcoal, 0.7), 0.002), 'cloth');
  add(bevel(0.055, 0.01, 0.008, 0, 1.68, 0.09, scaleRgb(BASE.charcoal, 1.5), 0.002), 'cloth'); // the smile, barely
  for (let i = 0; i < 5; i++) add(bevel(0.02, 0.014, 0.02, 0.045 + i * 0.011, 1.34 - i * 0.062, 0.125, BRASS, 0.003), 'cloth', 0.28);
  add(bevel(0.02, 0.014, 0.02, 0.115, 0.98, 0.135, BRASS, 0.003), 'cloth', 0.28); // the chain's last link, open: the key is not on it
  return root;
}
