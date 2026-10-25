/**
 * The weather drawn (round 26; systems/weather.ts has what it is; made fuller in round 52): rain as a few hundred streaks falling in a box about the
 * lens, brighter at the head and fading behind it, the near ones long and the far ones short, slanted by the wind, thickened as the spell comes and goes,
 * and where it lands, a spray of drops and a low puff of mist; a thunderstorm as a heavier rain driven harder; a gale as dust racing past in
 * long strands with leaves tumbling in it; the dream's motes as slow lights rising and drifting; and over all of them, the world drawn in: rain and
 * storm bring the fog's reach down (`weatherHaze`). None under a dungeon's roof, none in the arena. Render only.
 * Round 78: in the matter of each land (data/weatherSkins.ts): on the Mountains a gale is a ground blizzard and a storm a whiteout of driven snow, in
 * Pnakotus a storm is sand on the wind (neither wets the ground), Arkham's gale throws grey ash, Innsmouth's salt spray, and the dream's motes are
 * petals in the Dreamlands. The hub and every realm without a skin are drawn as ever.
 */

import * as THREE from 'three';
import { WEATHER, WORLD } from '../data/tuning';
import { DEFAULT_SKIN, DRIVEN, skinOf, STREAKS, type WeatherSkin } from '../data/weatherSkins';
import type { Game } from '../systems/components';
import type { Weather } from '../systems/weather';
import type { FxParams } from './fx';
import type { Particles } from './particles';
import { wetness } from './wetness';
import { worldUniforms } from './worldMaterial';

const BOX = 15; // metres about the lens the rain falls in
const TOP = 9;
const STRIDE = 0.9; // metres between the splashes of a walk on soaked ground
const DROP: readonly [number, number, number] = [0.72, 0.78, 0.86];
const MIST: readonly [number, number, number] = [0.55, 0.6, 0.68];

const VERT = 'attribute float aShade; varying float vShade; void main() { vShade = aShade; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
const FRAG = 'uniform float uAlpha; uniform vec3 uColor; varying float vShade; void main() { gl_FragColor = vec4(uColor, uAlpha * vShade); }';

/** How many of `max` streaks fall at `amount` of a spell. */
export const streaksAt = (amount: number, max = WEATHER.rain): number => Math.round(max * Math.min(1, Math.max(0, amount)));

/** What the wind does to the rain and the trees at `amount` of a spell of `kind`: how far the fall is blown sideways, how fast the rain falls, how hard the trees bend, and how long a streak is. */
export function windOf(kind: string | undefined, amount: number): { slant: number; fall: number; sway: number; length: number } {
  const a = Math.min(1, Math.max(0, amount));
  if (kind === 'storm') return { slant: 0.2 + 0.3 * a, fall: 15 + 7 * a, sway: 1 + 2.2 * a, length: 0.5 + 0.45 * a };
  if (kind === 'gale') return { slant: 0.12, fall: 15, sway: 1 + 2.4 * a, length: 0.5 };
  if (kind === 'rain') return { slant: 0.18 + 0.06 * a, fall: 15 + 2 * a, sway: 1 + 0.7 * a, length: 0.5 + 0.1 * a };
  return { slant: 0.2, fall: 15, sway: 1, length: 0.5 };
}

/** `windOf` in the land's own matter (round 78): snow and sand are driven harder and lie shorter than rain falls; trees and grass bend as ever. */
export function windOfSkin(skin: WeatherSkin, kind: string | undefined, amount: number): ReturnType<typeof windOf> {
  const base = windOf(kind, amount);
  if (skin.precip === 'rain') return base;
  const driven = DRIVEN[skin.precip][kind === 'gale' ? 'gale' : 'storm'];
  const a = Math.min(1, Math.max(0, amount));
  return { ...base, slant: driven.slant * (0.85 + 0.15 * a), fall: driven.fall, length: driven.length };
}

/** The land the weather is over, set each drawn frame by `createWeatherFx`: the fog's reach in a blizzard or a sandstorm is the land's own. */
const over: { skin: WeatherSkin } = { skin: DEFAULT_SKIN };

/** The fog's reach in rain and storm (and a little in a gale's dust): drawn in as the spell gathers, and open again as it passes. Not under a roof. */
export function weatherHaze(fx: Pick<FxParams, 'fogNear' | 'fogFar'>, w: Pick<Weather, 'kind' | 'amount'> | undefined, hidden: boolean): void {
  const k = w && !hidden ? (over.skin.haze?.[w.kind] ?? WEATHER.haze[w.kind] ?? 0) * Math.min(1, Math.max(0, w.amount)) : 0;
  if (k <= 0) return;
  fx.fogNear *= 1 - 0.8 * k;
  fx.fogFar *= 1 - k;
}

export interface WeatherFx {
  update(camera: THREE.Camera, time: number, hidden: boolean): void;
}

export function createWeatherFx(scene: THREE.Scene, g: Game, particles: Particles): WeatherFx {
  const max = WEATHER.rainStorm;
  const at = new Float32Array(max * 3); // each streak's head
  const near = new Float32Array(max); // 0 far .. 1 near: how long and how bright it is
  const verts = new Float32Array(max * 6);
  const shade = new Float32Array(max * 2);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(verts, 3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('aShade', new THREE.BufferAttribute(shade, 1).setUsage(THREE.DynamicDrawUsage));
  const alpha = { value: 0 };
  const material = new THREE.ShaderMaterial({ uniforms: { uAlpha: alpha, uColor: { value: new THREE.Vector3(0.58, 0.64, 0.72) } }, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false });
  const lines = new THREE.LineSegments(geo, material);
  lines.frustumCulled = false;
  lines.visible = false;
  scene.add(lines);
  let [last, seeded, owed, wet, splashed] = [-1, false, 0, 0, 0];
  let [px, pz, strode] = [NaN, NaN, 0]; // where the investigator was, and how far they have gone since the last splash
  let coloured = DEFAULT_SKIN; // whose lines' colour the lines are drawn in
  const wind = { x: 0.2, z: 0.08 };

  /** `upwind`: driven snow and sand that has left the box sideways comes in again at its windward edge, at any height (rain, which falls out of the bottom, comes in at the top). */
  const seed = (i: number, cam: THREE.Vector3, fresh: boolean, upwind = false): void => {
    at[i * 3] = cam.x + (Math.random() * 2 - 1) * BOX;
    at[i * 3 + 1] = fresh || upwind ? cam.y - 3 + Math.random() * (TOP + 3) : cam.y + TOP * (0.7 + 0.3 * Math.random());
    at[i * 3 + 2] = cam.z + (Math.random() * 2 - 1) * BOX;
    if (upwind) {
      const axis = Math.random() < 0.6 ? 0 : 2;
      at[i * 3 + axis] = (axis === 0 ? cam.x : cam.z) - BOX * 0.98;
    }
    near[i] = Math.random();
  };

  return {
    update(camera, time, hidden) {
      const dt = last < 0 ? 0 : Math.min(0.1, Math.max(0, time - last));
      last = time;
      const w = g.overworld?.weather;
      const amount = !w || hidden ? 0 : w.amount;
      const kind = w?.kind;
      const skin = (over.skin = skinOf(g.overworld?.region)); // (round 78: the land's own matter)
      const blow = windOfSkin(skin, kind, amount);
      worldUniforms.uWind.value = blow.sway; // the trees and the grass bend with it (round 34)
      wind.x = blow.slant;
      wind.z = blow.slant * 0.4;
      const cam = camera.position;
      const rain = (kind === 'rain' || kind === 'storm') && amount > 0;
      const heavy = kind === 'storm';
      const soak = (rain ? Math.min(1, amount * (heavy ? 1.9 : 1.5)) : 0) * skin.wet; // the ground is soaked before the rain is at its fullest (and stays dry under snow and sand)
      const lined = skin.precip === 'rain' ? rain : (rain || (skin.precip === 'snow' && kind === 'gale')) && amount > 0; // what streaks: rain, a blizzard's snow or a sandstorm's sand
      wet = hidden ? 0 : wet + (soak - wet) * Math.min(1, dt * (soak > wet ? WEATHER.soak : WEATHER.dry)); // dry at once under a roof
      wetness.value = wet;
      const me = g.ecs.c.transform.get(g.player.id)?.pos;
      if (me && !hidden) {
        const moved = Number.isNaN(px) ? 0 : Math.hypot(me.x - px, me.z - pz);
        [px, pz, strode] = [me.x, me.z, moved > 3 ? 0 : strode + moved]; // (a leap is not a stride)
        if (strode >= STRIDE && wet > 0.35 && me.y > WORLD.seaLevel) {
          strode = 0;
          for (let k = 0; k < 5; k++) { // a stride on soaked ground throws a few drops
            const a = Math.random() * Math.PI * 2;
            particles.spawn({ x: me.x + Math.sin(a) * 0.15, y: me.y + 0.05, z: me.z + Math.cos(a) * 0.15, vx: Math.sin(a) * (0.6 + Math.random() * 0.8), vy: 1.3 + Math.random() * 1.2, vz: Math.cos(a) * (0.6 + Math.random() * 0.8), life: 0.4, size: 0.07, grow: 0.6, color: DROP, alpha: 0.75 * wet, gravity: 9, drag: 0.5, shape: 'streak', stretch: 0.06 });
          }
        }
      }
      lines.visible = lined;
      if (lined) {
        const loose = skin.precip !== 'rain'; // snow and sand are not rain: no drops where they land, a puff of the land's dust
        if (coloured !== skin) material.uniforms.uColor.value.set(...skin.streak);
        coloured = skin;
        const n = streaksAt(amount, loose ? (skin.precip === 'snow' ? (kind === 'gale' ? STREAKS.snowGale : STREAKS.snowStorm) : STREAKS.sandStorm) : heavy ? WEATHER.rainStorm : WEATHER.rain);
        alpha.value = loose ? 0.4 + 0.3 * amount : (heavy ? 0.3 : 0.22) + 0.3 * amount;
        for (let i = 0; i < max; i++) {
          if (!seeded) seed(i, cam, true);
          else {
            const speed = blow.fall * (0.85 + 0.3 * near[i]!); // the near drops fall a little faster
            at[i * 3] += wind.x * speed * dt;
            at[i * 3 + 1] -= speed * dt;
            at[i * 3 + 2] += wind.z * speed * dt;
            const [dx, dz] = [at[i * 3] - cam.x, at[i * 3 + 2] - cam.z];
            const low = at[i * 3 + 1] < cam.y - 3;
            if (low || Math.abs(dx) > BOX || Math.abs(dz) > BOX) seed(i, cam, false, loose && !low);
          }
          const live = i < n;
          const len = blow.length * (0.5 + 0.9 * near[i]!); // near ones long, far ones short
          const [x, y, z] = [at[i * 3], at[i * 3 + 1], at[i * 3 + 2]];
          verts.set(live ? [x, y, z, x - wind.x * len, y + len, z - wind.z * len] : [0, -999, 0, 0, -999, 0], i * 6);
          shade[i * 2] = 0.55 + 0.45 * near[i]!; // the head is bright...
          shade[i * 2 + 1] = 0.08; // ...and the tail all but gone
        }
        seeded = true;
        geo.attributes.position.needsUpdate = true;
        geo.attributes.aShade.needsUpdate = true;
        // Where it lands: a spray of drops and a low puff of mist, about the lens.
        splashed += dt * (heavy ? 90 : 45) * amount;
        for (; splashed >= 1; splashed--) {
          const [a, r] = [Math.random() * Math.PI * 2, 1 + Math.random() * 13];
          const [x, z] = [cam.x + Math.sin(a) * r, cam.z + Math.cos(a) * r];
          const y = g.world.ground(x, z);
          if (y <= WORLD.seaLevel + 0.1) continue;
          if (!loose) particles.spawn({ x, y: y + 0.03, z, vx: (Math.random() - 0.5) * 0.9, vy: 1.2 + Math.random() * 1.4, vz: (Math.random() - 0.5) * 0.9, life: 0.28, size: 0.05, grow: 0.5, color: DROP, alpha: 0.7, gravity: 9, shape: 'spark', glow: false });
          if (Math.random() < 0.3) particles.spawn({ x, y: y + 0.1, z, vx: loose ? Math.min(wind.x, 4) * 0.8 : 0, vz: loose ? Math.min(wind.z, 4) * 0.8 : 0, vy: 0.2, life: 0.5, size: 0.35, grow: 2.2, color: loose ? skin.cloud : MIST, alpha: loose ? 0.2 : 0.16, shape: 'wisp', drag: 1.5 });
        }
      } else seeded = false;
      if (!w || hidden || amount <= 0 || (kind !== 'gale' && kind !== 'storm' && kind !== 'motes')) return;
      owed += dt * (kind === 'gale' ? 70 : kind === 'storm' ? 30 : 9) * amount; // particles a second
      for (; owed >= 1; owed--) {
        const [a, r] = [Math.random() * Math.PI * 2, 3 + Math.random() * 10];
        const [x, z] = [cam.x + Math.sin(a) * r, cam.z + Math.cos(a) * r];
        const y = g.world.ground(x, z);
        if (kind === 'gale' || kind === 'storm') {
          const roll = Math.random();
          const gust = kind === 'storm' ? 1.3 : 1;
          if (roll < 0.45) { // a long strand of dust racing by
            particles.spawn({ x, y: y + 0.3 + Math.random() * 2.6, z, vx: (11 + Math.random() * 6) * gust, vy: 0.2 + Math.random() * 0.6, vz: (3 + Math.random() * 3) * gust, life: 0.7 + Math.random() * 0.6, size: 0.16, grow: 1, color: skin.dust, alpha: 0.28 * skin.thick, drag: 0.1, shape: 'streak', stretch: 0.13 });
          } else if (roll < 0.8) { // a cloud of it
            particles.spawn({ x, y: y + 0.2 + Math.random() * 2, z, vx: (9 + Math.random() * 5) * gust, vy: 0.3 + Math.random() * 0.8, vz: (3 + Math.random() * 3) * gust, life: 1.1 + Math.random() * 0.8, size: 0.6 + Math.random() * 0.7, grow: 2, color: skin.cloud, alpha: 0.2 * skin.thick, gravity: -0.05, drag: 0.15, shape: 'wisp' });
          } else if (skin.fleck) { // grit, ash, snow or spray: what this land's wind carries in place of a leaf
            const f = skin.fleck;
            particles.spawn({ x, y: y + 0.4 + Math.random() * 2.2, z, vx: (8 + Math.random() * 5) * gust, vy: 0.5 + Math.random() * 1.2, vz: (2 + Math.random() * 3) * gust, life: 1.2 + Math.random() * 0.9, size: f.size * (0.7 + Math.random() * 0.6), grow: 1, color: Math.random() < 0.5 ? f.colors[0] : f.colors[1], alpha: f.alpha, gravity: f.gravity, drag: 0.2, shape: f.shape, spin: (Math.random() - 0.5) * 14 });
          } else { // a leaf, turning
            particles.spawn({ x, y: y + 0.4 + Math.random() * 2.2, z, vx: (8 + Math.random() * 5) * gust, vy: 0.5 + Math.random() * 1.2, vz: (2 + Math.random() * 3) * gust, life: 1.2 + Math.random() * 0.9, size: 0.11, grow: 1, color: Math.random() < 0.5 ? [0.3, 0.22, 0.12] : [0.36, 0.3, 0.14], alpha: 0.85, gravity: 0.6, drag: 0.2, shape: 'shard', spin: (Math.random() - 0.5) * 14 });
          }
        } else {
          const gold = Math.random() < 0.5;
          const m = skin.motes;
          particles.spawn({ x, y: y + 0.4 + Math.random() * 3.5, z, vx: (Math.random() - 0.5) * 0.4, vy: 0.25 + Math.random() * 0.5, vz: (Math.random() - 0.5) * 0.4, life: 4 + Math.random() * 3, size: 0.1 + Math.random() * 0.1, grow: 0.6, color: gold ? m.a : m.b, colorEnd: gold ? m.aEnd : m.bEnd, alpha: 0.85, glow: true, gravity: -0.02, drag: 0.3, shape: Math.random() < 0.3 ? 'spark' : m.petals > 0 && Math.random() < m.petals ? 'petal' : 'wisp', spin: (Math.random() - 0.5) * 1.5, hold: 0.3 });
        }
      }
    },
  };
}
