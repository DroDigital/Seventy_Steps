/**
 * What a dungeon room's set hangs on a wall hangs on it (2026-11-26; asked, of the Library's bookcases and shelves: "they are not
 * attached to anything properly"). The sets' wall rows were laid at a share of the room's radius, and 199 cases, shelves and the like in
 * ten dungeons stood most of a metre off their walls, the Library's worst (136 of its 143). Now each is set back against the stone
 * (world/wallFlush.ts): here every hung piece in every dungeon touches what is behind it along the whole of its back (a drapery broad
 * enough to span a hall's bays, the piers it hangs from), and stands in no wall, pillar or buttress.
 */
import { describe, expect, it } from 'vitest';
import { FLUSH, gapsBehind } from '../src/world/wallFlush';
import type { Part } from '../src/world/dungeonParts';
import { worldLayout } from '../src/world/placements';
import type { Prop } from '../src/world/props';

const dungeons = worldLayout().dungeons;
const hung = dungeons.flatMap((d) => d.decor.filter((p) => p.set?.hung).map((p) => ({ d, p })));

/** Whether the piece's footprint, drawn in a little, overlaps a solid part at its own height. */
function standsIn(p: Prop, parts: readonly Part[]): Part | undefined {
  const [fx, fz, ax, az] = [Math.sin(p.yaw), Math.cos(p.yaw), Math.cos(p.yaw), -Math.sin(p.yaw)];
  const [hw, hd] = [Math.max(0, p.w - 0.05), Math.max(0, p.d - 0.05)]; // (`w` and `d` are half extents, world/props.ts) // (a boarded window is a few centimetres deep: its middle alone)
  const [y0, y1] = [p.y + 0.1, p.y + Math.max(0.3, Math.min(p.h, 1.2))];
  const pts = [-1, -0.5, 0, 0.5, 1].flatMap((s) => [-1, 0, 1].map((t) => ({ x: p.x + ax * s * hw + fx * t * hd, z: p.z + az * s * hw + fz * t * hd })));
  return parts.find((q) => {
    if (!q.solid) return false;
    if (q.shape === 'box') return q.max.y > y0 && q.min.y < y1 && pts.some((o) => o.x > q.min.x && o.x < q.max.x && o.z > q.min.z && o.z < q.max.z);
    return q.y1 > y0 && q.y0 < y1 && pts.some((o) => Math.hypot(o.x - q.x, o.z - q.z) < q.radius);
  });
}

describe('a dungeon set hangs what it hangs on a wall (2026-11-26)', () => {
  it('has hung pieces in the dungeons to look at', () => expect(hung.length).toBeGreaterThan(150));

  it('sets every hung piece back against its wall, along the whole of its back (a drapery: against the piers it spans)', () => {
    const off = hung.flatMap(({ d, p }) => {
      const gaps = gapsBehind(p, d.parts);
      const gap = p.w < FLUSH.drape ? Math.max(...gaps) : Math.min(...gaps);
      return gap > FLUSH.gap + 0.01 ? [`${d.layout.def.id} ${p.set!.id} at ${p.x.toFixed(1)},${p.z.toFixed(1)}: ${gap.toFixed(2)} m off its wall`] : [];
    });
    expect(off).toEqual([]);
  });

  it('stands none of them in a wall, a pillar or a buttress', () => {
    const inside = hung.flatMap(({ d, p }) => (standsIn(p, d.parts) ? [`${d.layout.def.id} ${p.set!.id} at ${p.x.toFixed(1)},${p.z.toFixed(1)}`] : []));
    expect(inside).toEqual([]);
  });
});
