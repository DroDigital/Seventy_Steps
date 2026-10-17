import { describe, expect, it } from 'vitest';
import type { Decals } from '../src/render/decals';
import { createGroundFx } from '../src/render/groundFx';

function rig() {
  const calls: { kind: string; args: number[]; mark?: string }[] = [];
  let mark = 'plain';
  const rec = (kind: string) => (...args: unknown[]): void => void calls.push({ kind, args: args.filter((a): a is number => typeof a === 'number'), mark });
  const decals = { begin: () => undefined, end: () => undefined, disc: rec('disc'), sector: rec('sector'), lane: rec('lane'), ring: rec('ring'), swirl: rec('swirl'), scar: rec('scar'), sigil: rec('sigil'), style: (m: { name: string }) => void (mark = m.name) } as unknown as Decals;
  const ground = createGroundFx();
  const draw = (time: number): typeof calls => (calls.length = 0, ground.draw(decals, time), [...calls]);
  return { ground, draw };
}
const at = { x: 1, y: 2, z: 3 };
const color = [1, 0.5, 0.2] as const;

describe('what a blow leaves on the ground (round 51)', () => {
  it('a scar is fresh, cools, and goes: age runs 0 to 1 over its life, in the horror\'s mark', () => {
    const { ground, draw } = rig();
    draw(0);
    ground.scar(at, 3, color, 'cthulhu', 10);
    const first = draw(0)[0]!;
    expect(first.kind).toBe('scar');
    expect(first.mark).toBe('tide');
    expect(first.args[4]).toBeCloseTo(0, 5); // fresh
    expect(draw(5)[0]!.args[4]).toBeCloseTo(0.5, 5);
    expect(draw(9.9)[0]!.args[4]).toBeGreaterThan(0.95);
    expect(draw(10.1)).toEqual([]);
    expect(ground.count()).toBe(0);
  });

  it('a shock ring races outward, thinning and fading; a sigil is drawn in, held and let go', () => {
    const { ground, draw } = rig();
    draw(0);
    ground.shock(at, 1, 9, color, undefined, 0.5, 2);
    const [a, b] = [draw(0.1)[0]!, draw(0.4)[0]!];
    expect(b.args[3]!).toBeGreaterThan(a.args[3]!); // radius grows
    expect(b.args[4]!).toBeLessThan(a.args[4]!); // and thins
    expect(draw(0.45)[0]!.args[5]).toBeLessThan(0.3); // faded
    expect(draw(0.6)).toEqual([]);
    draw(1);
    ground.sigil(at, 3, color, 'hastur', 2);
    const s = draw(1.2)[0]!;
    expect(s.kind).toBe('sigil');
    expect(s.args[4]).toBeLessThan(1); // not all of it yet
    expect(draw(2)[0]!.args[4]).toBe(1);
    expect(draw(3.1)).toEqual([]);
  });

  it('a slash lights an arc and is gone in a quarter of a second', () => {
    const { ground, draw } = rig();
    draw(0);
    ground.slash(at, 4, 0.5, [80, -60], color, 'yig');
    expect(draw(0.05)[0]!.kind).toBe('sector');
    expect(draw(0.3)).toEqual([]);
  });

  it('keeps to a few dozen marks, the oldest going first', () => {
    const { ground, draw } = rig();
    draw(0);
    for (let i = 0; i < 200; i++) ground.scar({ x: i, y: 0, z: 0 }, 1, color);
    expect(ground.count()).toBeLessThanOrEqual(60);
    const xs = draw(0).map((c) => c.args[0]!);
    expect(Math.min(...xs)).toBeGreaterThan(130);
  });
});
