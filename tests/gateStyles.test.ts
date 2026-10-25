/**
 * The arenas' gates (round 76; data/gateStyles.ts, render/gateRig.ts, render/gateViews.ts, docs/GATES.md): every open horror's house has a
 * gate of its own made of baked free models, hung to fill the opening, swung or slid or lifted or sunk clear of it, and each source credited.
 */
import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { HOUSE } from '../src/data/arenaHouses';
import { ARENA_HOUSES } from '../src/data/arenaHousesAll';
import { DOOR_LOOKS } from '../src/data/doors';
import { GATE_STYLES, GATE_TIMING } from '../src/data/gateStyles';
import { GATE_INFO } from '../src/data/models/gateIndex';
import { MODEL_INFO } from '../src/data/models/index';
import { PASSAGE } from '../src/data/tuning';
import { gateRig } from '../src/render/gateRig';
import { loadModels } from '../src/render/modelKit';
import { worldLayout } from '../src/world/placements';

const arenas = worldLayout().arenas.filter((a) => a.house);
const BOSSES = Object.keys(ARENA_HOUSES);
const STONE = [0.6, 0.6, 0.58] as const;

beforeAll(loadModels);

describe('the styles of the gates', () => {
  it('give every open horror\'s house a gate of its own, and no style belongs to a house that is not there', () => {
    expect(BOSSES).toHaveLength(20);
    expect(Object.keys(GATE_STYLES).sort()).toEqual([...BOSSES].sort());
  });

  it('are made of baked models that are there, fitted inside the opening, sounding as a door of a kit the game has', () => {
    for (const [boss, s] of Object.entries(GATE_STYLES)) {
      expect(DOOR_LOOKS[s.sound], `${boss}: sound`).toBeTruthy();
      expect(s.parts.length, boss).toBeGreaterThan(0);
      for (const p of s.parts) {
        expect(MODEL_INFO[p.model], `${boss}: ${p.model}`).toBeTruthy();
        expect(p.span !== undefined || p.jamb !== undefined, `${boss}: ${p.model} says where it stands`).toBe(true);
        if (p.span) {
          expect(p.span[0], boss).toBeGreaterThanOrEqual(-0.5);
          expect(p.span[1], boss).toBeLessThanOrEqual(0.5);
          expect(p.span[1] - p.span[0], boss).toBeGreaterThan(0.05);
        }
        expect(p.delay ?? 0, boss).toBeLessThanOrEqual(0.6);
      }
    }
  });

  it('leave nothing still but the dressing: a style\'s leaves all move, and a swung leaf has a jamb to turn about', () => {
    for (const [boss, s] of Object.entries(GATE_STYLES)) {
      const moving = s.parts.filter((p) => (p.move ?? s.motion) !== 'still');
      expect(moving.length, `${boss}: what moves`).toBeGreaterThanOrEqual(1);
      for (const p of moving) {
        if ((p.move ?? s.motion) !== 'swing') continue;
        const span = p.span!;
        expect(span[0] <= -0.5 + 1e-6 || span[1] >= 0.5 - 1e-6, `${boss}: ${p.model} is hinged at a jamb`).toBe(true);
      }
    }
  });
});

describe('the gates hung in the houses', () => {
  it('stand every house\'s gate by its style, opening away from the side it is come to from', () => {
    expect(arenas).toHaveLength(20);
    for (const a of arenas) {
      const boss = a.bosses[0]!;
      const d = a.house!.piece.door!;
      expect(d.style, boss).toBe(boss);
      expect(d.out, boss).toBe((d.alongX ? a.house!.front.z : a.house!.front.x) >= 0 ? 1 : -1);
    }
  });

  it('are each hung from their models: a leaf at its jamb, the opening filled, the wall\'s thickness kept, nothing out of the ground', () => {
    for (const a of arenas) {
      const boss = a.bosses[0]!;
      const def = a.house!.piece;
      const { height: H, thick: T } = def.door!;
      const D = def.door!.width + 2 * HOUSE.lap; // the leaves reach to where the seal does
      const rig = gateRig(def, STONE);
      expect(rig, boss).toBeTruthy();
      expect(rig!.parts, boss).toHaveLength(GATE_STYLES[boss]!.parts.length);
      const covered: [number, number][] = [];
      rig!.parts.forEach((part, i) => {
        const src = GATE_STYLES[boss]!.parts[i]!;
        const box = { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity, z0: Infinity, z1: -Infinity };
        for (const piece of part.pieces) {
          piece.geo.computeBoundingBox();
          const b = piece.geo.boundingBox!;
          box.x0 = Math.min(box.x0, b.min.x); box.x1 = Math.max(box.x1, b.max.x);
          box.y0 = Math.min(box.y0, b.min.y); box.y1 = Math.max(box.y1, b.max.y);
          box.z0 = Math.min(box.z0, b.min.z); box.z1 = Math.max(box.z1, b.max.z);
        }
        expect(box.y0 + part.pivot[1], `${boss}: ${src.model} below the ground`).toBeGreaterThan(-(src.base ?? 0.3) - 1e-3 - (src.roll ? H : 0));
        if (!src.span) return;
        const [u0, u1] = [part.pivot[0] + box.x0, part.pivot[0] + box.x1];
        expect(u0, `${boss}: ${src.model} left edge`).toBeGreaterThan(src.span[0] * D - 0.1);
        expect(u1, `${boss}: ${src.model} right edge`).toBeLessThan(src.span[1] * D + 0.1);
        expect(u1 - u0, `${boss}: ${src.model} fills its share`).toBeGreaterThan((src.span[1] - src.span[0]) * D * 0.9);
        expect(box.z1 - box.z0, `${boss}: ${src.model} thick`).toBeLessThanOrEqual(T + 1e-3);
        if (part.move === 'swing') expect(Math.abs(part.pivot[0]), `${boss}: ${src.model} hinge`).toBeCloseTo(D / 2, 6);
        if ((src.move ?? GATE_STYLES[boss]!.motion) !== 'still') covered.push([src.span[0], src.span[1]]);
      });
      covered.sort((p, q) => p[0] - q[0]); // (rows may overlap, one behind another: the shut gate has no gap where the first starts, nor between the reach of those before and the next)
      let reach = -0.5;
      for (const [from, to] of covered) {
        expect(from - reach, `${boss}: no gap in the shut gate`).toBeLessThan(1e-6);
        reach = Math.max(reach, to);
      }
      expect(reach, `${boss}: to the right jamb`).toBeGreaterThanOrEqual(0.5 - 1e-6);
    }
  });

  it('clear the way before the seal\'s collider is lifted (a row goes one leaf after another, all within it)', () => {
    for (const s of Object.values(GATE_STYLES)) for (const p of s.parts) {
      if ((p.move ?? s.motion) === 'sink' || (p.move ?? s.motion) === 'lift') expect(GATE_TIMING.start + GATE_TIMING.stagger * (p.delay ?? 0) + GATE_TIMING.span, p.model).toBeLessThanOrEqual(PASSAGE.solidAt + 0.1);
    }
  });
});

describe('the gates\' sources', () => {
  const credits = readFileSync('src/data/models/CREDITS.md', 'utf8');
  const kits = new Set(Object.values(GATE_INFO).map((i) => i.kit));

  it('are free (CC0), each credited with the changes made to it', () => {
    expect(kits.size).toBeGreaterThanOrEqual(3);
    for (const k of kits) expect(credits, `credits of ${k}`).toContain(`Gate source ${k}`);
    expect(credits).toMatch(/Poly Haven/);
    expect(credits).toMatch(/changes|modified|decimated/i);
  });

  it('are baked in a set of their own, and none is stood by a place as well as a gate under another name', () => {
    expect(Object.keys(GATE_INFO).length).toBeGreaterThanOrEqual(7);
    for (const id of Object.keys(GATE_INFO)) expect(id.startsWith('gate_'), id).toBe(true);
  });
});
