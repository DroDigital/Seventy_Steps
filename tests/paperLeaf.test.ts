import { describe, expect, it } from 'vitest';
import { PAPER, PAPER_LOOK } from '../src/data/paperTuning';
import { burnAt, bend, gaze, poses, tint } from '../src/render/paperFlow';
import { makeSheet } from '../src/render/paperKit';
import { buildLeaf, place } from '../src/render/paperStand';

const finite = (a: ArrayLike<number>): boolean => Array.from(a).every(Number.isFinite);
const seeds = [1, 2, 3, 17, 4242, 9972];

describe('a leaf of paper as a grid', () => {
  for (const seed of seeds) {
    it(`keeps its cells inside a ragged burnt outline and its triangles valid (seed ${seed})`, () => {
      const [cols, rows] = PAPER.grid;
      const s = makeSheet(cols, rows, PAPER.size[0], PAPER.size[1], seed);
      expect(s.count).toBeGreaterThan(40);
      expect(s.count).toBeLessThanOrEqual((cols + 1) * (rows + 1));
      expect(s.index.length % 3).toBe(0);
      expect(s.index.length).toBeGreaterThan(0);
      for (const i of s.index) expect(i).toBeLessThan(s.count);
      for (const a of [s.rest, s.polar, s.angle, s.edge, s.inner, s.tone, s.uv]) expect(finite(a)).toBe(true);
      for (let v = 0; v < s.count; v++) {
        expect(Math.abs(s.rest[v * 2])).toBeLessThanOrEqual(PAPER.size[0] / 2 + 1e-6);
        expect(Math.abs(s.rest[v * 2 + 1])).toBeLessThanOrEqual(PAPER.size[1] / 2 + 1e-6);
        expect(s.edge[v]).toBeGreaterThanOrEqual(0);
        expect(s.edge[v]).toBeLessThanOrEqual(1);
        expect(s.inner[v]).toBeGreaterThanOrEqual(0);
        expect(s.inner[v]).toBeLessThanOrEqual(1);
      }
    });

    it(`has a rim that is burnt, and a middle that is not (seed ${seed})`, () => {
      const s = makeSheet(...PAPER.grid, PAPER.size[0], PAPER.size[1], seed);
      expect(s.rim.length).toBeGreaterThan(20);
      for (const v of s.rim) {
        expect(s.edge[v]).toBe(1);
        expect(s.inner[v]).toBe(0);
      }
      const middle = Array.from({ length: s.count }, (_, v) => v).filter((v) => s.polar[v] < 0.2);
      expect(middle.length).toBeGreaterThan(0);
      for (const v of middle) expect(s.edge[v]).toBeLessThan(0.2); // (a bite may come near)
      expect(Math.max(...s.inner)).toBe(1);
    });

    it(`faces the front: every triangle winds counter-clockwise seen from +z (seed ${seed})`, () => {
      const s = makeSheet(...PAPER.grid, PAPER.size[0], PAPER.size[1], seed);
      for (let i = 0; i < s.index.length; i += 3) {
        const [a, b, c] = [s.index[i], s.index[i + 1], s.index[i + 2]];
        const cross = (s.rest[b * 2] - s.rest[a * 2]) * (s.rest[c * 2 + 1] - s.rest[a * 2 + 1]) - (s.rest[b * 2 + 1] - s.rest[a * 2 + 1]) * (s.rest[c * 2] - s.rest[a * 2]);
        expect(cross).toBeGreaterThan(0);
      }
    });
  }

  it('is the same for the same seed and another for another', () => {
    expect(makeSheet(...PAPER.grid, 1, 0.7, 5)).toEqual(makeSheet(...PAPER.grid, 1, 0.7, 5));
    expect(makeSheet(...PAPER.grid, 1, 0.7, 5).index).not.toEqual(makeSheet(...PAPER.grid, 1, 0.7, 6).index);
  });
});

describe('how it floats and burns', () => {
  const sheet = makeSheet(...PAPER.grid, PAPER.size[0], PAPER.size[1], 3);

  it('hangs about its hover height with its scraps turning about it, all finite, for a long time', () => {
    for (let t = 0; t < 600; t += 7.3) {
      const ps = poses(t, 1.2, 0.3);
      expect(ps).toHaveLength(1 + PAPER.scraps);
      expect(Math.abs(ps[0].y - PAPER.hover)).toBeLessThan(0.1);
      for (const p of ps.slice(1)) {
        expect(Math.hypot(p.x, p.z)).toBeGreaterThan(PAPER.orbit - 0.05);
        expect(Math.hypot(p.x, p.z)).toBeLessThan(PAPER.orbit + 0.4);
        expect(p.y).toBeGreaterThan(PAPER.hover - 0.3);
        expect(p.y).toBeLessThan(PAPER.hover + 0.5);
      }
      for (const p of ps) expect(finite(Object.values(p))).toBe(true);
    }
  });

  it('bends its surface by no more than the waves and the curl allow, and moves with time', () => {
    const out = new Float32Array(sheet.count * 3);
    const flat = poses(0, 0, 0)[0];
    const p = { ...flat, x: 0, y: 0, z: 0, yaw: 0, pitch: 0, roll: 0 };
    bend(sheet, p, 0, out, 0);
    for (let v = 0; v < sheet.count; v++) {
      expect(out[v * 3]).toBeCloseTo(sheet.rest[v * 2], 5);
      expect(out[v * 3 + 1]).toBeCloseTo(sheet.rest[v * 2 + 1], 5);
      expect(Math.abs(out[v * 3 + 2])).toBeLessThanOrEqual(p.wave + p.curl + 1e-6);
    }
    const later = new Float32Array(sheet.count * 3);
    bend(sheet, p, 1.3, later, 0);
    expect(later).not.toEqual(out);
    expect(finite(later)).toBe(true);
  });

  it('keeps the size of a leaf as it turns: a pose is a rigid motion of what the waves made of it', () => {
    const [a, b] = [new Float32Array(sheet.count * 3), new Float32Array(sheet.count * 3)];
    const p = { ...poses(2, 1, 0)[0], x: 0, y: 0, z: 0, yaw: 0, pitch: 0, roll: 0 };
    bend(sheet, p, 2, a, 0);
    bend(sheet, { ...p, yaw: 1.1, pitch: -0.4, roll: 0.3 }, 2, b, 0);
    for (const [i, j] of [[0, 5], [3, 40], [10, sheet.count - 1]]) {
      const d = (o: Float32Array): number => Math.hypot(o[i * 3] - o[j * 3], o[i * 3 + 1] - o[j * 3 + 1], o[i * 3 + 2] - o[j * 3 + 2]);
      expect(d(b)).toBeCloseTo(d(a), 4);
    }
  });

  it('is paper in the middle, scorched toward the rim, black at it, and lit by the fire there', () => {
    const col = new Float32Array(sheet.count * 3);
    tint(sheet, 3, 0.4, col, 0);
    expect(finite(col)).toBe(true);
    const [leaf, char] = [PAPER_LOOK.leaf, PAPER_LOOK.char];
    let [middle, fire] = [0, 0];
    for (let v = 0; v < sheet.count; v++) {
      const lum = col[v * 3] + col[v * 3 + 1] + col[v * 3 + 2];
      if (sheet.edge[v] < 0.2 && sheet.polar[v] < 0.5) {
        middle++;
        expect(lum).toBeGreaterThan((char[0] + char[1] + char[2]) * 5);
        expect(col[v * 3]).toBeLessThanOrEqual(leaf[0] * sheet.tone[v] + 1e-6); // (the paper's tone, a little either way, lights it)
      }
      if (sheet.edge[v] === 1 && lum > 1.2) fire++;
    }
    expect(middle).toBeGreaterThan(10);
    expect(fire).toBeGreaterThan(sheet.rim.length / 4); // the heat crawls round the rim: most of it is lit at any moment
  });

  it('crosses the leaf with a burn from the rim to the middle, leaving ash, and is spent by its end', () => {
    expect(burnAt(0).front).toBe(0);
    expect(burnAt(PAPER.burn.front).front).toBeGreaterThan(1);
    expect(burnAt(0).flare).toBeGreaterThan(burnAt(1).flare);
    const early = new Float32Array(sheet.count * 3);
    const late = new Float32Array(sheet.count * 3);
    tint(sheet, 3, 0.4, early, 0, burnAt(0.4));
    tint(sheet, 3, 0.4, late, 0, burnAt(PAPER.burn.front + 0.3));
    expect(finite(early) && finite(late)).toBe(true);
    for (let v = 0; v < sheet.count; v++) {
      if (sheet.inner[v] > 0.9) {
        // the middle is still paper while the front is far, and ash when it has passed
        expect(early[v * 3 + 2]).toBeGreaterThan(late[v * 3 + 2]);
        expect(late[v * 3]).toBeLessThan(0.5);
      }
    }
  });

  it('lifts, curls and flutters more as it burns, and its scraps are carried off', () => {
    const [calm, burning] = [poses(3, 0.5, 0), poses(3, 0.5, 0, PAPER.burn.front)];
    expect(burning[0].y).toBeGreaterThan(calm[0].y + 0.15);
    expect(burning[0].wave).toBeGreaterThan(calm[0].wave * 2);
    expect(burning[0].curl).toBeGreaterThan(calm[0].curl * 2);
    expect(Math.hypot(burning[1].x, burning[1].z)).toBeGreaterThan(Math.hypot(calm[1].x, calm[1].z));
    for (let b = 0; b <= PAPER.burn.total; b += 0.1) for (const p of poses(3, 0.5, 0, b)) expect(finite(Object.values(p))).toBe(true);
  });
});

describe('the leaf standing in the world', () => {
  it('is one mesh with one dynamic geometry, double sided, every vertex in place and finite as it moves', () => {
    const leaf = buildLeaf('A clipping', { x: 3, y: 1, z: -2 }, 0.7, 1.1);
    expect(leaf.root.children).toHaveLength(1);
    expect(leaf.mat.side).toBe(2); // THREE.DoubleSide
    for (const t of [0, 0.5, 3, 40]) {
      place(leaf, t, 0.2);
      expect(finite(leaf.pos)).toBe(true);
      expect(finite(leaf.col)).toBe(true);
      expect(finite(leaf.geo.attributes.normal.array)).toBe(true);
      for (let v = 0; v < leaf.pos.length; v += 3) expect(Math.abs(leaf.pos[v + 1] - PAPER.hover)).toBeLessThan(1.5);
    }
    leaf.geo.dispose();
    leaf.mat.dispose();
  });

  it('is the same leaf for the same note, and another for another', () => {
    const [a, b, c] = [buildLeaf('A clipping', { x: 0, y: 0, z: 0 }, 0, 0), buildLeaf('A clipping', { x: 5, y: 0, z: 0 }, 0, 0), buildLeaf('A report', { x: 0, y: 0, z: 0 }, 0, 0)];
    expect(a.sheets[0]).toBe(b.sheets[0]); // (the patterns are made once)
    expect(a.sheets[0]).not.toBe(c.sheets[0]);
    for (const l of [a, b, c]) {
      l.geo.dispose();
      l.mat.dispose();
    }
  });
});

describe('the leaf turning toward the investigator', () => {
  it('turns slowly, never more than a quarter turn, and back to rest', () => {
    let look = 0;
    for (let i = 0; i < 20; i++) look = gaze(look, Math.PI, 1 / 60);
    expect(Math.abs(look)).toBeLessThan(0.55 / 3 + 1e-9); // 20 frames at no more than 0.55 rad/s
    for (const target of [-3, -1.2, 0, 0.8, 2.5, Math.PI]) {
      let v = 0;
      for (let i = 0; i < 6000; i++) v = gaze(v, target, 1 / 60);
      expect(Math.abs(v)).toBeLessThanOrEqual((Math.PI / 2) * 0.7 + 1e-9);
    }
    let v = 1;
    for (let i = 0; i < 6000; i++) v = gaze(v, 0, 1 / 60);
    expect(v).toBeCloseTo(0, 6);
  });

  it('follows an investigator round it without swinging edge-on as the quarter turn is crossed', () => {
    /** How far the leaf's face is from facing the eye, from either face: 0 face-on, a quarter turn edge-on. */
    const off = (target: number, look: number): number => {
      const d = Math.abs(((((target - look) % Math.PI) + Math.PI) % Math.PI));
      return Math.min(d, Math.PI - d);
    };
    for (const dir of [1, -1]) {
      let look = 0;
      let worst = 0;
      for (let i = 0; i < 60 * 30; i++) {
        const target = dir * (i / 60) * 0.2; // (a slow lap: the eye goes round at 0.2 rad/s, slower than the leaf turns)
        look = gaze(look, target, 1 / 60);
        expect(Math.abs(look)).toBeLessThanOrEqual(Math.PI + 1e-9);
        if (i > 120) worst = Math.max(worst, off(target, look));
      }
      expect(worst, `circled ${dir > 0 ? 'one way' : 'the other'}`).toBeLessThan(0.7); // (it is always turned within about 40 degrees of facing them)
    }
  });

  it('takes the turn nearest to where it is of those that look alike, and goes back to the nearest rest', () => {
    expect(gaze(2.2, 1.7, 1, 100)).toBeCloseTo(0.7 * (1.7 - Math.PI) + Math.PI, 9); // (a half turn on from the other quarter: a short way, not 2.6 rad back through edge-on)
    expect(Math.abs(gaze(2.9, 0, 1, 100))).toBeCloseTo(Math.PI, 9); // (rest is a half turn as well as none)
    expect(gaze(0.2, 0, 1, 100)).toBeCloseTo(0, 9);
  });
});
