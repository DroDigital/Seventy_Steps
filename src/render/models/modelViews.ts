/**
 * Draws the creatures that have a model (docs/MODELS.md): each a clone of its skinned body in the world
 * material (vertex snapping, fog, the lantern, the sanity warp, its tier's wrongness), posed each frame
 * from its move (modelPose.ts) with a short crossfade from what it did before. Its eldritch self shows
 * the parts that only it has, a boss variant is drawn at its size, an outer god trails its echoes,
 * and a fading body (death, an invisible stalker) is dithered away. Read-only on the simulation.
 */

import * as THREE from 'three';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import type { Entity } from '../../core/ecs';
import { getEntity, variantOf, type Variant } from '../../data/registry';
import type { EntityDef } from '../../data/schema';
import { SIM } from '../../data/tuning';
import type { Game } from '../../systems/components';
import { bodyOf } from '../../systems/creatures';
import { beyond, echoDrift, ECHOES, WRONGNESS } from '../eldritch';
import { createWorldMaterial } from '../worldMaterial';
import { textureOf, type ModelSource } from './modelLibrary';
import { modelPose, type ModelPose } from './modelPose';

const BLEND = 0.12; // seconds a new clip takes over from the last
const RISE = 0.5; // a colossus standing up out of its stoop
const FAR = 100; // metres: past the fog, nothing is posed or drawn
const MOVING = 0.3; // m/s: under way

interface Eye { bone: THREE.Object3D; local: THREE.Vector3; rgb: readonly [number, number, number]; layer: string }
interface Body {
  root: THREE.Object3D;
  mixer: THREE.AnimationMixer;
  actions: Map<string, THREE.AnimationAction>;
  materials: THREE.ShaderMaterial[];
  eyes: Eye[];
}
interface Instance extends Body {
  model: string;
  cur: ModelPose;
  prev: ModelPose | null;
  since: number;
  walked: number;
  last: { x: number; z: number } | null;
  scale: number;
  echoes: Body[];
}

export interface Glint { x: number; y: number; z: number; rgb: readonly [number, number, number] }
export interface Place { x: number; y: number; z: number; yaw: number }
export interface Shown { opacity: number; flash: number; weird: number }

export interface ModelViews {
  has(cid: string): boolean;
  /** Poses and places creature `id` this frame (hidden where `shown` is null); the eyes it shows, to glow. */
  draw(id: Entity, model: string, cid: string, variant: Variant | undefined, def: EntityDef, at: Place, shown: Shown | null, time: number, eye: THREE.Vector3): readonly Glint[];
  /** Drops the bodies of creatures not drawn this frame. */
  finish(seen: ReadonlySet<Entity>): void;
  /** Metres from its feet to the top of its model, at its size. */
  height(cid: string, variant?: Variant): number | undefined;
}

const layerOf = (o: THREE.Object3D): string => (o.name.split('@')[1] ?? o.parent?.name.split('@')[1] ?? '').replace(/_\d+$/, '');
const shows = (layer: string, variant?: Variant): boolean => (layer === 'eldritch' ? variant === 'eldritch' : layer === 'plain' ? variant !== 'eldritch' : true);

function makeBody(src: ModelSource, def: EntityDef, variant: Variant | undefined, seed: number): Body {
  const root = clone(src.scene);
  const byName = new Map<string, THREE.ShaderMaterial>();
  const eyes: Eye[] = [];
  let skeleton: THREE.Skeleton | undefined;
  root.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    const name = (o.material as THREE.Material).name;
    let m = byName.get(name);
    if (!m) byName.set(name, (m = createWorldMaterial({ texture: textureOf(name), seed: 5 + (seed % 7), vertexColors: true, character: 'creature', eldritch: WRONGNESS[def.tier], bodyScale: src.facts.height })));
    o.material = m;
    o.frustumCulled = false; // its bounds are its rest pose's; a blow reaches out of them
    o.visible = shows(layerOf(o), variant);
    if (o instanceof THREE.SkinnedMesh) skeleton ??= o.skeleton;
  });
  for (const [bone, x, y, z, r, gr, b, layer] of src.facts.eyes) {
    const i = skeleton?.bones.findIndex((n) => n.name === THREE.PropertyBinding.sanitizeNodeName(bone)) ?? -1;
    if (i < 0 || !skeleton) continue;
    eyes.push({ bone: skeleton.bones[i], local: new THREE.Vector3(x, y, z).applyMatrix4(skeleton.boneInverses[i]), rgb: [r, gr, b], layer });
  }
  const mixer = new THREE.AnimationMixer(root);
  const actions = new Map([...src.clips].map(([n, c]) => {
    const a = mixer.clipAction(c);
    a.play();
    a.paused = true; // its time is set by hand each frame
    a.enabled = false;
    return [n, a] as const;
  }));
  return { root, mixer, actions, materials: [...byName.values()], eyes };
}

/** The body in `cur`, or crossfading into it from `prev` (weight w of the way). */
function pose(b: Body, cur: ModelPose, prev: ModelPose | null, w: number): void {
  for (const a of b.actions.values()) a.enabled = false;
  const use = (p: ModelPose, weight: number): void => {
    const a = b.actions.get(p.clip);
    if (!a) return;
    a.enabled = true;
    a.time = Math.max(0, Math.min(p.frame / SIM.hz, a.getClip().duration - 1e-4));
    a.setEffectiveWeight(weight);
  };
  const blending = prev && w < 1 && prev.clip !== cur.clip;
  use(cur, blending ? w : 1);
  if (blending) use(prev, 1 - w);
  b.mixer.update(0);
}

export function createModelViews(scene: THREE.Scene, g: Game, sources: ReadonlyMap<string, ModelSource>): ModelViews {
  const live = new Map<Entity, Instance>();
  const sizes = new Map<string, number>();
  const at = new THREE.Vector3();
  const sizeOf = (cid: string, def: EntityDef): number => {
    const key = `${cid}:${def.name}:${def.sprite?.scale ?? def.assembly?.scale}`;
    if (!sizes.has(key)) sizes.set(key, bodyOf(def).height / bodyOf(getEntity(cid) ?? def).height);
    return sizes.get(key)!;
  };
  const drop = (inst: Instance): void => {
    for (const b of [inst, ...inst.echoes]) {
      scene.remove(b.root);
      b.mixer.stopAllAction();
      for (const m of b.materials) m.dispose();
    }
  };

  return {
    has: (cid) => sources.has(cid),
    height(cid, variant) {
      const src = sources.get(cid);
      const base = getEntity(cid);
      if (!src || !base) return undefined;
      const def = (variant && variantOf(base, variant)) || base;
      return src.facts.height * sizeOf(cid, def);
    },
    draw(id, model, cid, variant, def, place, shown, time, eye) {
      const src = sources.get(cid)!;
      let inst = live.get(id);
      if (inst?.model !== model) {
        if (inst) drop(inst);
        const echoes = beyond(WRONGNESS[def.tier]) ? ECHOES.map(() => makeBody(src, def, variant, id)) : [];
        echoes.forEach((e, i) => e.materials.forEach((m) => (m.uniforms.uGhost.value = ECHOES[i].ghost)));
        inst = { ...makeBody(src, def, variant, id), model, cur: { clip: 'idle', frame: 0 }, prev: null, since: -1, walked: 0, last: null, scale: sizeOf(cid, def), echoes };
        live.set(id, inst);
        scene.add(inst.root, ...inst.echoes.map((e) => e.root));
      }
      const far = Math.hypot(place.x - eye.x, place.z - eye.z) > FAR;
      for (const b of [inst, ...inst.echoes]) b.root.visible = !!shown && !far;
      if (!shown || far) return [];
      const tr = g.ecs.c.transform.get(id)!;
      const moved = inst.last ? Math.hypot(place.x - inst.last.x, place.z - inst.last.z) : 0;
      if (moved < 2) inst.walked += moved / Math.max(0.1, (src.facts.clips.move?.stride ?? 1.5) * inst.scale); // the cycle moves on with the ground covered (not a teleport's leap)
      inst.last = { x: place.x, z: place.z };
      const speed = Math.hypot(tr.pos.x - tr.prev.x, tr.pos.z - tr.prev.z) * SIM.hz;
      const next = modelPose(g, id, src.facts, inst.walked, time, speed > MOVING);
      if (next.clip !== inst.cur.clip) {
        inst.prev = inst.cur;
        inst.since = time;
      }
      inst.cur = next;
      const span = inst.prev?.clip === 'stoop' ? RISE : BLEND;
      const w = inst.prev ? Math.min(1, (time - inst.since) / span) : 1;
      if (w >= 1) inst.prev = null;
      pose(inst, inst.cur, inst.prev, w);
      inst.root.position.set(place.x, place.y, place.z);
      inst.root.rotation.y = place.yaw;
      inst.root.scale.setScalar(inst.scale);
      const ghost = 1 - shown.opacity;
      for (const m of inst.materials) {
        m.uniforms.uEmissive.value = shown.flash;
        m.uniforms.uGhost.value = ghost;
        m.uniforms.uEldritch.value = Math.max(WRONGNESS[def.tier], shown.weird);
      }
      inst.echoes.forEach((e, i) => { // an outer god's body a moment behind itself, drifting
        const lag = ECHOES[i].lag * SIM.hz;
        const d = echoDrift(i, time, src.facts.height * inst!.scale);
        pose(e, { clip: inst!.cur.clip, frame: Math.max(0, inst!.cur.frame - lag) }, null, 1);
        e.root.position.set(place.x + d.x, place.y, place.z + d.z);
        e.root.rotation.y = place.yaw + Math.sin(time * 0.4 + i) * 0.35;
        e.root.scale.setScalar(inst!.scale);
        for (const m of e.materials) m.uniforms.uGhost.value = Math.max(ECHOES[i].ghost, ghost);
      });
      inst.root.updateMatrixWorld(true);
      const out: Glint[] = [];
      for (const e of inst.eyes) {
        if (!shows(e.layer, variant)) continue;
        at.copy(e.local).applyMatrix4(e.bone.matrixWorld);
        out.push({ x: at.x, y: at.y, z: at.z, rgb: e.rgb });
      }
      return out;
    },
    finish(seen) {
      for (const [id, inst] of live) {
        if (seen.has(id)) continue;
        drop(inst);
        live.delete(id);
      }
    },
  };
}
