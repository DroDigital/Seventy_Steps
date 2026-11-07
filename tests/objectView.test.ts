import { describe, expect, it } from 'vitest';
import { createRng } from '../src/core/rng';
import { PROP_KINDS } from '../src/data/regions';
import type { HouseStyle } from '../src/data/regionFeatures';
import { housePieces } from '../src/render/houseMesh';
import { propPieces, solids } from '../src/render/propShapes';
import { propAt } from '../src/world/props';
import { auditObject } from './objectAudit';
import { FORM_KEYS, formsOf, propOfForm } from './propForms';
import { HOUSE_LOOKS } from '../src/data/houseLooks';
import type * as THREE from 'three';

/**
 * What the eye meets of a prop or a house seen from all about (round 21), by the same rays as the
 * dungeons': no back of a face first (a hole: the underside of a roof's eaves was open sky, a rock's
 * seam was torn along its length), and no face of another look within 12 cm before or behind
 * another's. What stands off a wall (a house's frames, glass and door) is drawn nearer than it is
 * (the materials 'trim' and 'pane'), so it is set apart. The smallest props (headstones, fire pits,
 * bushes, rails) hold details finer than that, and the roofs of stone houses a hollow lid, and stand
 * outside this.
 */
const SMALL: ReadonlySet<string> = new Set(['grave', 'firepit', 'bush', 'fence', 'altar']);
const STYLES: readonly HouseStyle[] = ['clapboard', 'brick', 'hovel'];
const RELIEF: ReadonlySet<string> = new Set(['trim', 'pane']);

describe('what the eye meets of a prop or a house (round 21)', () => {
  it('houses, rocks, trees, pillars and the realms landmarks show no hole and no fight', () => {
    const found: string[] = [];
    let objects = 0;
    for (const kind of PROP_KINDS.filter((k) => !SMALL.has(k))) {
      for (const style of kind === 'house' ? STYLES : [undefined]) {
        for (let seed = 1; seed <= 3; seed++) {
          const p = propAt(kind, 0, 0, 0, createRng(seed * 977 + kind.length * 31), 0, undefined, style);
          const pieces = kind === 'house' ? housePieces(p, [0.6, 0.6, 0.58]) : solids(propPieces(p, [0.6, 0.6, 0.58]));
          const parts = pieces.map((q, i) => ({ tag: `${kind}${style ? `/${style}` : ''}/${q.mat}${i}`, tex: RELIEF.has(q.mat) ? `${q.mat}+` : q.mat, geo: q.geo }));
          objects++;
          for (const f of auditObject(parts)) if (!(kind === 'tree' && f.key.startsWith('leaf:tree'))) found.push(`${kind}${style ? `/${style}` : ''} seed ${seed}: ${f.kind} ${f.key}`); // a tree's leaves are round clumps that cross one another: their surfaces meet along a line, they do not lie one over another
        }
      }
    }
    expect(objects).toBeGreaterThan(40);
    expect(found).toEqual([]);
  }, 120000);

  it('every form of every realm, and each realm\'s houses (round 111)', () => {
    const found: string[] = [];
    const look = (tag: string, pieces: readonly { mat: string; geo: THREE.BufferGeometry }[], leafy: boolean): string[] => {
      const parts = pieces.map((q, i) => ({ tag: `${tag}/${q.mat}${i}`, tex: RELIEF.has(q.mat) ? `${q.mat}+` : q.mat, geo: q.geo }));
      return auditObject(parts).filter((f) => !(leafy && f.key.startsWith('leaf:'))).map((f) => `${tag}: ${f.kind} ${f.key}`); // a crown's clumps and caps cross one another, as a tree's always did
    };
    const see = (tag: string, pieces: readonly { mat: string; geo: THREE.BufferGeometry }[], leafy: boolean): void => void found.push(...look(tag, pieces, leafy));
    for (const [kind, key] of FORM_KEYS) {
      if (SMALL.has(kind)) continue;
      for (const form of formsOf(key)) {
        for (const nth of [0, 1]) {
          const it = propOfForm(kind, key, form, nth);
          if (it) see(`${kind}:${form}#${nth}`, solids(propPieces(it.p, [0.6, 0.6, 0.58], it.region)), kind === 'tree');
        }
      }
    }
    for (const region of Object.keys(HOUSE_LOOKS)) {
      for (const style of [...STYLES, 'stone' as const]) {
        for (let seed = 1; seed <= 2; seed++) {
          const p = propAt('house', 0, 0, 0, createRng(seed * 977 + region.length * 13), 0, undefined, style);
          const tag = `house/${style}#${seed}`;
          const before = new Set(look(tag, housePieces(p, [0.6, 0.6, 0.58]), false)); // what the house had before its realm's look (a flat stone roof is a hollow lid, a footing's step, as the first audit leaves them)
          found.push(...look(tag, housePieces(p, [0.6, 0.6, 0.58], region), false).filter((f) => !before.has(f)).map((f) => `${region} ${f}`));
        }
      }
    }
    expect(found).toEqual([]);
  }, 300000);
});
