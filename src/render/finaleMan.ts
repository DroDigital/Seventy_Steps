/**
 * The tall man (round 98): Nyarlathotep in the investigator's own figure. The look of the coat is kept
 * and only hued to the Court; the growth (finaleGrowth) is his alone. Feet at the origin, facing +z.
 * Render only.
 */

import * as THREE from 'three';
import { dread } from './finaleDread';
import { attachGrowth, type Growth } from './finaleGrowth';
import { investigator } from './investigator';
import { rotateHue } from './palette';

export interface TallMan {
  root: THREE.Group;
  writhe: Growth['writhe'];
}

const HUE = -0.12; // the coat's brown and the scarf, toward the Court's wine

/** The model's own light and dark, hue only. */
function hue(mesh: THREE.Mesh): void {
  const col = mesh.geometry.getAttribute('color');
  for (let i = 0; i < col.count; i++) {
    const h = rotateHue([col.getX(i), col.getY(i), col.getZ(i)], HUE);
    col.setXYZ(i, h[0], h[1], h[2]);
  }
  col.needsUpdate = true;
}

/** The dressed investigator, hued, with the growth hung on him. His light is a person's, not the lantern-bearer's. */
export function tallMan(): TallMan {
  const f = investigator();
  for (const m of f.materials) m.uniforms.uCharacter.value = 1;
  f.root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (mesh.isMesh) hue(mesh);
  });
  const growth = attachGrowth(f);
  return {
    root: f.root,
    writhe: (time, grown) => {
      dread(f, time, grown);
      growth.writhe(time, grown);
    },
  };
}
