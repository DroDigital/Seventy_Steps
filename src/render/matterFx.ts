/**
 * The matter of the new attacks (round 70): stars that streak down on their marks and break in gold, lightning that falls from the sky onto
 * its marks, flame that stands up where a line of fire is laid, and the clouds (a toxic bank's bile-green billows, a dreaming bank's violet
 * haze with pale stars adrift in it) with the puff they rise in. The tentacles and the wall of water are meshes of their own
 * (strikeTentacles.ts, surgeView.ts). Render only: it reads the simulation's marks, hazards and events.
 */

import type { V3 } from '../core/geom';
import type { Game } from '../systems/components';
import { creatureOf } from '../systems/creatures';
import { attackLook } from './attackLook';
import type { Beams } from './beams';
import { burst, column, ELEMENTS, flash } from './fxKit';
import type { GroundFx } from './groundFx';
import { boltPath } from './lightningPath';
import { CLOUDS, matterLook } from './matterLook';
import type { Rgb } from './palette';
import type { Particles } from './particles';

const WHITE: Rgb = [1, 1, 1];
const rand = (a: number, b: number): number => a + (b - a) * Math.random();

const PUFF = { toxic: 'spore', dream: 'star' } as const;

export interface MatterFx {
  update(alpha: number): void;
}

export function createMatterFx(g: Game, fx: Particles, ground: GroundFx, beams: Beams): MatterFx {
  const c = g.ecs.c;
  const whoIs = (id: number): string | undefined => creatureOf(g, id)?.id;

  g.events.on('Erupted', ({ at, radius, by, look: kind }) => {
    if (!kind || kind === 'tentacle') return;
    const look = matterLook(attackLook(g, by), kind);
    if (kind === 'star') {
      flash(fx, ELEMENTS.star, at, radius * 1.5, look, 0.8);
      for (let i = 0; i < 10; i++) fx.spawn({ x: at.x, y: at.y + 0.3, z: at.z, vx: rand(-5, 5), vy: rand(2, 7), vz: rand(-5, 5), life: rand(0.4, 0.8), size: rand(0.12, 0.26), color: look.core, colorEnd: look.ember, glow: true, shape: 'spark', gravity: 9, hold: 0.3 });
    } else if (kind === 'flame') {
      column(fx, ELEMENTS.flame, at, radius * 0.7, 3.4, look);
    } else if (kind === 'bolt') {
      const top = { x: at.x + rand(-3, 3), y: at.y + 70, z: at.z + rand(-3, 3) };
      beams.bolt(boltPath(top, at, Math.random, { segments: 14, sway: 5, forks: 2 }), 0.35, 0.4, look.line, WHITE);
      flash(fx, ELEMENTS.star, at, radius * 1.8, look, 0.9);
    }
    ground.scar(at, radius * 1.1, kind === 'flame' ? look.ember : look.line, whoIs(by), kind === 'star' ? 14 : 9);
  });

  g.events.on('Clouded', ({ at, by, kind }) => {
    const look = attackLook(g, by);
    const p = CLOUDS[kind];
    burst(fx, ELEMENTS[PUFF[kind]], at, 2.4, { ...look, line: p.billow[0], ring: p.billow[1], danger: p.billow[0] }, 0.8);
  });

  const tick = { n: 0 };
  return {
    update() {
      tick.n++;
      const me = c.transform.get(g.player.id)?.pos;
      const near = (p: V3, range = 80): boolean => !me || Math.hypot(p.x - me.x, p.z - me.z) < range;
      for (const [e, mk] of c.mark) { // a star comes down its last half-second on a slant, a streak of gold with sparks behind it
        if (mk.look !== 'star' || mk.delay > 30 || mk.delay <= 0) continue;
        const p = c.transform.get(e)?.pos;
        if (!p || !near(p)) continue;
        const look = matterLook(attackLook(g, mk.owner), 'star');
        const a = (e * 2.399) % (Math.PI * 2);
        const h = mk.delay * 1.25; // 75 m/s
        const [ox, oz] = [Math.sin(a) * h * 0.4, Math.cos(a) * h * 0.4];
        fx.spawn({ x: p.x + ox, y: p.y + h, z: p.z + oz, vx: -ox * 60 / h * 0.4, vy: -75, vz: -oz * 60 / h * 0.4, life: 0.12, size: 0.5, color: look.core, colorEnd: look.line, glow: true, shape: 'streak', stretch: 0.2, hold: 0.5 });
        if (tick.n % 2 === 0) fx.spawn({ x: p.x + ox, y: p.y + h, z: p.z + oz, vx: rand(-1, 1), vy: rand(-2, 1), vz: rand(-1, 1), life: 0.35, size: 0.2, color: look.line, colorEnd: look.ember, glow: true, shape: 'spark', hold: 0.2 });
      }
      for (const [e, h] of c.hazard) {
        if (!h.cloud) continue;
        const p = c.transform.get(e)?.pos;
        if (!p || !near(p)) continue;
        const kind = CLOUDS[h.cloud];
        const left = h.total ? Math.min(1, h.life / 40, (h.total - h.life + 1) / 30) : 1; // swells as it rises, thins as it goes
        for (let n = h.radius * h.radius * 0.1 * left; n > 0; n--) { // billows: slow, wide, soft
          if (n < 1 && Math.random() >= n) continue;
          const a = rand(0, Math.PI * 2);
          const d = Math.sqrt(Math.random()) * h.radius * 0.85;
          fx.spawn({ x: p.x + Math.cos(a) * d, y: p.y + rand(0.2, 1.4), z: p.z + Math.sin(a) * d, vx: Math.cos(a + 1.6) * 0.4, vz: Math.sin(a + 1.6) * 0.4, vy: rand(0.2, 0.7), life: rand(1.4, 2.4), size: h.radius * rand(0.5, 0.8), grow: 1.4, color: kind.billow[0], colorEnd: kind.billow[1], shape: 'wisp', alpha: 0.42 * left, drag: 0.6, hold: 0.2, spin: rand(-0.3, 0.3) });
        }
        if (tick.n % 3 === 0) { // motes: bubbles of the poison rising, or pale stars adrift in the haze
          const a = rand(0, Math.PI * 2);
          const d = Math.sqrt(Math.random()) * h.radius;
          fx.spawn({ x: p.x + Math.cos(a) * d, y: p.y + rand(0.1, 1), z: p.z + Math.sin(a) * d, vx: rand(-0.2, 0.2), vy: rand(0.5, 1.4), vz: rand(-0.2, 0.2), life: rand(1, 1.8), size: h.cloud === 'dream' ? 0.16 : 0.1, color: kind.mote, glow: true, shape: h.cloud === 'dream' ? 'spark' : 'disc', alpha: 0.8 * left, spin: rand(-2, 2) });
        }
      }
    },
  };
}
