/** The lost Echoes: a fallen lantern, with its light escaping into the air. */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { part, skeleton, type Figure } from './figures';
import { tint } from './meshKit';
import { ANOMALY, BASE, mixRgb, scaleRgb, type Rgb } from './palette';

const brass: Rgb = [0.63, 0.46, 0.23];
const brightBrass: Rgb = [0.89, 0.71, 0.39];
const green = ANOMALY.green;
const pale = mixRgb(BASE.bone, green, 0.38);

/** A tapered, curving tongue of light, made with flat facets to sit in the game's low-poly world. */
function flame(height: number, radius: number, color: Rgb): THREE.BufferGeometry {
  const sides = 7;
  const rings: readonly [number, number, number][] = [
    [0, 0.20, 0], [0.13, 0.8, -0.03], [0.34, 1, 0], [0.56, 0.73, 0.06],
    [0.77, 0.4, 0.1], [1, 0.015, 0.16],
  ];
  const vertices: number[] = [];
  const indices: number[] = [];
  for (const [y, r, bend] of rings) for (let i = 0; i < sides; i++) {
    const a = i * Math.PI * 2 / sides;
    vertices.push(Math.cos(a) * radius * r + bend * height, y * height, Math.sin(a) * radius * r);
  }
  for (let j = 0; j < rings.length - 1; j++) for (let i = 0; i < sides; i++) {
    const a = j * sides + i, b = j * sides + (i + 1) % sides;
    indices.push(a, a + sides, b, b, a + sides, b + sides);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  // World materials expect UVs even for this untextured, self-lit shape.
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(vertices.length / 3 * 2), 2));
  return tint(geo, color);
}

const ring = (radius: number, tube: number, color: Rgb): THREE.BufferGeometry =>
  tint(new THREE.TorusGeometry(radius, tube, 4, 24).rotateX(Math.PI / 2), color);

export function echoFigure(): Figure {
  const f = skeleton('echo', { hip: 0, shoulder: [0, 0], hipX: 0, neck: [0, 0] });
  // The little lamp lies on its side: cap, foot and eight cage bars keep its silhouette legible.
  const lamp = new THREE.Group();
  lamp.position.set(-0.08, 0.18, 0);
  lamp.rotation.z = -Math.PI / 2;
  f.root.add(lamp);
  const bands: THREE.BufferGeometry[] = [];
  for (const [y, r, h] of [[-0.24, 0.17, 0.055], [0.23, 0.17, 0.055], [0.29, 0.12, 0.055]] as const) {
    bands.push(tint(new THREE.CylinderGeometry(r, r * 1.08, h, 8).translate(0, y, 0), brass));
  }
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    bands.push(tint(new THREE.CylinderGeometry(0.011, 0.011, 0.43, 5).translate(Math.cos(a) * 0.15, 0, Math.sin(a) * 0.15), brightBrass));
  }
  // The carrying loop survives the fall and catches the light.
  bands.push(tint(new THREE.TorusGeometry(0.075, 0.012, 4, 12).translate(0, 0.39, 0), brightBrass));
  part(f, lamp, mergeGeometries(bands), 'wood', 0.28);
  const chamber = tint(new THREE.IcosahedronGeometry(0.145, 0).scale(1, 1.35, 1), mixRgb(green, BASE.seaGrey, 0.32));
  part(f, lamp, chamber, 'cloth', 0.8);

  // The ground marks are stationary in height; the light above them breathes independently.
  const halo = new THREE.Group();
  halo.name = 'echo-halo';
  halo.position.y = 0.025;
  f.root.add(halo);
  part(f, halo, mergeGeometries([ring(0.34, 0.008, scaleRgb(green, 0.55)), ring(0.46, 0.004, scaleRgb(green, 0.4))]), 'cloth', 0.8);
  const light = new THREE.Group();
  light.name = 'echo-flame';
  light.position.y = 0.28;
  f.root.add(light);
  // Separate tongues leave the pale heart visible from every side instead of enclosing it.
  const tongues: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 3; i++) {
    const a = i * Math.PI * 2 / 3;
    tongues.push(flame(0.29 + i * 0.035, 0.055, green).rotateY(-a).translate(Math.cos(a) * 0.105, 0, Math.sin(a) * 0.105));
  }
  part(f, light, mergeGeometries(tongues), 'cloth', 0.95);
  part(f, light, flame(0.47, 0.07, pale), 'cloth', 1);
  const orbit = new THREE.Group();
  orbit.name = 'echo-orbit';
  orbit.position.y = 0.28;
  f.root.add(orbit);
  const motes: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 7; i++) {
    const a = i * Math.PI * 2 / 7 + 0.3, r = 0.26 + (i % 3) * 0.055;
    const mote = new THREE.OctahedronGeometry(i % 3 === 0 ? 0.035 : 0.022, 0);
    mote.scale(0.7, 1.7, 0.7).translate(Math.cos(a) * r, 0.08 + (i % 4) * 0.1, Math.sin(a) * r);
    motes.push(tint(mote, i % 2 ? green : pale));
  }
  part(f, orbit, mergeGeometries(motes), 'cloth', 1);
  return f;
}
