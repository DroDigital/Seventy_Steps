import { describe, expect, it } from 'vitest';
import { BOSS_ATTACK_THEME } from '../src/data/bossAttackTheme';
import { AOE_MOTIFS, AOE_SKIN, aoeLook } from '../src/render/aoeLook';

const bosses = Object.keys(BOSS_ATTACK_THEME);

describe('area marks', () => {
  it('gives every scripted horror its own mark, and leaves an ordinary fighter plain', () => {
    expect(AOE_SKIN).toHaveLength(AOE_MOTIFS.length);
    expect(aoeLook(undefined).name).toBe('plain');
    expect(aoeLook('mi_go').name).toBe('plain');
    const seen = new Set<string>();
    const names = new Set<string>();
    for (const id of bosses) {
      const look = aoeLook(id);
      expect(look.name, id).not.toBe('plain');
      expect(look.motif).toBe(AOE_MOTIFS.indexOf(look.name));
      names.add(look.name);
      const sig = `${look.name}:${look.seed}:${look.freq}:${look.arms}`;
      expect(seen.has(sig), id).toBe(false);
      seen.add(sig);
    }
    expect(names.size).toBeGreaterThan(8);
    expect(aoeLook('cthulhu').name).toBe('tide');
    expect(aoeLook('yig').name).toBe('coil');
    expect(aoeLook('yog_sothoth').name).toBe('star');
    expect(aoeLook('haunter_of_the_dark').name).toBe('eye');
    expect(aoeLook('keziah_mason').name).toBe('flame');
    expect(aoeLook('shub_niggurath').name).toBe('root');
    expect(aoeLook('shoggoth').name).toBe('stain');
    expect(aoeLook('dr_munoz').name).toBe('frost');
    expect(aoeLook('dunwich_horror').name).toBe('crack');
    expect(aoeLook('flying_polyp').name).toBe('ash');
    expect(aoeLook('colour_out_of_space').name).toBe('spore');
    expect(aoeLook('hastur').name).toBe('glyph');
    expect(aoeLook('cthulhu').seed).not.toBe(aoeLook('father_dagon').seed);
  });
});
