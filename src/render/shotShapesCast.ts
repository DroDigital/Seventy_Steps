/**
 * The shots of the cast and the conjured, and of what a sorcerer made or kept (round 69; data/shotForms.ts): globes and stars and
 * coils of light, stone and crystal, a torn page, a crooked knife, a pen, a flask, an urn. Each is in its own frame, flying toward
 * +z, about two units long. Render only: geometry.
 */

import * as THREE from 'three';
import { around, ball, BODY, DARK, FLAP, gem, HOT, PALE, part, plate, ring, rock, rod, slab, solid } from './shotKit';

/** The Colour's globule: a faceted sphere with two rings of its light about it. */
export const orb = (): THREE.BufferGeometry =>
  solid([part(new THREE.IcosahedronGeometry(0.95, 1), BODY), ring(1.18, 0.05, HOT, [0, 0, 0], [1.1, 0, 0], [1, 1, 1], 10), ring(1.18, 0.05, HOT, [0, 0, 0], [0, 1.1, 0.6], [1, 1, 1], 10)]);

/** Yog-Sothoth's "congeries of iridescent globes": five that cling, no two of a size. */
export const globes = (): THREE.BufferGeometry =>
  solid([
    ball(0.62, BODY),
    ball(0.4, PALE, [0.78, 0.5, 0.3]),
    ball(0.42, BODY, [-0.72, 0.4, -0.35]),
    ball(0.36, PALE, [0.15, -0.8, 0.45]),
    ball(0.3, HOT, [-0.3, -0.45, -0.75]),
  ]);

/** The Elder Thing's head: a five-pointed star with a bright eye in the middle. */
export const pentastar = (): THREE.BufferGeometry => {
  const shape = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
    const r = i % 2 ? 0.55 : 1.2;
    if (i) shape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    else shape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  return solid([plate(shape, 0.4, BODY), ball(0.3, HOT, [0, 0, 0.22]), ...around(5, (a) => ball(0.13, PALE, [Math.cos(a + Math.PI / 2) * 1.05, Math.sin(a + Math.PI / 2) * 1.05, 0.15]))]);
};

/** The Yithians' weapon: a coil of rings tightening toward a lightning core. */
export const helix = (): THREE.BufferGeometry =>
  solid([
    rod(0.16, 0.16, 2.3, HOT),
    ...[0, 1, 2, 3, 4, 5].map((i) => ring(0.72 - i * 0.07, 0.1, i % 2 ? PALE : BODY, [0, 0, -0.95 + i * 0.38], [0, 0, i * 0.5])),
    gem(0.3, HOT, [0, 0, 1.3], [1, 1, 1.6]),
  ]);

/** The Light-Being of Algol: rays crossed through a white heart. */
export const flare = (): THREE.BufferGeometry =>
  solid([
    gem(1, BODY, [0, 0, 0], [0.14, 0.14, 1.5]),
    gem(1, BODY, [0, 0, 0], [1.5, 0.14, 0.14]),
    gem(1, BODY, [0, 0, 0], [0.14, 1.5, 0.14]),
    gem(1, PALE, [0, 0, 0], [1.1, 0.12, 0.12], [0, 0, Math.PI / 4]),
    gem(1, PALE, [0, 0, 0], [1.1, 0.12, 0.12], [0, 0, -Math.PI / 4]),
    ball(0.42, HOT),
  ]);

/** A cluster of crystals, as in the walls of Eryx: three long prisms, no two alike. */
export const crystal = (): THREE.BufferGeometry =>
  solid([
    gem(1, PALE, [0, 0, 0], [0.36, 0.36, 1.45]),
    gem(1, BODY, [0.2, 0.1, 0.1], [0.3, 0.3, 1.2], [0.5, 0.4, 0]),
    gem(1, PALE, [-0.2, -0.1, -0.1], [0.28, 0.28, 1.1], [-0.4, 0.5, 0.5]),
    ball(0.22, HOT),
  ]);

/** A gods' stone: a rough boulder with a second and a third knocked against it. */
export const crag = (): THREE.BufferGeometry => solid([rock(0.85, BODY, [0, 0, 0], [1.1, 0.85, 1], 3), rock(0.5, PALE, [0.55, 0.35, 0.2], [1, 1, 1], 7), rock(0.4, DARK, [-0.5, -0.3, 0.3], [1, 1, 1], 11)]);

/** A leaf torn from the Necronomicon: curled, ruled with lines of black writing, a sigil burning on it. */
export const page = (): THREE.BufferGeometry => {
  const sheet = new THREE.PlaneGeometry(1.7, 2.1, 4, 4);
  const pos = sheet.getAttribute('position');
  for (let i = 0; i < pos.count; i++) pos.setZ(i, 0.28 * Math.sin(pos.getX(i) * 2.4) + 0.12 * pos.getY(i) * pos.getY(i));
  return solid([
    part(sheet, PALE, { move: FLAP }),
    ...[0.3, -0.05, -0.4, -0.75].map((y) => slab(1.1, 0.07, 0.03, DARK, [0, y, 0.2 + 0.12 * y * y])),
    ring(0.3, 0.05, HOT, [0, 0.72, 0.17], [0, 0, 0], [1, 1, 1], 10),
  ]);
};

/** Keziah's knife: a crooked blade, a guard, a grip and a pommel set with a red stone. */
export const dagger = (): THREE.BufferGeometry =>
  solid([
    ...[0, 1, 2, 3].map((k) => slab(0.09, 0.62 - k * 0.13, 0.38, PALE, [k ? 0.11 * Math.sin(k * 1.7) : 0, 0, 0.12 + 0.34 * k], [0, k ? 0.12 * Math.sin(k * 1.7) : 0, 0])),
    gem(0.2, PALE, [0.1, 0, 1.5], [0.4, 1, 1.9]),
    slab(0.14, 0.95, 0.16, DARK, [0, 0, -0.1]),
    rod(0.1, 0.1, 0.8, BODY, [0, 0, -0.55]),
    ball(0.18, HOT, [0, 0, -1.02]),
  ]);

/** The Black Man's pen: a long quill with vanes trailing and a nib wet with red. */
export const quill = (): THREE.BufferGeometry =>
  solid([
    rod(0.05, 0.05, 2.8, PALE, [0, 0, -0.2]),
    ...[-1, 1].flatMap((s) => [slab(0.7, 0.05, 1.7, DARK, [s * 0.38, 0, -0.5], [0, -s * 0.22, 0], FLAP), slab(0.34, 0.06, 1.4, BODY, [s * 0.2, 0, -0.5], [0, -s * 0.12, 0], FLAP)]),
    rod(0.08, 0.03, 0.5, HOT, [0, 0, 1.45]),
    ball(0.09, HOT, [0, 0, 1.8]),
  ]);

/** Curwen's alembic: a bulb of glowing salts in glass, a neck, a cork. */
export const flask = (): THREE.BufferGeometry =>
  solid([
    ball(0.68, HOT, [0, -0.3, 0]),
    ring(0.7, 0.07, BODY, [0, -0.3, 0], [Math.PI / 2, 0, 0]),
    ring(0.5, 0.1, PALE, [0, 0.38, 0], [Math.PI / 2, 0, 0]),
    rod(0.2, 0.2, 0.7, PALE, [0, 0.85, 0], [Math.PI / 2, 0, 0]),
    rod(0.26, 0.23, 0.28, DARK, [0, 1.3, 0], [Math.PI / 2, 0, 0]),
  ]);

/** Orne's urn: banded, two handles, a lid, and the glow of what it holds showing in its cracks. */
export const urn = (): THREE.BufferGeometry => {
  const profile = [[0.001, -0.95], [0.45, -0.95], [0.7, -0.6], [0.82, 0], [0.7, 0.5], [0.4, 0.75], [0.38, 1.0], [0.5, 1.05], [0.001, 1.05]].map(([x, y]) => new THREE.Vector2(x, y));
  return solid([
    part(new THREE.LatheGeometry(profile, 8), BODY),
    ring(0.82, 0.06, DARK, [0, 0, 0], [Math.PI / 2, 0, 0]),
    ...[-1, 1].map((s) => ring(0.28, 0.07, PALE, [s * 0.88, 0.3, 0])),
    slab(0.06, 0.55, 0.05, HOT, [0.12, 0.05, 0.8], [0, 0, 0.3]),
    slab(0.06, 0.4, 0.05, HOT, [-0.2, 0.1, 0.74], [0, 0, -0.5]),
  ]);
};
