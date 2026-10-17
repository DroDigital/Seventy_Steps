/**
 * The boss attacks' particles (render only, spec §3E): marked ground bubbling before it bursts and
 * the burst itself, a quake's dust front racing out, bolts' glowing trails, motes drawn into a
 * vortex, sparks where a sweeping beam strikes, a teleport's implosion and arrival, a summoning's
 * rising motes, darkness pouring off its caller, and the shudder of a boss entering a new phase.
 * The paths are the same for every horror; the colours are that horror's. Read-only on the simulation.
 */

import type { V3 } from '../core/geom';
import { moveDef } from '../systems/actions';
import { isAbsent, type Game } from '../systems/components';
import { creatureOf } from '../systems/creatures';
import { beamLine } from '../systems/strikes';
import { attackTheme, DEFAULT_ATTACK_THEME, SMOKE } from './attackTheme';
import { ANOMALY, scaleRgb, type Rgb } from './palette';
import { shotLook } from './shotLook';
import type { Particles } from './particles';

export interface AttackFx {
  update(alpha: number): void;
}

const rand = (a: number, b: number): number => a + (b - a) * Math.random();

export function createAttackFx(g: Game, fx: Particles): AttackFx {
  const c = g.ecs.c;
  const burst = (at: V3, n: number, color: Rgb, speed: number, glow: boolean, size = 0.14, up = 2): void => {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2);
      const s = speed * rand(0.4, 1);
      fx.spawn({ x: at.x, y: at.y + 0.2, z: at.z, vx: Math.cos(a) * s, vy: rand(0.3, 1) * up, vz: Math.sin(a) * s, life: rand(0.4, 0.9), size, grow: glow ? 0.5 : 2.4, color, glow, alpha: glow ? 1 : 0.7, drag: 2.2, gravity: glow ? 0 : 2 });
    }
  };
  const bodyAt = (id: number): V3 | undefined => {
    const p = c.transform.get(id)?.pos;
    return p && { x: p.x, y: p.y + (c.body.get(id)?.aimHeight ?? 1.2) * 0.8, z: p.z };
  };
  const paint = (id: number): AttackThemeColors => {
    const theme = attackTheme(g, id);
    if (theme === DEFAULT_ATTACK_THEME) return { hot: theme.danger, dust: theme.ring, mind: theme.mind, smoke: SMOKE, summon: ANOMALY.green }; // (an unthemed summoner's burst is the old green)
    return { hot: theme.danger, dust: theme.ring, mind: theme.mind, smoke: scaleRgb(theme.danger, 0.45), summon: theme.line };
  };

  g.events.on('Erupted', ({ at, radius, by }) => {
    const { hot, dust } = paint(by);
    burst(at, 18, hot, 1.2 * radius, true, 0.16, 4.5);
    burst(at, 14, dust, 2.2 * radius, false, 0.4, 1);
  });
  g.events.on('Quaked', ({ at, by }) => burst(at, 20, paint(by).dust, 5, false, 0.5, 0.8));
  g.events.on('Teleported', ({ entity, from, to }) => {
    const { mind } = paint(entity);
    burst({ ...from, y: from.y + 1 }, 16, mind, 2.5, true, 0.12, 1.5);
    burst({ ...to, y: to.y + 1 }, 22, mind, 3.5, true, 0.12, 2);
  });
  g.events.on('Summoned', ({ entity, by }) => {
    const p = c.transform.get(entity)?.pos;
    if (p) burst(p, 20, paint(by).summon, 1.2, true, 0.1, 3);
  });
  g.events.on('Darkened', ({ by }) => {
    const p = bodyAt(by);
    if (p) burst(p, 30, paint(by).smoke, 3.5, false, 0.9, 1);
  });
  g.events.on('GazeBurst', ({ by }) => {
    const p = bodyAt(g.player.id);
    if (p) burst(p, 14, paint(by).mind, 1.5, true, 0.08, 1); // the gazer's own colour, as its lane was drawn
  });
  g.events.on('BossPhase', ({ entity, phase }) => {
    const p = c.transform.get(entity)?.pos;
    if (!p || phase === 0) return;
    const r = c.body.get(entity)?.radius ?? 0.5;
    const { hot, dust } = paint(entity);
    burst(p, 40, hot, 3 + r * 2, true, 0.18, 3);
    burst(p, 24, dust, 4 + r * 2, false, 0.7, 1);
  });

  let tick = 0;
  return {
    update(alpha) {
      tick++;
      if (tick % 2 === 0) {
        for (const [e, b] of c.bolt) {
          const p = c.transform.get(e)!;
          const x = p.prev.x + (p.pos.x - p.prev.x) * alpha;
          const y = p.prev.y + (p.pos.y - p.prev.y) * alpha;
          const z = p.prev.z + (p.pos.z - p.prev.z) * alpha;
          const look = shotLook(creatureOf(g, b.owner)?.id, b.lob);
          const fat = look.form === 'orb';
          fx.spawn({ x, y, z, life: 0.28, size: b.radius * (fat ? 1.2 : 0.38), grow: fat ? 0.3 : 0.06, color: b.conjured ? ANOMALY.purple : look.color, glow: fat || look.form === 'spark' });
        }
      }
      for (const [e, mk] of c.mark) {
        const p = c.transform.get(e)!.pos;
        if (Math.random() > 1.2 - mk.delay / mk.total) continue;
        const a = rand(0, Math.PI * 2);
        const d = rand(0, mk.radius);
        fx.spawn({ x: p.x + Math.cos(a) * d, y: p.y + 0.1, z: p.z + Math.sin(a) * d, vy: rand(0.8, 2), life: 0.5, size: 0.1, color: paint(mk.owner).hot, glow: true });
      }
      for (const [e, w] of c.wave) {
        const p = c.transform.get(e)!.pos;
        const dust = paint(w.owner).dust;
        for (let i = 0; i < 3; i++) {
          const a = rand(0, Math.PI * 2);
          fx.spawn({ x: p.x + Math.cos(a) * w.r, y: p.y + 0.2, z: p.z + Math.sin(a) * w.r, vy: rand(0.5, 1.5), vx: Math.cos(a), vz: Math.sin(a), life: 0.45, size: 0.35, grow: 2, color: dust, alpha: 0.6, drag: 2 });
        }
      }
      for (const [id, a] of c.actor) {
        const def = moveDef(a);
        if (!def || isAbsent(g, id)) continue;
        const pl = def.pull;
        if (pl && a.frame >= pl.window[0] - 20 && a.frame < pl.window[1]) {
          const p = c.transform.get(id)!.pos;
          const ang = rand(0, Math.PI * 2);
          const r = pl.range * rand(0.6, 1);
          const k = -r * 1.3;
          fx.spawn({ x: p.x + Math.cos(ang) * r, y: p.y + rand(0.2, 1.5), z: p.z + Math.sin(ang) * r, vx: Math.cos(ang) * k - Math.sin(ang) * 2, vz: Math.sin(ang) * k + Math.cos(ang) * 2, life: 0.7, size: 0.12, color: paint(id).mind, glow: true });
        }
        const sw = def.sweep;
        if (sw && a.frame >= sw.window[0] && a.frame < sw.window[1]) {
          const { to } = beamLine(g, id, sw, a.frame + alpha);
          burst(to, 2, shotLook(creatureOf(g, id)?.id).color, 2.5, true, 0.1, 2);
        }
      }
    },
  };
}

interface AttackThemeColors {
  hot: Rgb;
  dust: Rgb;
  mind: Rgb;
  smoke: Rgb;
  summon: Rgb;
}
