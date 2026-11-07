/**
 * Dismemberment and blood (round 113; data/gore.ts, render/goreCut.ts, render/gore.ts, render/blood.ts, shaders/spriteFx.ts): every
 * creature comes apart as its body is made and bleeds what the tales give it; a cut's line, its piece and the piece's flight are sound.
 */
import { describe, expect, it } from 'vitest';
import { BLOOD, GORE, GORE_FX, goreOf } from '../src/data/gore';
import { ROSTER_IDS } from '../src/data/roster';
import { getEntity } from '../src/data/registry';
import { planCut, reachDown, startPiece, stepPiece, type CutInput } from '../src/render/goreCut';
import { ANOMALY_HUES, rgbToHsv } from '../src/render/palette';
import { SPRITE_FRAG, SPRITE_VERT } from '../src/render/shaders/sprite';
import { CAST_FRAG } from '../src/render/shaders/castSprite';
import { BLOOD_ORDER } from '../src/render/shaders/spriteFx';

const hueGap = (a: number, b: number): number => Math.min(Math.abs(a - b), 1 - Math.abs(a - b));
const seeded = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const base = (over: Partial<CutInput> = {}): CutInput => ({
  kind: 'sever', blow: { x: 0, z: 1 }, across: { x: -1, z: 0 }, facing: { x: 0, z: -1 }, mirror: false, wound: 0.7,
  span: { bottom: 0.05, top: 0.9, left: 0.25, right: 0.75 }, size: { w: 2.3, h: 2.3 }, long: false, heavy: false, rand: seeded(7), ...over,
});
/** Which side of the plan's line a point of the frame is on: > 0 the piece's. */
const side = (plan: ReturnType<typeof planCut>, p: readonly [number, number]): number => Math.cos(plan.angle) * (p[0] - plan.point[0]) + Math.sin(plan.angle) * (p[1] - plan.point[1]);

describe('each creature\'s gore (data/gore.ts)', () => {
  it('is written for every creature of the roster, and only for them', () => {
    expect(Object.keys(GORE).sort()).toEqual([...ROSTER_IDS].sort());
  });

  it('keeps what has no body whole: the spectres (but Cthulhu and Hastur, drawn in flesh and robe), the Colour, and the outer gods but the Black Goat', () => {
    for (const id of ROSTER_IDS) {
      const d = getEntity(id);
      if (d?.sprite?.silhouette === 'spectre' && id !== 'cthulhu' && id !== 'hastur') expect(goreOf(id)[0], id).toBe('none');
      if (d?.sprite?.outside) expect(goreOf(id), id).toEqual(['none', 'none']);
    }
    expect(goreOf('azathoth')).toEqual(['none', 'none']);
    expect(goreOf('shub_niggurath')[0]).toBe('split');
    expect(goreOf('deep_one#eldritch')).toEqual(goreOf('deep_one'));
  });

  it('bleeds no colour that reads as an anomaly hue', () => {
    for (const [kind, c] of Object.entries(BLOOD)) {
      const [h, s, v] = rgbToHsv(c);
      expect(s > 0.3 && v > 0.08 && ANOMALY_HUES.some((a) => hueGap(h, a) < 0.1), kind).toBe(false);
    }
    expect(BLOOD_ORDER.length).toBe(Object.keys(BLOOD).length);
  });
});

describe('a cut (render/goreCut.ts)', () => {
  it('puts the piece\'s middle beyond the line and the body\'s feet before it, mirrored or not, for every kind', () => {
    for (const kind of ['sever', 'split', 'chip'] as const) for (const mirror of [false, true]) for (const long of [false, true]) for (let s = 1; s < 40; s++) {
      const plan = planCut(base({ kind, mirror, long, rand: seeded(s), heavy: s % 3 === 0 }));
      expect(side(plan, plan.middle), `${kind} ${mirror} ${long} ${s}`).toBeGreaterThan(0);
      if (!long || kind !== 'sever') expect(side(plan, [0.5, 0.94]), `${kind} feet`).toBeLessThan(0); // (y down: the feet are at the bottom of the frame)
      else expect(side(plan, [mirror ? 0.73 : 0.27, 0.5]), 'tail').toBeLessThan(0); // (a long body seen from its side, facing right on the screen: its tail at the left)
      expect(plan.extent[0]).toBeGreaterThan(0);
      expect(plan.extent[1]).toBeGreaterThan(0);
      expect(Number.isFinite(plan.spin) && Number.isFinite(plan.velocity.y)).toBe(true);
    }
  });

  it('takes the head off sideways when a long body is seen from its side', () => {
    const plan = planCut(base({ long: true, rand: seeded(3) }));
    expect(Math.abs(Math.cos(plan.angle))).toBeGreaterThan(0.8);
  });

  it('throws a severed piece away from the blade, and a torn lump less far', () => {
    const cut = planCut(base({ rand: seeded(5) }));
    const torn = planCut(base({ kind: 'split', rand: seeded(5) }));
    expect(cut.velocity.z).toBeGreaterThan(0);
    expect(Math.hypot(torn.velocity.x, torn.velocity.z)).toBeLessThan(Math.hypot(cut.velocity.x, cut.velocity.z));
  });

  it('lands the piece on the ground, at rest, never under it', () => {
    const plan = planCut(base({ rand: seeded(11) }));
    const p = startPiece(plan, { x: 0, y: 1.8, z: 0 }, [0.3, 0.2]);
    let struck = 0;
    for (let i = 0; i < 400; i++) {
      if (stepPiece(p, 1 / 60, 0.5)) struck++;
      expect(p.y - reachDown(p)).toBeGreaterThanOrEqual(0.5 - 1e-9);
    }
    expect(struck).toBeGreaterThanOrEqual(1);
    expect(Math.hypot(p.vx, p.vz)).toBeLessThan(0.05);
  });
});

describe('the shaders', () => {
  it('cut the body, the piece and the body\'s shadow along the same line', () => {
    expect(SPRITE_VERT).toContain('attribute vec4 aCut;');
    expect(SPRITE_VERT).toContain('attribute vec4 aPiece;');
    expect(SPRITE_FRAG).toContain('if (!fxCut(src.xy, col)) discard;');
    expect(CAST_FRAG).toContain('fxCut(src.xy, col)');
    expect(SPRITE_VERT).toContain(`body /= ${GORE_FX.pad.toFixed(3)};`);
    expect(SPRITE_FRAG.replace(/\s+/g, ' ')).toContain('vCut.z < -0.5 ? inCell.x * inCell.y : 1.0'); // a severed piece's padded texels past its frame are dropped (round 113, a Codex finding)
  });
});
