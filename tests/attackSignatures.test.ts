import { describe, expect, it } from 'vitest';
import { FORMS, MOTIONS, SIGNATURES, isHorrorSignature } from '../src/data/attackSignatures';
import { BOSS_ATTACK_THEME } from '../src/data/bossAttackTheme';
import { FOE_BLOWS } from '../src/data/foeBlows';
import { ENTITIES } from '../src/data/registry';
import { LIGHT_FLOOR, lookOf } from '../src/render/attackLook';
import { BUDGET, FORM_SPECS, signature, type Moment } from '../src/render/fxForms';
import { burst, ELEMENTS, impact } from '../src/render/fxKit';
import { luma } from '../src/render/palette';
import { land, type ParticleSpec, type Particles } from '../src/render/particles';

const collect = (): { fx: Particles; got: ParticleSpec[] } => {
  const got: ParticleSpec[] = [];
  return { got, fx: { spawn: (p) => void got.push(p), update: () => undefined } };
};
const at = { x: 0, y: 0, z: 0 };
const key = (id: string): string => `${lookOf(id).motif}/${SIGNATURES[id].form}/${SIGNATURES[id].motion}`;

describe('every creature\'s attacks are its own (round 60: "make it very distinct from each other, and also with more fidelity")', () => {
  it('every creature has a signature (the horrors, and shoggoth and the flying polyp) or a blow (round 87: data/foeBlows.ts), never both and never neither', () => {
    const ids = ENTITIES.map((e) => e.id).sort();
    const signed = Object.keys(SIGNATURES);
    const blown = Object.keys(FOE_BLOWS);
    expect([...signed, ...blown].sort()).toEqual(ids); // all of them, each once
    for (const id of signed) expect(blown, id).not.toContain(id);
    for (const id of ids) expect(id in BOSS_ATTACK_THEME, `${id}: a signature goes with colours of its own, a blow with none`).toBe(id in SIGNATURES);
    expect(signed.filter((id) => !isHorrorSignature(id)).sort()).toEqual(['flying_polyp', 'shoggoth']); // the horrors, and the two themed greater creatures
  });

  it('no two creatures of one element share form, motion and all; no two horrors of one element share a form', () => {
    const seen = new Map<string, string>();
    for (const id of Object.keys(SIGNATURES)) {
      const k = key(id);
      expect(seen.get(k), `${id} and ${seen.get(k)} are both ${k}`).toBeUndefined();
      seen.set(k, id);
    }
    const horrors = Object.keys(SIGNATURES).filter(isHorrorSignature);
    for (const a of horrors) for (const b of horrors) {
      if (a < b && lookOf(a).motif === lookOf(b).motif) expect(SIGNATURES[a].form, `${a} and ${b}, both ${lookOf(a).motif}`).not.toBe(SIGNATURES[b].form);
    }
  });

  it('every form and every motion is someone\'s, and every accent is a light', () => {
    const used = Object.values(SIGNATURES);
    for (const f of FORMS) expect(used.some((s) => s.form === f), f).toBe(true);
    for (const m of MOTIONS) expect(used.some((s) => s.motion === m), m).toBe(true);
    for (const id of Object.keys(SIGNATURES)) expect(luma(lookOf(id).accent), id).toBeGreaterThanOrEqual(LIGHT_FLOOR - 1e-6);
  });

  it('a common foe is drawn in its own colours, not the shared magenta of round 51: its blow\'s hues (round 87), not a signature', () => {
    const [deep, ghoul, miGo] = ['deep_one', 'ghoul', 'mi_go'].map((id) => FOE_BLOWS[id].hues);
    expect(deep[1]).not.toBe(ghoul[1]);
    expect(deep[1]).not.toBe(miGo[1]);
    expect(ghoul[1]).not.toBe(miGo[1]);
    expect(lookOf('deep_one').sig).toBeNull(); // a blow, not a signature
    expect(lookOf('shoggoth').sig?.form).toBe('bubbles'); // the two themed greater creatures keep theirs
    expect(lookOf('hastur').sig?.form, 'a horror still has its own').toBeDefined();
    expect(lookOf(undefined).sig).toBeNull(); // the arena's dummy and the like draw no signature
  });

  it('each form sheds its own things at every moment of a blow', () => {
    for (const form of FORMS) {
      const look = { ...lookOf('deep_one'), sig: { form, motion: 'fountain' as const, accent: 0xffffff } };
      for (const moment of ['burst', 'land', 'rise', 'flash'] as Moment[]) {
        const { fx, got } = collect();
        signature(fx, look, moment, at, 3, { x: 1, z: 0 });
        expect(got.length, `${form} at ${moment}`).toBeGreaterThan(0);
        for (const p of got) for (const v of [p.x, p.y, p.z, p.size, p.life, p.vx ?? 0, p.vy ?? 0, p.vz ?? 0]) expect(Number.isFinite(v), `${form} at ${moment}`).toBe(true);
        if (!FORM_SPECS[form].draw) expect(got.every((p) => p.shape === FORM_SPECS[form].shape), form).toBe(true);
      }
    }
  });

  it('sheds no more than its budget at any moment, one thing a bolt\'s step, and a colossus\'s burst stays in the element\'s bounds', () => {
    for (const form of FORMS) {
      const look = { ...lookOf('deep_one'), sig: { form, motion: 'fountain' as const, accent: 0xffffff } };
      for (const moment of ['burst', 'land', 'rise', 'flash', 'gather', 'trail'] as Moment[]) {
        for (const radius of [1, 4, 14]) {
          const { fx, got } = collect();
          signature(fx, look, moment, at, radius, { x: 1, z: 0 }, { x: 10, y: 0, z: 0 });
          expect(got.length, `${form} at ${moment}, ${radius} m`).toBeLessThanOrEqual(BUDGET[moment]);
        }
      }
    }
    expect(BUDGET.trail).toBe(1);
    for (const id of ['cthulhu', 'shub_niggurath', 'azathoth']) {
      const { fx, got } = collect();
      burst(fx, ELEMENTS[lookOf(id).motif], at, 14, lookOf(id));
      expect(got.length, id).toBeLessThan(260 + BUDGET.burst);
    }
  });

  it('two horrors of one element look different in what they throw (the eye: Hypnos and the Haunter)', () => {
    const shapes = (id: string): string => {
      const { fx, got } = collect();
      signature(fx, lookOf(id), 'burst', at, 3);
      return [...new Set(got.map((p) => p.shape))].sort().join(',');
    };
    expect(lookOf('hypnos').motif).toBe(lookOf('haunter_of_the_dark').motif);
    expect(shapes('hypnos')).not.toBe(shapes('haunter_of_the_dark'));
  });

  it('what falls lands and lies on the ground, not through it', () => {
    const p = { x: 0, y: -0.2, z: 0, vx: 2, vy: -3, vz: 0, floor: 0, bounce: 0.3, gravity: 9, drag: 1, spin: 4, rot: 0, age: 0.5 };
    land(p);
    expect(p.y).toBe(0);
    expect(p.vy).toBeCloseTo(0.9, 5); // it springs a little
    p.y = -0.01;
    p.vy = -0.5;
    land(p);
    expect([p.vy, p.gravity, p.spin]).toEqual([0, 0, 0]); // and then lies still
  });

  it('what a blow on a body or a wall throws down rests on the ground under it, not in the air where it struck', () => {
    const got: ParticleSpec[] = [];
    const fx: Particles = { spawn: (p) => void got.push(p), update: () => undefined, ground: () => 0.5 };
    const look = lookOf('hypnos'); // its petals lie where they fall
    impact(fx, ELEMENTS[look.motif], { x: 3, y: 1.8, z: -2 }, { x: 1, z: 0 }, 0.6, look); // a wound, 1.3 m over the ground
    const floors = got.flatMap((p) => (p.floor === undefined ? [] : [p.floor]));
    expect(floors.length).toBeGreaterThan(0);
    for (const f of floors) expect(f).toBeCloseTo(0.5, 1);
    got.length = 0;
    impact({ ...fx, ground: () => 4 }, ELEMENTS[look.motif], { x: 0, y: 1, z: 0 }, { x: 1, z: 0 }, 0.6, look); // under a ledge: never above where it struck (its flash, 0.3 m over it)
    for (const p of got) if (p.floor !== undefined) expect(p.floor).toBeLessThan(1.4);
  });
});
