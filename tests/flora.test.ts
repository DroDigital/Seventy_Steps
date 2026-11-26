/**
 * Round 125, the flora library (tools/flora, render/floraData.ts, render/floraKit.ts): every tree, conifer and growing bush a realm draws
 * is modelled, in more than one variant; every model decodes whole; a library tree stands on its prop as tall as it and with its trunk's
 * foot as thick as its collider; no leaf hangs in the air; every point carries its wind; a wind-bent pine leans down its realm's wind.
 */
import * as THREE from 'three';
import { beforeAll, describe, expect, it } from 'vitest';
import { FLORA_INDEX } from '../src/data/flora/floraIndex';
import { FOGS } from '../src/data/fogs';
import { floraModel, FLORA_VARIANTS, loadFlora } from '../src/render/floraData';
import { floraFor } from '../src/render/floraKit';
import { propPieces, solids, type SolidPiece } from '../src/render/propShapes';
import { formsOf, propOfForm } from './propForms';

beforeAll(loadFlora);

const C: [number, number, number] = [0.6, 0.6, 0.58];
const BUILT = new Set(['crystal', 'tube']); // the bushes still built in code (stone and bone, not what grows)
const points = (g: THREE.BufferGeometry): THREE.Vector3[] => {
  const pos = g.getAttribute('position');
  return Array.from({ length: pos.count }, (_, i) => new THREE.Vector3().fromBufferAttribute(pos, i));
};
const piecesOf = (kind: 'tree' | 'pine' | 'bush', key: 'trees' | 'pines' | 'bushes', form: string, nth = 0): { p: ReturnType<typeof propOfForm>; parts: SolidPiece[] } => {
  const found = propOfForm(kind, key, form, nth);
  return { p: found, parts: found ? solids(propPieces(found.p, C, found.region)) : [] };
};

describe('the flora library (round 125)', () => {
  it('models every tree and conifer the realms draw, and every bush that grows, each in three variants or more', () => {
    for (const form of formsOf('trees')) expect(FLORA_VARIANTS.get(`tree.${form}`) ?? 0, form).toBeGreaterThanOrEqual(3);
    for (const form of formsOf('pines')) expect(FLORA_VARIANTS.get(`pine.${form}`) ?? 0, form).toBeGreaterThanOrEqual(3);
    for (const form of formsOf('bushes').filter((f) => !BUILT.has(f))) expect(FLORA_VARIANTS.get(`bush.${form}`) ?? 0, form).toBeGreaterThanOrEqual(3);
    for (const form of ['sapling', 'fir']) expect(FLORA_VARIANTS.get(`under.${form}`) ?? 0, form).toBeGreaterThanOrEqual(3);
  });

  it('decodes every model whole: finite points, faces on its own points, cards in the atlas, lights within their range', () => {
    for (const id of Object.keys(FLORA_INDEX)) {
      const m = floraModel(id)!;
      expect(m, id).not.toBeNull();
      for (const part of [m.wood, m.leaf]) {
        if (!part) continue;
        expect(part.pos.every(Number.isFinite), id).toBe(true);
        expect(Math.max(...part.index), id).toBeLessThan(part.light.length);
        expect(part.light.every((l) => l >= 0.29 && l <= 1), id).toBe(true);
      }
      if (m.cards) {
        expect(m.cards.centre.every(Number.isFinite), id).toBe(true);
        expect(Math.max(...m.cards.cell), id).toBeLessThan(16);
      }
      expect(m.info.h, id).toBeGreaterThan(0.3);
    }
  });

  it('stands a tree as tall as its prop, its trunk\'s foot as thick as its collider', () => {
    for (const [kind, key] of [['tree', 'trees'], ['pine', 'pines']] as const) {
      for (const form of formsOf(key)) {
        for (const nth of [0, 1, 2]) {
          const { p, parts } = piecesOf(kind, key, form, nth);
          if (!p) continue;
          const all = parts.flatMap((q) => points(q.geo));
          const top = Math.max(...all.map((v) => v.y));
          expect(top / p.p.h, `${form} ${nth} top`).toBeGreaterThan(0.95);
          expect(top / p.p.h, `${form} ${nth} top`).toBeLessThan(1.05);
          const trunk = parts.find((q) => q.mat === 'wood')!;
          const m = floraFor(kind, form, p.p.seed)!;
          const fork = (m.info.fork * p.p.h) / m.info.h; // (the limbs leave the trunk from its axis there: below it is the trunk alone)
          const band = points(trunk.geo).filter((v) => v.y > 0.9 && v.y < Math.min(1.6, fork * 0.9) && Math.hypot(v.x, v.z) < p.p.w * 1.8); // above the flare, where a body meets it (and not a low bough drooping past it)
          if (band.length < 3) continue; // (a limb leaves it as low as a body: a blasted tree's broken stubs)
          const mid = band.reduce((a, v) => a.add(v), new THREE.Vector3()).multiplyScalar(1 / band.length);
          const reach = band.map((v) => Math.hypot(v.x - mid.x, v.z - mid.z)).sort((a, b) => a - b);
          const girth = reach[Math.floor(reach.length / 2)];
          expect(girth / p.p.w, `${form} ${nth} girth`).toBeGreaterThan(0.75);
          expect(girth / p.p.w, `${form} ${nth} girth`).toBeLessThan(1.35);
        }
      }
    }
  });

  it('hangs no leaf in the air: every card lies near the wood that holds it', () => {
    for (const form of formsOf('trees').filter((f) => f !== 'fungal' && f !== 'blasted')) {
      for (const nth of [0, 1]) {
        const { p, parts } = piecesOf('tree', 'trees', form, nth);
        const leaves = parts.find((q) => q.mat === 'foliage');
        if (!p || !leaves) continue;
        const wood = points(parts.find((q) => q.mat === 'wood')!.geo);
        const corners = points(leaves.geo);
        let far = 0;
        for (let k = 0; k + 3 < corners.length; k += 4) { // a card is held at its foot (a strand at its head): its nearest corner is near the wood
          if (Math.min(...[0, 1, 2, 3].flatMap((j) => wood.map((w) => w.distanceTo(corners[k + j])))) > 1.6) far++;
        }
        expect(far / (corners.length / 4), `${form} ${nth}`).toBeLessThan(0.03);
      }
    }
  });

  it('gives every point its wind: a trunk\'s foot still, the boughs reaching, the leaves\' free corners fluttering', () => {
    const { parts } = piecesOf('tree', 'trees', 'oak');
    const wood = parts.find((q) => q.mat === 'wood')!.geo;
    const leaves = parts.find((q) => q.mat === 'foliage')!.geo;
    for (const g of [wood, leaves]) {
      expect(g.getAttribute('aWind').itemSize).toBe(4);
      expect(g.getAttribute('aSway')).toBeDefined();
    }
    const w = wood.getAttribute('aWind').array as Uint8Array;
    const pos = wood.getAttribute('position');
    for (let i = 0; i < pos.count; i++) if (pos.getY(i) < 0.5) expect(w[i * 4 + 1], 'reach at the foot').toBe(0);
    expect(Math.max(...Array.from(w).filter((_, i) => i % 4 === 1))).toBeGreaterThan(40);
    const l = leaves.getAttribute('aWind').array as Uint8Array;
    expect(Math.max(...Array.from(l).filter((_, i) => i % 4 === 2))).toBe(255);
    expect(Math.min(...Array.from(l).filter((_, i) => i % 4 === 2))).toBeLessThan(100);
  });

  it('is the same each time it is built', () => {
    const a = piecesOf('pine', 'pines', 'fir').parts;
    const b = piecesOf('pine', 'pines', 'fir').parts;
    expect(Array.from(a[1].geo.getAttribute('position').array)).toEqual(Array.from(b[1].geo.getAttribute('position').array));
  });

  it('leans a wind-bent pine down its realm\'s wind, whichever way its prop was turned', () => {
    for (const nth of [0, 1, 2]) {
      const found = propOfForm('pine', 'pines', 'windswept', nth)!;
      const crown = solids(propPieces(found.p, C, found.region)).find((q) => q.mat === 'foliage')!;
      const mid = points(crown.geo).reduce((s, v) => s.add(v), new THREE.Vector3()).multiplyScalar(1 / crown.geo.getAttribute('position').count);
      const [s, c] = [Math.sin(found.p.yaw), Math.cos(found.p.yaw)];
      const world = [mid.x * c + mid.z * s, -mid.x * s + mid.z * c]; // as propMeshes turns it into the world
      const wind = FOGS[found.region]!.wind;
      expect(world[0] * wind[0] + world[1] * wind[1], `${nth}`).toBeGreaterThan(0);
    }
  });
});
