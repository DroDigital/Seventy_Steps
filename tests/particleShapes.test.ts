import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { MARK_ATLAS } from '../src/data/markAtlas';
import { markAtlasBytes, markAtlasTexture } from '../src/render/markAtlas';
import { lifeColor, MARK_NAMES, markCell, PARTICLE_SHAPES } from '../src/render/particles';
import { particleMasksGlsl, shapeDefines } from '../src/render/shaders/particleMasks';

describe('the particle shapes (round 88, the quiet blows)', () => {
  it('keep the index of every shape that existed before, so no recorded spec draws another thing', () => {
    expect(PARTICLE_SHAPES.slice(0, 15)).toEqual(['disc', 'shard', 'streak', 'ring', 'spark', 'wisp', 'rune', 'eye', 'fang', 'bubble', 'bolt', 'feather', 'petal', 'note', 'puff']);
    expect(PARTICLE_SHAPES.slice(15)).toEqual(['crescent', 'lash', 'cross', 'dash', 'arc', 'mark', 'trace']);
  });

  it('give every shape its index as a define, and a branch in the mask', () => {
    const defines = shapeDefines(PARTICLE_SHAPES);
    const glsl = particleMasksGlsl(PARTICLE_SHAPES);
    PARTICLE_SHAPES.forEach((name, i) => {
      expect(defines, name).toContain(`#define SH_${name.toUpperCase()} ${i}`);
      if (name !== 'disc') expect(glsl, name).toMatch(new RegExp(`shape == SH_${name.toUpperCase()}\\b`)); // the disc is what is left
    });
    expect(glsl).toContain('float mask(vec2 q, int shape, float thick)');
    expect(glsl).toContain('uniform sampler2D uMarks;');
  });

  it("lie the aligned shapes along their flight in the vertex shader: the streak as it always did, the four new ones turned by rot, and by rot alone at rest", () => {
    const src = readFileSync('src/render/particles.ts', 'utf8');
    expect(src).toContain('shape == SH_STREAK');
    expect(src).toMatch(/shape == SH_CRESCENT \|\| shape == SH_LASH \|\| shape == SH_DASH \|\| shape == SH_TRACE/);
    expect(src).toContain('if (dot(aVel, aVel) > 0.0004) angle += atan(vv.y, vv.x + 1e-5);'); // 0.02 m/s
    expect(src).toContain('angle = atan(vv.y, vv.x + 1e-5);\n    len = aShape.z;'); // the streak, untouched
  });

  it('name the six marks in order and find the centre of a cell', () => {
    expect(MARK_NAMES).toEqual(['scratch', 'splat', 'dust', 'twirl', 'wisp', 'smear']);
    MARK_NAMES.forEach((n, i) => {
      const t = markCell(n);
      expect(t).toBeCloseTo((i + 0.5) / 6, 12);
      expect(Math.floor(Math.min(Math.max(t, 0), 0.999) * MARK_NAMES.length)).toBe(i); // the shader's choice of cell
    });
  });
});

describe('the mark atlas', () => {
  const bytes = markAtlasBytes();
  const { cell, width, height } = MARK_ATLAS;
  const texel = (c: number, x: number, y: number): number => bytes[y * width + c * cell + x];

  it('is one row of 32 x 32 cells in the order of MARK_NAMES', () => {
    expect([...MARK_ATLAS.names]).toEqual([...MARK_NAMES]);
    expect(cell).toBe(32);
    expect(height).toBe(cell);
    expect(width).toBe(cell * MARK_NAMES.length);
    expect(bytes.length).toBe(width * height);
  });

  it('gives every cell real coverage and a margin of nothing, so Nearest never bleeds a neighbour', () => {
    MARK_NAMES.forEach((name, c) => {
      let lit = 0;
      let max = 0;
      for (let y = 0; y < cell; y++) {
        for (let x = 0; x < cell; x++) {
          const v = texel(c, x, y);
          if (v > 0) lit++;
          max = Math.max(max, v);
          if (x === 0 || y === 0 || x === cell - 1 || y === cell - 1) expect(v, `${name} border at ${x},${y}`).toBe(0);
        }
      }
      expect(max, name).toBeGreaterThanOrEqual(150);
      expect(lit, name).toBeGreaterThanOrEqual(40);
      expect(lit, name).toBeLessThan(cell * cell * 0.8); // a mask, not a block
    });
  });

  it('lays the directional masks (scratch, wisp, smear) along +x', () => {
    for (const name of ['scratch', 'wisp', 'smear'] as const) {
      const c = MARK_NAMES.indexOf(name);
      let [x0, x1, y0, y1]: number[] = [cell, 0, cell, 0];
      for (let y = 0; y < cell; y++) for (let x = 0; x < cell; x++) if (texel(c, x, y) > 40) [x0, x1, y0, y1] = [Math.min(x0, x), Math.max(x1, x), Math.min(y0, y), Math.max(y1, y)];
      expect(x1 - x0, name).toBeGreaterThan((y1 - y0) * 1.2);
    }
  });

  it('credits every sprite it was made from, by name, with its licence', () => {
    const credits = readFileSync('src/data/models/CREDITS.md', 'utf8');
    const part = credits.slice(credits.indexOf('## Particle marks'));
    for (const file of ['scratch_01.png', 'dirt_01.png', 'trace_04.png', 'smoke_05.png']) expect(part, file).toContain(file);
    expect(part).toContain('Kenney');
    expect(part).toContain('CC0 1.0');
    expect(readFileSync('tools/marks/bake_marks.py', 'utf8')).toContain("scratch_01");
  });

  it('is one shared, hard-edged red texture with no mipmaps', () => {
    const t = markAtlasTexture();
    expect(markAtlasTexture()).toBe(t);
    expect(t.format).toBe(THREE.RedFormat);
    expect(t.type).toBe(THREE.UnsignedByteType);
    expect(t.magFilter).toBe(THREE.NearestFilter);
    expect(t.minFilter).toBe(THREE.NearestFilter);
    expect(t.generateMipmaps).toBe(false);
    expect((t.image as { width: number; height: number }).width).toBe(width);
  });
});

describe('a particle\'s colour over its life', () => {
  const [a, m, e] = [[1, 0.8, 0.2], [0.2, 0.9, 0.4], [0.1, 0.1, 0.5]] as const;
  const at = (t: number, mid: typeof m | null, end: typeof e | null): number[] => ([0, 1, 2] as const).map((i) => lifeColor(a, mid, end, t, i));

  it('keeps its own colour with no end, and blends straight to the end with no middle', () => {
    expect(at(0.7, null, null)).toEqual([...a]);
    expect(at(0.5, null, e)[0]).toBeCloseTo((a[0] + e[0]) / 2, 12);
    at(1, null, e).forEach((v, i) => expect(v).toBeCloseTo(e[i], 12));
  });

  it('passes through its middle hue at half life and is linear between', () => {
    expect(at(0, m, e)).toEqual([...a]);
    at(0.5, m, e).forEach((v, i) => expect(v).toBeCloseTo(m[i], 12));
    at(1, m, e).forEach((v, i) => expect(v).toBeCloseTo(e[i], 12));
    at(0.25, m, e).forEach((v, i) => expect(v).toBeCloseTo((a[i] + m[i]) / 2, 12));
    at(0.75, m, e).forEach((v, i) => expect(v).toBeCloseTo((m[i] + e[i]) / 2, 12));
    expect(lifeColor(a, m, null, 0.8, 0)).toBe(a[0]); // a middle with no end is nothing
  });
});
