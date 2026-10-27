/**
 * Each drawn creature's recolour to its realm (round 83; render/spriteTone.ts, shaders/spriteGrade.ts): a turn of hue the same for every
 * pixel of a form, so what it holds inside itself is kept, a lift of colour that never takes any away, a cast for a grey; and a reading
 * of it that is the same for every one of the 105 forms in every realm.
 */
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { LOOKS } from '../src/data/looks';
import { REVIEWED_MATTER } from '../src/data/reviewedLook';
import { FX } from '../src/data/tuning';
import type { Rgb } from '../src/render/palette';
import { gradeTints } from '../src/render/realmPalette';
import { arc, BOOST_MOST, chromaOf, OWN_FROM, OWN_TO, PLAIN, toneForForm, toneOf, type Tone } from '../src/render/spriteTone';
import { SPRITE_FRAG } from '../src/render/shaders/sprite';
import { createCreatureViews } from '../src/render/creatureViews';
import type { SpriteAtlas } from '../src/render/sprites/atlas';
import type { ReviewedEntity, ReviewedManifest } from '../src/render/sprites/reviewed';
import { worldUniforms } from '../src/render/worldMaterial';
import { spawnCreature } from '../src/systems/creatures';
import { createGame } from '../src/systems/game';

/** What the shader does to a colour's chroma. */
const apply = (c: Rgb, t: Tone): { angle: number; length: number } => {
  const p = chromaOf(c);
  const [x, y] = [(t.cos * p.x - t.sin * p.y) * t.boost, (t.sin * p.x + t.cos * p.y) * t.boost];
  return { angle: Math.atan2(y, x), length: Math.hypot(x, y) };
};
const REALM: Rgb = [0.4, 0.62, 1.2]; // a cold realm's mid-tone, at brightness 1 (luma about 0.7: scaled below)
const realm = (): Rgb => {
  const l = 0.2126 * REALM[0] + 0.7152 * REALM[1] + 0.0722 * REALM[2];
  return [REALM[0] / l, REALM[1] / l, REALM[2] / l];
};

describe('a form turned to its realm', () => {
  const sepia: Rgb = [0.5, 0.42, 0.3];
  const red: Rgb = [0.5, 0.2, 0.18];
  const green: Rgb = [0.25, 0.42, 0.2];

  it('is left as drawn at no share, and takes its hue the share of the way to the realm\'s at any other', () => {
    expect(toneOf(sepia, realm(), 0)).toEqual(PLAIN);
    const [from, to] = [chromaOf(sepia).angle, chromaOf(realm()).angle];
    for (const share of [0.3, 0.6, 1]) {
      const got = apply(sepia, toneOf(sepia, realm(), share)).angle;
      expect(arc(from, got)).toBeCloseTo(arc(from, to) * share, 5);
    }
    expect(arc(apply(sepia, toneOf(sepia, realm(), 1)).angle, to)).toBeCloseTo(0, 5);
  });

  it('keeps what the form holds inside itself: two of its colours stay as far apart in hue as they were, and in the same order', () => {
    const [a, b] = [chromaOf([0.45, 0.4, 0.3]), chromaOf([0.4, 0.42, 0.3])]; // a brown and an olive of one form
    const tone = toneOf([0.43, 0.41, 0.3], realm(), FX.spriteGrade);
    const [ta, tb] = [[a, tone], [b, tone]].map(([p, t]) => {
      const q = p as typeof a;
      const k = t as Tone;
      return Math.atan2(k.sin * q.x + k.cos * q.y, k.cos * q.x - k.sin * q.y);
    });
    expect(arc(tb, ta)).toBeCloseTo(arc(b.angle, a.angle), 5);
  });

  it('keeps different forms apart: a sepia and a slate stay as far from one another as the share left them', () => {
    const share = 0.6; // (a strong red would be held as drawn: below)
    const slate: Rgb = [0.3, 0.4, 0.5]; // (not the sepia's exact opposite about the greys, where the arc is no longer a test)
    const [a, b] = [apply(sepia, toneOf(sepia, realm(), share)).angle, apply(slate, toneOf(slate, realm(), share)).angle];
    const before = Math.abs(arc(chromaOf(slate).angle, chromaOf(sepia).angle));
    expect(Math.abs(arc(b, a))).toBeGreaterThan(0.25 * before); // never one colour
    expect(Math.abs(arc(b, a))).toBeLessThan(before + 1e-9); // and never farther apart than they were drawn
  });

  it('lifts a dull form\'s colour toward the realm\'s, never past the cap, and never takes any from a vivid one', () => {
    const dull = toneOf([0.46, 0.44, 0.41], realm(), 0.8);
    expect(dull.boost).toBeGreaterThan(1);
    expect(dull.boost).toBeLessThanOrEqual(BOOST_MOST);
    const vivid = toneOf([0.9, 0.1, 0.05], realm(), 0.8);
    expect(vivid.boost).toBe(1);
    for (const f of [sepia, red, green]) {
      for (const share of [0.2, 0.7, 1]) expect(apply(f, toneOf(f, realm(), share)).length).toBeGreaterThanOrEqual(chromaOf(f).length - 1e-9);
    }
  });

  it('gives a grey the realm\'s colour and leaves its hue alone', () => {
    const grey = toneOf([0.4, 0.4, 0.4], realm(), 0.7);
    expect(grey.cos).toBeCloseTo(1, 6);
    expect(grey.sin).toBeCloseTo(0, 6);
    expect(grey.fill).toBeGreaterThan(0.05);
    expect(toneOf(red, realm(), 0.7).fill).toBe(0);
  });
});

const strength = (c: Rgb): number => chromaOf(c).length / Math.max(0.05, 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]);

it('renders the new Azathoth palette unchanged in every realm, while other creatures keep their existing grading', () => {
  const matter = REVIEWED_MATTER as Record<string, Rgb>;
  const originalMatter = matter.azathoth;
  const tint = worldUniforms.uSpriteTints.value[2] as THREE.Vector3;
  const originalTint = tint.clone();
  const originalGrade = worldUniforms.uSpriteGrade.value;
  const view = (): ReviewedEntity['directions']['front'] => ({ sourceDirection: 'front', mirror: false, actions: { idle: [0], move: [0], attack: [0], hurt: [0] } });
  const sampler = (key: 'azathoth' | 'deep_one'): (() => number[]) => {
    const entity: ReviewedEntity = { id: key, name: key, assetGroup: key === 'azathoth' ? 'bosses' : 'sprites', scale: 2, scaleUnit: 'metres', page: 0, directions: { front: view(), back: view(), left: view(), right: view() } };
    const manifest: ReviewedManifest = { format: 'seventy-steps-reviewed-atlas-v1', entityCount: 1, frameCount: 1, pages: [{ file: 'p.png', width: 128, height: 128, sha256: '' }], frames: [{ source: 'frame.png', sourceSha256: '', pixelSha256: '', width: 64, height: 64, bounds: [8, 4, 56, 62], page: 0, x: 0, y: 0 }], entities: { [key]: entity } };
    const atlas: SpriteAtlas = { width: 64, height: 64, data: new Uint8Array(64 * 64 * 4), frames: new Map(), eyes: new Float32Array(4), eyeColors: new Float32Array(3), reviewed: { manifest, pages: [{} as HTMLImageElement] } };
    const game = createGame(), scene = new THREE.Scene(), views = createCreatureViews(scene, game, atlas);
    spawnCreature(game, key, { x: 0, z: -9, yaw: 0 });
    const mesh = scene.children.find(child => (child as THREE.InstancedMesh<THREE.PlaneGeometry, THREE.ShaderMaterial>).material?.uniforms?.uReviewed?.value === 1) as THREE.InstancedMesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
    return () => {
      views.update(1, 1, new THREE.PerspectiveCamera());
      expect(views.debugFrames().map(frame => frame.key)).toEqual([key]);
      const a = mesh.geometry.getAttribute('aTone');
      return [a.getX(0), a.getY(0), a.getZ(0), a.getW(0)];
    };
  };
  try {
    matter.azathoth = [0.252, 0.151, 0.282]; // measured from the delivered front idle, whose strength is in the automatic partial-hold band
    worldUniforms.uSpriteGrade.value = 1;
    const azathothTone = sampler('azathoth'), deepOneTone = sampler('deep_one');
    for (const id of Object.keys(LOOKS)) {
      const mid = gradeTints(LOOKS[id])[2] as Rgb;
      tint.set(...mid);
      expect(azathothTone(), id).toEqual([1, 0, 1, 0]);
      const expected = toneOf(matter.deep_one, mid, 1);
      const actual = deepOneTone();
      [expected.cos, expected.sin, expected.boost, expected.fill].forEach((v, i) => expect(actual[i], `${id} deep_one component ${i}`).toBeCloseTo(v, 6));
    }
  } finally {
    matter.azathoth = originalMatter;
    tint.copy(originalTint);
    worldUniforms.uSpriteGrade.value = originalGrade;
  }
});

describe('a form drawn in a strong colour keeps it (round 93: the Zoog was turned purple in the Dreamlands)', () => {
  const STRONG = ['zoog', 'wamp', 'man_of_leng', 'wilbur_whateley', 'brown_jenkin', 'hastur', 'azathoth', 'ghatanothoa']; // the rust, orange and gold forms and the purples: what the author drew them in (a table to review when the art is redrawn: round 92 left Shub-Niggurath grey)
  const vivid: Rgb = [0.5, 0.2, 0.18];

  it('is not turned toward any realm at any share, and a dull form still is', () => {
    expect(strength(vivid)).toBeGreaterThan(OWN_TO);
    for (const share of [0.3, 0.7, 1]) {
      const held = toneOf(vivid, realm(), share);
      expect(held.sin).toBeCloseTo(0, 6);
      expect(held.cos).toBeCloseTo(1, 6);
    }
    const sepia: Rgb = [0.5, 0.42, 0.3];
    expect(strength(sepia)).toBeLessThan(OWN_FROM);
    expect(Math.abs(toneOf(sepia, realm(), 0.7).sin)).toBeGreaterThan(0.2);
  });

  it('holds the named forms in every realm: no turn, no lift, no cast', () => {
    for (const key of STRONG) {
      const form = REVIEWED_MATTER[key] as Rgb;
      if (key !== 'azathoth') expect(strength(form), key).toBeGreaterThan(OWN_TO);
      for (const id of Object.keys(LOOKS)) {
        const t = toneForForm(key, form, gradeTints(LOOKS[id])[2] as Rgb, FX.spriteGrade);
        expect(Math.abs(t.sin), `${key} in ${id}`).toBeLessThan(0.02);
        expect(t.boost, `${key} in ${id}`).toBe(1);
        expect(t.fill, `${key} in ${id}`).toBe(0);
      }
    }
  });

  it('holds exactly those forms, and no form is part held: every form is dull enough to be turned, or strong enough to be held', () => {
    const held = Object.keys(REVIEWED_MATTER).filter((k) => k === 'azathoth' || strength(REVIEWED_MATTER[k] as Rgb) >= OWN_TO);
    expect(held.sort()).toEqual([...STRONG].sort()); // (a form redrawn into the band, or across it, is a decision: say whether it keeps its colour)
    for (const key of Object.keys(REVIEWED_MATTER)) {
      const k = strength(REVIEWED_MATTER[key] as Rgb);
      expect(key === 'azathoth' || k <= OWN_FROM || k >= OWN_TO, `${key} (${k.toFixed(3)}) is in the band ${OWN_FROM} to ${OWN_TO}`).toBe(true);
    }
  });

  it('leaves the older art\'s sepia forms to take their realm, in the realm the Zoog stands in as in the rest', () => {
    const mid = gradeTints(LOOKS.dreamlands)[2] as Rgb;
    for (const key of ['ghoul', 'moon_beast', 'ghast', 'hypnos']) {
      const form = REVIEWED_MATTER[key] as Rgb;
      expect(strength(form), key).toBeLessThan(OWN_FROM);
      expect(Math.abs(toneOf(form, mid, FX.spriteGrade).sin), key).toBeGreaterThan(0.3);
    }
  });
});

describe('every form in every realm', () => {
  it('is a finite, bounded recolour', () => {
    const keys = Object.keys(REVIEWED_MATTER);
    expect(keys.length).toBe(105);
    for (const id of Object.keys(LOOKS)) {
      const mid = gradeTints(LOOKS[id])[2] as Rgb;
      for (const key of keys) {
        const t = toneOf(REVIEWED_MATTER[key] as Rgb, mid, FX.spriteGrade);
        expect(Number.isFinite(t.cos + t.sin + t.boost + t.fill), `${id} ${key}`).toBe(true);
        expect(t.cos * t.cos + t.sin * t.sin).toBeCloseTo(1, 6);
        expect(t.boost).toBeGreaterThanOrEqual(1);
        expect(t.boost).toBeLessThanOrEqual(BOOST_MOST);
        expect(t.fill).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('puts the forms of one realm closer to it than they were, and not on top of one another', () => {
    const id = Object.keys(LOOKS)[3];
    const mid = gradeTints(LOOKS[id])[2] as Rgb;
    const to = chromaOf(mid).angle;
    let nearer = 0;
    const after = new Set<number>();
    for (const key of Object.keys(REVIEWED_MATTER)) {
      const form = REVIEWED_MATTER[key] as Rgb;
      if (chromaOf(form).length / Math.max(0.05, 0.2126 * form[0] + 0.7152 * form[1] + 0.0722 * form[2]) < 0.1) continue; // (a grey has no hue to turn)
      const got = apply(form, toneOf(form, mid, FX.spriteGrade)).angle;
      if (Math.abs(arc(got, to)) <= Math.abs(arc(chromaOf(form).angle, to)) + 1e-9) nearer++;
      after.add(Math.round(got * 20));
    }
    expect(nearer).toBeGreaterThan(30);
    expect(after.size).toBeGreaterThan(4);
  });
});

describe('the shader\'s side of it', () => {
  it('is handed the form\'s tone at each pixel, and a form with none is drawn as it is', () => {
    const src = SPRITE_FRAG.replace(/\s+/g, ' ');
    expect(src).toContain('spriteGraded(col, vTone)');
  });
});
