/**
 * Cutscenes, played (playtest round 20): a scene (data/cutscenes.ts, its camera planned in
 * cinemaPlan.ts) takes the lens over from the follow camera, blending in and out; the world stands
 * still under it or runs slowed (`step` says whether it takes its step); its beats set off lines,
 * fades, sounds and bursts (ui/cinemaUi.ts, audio, particles). One plays at a time, the rest wait.
 * A key or the pad's A, B or Start skips it (fading to black first); Esc is heard here rather than
 * by the pause menu, and so is the mouse being let go. A scene refused (the setting off) resolves at
 * once, so what follows it, an ending's card, never waits on it.
 */

import { Matrix4, Quaternion, Vector3, type PerspectiveCamera } from 'three';
import { keyLayout } from '../core/bindings';
import type { Entity } from '../core/ecs';
import { clamp, type V3 } from '../core/geom';
import { PAD_BUTTON } from '../core/padMap';
import { activePad } from '../core/pads';
import type { Beat, Scene, Subject } from '../data/cutscenes';
import { CAMERA, SIM } from '../data/tuning';
import { signPlace } from '../systems/checkpoints';
import type { Game } from '../systems/components';
import { fogsAround } from '../systems/fogGates';
import type { CinemaUi } from '../ui/cinemaUi';
import { raycast } from '../world/colliders';
import { yawOfDir } from '../world/worldMap';
import type { GameAudio } from './audio/gameAudio';
import { burst } from './cinemaBursts';
import { fogKeeper } from './cinemaFog';
import { beatsBetween, frameOf, holdOf, keepGrain, sceneLength, shotAt, tremor, type Anchor } from './cinemaPlan';
import type { Particles } from './particles';

const GRACE = 0.6; // seconds before a key skips (the one that began it is not a skip)
const HINT_AT = 1.2; // seconds before the skip hint shows
const SKIP_FADE = 0.4; // to black, then out of the scene
const KEEP = 0.7; // metres the lens keeps off a wall it was pulled in from
const SIGN_HEIGHT = 2.4;
const SKIP_KEYS: ReadonlySet<string> = new Set(['Escape', 'Enter', 'Space', 'NumpadEnter']);
const PAD = PAD_BUTTON;

/** Who the scene is about, besides the investigator: the horror. */
export interface Cast {
  target?: Entity;
}

export interface Cinema {
  /** How tall a creature is as the camera frames it: its drawing's, else its body's. */
  heightOf(e: Entity): number;
  /** Plays a scene; resolves once it has ended or been skipped. Waits for the one playing. */
  play(scene: Scene, cast?: Cast): Promise<void>;
  skip(): void;
  /** A scene is on (its bars are up, the pause menu is held off). */
  readonly active: boolean;
  /** The simulation stands still under it. */
  readonly frozen: boolean;
  /** Which scene is playing ('' when none). */
  readonly sceneId: string;
  /** Seconds into the scene playing (0 when none). */
  readonly time: number;
  /** One fixed step's time: moves the scene on; whether the world takes its step. */
  step(dt: number): boolean;
  /** How far between steps the world is drawn this frame (`blend` when no scene runs). */
  alpha(blend: number): number;
  /** Over the follow camera the frame has placed: the scene's lens, held as firmly as it holds. `blend` is how far into the next step, 0 while the world is held. */
  update(camera: PerspectiveCamera, blend: number): void;
  /** The field of view the frame is drawn at, the scene's blended in over `base`. */
  lensFov(base: number): number;
}

interface Run {
  scene: Scene;
  cast: Cast;
  length: number;
  t: number;
  resolve: () => void;
  skipAt: number | null;
  hinted: boolean;
  credit: number; // slowed time owed to the world
  shakes: { at: number; amount: number; hold: number }[];
}

export interface CinemaOptions {
  enabled: () => boolean;
  /** The investigator gets up from the knee over this many seconds (0: at once); the view draws the slow rise (actorViews.ts). */
  rise?: (seconds: number) => void;
  /** Where a creature's drawing stands above its feet (creatureViews.ts): the camera frames that, not the capsule it is struck by, which for some is a third taller than its picture and for one half as tall. */
  figure?: (e: Entity) => { bottom: number; top: number; rows?: number } | undefined;
}

const [m, q, spin, eye, aim, up] = [new Matrix4(), new Quaternion(), new Quaternion(), new Vector3(), new Vector3(), new Vector3(0, 1, 0)]; // scratch, so a frame allocates nothing

/** How far into a step of the world the scene's picture is: whole while it stands still, the slowed time owed to it when it runs slowly. */
const alphaOf = (r: Run, blend: number): number => (r.scene.sim === 'frozen' ? 1 : Math.min(1, r.credit + blend * (r.scene.slow ?? 0.3)));

export function createCinema(g: Game, ui: CinemaUi, audio: GameAudio, particles: Particles, o: CinemaOptions): Cinema {
  let run: Run | undefined;
  let fov = 60;
  let hold = 0;
  let padDown = new Set<number>();
  const waiting: { scene: Scene; cast: Cast; resolve: () => void }[] = [];

  const anchorOf = (who: Subject, alpha: number): Anchor | null => {
    const c = g.ecs.c;
    if (who === 'sign') {
      const s = g.overworld && signPlace(g.overworld.sign);
      return s ? { x: s.x, y: s.y, z: s.z, yaw: yawOfDir(s.face), height: SIGN_HEIGHT } : null;
    }
    const e = who === 'player' ? g.player.id : run?.cast.target;
    const [tr, body] = e === undefined ? [undefined, undefined] : [c.transform.get(e), c.body.get(e)];
    if (!tr || !body) return null;
    const lerp = (a: number, b: number): number => a + (b - a) * alpha;
    const drawn = who === 'target' ? o.figure?.(e!) : undefined;
    const painted = drawn && drawn.top - drawn.bottom > 0.2 ? drawn : undefined;
    const [lift, height] = painted ? [painted.bottom, painted.top - painted.bottom] : [0, body.height];
    const grain = painted?.rows ? height / painted.rows : undefined; // metres to a pixel of its picture
    return { x: lerp(tr.prev.x, tr.pos.x), y: lerp(tr.prev.y, tr.pos.y) + lift, z: lerp(tr.prev.z, tr.pos.z), yaw: tr.yaw, height, grain };
  };

  const inFog = fogKeeper(); // the lens stays inside the fog the horror's wall made, where the scene is played in one (round 68)
  let pulled = 1; // how much of its line to the head the lens keeps: it is pulled in at once, but lets out slowly (a pop at a wall's edge is a step in the picture)
  let pulledAt = 0;

  /** The lens pulled in along its line to `from` (the head of whoever it circles) short of anything between, and kept above the ground. */
  const clear = (from: V3, pos: V3): V3 => {
    const len = Math.hypot(pos.x - from.x, pos.y - from.y, pos.z - from.z);
    let k = 1;
    if (len > 1e-3) k = clamp(Math.max(raycast(g.world, from, pos) * len - KEEP, Math.min(len, KEEP + 0.5)) / len, 0, 1);
    const now = performance.now();
    const dt = clamp((now - pulledAt) / 1000, 0, 0.1);
    pulledAt = now;
    pulled = k < pulled ? k : pulled + (k - pulled) * (1 - Math.exp(-dt / 0.45));
    k = pulled;
    const x = from.x + (pos.x - from.x) * k;
    const z = from.z + (pos.z - from.z) * k;
    const [y, floor] = [from.y + (pos.y - from.y) * k, g.world.ground(x, z) + CAMERA.clearance + 0.2];
    return { x, y: (y + floor + Math.hypot(y - floor, 0.3)) / 2, z }; // above the ground, by a soft maximum: no kink where the lens rises off it
  };

  const perform = (r: Run, b: Beat): void => {
    if (b.caption) ui.caption(b.caption, b.hold ?? 3);
    if (b.title) ui.title(b.title[0], b.title[1], b.hold ?? 3);
    if (b.fade) ui.fade(b.fade, b.over ?? 1);
    if (b.sound) audio.stinger(b.sound, { gain: b.gain, pitch: b.pitch });
    if (b.set) audio.sample(b.set, { gain: b.gain, pitch: b.pitch });
    if (b.voice) g.events.emit('Said', { speaker: b.voice.by, text: b.voice.text });
    if (b.shake) r.shakes.push({ at: r.t, amount: b.shake, hold: b.hold ?? 1 });
    if (b.rise !== undefined) {
      g.player.kneeling = null;
      o.rise?.(b.rise);
    }
    if (b.kneel) {
      const s = g.overworld && signPlace(g.overworld.sign);
      if (s) g.player.kneeling = { x: s.x, z: s.z };
    }
    if (b.burst) {
      const at = anchorOf(b.burst.on, 1);
      if (at) burst(particles, b.burst.kind, at, at.height, b.burst.count);
    }
  };

  const begin = (scene: Scene, cast: Cast, resolve: () => void): void => {
    const r: Run = { scene, cast, length: sceneLength(scene), t: 0, resolve, skipAt: null, hinted: false, credit: 0, shakes: [] };
    run = r;
    g.cutscene = true;
    g.ecs.c.shove.delete(g.player.id);
    const mover = g.ecs.c.mover.get(g.player.id);
    if (mover) Object.assign(mover, { vx: 0, vz: 0, face: null });
    const tr = g.ecs.c.transform.get(g.player.id);
    if (tr) {
      Object.assign(tr.prev, tr.pos);
      tr.prevYaw = tr.yaw;
    }
    Object.assign(g.player.mount, { speed: 0, yawRate: 0, jam: 0 });
    Object.assign(g.player, { sprinting: false, dodgeHeld: -1, blockHeld: false, blockRaised: false });
    g.player.buffer.action = null;
    pulled = 1;
    inFog.reset();
    ui.bars(true);
    if (scene.dark) ui.fade('black', 0);
    for (const b of beatsBetween(scene, -1, 0)) perform(r, b);
  };

  const finish = (skipped: boolean): void => {
    const r = run;
    if (!r) return;
    run = undefined;
    hold = 0;
    if (skipped && r.scene.beats.some((b) => b.rise !== undefined && b.at > r.t)) g.player.kneeling = null; // skipped before they got up: up now, under the fade
    if (r.scene.beats.some((b) => b.kneel)) g.player.kneeling = null; // knelt in the scene: up when it is over (its end is black, and the card that follows is read standing)
    if (skipped && r.scene.beats.some((b) => b.voice)) g.events.emit('Silenced', {}); // and a line being said is cut off with it
    ui.hint(false);
    ui.clear(0.8);
    if (skipped && !r.scene.shut) ui.fade('clear', 0.5);
    r.resolve();
    if (r.scene.shut) queueMicrotask(() => ui.wipe()); // the ending's card comes up first, out of the black
    const next = waiting.shift();
    if (next) begin(next.scene, next.cast, next.resolve);
    else g.cutscene = false;
  };

  const skip = (): void => {
    if (!run || run.skipAt !== null || run.t < GRACE) return;
    run.skipAt = run.t;
    ui.hint(false);
    ui.fade('black', SKIP_FADE);
  };

  addEventListener(
    'keydown',
    (e) => {
      if (!run || !(SKIP_KEYS.has(e.code) || e.code === keyLayout.interact)) return;
      e.preventDefault();
      e.stopImmediatePropagation(); // the pause menu never hears this Esc
      if (!e.repeat) skip();
    },
    true,
  );
  document.addEventListener('pointerlockchange', () => document.pointerLockElement === null && skip()); // Esc lets the mouse go: that is a skip too

  return {
    play(scene, cast = {}) {
      if (!o.enabled()) return Promise.resolve();
      return new Promise((resolve) => (run ? waiting.push({ scene, cast, resolve }) : begin(scene, cast, resolve)));
    },
    skip,
    heightOf(e) {
      const drawn = o.figure?.(e);
      return drawn && drawn.top - drawn.bottom > 0.2 ? drawn.top - drawn.bottom : g.ecs.c.body.get(e)?.height ?? 2;
    },
    get active() {
      return !!run;
    },
    get frozen() {
      return !!run && run.scene.sim === 'frozen';
    },
    get sceneId() {
      return run?.scene.id ?? '';
    },
    get time() {
      return run?.t ?? 0;
    },
    step(dt) {
      const r = run;
      if (!r) return true;
      const before = r.t;
      r.t += dt;
      for (const b of beatsBetween(r.scene, before, r.t)) perform(r, b);
      if (!r.hinted && r.t > HINT_AT && r.skipAt === null) {
        r.hinted = true;
        ui.hint(true);
      }
      const pad = activePad();
      const down = new Set<number>();
      pad?.buttons.forEach((b, i) => (b.pressed || b.value > 0.5) && down.add(i));
      if ([PAD.a, PAD.b, PAD.start].some((i) => down.has(i) && !padDown.has(i))) skip();
      padDown = down;
      if ((r.skipAt !== null && r.t >= r.skipAt + SKIP_FADE) || r.t >= r.length) {
        finish(r.skipAt !== null);
        return !run || run.scene.sim !== 'frozen'; // a queued frozen scene holds the world from its first step
      }
      if (r.scene.sim === 'frozen') return false;
      r.credit += r.scene.slow ?? 0.3;
      if (r.credit < 1) return false;
      r.credit -= 1;
      return true;
    },
    alpha: (blend) => (run ? alphaOf(run, blend) : blend),
    update(camera, blend) {
      const r = run;
      if (!r) return;
      const t = Math.min(r.length, r.t + (blend * (r.scene.sim === 'slow' ? (r.scene.slow ?? 0.3) : 1)) / SIM.hz);
      const alpha = alphaOf(r, blend);
      const { shot, u } = shotAt(r.scene, t);
      const on = anchorOf(shot.on, alpha) ?? anchorOf('player', alpha);
      if (!on) return;
      const other = anchorOf(shot.on === 'target' ? 'player' : shot.on === 'player' ? 'target' : 'player', alpha);
      const opposite = other && other !== on ? other : null;
      const f = keepGrain(frameOf(shot, u, on, opposite, t, shot.aim === 'sign' ? anchorOf('sign', alpha) : null), shot.aim === 'other' ? opposite?.grain : shot.aim === 'sign' ? undefined : on.grain); // a coarse picture is not looked at from nearer than its pixels allow
      let shake = 0;
      for (const s of r.shakes) shake += tremor(s.amount, t - s.at, s.hold);
      const wobble = (k: number): number => Math.sin(t * k) * Math.cos(t * (k * 0.53 + 3));
      const from = shot.on === 'sign' ? anchorOf('player', alpha) ?? on : on; // (the Elder Sign is a solid: a line drawn from inside it would be stopped at once and the lens drawn in against it; it is kept clear of walls from the investigator's head instead)
      const head = { x: from.x, y: from.y + from.height * 0.85, z: from.z };
      const wanted = { x: f.pos.x + wobble(71) * shake, y: f.pos.y + wobble(59) * shake, z: f.pos.z + wobble(83) * shake };
      const inside = inFog(fogsAround(g, from), { on, head, toward: opposite, pos: wanted, turn: shot.on === 'player' });
      const pos = clear(head, inside);
      hold = holdOf(r.scene, t, r.length);
      fov = f.fov;
      eye.set(pos.x, pos.y, pos.z);
      m.lookAt(eye, aim.set(f.look.x, f.look.y, f.look.z), up);
      q.setFromRotationMatrix(m);
      if (f.roll) q.multiply(spin.set(0, 0, Math.sin(f.roll / 2), Math.cos(f.roll / 2)));
      camera.position.lerp(eye, hold);
      camera.quaternion.slerp(q, hold);
    },
    lensFov: (base) => (run ? base + (fov - base) * hold : base),
  };
}
