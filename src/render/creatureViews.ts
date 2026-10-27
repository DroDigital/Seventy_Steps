/**
 * Draws roster creatures (models `creature:<id>[#variant]`): sprites as one instanced billboard
 * batch over the atlas, colossi as animated assemblies. A sprite's eyes (and glowing marks) wear a
 * faint halo that glows out of the dark when near enough (playtest round 8; the atlas knows where
 * they are in each frame). The sprite state and frame come from the
 * creature's current move; ambushers and burrowers stay unseen while hidden, invisible stalkers
 * show only while they strike, the unseen (the Dunwich Horror) only while revealed, and a creature
 * on a hidden layer only while the layer shows. A creature whose recipe lies `outside` the palette
 * is marked for the post pass to leave its hue alone. A variant swap changes the model, and a
 * colossus is rebuilt for it. Read-only on the simulation.
 */

import * as THREE from 'three';
import type { Entity } from '../core/ecs';
import { wrapAngle } from '../core/geom';
import type { Variant } from '../data/registry';
import { BOSS_PRESENCE, CAST } from '../data/fxTuning';
import { REVIEWED_GLINTS, REVIEWED_MATTER } from '../data/reviewedLook';
import { FEEDBACK, SIM } from '../data/tuning';
import { isUnroused, type Game } from '../systems/components';
import { MODEL_PREFIX, resolveCreature } from '../systems/creatures';
import { stooped } from '../systems/hurt';
import { attackLook } from './attackLook';
import { buildAssembly, type Assembly } from './assemblies';
import { createArrivals, risesOut } from './bossArrival';
import { createCreatureFx, type Gone } from './creatureFx';
import { echoOpacity, lookOf, phaseOf, type Look } from './creatureLook';
import { createStoops } from './creatureStoop';
import { castSilhouettes } from './silhouetteCasters';
import { relitOf } from './creatureRelight';
import { toneForForm } from './spriteTone';
import { beyond, echoDrift, ECHOES, WRONGNESS } from './eldritch';
import { worldUniforms } from './worldMaterial';
import { createCreatureGlow } from './creatureGlow';
import { createBossPresence, type BossPresence } from './bossPresence';
import { CELL, spriteKey, type SpriteAtlas } from './sprites/atlas';
import { spriteBatch, reviewedTextures } from './sprites/batch';
import { clipCounts, resolveDirectionalClip, spriteDirection, type DirectionalClip, type SpriteAction, type SpriteDirection } from './sprites/directional';
import { reviewedClips, reviewedSize, reviewedSpan, type ReviewedManifest } from './sprites/reviewed';

const CAPACITY = 64;
const PHANTOM_WEIRD = 0.45; // how far a hallucination (or a boss's decoy) slips and glitches: it is not quite there

export { lookOf, type Look };

/** An echo: the same body, part dithered away. */
function ghost(a: Assembly, share: number): Assembly {
  for (const m of a.materials) m.uniforms.uGhost.value = share;
  return a;
}

export interface CreatureViews {
  update(alpha: number, time: number, camera: THREE.Camera): void;
  /** The sprite atlas and its texture, for others that draw a creature's likeness (round 18: skyLife.ts). */
  readonly sheet: { atlas: SpriteAtlas; texture: THREE.Texture; reviewed?: { manifest: ReviewedManifest; textures: THREE.Texture[] } };
  debugFrames(): readonly CreatureFrame[];
  /** A horror's phase and voice, as its picture wears them: the auras and the footfalls (worldLife.ts) read them too. */
  readonly presence: BossPresence;
  /** How wide each creature is drawn this frame, in metres: its blob shadow (shadows.ts) is as wide. */
  readonly painted: ReadonlyMap<Entity, number>;
  /** Where the creature's drawing stands, in metres above its feet (with a flyer's hover), for one drawn from the reviewed art; undefined for any other. */
  figure(id: Entity): { bottom: number; top: number; rows: number } | undefined;
}
export interface CreatureFrame {
  id: Entity; key: string; direction: SpriteDirection; state: SpriteAction; frame: number;
  source: string; mirror: boolean; page: number; width: number; height: number;
}

export function createCreatureViews(scene: THREE.Scene, g: Game, atlas: SpriteAtlas): CreatureViews {
  const tex = new THREE.DataTexture(atlas.data, atlas.width, atlas.height);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  const fallback = spriteBatch(scene, tex, CAPACITY);
  const { cells, info, weird, mesh: batch } = fallback;
  const art = atlas.reviewed;
  const textures = reviewedTextures(art?.pages ?? []);
  const pages = textures.map((texture) => spriteBatch(scene, texture, CAPACITY, true));
  const clips = new Map(Object.entries(art?.manifest.entities ?? {}).map(([key, entity]) => [key, reviewedClips(entity, key)]));
  const stoops = createStoops(g, art?.manifest);
  const painted = new Map<Entity, number>();
  const directions = new Map<Entity, SpriteDirection>();
  const debug: CreatureFrame[] = [];
  const fx = createCreatureFx(g); // how far gone each picture is, how worn, where it was struck (round 83)
  castSilhouettes.adopt([batch, ...pages.map((p) => p.mesh)]); // and each one's own picture, cast as well (round 94)
  const flat = new THREE.Vector3(); // the camera's right, level
  const realm: [number, number, number] = [1, 1, 1]; // the realm's mid-tone this frame, at brightness 1
  const glow = createCreatureGlow(g, atlas, flat, CAPACITY); // the faint halos about eyes and marks, and a horror's body
  const presence = createBossPresence(g); // how deep in its fight a horror is, and how loud its voice
  scene.add(glow.mesh);
  const counts = pages.map(() => 0); // billboards put in each reviewed page's batch this frame
  const sizes = new Map(Object.entries(art?.manifest.entities ?? {}).map(([key, entity]) => [key, reviewedSize(entity, art!.manifest)]));
  const spans = new Map(Object.entries(art?.manifest.entities ?? {}).map(([key, entity]) => [key, reviewedSpan(entity, art!.manifest)]));
  /** One billboard of a reviewed form, `fade` of its opacity, in the batch of its frame's page: that frame, or null when the page is full. */
  const put = (key: string, clip: DirectionalClip<number>, pose: Look, x: number, y: number, z: number, flash: number, fade: number, weird: number, dress?: { id: Entity; gone: Gone; time: number }, say = 0, fire = 0) => {
    const frame = art!.manifest.frames[clip.frames[pose.frame]];
    const page = art!.manifest.pages[frame.page];
    const b = pages[frame.page];
    const index = counts[frame.page];
    if (index >= CAPACITY) return null;
    b.cells.setXYZW(index, frame.x / page.width, frame.y / page.height, (frame.x + frame.width) / page.width, (frame.y + frame.height) / page.height);
    b.info.setXYZW(index, flash, pose.opacity * fade, clip.mirror_horizontal ? 1 : 0, 0);
    b.weird.setX(index, weird); // accepted anatomy, texture and palette stay intact through the cycle; only what was never there slips and glitches
    const size = sizes.get(key)!;
    b.mesh.setMatrixAt(index, m4.compose(at.set(x, y - size.groundOffset - pose.sink * size.height * 0.3, z), q, scale.set(size.width * (1 + 0.4 * say), size.height * (1 + say), 1))); // (a horror's voice swells its picture, its feet kept where they are: `say` is a share of its height)
    fx.dress(b, index, dress, x, at.y, z, size.width, size.height, flat, dress?.time ?? 0);
    const glint = REVIEWED_GLINTS[key];
    b.glint.setXYZW(index, glint?.[0] ?? 0, glint?.[1] ?? 0, glint?.[2] ?? 0, glint ? 1 + fire : 0);
    const tone = toneForForm(key, REVIEWED_MATTER[key] ?? realm, realm, worldUniforms.uSpriteGrade.value as number); // this form's own recolour to the realm it stands in (round 83)
    b.tone.setXYZW(index, tone.cos, tone.sin, tone.boost, tone.fill);
    b.relit.setX(index, relitOf(key));
    counts[frame.page]++;
    return frame;
  };
  const STOOP_LEAN = 1.5; // how far a stooped colossus bends (assemblies.ts tips the body a quarter of it, in radians)
  const assemblies = new Map<Entity, Assembly & { model: string; echoes: Assembly[]; lean: number }>();
  const drop = (asm: Assembly & { echoes: Assembly[]; lean: number }): void => void scene.remove(asm.root, ...asm.echoes.map((e) => e.root));
  const hitAt = new Map<Entity, number>();
  g.events.on('Hit', (e) => void (e.outcome !== 'dodged' && hitAt.set(e.target, g.frame / SIM.hz)));
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const right = new THREE.Vector3();
  const at = new THREE.Vector3();
  const scale = new THREE.Vector3();
  const seen = new Set<Entity>(); // reused each frame: no garbage per frame
  const arrivals = createArrivals(); // the bosses not yet roused, and when each came into view (round 60)

  return {
    sheet: { atlas, texture: tex, reviewed: art ? { manifest: art.manifest, textures } : undefined },
    debugFrames: () => debug,
    presence,
    painted,
    figure(id) {
      const model = g.ecs.c.model.get(id);
      if (!model?.startsWith(MODEL_PREFIX)) return undefined;
      const [cid, variant] = model.slice(MODEL_PREFIX.length).split('#') as [string, Variant | undefined];
      const span = spans.get(spriteKey(cid, variant));
      const hover = g.ecs.c.brain.get(id)?.def.params.hover ?? 0;
      return span && { bottom: span.bottom + hover, top: span.top + hover, rows: span.rows };
    },
    update(alpha, time, camera) {
      camera.updateMatrixWorld();
      right.setFromMatrixColumn(camera.matrixWorld, 0);
      flat.set(right.x, 0, right.z).normalize();
      const mid = worldUniforms.uSpriteTints.value[2] as THREE.Vector3;
      realm[0] = mid.x; realm[1] = mid.y; realm[2] = mid.z;
      glow.begin();
      castSilhouettes.begin(flat);
      painted.clear();
      const from = g.ecs.c.transform.get(g.player.id)?.pos ?? { x: 0, z: 0 };
      let n = 0;
      counts.fill(0);
      debug.length = 0;
      seen.clear();
      for (const [id, model] of g.ecs.c.model) {
        if (!model.startsWith(MODEL_PREFIX)) continue;
        const [cid, variant] = model.slice(MODEL_PREFIX.length).split('#') as [string, Variant | undefined];
        const def = resolveCreature(cid, variant);
        const tr = g.ecs.c.transform.get(id);
        if (!def || !tr) continue;
        seen.add(id);
        const arrival = arrivals.of(id, isUnroused(g, id), time, g.ecs.c.body.get(id)?.height ?? 2, risesOut(def.assembly?.body));
        const key = spriteKey(cid, variant);
        const entry = art?.manifest.entities[key];
        const bow = entry ? stoops.of(id, key, time) : undefined;
        const beat = time + phaseOf(id); // its own place in its cycles: a pack does not step as one (round 83)
        const x = tr.prev.x + (tr.pos.x - tr.prev.x) * alpha;
        const z = tr.prev.z + (tr.pos.z - tr.prev.z) * alpha;
        // the frames of each state in the way it faces, so lookOf knows a flyer has its own wing-beat (round 49: it was told only the stoop, and a flyer always walked)
        const yaw = tr.prevYaw + wrapAngle(tr.yaw - tr.prevYaw) * alpha;
        const direction = entry && art ? spriteDirection(yaw, { x, z }, camera.position, directions.get(id)) : undefined;
        const look = lookOf(g, id, beat, { ...(direction && clips.get(key) ? clipCounts(clips.get(key)!, direction) : {}), ...stoops.known(bow) }, bow?.age, bow?.rise, arrival);
        const gone = fx.gone(id, def, model, look, time); // (told of every creature, hidden or not: a hidden one rises when it shows)
        const hover = g.ecs.c.brain.get(id)?.def.params.hover ?? 0;
        const y = tr.prev.y + (tr.pos.y - tr.prev.y) * alpha + (hover > 0 ? hover + 0.2 * Math.sin(time * 2 + id) : 0);
        const flash = FEEDBACK.flashLevel * Math.max(0, 1 - (time - (hitAt.get(id) ?? -Infinity)) / FEEDBACK.flashSeconds);
        const [voice, deep] = [presence.voice(id, time), presence.deep(id)]; // a horror's voice and how far into its fight it is, worn by its picture (round 83)
        if (entry && art && direction) {
          if (!look) continue;
          directions.set(id, direction);
          const clip = resolveDirectionalClip(clips.get(key)!, direction, look.state);
          if (!clip) continue;
          const pose = lookOf(g, id, beat, { ...stoops.known(bow), [look.state]: clip.frames.length }, bow?.age, bow?.rise, arrival)!;
          const weird = g.ecs.c.phantom.has(id) ? PHANTOM_WEIRD : 0;
          const frame = put(key, clip, pose, x, y, z, flash, 1, weird, { id, gone, time }, voice * BOSS_PRESENCE.breathe, voice * BOSS_PRESENCE.glints + deep * BOSS_PRESENCE.deepGlints);
          if (!frame) continue;
          debug.push({ id, key, direction, state: pose.state, frame: pose.frame, source: frame.source, mirror: clip.mirror_horizontal, page: frame.page, width: frame.width, height: frame.height });
          const span = spans.get(key)!;
          if (deep > 0 && gone.amount < 0.5) glow.halo(x, y + (span.top + span.bottom) / 2, z, (span.top - span.bottom) * BOSS_PRESENCE.halo.size, attackLook(g, id).line, BOSS_PRESENCE.halo.gain * deep * pose.opacity); // the colour of its blows hangs about it, deeper by phase
          painted.set(id, span.across);
          if (!def.sprite?.outside && def.sprite?.silhouette !== 'spectre' && pose.opacity >= CAST.least) castSilhouettes.put(frame.page + 1, counts[frame.page] - 1, x, z, span.top - span.bottom, sizes.get(key)!.groundOffset, deep, 1 - gone.amount, from); // its own picture, cast as a shadow, larger by what it is and how deep in its fight (round 94; a spectre casts none, nor a shimmer in the air)
          if (direction === 'front' && !clip.mirror_horizontal) glow.reviewedEyes(key, sizes.get(key)!, x, y, z, pose, camera.position, glow.mistLook(id, time), voice);
          if (def.assembly && beyond(WRONGNESS[def.tier])) { // an outer god's body a moment behind itself, drifting, half dithered away
            ECHOES.forEach((e, i) => {
              const behind = stoops.known(bow);
              const age = bow ? Math.max(0, bow.age - e.lag) : 0;
              const late = lookOf(g, id, beat - e.lag, behind, age, bow?.rise, arrival);
              const lagged = late && resolveDirectionalClip(clips.get(key)!, direction, late.state);
              if (!late || !lagged) return;
              const d = echoDrift(i, time, def.assembly!.scale);
              put(key, lagged, lookOf(g, id, beat - e.lag, { ...behind, [late.state]: lagged.frames.length }, age, bow?.rise, arrival)!, x + d.x, y, z + d.z, 0, echoOpacity(e.ghost, gone.amount), 0); // (they go with the body, and come in with it)
            });
          }
          continue;
        }
        if (def.assembly) {
          let asm = assemblies.get(id);
          if (asm?.model !== model) {
            if (asm) drop(asm);
            const w = WRONGNESS[def.tier];
            const echoes = beyond(w) ? ECHOES.map((e) => ghost(buildAssembly(def.assembly!, id, w), e.ghost)) : [];
            assemblies.set(id, (asm = { ...buildAssembly(def.assembly, id, w), model, echoes, lean: 0 }));
          }
          if (!asm.root.parent) scene.add(asm.root, ...asm.echoes.map((e) => e.root));
          for (const r of [asm.root, ...asm.echoes.map((e) => e.root)]) r.visible = look !== null;
          if (!look) continue;
          const h = def.assembly.scale;
          const yaw = tr.prevYaw + wrapAngle(tr.yaw - tr.prevYaw) * alpha;
          const aim = stooped(g, id) ? STOOP_LEAN : look.state === 'attack' ? look.lash : look.state === 'hurt' ? -0.3 : 0; // a colossus stooped after its blow bends to its prey (hurt.ts)
          const lean = (asm.lean += (aim - asm.lean) * 0.25);
          asm.root.position.set(x, y - look.sink * h * 0.6, z);
          asm.root.rotation.y = yaw;
          asm.animate(time, look.lash, lean);
          for (const m of asm.materials) [m.uniforms.uEmissive.value, m.uniforms.uGhost.value] = [(m.userData.emissive as number) + flash + BOSS_PRESENCE.bodyGlow * (0.5 * deep + voice), 1 - (look.appear ?? 1)]; // (a horror just roused is dithered in)
          asm.echoes.forEach((e, i) => { // an outer god's body a moment behind itself, drifting
            const [{ lag }, d] = [ECHOES[i], echoDrift(i, time, h)];
            e.root.position.set(x + d.x, y - look.sink * h * 0.6, z + d.z);
            e.root.rotation.y = yaw + Math.sin(time * 0.4 + i) * 0.35;
            e.animate(time - lag, look.lash, lean);
            for (const m of e.materials) m.uniforms.uGhost.value = Math.max(ECHOES[i].ghost, 1 - (look.appear ?? 1));
          });
          continue;
        }
        const frames = atlas.frames.get(spriteKey(cid, variant));
        if (!look || look.state === 'stoop' || look.state === 'stoop_mid' || !frames || !def.sprite || n >= CAPACITY) continue; // (the drawn sprites have no stoop)
        const drawn = look.state === 'flight' ? 'move' : look.state; // (the drawn sprites have no flight: they fly as they walk)
        const cell = frames[drawn][look.frame % frames[drawn].length];
        const [cx, cy] = [(cell % (atlas.width / CELL)) * CELL, Math.floor(cell / (atlas.width / CELL)) * CELL];
        cells.setXYZW(n, cx / atlas.width, cy / atlas.height, (cx + CELL) / atlas.width, (cy + CELL) / atlas.height);
        const facingRight = Math.sin(tr.yaw) * right.x + Math.cos(tr.yaw) * right.z >= 0;
        info.setXYZW(n, flash, look.opacity, facingRight ? 0 : 1, def.sprite.outside ? 1 : 0);
        fx.dress(fallback, n, { id, gone }, x, y - look.sink * def.sprite.scale * 0.3, z, def.sprite.scale, def.sprite.scale, flat, time);
        weird.setX(n, Math.max(WRONGNESS[def.tier], g.ecs.c.phantom.has(id) ? PHANTOM_WEIRD : 0));
        const size = def.sprite.scale;
        painted.set(id, size * 0.45);
        if (!def.sprite.outside && def.sprite.silhouette !== 'spectre' && look.opacity >= CAST.least) castSilhouettes.put(0, n, x, z, size * 0.8, 0, 0, 1 - gone.amount, from);
        batch.setMatrixAt(n++, m4.compose(at.set(x, y - look.sink * size * 0.3, z), q, scale.set(size, size, 1)));
        glow.eyes(cell, x, y - look.sink * size * 0.3, z, size, !facingRight, look, camera.position, glow.mistLook(id, time));
      }
      arrivals.forget(seen);
      fx.forget(seen);
      glow.forget(seen);
      stoops.forget(seen);
      for (const id of directions.keys()) if (!seen.has(id)) directions.delete(id);
      for (const [id, asm] of assemblies) {
        if (seen.has(id)) continue;
        drop(asm);
        assemblies.delete(id);
      }
      pages.forEach((page, index) => page.finish(counts[index]));
      fallback.finish(n);
      castSilhouettes.end();
      glow.end();
    },
  };
}
