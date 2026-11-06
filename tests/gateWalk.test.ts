import { describe, expect, it } from 'vitest';
import { emptyInput } from '../src/core/input';
import { setArena } from '../src/systems/bossFight';
import { spawnCreature } from '../src/systems/creatures';
import { gatePlace, interactable } from '../src/systems/checkpoints';
import { t } from '../src/core/i18n';
import { press } from './helpers';
import type { Game } from '../src/systems/components';
import { createWorldGame, stepGame } from '../src/systems/game';
import { aboutGate, GATE_WALK, gateNear, gateStepSystem, leadsTo } from '../src/systems/gateWalk';
import { outOfReach } from '../src/systems/targets';
import type { GatePlace } from '../src/world/placements';
import { demoAllows } from '../src/systems/demo';
import { worldLayout } from '../src/world/placements';
import { yawOfDir } from '../src/world/worldMap';
import { goTo, record, run } from './worldHelpers';

const pos = (g: Game) => g.ecs.c.transform.get(g.player.id)!.pos;

/** Walks toward `to` (no E) until `done`, or `max` frames. */
function walkTo(g: Game, to: { x: number; z: number }, done: () => boolean, max = 600): number {
  for (let i = 0; i < max; i++) {
    if (done()) return i;
    const p = pos(g);
    g.camera.yaw = g.camera.prevYaw = Math.atan2(to.x - p.x, to.z - p.z);
    const f = emptyInput();
    f.moveY = 1;
    stepGame(g, f);
  }
  return max;
}

/** A point `ahead` metres in front of a gate's veil and `across` along it. */
function near(t: GatePlace, ahead: number, across: number): { x: number; z: number } {
  const yaw = yawOfDir(t.face);
  return { x: t.x + Math.sin(yaw) * ahead + Math.cos(yaw) * across, z: t.z + Math.cos(yaw) * ahead - Math.sin(yaw) * across };
}

describe('the gates are walked through (round 60: "accessible via straightforward pedestrian movement")', () => {
  it('walking into a gate\'s veil draws the investigator on into it, out of reach, and through to its twin, with no E', () => {
    const g = createWorldGame();
    const gate = gatePlace('hub_australia')!;
    const twin = gatePlace(gate.to)!;
    goTo(g, gate.arrive.x, gate.arrive.z);
    run(g, 1);
    const [entering, moved] = [record(g, 'GateEntering'), record(g, 'Travelled')];
    walkTo(g, near(gate, -3, 0), () => entering.length > 0);
    expect(entering).toEqual([{ gate: gate.id, x: gate.x, z: gate.z, frames: expect.any(Number) }]);
    expect(entering[0].frames).toBeGreaterThanOrEqual(GATE_WALK.frames);
    expect(outOfReach(g)).toBe(true); // the walk in is not theirs: nothing reaches them
    expect(interactable(g)).toBeNull(); // nor is E: no prompt to pass it stands over the walk
    const at = { ...pos(g) };
    stepGame(g, { ...emptyInput(), moveX: 1 }); // nor does the stick move them
    expect(aboutGate(gate, pos(g)).ahead).toBeLessThanOrEqual(aboutGate(gate, at).ahead + 1e-6);
    run(g, entering[0].frames);
    expect(moved).toEqual([{ via: 'gate', to: twin.id, name: twin.name }]);
    expect(pos(g)).toMatchObject({ x: twin.arrive.x, z: twin.arrive.z });
    expect(g.player.gatePass).toBeNull();
    run(g, 180); // those come through stand clear of the twin's veil, and are not sent straight back
    expect(moved).toHaveLength(1);
  });

  it('from behind as from before, but not past the jambs', () => {
    const g = createWorldGame();
    const gate = gatePlace('hub_australia')!;
    const entering = record(g, 'GateEntering');
    goTo(g, ...(Object.values(near(gate, -4, 0)) as [number, number]));
    run(g, 1);
    walkTo(g, near(gate, 3, 0), () => entering.length > 0, 300);
    expect(entering).toHaveLength(1); // from behind it, too
    const h = createWorldGame();
    const beside = record(h, 'GateEntering');
    goTo(h, ...(Object.values(near(gate, 4, 3.2)) as [number, number]));
    run(h, 1);
    walkTo(h, near(gate, -4, 3.2), () => false, 240); // past it, beyond a jamb
    expect(beside).toEqual([]);
  });

  it('a fight holds every gate shut: the step in is refused and said, not every step, and no walk begins', () => {
    const g = createWorldGame();
    const gate = gatePlace('hub_australia')!;
    goTo(g, gate.arrive.x, gate.arrive.z);
    const boss = spawnCreature(g, 'keziah_mason', { x: gate.arrive.x + 40, z: gate.arrive.z, yaw: 0 })!;
    g.ecs.c.fight.get(boss)!.engaged = true;
    Object.assign(g.ecs.c.brain.get(boss)!, { state: 'engage', target: g.player.id, cooldown: 1e9 }); // (it holds the fight, and stands, and lets them walk)
    g.ecs.c.body.get(boss)!.fixed = true;
    setArena(g, boss, { x: gate.x, z: gate.z, radius: 30 }); // the fight is about the gate (Kadath's Ultimate Gate stands in its hall), its fog behind them
    const [entering, notices, moved] = [record(g, 'GateEntering'), record(g, 'Notice'), record(g, 'Travelled')];
    walkTo(g, near(gate, -3, 0), () => false, 200);
    walkTo(g, near(gate, 3, 0), () => false, 20); // and back in at once
    expect(entering).toEqual([]);
    expect(moved).toEqual([]);
    expect(notices.map((n) => n.text)).toEqual(['THE GATE WILL NOT OPEN WHILE A HORROR HOLDS YOU']);
  });

  it('one riding who steps into the veil is kept in the saddle and drawn on: there is no E, and the pace stays (mountPortal.ts)', () => {
    const g = createWorldGame();
    const gate = gatePlace('hub_australia')!;
    const entering = record(g, 'GateEntering');
    const [a, b] = [near(gate, 1.5, 0), near(gate, 0.3, 0)];
    goTo(g, a.x, a.z);
    run(g, 1);
    g.player.mount.active = 'grey';
    g.player.mount.speed = 10.5;
    const tr = g.ecs.c.transform.get(g.player.id)!;
    [tr.prev.x, tr.prev.z, tr.pos.x, tr.pos.z] = [a.x, a.z, b.x, b.z];
    gateStepSystem(g);
    expect(entering).toHaveLength(1);
    expect(g.player.mount.active).toBe('grey');
    expect(g.player.mount.speed).toBe(10.5);
    expect(g.player.gatePass).not.toBeNull();
  });

  it('E does nothing at a gate, nor does any prompt offer it', () => {
    const g = createWorldGame();
    const gate = gatePlace('hub_australia')!;
    goTo(g, gate.arrive.x, gate.arrive.z);
    run(g, 1);
    const moved = record(g, 'Travelled');
    stepGame(g, press('interact'));
    expect([moved, g.player.gatePass, interactable(g)]).toEqual([[], null, null]);
  });

  it('the notice says where a gate leads when a free investigator is near it: the region beyond, or the twin where it is the same one', () => {
    const g = createWorldGame();
    const gate = gatePlace('hub_australia')!;
    goTo(g, gate.arrive.x, gate.arrive.z);
    expect(gateNear(g)).toEqual({ id: gate.id, leads: 'Pnakotus' });
    expect(leadsTo(gate)).toBe('Pnakotus');
    expect(leadsTo(gatePlace('dream_wood_gate')!)).toBe(gatePlace('dream_deeper')!.name); // its twin is in the same region: the twin is the name
    goTo(g, gate.x + GATE_WALK.notice + 5, gate.z + 5);
    expect(gateNear(g)).toBeNull(); // too far to be told
    goTo(g, gate.arrive.x, gate.arrive.z);
    g.player.gatePass = { gate: gate.id, from: { x: 0, z: 0 }, to: { x: 0, z: 0 }, frame: 0, frames: 60 };
    expect(gateNear(g)).toBeNull(); // nothing while walking into the veil
    expect(t('hud.gateLeads', { name: 'Pnakotus' })).toMatch(/Pnakotus/);
  });

  it('in the demo, a step into a gate out of its realms is refused and said at once, and no walk begins (review of PR 142)', () => {
    const g = createWorldGame({ demo: true });
    const inDemo = (x: number, z: number): boolean => demoAllows(g, { x, z });
    const gate = worldLayout().gates.find((gt) => inDemo(gt.x, gt.z) && !inDemo(gatePlace(gt.to)!.arrive.x, gatePlace(gt.to)!.arrive.z))!;
    goTo(g, ...(Object.values(near(gate, -4, 0)) as [number, number]));
    run(g, 1);
    const [entering, said] = [record(g, 'GateEntering'), record(g, 'Notice')];
    walkTo(g, near(gate, 3, 0), () => said.length > 0, 300);
    expect(entering).toEqual([]);
    expect(said.map((n) => n.text)).toEqual([t('demo.closed')]);
  });
});
