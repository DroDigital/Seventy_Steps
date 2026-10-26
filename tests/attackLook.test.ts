import { describe, expect, it } from 'vitest';
import { BOSS_ATTACK_THEME } from '../src/data/bossAttackTheme';
import { AOE_MOTIFS } from '../src/render/aoeLook';
import { FOE_BLOWS } from '../src/data/foeBlows';
import { createGame } from '../src/systems/game';
import { DANGER_FLOOR, LIGHT_FLOOR, isQuiet, isThemed, lift, lookOf } from '../src/render/attackLook';
import { hsvToRgb, luma, mixRgb, rgbToHsv, rotateHue, type Rgb } from '../src/render/palette';
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

  it('two horrors of one element are tempered differently, the same each time, within bounds', () => {
    const punches = new Set<number>();
    for (const id of bosses) {
      const look = lookOf(id);
      expect(look.punch, id).toBeGreaterThanOrEqual(0.85);
      expect(look.punch, id).toBeLessThanOrEqual(1.2);
      expect(look.twist, id).toBeGreaterThanOrEqual(0.6);
      expect(look.twist, id).toBeLessThanOrEqual(1.5);
      expect(look.pitch, id).toBeGreaterThanOrEqual(0.92);
      expect(look.pitch, id).toBeLessThanOrEqual(1.08);
      punches.add(look.punch);
    }
    expect(punches.size).toBeGreaterThan(bosses.length * 0.8);
    expect(lookOf('keziah_mason').punch).toBe(lookOf('keziah_mason').punch);
    expect(lookOf(undefined).punch).toBe(1);
    expect(lookOf(undefined).pitch).toBe(1);
  });
});

const rgbOf = (hex: number): Rgb => [((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255];

describe('a creature drawn as a mark has the colours of its blow (round 88)', () => {
  it('turns a hue about the wheel, keeping its saturation and brightness, and leaves a grey alone', () => {
    expect(hsvToRgb(0, 1, 1)).toEqual([1, 0, 0]);
    expect(hsvToRgb(1 / 3, 1, 1)[1]).toBeCloseTo(1, 6);
    expect(hsvToRgb(-2 / 3, 1, 1)[1]).toBeCloseTo(1, 6); // (the hue wraps)
    const c: Rgb = [0.8, 0.4, 0.2];
    const [h, s, v] = rgbToHsv(c);
    const turned = rotateHue(c, 40 / 360);
    expect(rgbToHsv(turned)[1]).toBeCloseTo(s, 5);
    expect(rgbToHsv(turned)[2]).toBeCloseTo(v, 5);
    expect(hueGap(turned, c)).toBeCloseTo(40 / 360, 4);
    expect(h).toBeGreaterThanOrEqual(0);
    expect(rotateHue([0.5, 0.5, 0.5], 0.3)).toEqual([0.5, 0.5, 0.5]);
    for (const x of [0.1, 0.4, 0.7]) for (const y of [0, 0.2, 0.9]) for (const out of [rotateHue([x, y, 0.5], 0.17)]) for (const n of out) expect(n >= -1e-9 && n <= 1 + 1e-9).toBe(true);
  });

  it('every creature with a blow takes its accent, line, danger, ring and mind from the blow\'s three hues, lifted, and throws no signature', () => {
    expect(Object.keys(FOE_BLOWS).length).toBeGreaterThanOrEqual(3);
    for (const [id, blow] of Object.entries(FOE_BLOWS)) {
      const look = lookOf(id);
      const [h0, h1, h2] = blow.hues.map(rgbOf) as [Rgb, Rgb, Rgb];
      expect(look.sig, id).toBeNull();
      expect(look.accent, id).toEqual(lift(h0, LIGHT_FLOOR));
      expect(look.line, id).toEqual(lift(mixRgb(h0, h1, 0.35), LIGHT_FLOOR));
      expect(look.danger, id).toEqual(lift(h1, DANGER_FLOOR));
      expect(look.ring, id).toEqual(lift(mixRgb(h1, h2, 0.4), DANGER_FLOOR));
      expect(look.mind, id).toEqual(lift(rotateHue(h1, 40 / 360), DANGER_FLOOR));
      expect(luma(look.accent), id).toBeGreaterThanOrEqual(LIGHT_FLOOR - 1e-6);
      expect(luma(look.line), id).toBeGreaterThanOrEqual(LIGHT_FLOOR - 1e-6);
      expect(luma(look.danger), id).toBeGreaterThanOrEqual(DANGER_FLOOR - 1e-6);
      expect(luma(look.mind), id).toBeGreaterThanOrEqual(DANGER_FLOOR - 1e-6);
      expect(luma(look.core), id).toBeGreaterThan(luma(look.line) - 0.01);
      if (rgbToHsv(h1)[1] > 0.3) expect(hueGap(look.mind, look.danger), `${id}: the mind's hue is the middle hue's neighbour`).toBeGreaterThan(0.05);
    }
  });

  it('their element, temper and sounds are what they were: only the colours and the signature are new', () => {
    expect(lookOf('deep_one')).toMatchObject({ motif: 'tide', punch: 0.9652941176470587, twist: 0.9529411764705882, pitch: 0.9620392156862746 });
    expect(lookOf('ghoul')).toMatchObject({ motif: 'spore', punch: 1.0998039215686275, twist: 0.7094117647058823, pitch: 0.9563921568627451 });
    expect(lookOf('dagon_priest')).toMatchObject({ motif: 'tide', punch: 0.9049019607843137, twist: 1.351764705882353, pitch: 1.039843137254902 });
  });

  it('a horror has no blow of its own and keeps its signature and colours; an unknown id is plain', () => {
    for (const id of bosses) {
      expect(FOE_BLOWS[id], id).toBeUndefined();
      expect(isThemed(id), id).toBe(true);
    }
    expect(lookOf('cthulhu').sig).not.toBeNull();
    expect(lookOf('cthulhu').ink).toEqual(BOSS_ATTACK_THEME.cthulhu!.danger);
    expect(lookOf('not_a_creature').sig).toBeNull();
    expect(lookOf('not_a_creature').motif).toBe('plain');
  });

  it('the creatures of the roster that are not horrors are the quiet ones; a horror and the investigator are not', () => {
    const g = createGame({ creature: 'ghoul' });
    const c = g.ecs.c;
    const foe = [...c.actor.keys()].find((k) => k !== g.player.id && c.dread.has(k))!;
    expect(isQuiet(g, foe)).toBe(true);
    expect(isQuiet(g, g.player.id)).toBe(false);
    const dummy = [...c.actor.keys()].find((k) => c.combatant.get(k)?.name === 'Training Dummy')!;
    expect(isQuiet(g, dummy)).toBe(false);
  });
});
