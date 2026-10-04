import { describe, expect, it } from 'vitest';
import { distXZ, wrapAngle } from '../src/core/geom';
import { worldLayout } from '../src/world/placements';
import { createWorldCollision } from '../src/world/worldCollision';
import { CLOCK, SIM } from '../src/data/tuning';
import { createWorldGame } from '../src/systems/game';
import { actOf, clearStep, npcLife, ROUND } from '../src/systems/npcLife';
import { ACTS } from '../src/data/npcActs';
import { NPCS } from '../src/data/npcs';
import { npcEntity, npcPlace } from '../src/systems/npcs';
import { npcDef } from '../src/data/npcs';
import { place } from './helpers';

const DT = 1 / SIM.hz;

/** A world game with the investigator far from everyone, and the frame set to `phase` of the night. */
function night(phase: number) {
  const g = createWorldGame();
  place(g, g.player.id, -5000, -5000, 0);
  g.frame = Math.round(((phase - CLOCK.start + 1) % 1) * CLOCK.night * SIM.hz);
  return g;
}

describe('the people have somewhere to be (round 26)', () => {
  it('walk a round of their own in the gloaming: away from where they rose, never far, never through a wall', () => {
    const g = night(0.05);
    const e = npcEntity(g, 'gilman')!;
    const home = npcPlace(npcDef('gilman')!)!;
    const tr = g.ecs.c.transform.get(e)!;
    let far = 0;
    for (let i = 0; i < 60 * 150; i++) {
      g.frame++;
      const before = { ...tr.pos };
      npcLife(g, DT);
      expect(clearStep(g, before, tr.pos) || distXZ(before, tr.pos) < 1e-6, `step ${i}`).toBe(true);
      far = Math.max(far, distXZ(tr.pos, home));
    }
    expect(far).toBeGreaterThan(1);
    expect(far).toBeLessThanOrEqual(ROUND.gloaming.reach + 1);
  });

  it('stand at their place in the last hour, turned to the sign', () => {
    const g = night(0.85);
    const e = npcEntity(g, 'gilman')!;
    const home = npcPlace(npcDef('gilman')!)!;
    const tr = g.ecs.c.transform.get(e)!;
    tr.pos = { x: home.x + 2, y: tr.pos.y, z: home.z + 1 }; // out on a round, as the hour changes
    for (let i = 0; i < 60 * 60; i++) {
      g.frame++;
      npcLife(g, DT);
    }
    expect(distXZ(tr.pos, home)).toBeLessThan(1);
  });

  it('stand, and turn to the investigator, when they are close, and take up the round when they have gone', () => {
    const g = night(0.05);
    const e = npcEntity(g, 'gilman')!;
    const tr = g.ecs.c.transform.get(e)!;
    place(g, g.player.id, tr.pos.x + 3, tr.pos.z, Math.PI);
    const at = { ...tr.pos };
    for (let i = 0; i < 60 * 30; i++) {
      g.frame++;
      npcLife(g, DT);
    }
    expect(distXZ(tr.pos, at)).toBeLessThan(1e-6);
    place(g, g.player.id, -5000, -5000, 0);
    let moved = 0;
    for (let i = 0; i < 60 * 120; i++) {
      g.frame++;
      npcLife(g, DT);
      moved = Math.max(moved, distXZ(tr.pos, at));
    }
    expect(moved).toBeGreaterThan(0.5);
  });
});

describe('the people are seen to walk, when they do (rounds 35 and 39)', () => {
  it('a breather has a step between where they were and are, through the whole game step (the movement system left it alone: they stood in their walk)', async () => {
    const { stepGame } = await import('../src/systems/game');
    const { emptyInput } = await import('../src/core/input');
    const g = night(0.05);
    const e = npcEntity(g, 'gilman')!;
    const tr = g.ecs.c.transform.get(e)!;
    let walked = 0;
    let longest = 0;
    for (let i = 0; i < 60 * 240; i++) {
      stepGame(g, emptyInput());
      const d = distXZ(tr.prev, tr.pos);
      if (d > 1e-4) walked++;
      longest = Math.max(longest, d * SIM.hz);
    }
    expect(walked).toBeGreaterThan(60 * 2); // some seconds of walking in four minutes: the breathers
    expect(longest).toBeLessThan(1.6); // an unhurried walk, m/s
  }, 90000);
});

describe('the people keep at what they do (round 39)', () => {
  const doers = NPCS.filter((n) => !n.creature);

  it('everyone has an act of their own, the figures all different but for what they share', () => {
    for (const n of doers) expect(ACTS[n.id], n.id).toBeDefined();
    expect(new Set(doers.map((n) => ACTS[n.id].kind)).size).toBeGreaterThanOrEqual(12);
  });

  it('are found at it, stay at it for the most of the night, and stroll only a few paces from their place on a breather', () => {
    const g = night(0.05);
    const e = npcEntity(g, 'wilmarth')!;
    const tr = g.ecs.c.transform.get(e)!;
    let at: (() => { x: number; z: number }) | undefined;
    let doing = 0;
    let far = 0;
    const frames = 60 * 300;
    for (let i = 0; i < frames; i++) {
      g.frame++;
      npcLife(g, DT);
      if (i === 120) at = () => ({ ...tr.pos });
      if (actOf(g, e) === 'smoke') doing++;
      if (i > 120) far = Math.max(far, distXZ(tr.pos, at!()));
    }
    expect(doing / frames).toBeGreaterThan(0.6);
    expect(far).toBeLessThan(5);
  });

  it('keep at it when the investigator comes close: no turning to them, the act not put down', () => {
    const g = night(0.05);
    const e = npcEntity(g, 'wilmarth')!;
    const tr = g.ecs.c.transform.get(e)!;
    for (let i = 0; i < 60 * 10; i++) { g.frame++; npcLife(g, DT); }
    expect(actOf(g, e)).toBe('smoke');
    place(g, g.player.id, tr.pos.x + 3, tr.pos.z, Math.PI);
    const yaw = tr.yaw;
    for (let i = 0; i < 60 * 5; i++) { g.frame++; npcLife(g, DT); }
    expect(actOf(g, e)).toBe('smoke');
    expect(tr.yaw).toBeCloseTo(yaw, 1);
    place(g, g.player.id, -5000, -5000, 0);
    for (let i = 0; i < 60 * 20; i++) { g.frame++; npcLife(g, DT); }
    expect(actOf(g, e)).toBe('smoke');
  });

  it('do not do it in the last hour: they doze on their feet at their place', () => {
    const g = night(0.85);
    const e = npcEntity(g, 'wilmarth')!;
    for (let i = 0; i < 60 * 60; i++) { g.frame++; npcLife(g, DT); }
    expect(actOf(g, e)).toBeNull();
  });

  it('every one of them is found within reach of their sign, never inside a wall', () => {
    const g = night(0.05);
    for (const n of doers) {
      const e = npcEntity(g, n.id);
      if (!e) continue;
      for (let i = 0; i < 60 * 3; i++) { g.frame++; npcLife(g, DT); }
      const tr = g.ecs.c.transform.get(e)!;
      const home = npcPlace(n)!;
      expect(distXZ(tr.pos, home), n.id).toBeLessThan(19);
      expect(Math.abs(tr.pos.y - g.world.ground(tr.pos.x, tr.pos.z)), n.id).toBeLessThan(0.01);
    }
  });
});

describe('those with a place of their own (round 39)', () => {
  const posted = NPCS.filter((n) => ACTS[n.id]?.post);

  it('Peaslee and Morgan have one each, and are put there, not by the sign', () => {
    expect(posted.map((n) => n.id).sort()).toEqual(['morgan', 'peaslee']);
    for (const n of posted) {
      const g = night(0.05);
      const tr = g.ecs.c.transform.get(npcEntity(g, n.id)!)!;
      const post = ACTS[n.id].post!;
      expect(distXZ(tr.pos, post), n.id).toBeLessThan(0.01);
    }
  });

  it('are across the quad from the sign, behind the one who wakes: out of the wake camera, which looks toward the sign and about it', () => {
    const sign = worldLayout().signs.find((x) => x.id === 'hub_quad')!;
    const toSign = Math.atan2(sign.x - sign.rest.x, sign.z - sign.rest.z); // the investigator wakes looking at it
    for (const n of posted) {
      const at = npcPlace(n)!;
      const off = Math.abs(wrapAngle(Math.atan2(at.x - sign.rest.x, at.z - sign.rest.z) - toSign));
      expect(off, n.id).toBeGreaterThan((100 * Math.PI) / 180);
      expect(distXZ(at, sign.rest), n.id).toBeGreaterThan(9); // and easy to find: within a stone's throw of the quad
      expect(distXZ(at, sign.rest), n.id).toBeLessThan(16);
    }
  });

  it('Morgan has a street lamp\'s post at his back, Peaslee one close by his chair (the world is made around them: if it moves, they must)', () => {
    const w = createWorldCollision();
    const lampsNear = (x: number, z: number, r: number) => w.near!(x - r, z - r, x + r, z + r).filter((c) => c.kind === 'cylinder' && c.radius < 0.2 && c.y1 - c.y0 > 3 && Math.hypot(c.x - x, c.z - z) <= r).length;
    expect(lampsNear(ACTS.morgan.post!.x, ACTS.morgan.post!.z, 0.7)).toBe(1);
    expect(lampsNear(ACTS.peaslee.post!.x, ACTS.peaslee.post!.z, 2.2)).toBe(1);
  });

  it('keep to it through the whole night, the last hour too, and never stroll off', () => {
    for (const hour of [0.05, 0.45, 0.85]) {
      const g = night(hour);
      for (const n of posted) {
        const e = npcEntity(g, n.id)!;
        const tr = g.ecs.c.transform.get(e)!;
        const post = ACTS[n.id].post!;
        let doing = 0;
        const frames = 60 * 240;
        for (let i = 0; i < frames; i++) {
          g.frame++;
          npcLife(g, DT);
          if (actOf(g, e) === ACTS[n.id].kind) doing++;
          expect(distXZ(tr.pos, post), `${n.id} at ${hour}, step ${i}`).toBeLessThan(0.3);
        }
        expect(doing / frames, `${n.id} at ${hour}`).toBeGreaterThan(0.9);
      }
    }
  });

  it('keep to their post when the investigator comes, and when they have gone', () => {
    const g = night(0.05);
    for (const n of posted) {
      const e = npcEntity(g, n.id)!;
      const tr = g.ecs.c.transform.get(e)!;
      for (let i = 0; i < 60 * 5; i++) { g.frame++; npcLife(g, DT); }
      expect(actOf(g, e), n.id).toBe(ACTS[n.id].kind);
      place(g, g.player.id, tr.pos.x + 3, tr.pos.z, Math.PI);
      for (let i = 0; i < 60 * 5; i++) { g.frame++; npcLife(g, DT); }
      expect(actOf(g, e), n.id).toBe(ACTS[n.id].kind);
      place(g, g.player.id, -5000, -5000, 0);
      for (let i = 0; i < 60 * 12; i++) { g.frame++; npcLife(g, DT); }
      expect(actOf(g, e), n.id).toBe(ACTS[n.id].kind);
    }
  });
});
