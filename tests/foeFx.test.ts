/**
 * Every foe's blow is seen (round 59): before, only the horrors with colours of their own threw light and matter as they struck, and an
 * ordinary foe's swing, slam or charge showed nothing. Now each throws a share of it by its size (`strengthOf`), in the colours of what it is
 * made of, with a scar and a lit arc only under the largest; a slow, heavy blow glints before it falls; a pulse of dread throws up its front.
 */

import { describe, expect, it } from 'vitest';
import { createMeleeFx, strengthOf, TELL } from '../src/render/meleeFx';
import type { GroundFx } from '../src/render/groundFx';
import type { ParticleSpec, Particles } from '../src/render/particles';
import { moveDef, startMove } from '../src/systems/actions';
import { createGame } from '../src/systems/game';

function rig(creature: string) {
  const g = createGame({ creature });
  const c = g.ecs.c;
  const foe = [...c.actor.keys()].find((k) => k !== g.player.id && c.dread.has(k))!;
  c.brain.delete(foe);
  const spawned: ParticleSpec[] = [];
  const marks: string[] = [];
  const particles = { spawn: (p: ParticleSpec) => void spawned.push(p), update() {} } as Particles;
  const ground = new Proxy({}, { get: (_t, k) => (k === 'count' ? () => 0 : () => void marks.push(String(k))) }) as GroundFx;
  const fx = createMeleeFx(g, particles, ground);
  return { g, c, foe, fx, spawned, marks };
}

describe('every foe\'s blow is seen (round 59)', () => {
  it('a horror throws all of it, an ordinary foe a share by its size', () => {
    expect(strengthOf(true, 0.3)).toBe(1);
    expect(strengthOf(false, 0.27)).toBeLessThan(0.45); // a zoog
    expect(strengthOf(false, 1.5)).toBeGreaterThan(strengthOf(false, 0.5)); // a shoggoth more than a deep one
    expect(strengthOf(false, 9)).toBeLessThan(1); // and never as much as a horror
  });

  it('a small foe\'s slam bursts and sends a ring out, but leaves no scar; a large one\'s scars the ground', () => {
    for (const [creature, scarred] of [['hybrid_mummy', false], ['gug', true]] as const) {
      const { g, c, foe, spawned, marks } = rig(creature);
      const a = c.actor.get(foe)!;
      startMove(a, 'slam');
      a.frame = moveDef(a)!.hit!.window[0];
      const t = c.transform.get(foe)!;
      g.events.emit('Swung', { entity: foe, at: { ...t.pos }, yaw: t.yaw });
      expect(spawned.length, creature).toBeGreaterThan(8);
      expect(marks, creature).toContain('shock');
      expect(marks.includes('scar'), creature).toBe(scarred);
    }
  });

  it('a slow heavy blow glints once before it falls, however the pictures fall against the steps; a quick one does not', () => {
    const { c, foe, fx, spawned } = rig('gug');
    const a = c.actor.get(foe)!;
    startMove(a, 'slam');
    const h = moveDef(a)!.hit!;
    expect(h.window[0]).toBeGreaterThanOrEqual(TELL.windup);
    const glints = (): number => spawned.filter((p) => p.shape === 'spark' && p.hold === 0.25).length;
    for (let f = 0; f < h.window[0]; f++) {
      a.frame = f;
      fx.update(0);
      fx.update(0.5); // two pictures to a step
    }
    expect(glints()).toBe(1);
    // a picture that comes late (a hitch from before the tell to the blow), or a foe first drawn mid-swing, does not glint at a blow already falling (Codex on PR 149)
    for (const first of [h.window[0], h.window[0] + 2]) {
      const late = rig('gug');
      const b = late.c.actor.get(late.foe)!;
      startMove(b, 'slam');
      b.frame = TELL.windup - TELL.lead - 4;
      late.fx.update(0);
      b.frame = first;
      late.fx.update(0);
      expect(late.spawned.filter((p) => p.shape === 'spark' && p.hold === 0.25), `skipped to ${first}`).toHaveLength(0);
      const seen = rig('gug');
      const m = seen.c.actor.get(seen.foe)!;
      startMove(m, 'slam');
      m.frame = first;
      seen.fx.update(0);
      expect(seen.spawned.filter((p) => p.shape === 'spark' && p.hold === 0.25), `first seen at ${first}`).toHaveLength(0);
    }
    const quick = rig('zoog');
    const b = quick.c.actor.get(quick.foe)!;
    startMove(b, 'bite');
    for (let f = 0; f < moveDef(b)!.hit!.window[1]; f++) {
      b.frame = f;
      quick.fx.update(0);
    }
    expect(quick.spawned.filter((p) => p.shape === 'spark' && p.hold === 0.25)).toHaveLength(0);
  });
});
