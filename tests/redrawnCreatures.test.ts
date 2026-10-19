/**
 * The sixteen creatures the author drew again in round 56 (the 'Repairs v4' delivery, put in by tools/replace_reviewed_sprite.py):
 * what is registered for each, the standing rule that attack and hurt are front art only, and the hurtboxes fitted to the new bodies.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { getEntity, variantOf } from '../src/data/registry';
import type { ReviewedManifest } from '../src/render/sprites/reviewed';
import { bodyOf, reachOf, toCombatant } from '../src/systems/creatures';
import { crop, pngRgba } from './reviewedPackHelpers';

const ASSET_DIR = 'public/creatures/reviewed';
const pack = JSON.parse(readFileSync(`${ASSET_DIR}/index.json`, 'utf8')) as ReviewedManifest & { frames: { sourceSha256: string; page: number; x: number; y: number; width: number; height: number }[] };

/** Frames per view as delivered: front [idle, move, attack, hurt], the sides [idle, move], back [idle, move]; the delivery's own front idle_0 and last left walk frame. */
const DELIVERED: [key: string, front: number[], side: number[], back: number[], idle0: string, lastWalk: string][] = [
  ['yig', [2, 6, 3, 2], [2, 6], [2, 4], '61e8c07acf90c25d86084c6491403347f230afcf7b423487813e2c5eb94e33b5', '34e0ddc289bd95af1e75af669f01f99b1c82033b13fcb584f22f843462ca39b5'],
  ['haunter_of_the_dark', [2, 8, 3, 2], [2, 8], [2, 8], 'f1318091d93c3df46f56f0686641d17a7dca15109d9023416bd074a6f8730dfe', 'cf5f61613d3ef211e993f246426d6d25db489aa9e9c55aaf27192883e79af700'],
  ['high_priest#eldritch', [2, 6, 3, 2], [2, 6], [2, 6], '53af28d4e09f9159a36675f28109cafa82ce0f4307e9bee92291ac1006aba9c4', '47c6ee7e9e1141ec4368a9532748532c14267214b5740c4dbc161c8c3ce216f9'],
  ['rhan_tegoth', [2, 6, 3, 2], [2, 6], [2, 6], 'e01e3319c57f21a326df56ecdab2098b82ece12e2539203d5355c72dc8c768c5', '38c428ad56c4f61a6e0501b0283513264815e35dddce976e842d5cb1e486f9eb'],
  ['dhole', [2, 6, 3, 2], [2, 6], [2, 6], '096a217168112b26a153483857ee496ab9aa9b18098a111ed31bd3ec98a91e83', 'e1b9a665e362751d1f5ca9dca8ffbdec3379cea18c9f3fccf7433317b698f540'],
  ['yog_sothoth', [2, 4, 3, 2], [2, 4], [2, 4], '04d18205368960fb89f59c47c1741ae93627a400b9eef3bf5fd771f1709688c6', '82ca69c3f5063946acbc8738631251cd34c76e223eebc6ac286acad2bcc101b2'],
  ['man_of_leng', [4, 4, 4, 4], [4, 6], [4, 4], 'f7bfd9788a03305703a8310f89158b923ea16359e41451df5bd33af83dc5e005', 'f8a00063a9b22511b8ec475b15b49c2b9a98b4756d7a7e3a81c018c6f2eb288d'],
  ['serpent_man', [2, 4, 3, 2], [2, 4], [2, 4], 'c07e19d2be39642bd3cf058ff59ff88e8cf8c81b87b2d8aef62946799fc14c67', '604cf60a628b726cb0cd3849b909ad92cc2134eb5cae58bc3f9bc00c8d569e02'],
  ['flying_polyp', [2, 6, 3, 2], [2, 6], [2, 6], '4afd0918220e7fb38f9a81e5fbb4b5544fd92eb675c93a0d246621fa463bc0db', '8cdac2c0b60e6e3d781051110dd5d84d7cad45b97c30283303afb5b0905894d7'],
  ['ym_bhi', [2, 6, 3, 2], [2, 4], [2, 6], '82bbc8ea81e01f28d89fc9b2130c9cc4696bf8f152f6b0fef7f83045250f681d', 'e9caae64f02900c44a2db114f5961742172f10b9aa4d3ea433de77b04061f30a'],
  ['daemon_pipers', [2, 6, 3, 2], [2, 6], [2, 6], '1d0a843ef4ecbc3ff971c9092790ffdf1dda4b8a7947a456688d64a1bef94b02', '0127da4df5e28862087cba28505602aed6b51175fdaf116384c2fb254ec48858'],
  ['other_gods', [2, 4, 3, 2], [2, 4], [2, 4], '6482b324386a797bfe8b32fe493e2fc9777ff0ec64e25e6dd112f6a66ce6f62c', '0bc61f9dbae581f9af1da66278665ac5762acd403dca821edbc91ce0a4aafdad'],
  ['lilith', [2, 6, 3, 2], [2, 4], [2, 6], '33ce248cddd01521df31c0c08bb57d883035ca466e1ed6e122c393e461b21fa9', 'f7fa2948458753db0ad3099cc4344e4d9e79c1228f4ae4f667d564fab273d83a'],
  ['being_of_ib', [2, 6, 3, 2], [2, 6], [2, 6], 'b755af0d58868c8e3d389957a7e2527de2dfdb6fdbd42f081299ef9074bdd30f', 'f8f897781c5268e3aad0763ed3d965614e2e52382c93f5e8fd8b60ab38be9282'],
  ['shunned_house_entity', [2, 4, 3, 2], [2, 4], [2, 4], 'ef4279f8082397ea1c0176c9015736beb65870734d50dfca1e71158518478813', '9d11ce299080ab7c7a6a751f88dda653f84bf2e74be1d1e37aebd084787a0163'],
  ['great_ones', [2, 6, 3, 2], [2, 6], [2, 6], 'b6abdd2e00e4e15ce867b0ccd3bfb83384b69b0e6e755d36f2b575d0d3d8518d', '0e41b32e53c4c32c74679cd8054ddfc22eb528e89325b7342d7ef67ee03b2814'],
];

describe('the sixteen creatures drawn again in round 56', () => {
  it('are the delivery\'s own frames, in the counts it drew: idle and walk in all four views, attack and hurt from the front', () => {
    expect(DELIVERED).toHaveLength(16);
    for (const [key, front, side, back, idle0, lastWalk] of DELIVERED) {
      const views = pack.entities[key].directions;
      const counts = (view: typeof views.front, actions: ('idle' | 'move' | 'attack' | 'hurt')[]): number[] => actions.map((a) => view.actions[a]?.length ?? 0);
      expect(counts(views.front, ['idle', 'move', 'attack', 'hurt']), `${key} front`).toEqual(front);
      expect(counts(views.left, ['idle', 'move']), `${key} left`).toEqual(side);
      expect(counts(views.back, ['idle', 'move']), `${key} back`).toEqual(back);
      expect(pack.frames[views.front.actions.idle![0]].sourceSha256, key).toBe(idle0);
      expect(pack.frames[views.left.actions.move!.at(-1)!].sourceSha256, key).toBe(lastWalk);
      const canvas = key === 'yog_sothoth' ? 128 : 64;
      for (const view of Object.values(views)) for (const ids of Object.values(view.actions)) for (const id of ids) expect([pack.frames[id].width, pack.frames[id].height], key).toEqual([canvas, canvas]);
    }
  });

  it('have their right as their left turned round, as drawn', () => {
    for (const [key] of DELIVERED) {
      const { left, right } = pack.entities[key].directions;
      expect(right, key).toMatchObject({ sourceDirection: 'left', mirror: true });
      expect(right.actions, key).toEqual(left.actions);
    }
  });

  it('show attack and hurt from the front alone, whatever the side they are seen from: no left, right or back attack or hurt is in the pack for them', () => {
    for (const [key] of DELIVERED) {
      for (const direction of ['left', 'back', 'right'] as const) {
        expect(Object.keys(pack.entities[key].directions[direction].actions).sort(), `${key}/${direction}`).toEqual(['idle', 'move']);
      }
    }
    const sources = pack.frames as unknown as { source: string }[];
    for (const [key] of DELIVERED) {
      const folder = key.includes('#') ? `${key.split('#')[0]}/eldritch` : key;
      expect(sources.filter((f) => new RegExp(`/${folder}/[^/]+/(left|right|back)/(attack|hurt)_`).test(f.source)), key).toEqual([]);
    }
  });
});

describe('their hurtboxes, fitted to the new bodies', () => {
  const pages = pack.pages.map((page) => pngRgba(readFileSync(`${ASSET_DIR}/${page.file}`)));
  /** The 85th percentile of the painted pixels' distance from the billboard's middle, metres, over the idle frames of the front, the side and the back. */
  function painted(key: string, scale: number): number {
    const views = pack.entities[key].directions;
    const spread: number[] = [];
    for (const direction of ['front', 'left', 'back'] as const) for (const id of views[direction].actions.idle!) {
      const frame = pack.frames[id];
      const pixels = crop(frame, pages[frame.page]);
      const away: number[] = [];
      for (let y = 0; y < frame.height; y++) for (let x = 0; x < frame.width; x++) if (pixels[(y * frame.width + x) * 4 + 3]) away.push(Math.abs(x + 0.5 - frame.width / 2));
      away.sort((a, b) => a - b);
      const at = 0.85 * (away.length - 1);
      spread.push((away[Math.floor(at)] + (away[Math.ceil(at)] - away[Math.floor(at)]) * (at - Math.floor(at))) / (frame.width / scale));
    }
    return spread.reduce((a, b) => a + b, 0) / spread.length;
  }

  it('are as wide as the body they hold, within a quarter either way, and no body of a silhouette it does not wear', () => {
    for (const [key] of DELIVERED.filter(([k]) => k !== 'yog_sothoth')) {
      const [id, variant] = key.split('#');
      const def = variant ? variantOf(getEntity(id)!, variant as 'eldritch')! : getEntity(id)!;
      const ratio = bodyOf(def).radius / painted(key, def.sprite!.scale);
      expect(ratio, key).toBeGreaterThan(0.75);
      expect(ratio, key).toBeLessThan(1.35);
    }
    const chaos = variantOf(getEntity('nyarlathotep')!, 'eldritch')!; // the Crawling Chaos, round 56's other redraw
    expect(bodyOf(chaos).radius / painted('nyarlathotep#eldritch', chaos.sprite!.scale)).toBeGreaterThan(0.75);
    expect(bodyOf(chaos).radius / painted('nyarlathotep#eldritch', chaos.sprite!.scale)).toBeLessThan(1.35);
  });

  it('scale each one\'s blows by the height it was balanced at: a body fitted to the picture moves what is struck, not how far a blow reaches', () => {
    for (const [key] of DELIVERED.filter(([k]) => k !== 'yog_sothoth')) {
      const [id, variant] = key.split('#');
      const def = variant ? variantOf(getEntity(id)!, variant as 'eldritch')! : getEntity(id)!;
      if (!def.sprite?.body) continue;
      const bare = { ...def, sprite: { ...def.sprite, body: undefined } };
      expect(reachOf(def), key).toBeCloseTo(bodyOf(bare).height, 9);
      const made = toCombatant(def, variant as 'eldritch' | undefined);
      expect(made.reach ?? made.height, key).toBeCloseTo(bodyOf(bare).height, 9);
    }
  });

  it('stand as tall as they are drawn: Yig 4.6 m, the Dhole 4 m, the Shunned House 1.66 m', () => {
    for (const [id, tall] of [['yig', 4.6], ['dhole', 4.0], ['shunned_house_entity', 1.66]] as const) {
      expect(bodyOf(getEntity(id)!).height / tall, id).toBeGreaterThan(0.97);
      expect(bodyOf(getEntity(id)!).height / tall, id).toBeLessThan(1.03);
    }
    // Yig's blows are still scaled by 3 m: the same moves as before the capsule was fitted
    expect(toCombatant(getEntity('yig')!).reach).toBeCloseTo(3, 9);
  });

  it('give a variant that draws another silhouette no body fitted to the base\'s art (the Serpent Man\'s eldritch form is a serpent)', () => {
    const base = getEntity('serpent_man')!;
    const serpent = variantOf(base, 'eldritch')!;
    expect(serpent.sprite!.body).toBeUndefined();
    expect(bodyOf(serpent)).toEqual({ height: 2.2 * 0.5, radius: 2.2 * 0.25 });
    expect(bodyOf(base).radius).toBeCloseTo(2.2 * 0.12, 9); // the man keeps his
    expect(variantOf(getEntity('high_priest')!, 'eldritch')!.sprite!.body).toEqual([0.7, 0.23]); // one that brings its own keeps it
  });

  it('strike Yog-Sothoth at its seven painted spheres, the lowest standing on the ground', () => {
    const recipe = getEntity('yog_sothoth')!.assembly!;
    expect(recipe.hit).toHaveLength(7);
    // The lowest sphere stands on the ground, where a blade reaches it; the picture is let down by `sink` so its lowest sphere's foot, not the mist under it, is there.
    expect(Math.min(...recipe.hit!.map(([, up, size]) => up - size))).toBeCloseTo(0, 2);
    expect(recipe.sink).toBeCloseTo(0.077, 3);
    // Upper spheres above lower, the cluster no wider than the picture.
    const frame = pack.frames[pack.entities.yog_sothoth.directions.front.actions.idle![0]] as unknown as { bounds: number[]; width: number };
    const tall = frame.bounds[3] - frame.bounds[1];
    for (const [across] of recipe.hit!) expect(Math.abs(across) * tall).toBeLessThan((frame.bounds[2] - frame.bounds[0]) / 2);
  });
});
