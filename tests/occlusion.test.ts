import { describe, expect, it } from 'vitest';
import { OCCLUSION } from '../src/data/acoustics';
import type { Collider, CollisionWorld } from '../src/world/colliders';
import { dullness, placeSound } from '../src/render/audio/cues';
import { createOcclusion, heard, shutOff, stopsSound } from '../src/render/audio/occlusion';
import { scriptedGame, place } from './helpers';

const wall: Collider = { kind: 'box', min: { x: 4, y: 0, z: -10 }, max: { x: 5, y: 3, z: 10 } }; // a metre-thick wall of stone across the way east
const fence: Collider = { kind: 'obox', x: 0, z: 6, hx: 5, hz: 0.05, yaw: 0, y0: 0, y1: 1.2 };
const tree: Collider = { kind: 'cylinder', x: 0, z: -6, radius: 0.4, y0: 0, y1: 9 };
const pillar: Collider = { kind: 'cylinder', x: -6, z: 0, radius: 1.5, y0: 0, y1: 6 };

function stage(colliders: Collider[]) {
  const { g, player } = scriptedGame();
  (g as { world: CollisionWorld }).world = { colliders, off: new Set(), ground: () => -100, contain: () => undefined };
  place(g, player, 0, 0, 0);
  return { g, ears: createOcclusion(g) };
}

describe('sound through walls (round 80)', () => {
  it('is stopped by walls and great columns, not by trees, fences or posts', () => {
    expect(stopsSound(wall)).toBe(true);
    expect(stopsSound(pillar)).toBe(true);
    expect(stopsSound(fence)).toBe(false);
    expect(stopsSound(tree)).toBe(false);
    expect(stopsSound({ kind: 'box', min: { x: 0, y: 0, z: 0 }, max: { x: 0.1, y: 3, z: 8 } })).toBe(false); // a plank
    expect(stopsSound({ kind: 'obox', x: 0, z: 0, hx: 3, hz: 0.5, yaw: 0.4, y0: 0, y1: 3 })).toBe(true);
  });

  it('shuts a sound off by the fog first, a wall next, a roof between last', () => {
    expect(shutOff(false, false, false)).toBe(0);
    expect(shutOff(false, false, true)).toBe(OCCLUSION.roof);
    expect(shutOff(false, true, false)).toBe(OCCLUSION.blocked);
    expect(shutOff(false, true, true)).toBe(OCCLUSION.roofBlocked);
    expect(shutOff(true, false, false)).toBe(OCCLUSION.fog);
    expect(OCCLUSION.fog).toBeGreaterThan(OCCLUSION.roofBlocked);
    expect(OCCLUSION.roofBlocked).toBeGreaterThan(OCCLUSION.blocked);
    expect(OCCLUSION.blocked).toBeGreaterThan(OCCLUSION.roof);
  });

  it('takes a sound down by at most OCCLUSION.gain, never to silence, and dulls it by octaves', () => {
    const p = { gain: 0.8, pan: 0.3 };
    const clear = heard(p, 0);
    expect(clear.gain).toBe(0.8);
    expect(clear.pan).toBe(0.3);
    expect(clear.lowpass).toBe(dullness(0.8)); // a clear sound is dulled by distance alone
    let [gain, cut] = [clear.gain, clear.lowpass];
    for (const occ of [0.2, 0.4, 0.7, 0.8, 1]) {
      const h = heard(p, occ);
      expect(h.gain, `${occ}`).toBeLessThan(gain);
      expect(h.lowpass, `${occ}`).toBeLessThan(cut);
      [gain, cut] = [h.gain, h.lowpass];
    }
    expect(heard(p, 1).gain).toBeCloseTo(0.8 * (1 - OCCLUSION.gain), 6);
    expect(heard(p, 1).gain).toBeGreaterThan(0);
    expect(heard(p, 1).lowpass).toBeCloseTo(OCCLUSION.cutoff[1], 0);
    const wallLow = heard(p, OCCLUSION.blocked).lowpass;
    expect(wallLow).toBeGreaterThan(1000);
    expect(wallLow).toBeLessThan(2200); // "through stone"
    expect(heard({ gain: 0.1, pan: 0 }, 0.7).lowpass).toBeLessThanOrEqual(dullness(0.1)); // a far sound is as dull as the farther of the two
  });

  it('is clear in front of a wall and shut behind it, and leaves the investigator\'s own sounds alone', () => {
    const { ears } = stage([wall]);
    expect(ears.occludedAt({ x: -4, y: 0, z: 0 })).toBe(0); // in the open, behind the investigator
    expect(ears.occludedAt({ x: 3, y: 0, z: 0 })).toBe(0); // before the wall
    expect(ears.occludedAt({ x: 9, y: 0, z: 0 })).toBeGreaterThan(0.5); // beyond it
    expect(ears.occludedAt({ x: 0, y: 0, z: 1 })).toBe(0); // at their elbow
    expect(ears.occludedAt({ x: 9, y: 0, z: 30 })).toBe(0); // round the end of it (the wall runs 10 each way)
  });

  it('does not count a tree or a fence, but a great column', () => {
    const { ears } = stage([fence, tree, pillar]);
    expect(ears.occludedAt({ x: 0, y: 0, z: 12 })).toBe(0);
    expect(ears.occludedAt({ x: 0, y: 0, z: -12 })).toBe(0);
    expect(ears.occludedAt({ x: -12, y: 0, z: 0 })).toBeGreaterThan(0.5);
  });

  it('keeps a look for a quarter second, by the cell the sound falls in, and casts few rays in a frame', () => {
    const { g, ears } = stage([wall]);
    const at = { x: 9, y: 0, z: 0 };
    expect(ears.occludedAt(at)).toBeGreaterThan(0.5);
    expect(ears.rays).toBe(1);
    ears.occludedAt({ x: 9.1, y: 0, z: 0.05 }); // the same cell
    expect(ears.rays).toBe(1);
    g.frame += OCCLUSION.keepFrames + 1;
    ears.occludedAt(at);
    expect(ears.rays).toBe(1); // (a new frame, a new count: it looked again)
    for (let i = 0; i < 40; i++) ears.occludedAt({ x: 8 + (i % 8), y: 0, z: 2 * Math.floor(i / 8) - 4 });
    expect(ears.rays).toBeLessThanOrEqual(OCCLUSION.perFrame);
  });

  it('sits in the game\'s own placement: a sound at the investigator is whole', () => {
    const p = placeSound({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, 40);
    expect(heard(p, 0).gain).toBe(p.gain);
  });
});
