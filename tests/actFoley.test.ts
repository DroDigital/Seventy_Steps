import { describe, expect, it } from 'vitest';
import { actCues } from '../src/data/actBeats';
import type { ActKind } from '../src/data/npcActs';
import { ACTS } from '../src/data/foleySounds';
import { createActFoley } from '../src/render/audio/actFoley';
import { npcEntity } from '../src/systems/npcs';
import { NPCS } from '../src/data/npcs';
import { createWorldGame } from '../src/systems/game';
import { actOf, npcLife } from '../src/systems/npcLife';

describe('the acts, heard (round 40)', () => {
  it('has a sound for every cue, and no act is given a sound that does not exist', () => {
    for (const kind of ['read', 'smoke', 'lounge', 'write', 'drink', 'whittle', 'map', 'polish', 'mend', 'key', 'vial', 'watch', 'lean'] as ActKind[]) {
      const cues = actCues(kind, 0, 200, () => 1);
      expect(cues.length, kind).toBeGreaterThan(0);
      for (const { cue } of cues) expect(ACTS[cue.sound], `${kind}: ${cue.sound}`).toBeDefined();
    }
    for (const kind of ['gaze', 'brood'] as ActKind[]) expect(actCues(kind, 0, 200, () => 1)).toEqual([]);
  });

  it('draws its chances: a share of the strokes of a pen or a knife pass unsounded, and a run of them is never a fixed rhythm', () => {
    const all = actCues('write', 0, 140, () => 1).length;
    let s = 3;
    const rand = (): number => (s = (s * 16807) % 2147483647) / 2147483647;
    const some = actCues('write', 0, 140, rand);
    expect(some.length).toBeLessThan(all);
    expect(some.length).toBeGreaterThan(all * 0.3);
    const gaps = some.slice(1).map((c, i) => +(c.t - some[i].t).toFixed(2));
    expect(new Set(gaps).size).toBeGreaterThan(2);
  });

  it('counts each cue once across the frames it spans: split a window anywhere and no cue is lost or doubled', () => {
    const rand = (): number => 1; // every one sounds
    const whole = actCues('lounge', 0, 90, rand).map((c) => c.t);
    const parts = [0, 13.7, 14.2, 50, 51.5, 90].slice(1).flatMap((to, i) => actCues('lounge', [0, 13.7, 14.2, 50, 51.5][i], to, rand).map((c) => c.t));
    expect(parts).toEqual(whole);
  });

  it('is heard from a person at their act, where they stand, and not from one who is not', () => {
    const g = createWorldGame();
    const heard: { key: string; at: { x: number; y: number; z: number } }[] = [];
    const foley = createActFoley(g, (key, _s, o) => (heard.push({ key, at: o.at }), true));
    // let every person take up their act: night, nobody near
    const me = g.ecs.c.transform.get(g.player.id)!.pos;
    me.x = me.z = -5000;
    for (let i = 0; i < 60 * 30; i++) {
      g.frame++;
      npcLife(g, 1 / 60);
    }
    const at = NPCS.map((n) => ({ n, e: npcEntity(g, n.id)! })).filter(({ e }) => actOf(g, e) !== null);
    expect(at.length).toBeGreaterThan(3);
    let t = 100;
    foley.update(t);
    for (let i = 0; i < 60 * 40; i++) foley.update((t += 1 / 60)); // forty seconds of the hub
    expect(heard.length).toBeGreaterThan(5);
    for (const h of heard) {
      expect(h.key.startsWith('act:')).toBe(true);
      expect(at.some(({ e }) => Math.hypot(g.ecs.c.transform.get(e)!.pos.x - h.at.x, g.ecs.c.transform.get(e)!.pos.z - h.at.z) < 1e-6)).toBe(true);
      expect(h.at.y).toBeGreaterThan(g.ecs.c.transform.get(at[0].e)!.pos.y - 5);
    }
  });

  it('does not catch up after a pause or a jump, nor on the first look', () => {
    const g = createWorldGame();
    const heard: string[] = [];
    const foley = createActFoley(g, (key) => (heard.push(key), true));
    foley.update(500);
    foley.update(800); // a pause of five minutes
    foley.update(800); // time standing still
    expect(heard).toEqual([]);
  });
});
