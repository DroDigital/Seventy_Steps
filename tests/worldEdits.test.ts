/**
 * The world editor's edits (round 110): every committed edit still finds what it names; edits laid
 * over a region's plan, an arena's dressing and the foes' posts move, remove and add what they say,
 * and are taken off again; the working set's undo, merge and export; the file tool's round trip.
 */

import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { afterEach, describe, expect, it } from 'vitest';
import { REGIONS } from '../src/data/regions';
import { SITES } from '../src/data/sites';
import { NOTE_SITES } from '../src/data/documents';
import { WORLD_EDITS } from '../src/data/worldEdits';
import { chunkContent } from '../src/world/chunks';
import { applyProps, originOf, refOf, siteAt, specProp } from '../src/world/edits/editApply';
import { editKey, editProblem, propKey, readDataFile, takeExport, writeDataFile } from '../src/world/edits/editFile';
import { putInForce } from '../src/world/edits/editRefresh';
import { setActiveEdits } from '../src/world/edits/editStore';
import type { WorldEdit } from '../src/world/edits/editTypes';
import { worldLayout } from '../src/world/placements';
import { basePropsOf, regionPlan } from '../src/world/regionPlan';
import { chunkKey, chunkOf } from '../src/world/worldMap';
import { addProp, createSession, exportFile, removeProp, setProp } from '../src/editor/editorSession';
import { hitBox, pick, type Item } from '../src/editor/editorItems';
import { touchedChunks } from '../src/editor/editorSpots';

const arkham = REGIONS.find((r) => r.id === 'arkham')!;
const propsIn = (x: number, z: number) => chunkContent(chunkOf(x), chunkOf(z)).props;

afterEach(() => putInForce(WORLD_EDITS.edits));

describe('the committed edits', () => {
  it('are well formed and each finds what it names', () => {
    for (const e of WORLD_EDITS.edits) {
      expect(editProblem(e), JSON.stringify(e)).toBeNull();
      if ('add' in e) {
        if ('prop' in e) expect(specProp(e.prop), `${e.add}: a piece not known`).not.toBeNull();
        continue;
      }
      if ('site' in e) {
        const s = SITES[e.site.region];
        const ids = s ? [...s.signs.map((x) => x.id), ...s.gates.map((x) => x.id), ...s.tomes.map((x) => x.name), ...s.allies.map((x) => x.id), ...s.arenas.map((x) => x.bosses[0]), ...s.dungeons.map((x) => x.id), ...(NOTE_SITES[e.site.region] ?? []).map(([n]) => n)] : [];
        expect(ids, `${e.site.site} ${e.site.id}`).toContain(e.site.id);
        continue;
      }
      if ('spawn' in e) {
        const all = [...worldLayout().spawns, ...REGIONS.flatMap((r) => [...regionPlan(r).spawns.values()].flat())].map((s) => s.id);
        expect(all, e.spawn).toContain(e.spawn);
        continue;
      }
      const [kind, id] = e.prop.group.split(':') as [string, string];
      const base =
        kind === 'region' ? basePropsOf(REGIONS.find((r) => r.id === id)!) : (kind === 'arena' ? worldLayout().arenas.find((a) => a.bosses[0] === id)?.decor : worldLayout().dungeons.find((d) => d.layout.def.id === id)?.decor) ?? [];
      putInForce([]);
      const keys = new Set(base.map((p) => propKey(refOf(e.prop.group, p))));
      expect(keys.has(propKey(e.prop)), `${e.prop.kind} at ${e.prop.at.join(', ')} in ${e.prop.group}`).toBe(true);
    }
  });
});

describe('edits laid over the world', () => {
  it('move, change, remove and add props of a region plan, and come off again', () => {
    const base = basePropsOf(arkham);
    const [a, b] = [base.find((p) => p.kind === 'house')!, base.find((p) => p.kind !== 'house' && p.kind !== 'set')!];
    const group = 'region:arkham';
    const edits: WorldEdit[] = [
      { prop: refOf(group, a), set: { x: a.x + 3, yaw: 1, style: 'stone' } },
      { prop: refOf(group, b), remove: true },
      { add: 'test01', region: 'arkham', prop: { kind: 'lamp', x: a.x - 40, y: 0, z: a.z, w: 0.12, d: 0, h: 3.4, yaw: 0, seed: 1 } },
    ];
    putInForce(edits);
    const moved = propsIn(a.x + 3, a.z).find((p) => p.kind === 'house' && Math.abs(p.x - a.x - 3) < 1e-9 && p.z === a.z)!;
    expect(moved).toBeDefined();
    expect([moved.yaw, moved.style]).toEqual([1, 'stone']);
    expect(originOf(group, moved)).toEqual({ ref: refOf(group, a) });
    expect(propsIn(b.x, b.z).some((p) => p.x === b.x && p.z === b.z && p.kind === b.kind)).toBe(false);
    const lamp = propsIn(a.x - 40, a.z).find((p) => p.kind === 'lamp' && p.x === a.x - 40)!;
    expect(originOf(group, lamp)).toEqual({ add: 'test01', region: 'arkham' });
    expect(regionPlan(arkham).colliders.get(chunkKey(chunkOf(a.x - 40), chunkOf(a.z)))?.some((c) => c.kind === 'cylinder' && c.x === a.x - 40)).toBe(true);
    putInForce([]);
    expect(propsIn(a.x, a.z).some((p) => p === a)).toBe(true);
    expect(propsIn(b.x, b.z).some((p) => p === b)).toBe(true);
  });

  it("lays edits over an arena's dressing in place, and off again", () => {
    const arena = worldLayout().arenas.find((x) => x.decor.length > 2)!;
    const group = `arena:${arena.bosses[0]}`;
    const first = arena.decor[0]!;
    const n = arena.decor.length;
    putInForce([{ prop: refOf(group, first), remove: true }]);
    expect(arena.decor.length).toBe(n - 1);
    expect(arena.decor).not.toContain(first);
    putInForce([]);
    expect(arena.decor.length).toBe(n);
    expect(arena.decor[0]).toBe(first);
  });

  it("moves and removes foes' posts, adds new ones, and moves sites", () => {
    const posts = [...regionPlan(arkham).spawns.values()].flat();
    const [s, t] = [posts[0]!, posts[1]!];
    putInForce([
      { spawn: s.id, set: { x: s.at.x + 5, entity: 'deep_one' } },
      { spawn: t.id, remove: true },
      { add: 'foe01', foe: { entity: 'deep_one', region: 'arkham', x: s.at.x, z: s.at.z + 7, yaw: 0 } },
      { site: { site: 'sign', region: 'arkham', id: 'arkham_heath' }, set: { at: [250, 190] } },
    ]);
    const after = [...regionPlan(arkham).spawns.values()].flat();
    expect(after.find((x) => x.id === s.id)).toMatchObject({ entity: 'deep_one', at: { x: s.at.x + 5 } });
    expect(after.some((x) => x.id === t.id)).toBe(false);
    expect(after.find((x) => x.id === 'edit:foe01')?.at.z).toBe(s.at.z + 7);
    expect(siteAt('sign', 'arkham', 'arkham_heath', [240, 184])).toEqual([250, 190]);
    expect(siteAt('sign', 'arkham', 'arkham_streets', [448, 256])).toEqual([448, 256]);
  });

  it('leaves a list no edit touches as it is', () => {
    setActiveEdits([]);
    const list = basePropsOf(arkham).slice(0, 5) as never[];
    expect(applyProps('region:arkham', list)).toBe(list);
  });
});

describe('the working set', () => {
  const ref = { group: 'region:arkham', kind: 'rock' as const, at: [10, 20] as const };
  it('merges changes of one thing, removes an added one outright, and undoes', () => {
    let list: WorldEdit[] = [];
    const s = createSession(list, (l) => (list = [...l]));
    s.change(setProp(s.list, { ref }, { x: 11 }));
    s.change(setProp(s.list, { ref }, { yaw: 2, look: { scale: 2 } }));
    expect(s.list).toEqual([{ prop: ref, set: { x: 11, yaw: 2, look: { scale: 2 } } }]);
    s.change(addProp(s.list, 'abc', 'arkham', { kind: 'rock', x: 0, y: 0, z: 0, w: 1, d: 0, h: 1, yaw: 0, seed: 1 }));
    s.change(setProp(s.list, { add: 'abc', region: 'arkham' }, { yaw: 1 }));
    expect(s.list[1]).toMatchObject({ add: 'abc', prop: { yaw: 1 } });
    s.change(removeProp(s.list, { add: 'abc', region: 'arkham' }));
    expect(s.list).toHaveLength(1);
    expect(s.undo()).toBe(true);
    expect(s.list).toHaveLength(2);
    expect(s.redo()).toBe(true);
    expect(list).toHaveLength(1);
  });

  it('is exported whole and taken in over what was committed since', () => {
    const older: WorldEdit = { prop: { ...ref, at: [1, 1] }, remove: true };
    const dropped: WorldEdit = { prop: { ...ref, at: [2, 2] }, remove: true };
    const since: WorldEdit = { prop: { ...ref, at: [3, 3] }, remove: true };
    const mine: WorldEdit = { prop: ref, set: { x: 4 } };
    const file = exportFile([older, mine], [older, dropped], 'a note', 'now');
    expect(file).toMatchObject({ format: 'seventy-steps-world-edits', version: 1, note: 'a note', base: [editKey(older), editKey(dropped)] });
    expect(takeExport([older, dropped, since], file)).toEqual([since, older, mine]);
  });

  it('names the chunks a change touches, at both ends of a move', () => {
    const touched = touchedChunks([], [{ prop: ref, set: { x: 500 } }]);
    expect(touched).toContain(chunkKey(chunkOf(10), chunkOf(20)));
    expect(touched).toContain(chunkKey(chunkOf(500), chunkOf(20)));
  });
});

describe('picking', () => {
  it('meets a turned box along a ray, and takes the nearest', () => {
    const box = { x: 0, y: 0, z: 10, yaw: Math.PI / 4, hx: 1, hz: 1, h: 2 };
    expect(hitBox([0, 1, 0], [0, 0, 1], box)).toBeCloseTo(10 - Math.SQRT2, 5);
    expect(hitBox([5, 1, 0], [0, 0, 1], box)).toBeNull();
    const rock = (key: string, z: number): Item => ({ type: 'prop', key, group: 'region:arkham', region: 'arkham', prop: { kind: 'rock', x: 0, y: 0, z, w: 1, d: 0, h: 1, yaw: 0, seed: 1 }, origin: { add: key, region: 'arkham' } });
    expect(pick([rock('far', 15), rock('near', 5)], [0, 0.5, 0], [0, 0, 1])?.key).toBe('near');
    expect(pick([rock('far', 15)], [0, 5, 0], [0, 0, 1])).toBeNull();
  });
});

describe('the edit file', () => {
  it('reads and writes data/worldEdits.ts without loss', () => {
    const text = readFileSync('src/data/worldEdits.ts', 'utf8');
    const edits: WorldEdit[] = [{ site: { site: 'sign', region: 'arkham', id: 'arkham_heath' }, set: { at: [250, 190], face: 'n' } }];
    const written = writeDataFile(text, edits);
    expect(readDataFile(written).edits).toEqual(edits);
    expect(readDataFile(writeDataFile(written, WORLD_EDITS.edits))).toEqual(readDataFile(text));
  });

  it('is described by the tool, one line for each edit', () => {
    const dir = mkdtempSync(tmpdir() + '/edits-');
    const path = `${dir}/export.json`;
    writeFileSync(path, JSON.stringify(exportFile([{ prop: { group: 'region:arkham', kind: 'rock', at: [1, 2] }, remove: true }], [], 'move the rock')));
    const out = spawnSync(process.execPath, ['tools/world_edits.mjs', 'describe', path], { env: process.env, encoding: 'utf8' });
    expect(out.status, out.stderr).toBe(0);
    expect(out.stdout).toContain('Note: move the rock');
    expect(out.stdout).toContain('remove the rock of region:arkham at (1.00, 2.00)');
  });
});
