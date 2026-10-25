import { describe, expect, it } from 'vitest';
import { TIDE } from '../src/data/uiMood';
import { createTide, tideAt } from '../src/render/tide';
import type { Game } from '../src/systems/components';

describe('the picture follows the body (round 80)', () => {
  it('drains nothing before a death, and the whole of it when the time is up, never backward', () => {
    expect(tideAt(null, null)).toEqual({ drain: 0, breath: 0 });
    expect(tideAt(0, null).drain).toBe(0);
    expect(tideAt(TIDE.drain, null).drain).toBe(1);
    expect(tideAt(60, null).drain).toBe(1); // it stays drained until the waking
    let last = 0;
    for (let t = 0; t <= TIDE.drain + 1; t += 0.05) {
      const d = tideAt(t, null).drain;
      expect(d).toBeGreaterThanOrEqual(last);
      expect(d).toBeLessThanOrEqual(1);
      last = d;
    }
  });

  it('breathes out only after a rising, swells and is gone within its seconds', () => {
    expect(tideAt(null, null).breath).toBe(0);
    expect(tideAt(null, 0).breath).toBe(0); // (it begins soft)
    let peak = 0;
    for (let t = 0; t < TIDE.breath.seconds + 0.5; t += 0.02) {
      const b = tideAt(null, t).breath;
      expect(b).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThanOrEqual(1);
      peak = Math.max(peak, b);
    }
    expect(peak).toBeGreaterThan(0.4);
    expect(tideAt(null, TIDE.breath.seconds).breath).toBe(0);
    expect(tideAt(null, -1).breath).toBe(0);
  });

  /** A game with only what the tide reads: its events, the investigator's health and kneeling. */
  function fake() {
    const on = new Map<string, ((e: never) => void)[]>();
    const g = {
      events: { on: (n: string, f: (e: never) => void) => void on.set(n, [...(on.get(n) ?? []), f]) },
      player: { id: 1, kneeling: null as { x: number; z: number } | null },
      ecs: { c: { health: new Map([[1, { hp: 10, max: 10 }]]) } },
    };
    const emit = (n: string, e: object = {}): void => on.get(n)?.forEach((f) => f(e as never));
    return { g: g as unknown as Game, raw: g, emit };
  }

  it('drains from a death of the investigator\'s own, and clears at the waking', () => {
    const { g, raw, emit } = fake();
    let now = 100;
    const tide = createTide(g, () => now);
    expect(tide.update().drain).toBe(0);
    emit('Died', { entity: 2 }); // another\'s death is not theirs
    expect(tide.update().drain).toBe(0);
    raw.ecs.c.health.get(1)!.hp = 0;
    emit('Died', { entity: 1 });
    now += 1.1;
    const half = tide.update().drain;
    expect(half).toBeGreaterThan(0.3);
    expect(half).toBeLessThan(0.7);
    now += 5;
    expect(tide.update().drain).toBe(1);
    emit('Respawned');
    expect(tide.update().drain).toBe(0);
    emit('Died', { entity: 1 });
    raw.ecs.c.health.get(1)!.hp = 10; // alive again by any other way
    now += 1;
    expect(tide.update().drain).toBe(0);
  });

  it('breathes out on rising from a rest, not on arriving on one knee from a journey', () => {
    const { g, raw, emit } = fake();
    let now = 0;
    const tide = createTide(g, () => now);
    emit('Rested', { sign: 'a', name: 'A' });
    raw.player.kneeling = { x: 0, z: 0 };
    expect(tide.update().breath).toBe(0);
    raw.player.kneeling = null; // the menu is closed, they rise
    now += 0.01;
    tide.update();
    now += 0.4;
    expect(tide.update().breath).toBeGreaterThan(0.2);
    now += 10;
    expect(tide.update().breath).toBe(0);
    emit('Travelled', {}); // a journey ends on one knee
    raw.player.kneeling = { x: 0, z: 0 };
    tide.update();
    raw.player.kneeling = null;
    now += 0.01;
    tide.update();
    now += 0.4;
    expect(tide.update().breath).toBe(0);
  });
});
