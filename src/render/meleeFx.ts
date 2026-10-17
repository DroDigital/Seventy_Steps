/**
 * A horror's blows at close quarters, seen (render only, round 51). The telegraph said where; this is
 * what the blow does when it opens, in the horror's own element and colours (`fxKit`, `attackLook`):
 *   a swing lights the arc it sweeps, throws streaks and matter from its tip as it goes round;
 *   a slam and a ring burst, mark the ground with a scar and send a shock ring out of it;
 *   a lunge or a charge tears the ground up behind it, with speed lines at its shoulders;
 *   a blow that lands on the investigator flares at the wound in the horror's own light, and sheds its
 *   matter (the weight, the camera's kick and the sound are impactFx's and the audio's).
 * Only the horrors with colours of their own: an ordinary foe's blow is read by its body.
 */

import type { V3 } from '../core/geom';
import type { MoveDef } from '../data/moves';
import { moveDef } from '../systems/actions';
import { isAbsent, type Game } from '../systems/components';
import { creatureOf } from '../systems/creatures';
import { LANDS } from './audio/impact';
import { attackLook, isThemed, type AttackLook } from './attackLook';
import { burst, ELEMENTS, flash, impact, type Element } from './fxKit';
import type { GroundFx } from './groundFx';
import type { Particles } from './particles';
import { woundPoint } from './wound';

export interface MeleeFx {
  update(alpha: number): void;
}

const DEG = Math.PI / 180;
const rand = (a: number, b: number): number => a + (b - a) * Math.random();
const FAR = 80;

export function createMeleeFx(g: Game, fx: Particles, ground: GroundFx): MeleeFx {
  const c = g.ecs.c;
  const style = (id: number): { look: AttackLook; el: Element; who: string | undefined } => {
    const look = attackLook(g, id);
    return { look, el: ELEMENTS[look.motif], who: creatureOf(g, id)?.id };
  };

  /** The blow opens: what it does to the ground it falls on. */
  function open(id: number, def: MoveDef, p: V3, yaw: number): void {
    const h = def.hit!;
    const { look, el, who } = style(id);
    const ring = h.reach < 0.05;
    const slam = !ring && Math.abs(h.arc[0] - h.arc[1]) < 1;
    if (ring || slam) {
      const a = yaw - h.arc[0] * DEG;
      const at = ring ? p : { x: p.x + Math.sin(a) * h.reach, y: g.world.ground(p.x + Math.sin(a) * h.reach, p.z + Math.cos(a) * h.reach), z: p.z + Math.cos(a) * h.reach };
      const r = h.radius + 0.4;
      burst(fx, el, at, r, look, ring ? 1 : 0.85);
      ground.scar(at, r * 1.05, look.line, who, 8);
      ground.shock(at, r * 0.4, r * 2.2, look.ring, who, 0.45, 0.8 + r * 0.15);
    } else {
      ground.slash(p, h.reach + h.radius, yaw, h.arc, look.line, who);
      flash(fx, el, { x: p.x + Math.sin(yaw) * h.reach, y: p.y + h.height, z: p.z + Math.cos(yaw) * h.reach }, h.radius * 0.8, look, 0);
    }
  }

  /** While a blow is active: its tip, and a charge's wake. */
  function swing(id: number, def: MoveDef, p: V3, yaw: number, frame: number): void {
    const h = def.hit!;
    const { look, el } = style(id);
    const sweeps = h.reach >= 0.05 && Math.abs(h.arc[0] - h.arc[1]) >= 1 && frame >= h.window[0] && frame < h.window[1];
    if (sweeps) {
      const t = Math.min(1, Math.max(0, (frame - h.window[0]) / Math.max(1, h.window[1] - h.window[0])));
      const arcNow = h.arc[0] + (h.arc[1] - h.arc[0]) * t;
      const a = yaw - arcNow * DEG;
      const tip = h.reach + h.radius * 0.6;
      const tx = p.x + Math.sin(a) * tip;
      const tz = p.z + Math.cos(a) * tip;
      const dir = Math.sign(h.arc[0] - h.arc[1]) || 1; // the way it turns
      const tangent = a + (dir > 0 ? -Math.PI / 2 : Math.PI / 2);
      for (let i = 0; i < 3; i++) {
        const sp = rand(3, 7);
        fx.spawn({ x: tx + rand(-0.2, 0.2), y: p.y + h.height + rand(-0.2, 0.3), z: tz + rand(-0.2, 0.2), vx: Math.sin(tangent) * sp, vy: rand(-0.5, 1.5), vz: Math.cos(tangent) * sp, life: rand(0.2, 0.4), size: 0.22 + h.radius * 0.2, color: i === 0 ? look.core : look.line, colorEnd: look.ember, glow: el.glow || i === 0, shape: i === 0 ? 'streak' : el.chunk, stretch: 0.1, gravity: el.gravity * 0.4, spin: rand(-6, 6), hold: 0.3 });
      }
    }
    const mo = def.motion;
    if (mo && mo.dir === 'facing' && frame >= mo.window[0] && frame < mo.window[1]) {
      for (let i = 0; i < 2; i++) {
        const side = (Math.random() - 0.5) * 2;
        fx.spawn({ x: p.x - Math.sin(yaw) * rand(0.3, 1.2) + Math.cos(yaw) * side * 0.9, y: p.y + 0.2, z: p.z - Math.cos(yaw) * rand(0.3, 1.2) - Math.sin(yaw) * side * 0.9, vx: -Math.sin(yaw) * 2 + rand(-1, 1), vy: rand(0.4, 1.6), vz: -Math.cos(yaw) * 2 + rand(-1, 1), life: rand(0.4, 0.8), size: 0.5 + h.radius * 0.4, grow: 2.4, color: look.ring, shape: 'wisp', alpha: 0.5, drag: 2 });
      }
      fx.spawn({ x: p.x - Math.sin(yaw) * 1.4, y: p.y + h.height, z: p.z - Math.cos(yaw) * 1.4, vx: -Math.sin(yaw) * 9, vz: -Math.cos(yaw) * 9, life: 0.18, size: 0.2, color: look.core, colorEnd: look.line, glow: true, shape: 'streak', stretch: 0.12 });
    }
  }

  g.events.on('Hit', (e) => {
    if (e.lingering || e.attacker === g.player.id || !LANDS.includes(e.outcome)) return;
    const who = creatureOf(g, e.attacker)?.id;
    if (!isThemed(who)) return;
    const wound = woundPoint(g, e.target, e.attacker, 0.25);
    if (!wound) return;
    const { look, el } = style(e.attacker);
    impact(fx, el, wound.at, { x: wound.dx, z: wound.dz }, 0.35 + Math.min(0.6, e.damage / 70), look);
  });

  g.events.on('Swung', ({ entity, at, yaw }) => {
    const a = c.actor.get(entity);
    const def = a && moveDef(a);
    if (!def?.hit || entity === g.player.id || !isThemed(creatureOf(g, entity)?.id) || isAbsent(g, entity)) return;
    const me = c.transform.get(g.player.id)?.pos;
    if (me && Math.hypot(at.x - me.x, at.z - me.z) > FAR) return;
    open(entity, def, { x: at.x, y: g.world.ground(at.x, at.z), z: at.z }, yaw);
  });

  return {
    update() {
      const me = c.transform.get(g.player.id)?.pos;
      for (const [id, a] of c.actor) {
        if (id === g.player.id) continue;
        const def = moveDef(a);
        const h = def?.hit;
        if (!h || !isThemed(creatureOf(g, id)?.id) || isAbsent(g, id) || c.dead.has(id)) continue;
        const tr = c.transform.get(id)!;
        if (me && Math.hypot(tr.pos.x - me.x, tr.pos.z - me.z) > FAR) continue;
        const striking = a.frame >= h.window[0] && a.frame < h.window[1];
        const running = !!def.motion && a.frame >= def.motion.window[0] && a.frame < def.motion.window[1];
        if (!striking && !running) continue;
        const p = { x: tr.pos.x, y: g.world.ground(tr.pos.x, tr.pos.z), z: tr.pos.z };
        swing(id, def, p, tr.yaw, a.frame);
      }
    },
  };
}
