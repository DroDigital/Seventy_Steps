import { describe, expect, it } from 'vitest';
import { distXZ } from '../src/core/geom';
import { GATE_REACH } from '../src/data/finale';
import { UMR_SIGNATURE } from '../src/systems/signatures/umr';
import { resolveCapsule, type Collider } from '../src/world/colliders';
import { bossGame } from './bossHelpers';
import { place } from './helpers';

describe("the Guide's gate", () => {
  function openGate(guideX: number, playerX: number, colliders: Collider[] = []) {
    const b = bossGame('umr_at_tawil');
    const { g, boss, fight } = b;
    fight.phase = fight.script.phases.length - 1;
    fight.arena = { x: 0, z: 0, radius: 20 };
    g.world.colliders = colliders;
    place(g, boss, guideX, 0, 0);
    place(g, g.player.id, playerX, 0, 0);
    UMR_SIGNATURE.action!(g, boss, fight)!.run();
    return b;
  }

  it('keeps the gate inside the fog when the Guide yields at the rim', () => {
    const { g, boss, fight } = openGate(17, 12);
    const gate = { x: fight.sig.gx!, z: fight.sig.gz! };
    expect(distXZ(gate, fight.arena)).toBeLessThanOrEqual(fight.arena.radius - g.ecs.c.body.get(g.player.id)!.radius);
    place(g, g.player.id, gate.x, gate.z, 0);
    expect(UMR_SIGNATURE.action!(g, boss, fight)?.label).toBe('step through the Gate');
  });

  it('chooses a clear route when a wall blocks the original direction', () => {
    const wall: Collider = { kind: 'box', min: { x: 2, y: -1, z: -2 }, max: { x: 4, y: 4, z: 2 } };
    const { g, boss, fight } = openGate(0, -4, [wall]);
    const gate = { x: fight.sig.gx!, z: fight.sig.gz! };
    expect(gate).not.toEqual({ x: 9, z: 0 });
    const body = g.ecs.c.body.get(g.player.id)!;
    for (let i = 1; i <= 100; i++) {
      const x = -4 + (gate.x + 4) * i / 100;
      const z = gate.z * i / 100;
      const pos = { x, y: g.world.ground(x, z), z };
      resolveCapsule(g.world, pos, body.radius, body.height);
      expect(Math.hypot(pos.x - x, pos.z - z)).toBeLessThan(0.01);
    }
    place(g, g.player.id, gate.x, gate.z, 0);
    expect(UMR_SIGNATURE.action!(g, boss, fight)?.label).toBe('step through the Gate');
  });

  it('leaves passage available even when no candidate has a clear route', () => {
    const walls: Collider[] = [
      { kind: 'box', min: { x: -3, y: -1, z: -1.5 }, max: { x: -2.5, y: 4, z: 1.5 } },
      { kind: 'box', min: { x: -5.5, y: -1, z: -1.5 }, max: { x: -5, y: 4, z: 1.5 } },
      { kind: 'box', min: { x: -5.5, y: -1, z: -1.5 }, max: { x: -2.5, y: 4, z: -1 } },
      { kind: 'box', min: { x: -5.5, y: -1, z: 1 }, max: { x: -2.5, y: 4, z: 1.5 } },
    ];
    const { g, boss, fight } = openGate(0, -4, walls);
    const me = g.ecs.c.transform.get(g.player.id)!.pos;
    expect(distXZ(me, { x: fight.sig.gx!, z: fight.sig.gz! })).toBeLessThanOrEqual(GATE_REACH);
    expect(UMR_SIGNATURE.action!(g, boss, fight)?.label).toBe('step through the Gate');
  });
});
