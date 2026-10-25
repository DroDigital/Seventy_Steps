/**
 * Draws every entity that has a `model` as a primitive figure: interpolated transforms, procedural
 * poses eased into one another (poseBlend.ts), hitstop shake, hit flashes, and the revolver's tracer.
 * Read-only on the simulation.
 */

import * as THREE from 'three';
import type { Entity } from '../core/ecs';
import { wrapAngle, yawOf } from '../core/geom';
import { SWING_TRAIL } from '../data/fxTuning';
import { FEEDBACK, SIM } from '../data/tuning';
import { moveDef } from '../systems/actions';
import { hourOf, phaseOf } from '../systems/clock';
import type { Game } from '../systems/components';
import { MODEL_PREFIX } from '../systems/creatures';
import { buildFigure, type Figure } from './figures';
import { livePerson, newLife, type Life, type Standing } from './personLife';
import { edgeOf } from './swingTrails';
import { ACTS, type ActKind, type Post } from '../data/npcActs';
import { pipeBeat } from './npcActs';
import type { Smoker } from './pipeSmoke';
import { actOf } from '../systems/npcLife';
import { stockLeft } from '../systems/trade';
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
import { createMountViews } from './mountViews';
import { lightFlame } from './lantern';
import { lanternGain } from './lanternLife';

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
  life: Life; // what a person has that moves of itself: the head, the cloth, the eyes (personLife.ts; round 83)
  drawnUntil: number; // the investigator's sword-cane stays drawn until this sim time (a blow draws it)
}

export interface ActorViews {
  /** `sheltered`: the camera is under a roof, where there is no breeze to stir a person's cloth. */
  update(alpha: number, time: number, sheltered?: boolean): void;
  /** The investigator, up from the knee, takes `seconds` over it (a cutscene's slow rise); otherwise they rise as fast as they move. */
  rise(seconds: number): void;
  /** The smokers at their pipes this frame (render/pipeSmoke.ts draws the smoke). */
  readonly smokers: readonly Smoker[];
  /** Where the glow light sits this frame (the Echo drop), or null. */
  readonly glow: THREE.Vector3 | null;
  /** Where the investigator's lantern flame is drawn this frame, or null while they are not. */
  readonly flame: THREE.Vector3 | null;
  /** How much of the lantern's halo, seen from `eye`, the seat back of the rig being ridden takes, 0 to 1. */
  flameCover(eye: THREE.Vector3): number;
  /** Where the muzzle of the investigator's revolver is this frame (posed, drawn or not), or null while they are not drawn. */
  readonly muzzle: THREE.Vector3 | null;
  /** The edge of the investigator's weapon in the world while a blow is cutting: its point and a point back along it; null the rest of the time (swingTrails.ts). */
  readonly swingEdge: { tip: THREE.Vector3; base: THREE.Vector3 } | null;
}

function dispose(f: Figure): void {
  f.root.traverse((o) => {
    if (o instanceof THREE.Mesh) o.geometry.dispose();
  });
  for (const m of f.materials) m.dispose();
}

export function createActorViews(scene: THREE.Scene, g: Game): ActorViews {
  const views = new Map<Entity, View>();
  const mounts = createMountViews(scene, g);
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
  const edgeAt = { tip: new THREE.Vector3(), base: new THREE.Vector3() };
  let swingEdge: typeof edgeAt | null = null;
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
      if (figure.rig === 'humanoid') figure.root.add(personShadow(figure.hip, id !== g.player.id)); // what the moon sees of them: one shape, not their twenty parts (and the lantern, for all but the one who carries it)
      scene.add(figure.root);
      views.set(id, { figure, stride: 0, speed: 0, lastTime: 0, hitAt: -Infinity, blend: createPoseBlend(figure), kneel: 0, act: null, actK: 0, life: newLife(), drawnUntil: -Infinity });
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

  let sheltered = false;
  const standing: Standing = { id: 0, dt: 0, time: 0, speed: 0, y: 0, free: 0, me: null, sheltered: false, dozing: false, stock: (ware) => stockLeft(g, ware) };

  function draw(id: Entity, v: View, alpha: number, time: number): void {
    const tr = g.ecs.c.transform.get(id);
    const f = v.figure;
    f.root.visible = !!tr && !g.ecs.c.dead.has(id);
    if (!tr || !f.root.visible) return;
    const person = g.ecs.c.npc.has(id);
    const a = g.ecs.c.actor.get(id);
    const lerp = (p: number, q: number): number => p + (q - p) * alpha;
    f.root.position.set(lerp(tr.prev.x, tr.pos.x), lerp(tr.prev.y, tr.pos.y), lerp(tr.prev.z, tr.pos.z));
    f.root.rotation.set(0, tr.prevYaw + wrapAngle(tr.yaw - tr.prevYaw) * alpha, 0);
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
    const falling = id === g.player.id && move !== 'death' ? g.player.falling : null; // over an edge, before the death at the foot of it (round 54)
    const water = falling?.water;
    const drop = falling ? { t: (falling.frame + alpha) / SIM.hz, spin: falling.spin, sea: water ? { since: water.entered < 0 ? -1 : (falling.frame + alpha - water.entered) / SIM.hz, held: water.grab < 0 ? 0 : (falling.frame + alpha - water.grab) / SIM.hz } : undefined } : undefined;
    pose(f, { move, def, frame, speed, stride: v.stride, guard, flinch, rollYaw, time: person ? time + id * 1.7 : time, ground: groundAbout(f.root), kneel: v.kneel, act, drop, weapon: id === g.player.id ? g.player.weapon : undefined });
    if (f.pipe && f.mouth && v.act === 'lounge' && v.actK > 0.6) { // a smoker at his pipe: the smoke is drawn from it (pipeSmoke.ts)
      f.root.updateMatrixWorld(true);
      const beat = pipeBeat(time + id * 1.7);
      smokers.push({ bowl: f.pipe.getWorldPosition(new THREE.Vector3()), mouth: f.mouth.getWorldPosition(new THREE.Vector3()), out: beat.out * v.actK, draw: beat.draw * v.actK });
    }
    v.blend.apply(time);
    if (f.arms && id === g.player.id) { // the weapon in hand: the sword-cane's blade is drawn for a blow and sheathed a little after (his clips say when: playerPose.ts)
      if (f.held?.drawn) v.drawnUntil = time + 0.7;
      const shown = g.player.weapon === 'cane' && time < v.drawnUntil ? 'cane_drawn' : g.player.weapon;
      for (const [w, m] of Object.entries(f.arms)) m.visible = w === shown;
    }
    if (f.props && id === g.player.id) for (const [name, m] of Object.entries(f.props)) m.visible = !!f.held?.props.includes(name); // what the off-hand takes up
    if (f.gun && id === g.player.id) {
      const drawn = f.held ? f.held.props.includes('gun') : move === 'shoot' || move === 'reload'; // (his clips say when: playerPose.ts) the revolver comes out of its holster for a shot or a reload, and goes back (round 22)
      f.gun.visible = drawn;
      if (f.holstered) f.holstered.visible = !drawn;
    }
    if (id === g.player.id) mounts.place(f, time, dt, alpha);
    const flash = id === g.player.id ? 0 : FEEDBACK.flashLevel * Math.max(0, 1 - since / FEEDBACK.flashSeconds); // the investigator never blinks (hurtFx.ts)
    for (const m of f.materials) m.uniforms.uEmissive.value = (m.userData.emissive as number) + flash;
    if (f.rig === 'echo') glow = glowAt.set(f.root.position.x, f.root.position.y + FEEDBACK.echoGlowHeight, f.root.position.z);
    if (f.flame && id === g.player.id) flame = f.flame.getWorldPosition(flameAt); // posed: it tumbles with a roll
    if (f.flameMesh && id === g.player.id) lightFlame(f.flameMesh, lanternGain(g, alpha));
    if (f.flash && id === g.player.id) muzzle = f.flash.getWorldPosition(muzzleAt); // the barrel's tip, wherever the arm has it
    if (person) {
      const me = g.ecs.c.transform.get(g.player.id);
      const free = (1 - Math.min(1, Math.max(0, v.actK))) * (flinch > 0 ? 0 : 1) * (g.player.mount.active || g.player.falling ? 0 : 1);
      standing.id = id;
      standing.dt = dt;
      standing.time = time;
      standing.speed = speed;
      standing.y = tr.pos.y;
      standing.free = free;
      standing.me = me?.pos ?? null;
      standing.sheltered = sheltered;
      standing.dozing = !post && !v.act && !!g.overworld && hourOf(phaseOf(simTime())) === 'waning'; // (the last hour is dozing on their feet: systems/npcLife.ts)
      livePerson(f, v.life, standing);
    }
    if (id === g.player.id && a && def?.hit) {
      const [from, to] = def.hit.window; // a blow cutting: its edge is followed from just before the first frame it can hit to just after the last
      const weapon = f.arms && (Object.values(f.arms).find((m) => m.visible) as THREE.Mesh | undefined); // the one in hand, whichever of its forms is shown
      if (weapon && frame >= from - SWING_TRAIL.lead && frame < to + SWING_TRAIL.tail) {
        f.root.updateMatrixWorld(true);
        const { tip, base } = edgeOf(weapon);
        swingEdge = { tip: weapon.localToWorld(edgeAt.tip.copy(tip)), base: weapon.localToWorld(edgeAt.base.copy(base)) };
      }
    }
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
    get swingEdge() {
      return swingEdge;
    },
    flameCover(eye) {
      return flame ? mounts.cover(eye, flame) : 0;
    },
    update(alpha, time, shelter = false) {
      sheltered = shelter;
      sync();
      smokers = [];
      glow = null;
      flame = null;
      muzzle = null;
      swingEdge = null;
      for (const [id, v] of views) draw(id, v, alpha, time);
      tracer.visible = time < tracerUntil;
    },
  };
}
