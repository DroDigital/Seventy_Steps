import { describe, expect, it } from 'vitest';
import { BEAM_PATTERNS, BEAM_STYLES } from '../src/data/beamStyles';
import { ENTITIES } from '../src/data/registry';

const BEAMS = ['beam', 'sweep_beam'];

describe('beam styles', () => {
  it('gives every creature that fires a beam a pattern of its own, and uses most of the patterns', () => {
    const casters = ENTITIES.filter((e) => {
      const all = new Set<string>(e.behavior.attacks);
      for (const p of e.bossScript?.phases ?? []) for (const a of p.attacks) all.add(a.id);
      return BEAMS.some((b) => all.has(b));
    });
    expect(casters.length).toBeGreaterThan(15);
    expect(casters.filter((e) => !BEAM_STYLES[e.id]).map((e) => e.id)).toEqual([]);
    const used = new Set(casters.map((e) => BEAM_STYLES[e.id]));
    expect(used.size).toBeGreaterThanOrEqual(7);
    for (const p of Object.values(BEAM_STYLES)) expect(BEAM_PATTERNS).toContain(p);
    for (const id of Object.keys(BEAM_STYLES)) expect(ENTITIES.some((e) => e.id === id), id).toBe(true);
  });
});
