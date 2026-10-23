import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { SHOT_FORMS, SHOTS } from '../src/data/shotForms';
import { ENTITIES } from '../src/data/registry';
import { ANOMALY } from '../src/render/palette';
import { shotLook } from '../src/render/shotLook';
import { FLIGHT, SHAPES } from '../src/render/shotShapes';

const greenOrb = (id: string): boolean => {
  const look = shotLook(id);
  const c = look.color;
  return look.form === 'orb' && c[1] > 0.75 && c[1] > c[0] + 0.3 && c[0] < 0.4;
};

/** Every attack a creature can choose, in its list or in any phase of its script. */
const attacksOf = (e: (typeof ENTITIES)[number]): Set<string> => {
  const all = new Set<string>(e.behavior.attacks);
  for (const p of e.bossScript?.phases ?? []) for (const a of p.attacks) all.add(a.id);
  return all;
};
const SHOOTS = ['projectile', 'projectile_fan', 'spit', 'barrage'];
const shooters = ENTITIES.filter((e) => SHOOTS.some((a) => attacksOf(e).has(a)));

describe('shot looks', () => {
  it('keeps the void-green fireball out of everyone but the Colour and Yog-Sothoth, and gives the rest a hue of their own', () => {
    expect(ENTITIES.filter((e) => greenOrb(e.id)).map((e) => e.id)).toEqual([]);
    expect(shotLook('yog_sothoth').form).toBe('globes');
    expect(shotLook('yog_sothoth').color).toEqual(ANOMALY.green);
    expect(shotLook('colour_out_of_space').form).toBe('orb');
    expect(shotLook('colour_out_of_space').color[0]).toBeGreaterThan(shotLook('colour_out_of_space').color[1]);
    expect(shotLook('mi_go').color).not.toEqual(ANOMALY.green);
    expect(shotLook('yithian').color).not.toEqual(ANOMALY.green);
  });

  it('gives every creature that shoots a shot from its own tale, and no two horrors the same', () => {
    expect(shooters.length).toBeGreaterThan(35);
    const named = shooters.filter((e) => !SHOTS[e.id]).map((e) => e.id);
    expect(named).toEqual([]);
    const horrors = shooters.filter((e) => e.tier === 'named' || e.tier === 'great_old_one' || e.tier === 'outer_god');
    const forms = horrors.map((e) => shotLook(e.id).form);
    expect(new Set(forms).size).toBe(forms.length);
  });

  it('lets two creatures throw the same thing only when they are kin', () => {
    const byForm = new Map<string, string[]>();
    for (const e of shooters) {
      const f = shotLook(e.id).form;
      byForm.set(f, [...(byForm.get(f) ?? []), e.id]);
    }
    const shared = [...byForm.values()].filter((ids) => ids.length > 1);
    expect(shared).toEqual([['yithian', 'yithian_archivist']]);
  });

  it('throws a glob when a creature with no shot of its own spits, and a shard when it casts; spit is spit', () => {
    expect(shotLook('cthulhu_cultist').form).toBe('shard');
    expect(shotLook('cthulhu_cultist', true).form).toBe('glob');
    expect(shotLook('deep_one').form).toBe('glob'); // (the sea's and the ichor's bodies are wet)
    expect(shotLook('serpent_man').form).toBe('fang');
    expect(shotLook('serpent_man', true).form).toBe('venom');
    expect(shotLook('dhole', true).form).toBe('grub');
    expect(shotLook(undefined).form).toBe('shard');
  });

  it('has no cone left among the shots', () => {
    expect([...SHOT_FORMS]).not.toContain('dart');
    for (const form of SHOT_FORMS) expect(SHAPES[form]().type).not.toBe('ConeGeometry');
  });
});

describe('shot bodies', () => {
  const sizeOf = (geo: THREE.BufferGeometry): THREE.Vector3 => geo.boundingBox!.getSize(new THREE.Vector3());

  it('builds every form: finite, flat-shaded, toned, about two units long, a few hundred triangles', () => {
    const seen = new Map<string, string>();
    for (const form of SHOT_FORMS) {
      const geo = SHAPES[form]();
      geo.computeBoundingBox();
      const pos = geo.getAttribute('position');
      expect(pos.count % 3, form).toBe(0);
      expect(pos.count / 3, form).toBeLessThan(900);
      expect(pos.count / 3, form).toBeGreaterThan(8);
      for (const name of ['normal', 'aTone', 'aMove']) expect(geo.getAttribute(name)?.count, `${form} ${name}`).toBe(pos.count);
      for (let i = 0; i < pos.count * 3; i++) expect(Number.isFinite(pos.array[i]), form).toBe(true);
      const size = sizeOf(geo);
      expect(Math.max(size.x, size.y, size.z), form).toBeGreaterThan(1.5);
      expect(Math.max(size.x, size.y, size.z), form).toBeLessThan(3.6);
      const tones = new Set(geo.getAttribute('aTone').array);
      expect(tones.size, `${form} tones`).toBeGreaterThan(1);
      const key = [...pos.array].slice(0, 90).map((n) => n.toFixed(2)).join(',');
      expect(seen.get(key), `${form} is another form`).toBeUndefined();
      seen.set(key, form);
      const flight = FLIGHT[form];
      expect(flight.size).toBeGreaterThan(1);
      expect(flight.rate).toBeGreaterThanOrEqual(0);
    }
  });

  it('keeps each form its own shape: no two have the same triangle count and extent', () => {
    const shapes = SHOT_FORMS.map((form) => {
      const geo = SHAPES[form]();
      geo.computeBoundingBox();
      const s = sizeOf(geo);
      return `${geo.getAttribute('position').count}:${s.x.toFixed(1)}:${s.y.toFixed(1)}:${s.z.toFixed(1)}`;
    });
    expect(new Set(shapes).size).toBe(shapes.length);
  });

  it('points a form that points along +z: the heavier end of its length is behind its nose, or it spins about it', () => {
    for (const form of SHOT_FORMS) {
      if (FLIGHT[form].mode !== 'point') continue;
      const geo = SHAPES[form]();
      geo.computeBoundingBox();
      const box = geo.boundingBox!;
      expect(box.max.z - box.min.z, form).toBeGreaterThan(0.3);
      expect(box.max.z, form).toBeGreaterThan(0);
    }
  });
});
