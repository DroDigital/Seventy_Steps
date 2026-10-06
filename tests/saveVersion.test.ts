import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createWorldGame } from '../src/systems/game';
import { backupKey, loadSave, parseSave, SAVE_KEY } from '../src/systems/save';
import { carryForward, newerSave, SAVE_VERSION } from '../src/systems/saveVersion';
import { slotLine } from '../src/ui/titleSlots';

/** A save as 1.0.0-rc.1 wrote it (round 47): every later build must go on from it. */
const RC1 = readFileSync('tests/fixtures/save-v2-rc1.json', 'utf8');

const memory = (entries: Record<string, string> = {}) => {
  const data = new Map(Object.entries(entries));
  return { data, store: { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v), removeItem: (k: string) => void data.delete(k) } };
};

describe('save versions', () => {
  it("a release candidate's save still loads, whole", () => {
    const s = parseSave(RC1);
    expect(s).not.toBeNull();
    const g = createWorldGame({ save: s! });
    expect(g.player.echoes).toBe(4321);
    expect(g.player.levels.vigour).toBe(3);
    expect(g.overworld!.slain.has('boss:cthulhu')).toBe(true);
    expect(g.overworld!.sign).toBe('rlyeh_door');
    expect(g.overworld!.tally.deaths).toBe(7);
  });

  it('carries an older format forward a step at a time, and refuses one it has no way from', () => {
    const steps = { 2: (o: Record<string, unknown>) => ({ ...o, echoes: (o.echoes as number) * 2 }), 3: (o: Record<string, unknown>) => ({ ...o, renamed: o.sign }) };
    const got = carryForward({ version: 2, echoes: 5, sign: 'a' }, steps, 4, 2);
    expect(got).toEqual({ version: 4, echoes: 10, sign: 'a', renamed: 'a' });
    expect(carryForward({ version: 1 }, steps, 4, 2)).toBeNull(); // of another world
    expect(carryForward({ version: 3 }, {}, 4, 2)).toBeNull(); // a step missing
    expect(carryForward({ version: 5 }, steps, 4, 2)).toBeNull(); // newer
    expect(carryForward('2', steps, 4, 2)).toBeNull();
  });

  it("keeps a newer build's save: not read, not mended from a backup, and not shown as empty", () => {
    const newer = JSON.stringify({ ...JSON.parse(RC1), version: SAVE_VERSION + 1 });
    expect(newerSave(newer)).toBe(true);
    expect(newerSave(RC1)).toBe(false);
    expect(newerSave('{"torn')).toBe(false);
    const { data, store } = memory({ [SAVE_KEY]: newer, [backupKey(SAVE_KEY)]: RC1 });
    expect(loadSave(store, 1)).toBeNull();
    expect(data.get(SAVE_KEY)).toBe(newer); // the backup did not overwrite it
    expect(slotLine(store, 1)).toMatchObject({ loads: false });
    expect(slotLine(store, 2)).toBeNull();
  });
});
