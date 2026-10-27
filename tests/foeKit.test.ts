/**
 * The vocabulary of a quiet blow (round 89; render/blowKit.ts, blowMarks.ts, blowMatter.ts, blowPen.ts; data/foeBlows.ts, data/foeTuning.ts): each of
 * the twelve marks draws its own shapes in the blow's three hues, each tempo moves a mark as it says, each matter's specks fall, rise or hang, and
 * nothing spends more than it is allowed. Judged by the particles SPAWNED (shape, size, life, colour, count, velocity), not by pixels: the shapes
 * the shader draws are render/particles.ts's.
 */

import { describe, expect, it } from 'vitest';
import { createRng } from '../src/core/rng';
import { MARKS, MATTERS, TEMPOS, type FoeBlow, type Mark, type Matter, type Tempo } from '../src/data/foeBlows';
import { FOE_FX } from '../src/data/fxTuning';
import { createBlowKit, partsOf, type BlowKit } from '../src/render/blowKit';
import { hexRgb } from '../src/render/blowPen';
import type { GroundFx } from '../src/render/groundFx';
import { luma, rgbToHsv, type Rgb } from '../src/render/palette';
import { markCell, PARTICLE_SHAPES, type ParticleSpec, type Particles } from '../src/render/particles';

const HUES: FoeBlow['hues'] = [0xf0e4a0, 0x4c90e8, 0x20305c]; // start (bright), middle, end (cooler, darker)
const blow = (mark: Mark, tempo: Tempo = 'snap', matter: Matter = 'none', accent?: Mark): FoeBlow => ({ mark, tempo, matter, hues: HUES, ...(accent && { accent }) });

function rig() {
  const out: ParticleSpec[] = [];
  const decals: { kind: string; args: unknown[] }[] = [];
  const fx = { spawn: (p: ParticleSpec) => void out.push(p), update: () => undefined } as Particles;
  const ground = new Proxy({}, { get: (_t, k) => (k === 'count' ? () => 0 : (...args: unknown[]) => void decals.push({ kind: String(k), args })) }) as GroundFx;
  let t = 0;
  const kit = createBlowKit(fx, ground, { rng: createRng(11), now: () => t });
  const wait = (seconds: number): void => {
    t += seconds;
    kit.drain();
  };
  return { out, decals, kit, wait };
}

const at = { x: 3, y: 1.2, z: -2 };
const dir = { x: 1, z: 0 };
const lay = (kit: BlowKit, b: FoeBlow, which: Mark, parts?: number) => kit.mark(b, which, { at, dir, size: 1, ...(parts !== undefined && { parts }), floor: 0 });

/** The shape(s) each mark is drawn in. */
const SHAPE_OF: Readonly<Record<Mark, string | null>> = {
  rake: 'crescent', jaws: 'crescent', crescent: 'crescent', lash: 'lash', splat: 'mark', swirl: 'arc', glint: 'cross', dash: 'dash', ripple: null, sigil: 'rune', eye: 'eye', plume: 'puff',
};

const hueGap = (a: Rgb, b: Rgb): number => {
  const d = Math.abs(rgbToHsv(a)[0] - rgbToHsv(b)[0]);
  return Math.min(d, 1 - d);
};

function valid(list: ParticleSpec[], label: string): void {
  for (const p of list) {
    for (const n of [p.x, p.y, p.z, p.vx ?? 0, p.vy ?? 0, p.vz ?? 0, p.life, p.size, p.alpha ?? 1, p.grow ?? 1, p.spin ?? 0, p.rot ?? 0]) expect(Number.isFinite(n), label).toBe(true);
    expect(p.life, label).toBeGreaterThan(0);
    expect(p.life, label).toBeLessThan(2.5);
    expect(p.size, label).toBeGreaterThan(0);
    expect(p.size, label).toBeLessThan(3);
    expect(p.alpha ?? 1, label).toBeLessThanOrEqual(1);
    if (p.shape) expect(PARTICLE_SHAPES, label).toContain(p.shape);
    for (const c of [p.color, p.colorMid ?? p.color, p.colorEnd ?? p.color]) for (const n of c) expect(n, label).toBeGreaterThanOrEqual(0);
  }
}

describe('every mark draws its own shapes, in the blow\'s three hues (round 89)', () => {
  it('has a recipe for every mark, and the table of what each is drawn in names them all', () => {
    expect(Object.keys(SHAPE_OF).sort()).toEqual([...MARKS].sort());
    expect(Object.keys(FOE_FX.marks).sort()).toEqual([...MARKS].sort());
    for (const m of MARKS) expect(partsOf(m), m).toBeGreaterThanOrEqual(1);
  });

  it.each(MARKS)('%s: its shapes, within its parts, finite, and nothing but a ripple is a decal', (mark) => {
    const { out, decals, kit, wait } = rig();
    const spent = lay(kit, blow(mark), mark);
    wait(1);
    expect(spent).toBeGreaterThanOrEqual(1);
    expect(spent).toBeLessThanOrEqual(partsOf(mark));
    valid(out, mark);
    const shape = SHAPE_OF[mark];
    if (shape === null) {
      expect(out, 'a ripple lies on the ground').toHaveLength(0);
      expect(decals.map((d) => d.kind)).toEqual(['shock']);
    } else {
      expect(out.length, mark).toBe(spent);
      expect(out.every((p) => p.shape === shape), mark).toBe(true);
      expect(decals, mark).toHaveLength(0);
      expect(out.every((p) => p.glow), `${mark} is a light`).toBe(true);
    }
    if (mark === 'splat') expect(out[0]!.thick).toBeCloseTo(markCell('splat'), 5); // the blot, of the free atlas's masks
    if (mark === 'swirl') expect(out[0]!.thick).toBeGreaterThan(0.05); // an open ring has a thickness
  });

  it.each(MARKS)('%s: each particle is born in the first hue, passes through the second and dies in the third, a few percent off, no two alike', (mark) => {
    if (mark === 'ripple') return; // (a decal: one colour)
    const { out, kit, wait } = rig();
    for (let i = 0; i < 6; i++) lay(kit, blow(mark), mark, partsOf(mark));
    wait(1);
    expect(out.length, mark).toBeGreaterThan(5);
    const [start, mid, end] = HUES.map(hexRgb);
    for (const p of out) {
      expect(p.colorMid, mark).toBeDefined();
      expect(p.colorEnd, mark).toBeDefined();
      for (const [c, want] of [[p.color, start], [p.colorMid!, mid], [p.colorEnd!, end]] as const) {
        expect(hueGap(c, want!), mark).toBeLessThan(FOE_FX.jitter.hue + 0.004);
        expect(luma(c) / luma(want!), mark).toBeGreaterThan(1 - FOE_FX.jitter.luma - 0.08); // (a turn of hue moves luma a little too)
        expect(luma(c) / luma(want!), mark).toBeLessThan(1 + FOE_FX.jitter.luma + 0.08);
      }
      expect(hueGap(p.colorMid!, p.color), `${mark}: the middle hue is a hue of its own`).toBeGreaterThan(0.1);
    }
    expect(new Set(out.map((p) => p.color.join())).size, mark).toBeGreaterThan(out.length * 0.8); // (every particle its own turn of the dice)
  });

  it('a mark spends no more particles than it is allowed, however it is told to move', () => {
    for (const tempo of TEMPOS) {
      for (const mark of MARKS) {
        for (const parts of [1, 2, 3]) {
          const { out, kit, wait } = rig();
          const spent = lay(kit, blow(mark, tempo), mark, parts);
          wait(2);
          expect(spent, `${mark}/${tempo}/${parts}`).toBeLessThanOrEqual(tempo === 'pulse' ? parts : Math.min(parts, partsOf(mark))); // (a pulse's two beats share what it may spend)
          if (mark !== 'ripple') expect(out.length, `${mark}/${tempo}/${parts}`).toBeLessThanOrEqual(parts);
          valid(out, `${mark}/${tempo}`);
        }
        const { out, kit, wait } = rig();
        expect(lay(kit, blow(mark, tempo), mark, 0), `${mark} with none to spend`).toBe(0);
        wait(2);
        expect(out).toHaveLength(0);
      }
    }
  });

  it('a stroke that lies along its flight flies with no drag, and the rest of a mark faces the eye', () => {
    for (const mark of ['rake', 'crescent', 'lash', 'dash'] as const) {
      const { out, kit, wait } = rig();
      lay(kit, blow(mark), mark);
      wait(1);
      for (const p of out) {
        expect(p.drag ?? 0, mark).toBe(0);
        expect(Math.hypot(p.vx ?? 0, p.vz ?? 0), `${mark} has a flight to lie along`).toBeGreaterThan(0.1);
      }
    }
    const { out, kit } = rig();
    lay(kit, blow('swirl'), 'swirl');
    expect(out.every((p) => p.shape === 'arc' && p.spin !== 0)).toBe(true); // an open ring turns
  });
});

describe('each tempo moves a mark as it says (round 89)', () => {
  const lives = (tempo: Tempo, mark: Mark = 'rake'): number => {
    const { out, kit, wait } = rig();
    lay(kit, blow(mark, tempo), mark, 3);
    wait(1);
    return out.reduce((s, p) => s + p.life, 0) / out.length;
  };

  it('snap is gone in a few frames, drag lasts a little, bloom and settle linger: in that order', () => {
    expect(lives('snap')).toBeLessThan(lives('drag'));
    expect(lives('drag')).toBeLessThan(lives('bloom'));
    expect(lives('bloom')).toBeLessThan(lives('settle'));
    expect(lives('snap')).toBeLessThan(0.25);
    expect(lives('settle')).toBeLessThan(0.7);
  });

  it('drag lays its strokes one after another, a frame or two apart; snap lays them at once', () => {
    for (const tempo of TEMPOS.filter((t) => t !== 'pulse')) {
      const { out, kit, wait } = rig();
      lay(kit, blow('rake', tempo), 'rake', 3);
      expect(out.length, tempo).toBe(FOE_FX.tempo[tempo].stagger > 0 ? 1 : 3);
      wait(FOE_FX.tempo[tempo].stagger * 3);
      expect(out.length, tempo).toBe(3);
    }
    expect(FOE_FX.tempo.snap.stagger).toBe(0);
    expect(FOE_FX.tempo.drag.stagger).toBeGreaterThan(0.02);
    expect(FOE_FX.tempo.drag.stagger).toBeLessThan(0.1);
    const { out, kit, wait } = rig();
    lay(kit, blow('rake', 'drag'), 'rake', 3);
    wait(0.5);
    const first = out[0]!;
    expect(out.every((p) => p.size <= first.size + 1e-9)).toBe(true); // (each a little shorter than the last)
  });

  it('bloom swells as it fades, snap does not', () => {
    const grow = (tempo: Tempo): number => {
      const { out, kit, wait } = rig();
      lay(kit, blow('crescent', tempo), 'crescent');
      wait(1);
      return out[0]!.grow!;
    };
    expect(grow('bloom')).toBeGreaterThan(1.3);
    expect(grow('snap')).toBeLessThan(1);
  });

  it('settle sinks what faces the eye and flutter turns and drifts it', () => {
    const one = (tempo: Tempo): ParticleSpec => {
      const { out, kit, wait } = rig();
      lay(kit, blow('splat', tempo), 'splat');
      wait(1);
      return out[0]!;
    };
    expect(one('settle').vy!).toBeLessThan(0);
    expect(one('snap').vy ?? 0).toBeLessThanOrEqual(0);
    const f = { out: [] as ParticleSpec[] };
    for (let i = 0; i < 8; i++) {
      const { out, kit } = rig();
      kit.mark(blow('glint', 'flutter'), 'glint', { at, dir, size: 1, parts: 1 });
      f.out.push(...out);
    }
    expect(f.out.some((p) => Math.abs(p.spin ?? 0) > 0.5)).toBe(true);
  });

  it('pulse comes twice, a beat apart, the second dimmer, and divides what it may spend between the beats', () => {
    for (const mark of ['sigil', 'rake', 'swirl'] as const) {
      const { out, kit, wait } = rig();
      const spent = lay(kit, blow(mark, 'pulse'), mark, 3);
      const first = out.length;
      expect(first, mark).toBeGreaterThanOrEqual(1);
      wait(FOE_FX.tempo.pulse.gap * 0.5);
      expect(out.length, `${mark}: the second beat has not come`).toBe(first);
      wait(FOE_FX.tempo.pulse.gap);
      expect(out.length, `${mark}: it came twice`).toBeGreaterThan(first);
      expect(out.length, mark).toBe(spent);
      expect(out.length, mark).toBeLessThanOrEqual(3);
      expect(out[out.length - 1]!.alpha!, mark).toBeLessThan(out[0]!.alpha!);
    }
    const { out, kit, wait } = rig();
    lay(kit, blow('sigil', 'pulse'), 'sigil', 1); // one to spend: one beat
    wait(1);
    expect(out).toHaveLength(1);
  });

  it('a few strokes at most wait for their turn', () => {
    const { kit } = rig();
    for (let i = 0; i < 500; i++) kit.later(10, () => undefined);
    expect(kit.pending()).toBe(FOE_FX.queue);
  });
});

describe('the specks of matter fall, rise or hang as what they are (round 89)', () => {
  const GRAVITY: Readonly<Record<Exclude<Matter, 'none'>, 'falls' | 'rises' | 'hangs' | 'drifts'>> = {
    brine: 'falls', ash: 'drifts', dust: 'falls', spore: 'rises', frost: 'hangs', ichor: 'falls', ember: 'rises', mote: 'hangs', down: 'drifts',
  };

  it('has every matter but none', () => {
    expect(Object.keys(FOE_FX.matter).sort()).toEqual(MATTERS.filter((m) => m !== 'none').sort());
    expect(Object.keys(GRAVITY).sort()).toEqual(Object.keys(FOE_FX.matter).sort());
  });

  it.each(MATTERS.filter((m) => m !== 'none'))('%s: the speck count asked for, its gravity\'s sign, its shapes, its colour', (matter) => {
    const { out, kit } = rig();
    expect(kit.specks(blow('crescent', 'snap', matter), at, 5, { x: -1, z: 0 })).toBe(5);
    expect(out).toHaveLength(5);
    valid(out, matter);
    const g = GRAVITY[matter as Exclude<Matter, 'none'>];
    const spec = FOE_FX.matter[matter as Exclude<Matter, 'none'>];
    for (const p of out) {
      if (g === 'falls') expect(p.gravity!, matter).toBeGreaterThan(4);
      if (g === 'rises') expect(p.gravity!, matter).toBeLessThan(0);
      if (g === 'hangs') expect(Math.abs(p.gravity!), matter).toBeLessThanOrEqual(0.5);
      if (g === 'drifts') {
        expect(p.gravity!, matter).toBeGreaterThan(0);
        expect(p.gravity!, matter).toBeLessThan(2);
      }
      expect(spec.shapes as readonly string[], matter).toContain(p.shape);
      if (p.gravity! > 0) expect(p.floor, `${matter} lands on the ground`).toBeDefined();
      expect(p.size, matter).toBeLessThan(0.2);
      expect(p.alpha, matter).toBeLessThanOrEqual(1);
      expect(p.colorEnd, matter).toBeDefined();
    }
    if (spec.shapes.length > 1) expect(new Set(out.map((p) => p.shape)).size, matter).toBeGreaterThan(1);
  });

  it('a blow with no matter sheds none; a dark matter is dark and a light one shines', () => {
    const { out, kit } = rig();
    expect(kit.specks(blow('rake'), at, 5)).toBe(0);
    expect(out).toHaveLength(0);
    const lit = (m: Matter): boolean => {
      const r = rig();
      r.kit.specks(blow('rake', 'snap', m), at, 1);
      return r.out[0]!.glow!;
    };
    expect(lit('ember')).toBe(true);
    expect(lit('mote')).toBe(true);
    expect(lit('ichor')).toBe(false);
    expect(lit('dust')).toBe(false);
    const dark = rig();
    dark.kit.specks(blow('rake', 'snap', 'ichor'), at, 1);
    expect(luma(dark.out[0]!.color)).toBeLessThan(0.3);
  });

  it('motes are drawn in, rise, and the blow\'s matter is theirs (soft lights where it has none)', () => {
    const { out, kit } = rig();
    kit.mote(blow('rake', 'snap', 'spore'), { x: 1, y: 1, z: 0 }, { x: 0, y: 1, z: 0 }, 0.4, 0.07);
    kit.mote(blow('rake'), { x: 1, y: 1, z: 0 }, { x: 0, y: 1, z: 0 }, 0.4, 0.07);
    kit.riser(blow('rake', 'snap', 'ember'), at, 1, 1, 0.08);
    valid(out, 'motes');
    expect(out[0]!.vx!).toBeCloseTo(-2.5, 5); // drawn in: 1 m over 0.4 s
    expect(out[0]!.shape).toBe('wisp');
    expect(out[1]!.shape).toBe('disc');
    expect(out.every((p) => p.glow)).toBe(true);
    expect(out[2]!.vy!).toBeGreaterThan(0);
  });

  it('a faint smear lies along its own flight', () => {
    const { out, kit } = rig();
    kit.trace(blow('crescent'), at, { x: -1, y: 0, z: 0 }, 0.3, 0.28, 0.4);
    valid(out, 'trace');
    expect(out[0]).toMatchObject({ shape: 'trace', glow: true, alpha: 0.4 });
    expect(out[0]!.thick).toBeCloseTo(markCell('smear'), 5);
    expect(Number.isFinite(luma(out[0]!.color))).toBe(true);
  });
});
