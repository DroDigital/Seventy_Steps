/** The mourning coach, and the same coach built plain: one horse, no funeral dress.
 * The plain body, roof, wheels and seat are this coach's, not a sourced cart.
 */
import * as THREE from 'three';
import { tint } from './meshKit';
import { scaleRgb } from './palette';
import { MOUNT_COLORS as C, MountBuilder, coachLamp, group, leafSpring, orb, panel, rod, tube, wheel, tuftedSeat, type CoachWheel, type Point } from './mountKit';
import { DRAFT_HITCH, DRAFT_PLACE, draftHorse, type DraftHorse } from './draftHorse';
import { spectralHorse, type SpectralHorse } from './mountHorse';

export interface CarriageArt {
  body: THREE.Group; wheels: CoachWheel[]; horses: SpectralHorse[]; draft: DraftHorse | null;
  seat: THREE.Object3D; reins: THREE.Mesh; reinsPosition: THREE.BufferAttribute;
}
export function carriageArt(b: MountBuilder, root: THREE.Group, plain = false): CarriageArt {
  const paint = plain ? C.wood : C.black;
  const body = group(root), wheels = [-1, 1].flatMap(side => [wheel(b, root, side * 0.96, -1.16, 0.72, false), wheel(b, root, side * 0.91, 0.52, 0.51, false, true)]);
  body.name = plain ? 'plain-chariot' : 'gothic-mourning-coach';
  const wood: THREE.BufferGeometry[] = [
    panel(1.54, 0.2, 2.52, 0, 0.72, -0.59, paint), panel(1.64, 0.09, 2.64, 0, 0.81, -0.59, C.iron),
    panel(1.5, 0.68, 0.13, 0, 1.18, -1.82, paint), panel(1.59, 0.055, 0.18, 0, 1.54, -1.82, C.brass),
    ...tuftedSeat(1.28, 1.27, 0.08), panel(1.38, 0.1, 0.6, 0, 0.86, 0.64, paint),
    panel(1.7, 0.1, 0.35, 0, 0.63, 0.93, C.iron),
  ];
  for (const side of [-1, 1]) {
    wood.push(panel(0.12, 0.73, 1.53, side * 0.72, 1.17, -0.94, paint),
      panel(0.14, 0.055, 1.62, side * 0.73, 1.57, -0.94, C.brass),
      panel(0.045, 0.07, 1.37, side * 0.79, 0.98, -0.94, C.trim),
      panel(0.04, 0.05, 1.37, side * 0.79, 1.41, -0.94, C.trim),
      panel(0.38, 0.065, 0.55, side * 0.89, 0.57, 0.02, C.iron),
      ...(plain ? [rod([side * 0.57, 0.64, 0.39], [side * DRAFT_HITCH.x, DRAFT_HITCH.y, DRAFT_HITCH.z], 0.05, scaleRgb(C.wood, 0.8)), orb(0.06, [side * DRAFT_HITCH.x, DRAFT_HITCH.y, DRAFT_HITCH.z], C.brass)] : [rod([side * 0.57, 0.64, 0.39], [side * 0.57, 0.83, 2.43], 0.042, C.iron)]),
      ...leafSpring(side * 0.6, -1.05), ...leafSpring(side * 0.6, 0.48));
    for (const zz of [-1.72, -0.44]) {
      wood.push(panel(0.095, 1.28, 0.095, side * 0.71, 2.03, zz, paint),
        panel(0.17, 0.09, 0.17, side * 0.71, 1.48, zz, C.brass),
        panel(0.18, 0.1, 0.18, side * 0.71, 2.61, zz, C.brass));
      if (!plain) {
        wood.push(orb(0.08, [side * 0.71, 2.78, zz], C.iron));
        for (const shift of [-0.03, 0.03]) wood.push(rod([side * 0.77, 1.55, zz + shift], [side * 0.77, 2.53, zz + shift], 0.012, C.trim));
      }
    }
    if (!plain) {
      for (const zz of [-1.4, -0.9]) wood.push(tube([[side * 0.797, 1.1, zz - 0.18], [side * 0.805, 1.3, zz - 0.08], [side * 0.805, 1.28, zz + 0.09], [side * 0.797, 1.1, zz + 0.18]], 0.013, C.brass));
      wood.push(tube([[side * 0.6, 0.92, -1.8], [side * 0.6, 0.55, -1.55], [side * 0.6, 0.48, -1.1], [side * 0.6, 0.78, -0.66]], 0.035, C.iron));
      coachLamp(b, body, side * 0.79, 1.72, 0.27, true);
    }
  }
  wood.push(rod([-1.0, 0.67, -1.16], [1.0, 0.67, -1.16], 0.06, C.iron), rod([-0.92, 0.46, 0.52], [0.92, 0.46, 0.52], 0.05, C.iron));
  b.add(body, wood, 'wood');
  const roof: THREE.BufferGeometry[] = [panel(1.74, 0.13, 1.71, 0, 2.67, -1.07, paint), panel(1.54, 0.12, 1.58, 0, 2.79, -1.07, C.iron), panel(0.17, 0.2, 1.45, 0, 2.87, -1.07, paint)];
  // Scalloped curtains leave the side windows and seated investigator readable. The plain coach has none.
  if (!plain) for (const side of [-1, 1]) {
    for (let i = 0; i < 6; i++) {
      const zz = -1.68 + i * 0.23;
      roof.push(tint(new THREE.ConeGeometry(0.15, 0.31 + 0.035 * (i % 2), 4).rotateX(Math.PI).scale(0.35, 1, 1).translate(side * 0.74, 2.44, zz), C.leather));
    }
    roof.push(panel(0.045, 0.95, 0.18, side * 0.74, 2.04, -1.62, C.leather));
  }
  b.add(body, roof);
  if (!plain) {
    const crest: THREE.BufferGeometry[] = [orb(0.13, [0, 2.83, -0.3], C.bone), panel(0.15, 0.1, 0.09, 0, 2.72, -0.26, C.bone)];
    for (const side of [-1, 1]) crest.push(panel(0.045, 0.05, 0.035, side * 0.052, 2.85, -0.18, C.black), rod([side * 0.2, 2.76, -0.25], [side * 0.36, 2.94, -0.25], 0.027, C.brass));
    b.add(body, crest, 'flesh', 0.2);
  }
  const horses = plain ? [] : [-1, 1].map((side, i) => spectralHorse(b, root, side * 0.67, 2.7, i * 0.37));
  const draft = plain ? draftHorse(b, root, DRAFT_PLACE.x, DRAFT_PLACE.z) : null;
  const seat = group(body, 0, 0.79, 0.08); seat.name = 'rider-seat-feet-origin';
  // Flexible reins: one dynamic line-strip mesh, animated without allocating geometry per frame.
  const reingeo = new THREE.BufferGeometry();
  const positions = new Float32Array((plain ? 2 : 4) * 14 * 6 * 3), colors = new Float32Array(positions.length);
  for (let i = 0; i < colors.length; i += 3) colors.set(C.leather, i);
  reingeo.setAttribute('position', new THREE.BufferAttribute(positions, 3)); reingeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  reingeo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(positions.length / 3 * 2), 2));
  const normals = new Float32Array(positions.length); for (let i = 1; i < normals.length; i += 3) normals[i] = 1;
  reingeo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  const reins = new THREE.Mesh(reingeo, b.material()); reins.frustumCulled = false; root.add(reins);
  return { body, wheels, horses, draft, seat, reins, reinsPosition: reingeo.getAttribute('position') as THREE.BufferAttribute };
}

const bitAt = new THREE.Vector3();
export function animateReins(art: CarriageArt, time: number, speed: number): void {
  const attr = art.reinsPosition;
  const lines = art.draft ? 2 : 4;
  let bit: Point | null = null;
  if (art.draft) {
    const mount = art.draft.root.parent;
    mount?.updateMatrixWorld(true);
    art.draft.bit.getWorldPosition(bitAt);
    mount?.worldToLocal(bitAt);
    bit = [bitAt.x, bitAt.y, bitAt.z];
  }
  let vertex = 0;
  for (let i = 0; i < lines; i++) {
    const horse = i < 2 ? -1 : 1, side = i % 2 ? 1 : -1;
    const start: Point = [art.draft ? side * 0.16 : horse * 0.12, 1.72 + art.body.position.y, 0.48];
    const end: Point = bit
      ? [bit[0] + side * 0.05, bit[1] + Math.sin(time * 5) * Math.min(0.04, speed * 0.006), bit[2]]
      : [horse * 0.67 + side * 0.13, 1.93 + Math.sin(time * 5 + horse) * Math.min(0.065, speed * 0.009), 3.76];
    const point = (t: number): Point => [start[0] + (end[0] - start[0]) * t, start[1] + (end[1] - start[1]) * t - Math.sin(t * Math.PI) * (0.18 + Math.sin(time * 6 + i) * 0.018), start[2] + (end[2] - start[2]) * t];
    for (let j = 0; j < 14; j++) {
      const a = point(j / 14), c = point((j + 1) / 14), r = 0.009;
      for (const p of [[a[0] - r, a[1], a[2]], [a[0] + r, a[1], a[2]], [c[0] + r, c[1], c[2]], [a[0] - r, a[1], a[2]], [c[0] + r, c[1], c[2]], [c[0] - r, c[1], c[2]]]) attr.setXYZ(vertex++, p[0], p[1], p[2]);
    }
  }
  attr.needsUpdate = true;
}
