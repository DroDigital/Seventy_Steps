import { describe, expect, it } from 'vitest';
import { worldLayout } from '../src/world/placements';
import { ground } from '../src/world/terrain';
import { isStair, walkOver, WALK_OVER } from '../src/world/walkOver';

/** Every piece walked over in a court or a dungeon, with what it stands on. */
function walked() {
  const w = worldLayout();
  const sets = [...w.arenas.map((a) => ({ id: a.bosses[0] ?? '?', props: a.decor })), ...w.dungeons.map((d) => ({ id: d.layout.def.id, props: d.decor }))];
  return sets.flatMap(({ id, props }) => props.filter((p) => p.kind === 'set' && p.set?.walk).map((p) => ({ place: id, p, top: p.y + p.h - ground(p.x, p.z) })));
}

describe('2026-11-27: nothing walked over stands up a body’s legs', () => {
  it('paving lies flush, and clutter is sunk to the ankle', () => {
    expect(walkOver('tp_floor', 1.2, 1.2, 0.48, 0.02)).toEqual({ drop: WALK_OVER.flush - 0.5, walk: true });
    expect(walkOver('tp_rubble_2', 0.8, 0.7, 0.58, 0).walk).toBe(true);
    expect(walkOver('bn_pile_skull', 0.8, 0.8, 1.08, 0)).toEqual({ drop: WALK_OVER.ankle - 1.08, walk: true });
    expect(walkOver('nt_lily', 0.6, 0.7, 0.43, 0).drop).toBe(0); // a plant is walked through
    expect(walkOver('tp_flag_moon', 0.6, 0.1, 2.3, 3.4).drop).toBe(0); // a banner hung is not laid on the floor
  });

  it('no stone, deck, bone or book walked over rises above the ankle where it is laid (Bokrug’s way in stood half way up the shins)', () => {
    const all = walked();
    expect(all.length).toBeGreaterThan(100);

    const laid = all.filter(({ p }) => p.y - ground(p.x, p.z) <= WALK_OVER.laid && Math.min(p.w, p.d) >= 0.3 && p.h <= 1.2); // on the floor, broad enough to stand in and no taller than a thing stepped among (a rail, a post or a wreck's open frame is passed; a pyramid set sunk beyond a wall is not reached)
    expect(laid.length).toBeGreaterThan(50);
    const high = laid.filter(({ p, top }) => !/lily|reed|bush/.test(p.set!.id) && !isStair(p.set!.id) && top > WALK_OVER.ankle + 0.02);
    expect(high.map(({ place, p, top }) => `${place}: ${p.set!.id} ${top.toFixed(2)} m`)).toEqual([]);
  });

  it('a floor of flags walked over is no higher than a hand’s breadth', () => {
    for (const { place, p, top } of walked()) if (/floor|deck|tile|dais/.test(p.set!.id) && Math.abs(p.y - ground(p.x, p.z)) < 1) expect(top, `${place}: ${p.set!.id}`).toBeLessThan(WALK_OVER.flush + 0.1);
  });
});
