/**
 * Round 111, the hardwoods by realm (data/propLooks.ts): the dead October tree with its forks (the one every realm had), a broad
 * gnarled oak, a round-crowned maple, the vase of an elm, a pale birch, a willow's hanging curtain, a leaning swamp tree hung with
 * moss, a blasted grey trunk snapped where the Colour fell, the stalks and shelves of the fungi of Yuggoth and K'n-yan, and the
 * knotted sinew trees of the Black Wood. Each stands on its trunk of radius `w`, `h` tall, so its collider is as it was.
 */

import * as THREE from 'three';
import type { Rng } from '../core/rng';
import type { PropLook, TreeForm } from '../data/propLooks';
import type { Prop } from '../world/props';
import { hangFrom } from './crownUnder';
import { tileUv, tint } from './meshKit';
import { mixRgb, scaleRgb, type Rgb } from './palette';
import { cyl, join, limb, roots, scatter, shadeBelow, stem, tipOf } from './propKit';
import type { Piece } from './propShapes';

type V = [number, number, number];
const pick = <T,>(rng: Rng, list: readonly T[]): T => list[Math.floor(rng() * list.length)];

/** One jagged foliage bough: a low-poly crown twisted and spiky so tree silhouettes read as gnarled PS1 boughs instead of smooth blobs. */
const lumpOf = (at: readonly number[], r: number, c: Rgb, rng: Rng, flat: number): THREE.BufferGeometry => {
  const g = new THREE.IcosahedronGeometry(r, 0);
  g.scale(1.06, flat * 0.82, 0.9);
  const pos = g.getAttribute('position');
  const salt = rng() * 100;
  for (let i = 0; i < pos.count; i++) {
    const [x, y, z] = [pos.getX(i), pos.getY(i), pos.getZ(i)];
    const jag = 0.62 + 0.5 * scatter(x * 3.1, y * 3.1, z * 3.1, salt);
    const droop = y < 0 ? 0.82 : 1.0 + 0.14 * scatter(z * 2.3, x * 2.3, y * 2.3, salt + 7);
    pos.setXYZ(i, x * jag, y * droop, z * jag);
  }
  g.rotateY(rng() * Math.PI * 2);
  g.rotateZ((rng() - 0.5) * 0.34);
  g.computeVertexNormals();
  return shadeBelow(tint(tileUv(g, r * 2.4, r * 2.4), c).translate(at[0], at[1], at[2]), 0.42);
};

/** A ragged cluster of layered leaf boughs about `at`, flattened by `flat`, with jagged asymmetric side sprays. */
function clump(at: readonly number[], r: number, c: Rgb, rng: Rng, flat = 0.7): THREE.BufferGeometry {
  const parts = [lumpOf(at, r * 0.96, c, rng, flat)];
  const n = r > 0.8 && rng() < 0.6 ? 2 : 1;
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2 + rng() * 1.4;
    const s = 0.48 + 0.16 * rng();
    parts.push(
      lumpOf(
        [at[0] + Math.sin(a) * r * (0.64 + 0.14 * rng()), at[1] + r * flat * (rng() * 0.38 - 0.28), at[2] + Math.cos(a) * r * (0.64 + 0.14 * rng())],
        r * s,
        scaleRgb(c, 0.84 + 0.26 * rng()),
        rng,
        flat * (0.76 + 0.32 * rng()),
      ),
    );
  }
  return join(parts);
}

/** Where along a trunk laid as a chain of points a share `t` (0 at its foot, 1 at its top) of its length lies. */
function along(chain: readonly V[], t: number): V {
  const f = Math.min(chain.length - 1.001, Math.max(0, t * (chain.length - 1)));
  const [i, u] = [Math.floor(f), f - Math.floor(f)];
  const [a, b] = [chain[i], chain[i + 1]];
  return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
}

const pieces = (wood: THREE.BufferGeometry[], leaves: THREE.BufferGeometry[]): Piece[] => {
  const out: Piece[] = [{ mat: 'wood', geo: join(wood) }];
  if (leaves.length) out.push({ mat: 'leaf', geo: join(leaves) });
  return out;
};

/** The dead hardwood with forked limbs and a few clumps of October leaves (the form all realms had before round 111). */
function dead(p: Prop, rng: Rng, look: PropLook, bark: Rgb): Piece[] {
  const parts = [cyl(p.w * 1.6, p.w, 0.6, 6, scaleRgb(bark, 0.8)), cyl(p.w, p.w * 0.45, p.h, 6, bark, Math.ceil(p.h / 1.5)), ...roots(p.w * 1.2, 3, 0.7, scaleRgb(bark, 0.8), rng)];
  const leafy = rng() < 0.45;
  const leaves: THREE.BufferGeometry[] = [];
  const n = 3 + Math.floor(rng() * 3);
  for (let k = 0; k < n; k++) {
    const y = p.h * (0.45 + 0.45 * (k / n)) + rng() * 0.5;
    const yaw = k * 2.3 + rng();
    const len = (1.4 + rng() * 1.8) * (1 - k / (n + 2));
    const pitch = 0.55 + rng() * 0.5;
    parts.push(limb(len, p.w * 0.45, yaw, pitch, bark).translate(0, y, 0));
    const e = tipOf([0, y, 0], yaw, pitch, len * 0.8);
    for (let t = 0; t < 2; t++) {
      const [ty, tp, tl] = [yaw + (t - 0.5) * 1.2, pitch - 0.3 + rng() * 0.4, len * 0.55];
      parts.push(limb(tl, p.w * 0.2, ty, tp, bark).translate(e[0], e[1], e[2]));
      if (!leafy || rng() < 0.3) continue;
      leaves.push(clump(tipOf(e, ty, tp, tl), 0.7 + rng() * 0.9, pick(rng, look.leaves), rng));
    }
  }
  return pieces(parts, leaves);
}

/** A crown of limbs from `from`, each ending in a clump: the oak's, maple's, elm's and birch's, by their spread. */
function crowned(p: Prop, rng: Rng, look: PropLook, bark: Rgb, o: { trunk: number; flare: number; limbs: number; pitch: [number, number]; len: [number, number]; clump: [number, number]; flat: number; keep: number; top: boolean; leaves?: readonly Rgb[]; marks?: Rgb }): Piece[] {
  const th = p.h * o.trunk;
  const trunk = cyl(p.w, p.w * 0.6, th, 6, bark, Math.ceil(th / (o.marks ? 0.6 : 2)));
  if (o.marks) marked(trunk, o.marks, rng() * 100);
  const wood = [cyl(p.w * o.flare, p.w, 0.7, 6, scaleRgb(bark, 0.8)), trunk, ...roots(p.w * o.flare * 0.7, 4, 0.6, scaleRgb(bark, 0.8), rng)];
  const leaves: THREE.BufferGeometry[] = [];
  const palette = o.leaves ?? look.leaves;
  const reach = p.h - th;
  for (let k = 0; k < o.limbs; k++) {
    const yaw = (k / o.limbs) * Math.PI * 2 + rng() * 0.8;
    const pitch = o.pitch[0] + rng() * (o.pitch[1] - o.pitch[0]);
    const len = reach * (o.len[0] + rng() * (o.len[1] - o.len[0]));
    const from: V = [0, th - 0.3 - rng() * th * 0.25, 0];
    wood.push(limb(len, p.w * 0.55, yaw, pitch, bark, 0.4).translate(from[0], from[1], from[2]));
    const end = tipOf(from, yaw, pitch, len);
    if (rng() < o.keep) leaves.push(clump(end, o.clump[0] + rng() * (o.clump[1] - o.clump[0]), pick(rng, palette), rng, o.flat));
    if (k % 2) continue; // a twig on every other limb, to keep the faces few
    const turn = yaw + (rng() - 0.5);
    const twig = tipOf(end, turn, pitch * 0.6, len * 0.35);
    wood.push(limb(len * 0.35, p.w * 0.22, turn, pitch * 0.6, bark).translate(end[0], end[1], end[2]));
    if (rng() < o.keep * 0.6) leaves.push(clump(twig, (o.clump[0] + rng() * (o.clump[1] - o.clump[0])) * 0.7, pick(rng, palette), rng, o.flat));
  }
  if (o.top && rng() < o.keep) { // the leader runs on from the trunk into the crown's top clump (before round 117 that clump hung in the air over the trunk)
    const crown = p.h - o.clump[1] * 0.5;
    wood.push(stem([0, th - 0.2, 0], [0, crown, 0], p.w * 0.6, p.w * 0.25, 5, bark));
    leaves.push(clump([0, crown, 0], o.clump[1], pick(rng, palette), rng, o.flat));
  }
  return pieces(wood, leaves);
}

/** A birch's dark marks: the points of its trunk a scatter picks, darkened to `c`. */
function marked(g: THREE.BufferGeometry, c: Rgb, salt: number): void {
  const [pos, col] = [g.getAttribute('position'), g.getAttribute('color')];
  for (let i = 0; i < pos.count; i++) if (pos.getY(i) > 0.4 && scatter(pos.getX(i), pos.getY(i), pos.getZ(i), salt) < 0.3) col.setXYZ(i, c[0], c[1], c[2]);
}

/** A willow: a short leaning trunk, a dome of leaves and long strands hanging from its rim to near the ground. */
function willow(p: Prop, rng: Rng, look: PropLook, bark: Rgb): Piece[] {
  const lean = (rng() - 0.5) * 0.5;
  const top: V = [Math.sin(lean) * p.h * 0.3, p.h * 0.5, 0];
  const wood = [cyl(p.w * 1.8, p.w * 1.1, 0.7, 7, scaleRgb(bark, 0.75)), stem([0, 0.3, 0], top, p.w * 1.1, p.w * 0.7, 7, bark), ...roots(p.w * 1.3, 4, 0.7, scaleRgb(bark, 0.75), rng)];
  const leaves: THREE.BufferGeometry[] = [];
  const c = pick(rng, look.leaves);
  const r = p.h * 0.32;
  for (let k = 0; k < 3; k++) { // its scaffold limbs up into the dome, so the dome is held up by something
    const a = (k / 3) * Math.PI * 2 + rng();
    wood.push(stem(top, [top[0] + Math.sin(a) * r * 0.5, top[1] + r * 0.45, top[2] + Math.cos(a) * r * 0.5], p.w * 0.55, p.w * 0.2, 4, bark));
  }
  leaves.push(lumpOf([top[0], top[1] + r * 0.5, top[2]], r, c, rng, 0.55));
  for (let k = 0; k < 3; k++) { // the dome's shoulders, so it is not one round lid
    const a = (k / 3) * Math.PI * 2 + rng();
    leaves.push(lumpOf([top[0] + Math.sin(a) * r * 0.55, top[1] + r * 0.25, top[2] + Math.cos(a) * r * 0.55], r * 0.6, scaleRgb(c, 0.9 + 0.15 * rng()), rng, 0.6));
  }
  const crown = join(leaves); // what the strands hang from (2026-11-24: they hung from fixed heights the jagged dome often did not reach, in the air under it)
  const n = 18 + Math.floor(rng() * 6); // the curtain: thin strands from the dome's rim in two rings, the inner longer
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2 + rng() * 0.25;
    const ring = k % 2 ? 0.95 : 0.7;
    const [x, z] = [top[0] + Math.sin(a) * r * ring, top[2] + Math.cos(a) * r * ring];
    const from = top[1] + r * (k % 2 ? 0.15 : 0.35);
    const foot = 0.5 + rng() * (k % 2 ? 1.4 : 0.8); // hangs to well above the ground
    const [w, turn, shade] = [0.1 + 0.05 * rng(), rng(), 0.8 + 0.25 * rng()];
    const at = hangFrom(crown, x, z, top[0], top[2], 0.15); // its top inside the dome's underside, drawn in under it if the rim is thin there
    if (!at) continue;
    const drop = Math.max(0.6, at[1] - Math.min(foot, from - 0.6));
    leaves.push(tint(new THREE.ConeGeometry(w, drop, 4).rotateX(Math.PI).rotateY(turn).translate(at[0], at[1] - drop / 2, at[2]), scaleRgb(c, shade)));
  }
  crown.dispose();
  return pieces(wood, leaves);
}

/** A swamp tree: a crooked trunk leaning over the water, a few limbs, grey moss hanging from them. */
function swamp(p: Prop, rng: Rng, look: PropLook, bark: Rgb): Piece[] {
  const wood = [cyl(p.w * 1.9, p.w * 1.1, 0.6, 6, bark), ...roots(p.w * 1.4, 5, 1, bark, rng, 0.2)]; // (in the trunk's own colour: a darker foot fought it for the depth where the two lie close); its roots splayed over the mud
  const moss: THREE.BufferGeometry[] = [];
  const mossC = mixRgb(look.top, [0.5, 0.52, 0.44], 0.5);
  const chain: V[] = [[0, 0.4, 0]];
  const lean = rng() * Math.PI * 2;
  for (let s = 0; s < 3; s++) {
    const at = chain[s];
    const next: V = [at[0] + Math.sin(lean + (rng() - 0.5)) * p.h * 0.1, at[1] + p.h * 0.26, at[2] + Math.cos(lean + (rng() - 0.5)) * p.h * 0.1];
    wood.push(stem(at, next, p.w * (1 - s * 0.22), p.w * (0.78 - s * 0.22), 6, bark), tint(new THREE.IcosahedronGeometry(p.w * (0.95 - s * 0.22), 0).translate(next[0], next[1], next[2]), bark));
    chain.push(next);
  }
  for (let k = 0; k < 4; k++) {
    const yaw = rng() * Math.PI * 2;
    const len = 1.4 + rng() * 1.6;
    const from = along(chain, 0.55 + 0.45 * rng()); // on the trunk (round 117: each of x, y and z was drawn apart, and a limb could start a metre off it)
    const pitch = 1 + rng() * 0.5;
    wood.push(limb(len, p.w * 0.35, yaw, pitch, bark).translate(from[0], from[1], from[2]));
    for (const t of [0.35, 0.65, 0.92]) { // the grey moss hangs in thin beards along the limb
      const m = tipOf(from, yaw, pitch, len * t);
      const hang = 0.7 + rng() * 1.3;
      moss.push(tint(new THREE.ConeGeometry(0.09 + 0.05 * rng(), hang, 4).rotateX(Math.PI).rotateY(rng()).translate(m[0], m[1] - hang / 2, m[2]), scaleRgb(mossC, 0.85 + 0.25 * rng())));
    }
  }
  return pieces(wood, moss);
}

/** A blasted tree: a grey trunk snapped off at a jagged stub, its few limbs broken short, charred toward its foot. */
function blasted(p: Prop, rng: Rng, _look: PropLook, bark: Rgb): Piece[] {
  const grey = mixRgb(bark, [0.6, 0.6, 0.58], 0.5);
  const h = p.h * (0.45 + 0.25 * rng());
  const wood = [cyl(p.w * 1.7, p.w, 0.6, 6, scaleRgb(grey, 0.5)), cyl(p.w, p.w * 0.6, h, 6, grey, Math.ceil(h / 1.5))];
  wood.push(tint(new THREE.ConeGeometry(p.w * 0.6, 0.8, 5).rotateZ((rng() - 0.5) * 0.5).translate(0.05, h + 0.35, 0), grey)); // the splintered stub
  for (let k = 0; k < 3; k++) { // and the splinters about it, torn up from the rim
    const a = k * 2.1 + rng();
    wood.push(tint(new THREE.ConeGeometry(p.w * 0.22, 0.5 + 0.7 * rng(), 3).translate(0, 0.25, 0).rotateX(0.15 + 0.2 * rng()).rotateY(a).translate(Math.sin(a) * p.w * 0.45, h - 0.15, Math.cos(a) * p.w * 0.45), grey));
  }
  wood.push(...roots(p.w * 1.2, 3, 0.6, scaleRgb(grey, 0.5), rng));
  const n = 2 + Math.floor(rng() * 3);
  for (let k = 0; k < n; k++) wood.push(limb(0.5 + rng() * 1.1, p.w * 0.35, rng() * Math.PI * 2, 0.7 + rng() * 0.6, grey, 0.5).translate(0, h * (0.4 + 0.5 * rng()), 0));
  return pieces(wood, []);
}

/** A fungal growth from Yuggoth or K'n-yan: a pale bending stalk carrying one to three wide shelving caps. */
function fungal(p: Prop, rng: Rng, look: PropLook, bark: Rgb): Piece[] {
  const stalk = [cyl(p.w * 2, p.w * 1.3, 0.5, 7, scaleRgb(bark, 0.8))];
  const caps: THREE.BufferGeometry[] = [];
  const bend = rng() * Math.PI * 2;
  const top: V = [Math.sin(bend) * p.h * 0.08, p.h * 0.75, Math.cos(bend) * p.h * 0.08];
  stalk.push(stem([0, 0.3, 0], [top[0] * 0.5, p.h * 0.4, top[2] * 0.5], p.w * 1.3, p.w * 1.1, 7, bark), stem([top[0] * 0.5, p.h * 0.4, top[2] * 0.5], top, p.w * 1.1, p.w * 0.9, 7, bark));
  const ring: V = [top[0] * 0.7, p.h * 0.58, top[2] * 0.7]; // the torn ring (annulus) a cap leaves on its stalk as it opens
  stalk.push(tint(new THREE.CylinderGeometry(p.w * 1.1, p.w * 2.1, 0.22, 7).translate(ring[0], ring[1], ring[2]), scaleRgb(bark, 1.08)));
  const tiers = 1 + Math.floor(rng() * 3);
  for (let k = 0; k < tiers; k++) {
    const t = k / tiers;
    const r = p.h * (0.32 - t * 0.12) * (0.85 + 0.3 * rng());
    const y = top[1] - t * p.h * 0.28;
    const c = pick(rng, look.leaves);
    caps.push(tint(tileUv(new THREE.ConeGeometry(r, r * 0.45, 9).translate(top[0] * (1 - t * 0.4), y + r * 0.22, top[2] * (1 - t * 0.4)), r * 2, r), c));
    caps.push(tint(new THREE.CylinderGeometry(r * 0.98, r * 0.6, 0.18, 9).translate(top[0] * (1 - t * 0.4), y - 0.09, top[2] * (1 - t * 0.4)), scaleRgb(c, 0.6))); // the gills beneath
  }
  return [{ mat: 'wood', geo: join(stalk) }, { mat: 'leaf', geo: join(caps) }]; // the stalk in wood, so it bends with its caps
}

/** A sinew tree of the Black Wood: a trunk twisted in knotted lengths, limbs that end in hooked tips, and dark hanging growths. */
function sinew(p: Prop, rng: Rng, look: PropLook, bark: Rgb): Piece[] {
  const wood = [cyl(p.w * 2.2, p.w * 1.2, 0.6, 6, bark)];
  const growth: THREE.BufferGeometry[] = [];
  const chain: V[] = [[0, 0.4, 0]];
  const segs = 4;
  for (let s = 0; s < segs; s++) {
    const at = chain[s];
    const a = s * 1.9 + rng();
    const next: V = [Math.sin(a) * p.w * 1.4, at[1] + (p.h * 0.8) / segs, Math.cos(a) * p.w * 1.4];
    const r = p.w * (1.15 - s * 0.18);
    wood.push(stem(at, next, r, r * 0.85, 6, bark), tint(new THREE.IcosahedronGeometry(r * 1.15, 0).translate(next[0], next[1], next[2]), bark)); // a knot at each turn
    chain.push(next);
  }
  wood.push(...roots(p.w * 1.6, 4, 0.9, bark, rng, 0.25)); // its foot grips the ground like a hand
  const n = 4 + Math.floor(rng() * 3);
  for (let k = 0; k < n; k++) {
    const yaw = (k / n) * Math.PI * 2 + rng();
    const from = along(chain, 0.5 + 0.5 * rng()); // on the trunk (round 117: it was drawn about its top's offset, off the twisted trunk)
    const [l1, p1] = [1.2 + rng() * 1.4, 0.8 + rng() * 0.5];
    wood.push(limb(l1, p.w * 0.45, yaw, p1, bark).translate(from[0], from[1], from[2]));
    const e = tipOf(from, yaw, p1, l1);
    wood.push(limb(0.9, p.w * 0.2, yaw + 0.6, p1 + 0.9, bark, 0.2).translate(e[0], e[1], e[2])); // the tip hooks down
    if (rng() < 0.6) {
      const hang = 0.6 + rng() * 1.1;
      growth.push(tint(new THREE.ConeGeometry(0.14, hang, 4).rotateX(Math.PI).translate(e[0], e[1] - hang / 2, e[2]), pick(rng, look.leaves)));
    }
  }
  return pieces(wood, growth);
}

const BIRCH: Rgb = [0.94, 0.92, 0.86]; // (round 117: was 0.78 scaled by 1.3, a channel past 1)
const BIRCH_MARK: Rgb = [0.24, 0.22, 0.21];

/** A tree of `form`, of the realm's look. */
export function treeOf(form: TreeForm, p: Prop, rng: Rng, look: PropLook): Piece[] {
  const bark = look.bark;
  switch (form) {
    case 'dead':
      return dead(p, rng, look, bark);
    case 'oak':
      return crowned(p, rng, look, scaleRgb(bark, 0.9), { trunk: 0.4, flare: 2, limbs: 6, pitch: [0.9, 1.3], len: [0.55, 0.8], clump: [1.1, 1.8], flat: 0.65, keep: 0.75, top: true });
    case 'maple':
      return crowned(p, rng, look, bark, { trunk: 0.45, flare: 1.7, limbs: 7, pitch: [0.5, 0.9], len: [0.45, 0.65], clump: [1.1, 1.6], flat: 0.85, keep: 0.85, top: true });
    case 'elm':
      return crowned(p, rng, look, bark, { trunk: 0.5, flare: 1.8, limbs: 5, pitch: [0.3, 0.6], len: [0.6, 0.85], clump: [0.9, 1.4], flat: 0.6, keep: 0.6, top: false });
    case 'birch':
      return crowned({ ...p, w: p.w * 0.7 }, rng, look, BIRCH, { trunk: 0.6, flare: 1.7, limbs: 4, pitch: [0.35, 0.7], len: [0.35, 0.55], clump: [0.6, 1], flat: 0.9, keep: 0.7, top: true, leaves: [[0.76, 0.64, 0.3], [0.7, 0.6, 0.32]], marks: BIRCH_MARK });
    case 'willow':
      return willow(p, rng, look, bark);
    case 'swamp':
      return swamp(p, rng, look, bark);
    case 'blasted':
      return blasted(p, rng, look, bark);
    case 'fungal':
      return fungal(p, rng, look, scaleRgb(look.bark, 1.5));
    case 'sinew':
      return sinew(p, rng, look, bark);
  }
}
