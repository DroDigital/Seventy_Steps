import { describe, expect, it } from 'vitest';
import { ANOMALY } from '../src/render/palette';
import { shotLook } from '../src/render/shotLook';
import { ENTITIES } from '../src/data/registry';

const greenOrb = (id: string): boolean => {
  const look = shotLook(id);
  const c = look.color;
  return look.form === 'orb' && c[1] > 0.75 && c[1] > c[0] + 0.3 && c[0] < 0.4;
};

describe('shot looks', () => {
  it('keeps the void-green fireball for Yog-Sothoth, and gives the rest another shape or hue', () => {
    const green = ENTITIES.filter((e) => greenOrb(e.id)).map((e) => e.id);
    expect(green).toEqual(['yog_sothoth']);
    expect(shotLook('colour_out_of_space').form).toBe('orb');
    expect(shotLook('colour_out_of_space').color[0]).toBeGreaterThan(shotLook('colour_out_of_space').color[1]);
    const forms = new Set(['mi_go', 'yithian', 'dagon_priest', 'elder_thing', 'cthulhu_cultist', 'dhole', 'shoggoth'].map((id) => shotLook(id).form));
    expect(forms.size).toBeGreaterThan(2);
    expect(shotLook('dhole', true).form).toBe('drop');
    expect(shotLook('mi_go').color).not.toEqual(ANOMALY.green);
    expect(shotLook('yithian').color).not.toEqual(ANOMALY.green);
  });
});
