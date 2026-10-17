/**
 * What a body meeting the sea throws up (round 55): the crown of spray and the drops flung up and out, falling back by gravity, the foam
 * that spreads from it and settles, rings that go out over the water (render/seaRipples.ts, drawn by the sea's shader); and, while the
 * tentacle has hold of it, bubbles coming up over the body, a boil of foam, and now and then a ring. The sound is gameAudio's. Render only.
 */

import type { V3 } from '../core/geom';
import type { Game } from '../systems/components';
import type { Particles } from './particles';
import { addRipple } from './seaRipples';
import { worldUniforms } from './worldMaterial';

const lerp = (a: number, b: number, k: number): number => a + (b - a) * k;

export interface SplashFx {
  update(time: number): void;
}

export function createSplashFx(g: Game, particles: Particles): SplashFx {
  let seed = 11;
  const rand = (): number => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const clock = (): number => worldUniforms.uTime.value as number;

  function burst(at: V3, size: number, speed: number): void {
    const drops = Math.round(lerp(14, 90, size));
    for (let i = 0; i < drops; i++) { // drops: up and out, by how hard it came
      const a = rand() * Math.PI * 2;
      const out = (0.5 + 2.4 * rand()) * (0.5 + size);
      particles.spawn({ x: at.x + Math.cos(a) * 0.3, y: at.y + 0.05, z: at.z + Math.sin(a) * 0.3, vx: Math.cos(a) * out, vy: (1.8 + 4.2 * rand() * (0.4 + size)) * (0.6 + 0.04 * speed), vz: Math.sin(a) * out, life: 0.8 + rand() * 0.8, size: 0.07 + rand() * 0.16, color: [0.78, 0.87, 0.9], alpha: 0.85, hold: 0.5, gravity: 9.8, drag: 0.15, shape: rand() < 0.4 ? 'streak' : 'disc' });
    }
    const crown = Math.round(lerp(6, 18, size));
    for (let i = 0; i < crown; i++) { // the crown: spray that spreads and rises as foam
      const a = (i / crown) * Math.PI * 2 + rand() * 0.4;
      const out = 1.1 + 1.9 * size + rand() * 0.8;
      particles.spawn({ x: at.x + Math.cos(a) * 0.4, y: at.y + 0.1, z: at.z + Math.sin(a) * 0.4, vx: Math.cos(a) * out, vy: 1.4 + 2.6 * size * rand(), vz: Math.sin(a) * out, life: 0.9 + rand() * 0.5, size: 0.4 + 0.5 * size, grow: 2.4, color: [0.84, 0.9, 0.9], alpha: 0.5, gravity: 5, drag: 0.9, shape: 'wisp' });
    }
    const t = clock();
    addRipple(at.x, at.z, t, 0.7 + 1.1 * size);
    addRipple(at.x, at.z, t + 0.22, 0.45 + 0.6 * size);
  }

  g.events.on('Splash', ({ at, speed, size }) => burst(at, size, speed));
  g.events.on('Seized', ({ at, root }) => {
    const t = clock();
    addRipple(root.x, root.z, t, 0.8); // where it has come up, and where it has hold
    addRipple(at.x, at.z, t + 0.1, 0.6);
    burst({ x: at.x, y: root.y, z: at.z }, 0.35, 3);
  });

  let last = 0;
  let trail = 0;
  return {
    update(time) {
      const f = g.player.falling;
      const w = f?.water;
      if (!f || !w || w.grab < 0) return;
      const tr = g.ecs.c.transform.get(g.player.id)!;
      if (time - last > 0.045) { // bubbles over the body: its breath, coming up
        last = time;
        for (let i = 0; i < 2; i++) {
          const a = rand() * Math.PI * 2;
          particles.spawn({ x: tr.pos.x + Math.cos(a) * 0.35, y: w.surface - 0.05, z: tr.pos.z + Math.sin(a) * 0.35, vx: w.heading.x * 0.6, vy: 0.3 + rand() * 0.5, vz: w.heading.z * 0.6, life: 0.7 + rand() * 0.6, size: 0.07 + rand() * 0.13, color: [0.8, 0.9, 0.92], alpha: 0.7, hold: 0.4, shape: 'ring', thick: 0.35 });
        }
      }
      if (time - trail > 0.3) { // and a ring where it is drawn through the water
        trail = time;
        addRipple(tr.pos.x, tr.pos.z, clock(), 0.45);
      }
    },
  };
}
