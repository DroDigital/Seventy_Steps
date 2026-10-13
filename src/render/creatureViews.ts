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
import { FEEDBACK, FOG_EYES, LIGHT, SIM } from '../data/tuning';
import { moveDef } from '../systems/actions';
import { isAbsent, isUnseen, type Game } from '../systems/components';
import { MODEL_PREFIX, resolveCreature } from '../systems/creatures';
import { stooped } from '../systems/hurt';
import { strikeFrame } from '../systems/realityTricks';
import { buildAssembly, type Assembly } from './assemblies';
import { beyond, echoDrift, ECHOES, WRONGNESS } from './eldritch';
import { createHalos } from './halos';
import { MIST } from './volumetricFog';
import { sight } from '../systems/perception';
import { CELL, spriteKey, type SpriteAtlas, type SpriteState } from './sprites/atlas';
import { spriteBatch, reviewedTextures } from './sprites/batch';
import { attackFrame, lastFrame, loopFrame, reactionFrame, resolveDirectionalClip, spriteDirection, type DirectionalClip, type SpriteDirection } from './sprites/directional';
import { reviewedClips, reviewedSize, type ReviewedManifest } from './sprites/reviewed';

const CAPACITY = 64;
const REACTIONS = new Set(['stagger', 'guardBreak', 'parried']);
const PHANTOM_WEIRD = 0.45; // how far a hallucination (or a boss's decoy) slips and glitches: it is not quite there

interface Look {
  state: SpriteState;
  frame: number;
  opacity: number;
  sink: number; // 0..1 through the death move
  lash: number; // 0..1 around an attack's strike
}

/** Which frame of which state a creature shows, from its move and speed. */
export function lookOf(g: Game, id: Entity, time: number, counts: Partial<Record<SpriteState, number>> = {}): Look | null {
  const c = g.ecs.c;
  const br = c.brain.get(id);
  if (isAbsent(g, id) || br?.state === 'hidden' || isUnseen(g, id)) return null;
  const a = c.actor.get(id)!;
  const def = moveDef(a);
  const tr = c.transform.get(id)!;
  const invisible = br?.def.params.hide === 'invisible';
  let look: Look;
  if (a.move === 'death' && def) {
    const t = a.frame / def.frames;
    look = { state: 'hurt', frame: lastFrame(counts.hurt ?? 2), opacity: 1 - t, sink: t, lash: 0 };
  } else if (a.move === 'evade') {
    look = { state: 'move', frame: loopFrame(time, counts.move ?? 2, 0.5), opacity: 1, sink: 0, lash: 0 };
  } else if (a.move !== null && REACTIONS.has(a.move)) {
    look = { state: 'hurt', frame: reactionFrame(a.frame, def?.frames ?? 16, counts.hurt ?? 2), opacity: 1, sink: 0, lash: 0 };
  } else if (a.move !== null && def) {
    const strike = strikeFrame(def) ?? Math.floor(def.frames / 3);
    const end = def.hit?.window[1] ?? strike + 6;
    const frame = attackFrame(a.frame, def.frames, strike, end, counts.attack ?? 3);
    look = { state: 'attack', frame, opacity: 1, sink: 0, lash: a.frame < strike ? a.frame / Math.max(1, strike) * 0.3 : a.frame < end ? 1 : 0.3 };
  } else {
    const moving = Math.hypot(tr.pos.x - tr.prev.x, tr.pos.z - tr.prev.z) * SIM.hz > 0.3;
    look = moving ? { state: 'move', frame: loopFrame(time, counts.move ?? 2), opacity: 1, sink: 0, lash: 0 } : { state: 'idle', frame: loopFrame(time, counts.idle ?? 2, 1.25), opacity: 1, sink: 0, lash: 0 };
  }
  if (invisible && look.state !== 'attack' && look.state !== 'hurt') look.opacity = Math.min(look.opacity, 0.2); // a shimmer in the air: unseen it was not (round 45), but it can be caught moving
  return look;
}

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
}
export interface CreatureFrame {
  id: Entity; key: string; direction: SpriteDirection; state: SpriteState; frame: number;
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
  const directions = new Map<Entity, SpriteDirection>();
  const debug: CreatureFrame[] = [];
  const glows = createHalos(CAPACITY, 0.55);
  scene.add(glows.mesh);
  const flat = new THREE.Vector3(); // the camera's right, level
  const counts = pages.map(() => 0); // billboards put in each reviewed page's batch this frame
  const sizes = new Map(Object.entries(art?.manifest.entities ?? {}).map(([key, entity]) => [key, reviewedSize(entity, art!.manifest)]));
  /** One billboard of a reviewed form, `fade` of its opacity, in the batch of its frame's page: that frame, or null when the page is full. */
  const put = (key: string, clip: DirectionalClip<number>, pose: Look, x: number, y: number, z: number, flash: number, fade: number, weird: number) => {
    const frame = art!.manifest.frames[clip.frames[pose.frame]];
    const page = art!.manifest.pages[frame.page];
    const b = pages[frame.page];
    const index = counts[frame.page];
    if (index >= CAPACITY) return null;
    b.cells.setXYZW(index, frame.x / page.width, frame.y / page.height, (frame.x + frame.width) / page.width, (frame.y + frame.height) / page.height);
    b.info.setXYZW(index, flash, pose.opacity * fade, clip.mirror_horizontal ? 1 : 0, 0);
    b.weird.setX(index, weird); // accepted anatomy, texture and palette stay intact through the cycle; only what was never there slips and glitches
    const size = sizes.get(key)!;
    b.mesh.setMatrixAt(index, m4.compose(at.set(x, y - size.groundOffset - pose.sink * size.height * 0.3, z), q, scale.set(size.width, size.height, 1)));
    counts[frame.page]++;
    return frame;
  };
  /** A faint glow about the eyes of a sprite drawn at (x, y, z), `size` metres, in atlas cell `cell`. */
  const eyes = (cell: number, x: number, y: number, z: number, size: number, flip: boolean, look: Look, eye: THREE.Vector3, out = 0): void => {
    const k = cell * 4;
    if (!atlas.eyes[k + 3]) return;
    const [ex, ey] = [atlas.eyes[k] / CELL, atlas.eyes[k + 1] / CELL];
    const along = (flip ? 0.5 - ex : ex - 0.5) * size;
    const [px, py, pz] = [x + flat.x * along, y + (1 - ey) * size, z + flat.z * along];
    const [lo, hi] = LIGHT.eyes;
    const d = Math.hypot(px - eye.x, py - eye.y, pz - eye.z);
    const near = Math.max(1 - THREE.MathUtils.smoothstep(d, lo, hi), out * (1 - THREE.MathUtils.smoothstep(d, hi, hi + FOG_EYES.reach))); // in a mist, one that has seen the investigator looks out of it from far off
    const gain = (LIGHT.eyeGlow.gain + FOG_EYES.boost * out) * near * look.opacity * (1 - look.sink);
    const rgb = atlas.eyeColors.subarray(cell * 3, cell * 3 + 3);
    if (gain > 0.01) glows.put(px, py, pz, LIGHT.eyeGlow.radius * (1 + FOG_EYES.swell * out) + (atlas.eyes[k + 2] / CELL) * size, rgb, gain);
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
  const looking = new Map<Entity, number>(); // 0..1: how far a creature's eyes have come out of the mist (round 35)

  return {
    sheet: { atlas, texture: tex, reviewed: art ? { manifest: art.manifest, textures } : undefined },
    debugFrames: () => debug,
    update(alpha, time, camera) {
      camera.updateMatrixWorld();
      right.setFromMatrixColumn(camera.matrixWorld, 0);
      flat.set(right.x, 0, right.z).normalize();
      glows.begin();
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
        const look = lookOf(g, id, time);
        const x = tr.prev.x + (tr.pos.x - tr.prev.x) * alpha;
        const z = tr.prev.z + (tr.pos.z - tr.prev.z) * alpha;
        const hover = g.ecs.c.brain.get(id)?.def.params.hover ?? 0;
        const y = tr.prev.y + (tr.pos.y - tr.prev.y) * alpha + (hover > 0 ? hover + 0.2 * Math.sin(time * 2 + id) : 0);
        const flash = FEEDBACK.flashLevel * Math.max(0, 1 - (time - (hitAt.get(id) ?? -Infinity)) / FEEDBACK.flashSeconds);
        const key = spriteKey(cid, variant);
        const entry = art?.manifest.entities[key];
        if (entry && art) {
          if (!look) continue;
          const yaw = tr.prevYaw + wrapAngle(tr.yaw - tr.prevYaw) * alpha;
          const direction = spriteDirection(yaw, { x, z }, camera.position, directions.get(id));
          directions.set(id, direction);
          const clip = resolveDirectionalClip(clips.get(key)!, direction, look.state);
          if (!clip) continue;
          const pose = lookOf(g, id, time, { [look.state]: clip.frames.length })!;
          const weird = g.ecs.c.phantom.has(id) ? PHANTOM_WEIRD : 0;
          const frame = put(key, clip, pose, x, y, z, flash, 1, weird);
          if (!frame) continue;
          debug.push({ id, key, direction, state: pose.state, frame: pose.frame, source: frame.source, mirror: clip.mirror_horizontal, page: frame.page, width: frame.width, height: frame.height });
          if (def.assembly && beyond(WRONGNESS[def.tier])) { // an outer god's body a moment behind itself, drifting, half dithered away
            ECHOES.forEach((e, i) => {
              const late = lookOf(g, id, time - e.lag);
              const lagged = late && resolveDirectionalClip(clips.get(key)!, direction, late.state);
              if (!late || !lagged) return;
              const d = echoDrift(i, time, def.assembly!.scale);
              put(key, lagged, lookOf(g, id, time - e.lag, { [late.state]: lagged.frames.length })!, x + d.x, y, z + d.z, 0, 1 - e.ghost, 0);
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
          for (const m of asm.materials) m.uniforms.uEmissive.value = (m.userData.emissive as number) + flash;
          asm.echoes.forEach((e, i) => { // an outer god's body a moment behind itself, drifting
            const [{ lag }, d] = [ECHOES[i], echoDrift(i, time, h)];
            e.root.position.set(x + d.x, y - look.sink * h * 0.6, z + d.z);
            e.root.rotation.y = yaw + Math.sin(time * 0.4 + i) * 0.35;
            e.animate(time - lag, look.lash, lean);
          });
          continue;
        }
        const frames = atlas.frames.get(spriteKey(cid, variant));
        if (!look || !frames || !def.sprite || n >= CAPACITY) continue;
        const cell = frames[look.state][look.frame];
        const [cx, cy] = [(cell % (atlas.width / CELL)) * CELL, Math.floor(cell / (atlas.width / CELL)) * CELL];
        cells.setXYZW(n, cx / atlas.width, cy / atlas.height, (cx + CELL) / atlas.width, (cy + CELL) / atlas.height);
        const facingRight = Math.sin(tr.yaw) * right.x + Math.cos(tr.yaw) * right.z >= 0;
        info.setXYZW(n, flash, look.opacity, facingRight ? 0 : 1, def.sprite.outside ? 1 : 0);
        weird.setX(n, Math.max(WRONGNESS[def.tier], g.ecs.c.phantom.has(id) ? PHANTOM_WEIRD : 0));
        const size = def.sprite.scale;
        batch.setMatrixAt(n++, m4.compose(at.set(x, y - look.sink * size * 0.3, z), q, scale.set(size, size, 1)));
        const br = g.ecs.c.brain.get(id);
        const foggy = Math.min(1, Math.max(0, (MIST.thickness - FOG_EYES.from) / FOG_EYES.span));
        const sees = foggy > 0 && !!br && br.state !== 'hidden' && br.state !== 'return' && br.state !== 'follow' && sight(g, id, g.player.id, br.def.params) >= FOG_EYES.sees; // a creature that sees the investigator, in a mist
        const was = looking.get(id) ?? 0;
        const amt = was + ((sees ? foggy : 0) - was) * Math.min(1, (sees ? FOG_EYES.rise : FOG_EYES.fall) / 60); // they come out of it, not on
        looking.set(id, amt);
        const blink = Math.sin(time * 0.9 + id * 7.3) > 0.985 ? 0.15 : 1; // now and then, a blink
        eyes(cell, x, y - look.sink * size * 0.3, z, size, !facingRight, look, camera.position, amt * blink);
      }
      for (const id of looking.keys()) if (!seen.has(id)) looking.delete(id);
      for (const id of directions.keys()) if (!seen.has(id)) directions.delete(id);
      for (const [id, asm] of assemblies) {
        if (seen.has(id)) continue;
        drop(asm);
        assemblies.delete(id);
      }
      pages.forEach((page, index) => page.finish(counts[index]));
      fallback.finish(n);
      glows.end();
    },
  };
}
