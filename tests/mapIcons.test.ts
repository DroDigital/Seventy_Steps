/**
 * The map's figures (round 60): each kind of mark draws, in each state it has, without a context of any kind needed to answer back;
 * the Elder Sign is its five strokes; a slain horror is a closed eye and a living one an open eye.
 */
import { describe, expect, it } from 'vitest';
import { drawMark, reach, type MarkKind, type MarkState } from '../src/ui/mapIcons';

/** A canvas context that does nothing and records the calls made on it. */
function recorder() {
  const calls: string[] = [];
  const gradient = { addColorStop: () => undefined };
  const ctx = new Proxy({} as Record<string, unknown>, {
    get: (t, k: string) => (k in t ? t[k] : k === 'createLinearGradient' || k === 'createRadialGradient' ? () => gradient : (...a: unknown[]) => void calls.push(`${k}:${a.length}`)),
    set: (t, k: string, v) => ((t[k] = v), true),
  });
  return { calls, ctx: ctx as unknown as CanvasRenderingContext2D };
}

const KINDS: readonly MarkKind[] = ['sign', 'gate', 'dungeon', 'boss', 'person', 'echo', 'lead', 'place', 'you'];
const STATES: readonly MarkState[] = [{}, { lit: true }, { slain: true }, { met: true }, { now: 1234, turn: 1 }];

describe('the map marks (round 60)', () => {
  it('draws every kind in every state, and something each time', () => {
    for (const kind of KINDS) {
      for (const state of STATES) {
        const { calls, ctx } = recorder();
        drawMark(ctx, kind, 50, 50, 7, state);
        expect(calls.length, `${kind} ${JSON.stringify(state)}`).toBeGreaterThan(3);
      }
    }
  });

  it('leaves the context as it found it: every save has its restore', () => {
    for (const kind of KINDS) {
      const { calls, ctx } = recorder();
      drawMark(ctx, kind, 10, 10, 7, { lit: true });
      expect(calls.filter((c) => c.startsWith('save')).length, kind).toBe(calls.filter((c) => c.startsWith('restore')).length);
    }
  });

  it("carves the Elder Sign as the shrine's five strokes, lit or not", () => {
    for (const lit of [true, false]) {
      const { calls, ctx } = recorder();
      drawMark(ctx, 'sign', 20, 20, 7, { lit });
      const strokes = calls.filter((c) => c === 'moveTo:2').length;
      expect(strokes, `lit ${lit}`).toBe(5);
    }
  });

  it('says a horror slain by closing its eye, not only by a stroke through it', () => {
    const [alive, slain] = [recorder(), recorder()];
    drawMark(alive.ctx, 'boss', 20, 20, 7, {});
    drawMark(slain.ctx, 'boss', 20, 20, 7, { slain: true });
    expect(alive.calls.includes('ellipse:7')).toBe(true); // the slit pupil
    expect(slain.calls.includes('ellipse:7')).toBe(false);
    expect(slain.calls.filter((c) => c === 'lineTo:2').length).toBeGreaterThan(0); // the lashes
  });

  it('keeps clear of what a name or another mark needs: a token is larger than its figure, a person and a place are small', () => {
    expect(reach('sign', 7)).toBeGreaterThan(7);
    expect(reach('person', 7)).toBeLessThan(reach('sign', 7));
    expect(reach('place', 7)).toBeLessThan(reach('gate', 7));
  });
});
