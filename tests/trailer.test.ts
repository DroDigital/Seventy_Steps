import { describe, expect, it } from 'vitest';
import { signPlace } from '../src/systems/checkpoints';
import { SCENES } from '../src/ui/trailer';
import { SPOTS } from '../src/ui/bench';

describe('the trailer and the benchmark', () => {
  it('visit real Elder Signs, each a different place, in several regions', () => {
    for (const s of [...SCENES, ...SPOTS.map((x) => x.sign)]) expect(signPlace(s), s).toBeDefined();
    expect(new Set(SCENES).size).toBe(SCENES.length);
    expect(new Set(SCENES.map((s) => signPlace(s)!.region)).size).toBeGreaterThanOrEqual(6);
  });
});
