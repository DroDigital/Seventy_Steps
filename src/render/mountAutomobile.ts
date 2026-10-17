/** A coherent c.1914 brass-era touring motorcar: upright radiator, lamps, wooden spokes, stitched canopy and sprung axles. */
import * as THREE from 'three';
import { tint } from './meshKit';
import { MOUNT_COLORS as C, MountBuilder, group, leafSpring, panel, rod, tube, wheel, tuftedSeat, type CoachWheel } from './mountKit';

export interface AutomobileArt { body: THREE.Group; wheels: CoachWheel[]; seat: THREE.Object3D; steering: THREE.Group }
export function automobileArt(b: MountBuilder, root: THREE.Group): AutomobileArt {
  const body = group(root), wheels = [-1, 1].flatMap(side => [wheel(b, root, side * 0.92, -1.13, 0.59, true), wheel(b, root, side * 0.89, 1.07, 0.54, true, true)]);
  body.name = 'brass-era-touring-automobile';
  const coachwork = [panel(1.53, 0.16, 3.05, 0, 0.62, -0.07, C.black), panel(1.49, 0.41, 1.72, 0, 0.94, -0.67, C.black),
    panel(1.28, 0.12, 1.56, 0, 1.17, -0.67, C.leather), panel(1.48, 0.54, 0.15, 0, 1.19, -1.54, C.black),
    panel(1.03, 0.65, 1.21, 0, 1.0, 0.97, C.black, 0.11), panel(1.04, 0.035, 1.22, 0, 1.34, 0.97, C.iron),
    panel(0.93, 0.74, 0.12, 0, 1.03, 1.63, C.brass, 0.11), panel(0.76, 0.58, 0.025, 0, 1.02, 1.7, C.black, 0.06),
    panel(1.54, 0.12, 0.11, 0, 0.49, 1.73, C.iron), panel(0.35, 0.12, 0.025, 0, 0.56, 1.8, C.black),
    panel(0.075, 0.045, 0.025, 0, 1.24, 1.713, C.brass),
    ...tuftedSeat(1.23, 1.11, -0.16), ...tuftedSeat(1.2, 1.12, -1.06),
    rod([-0.96, 0.52, 1.07], [0.96, 0.52, 1.07], 0.055, C.iron), rod([-0.97, 0.57, -1.13], [0.97, 0.57, -1.13], 0.065, C.iron),
  ];
  for (let i = 0; i < 15; i++) coachwork.push(rod([-0.34 + i * 0.049, 0.76, 1.72], [-0.34 + i * 0.049, 1.26, 1.72], 0.007, C.iron));
  for (const side of [-1, 1]) {
    coachwork.push(panel(0.08, 0.44, 1.49, side * 0.73, 1.07, -0.68, C.black), panel(0.09, 0.06, 1.5, side * 0.735, 1.32, -0.68, C.iron),
      panel(0.32, 0.07, 2.23, side * 0.85, 0.55, -0.05, C.black), panel(0.33, 0.025, 1.18, side * 0.85, 0.6, -0.05, C.iron),
      ...leafSpring(side * 0.58, -1.13), ...leafSpring(side * 0.58, 1.07),
      panel(0.025, 0.23, 0.42, side * 0.787, 1.06, -0.29, C.iron), panel(0.035, 0.05, 0.18, side * 0.81, 1.22, -0.24, C.brass));
    for (let i = 0; i < 7; i++) coachwork.push(panel(0.025, 0.22, 0.024, side * 0.535, 1.11, 0.68 + i * 0.095, C.trim, 0.006));
    for (const zz of [-1.13, 1.07]) for (let i = 0; i < 7; i++) {
      const angle = -1.22 + i * 0.407, rad = zz < 0 ? 0.71 : 0.67;
      coachwork.push(panel(0.37, 0.055, 0.31, 0, 0, 0, C.black, 0.015).rotateX(-angle).translate(side * 0.91, 0.53 + Math.cos(angle) * rad, zz + Math.sin(angle) * rad));
    }
    // Headlamps look forward, their deep brass bowls and pale discs distinct from the radiator.
    coachwork.push(tint(new THREE.CylinderGeometry(0.15, 0.15, 0.18, 14).rotateX(Math.PI / 2).translate(side * 0.65, 1.2, 1.58), C.brass),
      rod([side * 0.65, 0.84, 1.48], [side * 0.65, 1.22, 1.48], 0.025, C.iron));
    b.add(body, [tint(new THREE.CylinderGeometry(0.118, 0.118, 0.012, 16).rotateX(Math.PI / 2).translate(side * 0.65, 1.2, 1.68), C.pale)], 'cloth', 0.85);
  }
  // Tread ribs and a period luggage case mounted on the near running board.
  coachwork.push(panel(0.27, 0.31, 0.4, -0.88, 0.77, -0.26, C.wood), panel(0.28, 0.035, 0.41, -0.88, 0.94, -0.26, C.leather));
  for (const zz of [-0.39, -0.13]) coachwork.push(panel(0.015, 0.33, 0.045, -1.022, 0.78, zz, C.brass));
  b.add(body, coachwork);
  const canopy: THREE.BufferGeometry[] = [];
  for (const zz of [-1.52, -0.83, 0.35]) {
    canopy.push(tube([[-0.76, 1.36, zz], [-0.76, 2.23, zz - 0.08], [0, 2.4, zz - 0.08], [0.76, 2.23, zz - 0.08], [0.76, 1.36, zz]], 0.024, C.iron));
  }
  for (let i = 0; i < 8; i++) {
    const xx = -0.77 + i * 0.22, yy = 2.45 - 0.16 * Math.pow(xx / 0.78, 2);
    canopy.push(panel(0.24, 0.055, 2.12, xx, yy, -0.64, C.black, 0.012).rotateZ(0));
  }
  canopy.push(panel(1.58, 0.14, 0.06, 0, 2.22, 0.42, C.leather), panel(1.55, 0.43, 0.05, 0, 2.03, -1.67, C.leather));
  for (const side of [-1, 1]) canopy.push(panel(0.05, 0.69, 0.19, side * 0.76, 1.92, -1.56, C.leather),
    rod([side * 0.76, 1.43, -1.42], [side * 0.76, 2.24, -0.49], 0.018, C.brass), rod([side * 0.76, 1.43, -0.49], [side * 0.76, 2.24, -1.42], 0.018, C.brass));
  // The windshield remains open glass: a thin frame avoids an opaque wall in front of the driver.
  canopy.push(panel(1.47, 0.045, 0.035, 0, 1.51, 0.49, C.iron), panel(1.47, 0.045, 0.035, 0, 2.17, 0.43, C.iron));
  for (const side of [-1, 1]) canopy.push(rod([side * 0.72, 1.48, 0.49], [side * 0.72, 2.2, 0.43], 0.019, C.iron));
  b.add(body, canopy);
  const steering = group(body, 0, 1.5, 0.48); steering.rotation.x = -0.65;
  b.add(steering, [tint(new THREE.TorusGeometry(0.215, 0.019, 6, 20), C.iron), ...[0, 1, 2].map(i => {
    const a = i * Math.PI * 2 / 3; return rod([0, 0, 0], [Math.cos(a) * 0.21, Math.sin(a) * 0.21, 0], 0.012, C.brass);
  })]);
  b.add(body, [rod([0, 0.84, 0.8], [0, 1.5, 0.48], 0.022, C.iron), tube([[-0.21, 0.64, 0.44], [-0.21, 1.12, 0.49], [-0.21, 1.22, 0.4]], 0.015, C.brass)]);
  const seat = group(body, 0, 0.63, -0.16); seat.name = 'rider-seat-feet-origin';
  return { body, wheels, seat, steering };
}
