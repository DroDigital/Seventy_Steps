import { describe, expect, it } from 'vitest';
import { AOE_MOTIFS } from '../src/render/aoeLook';
import { lookOf } from '../src/render/attackLook';
import { burst, charge, column, ELEMENTS, flash, impact, trail } from '../src/render/fxKit';
import { PARTICLE_SHAPES, type ParticleSpec, type Particles } from '../src/render/particles';

const rig = () => {
  const out: ParticleSpec[] = [];
  return { out, fx: { spawn: (p: ParticleSpec) => void out.push(p), update: () => undefined } as Particles };
};
const at = { x: 3, y: 1, z: -2 };
const look = lookOf('cthulhu');

function valid(list: ParticleSpec[], label: string): void {
  for (const p of list) {
    for (const n of [p.x, p.y, p.z, p.vx ?? 0, p.vy ?? 0, p.vz ?? 0, p.life, p.size]) expect(Number.isFinite(n), label).toBe(true);
    expect(p.life, label).toBeGreaterThan(0);
    expect(p.life, label).toBeLessThan(3);
    expect(p.size, label).toBeGreaterThan(0);
    expect(p.size, label).toBeLessThan(12);
    expect(p.alpha ?? 1, label).toBeLessThanOrEqual(1);
    if (p.shape) expect(PARTICLE_SHAPES, label).toContain(p.shape);
    for (const c of [p.color, p.colorEnd ?? p.color]) for (const n of c) expect(n, label).toBeGreaterThanOrEqual(0);
  }
}

describe('a blow\'s particles by element (round 51)', () => {
  it('has an element for every mark, and they are not all alike', () => {
    expect(Object.keys(ELEMENTS).sort()).toEqual([...AOE_MOTIFS].sort());
    const sig = new Set(Object.values(ELEMENTS).map((e) => `${e.chunk}|${e.glow}|${e.gravity}|${e.mist}|${e.glint}|${e.halo}`));
    expect(sig.size).toBeGreaterThanOrEqual(10);
  });

  it('a burst is made of the element\'s matter, scaled to the radius, within a budget, in every element', () => {
    for (const motif of AOE_MOTIFS) {
      const el = ELEMENTS[motif];
      for (const radius of [1, 4, 14]) {
        const { fx, out } = rig();
        burst(fx, el, at, radius, look);
        valid(out, `${motif} r${radius}`);
        expect(out.length, `${motif} r${radius}`).toBeGreaterThan(20);
        expect(out.length, `${motif} r${radius}`).toBeLessThan(260);
        expect(out.some((p) => p.shape === el.chunk), motif).toBe(true);
      }
      const small = rig();
      const big = rig();
      burst(small.fx, el, at, 1, look);
      burst(big.fx, el, at, 14, look);
      expect(big.out.length).toBeGreaterThan(small.out.length * 2);
      expect(Math.max(...big.out.map((p) => p.size))).toBeGreaterThan(Math.max(...small.out.map((p) => p.size)));
    }
  });

  it('a flash is brief and bright; a halo opens only for the elements of light', () => {
    for (const motif of AOE_MOTIFS) {
      const { fx, out } = rig();
      flash(fx, ELEMENTS[motif], at, 2, look);
      expect(out.every((p) => p.glow && p.life < 0.5), motif).toBe(true);
      expect(out.some((p) => p.shape === 'ring'), motif).toBe(ELEMENTS[motif].halo);
    }
  });

  it('a bolt\'s landing throws its spray back along the way it came, and its trail is a few particles a step', () => {
    const el = ELEMENTS.crack;
    const { fx, out } = rig();
    impact(fx, el, at, { x: 1, z: 0 }, 0.4, look);
    valid(out, 'impact');
    const flung = out.filter((p) => p.shape === el.chunk);
    expect(flung.length).toBeGreaterThan(5);
    expect(flung.filter((p) => (p.vx ?? 0) < 0).length).toBeGreaterThan(flung.length * 0.7); // back toward the caster
    for (const motif of AOE_MOTIFS) {
      const t = rig();
      trail(t.fx, ELEMENTS[motif], at, { x: 10, y: 0, z: 0 }, 0.3, look, motif === 'plain');
      valid(t.out, `trail ${motif}`);
      expect(t.out.length, motif).toBeGreaterThanOrEqual(2);
      expect(t.out.length, motif).toBeLessThanOrEqual(4);
    }
  });

  it('a charge draws matter inward toward its heart, more as it nears its end; a column rises', () => {
    const el = ELEMENTS.eye;
    const early = rig();
    const late = rig();
    for (let i = 0; i < 40; i++) {
      charge(early.fx, el, at, 2, 0.1, look);
      charge(late.fx, el, at, 2, 1, look);
    }
    valid(late.out, 'charge');
    expect(late.out.length).toBeGreaterThan(early.out.length);
    for (const p of late.out.filter((q) => q.shape !== 'wisp')) {
      const [dx, dz] = [p.x - at.x, p.z - at.z];
      expect(dx * (p.vx ?? 0) + dz * (p.vz ?? 0), 'drawn in').toBeLessThan(0.5);
    }
    const col = rig();
    column(col.fx, el, at, 1, 4, look);
    valid(col.out, 'column');
    expect(col.out.filter((p) => (p.vy ?? 0) > 3).length).toBeGreaterThan(8);
  });
});
