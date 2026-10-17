/** A carriage horse lofted in metres, facing +z, hooves at y = 0. Coat colour is on the vertices. */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { hash2 } from '../core/rng';
import { tint } from './meshKit';
import { BASE, mixRgb, scaleRgb, type Rgb } from './palette';

type V3 = [number, number, number];
export interface Station { p: V3; rx: number; ry: number; color: Rgb }

const COAT = scaleRgb(mixRgb(BASE.rust, BASE.bone, 0.34), 1.22);
const POINT = scaleRgb(BASE.charcoal, 0.95);
const MUZZLE = mixRgb(COAT, BASE.bone, 0.62);
const HOOF = scaleRgb(BASE.charcoal, 0.62);
const MANE = scaleRgb(BASE.charcoal, 0.72);
const EYE = scaleRgb(BASE.charcoal, 0.35);
const BRASS = scaleRgb(mixRgb(BASE.bone, BASE.rust, 0.36), 1.15);
const SIDES = 28;
const GRAIN = 0.16;

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: V3, b: V3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const add = (a: V3, b: V3, s = 1): V3 => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
const norm = (a: V3): V3 => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

function shadeForm(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  const pos = geo.getAttribute('position');
  const nrm = geo.getAttribute('normal');
  const col = geo.getAttribute('color');
  for (let i = 0; i < pos.count; i++) {
    const ny = Math.max(-1, Math.min(1, nrm.getY(i)));
    const up = 0.5 + 0.5 * ny;
    let k = 0.34 + 0.66 * up * up;
    if (ny > 0.72) k *= 0.78;
    k *= 0.84 + 0.16 * hash2(Math.floor(pos.getX(i) * 6 + pos.getY(i) * 2), Math.floor(pos.getZ(i) * 6), 11);
    col.setXYZ(i, col.getX(i) * k, col.getY(i) * k, col.getZ(i) * k);
  }
  col.needsUpdate = true;
  return geo;
}

/** Closed loft. The texture seam sits on the underside. `ry` is the up/forward radius, `rx` the width. */
export function loft(stations: readonly Station[], sides = SIDES): THREE.BufferGeometry {
  const tangents: V3[] = stations.map((_, i) => {
    const a = stations[Math.max(0, i - 1)].p;
    const b = stations[Math.min(stations.length - 1, i + 1)].p;
    return norm(sub(b, a));
  });
  let guide: V3 = Math.abs(tangents[0][1]) > 0.85 ? [0, 0, 1] : [0, 1, 0];
  guide = norm(add(guide, tangents[0], -dot(guide, tangents[0])));
  const frames = tangents.map((t) => {
    let n = add(guide, t, -dot(guide, t));
    if (Math.hypot(...n) < 1e-5) n = Math.abs(t[1]) > 0.85 ? cross(t, [1, 0, 0]) : cross(t, [0, 1, 0]);
    guide = norm(n);
    return { n: guide, b: norm(cross(t, guide)) };
  });
  const arc = [0];
  for (let r = 1; r < stations.length; r++) arc.push(arc[r - 1] + Math.hypot(...sub(stations[r].p, stations[r - 1].p)));
  const verts: number[] = [];
  const cols: number[] = [];
  const uvs: number[] = [];
  const idx: number[] = [];
  const row = sides + 1;
  stations.forEach((s, r) => {
    const circ = Math.PI * (s.rx + s.ry);
    for (let i = 0; i <= sides; i++) {
      const t = i / sides;
      const a = Math.PI * (1 + 2 * t);
      const p = add(add(s.p, frames[r].n, Math.cos(a) * s.ry), frames[r].b, Math.sin(a) * s.rx);
      verts.push(...p);
      cols.push(...s.color);
      uvs.push((t * circ) / GRAIN, arc[r] / GRAIN);
    }
  });
  for (let r = 0; r < stations.length - 1; r++) for (let i = 0; i < sides; i++) {
    const a = r * row + i;
    const b = a + row;
    idx.push(a, a + 1, b, a + 1, b + 1, b);
  }
  const cap = (r: number, flip: boolean): void => {
    const c = verts.length / 3;
    verts.push(...stations[r].p);
    cols.push(...stations[r].color);
    uvs.push(0, arc[r] / GRAIN);
    const base = r * row;
    for (let i = 0; i < sides; i++) idx.push(c, ...(flip ? [base + i + 1, base + i] : [base + i, base + i + 1]));
  };
  cap(0, false);
  cap(stations.length - 1, true);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return shadeForm(geo);
}

function join(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const geo = mergeGeometries(parts, false);
  if (!geo) throw new Error('horse parts do not share attributes');
  for (const p of parts) p.dispose();
  return geo;
}

const coat = (p: V3, rx: number, ry: number): Station => ({ p, rx, ry, color: COAT });

export function horseBody(): THREE.BufferGeometry {
  return loft([
    coat([0, 1.14, -1.08], 0.1, 0.11),
    coat([0, 1.3, -0.88], 0.18, 0.18),
    coat([0, 1.34, -0.62], 0.26, 0.26),
    coat([0, 1.24, -0.28], 0.28, 0.24),
    coat([0, 1.16, 0.02], 0.32, 0.34),
    coat([0, 1.12, 0.28], 0.3, 0.36),
    coat([0, 1.34, 0.52], 0.2, 0.28),
    coat([0, 1.14, 0.7], 0.15, 0.2),
    coat([0, 0.98, 0.86], 0.09, 0.11),
  ]);
}

export const NECK_AT: V3 = [0, 1.3, 0.48];
export const POLL: V3 = [0, 0.5, 0.54];

export function horseNeck(): THREE.BufferGeometry {
  return loft([
    coat([0, 0.02, -0.02], 0.15, 0.17),
    coat([0, 0.12, 0.1], 0.11, 0.13),
    coat([0, 0.26, 0.24], 0.09, 0.1),
    coat([0, 0.4, 0.4], 0.075, 0.082),
    coat(POLL, 0.064, 0.07),
  ], 20);
}

export function horseMane(): THREE.BufferGeometry {
  return loft([
    { p: [0, 0.24, 0.02], rx: 0.03, ry: 0.07, color: MANE },
    { p: [0, 0.34, 0.16], rx: 0.035, ry: 0.09, color: MANE },
    { p: [0, 0.44, 0.32], rx: 0.032, ry: 0.09, color: MANE },
    { p: [0, 0.52, 0.46], rx: 0.026, ry: 0.08, color: MANE },
    { p: [0, 0.4, 0.6], rx: 0.02, ry: 0.05, color: MANE },
  ], 10);
}

export function horseHead(): THREE.BufferGeometry {
  const bone = mixRgb(COAT, MUZZLE, 0.4);
  const lip = mixRgb(MUZZLE, POINT, 0.28);
  const head = loft([
    coat([0, 0.0, -0.02], 0.07, 0.08),
    coat([0, 0.05, 0.08], 0.1, 0.12),
    coat([0, 0.02, 0.2], 0.125, 0.11),
    { p: [0, -0.02, 0.36], rx: 0.065, ry: 0.055, color: bone },
    { p: [0, -0.08, 0.5], rx: 0.078, ry: 0.07, color: MUZZLE },
    { p: [0, -0.12, 0.6], rx: 0.062, ry: 0.055, color: lip },
  ], 22);
  const jaw = loft([
    coat([0, -0.08, 0.1], 0.09, 0.055),
    { p: [0, -0.18, 0.28], rx: 0.075, ry: 0.05, color: bone },
    { p: [0, -0.16, 0.46], rx: 0.055, ry: 0.04, color: lip },
  ], 12);
  const ear = (side: number): THREE.BufferGeometry => loft([
    coat([side * 0.04, 0.1, -0.02], 0.045, 0.03),
    coat([side * 0.048, 0.24, -0.04], 0.03, 0.02),
    { p: [side * 0.05, 0.42, -0.06], rx: 0.012, ry: 0.01, color: mixRgb(COAT, POINT, 0.5) },
  ], 8);
  const eye = (side: number): THREE.BufferGeometry => tint(new THREE.SphereGeometry(0.04, 10, 8).translate(side * 0.13, 0.03, 0.2), EYE);
  const nostril = (side: number): THREE.BufferGeometry => tint(new THREE.SphereGeometry(0.026, 8, 6).translate(side * 0.045, -0.11, 0.55), POINT);
  const bit = tint(new THREE.CylinderGeometry(0.012, 0.012, 0.18, 8).rotateZ(Math.PI / 2).translate(0, -0.16, 0.58), BRASS);
  return join([head, jaw, ear(-1), ear(1), eye(-1), eye(1), nostril(-1), nostril(1), bit]);
}

export const DOCK: V3 = [0, 1.18, -1.02];

export function horseTail(): THREE.BufferGeometry {
  return loft([
    { p: [0, 0.02, 0.0], rx: 0.05, ry: 0.05, color: MANE },
    { p: [0, -0.22, -0.06], rx: 0.08, ry: 0.07, color: MANE },
    { p: [0, -0.5, -0.04], rx: 0.1, ry: 0.08, color: MANE },
    { p: [0, -0.78, 0.0], rx: 0.07, ry: 0.055, color: MANE },
    { p: [0, -0.98, 0.02], rx: 0.035, ry: 0.03, color: MANE },
  ], 12);
}

/** Hip at the origin, hoof at y = -(L1+L2). The knee station is the weight boundary. */
export function horseLeg(L1: number, L2: number, front: boolean): THREE.BufferGeometry {
  const knee = -L1;
  const hoof = -(L1 + L2);
  const kz = front ? 0.05 : -0.045;
  const mid = mixRgb(COAT, POINT, 0.4);
  const coronet = mixRgb(POINT, BASE.bone, 0.42);
  return loft([
    coat([0, 0.04, front ? 0.04 : -0.03], 0.12, 0.15),
    coat([0, knee * 0.5, kz], 0.075, 0.11),
    { p: [0, knee, kz * 1.6], rx: 0.055, ry: 0.1, color: mid },
    { p: [0, knee - 0.1, kz * 0.2], rx: 0.042, ry: 0.058, color: POINT },
    { p: [0, hoof + 0.2, 0.015], rx: 0.036, ry: 0.048, color: POINT },
    { p: [0, hoof + 0.1, 0.03], rx: 0.046, ry: 0.062, color: coronet },
    { p: [0, hoof + 0.04, 0.05], rx: 0.06, ry: 0.1, color: HOOF },
    { p: [0, hoof, 0.055], rx: 0.064, ry: 0.12, color: HOOF },
  ], 16);
}
