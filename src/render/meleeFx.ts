/**
 * A horror's blows at close quarters, seen (render only, round 51). The telegraph said where; this is
 * what the blow does when it opens, in the horror's own element and colours (`fxKit`, `attackLook`):
 *   a swing lights the arc it sweeps, throws streaks and matter from its tip as it goes round;
 *   a slam and a ring burst, mark the ground with a scar and send a shock ring out of it;
 *   a lunge or a charge tears the ground up behind it, with speed lines at its shoulders;
 *   a blow that lands on the investigator flares at the wound in the horror's own light, and sheds its
 *   matter (the weight, the camera's kick and the sound are impactFx's and the audio's).
 * The horrors with colours of their own at full strength; since round 59 every other foe too, more lightly and by its size (`strengthOf`:
 * a rat's bite throws a few sparks, a shoggoth's slam a burst; before, an ordinary foe's blow showed nothing at all), in the colours
 * and matter of what it is made of (`attackLook`), with no scar on the ground but under the largest. Round 88: that was too much for a crowd of
 * them (asked: "overly elaborate; in high-density combat scenarios, this detracts from the intended eerie atmosphere"): every creature that is
 * not a horror (`isQuiet`) now draws its blow as one mark of its own and a few specks (`foeFx.ts`), and every path here returns early for it.
 */

import type { V3 } from '../core/geom';
import type { MoveDef } from '../data/moves';
import { moveDef } from '../systems/actions';
import { isAbsent, type Game } from '../systems/components';
import { creatureOf } from '../systems/creatures';
import { LANDS } from './audio/impact';
import { attackLook, isQuiet, isThemed, type AttackLook } from './attackLook';
import { burst, ELEMENTS, flash, impact, type Element } from './fxKit';
import type { GroundFx } from './groundFx';
import type { Particles } from './particles';
import { woundPoint } from './wound';

export interface MeleeFx {
  update(alpha: number): void;
}

const DEG = Math.PI / 180;
/** Which blows glint before they fall: at least `windup` frames to their first active one and `poise` of break, `lead` frames before it. */
export const TELL = { windup: 26, poise: 30, lead: 15 } as const;
const rand = (a: number, b: number): number => a + (b - a) * Math.random();
const FAR = 80;

/** How much of a blow's light and matter a creature of this body throws, 0..1: a horror with colours of its own all of it (round 88: no other creature reaches here: they draw quietly, `foeFx.ts`; kept for them as it was). */
export function strengthOf(themed: boolean, radius: number): number {
  return themed ? 1 : Math.min(0.8, 0.3 + 0.35 * radius);
}

export function createMeleeFx(g: Game, fx: Particles, ground: GroundFx): MeleeFx {
  const c = g.ecs.c;
  const style = (id: number): { look: AttackLook; el: Element; who: string | undefined; k: number; big: boolean } => {
    const look = attackLook(g, id);
    const who = creatureOf(g, id)?.id;
    const r = c.body.get(id)?.radius ?? 0.5;
    const k = strengthOf(isThemed(who), r);
    return { look, el: ELEMENTS[look.motif], who, k, big: k >= 1 || r >= 1.1 }; // a scar and a lit arc on the ground: a horror's, and the largest foes'
  };
  const foe = (id: number): boolean => id !== g.player.id && c.combatant.get(id)?.faction === 'enemy';

  /** The blow opens: what it does to the ground it falls on. */
  function open(id: number, def: MoveDef, p: V3, yaw: number): void {
    const h = def.hit!;
    const { look, el, who, k, big } = style(id);
    const ring = h.reach < 0.05;
    const slam = !ring && Math.abs(h.arc[0] - h.arc[1]) < 1;
    if (ring || slam) {
      const a = yaw - h.arc[0] * DEG;
      const at = ring ? p : { x: p.x + Math.sin(a) * h.reach, y: g.world.ground(p.x + Math.sin(a) * h.reach, p.z + Math.cos(a) * h.reach), z: p.z + Math.cos(a) * h.reach };
      const r = h.radius + 0.4;
      burst(fx, el, at, r, look, (ring ? 1 : 0.85) * k);
      if (big) ground.scar(at, r * 1.05, look.line, who, 8);
      ground.shock(at, r * 0.4, r * (1.4 + 0.8 * k), look.ring, who, 0.45, (0.8 + r * 0.15) * (0.5 + 0.5 * k));
    } else {
      if (big) ground.slash(p, h.reach + h.radius, yaw, h.arc, look.line, who);
      flash(fx, el, { x: p.x + Math.sin(yaw) * h.reach, y: p.y + h.height, z: p.z + Math.cos(yaw) * h.reach }, h.radius * 0.8 * (0.5 + 0.5 * k), look, 0);
    }
  }

  /** A slow, heavy blow's tell (round 59): a glint where it will come from, a quarter second before it falls, so a body that winds up long is read by more than its pose. */
  function tell(id: number, def: MoveDef, p: V3, yaw: number): void {
    const h = def.hit!;
    const { look, k } = style(id);
    const r = c.body.get(id)?.radius ?? 0.5;
    const at = { x: p.x + Math.sin(yaw) * Math.min(h.reach, r + 0.4) * 0.6, y: p.y + Math.max(0.6, h.height * 1.15), z: p.z + Math.cos(yaw) * Math.min(h.reach, r + 0.4) * 0.6 };
    const size = (0.5 + 0.5 * k) * Math.min(2.4, 0.7 + r * 0.6);
    fx.spawn({ ...at, life: 0.22, size: size * 1.8, grow: 0.3, color: look.core, glow: true, shape: 'spark', rot: rand(0, 3), spin: 6, hold: 0.25 });
    fx.spawn({ ...at, life: 0.18, size, grow: 1.6, color: look.line, glow: true, shape: 'wisp', alpha: 0.8 });
  }

  /** While a blow is active: its tip, and a charge's wake. */
  function swing(id: number, def: MoveDef, p: V3, yaw: number, frame: number): void {
    const h = def.hit!;
    const { look, el, k } = style(id);
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
      for (let i = 0; i < Math.max(1, Math.round(3 * k)); i++) {
        const sp = rand(3, 7);
        fx.spawn({ x: tx + rand(-0.2, 0.2), y: p.y + h.height + rand(-0.2, 0.3), z: tz + rand(-0.2, 0.2), vx: Math.sin(tangent) * sp, vy: rand(-0.5, 1.5), vz: Math.cos(tangent) * sp, life: rand(0.2, 0.4), size: 0.22 + h.radius * 0.2, color: i === 0 ? look.core : look.line, colorEnd: look.ember, glow: el.glow || i === 0, shape: i === 0 ? 'streak' : el.chunk, stretch: 0.1, gravity: el.gravity * 0.4, spin: rand(-6, 6), hold: 0.3 });
      }
    }
    const mo = def.motion;
    if (mo && mo.dir === 'facing' && frame >= mo.window[0] && frame < mo.window[1] && Math.random() < 0.4 + 0.6 * k) {
      for (let i = 0; i < 2; i++) {
        const side = (Math.random() - 0.5) * 2;
        fx.spawn({ x: p.x - Math.sin(yaw) * rand(0.3, 1.2) + Math.cos(yaw) * side * 0.9, y: p.y + 0.2, z: p.z - Math.cos(yaw) * rand(0.3, 1.2) - Math.sin(yaw) * side * 0.9, vx: -Math.sin(yaw) * 2 + rand(-1, 1), vy: rand(0.4, 1.6), vz: -Math.cos(yaw) * 2 + rand(-1, 1), life: rand(0.4, 0.8), size: 0.5 + h.radius * 0.4, grow: 2.4, color: look.ring, shape: 'wisp', alpha: 0.5, drag: 2 });
      }
      fx.spawn({ x: p.x - Math.sin(yaw) * 1.4, y: p.y + h.height, z: p.z - Math.cos(yaw) * 1.4, vx: -Math.sin(yaw) * 9, vz: -Math.cos(yaw) * 9, life: 0.18, size: 0.2, color: look.core, colorEnd: look.line, glow: true, shape: 'streak', stretch: 0.12 });
    }
  }

  g.events.on('Hit', (e) => {
    if (e.lingering || !foe(e.attacker) || isQuiet(g, e.attacker) || !LANDS.includes(e.outcome)) return; // (a creature that is not a horror draws its own: foeFx.ts)
    const wound = woundPoint(g, e.target, e.attacker, 0.25);
    if (!wound) return;
    const { look, el, k } = style(e.attacker);
    impact(fx, el, wound.at, { x: wound.dx, z: wound.dz }, (0.35 + Math.min(0.6, e.damage / 70)) * (0.55 + 0.45 * k), look);
  });

  g.events.on('Swung', ({ entity, at, yaw }) => {
    const a = c.actor.get(entity);
    const def = a && moveDef(a);
    if (!def?.hit || !foe(entity) || isQuiet(g, entity) || isAbsent(g, entity)) return;
    const me = c.transform.get(g.player.id)?.pos;
    if (me && Math.hypot(at.x - me.x, at.z - me.z) > FAR) return;
    open(entity, def, { x: at.x, y: g.world.ground(at.x, at.z), z: at.z }, yaw);
  });

  const last = new Map<number, { move: string | null; frame: number }>(); // each actor's move and frame when last drawn
  return {
    update() {
      const me = c.transform.get(g.player.id)?.pos;
      if (last.size > 64) for (const id of last.keys()) if (!c.actor.has(id)) last.delete(id);
      for (const [id, a] of c.actor) {
        if (id === g.player.id) continue;
        const def = moveDef(a);
        const h = def?.hit;
        if (!h || !foe(id) || isQuiet(g, id) || isAbsent(g, id) || c.dead.has(id)) continue;
        const tr = c.transform.get(id)!;
        if (me && Math.hypot(tr.pos.x - me.x, tr.pos.z - me.z) > FAR) continue;
        const told = h.window[0] >= TELL.windup && h.poise >= TELL.poise ? h.window[0] - TELL.lead : -1; // only a blow that winds up long and lands heavy
        const was = last.get(id);
        last.set(id, { move: a.move, frame: a.frame });
        const before = was && was.move === a.move && was.frame <= a.frame ? was.frame : -1; // (once, however many pictures are drawn to a step, or steps to a picture)
        if (told >= 0 && before < told && a.frame >= told && a.frame < h.window[0]) { // (and only before the blow: a picture late after a hitch, or a foe come into sight mid-swing, does not glint at it)
          const t = c.transform.get(id)!;
          tell(id, def, { x: t.pos.x, y: g.world.ground(t.pos.x, t.pos.z), z: t.pos.z }, t.yaw);
        }
        const striking = a.frame >= h.window[0] && a.frame < h.window[1];
        const running = !!def.motion && a.frame >= def.motion.window[0] && a.frame < def.motion.window[1];
        if (!striking && !running) continue;
        const p = { x: tr.pos.x, y: g.world.ground(tr.pos.x, tr.pos.z), z: tr.pos.z };
        swing(id, def, p, tr.yaw, a.frame);
      }
    },
  };
}
