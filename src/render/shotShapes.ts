/**
 * Every shot's body (round 69; data/shotForms.ts) and how it flies: the geometry of each form, and whether it points where it goes,
 * turns over, or spins as it goes, how fast, and how large it is drawn against the bolt's radius. Render only.
 */

import type * as THREE from 'three';
import type { ShotForm } from '../data/shotForms';
import * as cast from './shotShapesCast';
import * as life from './shotShapesLife';
import * as work from './shotShapesWork';

export const SHAPES: Readonly<Record<ShotForm, () => THREE.BufferGeometry>> = {
  shard: life.shard, glob: life.glob,
  fish: life.fish, conch: life.conch, bubbles: life.bubbles, tangle: life.tangle,
  spawn: life.spawn, ooze: life.ooze, eyeglob: life.eyeglob, grub: life.grub, viper: life.viper, fang: life.fang, venom: life.venom, hand: life.hand, pod: life.pod,
  eyeball: life.eyeball, trilobe: life.trilobe, mask: life.mask, skull: life.skull, lens: life.lens,
  orb: cast.orb, globes: cast.globes, pentastar: cast.pentastar, helix: cast.helix, flare: cast.flare, crystal: cast.crystal, crag: cast.crag,
  page: cast.page, dagger: cast.dagger, quill: cast.quill, flask: cast.flask, urn: cast.urn,
  chainlink: work.chainlink, cylinder: work.cylinder, cog: work.cog, coin: work.coin, key: work.key, brand: work.brand,
  crescent: work.crescent, note: work.note, panpipe: work.panpipe, ankh: work.ankh, poppy: work.poppy, sign: work.sign, tablet: work.tablet,
};

/**
 * `point`: nose along its flight, rolling about that line at `rate` rad/s; `tumble`: over and over about a slanting axis;
 * `flip`: end over end, as a coin; `turn`: upright, turning about its own vertical; `float`: upright, drifting round.
 * `size` is its length against the bolt's radius (the old solids were 1.45 radius across).
 */
export interface Flight {
  mode: 'point' | 'tumble' | 'flip' | 'turn' | 'float';
  rate: number;
  size: number;
}

const f = (mode: Flight['mode'], rate: number, size = 1.45): Flight => ({ mode, rate, size });

export const FLIGHT: Readonly<Record<ShotForm, Flight>> = {
  shard: f('tumble', 7), glob: f('float', 1.5),
  fish: f('point', 0, 1.5), conch: f('point', 6, 1.4), bubbles: f('float', 1.2, 1.5), tangle: f('tumble', 2.5, 1.4),
  spawn: f('tumble', 1.6, 1.4), ooze: f('float', 1.6, 1.5), eyeglob: f('float', 1.2, 1.45), grub: f('point', 0, 1.5), viper: f('point', 0, 1.35), fang: f('point', 5, 1.5), venom: f('point', 0, 1.4), hand: f('point', 1.5, 1.5), pod: f('tumble', 2, 1.4),
  eyeball: f('point', 0.8, 1.45), trilobe: f('point', 4.5, 1.4), mask: f('point', 0, 1.5), skull: f('point', 0, 1.45), lens: f('point', 5, 1.4),
  orb: f('tumble', 2.2, 1.45), globes: f('tumble', 2.4, 1.4), pentastar: f('point', 6, 1.4), helix: f('point', 8, 1.35), flare: f('tumble', 5, 1.45), crystal: f('tumble', 4.5, 1.4), crag: f('tumble', 3.2, 1.35),
  page: f('tumble', 5.5, 1.5), dagger: f('point', 1.2, 1.35), quill: f('point', 1.6, 1.25), flask: f('flip', 6, 1.4), urn: f('tumble', 3.2, 1.35),
  chainlink: f('point', 5, 1.4), cylinder: f('flip', 6.5, 1.5), cog: f('point', 8, 1.4), coin: f('flip', 11, 1.5), key: f('point', 4.5, 1.35), brand: f('point', 0, 1.4),
  crescent: f('point', 9, 1.45), note: f('turn', 5, 1.5), panpipe: f('point', 1.2, 1.35), ankh: f('turn', 6, 1.5), poppy: f('point', 2.4, 1.5), sign: f('point', 7, 1.45), tablet: f('tumble', 2.6, 1.4),
};
