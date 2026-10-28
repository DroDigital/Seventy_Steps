/** Ground pickups: a weathered Echo casket with escaping light, and a box of revolver cartridges. */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { part, skeleton, type Figure } from './figures';
import { box, tint } from './meshKit';
import { ANOMALY, BASE, mixRgb, scaleRgb, type Rgb } from './palette';

const color = (geo: THREE.BufferGeometry, c: Rgb): THREE.BufferGeometry => tint(geo, c);
const group = (parent: THREE.Object3D, name: string): THREE.Group => {
  const g = new THREE.Group();
  g.name = name;
  parent.add(g);
  return g;
};
const ring = (r: number, tube: number, c: Rgb): THREE.BufferGeometry =>
  color(new THREE.TorusGeometry(r, tube, 4, 24).rotateX(Math.PI / 2), c);

/** A small iron-bound wooden chest, open to a light that escapes in turning fragments. */
export function cacheFigure(): Figure {
  const f = skeleton('prop', { hip: 0, shoulder: [0, 0], hipX: 0, neck: [0, 0] });
  const wood = mixRgb(BASE.rust, BASE.charcoal, 0.42);
  const plank = scaleRgb(wood, 1.45);
  const edge = scaleRgb(BASE.charcoal, 1.65);
  const brass: Rgb = [0.55, 0.4, 0.21];
  // A hollow chest: its sides and bottom leave the contents visible from above.
  const shell = [
    box(0.62, 0.055, 0.42, 0, 0.035, 0, wood),
    box(0.62, 0.29, 0.045, 0, 0.18, 0.19, plank),
    box(0.62, 0.29, 0.045, 0, 0.18, -0.19, plank),
    box(0.045, 0.29, 0.34, -0.287, 0.18, 0, wood),
    box(0.045, 0.29, 0.34, 0.287, 0.18, 0, wood),
    box(0.11, 0.1, 0.025, 0, 0.22, 0.224, brass),
    box(0.025, 0.045, 0.03, 0, 0.22, 0.24, edge),
  ];
  // The iron lies on the outside of the walls, leaving the opening unobstructed.
  for (const y of [0.085, 0.265]) {
    for (const z of [-0.21, 0.21]) shell.push(box(0.63, 0.025, 0.01, 0, y, z, edge));
    for (const x of [-0.31, 0.31]) shell.push(box(0.01, 0.025, 0.41, x, y, 0, edge));
  }
  for (const x of [-0.2, 0.2]) for (const z of [-0.215, 0.215]) shell.push(box(0.04, 0.31, 0.005, x, 0.18, z, edge));
  // Lid and its straps share the same hinge and open back behind the chest.
  for (const g of [box(0.62, 0.065, 0.42, 0, 0, 0.21, plank), box(0.04, 0.075, 0.42, -0.2, 0, 0.21, edge), box(0.04, 0.075, 0.42, 0.2, 0, 0.21, edge)]) {
    shell.push(g.rotateX(-2.05).translate(0, 0.32, -0.19));
  }
  part(f, f.body, mergeGeometries(shell), 'wood');
  const rivets: THREE.BufferGeometry[] = [];
  for (const x of [-0.2, 0.2]) for (const y of [0.1, 0.25]) {
    rivets.push(color(new THREE.SphereGeometry(0.012, 5, 3).translate(x, y, 0.222), brass));
  }
  part(f, f.body, mergeGeometries(rivets), 'cloth', 0.25);
  const green = ANOMALY.green;
  const pale = mixRgb(BASE.bone, green, 0.4);
  const light = group(f.root, 'cache-light');
  light.position.y = 0.32;
  const crystals: THREE.BufferGeometry[] = [];
  for (const [x, z, h, r] of [[-0.16, 0.02, 0.19, 0.065], [0.01, -0.03, 0.29, 0.08], [0.16, 0.06, 0.16, 0.055], [-0.04, 0.1, 0.14, 0.05]] as const) {
    crystals.push(color(new THREE.OctahedronGeometry(r, 0).scale(0.8, h / (2 * r), 0.8).translate(x, h * 0.42, z), green));
  }
  part(f, light, mergeGeometries(crystals), 'cloth', 0.95);
  part(f, light, color(new THREE.OctahedronGeometry(0.045, 0).scale(0.7, 2.5, 0.7).translate(0.01, 0.16, -0.03), pale), 'cloth', 1);
  const orbit = group(f.root, 'cache-orbit');
  orbit.position.y = 0.38;
  const motes: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3, r = 0.28 + (i % 2) * 0.06;
    motes.push(color(new THREE.OctahedronGeometry(0.018 + (i % 2) * 0.008, 0).scale(0.7, 1.7, 0.7).translate(Math.cos(a) * r, 0.08 + (i % 3) * 0.1, Math.sin(a) * r), i % 2 ? green : pale));
  }
  part(f, orbit, mergeGeometries(motes), 'cloth', 1);
  part(f, f.root, ring(0.43, 0.005, scaleRgb(green, 0.45)).translate(0, 0.025, 0), 'cloth', 0.8);
  return f;
}

/** A worn cardboard cartridge box with its lid folded back and individual brass rounds. */
export function ammoFigure(): Figure {
  const f = skeleton('prop', { hip: 0, shoulder: [0, 0], hipX: 0, neck: [0, 0] });
  const card: Rgb = [0.38, 0.24, 0.15];
  const dark: Rgb = [0.16, 0.105, 0.07];
  const paper: Rgb = [0.76, 0.67, 0.48];
  const brass: Rgb = [0.78, 0.58, 0.27];
  const tip: Rgb = [0.56, 0.37, 0.22];
  const shell = [box(0.42, 0.035, 0.29, 0, 0.02, 0, card), box(0.42, 0.13, 0.025, 0, 0.085, 0.132, card), box(0.42, 0.13, 0.025, 0, 0.085, -0.132, card), box(0.025, 0.13, 0.24, -0.197, 0.085, 0, card), box(0.025, 0.13, 0.24, 0.197, 0.085, 0, card), box(0.34, 0.075, 0.003, 0, 0.085, 0.146, paper)];
  // A bordered label and fine ink strokes suggest period packaging without unreadably small text.
  shell.push(box(0.28, 0.006, 0.004, 0, 0.105, 0.149, dark), box(0.22, 0.005, 0.004, 0, 0.079, 0.149, dark), box(0.14, 0.005, 0.004, 0, 0.066, 0.149, dark));
  for (const g of [box(0.42, 0.025, 0.29, 0, 0, 0.145, card), box(0.32, 0.005, 0.2, 0, 0.014, 0.145, paper), box(0.23, 0.008, 0.012, 0, 0.019, 0.12, dark), box(0.17, 0.008, 0.012, 0, 0.019, 0.16, dark)]) shell.push(g.rotateX(-2.05).translate(0, 0.15, -0.13));
  part(f, f.body, mergeGeometries(shell), 'cloth');
  const cases: THREE.BufferGeometry[] = [], tips: THREE.BufferGeometry[] = [];
  for (const z of [-0.065, 0.065]) for (let i = 0; i < 5; i++) {
    const x = -0.15 + i * 0.075;
    cases.push(color(new THREE.CylinderGeometry(0.025, 0.025, 0.12, 8).translate(x, 0.13, z), brass));
    cases.push(color(new THREE.CylinderGeometry(0.029, 0.029, 0.012, 8).translate(x, 0.075, z), brass));
    tips.push(color(new THREE.CylinderGeometry(0.012, 0.025, 0.04, 8).translate(x, 0.21, z), tip));
  }
  // A loose round alongside the box reinforces its identity at a glance.
  cases.push(color(new THREE.CylinderGeometry(0.025, 0.025, 0.12, 8).rotateZ(Math.PI / 2).translate(0.31, 0.027, 0.1), brass));
  tips.push(color(new THREE.CylinderGeometry(0.012, 0.025, 0.04, 8).rotateZ(Math.PI / 2).translate(0.23, 0.027, 0.1), tip));
  part(f, f.body, mergeGeometries(cases), 'cloth', 0.42);
  part(f, f.body, mergeGeometries(tips), 'cloth', 0.3);
  const gleam = group(f.root, 'ammo-gleam');
  gleam.position.set(0, 0.23, 0);
  const glints = [color(new THREE.OctahedronGeometry(0.018, 0).scale(0.5, 2.2, 0.5).translate(-0.15, 0.04, -0.065), paper), color(new THREE.OctahedronGeometry(0.012, 0).scale(0.5, 2, 0.5).translate(0.15, 0.08, 0.065), paper)];
  part(f, gleam, mergeGeometries(glints), 'cloth', 0.85);
  return f;
}

/** Animate only the escaping light and little glints, leaving both containers on the ground. */
export function poseGroundPickup(f: Figure, time: number): void {
  const { light, orbit, gleam } = f.root.userData.pickupParts ??= {
    light: f.root.getObjectByName('cache-light'),
    orbit: f.root.getObjectByName('cache-orbit'),
    gleam: f.root.getObjectByName('ammo-gleam'),
  };
  if (light) light.scale.setScalar(1 + 0.035 * Math.sin(time * 2.3));
  if (orbit) orbit.rotation.y = time * 0.42;
  if (gleam) gleam.scale.setScalar(0.7 + 0.3 * (0.5 + 0.5 * Math.sin(time * 2.1)));
}
