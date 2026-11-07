/**
 * Round 111, every recurring prop in its realm's forms (data/propLooks.ts, data/houseLooks.ts): every region has a look, every form
 * of every kind builds sound geometry within its prop's size and a modest count of faces, the realms do not all draw the same forms,
 * no colour of theirs reads as an anomaly's, and the houses of each realm build with what that realm adds.
 */
import type * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createRng } from '../src/core/rng';
import { HOUSE_LOOKS } from '../src/data/houseLooks';
import { PROP_LOOKS, lookOf } from '../src/data/propLooks';
import { REGIONS, type PropKind } from '../src/data/regions';
import { housePieces } from '../src/render/houseMesh';
import { ANOMALY_HUES, rgbToHsv } from '../src/render/palette';
import { propPieces, solids } from '../src/render/propShapes';
import { propAt } from '../src/world/props';
import { FORM_KEYS, formsOf, propOfForm } from './propForms';

const hueGap = (a: number, b: number): number => Math.min(Math.abs(a - b), 1 - Math.abs(a - b));
const reads = (c: readonly [number, number, number]): boolean => {
  const [h, s, v] = rgbToHsv(c);
  return s > 0.3 && v > 0.08 && ANOMALY_HUES.some((a) => hueGap(h, a) < 0.1);
};
const tris = (g: THREE.BufferGeometry): number => (g.index ? g.index.count : g.getAttribute('position').count) / 3;

/** The most faces a prop of the kind may have (the dead tree, the round bush and the boulder of before were about a third of these). */
const MOST: Partial<Record<PropKind, number>> = { tree: 900, pine: 600, rock: 700, bush: 600, stump: 300, log: 300, grave: 200, pillar: 500, monolith: 300 };

describe('every recurring prop in its realm\'s forms (round 111)', () => {
  it('every region has its own look, and the realms differ', () => {
    for (const r of REGIONS) expect(PROP_LOOKS[r.id], r.id).toBeDefined();
    expect(lookOf('nowhere')).toBe(PROP_LOOKS.hub);
    const rocks = new Set(Object.values(PROP_LOOKS).map((l) => JSON.stringify(l.rocks)));
    const trees = new Set(Object.values(PROP_LOOKS).map((l) => JSON.stringify(l.trees)));
    expect(rocks.size).toBeGreaterThan(12);
    expect(trees.size).toBeGreaterThan(8);
  });

  it('no colour of a look or a house reads as an anomaly, and none is garish', () => {
    const colours: (readonly [number, number, number])[] = [];
    for (const l of Object.values(PROP_LOOKS)) colours.push(l.bark, l.needles, l.top, ...l.leaves);
    for (const h of Object.values(HOUSE_LOOKS)) colours.push(...h.paints, ...h.roofs, ...h.doors);
    for (const c of colours) {
      expect(reads(c), `${c}`).toBe(false);
      expect(rgbToHsv(c)[1], `${c}`).toBeLessThan(0.7); // (October's rust, as before)
    }
  });

  for (const [kind, key] of FORM_KEYS) {
    for (const form of formsOf(key)) {
      it(`${kind}: ${form} builds, finite, within its size and its faces`, () => {
        const found = propOfForm(kind, key, form);
        expect(found, `${kind} ${form}`).not.toBeNull();
        const { p, region } = found!;
        const pieces = solids(propPieces(p, [0.6, 0.6, 0.58], region));
        expect(pieces.length).toBeGreaterThan(0);
        let faces = 0;
        for (const q of pieces) {
          const pos = q.geo.getAttribute('position');
          expect(q.geo.getAttribute('color'), `${form} ${q.mat} colour`).toBeDefined();
          for (let i = 0; i < pos.count; i++) {
            const [x, y, z] = [pos.getX(i), pos.getY(i), pos.getZ(i)];
            expect(Number.isFinite(x + y + z), `${form}`).toBe(true);
            expect(Math.hypot(x, z), `${kind} ${form} reach`).toBeLessThan(kind === 'tree' || kind === 'pine' ? p.h * 0.5 + 1.5 : Math.max(p.w, p.d) * 2.2 + 2.6); // a crown spreads as far as half its height
            expect(y, `${kind} ${form} height`).toBeLessThan(p.h * 2.4 + 1.5);
          }
          faces += tris(q.geo);
        }
        expect(faces, `${kind} ${form} faces`).toBeLessThan(MOST[kind]!);
      });
    }
  }

  it('each realm\'s houses build in every style, and the realms add their own', () => {
    let walks = 0;
    let turrets = 0;
    let boards = 0;
    for (const region of Object.keys(HOUSE_LOOKS)) {
      for (const style of ['clapboard', 'brick', 'hovel', 'stone'] as const) {
        for (let s = 1; s <= 10; s++) {
          const p = propAt('house', 0, 0, 0, createRng(s * 977), 0, undefined, style);
          const plain = housePieces(p, [0.6, 0.6, 0.58]);
          const own = housePieces(p, [0.6, 0.6, 0.58], region);
          expect(own.length).toBeGreaterThan(3);
          const trim = (ps: typeof own): number => tris(ps.find((q) => q.mat === 'trim')!.geo);
          const wall = (ps: typeof own): number => tris(ps[0].geo);
          if (region === 'innsmouth' && style === 'clapboard') {
            if (trim(own) > trim(plain) + 60) walks++;
            if (trim(own) > trim(plain)) boards++;
          }
          if (region === 'dreamlands' && style === 'stone' && wall(own) > wall(plain) + 20) turrets++;
        }
      }
    }
    expect(walks).toBeGreaterThan(0);
    expect(boards).toBeGreaterThan(3);
    expect(turrets).toBeGreaterThan(0);
  });
});
