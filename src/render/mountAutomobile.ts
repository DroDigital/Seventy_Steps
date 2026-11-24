/**
 * The Brassbound Motor Car: a coherent c.1914 brass-era touring automobile built in Three.js procedural geometry.
 * Features swept continuous S-curve fenders, tapered louvered bonnet, chamfered brass radiator with winged Moto-Meter
 * and spinning cooling fan, sculpted rounded rear tonneau, diamond-tufted leather seats, mahogany instrument dash,
 * left-hand 4-spoke steering wheel, animated brass gear lever, coiled brass bulb horn, running-board Prest-O-Lite
 * acetylene tank and strapped luggage chest, rear-mounted spare artillery wheel, graceful fanned folding canopy with
 * open rear sightline window, twin brass acetylene headlamps with warm halos and volumetric cones, cowl lanterns,
 * and a brake-reactive ruby tail-lamp.
 */
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { prism } from './bodyKit';
import { createHalos, type Halos } from './halos';
import { box, tint } from './meshKit';
import { MountBuilder, group, panel, rod, tube, type CoachWheel, type Point } from './mountKit';
import { BASE, mixRgb, type Rgb } from './palette';
import { worldUniforms } from './worldMaterial';
import type { CarPose } from './automobileMotion';

// ---- Rich 1914 brass-era palette (dark charcoal-black enamel, warm aged brass, mahogany, oxblood leather) ----
const CAR_COLORS = {
  enamel: [0.165, 0.172, 0.195] as Rgb,
  enamelHi: [0.255, 0.268, 0.305] as Rgb,
  enamelDeep: [0.095, 0.1, 0.115] as Rgb,
  chassis: [0.13, 0.135, 0.15] as Rgb,
  iron: mixRgb(BASE.charcoal, BASE.seaGrey, 0.42),
  steel: [0.44, 0.46, 0.51] as Rgb,
  brass: [0.96, 0.72, 0.33] as Rgb,
  brassHi: [1.18, 0.92, 0.48] as Rgb,
  brassDark: [0.6, 0.43, 0.19] as Rgb,
  mahogany: [0.34, 0.16, 0.095] as Rgb,
  hickory: [0.58, 0.35, 0.2] as Rgb,
  hickoryDark: [0.38, 0.22, 0.12] as Rgb,
  leather: [0.24, 0.12, 0.1] as Rgb,
  leatherHi: [0.35, 0.18, 0.14] as Rgb,
  canvas: [0.19, 0.185, 0.175] as Rgb,
  canvasHi: [0.26, 0.255, 0.24] as Rgb,
  canvasDark: [0.125, 0.12, 0.115] as Rgb,
  rubber: [0.115, 0.118, 0.128] as Rgb,
  sidewall: [0.22, 0.215, 0.21] as Rgb,
  plate: [0.76, 0.72, 0.62] as Rgb,
  lampGlow: [1.28, 1.06, 0.72] as Rgb,
  cowlGlow: [1.16, 0.78, 0.36] as Rgb,
  tailGlow: [1.15, 0.14, 0.1] as Rgb,
  dialFace: [0.82, 0.76, 0.64] as Rgb,
};

const HALO_HEAD: Rgb = [1.0, 0.86, 0.56];
const HALO_COWL: Rgb = [1.0, 0.68, 0.3];
const HALO_TAIL: Rgb = [1.0, 0.14, 0.1];

export interface AutomobileArt {
  body: THREE.Group;
  wheels: CoachWheel[];
  seat: THREE.Object3D;
  steering: THREE.Group;
  /** Animated sub-assemblies driven by `automobileMotion.ts` every frame. */
  canopy: THREE.Group;
  hood: THREE.Group;
  fan: THREE.Group;
  shifter: THREE.Group;
  tieRod: THREE.Group;
  beamMaterial: THREE.ShaderMaterial;
  halos: Halos;
  updateLights(pose: CarPose, ghost: number): void;
}

const mixC = (a: Rgb, b: Rgb, t: number): Rgb => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

/** Builds an indexed geometry from raw unindexed triangle lists with smooth shading, box UVs and vertex colors. */
function makeMeshGeo(pos: number[], col: number[]): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  const uv = new Float32Array((pos.length / 3) * 2);
  for (let i = 0; i < pos.length / 3; i++) {
    uv[i * 2] = pos[i * 3 + 2] * 0.8 + pos[i * 3] * 0.5;
    uv[i * 2 + 1] = pos[i * 3 + 1] * 0.9;
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return mergeVertices(g);
}

/**
 * Sweeps a continuous crowned, lipped sheet-metal ribbon along a Y-Z centerline curve (ordered front +z to back -z).
 * Outward normal is (-dz, +dy), guaranteed upward/outward around every wheel arch with zero flipped faces.
 */
function sweptFender(
  pts: readonly (readonly [z: number, y: number])[],
  xCenter: number,
  halfW: number,
  side: -1 | 1,
  crown = 0.035,
  thick = 0.032,
  lip = 0.048,
): THREE.BufferGeometry {
  const rings: [number, number, number][][] = [];
  const ringCols: Rgb[][] = [];
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const [z, y] = pts[i]!;
    const [z0, y0] = pts[Math.max(0, i - 1)]!;
    const [z1, y1] = pts[Math.min(n - 1, i + 1)]!;
    let [dz, dy] = [z1 - z0, y1 - y0];
    const len = Math.hypot(dz, dy) || 1;
    dz /= len;
    dy /= len;
    // Points run front (+z) -> back (-z), so dz <= 0; outward/upward normal is (ny = -dz, nz = dy).
    const ny = -dz;
    const nz = dy;
    const innerX = xCenter - side * halfW;
    const midX = xCenter;
    const outerX = xCenter + side * halfW;
    const outLipX = xCenter + side * (halfW + 0.014);
    const flare = i === 0 || i === n - 1 ? 0.55 : 1;
    const c = crown * flare;
    const l = lip * flare;
    const ring: [number, number, number][] = [
      [innerX, y, z],
      [midX, y + ny * c, z + nz * c],
      [outerX, y + ny * (c * 0.25), z + nz * (c * 0.25)],
      [outLipX, y - ny * l, z - nz * l],
      [outerX - side * 0.02, y - ny * (l + thick * 0.4), z - nz * (l + thick * 0.4)],
      [innerX, y - ny * thick, z - nz * thick],
    ];
    const hi = mixC(CAR_COLORS.enamel, CAR_COLORS.enamelHi, Math.max(0, ny) * 0.85);
    const cols: Rgb[] = [
      CAR_COLORS.enamel,
      hi,
      mixC(CAR_COLORS.enamel, CAR_COLORS.enamelHi, 0.4),
      CAR_COLORS.enamelDeep,
      CAR_COLORS.enamelDeep,
      CAR_COLORS.enamelDeep,
    ];
    rings.push(ring);
    ringCols.push(cols);
  }
  const pos: number[] = [];
  const col: number[] = [];
  const pushTri = (a: [number, number, number], ca: Rgb, b: [number, number, number], cb: Rgb, c: [number, number, number], cc: Rgb): void => {
    if (side < 0) {
      pos.push(...a, ...c, ...b);
      col.push(...ca, ...cc, ...cb);
    } else {
      pos.push(...a, ...b, ...c);
      col.push(...ca, ...cb, ...cc);
    }
  };
  const m = 6;
  for (let i = 0; i < n - 1; i++) {
    for (let k = 0; k < m; k++) {
      const k2 = (k + 1) % m;
      const [a, b, c, d] = [rings[i]![k]!, rings[i]![k2]!, rings[i + 1]![k2]!, rings[i + 1]![k]!];
      const [ca, cb, cc, cd] = [ringCols[i]![k]!, ringCols[i]![k2]!, ringCols[i + 1]![k2]!, ringCols[i + 1]![k]!];
      pushTri(a, ca, b, cb, c, cc);
      pushTri(a, ca, c, cc, d, cd);
    }
  }
  for (const [end, flip] of [[0, true], [n - 1, false]] as const) {
    const r = rings[end]!;
    const rc = ringCols[end]!;
    for (let k = 1; k < m - 1; k++) {
      if (flip) pushTri(r[0]!, rc[0]!, r[k + 1]!, rc[k + 1]!, r[k]!, rc[k]!);
      else pushTri(r[0]!, rc[0]!, r[k]!, rc[k]!, r[k + 1]!, rc[k + 1]!);
    }
  }
  return makeMeshGeo(pos, col);
}

/**
 * Lofts a closed symmetric profile along increasing Z (tapered 1914 hood/bonnet, brass radiator shell and swept scuttle cowl).
 */
interface HoodStation { z: number; y0: number; yS: number; yTop: number; w0: number; wS: number; wT: number }
function loftSymmetricHood(stations: readonly HoodStation[], base: Rgb, hi: Rgb, deep: Rgb): THREE.BufferGeometry {
  const rings: [number, number, number][][] = [];
  const cols: Rgb[][] = [];
  for (const s of stations) {
    const ring: [number, number, number][] = [
      [-s.w0, s.y0, s.z],
      [-s.wS, s.yS, s.z],
      [-s.wT, s.yTop - 0.03, s.z],
      [0, s.yTop, s.z],
      [s.wT, s.yTop - 0.03, s.z],
      [s.wS, s.yS, s.z],
      [s.w0, s.y0, s.z],
    ];
    const rc: Rgb[] = [deep, base, mixC(base, hi, 0.55), hi, mixC(base, hi, 0.55), base, deep];
    rings.push(ring);
    cols.push(rc);
  }
  const pos: number[] = [];
  const col: number[] = [];
  const tri = (a: [number, number, number], ca: Rgb, b: [number, number, number], cb: Rgb, c: [number, number, number], cc: Rgb): void => {
    pos.push(...a, ...b, ...c);
    col.push(...ca, ...cb, ...cc);
  };
  const m = rings[0]!.length;
  // Stations increase in +z while ring advances -x -> +y -> +x, so outward normal uses (a, c, b) & (a, d, c).
  for (let i = 0; i < stations.length - 1; i++) {
    for (let k = 0; k < m; k++) {
      const k2 = (k + 1) % m;
      tri(rings[i]![k]!, cols[i]![k]!, rings[i + 1]![k2]!, cols[i + 1]![k2]!, rings[i]![k2]!, cols[i]![k2]!);
      tri(rings[i]![k]!, cols[i]![k]!, rings[i + 1]![k]!, cols[i + 1]![k]!, rings[i + 1]![k2]!, cols[i + 1]![k2]!);
    }
  }
  for (const [end, flip] of [[0, false], [stations.length - 1, true]] as const) {
    const r = rings[end]!;
    const rc = cols[end]!;
    for (let k = 1; k < m - 1; k++) {
      if (flip) tri(r[0]!, rc[0]!, r[k + 1]!, rc[k + 1]!, r[k]!, rc[k]!);
      else tri(r[0]!, rc[0]!, r[k]!, rc[k]!, r[k + 1]!, rc[k + 1]!);
    }
  }
  return makeMeshGeo(pos, col);
}

/**
 * Curved U-shaped rear tonneau wall with smoothly rounded rear corners and subtle tumblehome flare.
 * Sweeps along a 2D (x, z) path from +x side around the curved back to -x side with solid outward-wound faces.
 */
function curvedTonneauWall(): THREE.BufferGeometry {
  const path: [number, number, number][] = []; // [x, z, topY]
  const add = (x: number, z: number, topY: number): void => void path.push([x, z, topY]);
  add(0.68, -0.52, 1.32);
  add(0.69, -0.92, 1.34);
  add(0.68, -1.24, 1.37);
  for (let i = 1; i <= 5; i++) {
    const a = (i / 5) * (Math.PI / 2);
    add(0.42 + Math.cos(a) * 0.26, -1.34 - Math.sin(a) * 0.26, 1.37 + (i / 5) * 0.06);
  }
  add(0, -1.62, 1.44);
  for (let i = 0; i <= 5; i++) {
    const a = (i / 5) * (Math.PI / 2);
    add(-0.42 - Math.sin(a) * 0.26, -1.34 - Math.cos(a) * 0.26, 1.43 - (i / 5) * 0.06);
  }
  add(-0.69, -0.92, 1.34);
  add(-0.68, -0.52, 1.32);

  const wallT = 0.095;
  const yBot = 0.63;
  const pos: number[] = [];
  const col: number[] = [];
  const tri = (a: [number, number, number], ca: Rgb, b: [number, number, number], cb: Rgb, c: [number, number, number], cc: Rgb): void => {
    pos.push(...a, ...b, ...c);
    col.push(...ca, ...cb, ...cc);
  };
  const rings: [number, number, number][][] = [];
  const rCols: Rgb[][] = [];
  for (let i = 0; i < path.length; i++) {
    const [x, z, yTop] = path[i]!;
    const [x0, z0] = path[Math.max(0, i - 1)]!;
    const [x1, z1] = path[Math.min(path.length - 1, i + 1)]!;
    const dx = x1 - x0;
    const dz = z1 - z0;
    const len = Math.hypot(dx, dz) || 1;
    const nx = -dz / len;
    const nz = dx / len;
    const flare = 0.045;
    const r: [number, number, number][] = [
      [x - nx * wallT, yBot, z - nz * wallT],
      [x, yBot, z],
      [x + nx * (flare * 0.7), yBot + (yTop - yBot) * 0.52, z + nz * (flare * 0.7)],
      [x + nx * flare, yTop, z + nz * flare],
      [x + nx * (flare - wallT * 0.5), yTop + 0.025, z + nz * (flare - wallT * 0.5)],
      [x - nx * wallT, yTop - 0.02, z - nz * wallT],
    ];
    const rc: Rgb[] = [
      CAR_COLORS.enamelDeep,
      CAR_COLORS.enamelDeep,
      CAR_COLORS.enamel,
      CAR_COLORS.enamelHi,
      CAR_COLORS.iron,
      CAR_COLORS.enamelDeep,
    ];
    rings.push(r);
    rCols.push(rc);
  }
  const m = 6;
  for (let i = 0; i < rings.length - 1; i++) {
    for (let k = 0; k < m; k++) {
      const k2 = (k + 1) % m;
      tri(rings[i]![k]!, rCols[i]![k]!, rings[i + 1]![k2]!, rCols[i + 1]![k2]!, rings[i]![k2]!, rCols[i]![k2]!);
      tri(rings[i]![k]!, rCols[i]![k]!, rings[i + 1]![k]!, rCols[i + 1]![k]!, rings[i + 1]![k2]!, rCols[i + 1]![k2]!);
    }
  }
  for (const [end, flip] of [[0, false], [rings.length - 1, true]] as const) {
    const r = rings[end]!;
    const rc = rCols[end]!;
    for (let k = 1; k < m - 1; k++) {
      if (flip) tri(r[0]!, rc[0]!, r[k + 1]!, rc[k + 1]!, r[k]!, rc[k]!);
      else tri(r[0]!, rc[0]!, r[k]!, rc[k]!, r[k + 1]!, rc[k + 1]!);
    }
  }
  return makeMeshGeo(pos, col);
}

/** Authentic 1914 artillery wheel: plump pneumatic tire with weathered sidewall, steel demountable rim + brass lugs, hickory felloe, 12 tapered wooden spokes, iron hub flange and domed brass hubcap. */
function artilleryWheelGeos(radius: number, withBrakeDrum: boolean, side: -1 | 1): THREE.BufferGeometry[] {
  const out: THREE.BufferGeometry[] = [];
  const tireTube = 0.068;
  const tireR = radius - tireTube;
  // Main dark rubber tread torus + proud weathered grey outer sidewall ring
  out.push(
    tint(new THREE.TorusGeometry(tireR, tireTube, 5, 16).rotateY(Math.PI / 2), CAR_COLORS.rubber),
    tint(new THREE.TorusGeometry(tireR - 0.012, 0.032, 3, 14).rotateY(Math.PI / 2).translate(side * 0.044, 0, 0), CAR_COLORS.sidewall),
  );
  // Steel demountable rim + warm hickory felloe ring
  out.push(
    tint(new THREE.TorusGeometry(tireR - 0.072, 0.022, 3, 14).rotateY(Math.PI / 2), CAR_COLORS.iron),
    tint(new THREE.TorusGeometry(tireR - 0.102, 0.03, 3, 14).rotateY(Math.PI / 2), CAR_COLORS.hickory),
  );
  // 6 brass demountable rim clamp lugs around outer face
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    const rr = tireR - 0.088;
    out.push(box(0.024, 0.034, 0.034, side * 0.048, Math.sin(a) * rr, Math.cos(a) * rr, CAR_COLORS.brass));
  }
  // 12 turned, tapered hickory artillery spokes (chunkier shoulder near hub, slender toward felloe)
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    const inner = 0.095;
    const outer = tireR - 0.11;
    out.push(rod([0, Math.sin(a) * inner, Math.cos(a) * inner], [0, Math.sin(a) * outer, Math.cos(a) * outer], 0.025, i % 2 ? CAR_COLORS.hickory : mixC(CAR_COLORS.hickory, CAR_COLORS.hickoryDark, 0.25), 0.016));
  }
  // Heavy iron hub flange, bolt circle and domed tarnished-brass hubcap
  out.push(
    tint(new THREE.CylinderGeometry(0.115, 0.115, 0.09, 8).rotateZ(Math.PI / 2), CAR_COLORS.iron),
    tint(new THREE.CylinderGeometry(0.056, 0.068, 0.15, 7).rotateZ(Math.PI / 2).translate(side * 0.03, 0, 0), CAR_COLORS.brass),
    tint(new THREE.SphereGeometry(0.054, 6, 4).scale(0.6, 1, 1).translate(side * 0.102, 0, 0), CAR_COLORS.brassHi),
  );
  if (withBrakeDrum) {
    out.push(tint(new THREE.CylinderGeometry(0.185, 0.185, 0.075, 8).rotateZ(Math.PI / 2).translate(-side * 0.085, 0, 0), CAR_COLORS.chassis));
  }
  return out;
}

function artilleryWheel(b: MountBuilder, parent: THREE.Object3D, x: number, z: number, radius: number, steer: boolean, brakeDrum: boolean): CoachWheel {
  const pivot = group(parent, x, radius, z);
  const spin = group(pivot);
  b.add(spin, artilleryWheelGeos(radius, brakeDrum, x >= 0 ? 1 : -1));
  return { pivot, spin, radius, x, z, steer };
}

/** Plush rolled-top tufted oxblood-leather touring bench seat with curved bolsters and brass buttons. */
function plushBench(width: number, y: number, z: number, backH = 0.56): THREE.BufferGeometry[] {
  const out: THREE.BufferGeometry[] = [
    // Deep spring seat cushion + rounded front knee bolster roll
    box(width, 0.16, 0.54, 0, y, z, CAR_COLORS.leather),
    tint(new THREE.CylinderGeometry(0.082, 0.082, width - 0.02, 7).rotateZ(Math.PI / 2).translate(0, y + 0.01, z + 0.24), CAR_COLORS.leatherHi),
    // Backrest shell & padded leather face + rolled top bolster
    box(width + 0.04, backH, 0.11, 0, y + backH * 0.5, z - 0.27, CAR_COLORS.enamelDeep),
    box(width - 0.02, backH - 0.05, 0.08, 0, y + backH * 0.5, z - 0.21, CAR_COLORS.leather),
    tint(new THREE.CylinderGeometry(0.072, 0.072, width, 7).rotateZ(Math.PI / 2).translate(0, y + backH, z - 0.23), CAR_COLORS.leatherHi),
  ];
  // Vertical leather pleats and brass upholstery studs
  const pleats = 7;
  for (let i = 0; i < pleats; i++) {
    const x = -width * 0.41 + (i / (pleats - 1)) * width * 0.82;
    out.push(box(0.04, backH - 0.14, 0.036, x, y + backH * 0.52, z - 0.165, CAR_COLORS.leatherHi));
    out.push(box(0.04, 0.032, 0.36, x, y + 0.082, z + 0.02, CAR_COLORS.leatherHi));
    for (const h of [0.18, 0.36]) {
      out.push(box(0.022, 0.022, 0.018, x, y + h, z - 0.142, CAR_COLORS.brass));
    }
  }
  return out;
}

/** Sculpted bell-shaped 1914 brass acetylene headlamp with tiered carbide chimney vent and Y-fork bracket. */
function acetyleneHeadlamp(side: -1 | 1): { solid: THREE.BufferGeometry[]; lens: THREE.BufferGeometry[] } {
  const x = side * 0.55;
  const y = 1.12;
  const z = 1.57;
  const solid: THREE.BufferGeometry[] = [
    // Deep bell rear housing -> main brass barrel -> flared lens bezel
    tint(new THREE.SphereGeometry(0.125, 8, 6).scale(1, 1, 0.72).translate(x, y, z - 0.075), CAR_COLORS.brassDark),
    tint(new THREE.CylinderGeometry(0.142, 0.128, 0.16, 10).rotateX(Math.PI / 2).translate(x, y, z), CAR_COLORS.brass),
    tint(new THREE.TorusGeometry(0.146, 0.022, 4, 12).translate(x, y, z + 0.082), CAR_COLORS.brassHi),
    // Iconic tiered acetylene chimney vent cap perched atop the lamp
    tint(new THREE.CylinderGeometry(0.042, 0.056, 0.055, 8).translate(x, y + 0.155, z + 0.01), CAR_COLORS.brassDark),
    tint(new THREE.CylinderGeometry(0.068, 0.068, 0.022, 8).translate(x, y + 0.19, z + 0.01), CAR_COLORS.brassHi),
    tint(new THREE.SphereGeometry(0.036, 6, 4).scale(1, 0.55, 1).translate(x, y + 0.205, z + 0.01), CAR_COLORS.brass),
    // Forged Y-shaped iron fork bracket down to front chassis frame horn
    rod([x, 0.62, 1.54], [x, y - 0.14, z - 0.01], 0.02, CAR_COLORS.iron),
    rod([x, y - 0.14, z - 0.01], [x - 0.135, y, z - 0.01], 0.015, CAR_COLORS.iron),
    rod([x, y - 0.14, z - 0.01], [x + 0.135, y, z - 0.01], 0.015, CAR_COLORS.iron),
    rod([x, 0.62, 1.54], [side * 0.43, 0.60, 1.52], 0.018, CAR_COLORS.iron),
  ];
  const lens = [
    tint(new THREE.SphereGeometry(0.128, 8, 6).scale(1, 1, 0.25).translate(x, y, z + 0.08), CAR_COLORS.lampGlow),
  ];
  return { solid, lens };
}

/** Graceful 1914 brass side cowl oil lantern mounted beside the firewall/windscreen base. */
function cowlLantern(side: -1 | 1): { solid: THREE.BufferGeometry[]; lens: THREE.BufferGeometry[] } {
  const x = side * 0.66;
  const y = 1.48;
  const z = 0.43;
  const solid: THREE.BufferGeometry[] = [
    rod([side * 0.58, y - 0.06, z], [x, y - 0.05, z], 0.013, CAR_COLORS.iron),
    tint(new THREE.CylinderGeometry(0.055, 0.048, 0.045, 8).translate(x, y - 0.075, z), CAR_COLORS.brassDark),
    tint(new THREE.CylinderGeometry(0.058, 0.058, 0.025, 8).translate(x, y + 0.075, z), CAR_COLORS.brassHi),
    tint(new THREE.ConeGeometry(0.052, 0.05, 8).translate(x, y + 0.11, z), CAR_COLORS.brass),
    ...[-1, 1].map((s) => rod([x + s * 0.044, y - 0.055, z + 0.02], [x + s * 0.044, y + 0.065, z + 0.02], 0.008, CAR_COLORS.brass)),
  ];
  const lens = [
    tint(new THREE.CylinderGeometry(0.042, 0.042, 0.1, 10).translate(x, y, z), CAR_COLORS.cowlGlow),
  ];
  return { solid, lens };
}

/** Soft volumetric acetylene headlamp light cones shader (additive, distance-faded, ghost-aware). */
function createHeadlightBeams(parent: THREE.Object3D): THREE.ShaderMaterial {
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uGhost: { value: 0 },
      uFlicker: { value: 1 },
      uFogNear: worldUniforms.uFogNear,
      uFogFar: worldUniforms.uFogFar,
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vNormalV;
      varying vec3 vViewPos;
      void main() {
        vUv = uv;
        vNormalV = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vViewPos = -mv.xyz;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      uniform float uGhost;
      uniform float uFlicker;
      uniform float uFogNear;
      uniform float uFogFar;
      varying vec2 vUv;
      varying vec3 vNormalV;
      varying vec3 vViewPos;
      void main() {
        // vUv.y runs 1 at narrow lamp aperture down to 0 at far cone end
        float along = pow(clamp(vUv.y, 0.0, 1.0), 1.75) * smoothstep(1.0, 0.9, vUv.y);
        float edge = pow(abs(dot(normalize(vNormalV), normalize(vViewPos))), 1.35);
        float dist = length(vViewPos);
        float fog = 1.0 - clamp((dist - uFogNear) / max(uFogFar - uFogNear, 1.0), 0.0, 1.0) * 0.5;
        float a = along * edge * 0.19 * (1.0 - uGhost) * uFlicker * fog;
        if (a < 0.003) discard;
        vec3 col = mix(vec3(0.95, 0.72, 0.36), vec3(1.0, 0.94, 0.74), vUv.y);
        gl_FragColor = vec4(col * a, 1.0);
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneFactor,
    blendSrcAlpha: THREE.ZeroFactor,
    blendDstAlpha: THREE.OneFactor,
  });
  const cones: THREE.BufferGeometry[] = [];
  for (const side of [-1, 1]) {
    // Open cone expanding from lamp lens (r=0.13) out 4.1m forward to r=1.08, angled slightly downward onto road
    const g = new THREE.CylinderGeometry(0.13, 1.05, 4.1, 14, 1, true);
    g.rotateX(-Math.PI / 2 - 0.065);
    g.translate(side * 0.55, 0.98, 3.68);
    cones.push(g);
  }
  const merged = cones[0]!;
  // Merge both cones into a single draw call
  const posA = merged.getAttribute('position');
  const posB = cones[1]!.getAttribute('position');
  const nrmA = merged.getAttribute('normal');
  const nrmB = cones[1]!.getAttribute('normal');
  const uvA = merged.getAttribute('uv');
  const uvB = cones[1]!.getAttribute('uv');
  const idxA = merged.getIndex()!;
  const idxB = cones[1]!.getIndex()!;
  const out = new THREE.BufferGeometry();
  const pos = new Float32Array((posA.count + posB.count) * 3);
  pos.set(posA.array as Float32Array, 0);
  pos.set(posB.array as Float32Array, posA.count * 3);
  const nrm = new Float32Array((nrmA.count + nrmB.count) * 3);
  nrm.set(nrmA.array as Float32Array, 0);
  nrm.set(nrmB.array as Float32Array, nrmA.count * 3);
  const uv = new Float32Array((uvA.count + uvB.count) * 2);
  uv.set(uvA.array as Float32Array, 0);
  uv.set(uvB.array as Float32Array, uvA.count * 2);
  const idx = new Uint16Array(idxA.count + idxB.count);
  idx.set(idxA.array as Uint16Array, 0);
  for (let i = 0; i < idxB.count; i++) idx[idxA.count + i] = idxB.getX(i) + posA.count;
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  out.setIndex(new THREE.BufferAttribute(idx, 1));
  for (const c of cones) c.dispose();
  const mesh = new THREE.Mesh(out, mat);
  mesh.name = 'automobile-headlight-beams';
  mesh.renderOrder = 2;
  parent.add(mesh);
  return mat;
}

export function automobileArt(b: MountBuilder, root: THREE.Group): AutomobileArt {
  const body = group(root);
  body.name = 'brass-era-touring-automobile';

  // ---- 4 Authentic Wooden-Spoke Artillery Wheels ----
  const wheels: CoachWheel[] = [
    artilleryWheel(b, root, -0.88, -1.16, 0.56, false, true),
    artilleryWheel(b, root, -0.85, 1.12, 0.52, true, false),
    artilleryWheel(b, root, 0.88, -1.16, 0.56, false, true),
    artilleryWheel(b, root, 0.85, 1.12, 0.52, true, false),
  ];

  const coachwork: THREE.BufferGeometry[] = [];
  const glowingLenses: THREE.BufferGeometry[] = [];

  // ---- 1. Chassis Frame Rails, Axles, Leaf Springs, Differential, Engine Sump & Exhaust ----
  for (const side of [-1, 1] as const) {
    // Longitudinal C-channel steel frame rails + front spring horns
    coachwork.push(
      box(0.08, 0.11, 3.16, side * 0.43, 0.57, 0.04, CAR_COLORS.chassis),
      tube([[side * 0.43, 0.57, 1.48], [side * 0.43, 0.54, 1.66], [side * 0.43, 0.49, 1.74]], 0.026, CAR_COLORS.chassis),
      // Rear semi-elliptic leaf spring pack with shackles
      ...[0, 1, 2].map((k) =>
        tube(
          [[side * 0.56, 0.56 + k * 0.022, -1.58], [side * 0.56, 0.47 + k * 0.022, -1.16], [side * 0.56, 0.56 + k * 0.022, -0.74]],
          0.019,
          CAR_COLORS.iron,
        ),
      ),
      // Front wishbone radius rods from axle to oil-pan ball joint
      rod([side * 0.58, 0.5, 1.12], [0, 0.47, 0.48], 0.016, CAR_COLORS.iron),
      // Rear axle truss / brake pull rods
      rod([side * 0.62, 0.56, -1.16], [side * 0.36, 0.54, -0.25], 0.014, CAR_COLORS.iron),
    );
  }
  // Dropped front I-beam axle, transverse front leaf spring & brass spring clamps
  coachwork.push(
    tube([[-0.78, 0.52, 1.12], [-0.58, 0.48, 1.12], [0, 0.46, 1.12], [0.58, 0.48, 1.12], [0.78, 0.52, 1.12]], 0.036, CAR_COLORS.iron),
    ...[0, 1].map((k) => tube([[-0.66, 0.55 + k * 0.024, 1.12], [0, 0.63 + k * 0.024, 1.12], [0.66, 0.55 + k * 0.024, 1.12]], 0.02, CAR_COLORS.iron)),
    box(0.14, 0.08, 0.08, 0, 0.63, 1.12, CAR_COLORS.brassDark),
    // Rear live axle + central cast-iron differential pumpkin
    rod([-0.82, 0.56, -1.16], [0.82, 0.56, -1.16], 0.044, CAR_COLORS.chassis),
    tint(new THREE.SphereGeometry(0.135, 8, 6).translate(0, 0.56, -1.16), CAR_COLORS.iron),
    // Engine oil pan, flywheel housing, driveshaft tube
    box(0.42, 0.18, 0.88, 0, 0.48, 0.94, CAR_COLORS.chassis),
    tint(new THREE.CylinderGeometry(0.16, 0.16, 0.24, 8).rotateX(Math.PI / 2).translate(0, 0.51, 0.46), CAR_COLORS.iron),
    rod([0, 0.52, 0.34], [0, 0.56, -1.04], 0.032, CAR_COLORS.iron),
    // Cylindrical exhaust muffler & curved tailpipe exiting rear-left (+x)
    tint(new THREE.CylinderGeometry(0.072, 0.072, 0.56, 8).rotateX(Math.PI / 2).translate(0.32, 0.41, -0.45), CAR_COLORS.iron),
    tube([[0.22, 0.48, 0.68], [0.32, 0.42, 0.15], [0.32, 0.41, -0.18]], 0.024, CAR_COLORS.iron),
    tube([[0.32, 0.41, -0.72], [0.38, 0.4, -1.24], [0.46, 0.36, -1.72]], 0.026, CAR_COLORS.iron),
    tint(new THREE.CylinderGeometry(0.031, 0.031, 0.05, 8).rotateX(Math.PI / 2).translate(0.46, 0.36, -1.73), CAR_COLORS.brassDark),
    // Twin-bar front spring-steel bumper with curved end loops & antique license plate
    box(1.48, 0.052, 0.035, 0, 0.53, 1.79, CAR_COLORS.steel),
    box(1.48, 0.052, 0.035, 0, 0.44, 1.79, CAR_COLORS.steel),
    box(0.34, 0.13, 0.022, 0, 0.49, 1.825, CAR_COLORS.enamelDeep),
    box(0.28, 0.078, 0.014, 0, 0.49, 1.835, CAR_COLORS.plate),
  );
  for (const side of [-1, 1] as const) {
    coachwork.push(
      tube([[side * 0.74, 0.53, 1.79], [side * 0.81, 0.485, 1.76], [side * 0.74, 0.44, 1.79]], 0.02, CAR_COLORS.steel),
      rod([side * 0.43, 0.5, 1.66], [side * 0.5, 0.49, 1.78], 0.02, CAR_COLORS.iron),
    );
  }

  // ---- 2. Sweeping Continuous S-Curve Fenders, Running Boards & Splash Aprons ----
  const frontFenderCurve: readonly [number, number][] = [
    [1.68, 0.94],
    [1.56, 1.09],
    [1.38, 1.18],
    [1.14, 1.21],
    [0.9, 1.17],
    [0.7, 1.04],
    [0.54, 0.81],
    [0.42, 0.61],
    [0.3, 0.53],
  ];
  const rearFenderCurve: readonly [number, number][] = [
    [-0.48, 0.53],
    [-0.53, 0.74],
    [-0.64, 0.97],
    [-0.84, 1.17],
    [-1.16, 1.26],
    [-1.46, 1.19],
    [-1.68, 1.01],
    [-1.81, 0.78],
  ];
  for (const side of [-1, 1] as const) {
    coachwork.push(
      sweptFender(frontFenderCurve, side * 0.88, 0.185, side, 0.036, 0.032, 0.048),
      sweptFender(rearFenderCurve, side * 0.9, 0.185, side, 0.036, 0.032, 0.048),
      // Fender support irons underneath arches
      rod([side * 0.54, 0.78, 1.12], [side * 0.88, 1.17, 1.12], 0.016, CAR_COLORS.iron),
      rod([side * 0.62, 0.86, -1.16], [side * 0.9, 1.22, -1.16], 0.016, CAR_COLORS.iron),
      // Full-length running board with raised ribbed tread strips & outer brass molding
      box(0.35, 0.045, 0.84, side * 0.85, 0.52, -0.08, CAR_COLORS.enamelDeep),
      box(0.025, 0.052, 0.85, side * 1.028, 0.522, -0.08, CAR_COLORS.brass),
      ...[-0.08, 0.0, 0.08].map((ox) => box(0.024, 0.014, 0.74, side * (0.85 + ox), 0.548, -0.08, CAR_COLORS.iron)),
      // Splash valance sealing the gap between running board and body sill
      box(0.045, 0.18, 0.88, side * 0.68, 0.61, -0.08, CAR_COLORS.enamelDeep),
      box(0.045, 0.19, 0.85, side * 0.55, 0.65, 0.96, CAR_COLORS.enamelDeep),
    );
  }

  // ---- 3. Iconic Running-Board Accessories: Prest-O-Lite Brass Tank (+x) & Strapped Touring Chest (-x) ----
  coachwork.push(
    // Left (driver) running board: horizontal brass Prest-O-Lite acetylene gas cylinder
    tint(new THREE.CylinderGeometry(0.095, 0.095, 0.54, 12).rotateX(Math.PI / 2).translate(0.86, 0.64, -0.06), CAR_COLORS.brass),
    tint(new THREE.SphereGeometry(0.094, 8, 5).scale(1, 1, 0.45).translate(0.86, 0.64, 0.21), CAR_COLORS.brassHi),
    tint(new THREE.SphereGeometry(0.094, 8, 5).scale(1, 1, 0.45).translate(0.86, 0.64, -0.33), CAR_COLORS.brassDark),
    ...[-0.2, 0.08].map((zz) => tint(new THREE.TorusGeometry(0.1, 0.013, 4, 12).translate(0.86, 0.64, zz), CAR_COLORS.iron)),
    tint(new THREE.CylinderGeometry(0.022, 0.022, 0.05, 8).rotateX(Math.PI / 2).translate(0.86, 0.64, 0.26), CAR_COLORS.brassDark),
    // Right (passenger) running board: mahogany & brass-bound touring luggage chest with twin leather straps
    panel(0.28, 0.3, 0.5, -0.86, 0.7, -0.1, CAR_COLORS.mahogany, 0.018),
    box(0.295, 0.045, 0.515, -0.86, 0.855, -0.1, CAR_COLORS.leather),
    ...[-0.24, 0.04].map((zz) => box(0.305, 0.32, 0.036, -0.86, 0.705, zz, CAR_COLORS.leatherHi)),
    ...[-0.24, 0.04].map((zz) => box(0.018, 0.055, 0.052, -1.015, 0.72, zz, CAR_COLORS.brass)),
  );

  // ---- 4. Sculpted Touring Body Tub, Curved Rear Tonneau, Doors, Dashboard & Plush Tufted Seats ----
  coachwork.push(
    // Floorpan & raised rear tonneau footwell
    box(1.36, 0.1, 2.08, 0, 0.63, -0.5, CAR_COLORS.enamelDeep),
    box(1.24, 0.03, 0.86, 0, 0.69, 0.05, CAR_COLORS.mahogany),
    // Angled wooden toe-board + 3 Model T iron pedals (clutch, reverse, brake)
    box(1.18, 0.045, 0.36, 0, 0, 0, CAR_COLORS.mahogany).rotateX(-0.72).translate(0, 0.82, 0.4),
    ...[-0.08, 0.06, 0.2].map((px) => rod([0.22 + px * 0.7, 0.72, 0.44], [0.22 + px * 0.7, 0.86, 0.34], 0.014, CAR_COLORS.iron)),
    ...[-0.08, 0.06, 0.2].map((px) => box(0.065, 0.025, 0.075, 0.22 + px * 0.7, 0.87, 0.33, CAR_COLORS.steel)),
    // Smooth curved rear U-tonneau shell
    curvedTonneauWall(),
    // Mahogany dashboard firewall + brass-bezel speedometer/ammeter dials & ignition coil box
    box(1.28, 0.44, 0.075, 0, 1.24, 0.42, CAR_COLORS.mahogany),
    box(1.32, 0.055, 0.095, 0, 1.46, 0.42, CAR_COLORS.brass),
    tint(new THREE.CylinderGeometry(0.064, 0.064, 0.03, 10).rotateX(Math.PI / 2).translate(0.18, 1.28, 0.375), CAR_COLORS.brass),
    tint(new THREE.CylinderGeometry(0.05, 0.05, 0.034, 10).rotateX(Math.PI / 2).translate(0.18, 1.28, 0.372), CAR_COLORS.dialFace),
    tint(new THREE.CylinderGeometry(0.046, 0.046, 0.03, 10).rotateX(Math.PI / 2).translate(-0.04, 1.28, 0.375), CAR_COLORS.brass),
    tint(new THREE.CylinderGeometry(0.035, 0.035, 0.034, 10).rotateX(Math.PI / 2).translate(-0.04, 1.28, 0.372), CAR_COLORS.dialFace),
    box(0.24, 0.14, 0.08, -0.34, 1.26, 0.36, CAR_COLORS.mahogany),
    box(0.04, 0.04, 0.03, -0.34, 1.26, 0.315, CAR_COLORS.brass),
    // Front & rear plush diamond-tufted leather benches + brass robe rail on back of front seat
    ...plushBench(1.2, 1.04, -0.18, 0.56),
    ...plushBench(1.18, 1.06, -1.14, 0.58),
    box(1.24, 0.42, 0.1, 0, 0.85, -0.45, CAR_COLORS.enamelDeep), // solid seat-base riser under front bench (blocks hip lantern)
    rod([-0.46, 1.38, -0.52], [0.46, 1.38, -0.52], 0.014, CAR_COLORS.brass),
    ...[-0.46, 0.46].map((rx) => rod([rx, 1.38, -0.52], [rx, 1.38, -0.46], 0.012, CAR_COLORS.brassDark)),
  );
  // Front side panels, coach doors, subtle brass beltline trim & brass door handles
  const doorTone = mixC(CAR_COLORS.enamel, CAR_COLORS.enamelHi, 0.32);
  for (const side of [-1, 1] as const) {
    coachwork.push(
      panel(0.085, 0.66, 0.94, side * 0.68, 0.98, -0.05, CAR_COLORS.enamel, 0.02),
      box(0.095, 0.048, 0.98, side * 0.69, 1.33, -0.05, CAR_COLORS.iron),
      // Crisp continuous brass beltline trim bead along the coachwork waist
      box(0.022, 0.024, 1.72, side * 0.726, 1.29, -0.44, CAR_COLORS.brassDark),
      // Subtle recessed coach-door outlines (front & rear) + brass latches & hinges
      box(0.014, 0.5, 0.46, side * 0.725, 1.0, -0.08, doorTone),
      box(0.014, 0.5, 0.48, side * 0.725, 1.01, -0.78, doorTone),
      // Brass door handles
      rod([side * 0.745, 1.23, 0.06], [side * 0.745, 1.23, 0.17], 0.014, CAR_COLORS.brass),
      rod([side * 0.745, 1.25, -0.62], [side * 0.745, 1.25, -0.51], 0.014, CAR_COLORS.brass),
      // Door hinges
      ...[-0.28, -0.98].flatMap((hz) => [0.86, 1.15].map((hy) => box(0.024, 0.048, 0.024, side * 0.73, hy, hz, CAR_COLORS.brassDark))),
    );
  }
  // Swept cowl transitioning from hood to dashboard
  coachwork.push(
    loftSymmetricHood(
      [
        { z: 0.36, y0: 0.68, yS: 1.32, yTop: 1.46, w0: 0.66, wS: 0.68, wT: 0.56 },
        { z: 0.56, y0: 0.68, yS: 1.28, yTop: 1.41, w0: 0.56, wS: 0.54, wT: 0.42 },
      ],
      CAR_COLORS.enamel,
      CAR_COLORS.enamelHi,
      CAR_COLORS.enamelDeep,
    ),
  );

  // ---- 5. Coiled Brass Bulb Horn on Driver's Cowl (+x) ----
  coachwork.push(
    tube([[0.64, 1.35, 0.42], [0.76, 1.36, 0.46], [0.79, 1.42, 0.56], [0.76, 1.33, 0.62], [0.76, 1.35, 0.84]], 0.018, CAR_COLORS.brass),
    tint(new THREE.ConeGeometry(0.075, 0.16, 12).rotateX(-Math.PI / 2).translate(0.76, 1.35, 0.92), CAR_COLORS.brassHi),
    tint(new THREE.SphereGeometry(0.048, 8, 6).scale(0.9, 0.9, 1.3).translate(0.74, 1.35, 0.35), CAR_COLORS.rubber),
  );

  // ---- 6. Acetylene Headlamps, Side Cowl Lanterns & Split Brass Windscreen ----
  for (const side of [-1, 1] as const) {
    const hl = acetyleneHeadlamp(side);
    coachwork.push(...hl.solid);
    glowingLenses.push(...hl.lens);
    const cl = cowlLantern(side);
    coachwork.push(...cl.solid);
    glowingLenses.push(...cl.lens);
  }
  // Split two-piece brass & steel touring windscreen (cleanly open glass so sightlines stay crisp)
  coachwork.push(
    box(1.36, 0.045, 0.04, 0, 1.47, 0.4, CAR_COLORS.iron),
    box(1.36, 0.032, 0.034, 0, 1.78, 0.38, CAR_COLORS.brass), // center split-glass brass bar
    box(1.36, 0.042, 0.038, 0, 2.09, 0.35, CAR_COLORS.iron),
  );
  for (const side of [-1, 1] as const) {
    coachwork.push(
      rod([side * 0.67, 1.45, 0.4], [side * 0.67, 2.1, 0.35], 0.018, CAR_COLORS.iron),
      // Brass side quadrant hinges at split bar
      tint(new THREE.CylinderGeometry(0.032, 0.032, 0.025, 8).rotateZ(Math.PI / 2).translate(side * 0.68, 1.78, 0.38), CAR_COLORS.brass),
      // Forward diagonal brass-tipped windscreen stay rods down to hood sill
      rod([side * 0.67, 1.78, 0.38], [side * 0.61, 1.36, 0.72], 0.014, CAR_COLORS.iron),
    );
  }

  // ---- 7. Rear-Mounted Spare Artillery Wheel, Carrier & Ruby Oil Tail-Lamp ----
  const spareWheel = artilleryWheelGeos(0.49, false, -1);
  for (const g of spareWheel) {
    g.rotateY(Math.PI / 2);
    g.rotateX(0.14);
    g.translate(0, 1.0, -1.78);
    coachwork.push(g);
  }
  coachwork.push(
    // Rear spare wheel iron carrier arms & leather securing straps
    rod([-0.38, 0.7, -1.58], [-0.34, 0.94, -1.75], 0.022, CAR_COLORS.iron),
    rod([0.38, 0.7, -1.58], [0.34, 0.94, -1.75], 0.022, CAR_COLORS.iron),
    rod([0, 1.34, -1.62], [0, 1.44, -1.76], 0.02, CAR_COLORS.iron),
    box(0.055, 0.14, 0.14, 0, 1.47, -1.72, CAR_COLORS.leather),
    box(0.06, 0.035, 0.04, 0, 1.48, -1.79, CAR_COLORS.brass),
    // Rear brass & ruby-red glass oil tail-lamp (+x rear quarter) + rear license plate
    rod([0.52, 0.92, -1.56], [0.62, 0.96, -1.67], 0.014, CAR_COLORS.iron),
    tint(new THREE.CylinderGeometry(0.055, 0.055, 0.08, 8).rotateX(Math.PI / 2).translate(0.62, 0.96, -1.68), CAR_COLORS.brass),
    tint(new THREE.CylinderGeometry(0.034, 0.044, 0.035, 8).translate(0.62, 1.025, -1.68), CAR_COLORS.brassDark),
    box(0.32, 0.13, 0.022, 0.56, 0.76, -1.64, CAR_COLORS.enamelDeep),
    box(0.26, 0.075, 0.014, 0.56, 0.76, -1.652, CAR_COLORS.plate),
  );
  glowingLenses.push(
    tint(new THREE.SphereGeometry(0.048, 8, 6).scale(1, 1, 0.35).translate(0.62, 0.96, -1.725), CAR_COLORS.tailGlow),
  );

  // Steering column shaft & quadrant levers on body
  coachwork.push(
    rod([0.26, 0.86, 0.62], [0.26, 1.4, 0.28], 0.024, CAR_COLORS.iron),
    // Twin brass spark & throttle quadrant levers just beneath the steering wheel
    rod([0.26, 1.35, 0.31], [0.4, 1.38, 0.29], 0.009, CAR_COLORS.brass),
    rod([0.26, 1.35, 0.31], [0.12, 1.38, 0.29], 0.009, CAR_COLORS.brass),
    tint(new THREE.TorusGeometry(0.09, 0.009, 4, 12, Math.PI).rotateX(-0.6).translate(0.26, 1.36, 0.3), CAR_COLORS.brassDark),
  );

  b.add(body, coachwork);
  b.add(body, glowingLenses, 'cloth', 0.92);

  // ---- 8. Animated Hood & Iconic Brass Radiator Assembly (micro-vibrates with engine!) ----
  const hood = group(body);
  hood.name = 'automobile-hood';
  const hoodGeos: THREE.BufferGeometry[] = [
    // Tapered 1914 bonnet smoothly narrowing toward radiator
    loftSymmetricHood(
      [
        { z: 0.56, y0: 0.7, yS: 1.27, yTop: 1.4, w0: 0.54, wS: 0.52, wT: 0.4 },
        { z: 1.06, y0: 0.7, yS: 1.25, yTop: 1.375, w0: 0.46, wS: 0.445, wT: 0.34 },
        { z: 1.56, y0: 0.7, yS: 1.23, yTop: 1.35, w0: 0.39, wS: 0.38, wT: 0.28 },
      ],
      CAR_COLORS.enamel,
      CAR_COLORS.enamelHi,
      CAR_COLORS.enamelDeep,
    ),
    // Gleaming center brass hood hinge ridge
    rod([0, 1.405, 0.56], [0, 1.355, 1.56], 0.015, CAR_COLORS.brass),
    // Sculpted chamfered-shoulder 1914 brass radiator shell
    loftSymmetricHood(
      [
        { z: 1.56, y0: 0.59, yS: 1.25, yTop: 1.39, w0: 0.43, wS: 0.43, wT: 0.32 },
        { z: 1.66, y0: 0.59, yS: 1.25, yTop: 1.39, w0: 0.42, wS: 0.42, wT: 0.31 },
      ],
      CAR_COLORS.brass,
      CAR_COLORS.brassHi,
      CAR_COLORS.brassDark,
    ),
    // Recessed dark radiator honeycomb core
    box(0.7, 0.58, 0.03, 0, 0.94, 1.655, CAR_COLORS.enamelDeep),
    // Winged brass Moto-Meter / radiator filler cap perched atop the radiator tank
    tint(new THREE.CylinderGeometry(0.036, 0.044, 0.055, 8).translate(0, 1.415, 1.61), CAR_COLORS.brassDark),
    tint(new THREE.CylinderGeometry(0.048, 0.048, 0.03, 10).rotateX(Math.PI / 2).translate(0, 1.465, 1.61), CAR_COLORS.brassHi),
    tint(new THREE.CylinderGeometry(0.032, 0.032, 0.036, 8).rotateX(Math.PI / 2).translate(0, 1.465, 1.61), CAR_COLORS.dialFace),
    ...[-1, 1].map((s) => prism(s * 0.068, 1.45, 1.61, 0.07, 0.016, 0.04, 0.01, 0.028, CAR_COLORS.brass, 0.005, s * 0.02, 0)),
    // Brass upper tank emblem badge
    box(0.14, 0.042, 0.016, 0, 1.3, 1.67, CAR_COLORS.brassHi),
    // Iconic hanging curved hand-crank beneath radiator
    rod([0, 0.62, 1.63], [0, 0.62, 1.74], 0.018, CAR_COLORS.iron),
    rod([0, 0.62, 1.74], [-0.07, 0.44, 1.75], 0.016, CAR_COLORS.iron),
    tint(new THREE.CylinderGeometry(0.018, 0.018, 0.11, 8).rotateX(Math.PI / 2).translate(-0.07, 0.44, 1.81), CAR_COLORS.brass),
  ];
  // 15 fine vertical radiator grille fins & 3 horizontal cross-bars
  for (let i = 0; i < 15; i++) {
    const gx = -0.315 + i * 0.045;
    hoodGeos.push(rod([gx, 0.67, 1.672], [gx, 1.21, 1.672], 0.0055, CAR_COLORS.brassDark));
  }
  for (const gy of [0.8, 0.96, 1.11]) {
    hoodGeos.push(rod([-0.33, gy, 1.674], [0.33, gy, 1.674], 0.006, CAR_COLORS.iron));
  }
  // 8 recessed hood cooling louvers & twin brass hood hold-down latches per side
  for (const side of [-1, 1] as const) {
    for (let i = 0; i < 8; i++) {
      const f = i / 7;
      const lz = 0.72 + f * 0.68;
      const lx = side * (0.525 - f * 0.11);
      hoodGeos.push(box(0.022, 0.27, 0.024, 0, 0, 0, CAR_COLORS.steel).rotateY(-side * 0.14).translate(lx, 1.01, lz));
    }
    for (const lz of [0.68, 1.44]) {
      const lx = side * (0.55 - ((lz - 0.56) / 1.0) * 0.14);
      hoodGeos.push(
        rod([lx, 0.69, lz], [lx, 0.79, lz], 0.01, CAR_COLORS.brass),
        box(0.028, 0.022, 0.042, lx, 0.79, lz, CAR_COLORS.brassHi),
      );
    }
  }
  b.add(hood, hoodGeos);

  // ---- 9. Spinning 4-Blade Radiator Cooling Fan (visible behind grille slats!) ----
  const fan = group(hood, 0, 0.96, 1.54);
  fan.name = 'automobile-cooling-fan';
  const fanGeos: THREE.BufferGeometry[] = [
    tint(new THREE.CylinderGeometry(0.055, 0.055, 0.05, 8).rotateX(Math.PI / 2), CAR_COLORS.iron),
  ];
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    const blade = box(0.075, 0.24, 0.012, 0, 0, 0, CAR_COLORS.steel).rotateY(0.32).translate(0, 0.14, 0).rotateZ(a);
    fanGeos.push(blade);
  }
  b.add(fan, fanGeos);

  // ---- 10. Graceful Folding Canvas Touring Canopy (authentic fanned bows, NO X-scaffolding, open rear window!) ----
  const canopyPivotY = 1.44;
  const canopyPivotZ = -0.58;
  const canopy = group(body, 0, canopyPivotY, canopyPivotZ);
  canopy.name = 'automobile-canopy';
  const cy = (y: number): number => y - canopyPivotY;
  const cz = (z: number): number => z - canopyPivotZ;
  const canopyGeos: THREE.BufferGeometry[] = [];
  // Arched dark weathered oilcloth touring roof spanning z = -1.56..+0.42 with sculpted bow ridges
  const roofStrips = 10;
  for (let i = 0; i < roofStrips; i++) {
    const u0 = -1 + (2 * i) / roofStrips;
    const u1 = -1 + (2 * (i + 1)) / roofStrips;
    const um = (u0 + u1) * 0.5;
    const x = um * 0.71;
    const w = 1.42 / roofStrips + 0.018;
    const arch = 2.3 - 0.14 * um * um;
    const tilt = Math.atan2(-0.28 * um, 0.71);
    const shade = mixC(CAR_COLORS.canvasDark, CAR_COLORS.canvasHi, 1 - um * um * 0.8);
    canopyGeos.push(box(w, 0.042, 1.98, 0, 0, 0, shade).rotateZ(tilt).translate(x, cy(arch), cz(-0.57)));
  }
  // 4 transverse bow ridges crowning the canvas roof + neat front leather header trim
  for (const bz of [-1.52, -0.94, -0.26, 0.38]) {
    canopyGeos.push(
      tube(
        [
          [-0.71, cy(2.15), cz(bz)],
          [-0.4, cy(2.265), cz(bz)],
          [0, cy(2.31), cz(bz)],
          [0.4, cy(2.265), cz(bz)],
          [0.71, cy(2.15), cz(bz)],
        ],
        0.022,
        CAR_COLORS.canvasDark,
      ),
    );
  }
  canopyGeos.push(box(1.44, 0.085, 0.055, 0, cy(2.15), cz(0.41), CAR_COLORS.leather));
  // Authentic 1914 fanned folding top bows (landau irons) springing from a single rear pivot socket on each side!
  for (const side of [-1, 1] as const) {
    const px = side * 0.72;
    const sock: Point = [px, cy(1.42), cz(-1.34)];
    canopyGeos.push(
      tint(new THREE.SphereGeometry(0.032, 6, 4).translate(...sock), CAR_COLORS.brass),
      // 3 graceful fanned support bows up to rear, mid and front roof eaves
      rod(sock, [px, cy(2.15), cz(-1.5)], 0.016, CAR_COLORS.iron),
      rod(sock, [px, cy(2.16), cz(-0.92)], 0.015, CAR_COLORS.iron),
      rod(sock, [px, cy(2.16), cz(-0.24)], 0.015, CAR_COLORS.iron),
      // Horizontal side header rail joining the bows forward to the windshield top
      rod([px, cy(2.15), cz(-1.5)], [px, cy(2.14), cz(0.39)], 0.017, CAR_COLORS.iron),
      // Brass folding elbow joint on the rear bow + front windscreen leather storm strap & buckle
      tint(new THREE.SphereGeometry(0.022, 6, 4).translate(px, cy(1.8), cz(-1.42)), CAR_COLORS.brass),
      rod([side * 0.69, cy(2.12), cz(0.38)], [side * 0.67, cy(1.52), cz(0.42)], 0.011, CAR_COLORS.leather),
      box(0.028, 0.04, 0.025, side * 0.68, cy(1.78), cz(0.4), CAR_COLORS.brass),
      // Rolled-up side rain-curtain valance tucked neatly along the rear eaves
      box(0.05, 0.11, 1.88, side * 0.72, cy(2.11), cz(-0.56), CAR_COLORS.canvasDark),
    );
  }
  // Sculpted rear canvas curtain with a genuine OPEN beveled rear celluloid window (clean follow-cam sightline!)
  canopyGeos.push(
    box(0.38, 0.72, 0.045, -0.52, cy(1.8), cz(-1.55), CAR_COLORS.canvas), // right quarter
    box(0.38, 0.72, 0.045, 0.52, cy(1.8), cz(-1.55), CAR_COLORS.canvas), // left quarter
    box(0.7, 0.16, 0.045, 0, cy(2.11), cz(-1.55), CAR_COLORS.canvas), // top header above window
    box(0.7, 0.22, 0.045, 0, cy(1.54), cz(-1.55), CAR_COLORS.canvas), // lower apron below window
    // Brass-trimmed oval/rectangular rear window bezel
    box(0.7, 0.026, 0.052, 0, cy(2.03), cz(-1.55), CAR_COLORS.brassDark),
    box(0.7, 0.026, 0.052, 0, cy(1.65), cz(-1.55), CAR_COLORS.brassDark),
    box(0.026, 0.39, 0.052, -0.34, cy(1.84), cz(-1.55), CAR_COLORS.brassDark),
    box(0.026, 0.39, 0.052, 0.34, cy(1.84), cz(-1.55), CAR_COLORS.brassDark),
  );
  b.add(canopy, canopyGeos);

  // ---- 11. Left-Hand Drive 4-Spoke Mahogany & Brass Steering Wheel ----
  const steering = group(body, 0.26, 1.4, 0.28);
  steering.name = 'automobile-steering-wheel';
  steering.rotation.x = -0.6;
  const wheelGeos: THREE.BufferGeometry[] = [
    tint(new THREE.TorusGeometry(0.205, 0.02, 6, 18), CAR_COLORS.mahogany),
    tint(new THREE.CylinderGeometry(0.036, 0.036, 0.045, 8).rotateX(Math.PI / 2), CAR_COLORS.brass),
    tint(new THREE.SphereGeometry(0.024, 6, 4).translate(0, 0, -0.024), CAR_COLORS.brassHi),
  ];
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 + Math.PI / 4;
    wheelGeos.push(rod([0, 0, 0], [Math.cos(a) * 0.2, Math.sin(a) * 0.2, 0], 0.012, CAR_COLORS.brass));
  }
  b.add(steering, wheelGeos);

  // ---- 12. Animated Brass Gear-Shift & Handbrake Lever ----
  const shifter = group(body, 0.02, 0.68, 0.14);
  shifter.name = 'automobile-shifter';
  b.add(shifter, [
    rod([0, 0, 0], [0, 0.52, 0], 0.013, CAR_COLORS.iron),
    tint(new THREE.SphereGeometry(0.032, 6, 5).translate(0, 0.54, 0), CAR_COLORS.brassHi),
    rod([-0.06, 0, 0.02], [-0.06, 0.45, -0.04], 0.011, CAR_COLORS.iron),
    box(0.025, 0.07, 0.022, -0.06, 0.46, -0.04, CAR_COLORS.brass),
  ]);

  // ---- 13. Animated Front Steering Tie-Rod ----
  const tieRod = group(root, 0, 0.48, 0.97);
  tieRod.name = 'automobile-tie-rod';
  b.add(tieRod, [
    rod([-0.74, 0, 0], [0.74, 0, 0], 0.016, CAR_COLORS.iron),
    ...[-1, 1].map((s) => rod([s * 0.74, 0, 0], [s * 0.78, 0.02, 0.15], 0.014, CAR_COLORS.iron)),
  ]);

  // ---- 14. Volumetric Acetylene Headlamp Cones & Additive Lamp Halos ----
  const beamMaterial = createHeadlightBeams(body);
  const halos = createHalos(6, 0.5);
  halos.mesh.name = 'automobile-lamp-halos';
  root.add(halos.mesh);

  const haloAnchors = {
    headL: group(body, 0.55, 1.12, 1.67),
    headR: group(body, -0.55, 1.12, 1.67),
    cowlL: group(body, 0.66, 1.48, 0.47),
    cowlR: group(body, -0.66, 1.48, 0.47),
    tail: group(body, 0.62, 0.96, -1.74),
  };
  const worldPt = new THREE.Vector3();

  // Left-hand-drive rider seat feet origin (aligned cleanly behind steering wheel on front tufted bench)
  const seat = group(body, 0.26, 0.64, -0.18);
  seat.name = 'rider-seat-feet-origin';

  return {
    body,
    wheels,
    seat,
    steering,
    canopy,
    hood,
    fan,
    shifter,
    tieRod,
    beamMaterial,
    halos,
    updateLights(pose, ghost) {
      const fade = Math.max(0, Math.min(1, 1 - ghost));
      beamMaterial.uniforms.uGhost.value = ghost;
      beamMaterial.uniforms.uFlicker.value = pose.lampFlicker;
      halos.begin();
      if (fade > 0.01) {
        body.updateMatrixWorld(true);
        const put = (anchor: THREE.Object3D, r: number, rgb: Rgb, gain: number): void => {
          anchor.getWorldPosition(worldPt);
          halos.put(worldPt.x, worldPt.y, worldPt.z, r, rgb, gain * fade);
        };
        put(haloAnchors.headL, 0.42, HALO_HEAD, 0.72 * pose.lampFlicker);
        put(haloAnchors.headR, 0.42, HALO_HEAD, 0.72 * pose.lampFlicker);
        put(haloAnchors.cowlL, 0.16, HALO_COWL, 0.36 * pose.lampFlicker);
        put(haloAnchors.cowlR, 0.16, HALO_COWL, 0.36 * pose.lampFlicker);
        put(haloAnchors.tail, 0.18 + pose.brake * 0.09, HALO_TAIL, pose.tailGain);
      }
      halos.end();
    },
  };
}
