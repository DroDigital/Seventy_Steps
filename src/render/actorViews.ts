/**
 * Draws every entity that has a `model` as a primitive figure: interpolated transforms, procedural
 * poses eased into one another (poseBlend.ts), hitstop shake, hit flashes, and the revolver's tracer.
 * Read-only on the simulation.
 */

import * as THREE from 'three';
import type { Entity } from '../core/ecs';
import { wrapAngle, yawOf } from '../core/geom';
import { FEEDBACK, SIM } from '../data/tuning';
import { moveDef } from '../systems/actions';
import type { Game } from '../systems/components';
import { MODEL_PREFIX } from '../systems/creatures';
import { buildFigure, type Figure } from './figures';
import { ACTS, type ActKind, type Post } from '../data/npcActs';
import { pipeBeat } from './npcActs';
import type { Smoker } from './pipeSmoke';
import { actOf } from '../systems/npcLife';
import { cadence, type Ground } from './gait';
import { FX_PREFIX } from './fightViews';
import { SHRINE_MODEL } from './signViews';
import { box } from './meshKit';
import { personShadow } from './moonShadow';
import { BASE } from './palette';
import { createPoseBlend, type PoseBlend } from './poseBlend';
import { pose } from './poses';
import { createWorldMaterial } from './worldMaterial';
import { FEEL } from './feel';

interface View {
  figure: Figure;
  stride: number; // stride phase, radians
  speed: number; // ground speed, eased so a stop or start does not snap the legs
  lastTime: number;
  hitAt: number; // sim seconds of the last landed blow
  blend: PoseBlend; // eases one pose into the next when the move or guard changes
  kneel: number; // 0–1, easing toward kneeling while the investigator rests (round 15)
  act: ActKind | null; // what a person was last doing, and how far into it they are (round 39)
  actK: number;
}

export interface ActorViews {
  update(alpha: number, time: number): void;
  /** The investigator, up from the knee, takes `seconds` over it (a cutscene's slow rise); otherwise they rise as fast as they move. */
  rise(seconds: number): void;
  /** The smokers at their pipes this frame (render/pipeSmoke.ts draws the smoke). */
  readonly smokers: readonly Smoker[];
  /** Where the glow light sits this frame (the Echo drop), or null. */
  readonly glow: THREE.Vector3 | null;
  /** Where the investigator's lantern flame is drawn this frame, or null while they are not. */
  readonly flame: THREE.Vector3 | null;
  /** Where the muzzle of the investigator's revolver is this frame (posed, drawn or not), or null while they are not drawn. */
  readonly muzzle: THREE.Vector3 | null;
}

function dispose(f: Figure): void {
  f.root.traverse((o) => {
    if (o instanceof THREE.Mesh) o.geometry.dispose();
  });
  for (const m of f.materials) m.dispose();
}

export function createActorViews(scene: THREE.Scene, g: Game): ActorViews {
  const views = new Map<Entity, View>();
  const simTime = (): number => g.frame / SIM.hz;
  const tracer = new THREE.Mesh(
    box(0.07, 0.07, 1, 0, 0, 0.5, BASE.bone),
    createWorldMaterial({ texture: 'stone', emissive: 1, vertexColors: true }),
  );
  tracer.visible = false;
  scene.add(tracer);
  let tracerUntil = -1;
  let smokers: Smoker[] = [];
  const glowAt = new THREE.Vector3();
  let glow: THREE.Vector3 | null = null;
  const flameAt = new THREE.Vector3();
  let flame: THREE.Vector3 | null = null;
  const muzzleAt = new THREE.Vector3();
  let muzzle: THREE.Vector3 | null = null;
  let rising: { seconds: number; at: number | null } | null = null; // a cutscene's slow rise from the knee: when it began (set by the first frame drawn)

  g.events.on('Travelled', () => { // arriving at a sign on one knee: already down as the veil lifts (round 29)
    const v = views.get(g.player.id);
    if (v && g.player.kneeling) v.kneel = 1;
  });
  g.events.on('Hit', (e) => {
    const v = views.get(e.target);
    if (v && e.outcome !== 'dodged') v.hitAt = simTime();
  });
  g.events.on('Shot', ({ shooter, from: body, to }) => {
    const from = shooter === g.player.id && muzzle ? muzzle : body; // the investigator's bullet leaves the muzzle, not their chest (round 22)
    tracer.position.set(from.x, from.y, from.z);
    tracer.lookAt(to.x, to.y, to.z);
    tracer.scale.set(1, 1, Math.max(0.01, Math.hypot(to.x - from.x, to.y - from.y, to.z - from.z)));
    tracerUntil = simTime() + FEEDBACK.tracerSeconds;
  });

  function sync(): void {
    for (const [id, model] of g.ecs.c.model) {
      if (views.has(id) || model.startsWith(MODEL_PREFIX) || model.startsWith(FX_PREFIX) || model === SHRINE_MODEL) continue; // roster creatures: creatureViews; bolts, pools and props: fightViews; Elder Signs: signViews
      const figure = buildFigure(model);
      if (figure.rig === 'humanoid') figure.root.add(personShadow(figure.hip)); // what the moon sees of them: one shape, not their twenty parts
      scene.add(figure.root);
      views.set(id, { figure, stride: 0, speed: 0, lastTime: 0, hitAt: -Infinity, blend: createPoseBlend(figure), kneel: 0, act: null, actK: 0 });
    }
    for (const [id, v] of views) {
      if (g.ecs.c.model.has(id)) continue;
      scene.remove(v.figure.root);
      dispose(v.figure);
      views.delete(id);
    }
  }

  /** The lie of the land about a figure standing on it (none on a floor, deck or step: those are level). */
  function groundAbout(root: THREE.Object3D): Ground | undefined {
    const [rx, ry, rz, yaw] = [root.position.x, root.position.y, root.position.z, root.rotation.y];
    if (Math.abs(g.world.ground(rx, rz) - ry) > 0.05) return undefined;
    const [s, c] = [Math.sin(yaw), Math.cos(yaw)];
    return (x, z) => Math.min(0.3, Math.max(-0.3, g.world.ground(rx + x * c + z * s, rz - x * s + z * c) - ry));
  }

  /** One with a chair or a post of their own: they step clear of it as they stand, and the chair and table stay where they were set, whichever way the figure turns. */
  function placeAt(f: Figure, v: View, post: Post): void {
    const up = 1 - Math.min(1, Math.max(0, v.actK));
    const away = post.rise * up * up * (3 - 2 * up);
    const yaw = f.root.rotation.y;
    f.root.position.x += Math.sin(yaw) * away;
    f.root.position.z += Math.cos(yaw) * away;
    const fx = f.fixture;
    if (!fx) return;
    const [dx, dz] = [post.x - f.root.position.x, post.z - f.root.position.z];
    const [s, c] = [f.root.scale, Math.cos(yaw)];
    const sn = Math.sin(yaw);
    fx.position.set((dx * c - dz * sn) / s.x, (g.world.ground(post.x, post.z) - f.root.position.y) / s.y, (dx * sn + dz * c) / s.z);
    fx.rotation.y = wrapAngle(post.yaw - yaw);
    fx.scale.set(1 / s.x, 1 / s.y, 1 / s.z);
  }

  function draw(id: Entity, v: View, alpha: number, time: number): void {
    const tr = g.ecs.c.transform.get(id);
    const f = v.figure;
    f.root.visible = !!tr && !g.ecs.c.dead.has(id);
    if (!tr || !f.root.visible) return;
    const person = g.ecs.c.npc.has(id);
    const a = g.ecs.c.actor.get(id);
    const lerp = (p: number, q: number): number => p + (q - p) * alpha;
    f.root.position.set(lerp(tr.prev.x, tr.pos.x), lerp(tr.prev.y, tr.pos.y), lerp(tr.prev.z, tr.pos.z));
    f.root.rotation.y = tr.prevYaw + wrapAngle(tr.yaw - tr.prevYaw) * alpha;
    if (a && a.hitstop > 0) {
      f.root.position.x += (Math.random() - 0.5) * FEEDBACK.shakeMetres * FEEL.shake;
      f.root.position.z += (Math.random() - 0.5) * FEEDBACK.shakeMetres * FEEL.shake;
    }
    const post = person ? ACTS[g.ecs.c.npc.get(id) ?? '']?.post : undefined; // one with a chair or a post of their own
    if (post) placeAt(f, v, post);
    const dt = Math.min(0.1, Math.max(0, time - v.lastTime));
    v.speed += (Math.hypot(tr.pos.x - tr.prev.x, tr.pos.z - tr.prev.z) * SIM.hz - v.speed) * Math.min(1, dt * FEEDBACK.strideEase);
    v.stride += 2 * Math.PI * cadence(v.speed) * dt;
    v.lastTime = time;
    const speed = v.speed;

    const def = a ? moveDef(a) : undefined;
    const frame = a && def ? Math.min(a.frame + (a.hitstop > 0 ? 0 : alpha), def.frames - 1) : 0;
    const rollYaw = a && def?.motion?.dir === 'input' ? wrapAngle(yawOf(a.dir.x, a.dir.z) - tr.yaw) : 0;
    const since = time - v.hitAt;
    const flinch = Math.max(0, 1 - since / FEEDBACK.flinchSeconds);
    const [move, guard] = [a?.move ?? null, a?.guard ?? false];
    v.blend.watch(move, guard, time);
    const kneeling = id === g.player.id && !!g.player.kneeling;
    if (kneeling) rising = null;
    if (id === g.player.id && rising) {
      rising.at ??= time;
      const u = (time - rising.at) / rising.seconds; // a rise of its own length, whatever the frame rate: the pose stages its parts (poses.ts)
      v.kneel = Math.min(v.kneel, 1 - Math.min(1, Math.max(0, u)));
      if (u >= 1) rising = null;
    } else v.kneel += ((kneeling ? 1 : 0) - v.kneel) * Math.min(1, dt * 3);
    if (v.kneel < 0.004 && !kneeling) v.kneel = 0; // up: the walk is the walk's again
    let act: { kind: ActKind; k: number } | undefined;
    if (person) { // sitting down to it, standing up from it, as they take it up and put it down (round 39)
      const doing = actOf(g, id);
      if (doing) v.act = doing;
      v.actK += ((doing ? 1 : 0) - v.actK) * Math.min(1, dt * 2.2);
      if (!doing && v.actK < 0.004) [v.actK, v.act] = [0, null];
      if (v.act && v.actK > 0) act = { kind: v.act, k: v.actK };
    }
    pose(f, { move, def, frame, speed, stride: v.stride, guard, flinch, rollYaw, time: person ? time + id * 1.7 : time, ground: groundAbout(f.root), kneel: v.kneel, act });
    if (f.pipe && f.mouth && v.act === 'lounge' && v.actK > 0.6) { // a smoker at his pipe: the smoke is drawn from it (pipeSmoke.ts)
      f.root.updateMatrixWorld(true);
      const beat = pipeBeat(time + id * 1.7);
      smokers.push({ bowl: f.pipe.getWorldPosition(new THREE.Vector3()), mouth: f.mouth.getWorldPosition(new THREE.Vector3()), out: beat.out * v.actK, draw: beat.draw * v.actK });
    }
    v.blend.apply(time);
    if (f.arms && id === g.player.id) for (const [w, m] of Object.entries(f.arms)) m.visible = w === g.player.weapon; // the weapon in hand
    if (f.gun && id === g.player.id) {
      const drawn = move === 'shoot' || move === 'reload'; // the revolver comes out of its holster for a shot or a reload, and goes back (round 22)
      f.gun.visible = drawn;
      if (f.holstered) f.holstered.visible = !drawn;
    }
    const flash = id === g.player.id ? 0 : FEEDBACK.flashLevel * Math.max(0, 1 - since / FEEDBACK.flashSeconds); // the investigator never blinks (hurtFx.ts)
    for (const m of f.materials) m.uniforms.uEmissive.value = (m.userData.emissive as number) + flash;
    if (f.rig === 'echo') glow = glowAt.set(f.root.position.x, f.root.position.y + FEEDBACK.echoGlowHeight, f.root.position.z);
    if (f.flame && id === g.player.id) flame = f.flame.getWorldPosition(flameAt); // posed: it tumbles with a roll
    if (f.flash && id === g.player.id) muzzle = f.flash.getWorldPosition(muzzleAt); // the barrel's tip, wherever the arm has it
  }

  return {
    rise(seconds) {
      rising = seconds > 0 ? { seconds, at: null } : null;
    },
    get smokers() {
      return smokers;
    },
    get glow() {
      return glow;
    },
    get flame() {
      return flame;
    },
    get muzzle() {
      return muzzle;
    },
    update(alpha, time) {
      sync();
      smokers = [];
      glow = null;
      flame = null;
      muzzle = null;
      for (const [id, v] of views) draw(id, v, alpha, time);
      tracer.visible = time < tracerUntil;
    },
  };
}
