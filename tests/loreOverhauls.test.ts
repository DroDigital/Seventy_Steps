/**
 * Nug, Yeb and Shub-Niggurath drawn again whole (round 92: the author's `Seventy-Steps-Nug-Yeb-Shub-Lore-Overhauls-Full` zip, 93 PNGs),
 * put in by `tools/replace_reviewed_sprite.py --all`: what is registered for each, each frame the delivery's own (its manifest's hashes),
 * the standing rule that attack and hurt are front art only (Shub-Niggurath's left and back combat went with the old drawing), her stoop
 * and its halfway pose drawn in place, what the renderer adds to the art (no eye for Yeb: the old one had), and the hurtboxes fitted to the bodies.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { getEntity } from '../src/data/registry';
import { REVIEWED_BODY, REVIEWED_EYES, REVIEWED_GLINTS } from '../src/data/reviewedLook';
import { zoneShapes } from '../src/data/assemblyShape';
import type { ReviewedManifest } from '../src/render/sprites/reviewed';
import { bodyOf, reachOf, toCombatant } from '../src/systems/creatures';
import { crop, pngRgba } from './reviewedPackHelpers';

const ASSET_DIR = 'public/creatures/reviewed';
const pack = JSON.parse(readFileSync(`${ASSET_DIR}/index.json`, 'utf8')) as ReviewedManifest & { frames: { sourceSha256: string; page: number; x: number; y: number; width: number; height: number }[] };
const ACTIONS = ['idle', 'move', 'attack', 'hurt', 'stoop', 'stoop_mid'] as const;

/** Per creature: its frames per view as delivered, front [idle, move, attack, hurt], the sides and back [idle, move]; the delivery manifest's hash of its front idle_0 and of its last left walk frame, and one over the hashes of all its frames (front, left, back; each action in order). */
const DELIVERED: [key: string, canvas: number, front: number[], side: number[], idle0: string, lastWalk: string, all: string][] = [
  ['nug', 64, [2, 4, 3, 2], [2, 4], 'c75b7d8bf40c94107a3601396a5ecfd1227fb4f9cfe08da199c8289541ccd7bc', '03bfd56818d896497509c36845a98bb671babbfb2db45d1bef80bdb0be3c7855', '092c8e25160b4c326a3c0809f26915a6c70392165cf8a01dd95a9c0d080e3d9f'],
  ['yeb', 64, [2, 4, 3, 2], [2, 4], '32991ff3f56ac8094ffd525b32fe49594b7b3da89063ada535a20829ff1fa576', 'e43c971f45df46a0aa44de2ab08109189dd09f520892d54cfaed9fc5852a0d29', '3d1c3653164966f906888eeed3f6d364890e40ceb997a971e192a966008611c5'],
  ['shub_niggurath', 128, [2, 4, 4, 4], [2, 4], 'd6249cbf3cb07621a10ac3fabad98d03b537de8f4bdad60a24aaa9586fbe2885', 'c35018ee66a638f6b2da5527358cb931a777184e185244f712f9ef9913f81feb', '2e61ea2dd65f4705616ed2590034a07cfe6e8871e880e016de12ec01398f8de7'],
];
/** Her stoop as delivered: the bow, the hold and the halfway pose, the last the very drawing of her attack_2. */
const STOOP = ['cf9059ad5733d93101f292ac2e02f63e5f6872122fb05d98e23d2f7b0222bfc4', 'fd05487d9212edc7b0a0e6edc1e03d188c5924e88251fec42edbb689ebbe4aa8', 'ad136c54f1df7e039d6596c221b1730d914d9bda14dee2f29772000a860fb842'];

const hashes = (key: string, directions: readonly ('front' | 'left' | 'back')[]): string[] => directions.flatMap((d) => ACTIONS.flatMap((a) => (pack.entities[key].directions[d].actions[a] ?? []).map((id) => pack.frames[id].sourceSha256)));

describe('Nug, Yeb and Shub-Niggurath drawn again in round 92', () => {
  it('are the delivery\'s own frames, in the counts it drew: idle and a four-frame walk in all four views, attack and hurt from the front', () => {
    expect(DELIVERED).toHaveLength(3);
    for (const [key, canvas, front, side, idle0, lastWalk, all] of DELIVERED) {
      const views = pack.entities[key].directions;
      const counts = (view: typeof views.front, actions: ('idle' | 'move' | 'attack' | 'hurt')[]): number[] => actions.map((a) => view.actions[a]?.length ?? 0);
      expect(counts(views.front, ['idle', 'move', 'attack', 'hurt']), `${key} front`).toEqual(front);
      for (const d of ['left', 'back', 'right'] as const) expect(counts(views[d], ['idle', 'move']), `${key} ${d}`).toEqual(side);
      expect(pack.frames[views.front.actions.idle![0]].sourceSha256, key).toBe(idle0);
      expect(pack.frames[views.left.actions.move!.at(-1)!].sourceSha256, key).toBe(lastWalk);
      expect(createHash('sha256').update(new TextEncoder().encode(hashes(key, ['front', 'left', 'back']).join('\n'))).digest('hex'), `${key}: every frame, against the delivery's manifest`).toBe(all);
      for (const view of Object.values(views)) for (const ids of Object.values(view.actions)) for (const id of ids) expect([pack.frames[id].width, pack.frames[id].height], key).toEqual([canvas, canvas]);
    }
  });

  it('stand on the ground line the delivery drew them on: row 62 on a 64 px canvas for the twins, row 125 (the sides 124) on Shub-Niggurath\'s 128', () => {
    for (const [key] of DELIVERED) {
      for (const [direction, view] of Object.entries(pack.entities[key].directions)) {
        if (view.mirror) continue; // (a mirrored view draws its source's frames)
        for (const [action, ids] of Object.entries(view.actions)) for (const id of ids) {
          const want = key === 'shub_niggurath' ? (direction === 'left' ? 124 : 125) : 62;
          expect(pack.frames[id].bounds[3], `${key}/${direction}/${action}`).toBe(want);
        }
      }
    }
  });

  it('have their right as their left turned round, as drawn (Yeb\'s and Shub-Niggurath\'s own right views are gone)', () => {
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
      const sources = pack.frames as unknown as { source: string }[];
      expect(sources.filter((f) => new RegExp(`/${key}/[^/]+/(left|right|back)/(attack|hurt)_`).test(f.source)), key).toEqual([]);
    }
  });

  it('bring Shub-Niggurath\'s bow, hold and halfway pose, drawn in place on the pages they were on: the halfway pose her attack_2 again', () => {
    const front = pack.entities.shub_niggurath.directions.front.actions;
    expect(front.stoop!.map((id) => pack.frames[id].sourceSha256)).toEqual(STOOP.slice(0, 2));
    expect(front.stoop_mid!.map((id) => pack.frames[id].sourceSha256)).toEqual([STOOP[2]]);
    expect(pack.frames[front.attack![2]].sourceSha256).toBe(STOOP[2]); // the delivery's own choice (art/shub_niggurath/STOOP-MID-DECISION.json): one drawing, two poses
    expect(front.stoop!.map((id) => pack.frames[id].page)).toEqual([4, 4]);
    expect(pack.frames[front.stoop_mid![0]].page).toBe(5);
    for (const other of ['nug', 'yeb']) expect(Object.keys(pack.entities[other].directions.front.actions).sort(), other).toEqual(['attack', 'hurt', 'idle', 'move']);
  });

  it('give none of them an eye or a mark that stays lit in the dark: the old Yeb\'s one pale eye is gone, and the colour its new frames repeat is a highlight along its limbs', () => {
    for (const key of ['nug', 'yeb', 'shub_niggurath']) {
      expect(REVIEWED_EYES[key], key).toBeUndefined();
      expect(REVIEWED_GLINTS[key], key).toBeUndefined();
    }
  });
});

describe('their hurtboxes, fitted to the new bodies', () => {
  const pages = pack.pages.map((page) => pngRgba(readFileSync(`${ASSET_DIR}/${page.file}`)));
  /** The 85th percentile of the painted pixels' distance from the billboard's middle over the idle frames of the front, the side and the back, metres, as the round 56 test measures it. */
  function painted(key: string, scale: number): number {
    const spread: number[] = [];
    for (const direction of ['front', 'left', 'back'] as const) for (const id of pack.entities[key].directions[direction].actions.idle!) {
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
  /** The tallest painted idle across the front, the side and the back, metres. */
  function paintedHeight(key: string, scale: number): number {
    let tall = 0;
    for (const direction of ['front', 'left', 'back'] as const) for (const id of pack.entities[key].directions[direction].actions.idle!) {
      const frame = pack.frames[id];
      tall = Math.max(tall, ((frame.bounds[3] - frame.bounds[1]) * scale) / frame.height);
    }
    return tall;
  }

  it('strike Nug and Yeb as wide and as high as they are drawn (the old capsules were sized for the heaps of stone they were), their blows still scaled by the height they were balanced at', () => {
    for (const key of ['nug', 'yeb']) {
      const def = getEntity(key)!;
      const body = bodyOf(def);
      expect(body.radius / painted(key, def.sprite!.scale), `${key} width`).toBeGreaterThan(0.9);
      expect(body.radius / painted(key, def.sprite!.scale), `${key} width`).toBeLessThan(1.1);
      expect(body.height / paintedHeight(key, def.sprite!.scale), `${key} height`).toBeGreaterThan(0.97);
      expect(body.height / paintedHeight(key, def.sprite!.scale), `${key} height`).toBeLessThan(1.03);
      expect(reachOf(def), key).toBeCloseTo(def.sprite!.scale * 0.7, 9); // a blob's 4.9 m: what their blows are scaled by
      expect(toCombatant(def).reach, key).toBeCloseTo(4.9, 9);
    }
  });

  it('strike Shub-Niggurath within the same mound as before, which her new picture fills: its zones are at least as wide as the body painted in each of their bands', () => {
    const def = getEntity('shub_niggurath')!;
    const { radius, height } = bodyOf(def);
    expect([radius, height]).toEqual([9, 18]);
    const zones = zoneShapes(def.assembly, radius, height, 1, false)!;
    zones.forEach((zone, band) => expect(zone.r, `band ${band}`).toBeGreaterThanOrEqual(REVIEWED_BODY.shub_niggurath[band] * height));
    // the painted height is the registered scale (a boss's picture is drawn so its idle stands as tall as its scale), so no more than the body's height
    const front = pack.frames[pack.entities.shub_niggurath.directions.front.actions.idle![0]];
    expect(pack.entities.shub_niggurath.scale).toBe(18);
    expect(front.bounds[3] - front.bounds[1]).toBe(109); // the crown reaches 18 m: the capsule's own top
  });
});
