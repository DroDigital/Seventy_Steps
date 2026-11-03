import { describe, expect, it } from 'vitest';
import { GATE_FRAME, GATE_FRAMES, gateModel } from '../src/data/gateFrames';
import { OPENING } from '../src/render/gateFrameKit';
import { gateFrame } from '../src/render/gateFrames';
import { buildFigure } from '../src/render/figures';
import { worldLayout } from '../src/world/placements';

describe("the gates' frames (round 104)", () => {
  it('every gate wears the frame of where it leads, and every frame is worn', () => {
    const gates = worldLayout().gates;
    for (const g of gates) expect(GATE_FRAME[g.id], g.id).toBeDefined();
    expect(Object.keys(GATE_FRAME).every((id) => gates.some((g) => g.id === id))).toBe(true);
    expect(new Set(gates.map((g) => GATE_FRAME[g.id])).size).toBe(GATE_FRAMES.length);
    expect(gateModel('hub_antarctic')).toBe('gate:antarctic');
  });

  it('each frame is built, glows somewhere, and keeps out of the veil it holds', () => {
    const margin = 0.25;
    for (const theme of GATE_FRAMES) {
      const pieces = gateFrame(theme);
      expect(pieces.some((p) => p.emissive >= 1), `${theme} has a glow`).toBe(true);
      let inside = 0;
      for (const p of pieces) {
        const pos = p.geo.getAttribute('position');
        for (let i = 0; i < pos.count; i++) {
          const [x, y, z] = [pos.getX(i), pos.getY(i), pos.getZ(i)];
          expect(Number.isFinite(x + y + z), theme).toBe(true);
          if (Math.abs(x) < OPENING.half - margin && y > margin && y < OPENING.height - margin && Math.abs(z) < 0.1) inside++;
        }
      }
      expect(inside, `${theme}: points in the opening`).toBe(0);
    }
  });

  it('a gate is drawn with its own frame, and an unknown one with the university\'s', () => {
    expect(buildFigure('gate:reef').materials.length).toBe(gateFrame('reef').length);
    expect(buildFigure('gate:nowhere').materials.length).toBe(gateFrame('miskatonic').length);
  });
});
