import { describe, expect, it } from 'vitest';
import { bossHints } from '../src/ui/hints';
import { bossGame } from './bossHelpers';

describe('what each boss asks besides striking is said before the fight (round 25)', () => {
  const cases: [string, string[]][] = [
    ['cthulhu', ['ship']],
    ['dunwich_horror', ['powder']],
    ['ghatanothoa', ['cover']],
    ['shub_niggurath', ['roots']],
    ['yog_sothoth', ['spheres']],
    ['azathoth', ['blind']],
    ['deep_one', []],
  ];
  it.each(cases)('%s', (id, want) => {
    const { g, boss } = bossGame(id);
    const got = bossHints(g, boss);
    expect(got, id).toEqual(want);
  });
});
