import { describe, expect, it } from 'vitest';
import { emptyInput } from '../src/core/input';
import { strike, targetsOf } from '../src/systems/combat';
import { allFogs, crosses, fogBlockSystem, fogBetween, fogNear, fogToPass, passFog, sideOf, walkAlong } from '../src/systems/fogGates';
import { createWorldGame, stepGame } from '../src/systems/game';
import { interactable } from '../src/systems/checkpoints';
import { place } from './helpers';

const doorway = () => allFogs().find((w) => w.kind === 'doorway')!;
const ring = () => allFogs().find((w) => w.kind === 'ring')!;
const beside = (w: ReturnType<typeof doorway>, d: number) => ({ x: w.x - Math.sin(w.yaw) * d, z: w.z - Math.cos(w.yaw) * d });

describe('the fog before a horror is a wall (round 35)', () => {
  it('a step across it is a crossing, one beside it is not', () => {
    const w = doorway();
    expect(crosses(w, beside(w, 1), beside(w, -1))).toBe(true);
    expect(crosses(w, beside(w, 1), beside(w, 2))).toBe(false);
    const r = ring();
    expect(crosses(r, { x: r.x + r.radius - 1, z: r.z }, { x: r.x + r.radius + 1, z: r.z })).toBe(true);
    expect(crosses(r, { x: r.x, z: r.z }, { x: r.x + 3, z: r.z })).toBe(false);
  });

  it('nothing sees across it, and the investigator cannot walk through', () => {
    const g = createWorldGame();
    const w = doorway();
    expect(fogBetween(g, beside(w, 1.5), beside(w, -1.5))).toBe(true);
    const [a, b] = [beside(w, 0.6), beside(w, -0.6)];
    place(g, g.player.id, a.x, a.z, 0);
    const tr = g.ecs.c.transform.get(g.player.id)!;
    tr.pos.x = b.x; // a step that would carry them across
    tr.pos.z = b.z;
    fogBlockSystem(g);
    expect(tr.pos.x).toBeCloseTo(a.x, 5);
    expect(tr.pos.z).toBeCloseTo(a.z, 5);
    const foe = [...g.ecs.c.body.keys()].find((id) => id !== g.player.id && !g.ecs.c.body.get(id)!.fixed)!;
    const ft = g.ecs.c.transform.get(foe)!;
    ft.prev = { ...ft.pos, x: a.x, z: a.z };
    ft.pos = { ...ft.pos, x: b.x, z: b.z };
    fogBlockSystem(g);
    expect(ft.pos.x).toBeCloseTo(a.x, 5); // nor can a foe
  });

  it('E near it walks the investigator through, and the way back is the same', () => {
    const g = createWorldGame();
    const w = doorway();
    const a = beside(w, 1.6);
    place(g, g.player.id, a.x, a.z, 0);
    const before = Math.sign(sideOf(w, a));
    expect(fogToPass(g)?.id).toBe(w.id);
    expect(interactable(g)?.kind === 'fog' || interactable(g) !== null).toBe(true);
    passFog(g, w);
    const tr = g.ecs.c.transform.get(g.player.id)!;
    for (let i = 0; i < 400 && g.player.fogPass; i++) stepGame(g, emptyInput());
    expect(g.player.fogPass).toBeNull();
    expect(Math.sign(sideOf(w, tr.pos))).toBe(-before);
  });

  it('the walk through is a walk, from rest to rest: under way the ground goes by, so the legs move (round 45: movement overwrote the step, and they glided), and it ends standing (round 60)', () => {
    const g = createWorldGame();
    const w = doorway();
    const a = beside(w, 1.6);
    place(g, g.player.id, a.x, a.z, 0);
    passFog(g, w);
    const tr = g.ecs.c.transform.get(g.player.id)!;
    const speeds: number[] = [];
    for (let i = 0; i < 400 && g.player.fogPass; i++) {
      stepGame(g, emptyInput());
      speeds.push(Math.hypot(tr.pos.x - tr.prev.x, tr.pos.z - tr.prev.z) * 60); // (the last is the step it ends on)
    }
    const third = Math.floor(speeds.length / 3);
    expect(speeds.length).toBeGreaterThan(30);
    expect(Math.min(...speeds.slice(third, -third)), 'a walk once under way').toBeGreaterThan(1.5);
    expect(Math.max(...speeds)).toBeLessThan(2.4);
    expect(speeds[0], 'it sets off from standing').toBeLessThan(0.3);
    expect(speeds.at(-1), 'it ends standing: an arrival that holds the world as it ends shows them still, not striding in place').toBeLessThan(0.2);
    for (let i = speeds.length - 30; i < speeds.length; i++) expect(speeds[i], 'and it slows into it').toBeLessThanOrEqual(speeds[i - 1] + 1e-9);
  });

  it('walkAlong runs from 0 to 1 without a jump, never back, its pace from rest to rest', () => {
    for (const seconds of [0.7, 1.3, 2.5, 4]) {
      let last = 0;
      for (let k = 1; k <= 200; k++) {
        const now = walkAlong(k / 200, seconds);
        expect(now).toBeGreaterThanOrEqual(last);
        expect(now - last, `${seconds} s at ${k}`).toBeLessThan(0.02);
        last = now;
      }
      expect(last).toBe(1);
      expect(walkAlong(0.002, seconds) / 0.002).toBeLessThan(0.1); // from rest
      expect((1 - walkAlong(0.998, seconds)) / 0.002).toBeLessThan(0.1); // to rest
    }
  });

  it('the walk is the fog\'s, so nothing sees or strikes the investigator on it: the horror wakes as it ends, not while they cannot answer (round 60)', () => {
    const g = createWorldGame();
    const w = doorway();
    let at = { x: w.stake.x, z: w.stake.z };
    for (let i = 0; i < 400 && !fogNear(g, at, 2.4); i++) { // from its candle up to the fog, as one comes to it
      const d = Math.hypot(w.x - at.x, w.z - at.z);
      at = { x: at.x + ((w.x - at.x) / d) * 0.1, z: at.z + ((w.z - at.z) / d) * 0.1 };
    }
    place(g, g.player.id, at.x, at.z, 0);
    for (let i = 0; i < 120; i++) stepGame(g, emptyInput()); // the horror beyond is streamed in
    place(g, g.player.id, at.x, at.z, 0);
    const boss = [...g.ecs.c.fight].find(([, f]) => w.bosses.includes(f.id))![0];
    let [frame, engaged, hurt, ended] = [0, -1, -1, -1];
    g.events.on('BossEngaged', () => void (engaged < 0 && (engaged = frame)));
    g.events.on('Hit', (e) => void (e.target === g.player.id && e.outcome !== 'dodged' && hurt < 0 && (hurt = frame)));
    passFog(g, fogNear(g, at)!.wall);
    for (; frame < 400 && ended < 0; frame++) {
      stepGame(g, emptyInput());
      if (!g.player.fogPass) ended = frame;
      else {
        expect(targetsOf(g, boss)).not.toContain(g.player.id);
        expect(strike(g, boss, g.player.id, { damage: 50, poise: 10, guard: 10, hitstop: 0, parryable: false, interrupts: false })).toBe('dodged');
      }
    }
    expect(ended).toBeGreaterThan(0);
    expect(ended / 60, 'the walk is a few steps, not a long march').toBeLessThan(2.6);
    expect(engaged, 'woke while the fog still walked them in').toBe(ended);
    expect(hurt).toBe(-1);
  });
});
