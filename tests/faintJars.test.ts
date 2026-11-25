/**
 * 2026-11-25 (asked, with a screenshot of a hall's shelves of jars shining out of the dark): the jars of glowing fluid on a hall's
 * shelves, and the one in a niche, were wholly self-lit, as bright across a dark hall as at hand. They are lit as the stone is now, with
 * only a little light of their own (DUNGEON_LIGHT.faint): the glow is kept for flames, lamps and what is set burning.
 */
import { describe, expect, it } from 'vitest';
import { createRng } from '../src/core/rng';
import { DUNGEON_LIGHT } from '../src/data/tuning';
import { place, type Out } from '../src/render/dungeonFurniture';
import { dressing } from '../src/render/dungeonDressing';
import { worldLayout } from '../src/world/placements';

const empty = (): Out => ({ wall: [], wood: [], beam: [], trim: [], glow: [], shine: [], faint: [] });
const wall = { at: (s: number, d: number) => ({ x: s, z: d }), alongX: true };

describe('a jar of glowing fluid', () => {
  it('gives only a little light of its own', () => {
    expect(DUNGEON_LIGHT.faint).toBeGreaterThan(0);
    expect(DUNGEON_LIGHT.faint).toBeLessThan(0.3);
  });

  it('on a hall\'s shelves is lit as the room is, not wholly self-lit', () => {
    const out = empty();
    place('specimens', { wall, s: 0, y: 0, c: [0.6, 0.6, 0.58], rng: createRng(7), out });
    expect(out.glow).toHaveLength(0);
    expect(out.faint).toHaveLength(10);
  });

  it('in Curwen\'s laboratory, shelves and niches alike, is drawn faint', () => {
    const d = worldLayout().dungeons.find((q) => q.layout.def.id === 'curwen_catacombs')!;
    const out = dressing(d.layout, () => [0.5, 0.5, 0.5], { x: 0, z: 0 }, [], d.decor);
    const count = (kind: string) => out.filter((q) => q.kind === kind && q.geo).reduce((n, q) => n + q.geo!.getAttribute('position').count, 0);
    expect(count('faint')).toBeGreaterThan(count('glow'));
  });
});
