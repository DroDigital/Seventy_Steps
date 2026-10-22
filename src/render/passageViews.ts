/**
 * A secret passage drawn and moved (round 61; systems/passages.ts says when it opens, render/passageShapes.ts has its shapes).
 * A doorway: a wall until the mind can see it; then its frame stands about the wall, its runes glowing faintly and an outline of the
 * door on the slab, which is the passage awake and shut; and as the investigator comes near the runes flare, the slab draws aside into
 * the wall, grinding, and dust comes down from the edge it clears. A bridge: nothing, the gap, until the mind can see it; then, as the
 * investigator comes near, its slabs rise out of the dark across the gap one after another from the near brink, each flaring as it
 * is set and giving up a mote of light. The sound is a heavy stone door's (data/doorSounds.ts), made for the seconds the passage takes.
 * Render only: it reads `Layer.open` and the layer's `shown`.
 */

import * as THREE from 'three';
import type { Entity } from '../core/ecs';
import type { HiddenPieceDef } from '../data/arena';
import { stepKey } from '../data/discoveries';
import { DISCOVERIES } from '../data/discoveriesAll';
import type { DoorLook } from '../data/doors';
import { DOOR_GAIN, doorSound } from '../data/doorSounds';
import { FEEDBACK, PASSAGE } from '../data/tuning';
import type { Game } from '../systems/components';
import { passageKind, secondsOf } from '../systems/passages';
import type { GameAudio } from './audio/gameAudio';
import { ANOMALY, type Rgb } from './palette';
import { bridgeKit, doorKit } from './passageShapes';
import type { Particles } from './particles';
import { createWorldMaterial } from './worldMaterial';

export interface PassageView {
  /** `seconds`: the render clock; `dt`: what has gone since the last call. */
  update(seconds: number, dt: number): void;
  /** The simulation says it has begun to open: its sound, and, for a bridge, the brink it forms from. */
  begin(): void;
}

const SLAB: DoorLook = { kind: 'slab', tone: [0.6, 0.6, 0.58], trim: [0.3, 0.3, 0.3], slide: true, ajar: 0, creak: 'rumble' }; // the sound is a stone door's that goes into the wall
const DUST: Rgb = [0.62, 0.6, 0.56];
const GRIT: Rgb = [0.3, 0.29, 0.28];
const RANGE = 26; // metres a passage is heard from

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));
const smooth = (a: number, b: number, v: number): number => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
/** A steady pseudo-random 0..1 per flicker tick. */
const coin = (tick: number): number => {
  const s = Math.sin(tick * 91.7) * 43758.5453;
  return s - Math.floor(s);
};

const glowMaterial = (): THREE.ShaderMaterial => createWorldMaterial({ texture: 'stone', seed: 5, emissive: 0, vertexColors: true });
const setGlow = (m: THREE.ShaderMaterial, v: number): void => void (m.uniforms.uEmissive.value = v);

export function createPassageView(scene: THREE.Scene, g: Game, id: Entity, def: HiddenPieceDef, fx: { audio: GameAudio; particles: Particles }): PassageView {
  const kind = passageKind(def);
  const spot = def.door ?? def.bridge!;
  const group = new THREE.Group();
  group.position.set(def.x, spot.y, def.z);
  group.rotation.y = spot.alongX ? 0 : Math.PI / 2; // local x runs along the wall, or the bridge
  scene.add(group);
  const layer = (): NonNullable<ReturnType<Game['ecs']['c']['layer']['get']>> => g.ecs.c.layer.get(id)!;
  const seconds = secondsOf(def);
  const phase = (def.x * 0.37 + def.z * 0.61) % 6.28;
  let [k, shown, since, grit] = [layer().open, layer().shown, -Infinity, 0];

  const dust = (u: number, height: number, thick: number): void => { // dust and chips fall from the edge the slab clears
    const base = group.localToWorld(new THREE.Vector3(u, 0, 0));
    const floor = g.world.ground(base.x, base.z);
    for (let i = 0; i < 2; i++) {
      const at = group.localToWorld(new THREE.Vector3(u, 0.1 + Math.random() * height, (Math.random() - 0.5) * thick));
      fx.particles.spawn({ x: at.x, y: at.y, z: at.z, vx: (Math.random() - 0.5) * 0.5, vy: 0.05 + Math.random() * 0.3, vz: (Math.random() - 0.5) * 0.5, life: 0.9 + Math.random() * 0.8, size: 0.14 + Math.random() * 0.2, grow: 2.4, color: DUST, alpha: 0.5, drag: 1.4, floor });
    }
    if (Math.random() < 0.5) {
      const at = group.localToWorld(new THREE.Vector3(u, height * Math.random(), 0));
      fx.particles.spawn({ x: at.x, y: at.y, z: at.z, vx: (Math.random() - 0.5) * 0.6, vy: 0, vz: (Math.random() - 0.5) * 0.6, life: 1.2, size: 0.045, color: GRIT, gravity: 7, drag: 0.4, floor });
    }
  };

  const sound = (): void => {
    const at = { x: def.x, y: g.world.ground(def.x, def.z) + 1, z: def.z };
    const made = doorSound(SLAB, seconds, false, Math.random);
    const gain = DOOR_GAIN.grind * (kind === 'bridge' ? 0.8 : 1);
    const key = `passage:${kind}`;
    fx.audio.recipe(key, made.sound, { at, range: RANGE, gain, vary: 0.5, fit: seconds });
    if (!fx.audio.recordedFor(key)) for (const u of made.under) fx.audio.sampleAt(u.set, at, { gain: u.gain * gain, pitch: u.pitch, range: RANGE, delay: u.at });
  };

  /** The frame and the slab flicker between there and not there as the mind gains or loses what shows them, as every hidden thing does. */
  const flicker = (now: number, on: boolean): number => {
    if (on !== shown) [shown, since] = [on, now];
    const t = (now - since) / FEEDBACK.revealSeconds;
    return t >= 1 ? (on ? 1 : 0) : coin(Math.floor(now * 24)) < (on ? t : 1 - t) ? 1 : 0;
  };

  const gate = def.minFound; // a house's gate (round 63): shut until its horror is found, and drawn as a door from the first
  const answered = (): number => { // the share of its discovery's acts that are done
    const d = gate === undefined ? undefined : DISCOVERIES[gate];
    return d ? d.steps.filter((_, i) => g.overworld?.told.has(stepKey(gate!, i))).length / d.steps.length : 0;
  };

  if (def.door) {
    const kit = doorKit(def);
    const [wall, stoneMat, frameGlow, slabGlow] = [createWorldMaterial({ texture: 'stone', seed: 8, vertexColors: true }), createWorldMaterial({ texture: 'stone', seed: 5, emissive: 0.2, vertexColors: true }), glowMaterial(), glowMaterial()];
    const frame = new THREE.Group();
    frame.add(new THREE.Mesh(kit.stone, stoneMat), new THREE.Mesh(kit.glow, frameGlow));
    const slab = new THREE.Group();
    slab.add(new THREE.Mesh(kit.slab, wall));
    const outline = new THREE.Mesh(kit.slabGlow, slabGlow);
    slab.add(outline);
    group.add(frame, slab);
    return {
      begin: sound,
      update(now, dt) {
        const l = layer();
        k += (l.open - k) * Math.min(1, dt * 18);
        if (Math.abs(l.open - k) < 0.002) k = l.open;
        frame.visible = gate !== undefined || flicker(now, l.shown) > 0; // a house's gate is always there to be seen (round 63)
        const awake = gate !== undefined ? (l.shown ? 1 : 0.3 + 0.4 * answered()) : l.shown ? 1 : 0; // and the more of its acts are done, the brighter its runes burn
        const pulse = 0.5 + 0.5 * Math.sin(now * 1.7 + phase);
        const flare = k > 0 ? Math.sin(Math.PI * clamp01(k / 0.45)) : 0; // the runes flare as it wakes
        setGlow(frameGlow, awake * (0.55 + 0.12 * pulse + 0.9 * flare + 0.2 * smooth(0.4, 0.8, k)));
        setGlow(slabGlow, awake * (0.5 + 0.12 * pulse + 0.8 * flare) * (1 - smooth(0.7, 1, k)));
        outline.visible = (l.shown || gate !== undefined) && k < 0.98; // the faint outline of a door on the wall: the passage awake and shut
        const slide = smooth(0.1, 1, k) * (kit.width + 0.45); // the slab goes into the wall
        slab.position.x = slide;
        slab.scale.z = 1 - 0.1 * smooth(0, 0.08, k); // a little thinner as it goes, so it passes within the wall's faces without fighting them
        slab.visible = k < 0.999;
        if (l.shown && k > 0.12 && k < 0.95) {
          grit += dt;
          while (grit > 0.05) {
            grit -= 0.05;
            dust(slide - kit.width / 2 - 0.1, kit.height, def.door!.thick); // from the edge it clears
          }
        }
      },
    };
  }

  const kit = bridgeKit(def);
  const rank = (i: number, sign: number): number => (sign > 0 ? kit.length - 1 - i : i); // formed from the brink the investigator came from
  let sign = 1;
  const segs = kit.map((s) => {
    const [stoneMat, glowMat] = [createWorldMaterial({ texture: 'stone', seed: 5, emissive: 0.2, vertexColors: true }), glowMaterial()];
    const mesh = new THREE.Group();
    mesh.add(new THREE.Mesh(s.stone, stoneMat), new THREE.Mesh(s.glow, glowMat));
    group.add(mesh);
    return { mesh, stoneMat, glowMat, born: false };
  });
  return {
    begin() {
      const me = g.ecs.c.transform.get(g.player.id)?.pos;
      if (me) sign = group.worldToLocal(new THREE.Vector3(me.x, group.position.y, me.z)).x >= 0 ? 1 : -1; // which brink they stand at: it forms from there
      for (const s of segs) s.born = false;
      sound();
    },
    update(now, dt) {
      const l = layer();
      k += (l.open - k) * Math.min(1, dt * 18);
      if (Math.abs(l.open - k) < 0.002) k = l.open;
      const on = flicker(now, l.shown) > 0 && l.shown;
      const formed = Math.min(1, k / PASSAGE.solidAt);
      segs.forEach((s, i) => {
        const t = clamp01(formed * (kit.length + 2) - rank(i, sign));
        const e = t * t * (3 - 2 * t);
        s.mesh.visible = on && e > 0.01;
        s.mesh.position.y = -0.55 * (1 - e); // it rises out of the dark
        s.stoneMat.uniforms.uGhost.value = 1 - e; // and comes in as a dither
        const settle = smooth(0.4, 1, k);
        setGlow(s.glowMat, 0.35 + 1.6 * Math.sin(Math.PI * e) * (1 - settle) + 0.3 * settle + 0.12 * Math.sin(now * 1.5 + i * 0.7));
        if (!s.born && e > 0.5 && on) { // a mote of light as each is set
          s.born = true;
          const at = group.localToWorld(new THREE.Vector3(kit[i].u, 0.1, 0));
          const hue = ANOMALY[def.glow];
          for (let n = 0; n < 3; n++) fx.particles.spawn({ x: at.x + (Math.random() - 0.5) * 0.6, y: at.y, z: at.z + (Math.random() - 0.5) * 0.6, vy: 0.4 + Math.random() * 0.6, life: 1.2, size: 0.09, color: hue, glow: true, alpha: 0.9, drag: 0.8 });
        }
      });
    },
  };
}
