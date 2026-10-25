import { describe, expect, it } from 'vitest';
import { at, lane, put, ring, scatter, type ArenaSet } from '../src/data/arenaSets';
import { ARENA_SETS } from '../src/data/arenaSetsAll';
import { ARENA_WAYS } from '../src/data/arenaWaysAll';
import { HALL_SETS } from '../src/data/hallSets';
import { ROOM_SETS } from '../src/data/roomSets';
import { MODEL_INFO } from '../src/data/models/index';
import { PROP_KINDS } from '../src/data/regions';
import { SET_KITS } from '../src/data/setKits';
import { groundMark } from '../src/world/arenaGround';
import { arenaSet, SET_RULES, type SetSite } from '../src/world/arenaSet';
import { reach } from '../src/world/arenaDecor';
import { worldLayout } from '../src/world/placements';
import { propCollider } from '../src/world/props';
import { TEXTURE_KINDS } from '../src/render/textures';

const SITE: SetSite = { x: 100, z: -40, y: 3, radius: 24, front: { x: 0, z: -1 }, well: false };
const apart = (a: { x: number; z: number }, b: { x: number; z: number }): number => Math.hypot(a.x - b.x, a.z - b.z);

describe('an arena set (round 61: each horror\'s ground composed from its own story)', () => {
  it('is placed the same way twice', () => {
    const set = ARENA_SETS.black_man;
    expect(arenaSet(set, SITE)).toEqual(arenaSet(set, SITE));
  });

  it('turns each layout about the front: a piece at 0° down the way in, at 180° behind the heart', () => {
    const set: ArenaSet = { puts: [put('bedroll', at(1.2, 0), { walk: true }), put('bedroll', at(0.5, 180), { walk: true })] }; // flat ones, which are walked over
    const [frontPiece, back] = arenaSet(set, SITE);
    expect(apart(frontPiece, { x: SITE.x, z: SITE.z - 1.2 * 24 })).toBeLessThan(0.01); // front is toward -z
    expect(apart(back, { x: SITE.x, z: SITE.z + 0.5 * 24 })).toBeLessThan(0.01);
  });

  it('keeps the fight clear: nothing solid within the circle of it but a heart', () => {
    const set: ArenaSet = { puts: [put('prop:pillar', ring(0.5, 12)), put('prop:pillar', ring(1.0, 12)), put('altar_stone', at(0.5, 90), { heart: true })] };
    const placed = arenaSet(set, SITE);
    for (const p of placed) {
      const heart = p.kind === 'set' && p.set?.id === 'altar_stone';
      if (!heart) expect(apart(p, SITE) - reach(p), `${p.kind}`).toBeGreaterThanOrEqual(SET_RULES.inner * SITE.radius);
    }
    expect(placed.some((p) => p.kind === 'set')).toBe(true); // the heart stands
  });

  it('keeps the way in: nothing solid across the lane from the front', () => {
    const set: ArenaSet = { puts: [put('prop:pillar', at(1.3, 0)), put('prop:pillar', at(1.3, 0, { side: 4, mirror: true })), put('prop:pillar', lane([1.2, 1.8], 3, 3.4))] };
    for (const p of arenaSet(set, SITE)) {
      const along = (p.x - SITE.x) * SITE.front.x + (p.z - SITE.z) * SITE.front.z;
      const across = Math.abs(-(p.x - SITE.x) * SITE.front.z + (p.z - SITE.z) * SITE.front.x);
      expect(across - reach(p), `${along}`).toBeGreaterThanOrEqual(SET_RULES.lane);
    }
  });

  it('stands a lane\'s pieces clear of the way by their own breadth, so a broad one is set out wider and not lost', () => {
    const set: ArenaSet = { puts: [put('slab', lane([1.2, 1.8], 2, 2), { size: 1 })] };
    const placed = arenaSet(set, SITE);
    expect(placed).toHaveLength(4);
    for (const p of placed) expect(Math.abs(-(p.x - SITE.x) * SITE.front.z + (p.z - SITE.z) * SITE.front.x) - reach(p)).toBeGreaterThanOrEqual(SET_RULES.lane);
  });

  it('leaves a way through between two solid pieces, unless both are joined (a wall, a colonnade)', () => {
    const crowded: ArenaSet = { puts: [put('prop:pillar', ring(1.0, 60))] };
    const solid = arenaSet(crowded, SITE).filter((p) => propCollider(p));
    expect(solid.length).toBeGreaterThan(5);
    for (let i = 0; i < solid.length; i++) for (let j = i + 1; j < solid.length; j++) expect(apart(solid[i], solid[j]) - reach(solid[i]) - reach(solid[j])).toBeGreaterThanOrEqual(SET_RULES.gap);
    const wall: ArenaSet = { puts: [put('hedge', ring(1.0, 24, { arc: [30, 330] }), { join: true })] };
    expect(arenaSet(wall, SITE).length).toBeGreaterThan(solid.length / 2);
  });

  it('stands what is walked over without a collider', () => {
    const set: ArenaSet = { puts: [put('bedroll', at(0, 0), { size: 8, walk: true }), put('bedroll', scatter(6, [0.3, 0.9]), { walk: true })] };
    for (const p of arenaSet(set, SITE)) expect(propCollider(p)).toBeNull();
  });
});

describe('the sets of the open arenas', () => {
  const w = worldLayout();

  it('give each open arena one of its own, and name no arena that is not', () => {
    for (const a of w.arenas) expect(ARENA_SETS[a.bosses[0]], a.bosses[0]).toBeDefined();
    const horrors = new Set(w.arenas.map((a) => a.bosses[0]));
    for (const id of Object.keys(ARENA_SETS)) expect(horrors.has(id), id).toBe(true);
  });

  it('have no decorative floor glyphs in any arena, hall or approach', () => {
    const pieces = [...Object.values(ARENA_SETS), ...Object.values(HALL_SETS)].flatMap((s) => s.puts.map((p) => p.piece));
    pieces.push(...Object.values(ARENA_WAYS).flatMap((w) => w.marks.map((m) => m.piece)));
    expect(pieces.some((p) => p.of.startsWith('inlay_'))).toBe(false);
    for (const a of w.arenas) expect(a.decor.some((p) => p.set?.id.startsWith('inlay_')), a.bosses[0]).toBe(false);
  });

  it('name only what is there: a baked model, a built piece, a world prop', () => {
    for (const [id, set] of Object.entries(ARENA_SETS)) {
      for (const { piece } of set.puts) {
        const known = piece.of.startsWith('prop:') ? (PROP_KINDS as readonly string[]).includes(piece.of.slice(5)) : !!MODEL_INFO[piece.of] || !!SET_KITS[piece.of];
        expect(known, `${id}: ${piece.of}`).toBe(true);
      }
    }
  });

  it('use no baked model that no arena stands, nor stand one not baked (no dead weight in the bundle)', () => {
    const used = new Set([...Object.values(ARENA_SETS), ...Object.values(HALL_SETS), ...Object.values(ROOM_SETS)].flatMap((s) => s.puts.map((p) => p.piece.of)).concat(Object.values(ARENA_WAYS).flatMap((w) => w.marks.map((m) => m.piece.of)))); // (round 62: a trail's marks stand them too; round 72: and the boss halls' sets, now that the open arenas keep few; round 77: and the ordinary rooms')
    for (const a of w.arenas) for (const p of a.house?.props ?? []) if (p.set) used.add(p.set.id); // (round 71: and a place's planner, world/places)
    const unused = Object.keys(MODEL_INFO).filter((id) => !used.has(id));
    expect(unused, 'baked but stood nowhere').toEqual([]);
  });

  it('lay a ground of a texture the world has', () => {
    for (const [id, set] of Object.entries(ARENA_SETS)) if (set.ground) expect((TEXTURE_KINDS as readonly string[]).includes(set.ground.texture), `${id}: ${set.ground.texture}`).toBe(true);
  });

  it('have their pieces placed in every arena (a set of 20 puts of a few pieces each does not come out empty)', () => {
    for (const a of w.arenas) expect(a.decor.length, a.bosses[0]).toBeGreaterThanOrEqual(10);
  });

  it('keep what the fight is held about and what lights it: a heart\'s piece and a lit one stand in every arena that names them', () => {
    for (const a of w.arenas) {
      const set = ARENA_SETS[a.bosses[0]];
      if (!set) continue;
      for (const { piece } of set.puts) {
        if (!piece.heart && !piece.lit) continue;
        const stands = a.decor.some((p) => (piece.of.startsWith('prop:') ? p.kind === piece.of.slice(5) : p.set?.id === piece.of));
        expect(stands, `${a.bosses[0]}: ${piece.of}`).toBe(true);
      }
    }
  });

  it('keep a boss\'s feet clear: nothing solid within 3 m of where it is raised', () => {
    for (const s of w.spawns) {
      if (!s.arena) continue;
      const a = w.arenas.find((x) => x.x === s.arena!.x && x.z === s.arena!.z);
      if (!a) continue;
      for (const p of a.decor) if (propCollider(p)) expect(apart(p, s.at) - reach(p), `${s.id}: ${p.kind} ${p.set?.id ?? ''}`).toBeGreaterThan(3);
    }
  });

  it('face their arenas toward the realm\'s nearest Elder Sign (the candle burns where the way in is)', () => {
    for (const a of w.arenas) expect(Math.hypot(a.front.x, a.front.z)).toBeCloseTo(1, 5);
  });
});

describe('an arena\'s ground', () => {
  const g = { x: 0, z: 0, radius: 24, front: { x: 0, z: -1 }, spec: { texture: 'sand', tint: [0.5, 0.5, 0.4] as const, reach: 10, bands: [{ r0: 0.5, r1: 0.7, k: 0.5 }] } };

  it('is the arena\'s inside its ring, runs out beyond it and is none further', () => {
    expect(groundMark(g, 0, 5)!.share).toBe(1);
    expect(groundMark(g, 24 + 5, 0)!.share).toBeGreaterThan(0);
    expect(groundMark(g, 24 + 5, 0)!.share).toBeLessThan(1);
    expect(groundMark(g, 24 + 11, 0)).toBeNull();
  });

  it('darkens in its bands, softly at their edges', () => {
    expect(groundMark(g, 0.6 * 24, 0)!.k).toBeLessThan(0.6);
    expect(groundMark(g, 0.3 * 24, 0)!.k).toBe(1);
    const edge = groundMark(g, 0.51 * 24, 0)!.k;
    expect(edge).toBeGreaterThan(groundMark(g, 0.6 * 24, 0)!.k);
    expect(edge).toBeLessThan(1);
  });
});
