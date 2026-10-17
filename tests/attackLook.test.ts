import { describe, expect, it } from 'vitest';
import { BOSS_ATTACK_THEME } from '../src/data/bossAttackTheme';
import { AOE_MOTIFS } from '../src/render/aoeLook';
import { DANGER_FLOOR, LIGHT_FLOOR, lift, lookOf } from '../src/render/attackLook';
import { luma, rgbToHsv, type Rgb } from '../src/render/palette';
import { shotLook } from '../src/render/shotLook';

const bosses = Object.keys(BOSS_ATTACK_THEME);
const hueGap = (a: Rgb, b: Rgb): number => {
  const d = Math.abs(rgbToHsv(a)[0] - rgbToHsv(b)[0]);
  return Math.min(d, 1 - d);
};

describe('a horror\'s marks are found against any ground (round 51)', () => {
  it('lifts a colour to the floor of brightness and keeps its hue, and leaves a bright one alone', () => {
    expect(lift([0.05, 0.2, 0.18], 0.45)).not.toEqual([0.05, 0.2, 0.18]);
    for (const c of [[0.04, 0.23, 0.2], [0.4, 0.05, 0.1], [0.06, 0.05, 0.09], [0.1, 0.06, 0.02], [0, 0, 0]] as Rgb[]) {
      const out = lift(c, 0.45);
      expect(luma(out)).toBeGreaterThanOrEqual(0.44);
      for (const n of out) expect(n).toBeLessThanOrEqual(1);
      if (rgbToHsv(c)[1] > 0.3) expect(hueGap(c, out)).toBeLessThan(0.06);
      expect(lift(out, 0.45)).toEqual(out); // lifting twice is lifting once
    }
    const bright: Rgb = [0.9, 0.8, 0.7];
    expect(lift(bright, 0.45)).toBe(bright);
  });

  it('every scripted horror\'s telegraph, bolt and gaze are above the floor, in its own hue, and no two are alike', () => {
    const seen = new Set<string>();
    for (const id of bosses) {
      const look = lookOf(id);
      const theme = BOSS_ATTACK_THEME[id]!;
      expect(luma(look.danger), id).toBeGreaterThanOrEqual(DANGER_FLOOR - 0.01);
      expect(luma(look.line), id).toBeGreaterThanOrEqual(LIGHT_FLOOR - 0.01);
      expect(luma(look.mind), id).toBeGreaterThanOrEqual(DANGER_FLOOR - 0.01);
      expect(luma(look.core), id).toBeGreaterThan(luma(look.line) - 0.01);
      expect(look.ink, id).toEqual(theme.danger); // what it leaves is the author's own dark
      if (rgbToHsv(theme.danger)[1] > 0.3 && luma(theme.danger) > 0.03) expect(hueGap(theme.danger, look.danger), id).toBeLessThan(0.08);
      const sig = [look.danger, look.line, look.ring, look.mind].map((c) => c.map((n) => n.toFixed(2)).join(',')).join('|');
      expect(seen.has(sig), id).toBe(false);
      seen.add(sig);
    }
  });

  it('gives every horror an element, and the dark ones are no longer near black', () => {
    const motifs = new Set(bosses.map((id) => lookOf(id).motif));
    expect(motifs.size).toBeGreaterThanOrEqual(11);
    for (const m of motifs) expect(AOE_MOTIFS).toContain(m);
    expect(luma(BOSS_ATTACK_THEME.black_man!.danger)).toBeLessThan(0.1);
    expect(luma(lookOf('black_man').danger)).toBeGreaterThan(0.4);
    expect(luma(BOSS_ATTACK_THEME.cthulhu!.danger)).toBeLessThan(0.25);
    expect(luma(lookOf('cthulhu').danger)).toBeGreaterThan(0.4);
  });

  it('an ordinary creature throws what it is made of, lifted too, and an unknown one stays plain', () => {
    expect(lookOf('deep_one').motif).toBe('tide');
    expect(lookOf('mi_go').motif).not.toBe('plain');
    expect(lookOf(undefined).motif).toBe('plain');
    expect(lookOf('not_a_creature').motif).toBe('plain');
    expect(luma(lookOf('deep_one').line)).toBeGreaterThanOrEqual(LIGHT_FLOOR - 0.01);
    expect(shotLook('cthulhu').color).toEqual(lookOf('cthulhu').line); // a bolt is drawn in the light the horror's other attacks use
  });
});
