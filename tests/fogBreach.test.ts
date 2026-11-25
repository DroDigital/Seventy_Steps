import { describe, expect, it } from 'vitest';
import { createFogBreach } from '../src/render/fogBreach';
import type { FogSightState } from '../src/render/fogSight';

const wall = { x: 0, y: 0, z: 0, yaw: 0, width: 8, height: 6 };
const clearSight: FogSightState = { at: null, u: 0, y: 1.18, clear: 0, blocked: false };
const blockedSight = (u = 0, y = 1.2): FogSightState => ({ at: { x: u, y, z: 0 }, u, y, clear: 1, blocked: true });

describe('the breach torn through a boss fog (2026-11-24)', () => {
  it('stays shut while idle, tears open around the player during traversal, and closes cleanly once clear', () => {
    const breach = createFogBreach(wall);
    const idle = breach.update({ x: 0, y: 0, z: -3 }, null, clearSight, 0.05);
    expect(idle.phase).toBe('idle');
    expect(idle.rx).toBe(0);
    expect(idle.ry).toBe(0);

    // Player walks from z = -2 through z = 0 to z = +1.8 at u = 0.6.
    const pass = { from: { x: 0.6, z: -2 }, to: { x: 0.6, z: 1.8 }, frame: 0, frames: 90 };
    const beforePlane = breach.update({ x: 0.6, y: 0, z: -0.4 }, { ...pass, frame: 38 }, clearSight, 0.05);
    expect(beforePlane.phase).toBe('tearing');
    expect(beforePlane.push, 'curtain billows forward in the walk direction').toBeGreaterThan(0.2);
    expect(beforePlane.swirl, 'mist curls outward as the body pushes in').toBeGreaterThan(0.2);

    const throughPlane = breach.update({ x: 0.6, y: 0, z: 0.35 }, { ...pass, frame: 55 }, blockedSight(0.6), 0.05);
    expect(throughPlane.rx, 'full human-scale breach opens at crossing').toBeGreaterThan(0.9);
    expect(throughPlane.ry).toBeGreaterThan(1.2);
    expect(throughPlane.u).toBeCloseTo(0.6, 1);

    // Walk completes while camera is still behind: breach stays localized and open.
    breach.passed({ x: 0.6, z: 1.8 });
    let held = throughPlane;
    for (let i = 0; i < 30; i++) held = breach.update({ x: 0.6, y: 0, z: 1.8 }, null, blockedSight(0.6), 0.05);
    expect(held.phase).toBe('open');
    expect(held.rx, 'sight hole gently settles slightly tighter without blinding').toBeLessThan(throughPlane.rx);
    expect(held.rx).toBeGreaterThan(0.7);

    // Camera enters: breach lingers briefly, then shrinks monotonically to 0 with inward swirl and fires sealedNow once.
    const lingered = breach.update({ x: 0.6, y: 0, z: 3 }, null, clearSight, 0.1);
    expect(lingered.rx).toBeGreaterThan(0.7);
    let prevRx = lingered.rx;
    let sawClosing = false;
    let seals = 0;
    for (let i = 0; i < 60; i++) {
      const s = breach.update({ x: 0.6, y: 0, z: 4 }, null, clearSight, 0.05);
      if (s.phase === 'closing') {
        sawClosing = true;
        expect(s.rx).toBeLessThanOrEqual(prevRx + 1e-6);
        expect(s.swirl, 'mist spirals inward while closing').toBeLessThanOrEqual(0);
      }
      if (s.sealedNow) seals++;
      prevRx = s.rx;
    }
    expect(sawClosing).toBe(true);
    expect(seals).toBe(1);
    expect(prevRx).toBe(0);
  });

  it('clamps hole radii inside narrow dungeon doorways so thick mist remains anchored to both jambs and the lintel', () => {
    const doorway = { x: 0, y: 0, z: 0, yaw: 0, width: 3.6, height: 3.9 };
    const breach = createFogBreach(doorway);
    const pass = { from: { x: 1.2, z: -1.8 }, to: { x: 1.2, z: 1.8 }, frame: 50, frames: 90 };
    const s = breach.update({ x: 1.2, y: 0, z: 0.3 }, pass, clearSight, 0.05);
    expect(s.rx).toBeLessThanOrEqual(doorway.width * 0.31);
    expect(Math.abs(s.u) + s.rx, 'hole stays well inside the doorway jambs').toBeLessThan(doorway.width * 0.5 - 0.15);
    expect(s.y + s.ry, 'hole leaves mist intact beneath the lintel').toBeLessThan(doorway.height - 0.1);
  });

  it('keeps the held sight opening aligned with the camera ray near a dungeon doorway jamb or lintel', () => {
    const doorway = { x: 0, y: 0, z: 0, yaw: 0, width: 3.6, height: 3.9 };
    const breach = createFogBreach(doorway);
    breach.passed({ x: 0, z: 1.8 });

    // Player moves toward the right jamb so the camera ray crosses at u = 1.55 m (inside the 3.2 m doorway).
    const first = breach.update({ x: 1.55, y: 0, z: 1.8 }, null, blockedSight(1.55, 1.2), 0.05);
    expect(Math.abs(1.55 - first.u) / first.rx, 'ray stays inside the clear core opening immediately').toBeLessThan(0.45);

    let settled = first;
    for (let i = 0; i < 30; i++) settled = breach.update({ x: 1.55, y: 0, z: 1.8 }, null, blockedSight(1.55, 1.2), 0.05);
    expect(settled.phase).toBe('open');
    expect(Math.abs(1.55 - settled.u) / settled.rx, 'settled opening stays centred on the jamb-side sight ray').toBeLessThan(0.15);
    // Opposite jamb remains covered by opaque mist (breach does not swallow the whole doorway).
    expect(settled.u - settled.rx).toBeGreaterThan(-doorway.width * 0.25);

    // Also tracks an elevated sight ray near the lintel on the opposite jamb.
    let high = settled;
    for (let i = 0; i < 30; i++) high = breach.update({ x: -1.55, y: 0, z: 1.8 }, null, blockedSight(-1.55, 3.2), 0.05);
    expect(Math.hypot((-1.55 - high.u) / high.rx, (3.2 - high.y) / high.ry)).toBeLessThan(0.15);
  });

  it('pushes in the opposite direction when walking back out through a wall', () => {
    const breach = createFogBreach(wall);
    const pass = { from: { x: 0, z: 2 }, to: { x: 0, z: -1.8 }, frame: 45, frames: 90 };
    const s = breach.update({ x: 0, y: 0, z: 0.1 }, pass, clearSight, 0.05);
    expect(s.push).toBeLessThan(-0.3);
    expect(s.rx).toBeGreaterThan(0.5);
  });
});
