/**
 * What the dungeons' ambushes and drops are heard and seen by (round 127: systems/ambush.ts, systems/drops.ts): a foe lying in wait
 * springs with a rush of air and a scrape out of the dark, and the dust it lay in thrown up about it (its body rises into view as an
 * ambusher's does, render/creatureFx.ts); a body landing off a ledge lands with a thud of its weight on the stone, a scuff, and a puff of
 * the floor's dust. Render only.
 */

import { noise, tone, type Layer } from '../data/sounds';
import type { Game } from '../systems/components';
import type { GameAudio } from './audio/gameAudio';
import type { Particles } from './particles';

/** A foe springing from where it lay: a rush, a scrape, and under them a low thud of its weight. */
const SPRING: Layer[] = [
  noise('bandpass', 700, 0.45, 0.5, { to: 1800, q: 1.1, attack: 0.05 }),
  noise('bandpass', 2400, 0.12, 0.25, { at: 0.08, q: 3 }),
  tone('sine', 62, 0.35, 0.5, { at: 0.05, to: 40, attack: 0.01 }),
];
/** A body landing on stone from a ledge's height. */
const LAND: Layer[] = [
  tone('sine', 70, 0.28, 0.6, { to: 42, attack: 0.005 }),
  noise('lowpass', 600, 0.16, 0.6),
  noise('bandpass', 1500, 0.22, 0.2, { at: 0.04, q: 1.5 }), // the scuff of the boots
];

export function createLurkFx(g: Game, particles: Particles, audio: GameAudio): void {
  let seed = 23;
  const rand = (): number => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const dust = (x: number, y: number, z: number, n: number, out: number): void => {
    for (let i = 0; i < n; i++) {
      const a = rand() * Math.PI * 2;
      const s = out * (0.4 + 0.6 * rand());
      particles.spawn({ x: x + Math.cos(a) * 0.3, y: y + 0.08, z: z + Math.sin(a) * 0.3, vx: Math.cos(a) * s, vy: 0.3 + 0.6 * rand(), vz: Math.sin(a) * s, life: 0.7 + rand() * 0.6, size: 0.25 + rand() * 0.3, grow: 2, color: [0.5, 0.47, 0.43], alpha: 0.38, gravity: -0.2, drag: 1.6, shape: 'wisp' });
    }
  };
  g.events.on('AmbushSprung', (e) => {
    audio.recipe('lurk:spring', SPRING, { at: { x: e.x, y: e.y + 1, z: e.z }, range: 28, gain: 1.4, vary: 0.5 });
    dust(e.x, e.y, e.z, 12, 1.6);
  });
  g.events.on('Dropped', (e) => {
    const k = Math.min(1, e.height / 2.4);
    audio.recipe('lurk:land', LAND, { at: { ...e.at, y: e.at.y + 0.2 }, range: 22, gain: 0.8 + 0.6 * k, vary: 0.4 });
    dust(e.at.x, e.at.y, e.at.z, Math.round(6 + 6 * k), 1.2 + k);
  });
}
