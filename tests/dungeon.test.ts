import { DUNGEON_TRAPS } from '../src/data/dungeonTraps';
import { pitHoles } from '../src/world/pitForms';
import { describe, expect, it } from 'vitest';
import { SLUMBER_STEPS, type DungeonDef } from '../src/data/dungeons';
import { DUNGEON } from '../src/data/tuning';
import { hasLineOfSight, resolveCapsule } from '../src/world/colliders';
import { floorAt, layoutDungeon, roomAt, roomPoint, type DungeonLayout } from '../src/world/dungeonKit';
import { worldLayout } from '../src/world/placements';
import { createWorldCollision } from '../src/world/worldCollision';
import { stepsOf } from '../src/world/dungeonParts';
import { DIRS } from '../src/world/worldMap';

const placed = (id: string): DungeonLayout => worldLayout().dungeons.find((d) => d.layout.def.id === id)!.layout;
const room = (d: DungeonLayout, id: string) => d.rooms.find((r) => r.def.id === id)!;
const world = createWorldCollision();

describe('the dungeon kit', () => {
  it('lays a room graph out on 16 m cells; stairs change the floor', () => {
    const d = placed('witch_house');
    expect(d.errors).toEqual([]);
    const [parlour, stair, landing] = ['parlour', 'stair', 'landing'].map((id) => room(d, id));
    expect(parlour.x - room(d, 'hallway').x).toBe(-DUNGEON.cell); // west of the entrance
    expect(stair.z - parlour.z).toBe(DUNGEON.cell);
    expect(landing.level - parlour.level).toBeCloseTo(4, 6);
    const [x0, x1] = [stair.z - stair.half + 0.01, stair.z + stair.half - 0.01];
    expect(floorAt(stair, stair.x, x0)).toBeCloseTo(parlour.level, 1);
    expect(floorAt(stair, stair.x, (x0 + x1) / 2)).toBeCloseTo(parlour.level + 2, 1);
    expect(world.ground(stair.x, x1)).toBeCloseTo(landing.level, 1);
  });

  it('reports graphs the kit cannot build', () => {
    const def: DungeonDef = {
      id: 'bad', name: 'Bad', region: 'hub', rooms: [
        { id: 'a', kind: 'stair', dir: 's', rise: 2 },
        { id: 'b', kind: 'hall', from: 'a', dir: 'e' },
        { id: 'c', kind: 'corridor', from: 'nowhere', dir: 'n' },
        { id: 'd', kind: 'hall', from: 'b', dir: 'w' },
        { id: 'e', kind: 'corridor', from: 'b', dir: 'n', wide: true },
      ],
    };
    const errors = layoutDungeon(def, { x: 0, z: 0 }, 0).errors;
    expect(errors).toContain('a: the entrance cannot be a stair');
    expect(errors).toContain('b: stairs run straight on');
    expect(errors).toContain('c: opens off unknown or later room nowhere');
    expect(errors).toContain('d: overlaps a');
    expect(errors).toContain('e: only halls can be wide');
  });

  it('walls stop feet and eyes except in doorways; lintels hang overhead', () => {
    const d = placed('library');
    const door = d.doors.find((o) => o.b?.def.id === 'reading')!;
    const n = DIRS[door.side];
    const y = door.level + 1.4;
    const through = (off: number): boolean => {
      const [px, pz] = [n.z * off, -n.x * off];
      return hasLineOfSight(world, { x: door.x - n.x * 3 + px, y, z: door.z - n.z * 3 + pz }, { x: door.x + n.x * 3 + px, y, z: door.z + n.z * 3 + pz });
    };
    expect(through(0)).toBe(true);
    expect(through(DUNGEON.door / 2 + 0.6)).toBe(false);
    const high = door.level + DUNGEON.lintel + 0.5;
    expect(hasLineOfSight(world, { x: door.x - n.x * 3, y: high, z: door.z - n.z * 3 }, { x: door.x + n.x * 3, y: high, z: door.z + n.z * 3 })).toBe(false);
  });

  it('pits stop feet at the edge but not eyes across', () => {
    const d = placed('yhanthlei');
    const pit = room(d, 'pits');
    const [u0, u1, v0, v1] = pitHoles(DUNGEON_TRAPS.yhanthlei!.pit!, pit.half - DUNGEON.ledge)[0]!; // (2026-11-27: each dungeon's pits cut in a form of its own)
    const [u, v] = [(u0 + u1) / 2, (v0 + v1) / 2];
    const mid = roomPoint(pit, u, v);
    const pos = { x: mid.x, y: pit.level, z: mid.z };
    resolveCapsule(world, pos, 0.4, 1.8);
    const a = DIRS[pit.axis];
    const [pu, pv] = [(pos.x - pit.x) * a.z - (pos.z - pit.z) * a.x, (pos.x - pit.x) * a.x + (pos.z - pit.z) * a.z]; // back into the room's own frame
    expect(pu < u0 || pu > u1 || pv < v0 || pv > v1, 'pushed out of the hole').toBe(true);
    const y = pit.level + 1.6;
    const [l, r] = [roomPoint(pit, u - 6, v), roomPoint(pit, u + 6, v)];
    expect(hasLineOfSight(world, { x: l.x, y, z: l.z }, { x: r.x, y, z: r.z })).toBe(true);
  });

  it('the Stairs of Slumber are sealed and descend seventy, then seven hundred steps', () => {
    const d = placed('slumber');
    expect(d.def.sealed).toBe(true);
    expect(d.doors.some((o) => o.b === null)).toBe(false);
    const stairs = (from: string, to: string) => d.rooms.slice(d.rooms.findIndex((r) => r.def.id === from), d.rooms.findIndex((r) => r.def.id === to)).filter((r) => r.def.kind === 'stair');
    const steps = (from: string, to: string) => stairs(from, to).reduce((n, r) => n + stepsOf(r), 0);
    expect(steps('threshold', 'cavern')).toBe(70); // round 104: the steps are as many as the tale says
    expect(steps('cavern', 'deeper')).toBe(700);
    expect(room(d, 'cavern').level - d.base).toBeCloseTo(-70 * SLUMBER_STEPS.riser);
    expect(room(d, 'deeper').level - room(d, 'cavern').level).toBeCloseTo(-700 * SLUMBER_STEPS.riser);
    // Round 120 (asked: the 44 foes made the descent a gauntlet run at a sprint on potions) left six; round 121 (asked: "way too few", 15 to 25):
    // twenty, one or two on a flight (a narrow lane over the void) and three at most in a hall, with breathers between and none where one rests or arrives.
    const foes = d.rooms.flatMap((r) => r.def.spawns ?? []);
    expect(foes.length).toBeGreaterThanOrEqual(15);
    expect(foes.length).toBeLessThanOrEqual(25);
    for (const r of d.rooms) expect(r.def.spawns?.length ?? 0, r.def.id).toBeLessThanOrEqual(r.def.kind === 'hall' ? 3 : 2);
    for (const id of ['threshold', 'cavern', 'deeper']) expect(room(d, id).def.spawns ?? [], id).toEqual([]);
    // Round 122 (asked: no notice every fifty steps, only the important ones): the two stairs, the cavern and the gate.
    expect(d.rooms.filter((r) => r.def.words).map((r) => r.def.id)).toEqual(['light_1', 'cavern', 'deep_1', 'deeper']);
    let run = 0; // rooms in a row that hold foes: a quiet flight or landing always comes after two
    for (const r of d.rooms) {
      run = r.def.spawns?.length ? run + 1 : 0;
      expect(run, `${r.def.id}: three rooms in a row hold foes`).toBeLessThanOrEqual(2);
    }
    expect(d.errors).toEqual([]);
    expect(roomAt(d, worldLayout().dream!.x, worldLayout().dream!.z)?.def.id).toBe('threshold');
    const on = room(d, 'light_1');
    const dream = worldLayout().dream!;
    expect(Math.cos(dream.yaw) * (on.z - dream.z) + Math.sin(dream.yaw) * (on.x - dream.x)).toBeGreaterThan(0); // the dreamer faces the stair, not the wall behind
  });

  it('hidden bridges and doors become hidden-layer pieces with seals', () => {
    const pieces = worldLayout().pieces;
    const bridge = pieces.find((p) => p.name === 'Akeley Farmhouse: span')!;
    expect(bridge.minInsight).toBe(4);
    expect(bridge.seal?.look).toBe('none');
    const door = pieces.find((p) => p.name === 'University Library: restricted')!;
    expect(door.seal?.look).toBe('wall');
    expect(door.glow).toBe('purple');
    expect(pieces.find((p) => p.name === "Risen R'lyeh: wrong")!.maxSanity).toBe(40);
  });
});
