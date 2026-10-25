import { describe, expect, it } from 'vitest';
import { PLAYER_MOVES, type MoveDef } from '../src/data/moves';
import { PLAYER_CLIPS } from '../src/data/player/playerClips';
import { PLAYER_JOINTS } from '../src/data/player/playerIndex';
import { WEAPON_IDS, armedMoves } from '../src/data/weapons';
import { clipTime, newPose, playerClip, sampleClip, type Clip } from '../src/render/playerClips';
import { idOf } from '../src/render/playerPose';

const GAITS = ['idle', 'walk', 'run', 'sprint'];
const J = PLAYER_JOINTS.length;
const SPIN = ['roll', 'death']; // clips in which the whole body turns through more than a frame's worth is allowed
const ids = new Set<string>(GAITS);
for (const w of WEAPON_IDS) {
  ids.add(`${w}.guard`);
  for (const m of Object.keys(armedMoves(w))) ids.add(idOf(w, m));
}
const get = (id: string): Clip => {
  const c = playerClip(id);
  if (!c) throw new Error(`no clip ${id}`);
  return c;
};

/** The angle between joint j's rotations in two samples (radians). */
function turn(a: Float32Array, b: Float32Array, j: number): number {
  const d = Math.abs(a[j * 4] * b[j * 4] + a[j * 4 + 1] * b[j * 4 + 1] + a[j * 4 + 2] * b[j * 4 + 2] + a[j * 4 + 3] * b[j * 4 + 3]);
  return 2 * Math.acos(Math.min(1, d));
}

/** The move's data as a clip has it for the game's markers. */
function dataMarks(d: MoveDef): Record<string, number> {
  const m: Record<string, number> = {};
  if (d.hit) [m.hit0, m.hit1] = d.hit.window;
  if (d.item !== undefined) m.item = d.item;
  if (d.shot) m.shot = d.shot.frame;
  if (d.volley) m.volley = d.volley.frame;
  if (d.parry) [m.parry0, m.parry1] = d.parry;
  return m;
}

describe('the investigator’s clips (round 78, tools/player, docs/PLAYER.md)', () => {
  it('has a clip for every move he can make with every weapon, and for no move he cannot', () => {
    const have = Object.keys(PLAYER_CLIPS).sort();
    expect(have).toEqual([...ids].sort());
  });

  it('decodes: a pose for every frame, every joint a unit rotation, nothing not a number', () => {
    for (const id of ids) {
      const c = get(id);
      expect(c.n, id).toBe(c.loop ? c.frames : c.frames + 1);
      for (let j = 0; j < J; j++) {
        const tr = c.tracks[j] ?? c.rest.subarray(j * 4, j * 4 + 4);
        for (let i = 0; i < tr.length; i += 4) {
          const l = Math.hypot(tr[i], tr[i + 1], tr[i + 2], tr[i + 3]);
          expect(Number.isFinite(l) && Math.abs(l - 1) < 2e-3, `${id} joint ${j} sample ${i / 4}`).toBe(true);
        }
      }
      if (c.body) for (const v of c.body) expect(Number.isFinite(v) && Math.abs(v) < 2.5, id).toBe(true);
    }
  });

  it('is as long as its move and has the game’s markers where the data puts them', () => {
    for (const w of WEAPON_IDS) {
      for (const [m, def] of Object.entries(armedMoves(w))) {
        const c = get(idOf(w, m));
        expect(c.loop, `${w}.${m}`).toBe(false);
        expect(c.frames, `${w}.${m} frames`).toBe(def.frames);
        const data = dataMarks(def);
        for (const [k, v] of Object.entries(data)) expect(c.marks[k], `${w}.${m} ${k}`).toBe(v);
        for (let f = 0; f <= def.frames; f += 1) expect(clipTime(c, def, f), `${w}.${m} frame ${f}`).toBeCloseTo(f, 6);
      }
    }
  });

  it('begins and ends in the pose he is carried in, so the game’s short crossfade has nothing to hide', () => {
    const idle = sampleClip(get('idle'), 0, newPose());
    const [a, b] = [newPose(), newPose()];
    const worst = (c: Clip, at: number, out: ReturnType<typeof newPose>): number => {
      sampleClip(c, at, out);
      return Math.max(...Array.from({ length: J }, (_, j) => (j < 1 ? 0 : turn(out.q, idle.q, j))).filter((_, j) => j !== PLAYER_JOINTS.indexOf('lantern')));
    };
    for (const id of ids) {
      const c = get(id);
      if (c.loop) continue;
      expect(worst(c, 0, a), `${id} begins`).toBeLessThan(0.65);
      if (id !== 'death') expect(worst(c, c.n - 1, b), `${id} ends`).toBeLessThan(0.65);
    }
  });

  it('turns no joint more than the eye can follow in one frame, and its loops close', () => {
    for (const id of ids) {
      const c = get(id);
      const frames = c.loop ? c.n : c.n - 1;
      const [a, b] = [newPose(), newPose()];
      for (let f = 0; f < frames; f++) {
        sampleClip(c, f, a);
        sampleClip(c, c.loop ? (f + 1) % c.n : f + 1, b);
        for (let j = 0; j < J; j++) {
          if (j === 0 && SPIN.includes(id)) continue;
          expect(turn(a.q, b.q, j), `${id} joint ${PLAYER_JOINTS[j]} at frame ${f}`).toBeLessThan(1.35);
        }
        if (c.loop && f === frames - 1) for (let j = 0; j < J; j++) expect(turn(a.q, b.q, j), `${id} loop seam, joint ${PLAYER_JOINTS[j]}`).toBeLessThan(0.45);
      }
    }
  });

  it('draws the blade for the sword-cane’s moves, and hands the off-hand its prop until the item is gone', () => {
    for (const id of ids) {
      const c = get(id);
      if (id.startsWith('cane.') && id !== 'cane.guard') expect(c.drawn, id).toBe(true);
    }
    const take = (id: string): Clip => get(id);
    expect(take('shoot').props).toContain('gun');
    expect(take('reload').props).toContain('gun');
    expect(take('drink').props).toEqual(['laudanum']);
    expect(take('inject').props).toEqual(['syringe']);
    expect(take('throw').props).toEqual(['flask']);
    expect(take('throw').marks.props).toBeGreaterThanOrEqual(PLAYER_MOVES.throw.volley!.frame);
    expect(take('scatter').props).toEqual(['powder']);
    expect(take('kindle').props).toEqual(['match']);
    expect(take('chant').props).toEqual(['book']);
  });
});
