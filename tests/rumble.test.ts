import { describe, expect, it } from 'vitest';
import { useDevice } from '../src/core/device';
import { createRumbler, mixAt, pulseAt } from '../src/core/rumble';
import { RUMBLE } from '../src/data/rumble';
import { createRumbleFx, groundShare } from '../src/render/rumbleFx';
import { place, scriptedGame } from './helpers';

type Sent = [number, number, number];
const recorder = (): { sent: Sent[]; send: (s: number, w: number, ms: number) => void } => {
  const sent: Sent[] = [];
  return { sent, send: (s, w, ms) => void sent.push([s, w, ms]) };
};

describe('the controller rumble (2026-11-03)', () => {
  it('a pulse fades to nothing over its length and is silent outside it', () => {
    const p = { strong: 1, weak: 0.5, ms: 100, at: 0 };
    expect(pulseAt(p, -1)).toEqual([0, 0]);
    expect(pulseAt(p, 0)).toEqual([1, 0.5]);
    expect(pulseAt(p, 50)[0]).toBeCloseTo(0.5);
    expect(pulseAt(p, 100)).toEqual([0, 0]);
    expect(pulseAt({ ...p, fade: 0 }, 99)).toEqual([1, 0.5]); // held flat
  });

  it('pulses mix by the strongest of each motor, never past 1', () => {
    expect(mixAt([{ strong: 0.9, weak: 0.1, ms: 100, at: 0, fade: 0 }, { strong: 0.2, weak: 0.8, ms: 100, at: 0, fade: 0 }], 10)).toEqual([0.9, 0.8]);
  });

  it('sends when the pair changes, again before a send runs out, and stops the motors when it ends', () => {
    const { sent, send } = recorder();
    const r = createRumbler(send);
    r.add({ strong: 0.6, weak: 0.4, ms: 300, fade: 0 }, 0);
    r.update(0, 1);
    expect(sent).toEqual([[0.6, 0.4, RUMBLE.hold]]);
    r.update(16, 1); // unchanged and recently sent: nothing
    expect(sent.length).toBe(1);
    r.update(RUMBLE.every + 1, 1); // held: sent again before the last runs out
    expect(sent.length).toBe(2);
    expect(RUMBLE.every).toBeLessThan(RUMBLE.hold);
    r.update(400, 1);
    expect(sent.at(-1)).toEqual([0, 0, 0]);
    r.update(500, 1); // silent and already stopped: nothing more
    expect(sent.length).toBe(3);
  });

  it('the setting scales it, and at 0 nothing is driven', () => {
    const { sent, send } = recorder();
    const r = createRumbler(send);
    r.add({ strong: 0.8, weak: 0.4, ms: 300, fade: 0 }, 0);
    r.update(0, 0.5);
    expect(sent[0]![0]).toBeCloseTo(0.4);
    const quiet = recorder();
    const q = createRumbler(quiet.send);
    q.add({ strong: 0.8, weak: 0.4, ms: 300 }, 0);
    q.update(0, 0);
    expect(quiet.sent).toEqual([]);
  });

  it('the ground rolls by its distance', () => {
    expect(groundShare(0)).toBe(1);
    expect(groundShare(RUMBLE.far)).toBe(0);
    expect(groundShare((RUMBLE.near + RUMBLE.far) / 2)).toBeCloseTo(0.5);
  });

  it('a wound taken is felt with a pad in hand, harder the deeper, and not at all on the keyboard', () => {
    const { g, player, deepOne } = scriptedGame();
    place(g, player, 0, 0, 0);
    let t = 0;
    const { sent, send } = recorder();
    const fx = createRumbleFx(g, () => t, createRumbler(send));
    useDevice('keys');
    g.events.emit('Hit', { attacker: deepOne, target: player, outcome: 'hit', damage: 10 });
    fx.update(1, false);
    expect(sent).toEqual([]);
    useDevice('pad');
    g.events.emit('Hit', { attacker: deepOne, target: player, outcome: 'hit', damage: 5 });
    fx.update(1, false);
    const graze = sent.at(-1)![0];
    t = 1000;
    fx.update(1, false);
    g.events.emit('Hit', { attacker: deepOne, target: player, outcome: 'hit', damage: 80 });
    fx.update(1, false);
    expect(sent.at(-1)![0]).toBeGreaterThan(graze);
    fx.update(1, true); // a pause stops the motors
    expect(sent.at(-1)).toEqual([0, 0, 0]);
    useDevice('keys');
  });
});
