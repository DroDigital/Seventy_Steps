/**
 * A house's gate drawn and moved (round 76; data/gateStyles.ts says what it is made of, render/gateRig.ts hangs the leaves, systems/passages.ts
 * says when it opens). Shut, its leaves stand in the opening, and as the investigator comes near the runes carved on them flare and each leaf goes
 * its own way as `Layer.open` rises: a swung leaf turns about its hinge into the court's far side, a slid one goes into the wall, a lifted one
 * up and a sunk one down into the ground, with dust where they clear their edge and the sound of the kind of door the style names (data/doors.ts).
 * A row of parts (flutes, trunks) goes one after another, but every part is clear of the way by the time the seal's collider is lifted
 * (`PASSAGE.solidAt`). Render only: it reads `Layer.open` and the layer's `shown`.
 */

import * as THREE from 'three';
import type { Entity } from '../core/ecs';
import type { HiddenPieceDef } from '../data/arena';
import { stepKey } from '../data/discoveries';
import { DISCOVERIES } from '../data/discoveriesAll';
import { DOOR_LOOKS } from '../data/doors';
import { DOOR_GAIN, doorSound, materialOf } from '../data/doorSounds';
import { GATE_STYLES, GATE_TIMING } from '../data/gateStyles';
import type { Game } from '../systems/components';
import { secondsOf } from '../systems/passages';
import { regionAt } from '../world/worldMap';
import type { GameAudio } from './audio/gameAudio';
import { gateRig, type GateRig } from './gateRig';
import { modelsReady } from './modelKit';
import type { Rgb } from './palette';
import type { Particles } from './particles';
import type { PassageView } from './passageViews';
import { propMaterial, regionStone } from './propMeshes';
import { createWorldMaterial } from './worldMaterial';

const DUST: Rgb = [0.62, 0.6, 0.56];
const GRIT: Rgb = [0.3, 0.29, 0.28];
const STONE: Rgb = [0.6, 0.6, 0.58]; // (where the region is unknown)
const RANGE = 26; // metres a gate is heard from

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));
const smooth = (a: number, b: number, v: number): number => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export function createGateView(scene: THREE.Scene, g: Game, id: Entity, def: HiddenPieceDef, fx: { audio: GameAudio; particles: Particles }): PassageView {
  const door = def.door!;
  const style = GATE_STYLES[door.style!]!;
  const group = new THREE.Group();
  group.position.set(def.x, door.y, def.z);
  group.rotation.y = door.alongX ? 0 : Math.PI / 2; // local x runs along the wall; the investigator comes from the side the door's `out` says
  scene.add(group);
  const layer = (): NonNullable<ReturnType<Game['ecs']['c']['layer']['get']>> => g.ecs.c.layer.get(id)!;
  const seconds = secondsOf(def);
  const phase = (def.x * 0.37 + def.z * 0.61) % 6.28;
  const away = -(door.out ?? 1); // which way a leaf swings: from the investigator
  const glowMat = createWorldMaterial({ texture: 'stone', seed: 5, emissive: 0, vertexColors: true });
  const gate = def.minFound;
  let [k, grit, tried] = [layer().open, 0, false];
  let rig: GateRig | null = null;
  const nodes: THREE.Group[] = [];

  /** The leaves, hung once the models are read (the world is built after them; this waits if not). */
  const hang = (): void => {
    if (tried || !modelsReady()) return;
    tried = true;
    const region = regionAt(def.x, def.z);
    rig = gateRig(def, region ? regionStone(region) : STONE);
    for (const p of rig?.parts ?? []) {
      const node = new THREE.Group();
      node.position.set(...p.pivot);
      for (const piece of p.pieces) {
        if (piece.mat === 'leaf' || piece.mat === 'wood' || piece.mat === 'cloth') piece.geo.setAttribute('aSway', new THREE.BufferAttribute(new Float32Array(piece.geo.getAttribute('position').count), 1));
        node.add(new THREE.Mesh(piece.geo, propMaterial(piece.mat)));
      }
      if (p.glow) node.add(new THREE.Mesh(p.glow, glowMat));
      group.add(node);
      nodes.push(node);
    }
  };
  hang();

  const answered = (): number => { // the share of its discovery's acts that are done
    const d = gate === undefined ? undefined : DISCOVERIES[gate];
    return d ? d.steps.filter((_, i) => g.overworld?.told.has(stepKey(gate!, i))).length / d.steps.length : 0;
  };

  const dust = (u: number, height: number, thick: number): void => { // dust and chips fall from the edge a leaf clears
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
    const look = DOOR_LOOKS[style.sound]!;
    const at = { x: def.x, y: g.world.ground(def.x, def.z) + 1, z: def.z };
    const made = doorSound(look, seconds, false, Math.random);
    const gain = DOOR_GAIN[materialOf(look)];
    const key = `passage:${style.sound}`;
    fx.audio.recipe(key, made.sound, { at, range: RANGE, gain, vary: 0.5, fit: seconds });
    if (!fx.audio.recordedFor(key)) for (const u of made.under) fx.audio.sampleAt(u.set, at, { gain: u.gain * gain, pitch: u.pitch, range: RANGE, delay: u.at });
  };

  return {
    begin: sound,
    update(now, dt) {
      hang();
      const l = layer();
      k += (l.open - k) * Math.min(1, dt * 18);
      if (Math.abs(l.open - k) < 0.002) k = l.open;
      const awake = gate !== undefined ? (l.shown ? 1 : 0.3 + 0.4 * answered()) : l.shown ? 1 : 0; // the more of its acts are done, the brighter its runes burn
      const pulse = 0.5 + 0.5 * Math.sin(now * 1.7 + phase);
      const flare = k > 0 ? Math.sin(Math.PI * clamp01(k / 0.45)) : 0; // the runes flare as it wakes
      glowMat.uniforms.uEmissive.value = awake * (0.55 + 0.12 * pulse + 0.9 * flare) * (1 - smooth(0.7, 1, k));
      if (!rig) return;
      const open = (rig.open * Math.PI) / 180;
      const angles: number[] = [];
      rig.parts.forEach((p, i) => {
        const node = nodes[i]!;
        const t0 = GATE_TIMING.start + GATE_TIMING.stagger * p.delay;
        const moved = smooth(t0, p.move === 'swing' || p.move === 'slide' ? 1 : t0 + GATE_TIMING.span, k);
        const dir = p.pivot[0] < 0 ? -1 : 1;
        node.position.set(p.pivot[0] + (p.move === 'slide' ? dir * p.reach * moved : 0), p.pivot[1] + (p.move === 'lift' ? p.reach * moved : p.move === 'sink' ? -p.reach * moved : 0), p.pivot[2]);
        node.rotation.y = p.move === 'swing' ? p.hinge * away * open * moved : 0;
        node.visible = p.move === 'swing' || p.move === 'still' || k < 0.999;
        angles.push(node.rotation.y);
      });
      if (l.shown && k > 0.12 && k < 0.95) {
        grit += dt;
        while (grit > 0.05) {
          grit -= 0.05;
          const i = Math.floor(Math.random() * rig.parts.length);
          const p = rig.parts[i]!;
          if (p.move === 'still') continue;
          const at = nodes[i]!.position.x + (p.move === 'swing' ? -p.hinge * p.width * Math.cos(angles[i]!) : (Math.random() - 0.5) * p.width); // from the free edge of a swung leaf, or across the foot or the mouth of the rest
          dust(at, p.move === 'lift' ? door.height : 0.4, door.thick);
        }
      }
    },
  };
}
