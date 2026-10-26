/**
 * The boss attacks' particles (render only, spec §3E; redesigned in round 51). Built from the horror's
 * element (`fxKit`: what its blows are made of) and its colours (`attackLook`: lifted so that they are
 * found against any ground), and from the ground's marks (`groundFx`: scars, shock rings, sigils):
 *   a caster's wind-up gathers its light before a bolt, a beam, a gaze, a summoning, a marking;
 *   a bolt leaves in a flash, trails its matter and light, and lands in a spray and a scar;
 *   marked ground seethes, and bursts in a flash, a crown of matter, a fountain, a cloud and a ring;
 *   a quake's front throws dust and stone; a vortex draws its motes in; a beam's end sprays sparks
 *   and burns the ground it crosses; a teleport implodes and arrives under a sigil; a summoning rises
 *   as a column from a circle; darkness pours off its caller; a phase change shakes the whole arena.
 * The paths are the same for every horror; the matter and colours are that horror's. Read-only on the
 * simulation.
 */

import type { V3 } from '../core/geom';
import { moveDef } from '../systems/actions';
import { isAbsent, type Game } from '../systems/components';
import { creatureOf } from '../systems/creatures';
import { beamLine } from '../systems/strikes';
import { attackLook } from './attackLook';
import { matterLook } from './matterLook';
import { FLASH_LIGHTS } from '../data/fxTuning';
import { flashLight } from './flashLights';
import { burst, charge, column, ELEMENTS, flash, impact, trail, whiteOf } from './fxKit';
import type { GroundFx } from './groundFx';
import type { Particles } from './particles';
import { GATHER, releaseFrame } from './windup';

export interface AttackFx {
  update(alpha: number): void;
}

const rand = (a: number, b: number): number => a + (b - a) * Math.random();
const FAR = 90; // metres beyond which an effect is not drawn: it could not be seen

export function createAttackFx(g: Game, fx: Particles, ground: GroundFx): AttackFx {
  const c = g.ecs.c;
  const whoIs = (id: number): string | undefined => creatureOf(g, id)?.id;
  const near = (p: V3, range = FAR): boolean => {
    const me = c.transform.get(g.player.id)?.pos;
    return !me || Math.hypot(p.x - me.x, p.z - me.z) < range;
  };
  const bodyAt = (id: number, k = 0.8): V3 | undefined => {
    const p = c.transform.get(id)?.pos;
    return p && { x: p.x, y: p.y + (c.body.get(id)?.aimHeight ?? 1.2) * k, z: p.z };
  };
  const foe = (id: number): boolean => id !== g.player.id && c.combatant.get(id)?.faction === 'enemy'; // (round 84: only a foe's effects light the world about them, as meleeFx's do; not the investigator's, an ally's or the world's)
  const style = (id: number) => {
    const look = attackLook(g, id);
    return { look, el: ELEMENTS[look.motif], lit: foe(id) };
  };

  g.events.on('BoltLoosed', ({ owner, at, vel, fire, conjured }) => {
    if (fire || !near(at)) return;
    const { look, el, lit } = style(owner);
    flash(fx, el, { ...at, y: at.y - 0.4 }, 0.5, look, 0.4, lit);
    const sp = Math.hypot(vel.x, vel.z) || 1;
    for (let i = 0; i < 5; i++) fx.spawn({ x: at.x, y: at.y, z: at.z, vx: (vel.x / sp) * rand(4, 9) + rand(-1.5, 1.5), vy: rand(-0.5, 1), vz: (vel.z / sp) * rand(4, 9) + rand(-1.5, 1.5), life: 0.25, size: 0.2, color: conjured ? look.mind : look.core, colorEnd: look.line, glow: true, shape: 'streak', stretch: 0.14, hold: 0.3 });
  });
  g.events.on('BoltLanded', ({ owner, at, vel, on, radius, fire, conjured }) => {
    if (fire || !near(at)) return;
    const { look, el, lit } = style(owner);
    const sp = Math.hypot(vel.x, vel.z) || 1;
    const dir = { x: vel.x / sp, z: vel.z / sp };
    if (on === 'spent') {
      fx.spawn({ x: at.x, y: at.y, z: at.z, life: 0.3, size: radius * 3, grow: 1.6, color: look.line, glow: true, shape: 'wisp', alpha: 0.6 });
      return;
    }
    impact(fx, el, at, dir, conjured ? radius * 0.6 : radius, look, lit);
    if (on === 'ground' || on === 'wall') ground.scar({ x: at.x, y: g.world.ground(at.x, at.z), z: at.z }, 0.7 + radius * 2.2, look.line, whoIs(owner), 5);
  });

  g.events.on('Shot', ({ shooter, from, to }) => { // a horror's beam: a flare at its source, a burst where it ends
    if (shooter === g.player.id || !near(from)) return;
    const { look, el, lit } = style(shooter);
    const [dx, dz] = [to.x - from.x, to.z - from.z];
    const len = Math.hypot(dx, dz) || 1;
    flash(fx, el, from, 0.9, look, 0, lit);
    impact(fx, el, to, { x: dx / len, z: dz / len }, 0.9, look, lit);
    const floor = g.world.ground(to.x, to.z);
    if (to.y - floor < 2) ground.scar({ x: to.x, y: floor, z: to.z }, 1.6, look.line, whoIs(shooter), 6);
  });
  g.events.on('Erupted', ({ at, radius, by, look: kind }) => { // (round 70: ground with a look is flame, a star, a bolt or a tentacle, whoever strikes it)
    const look = matterLook(attackLook(g, by), kind);
    burst(fx, ELEMENTS[look.motif], at, radius, look, 1, foe(by));
    ground.scar(at, radius * 1.1, look.line, whoIs(by), 10);
    ground.shock(at, radius * 0.5, radius * 2.4, look.ring, whoIs(by), 0.5, 0.9 + radius * 0.2);
  });
  g.events.on('Quaked', ({ at, by }) => {
    const { look, el, lit } = style(by);
    const r = (c.body.get(by)?.radius ?? 1) + 1.5;
    burst(fx, el, at, r, look, 0.8, lit);
    ground.scar(at, r + 1, look.line, whoIs(by), 8);
  });
  g.events.on('Teleported', ({ entity, from, to }) => {
    const { look, el, lit } = style(entity);
    const r = (c.body.get(entity)?.radius ?? 0.6) + 0.6;
    for (let i = 0; i < 18; i++) { // the place it leaves collapses into it
      const a = rand(0, Math.PI * 2);
      const d = rand(0.6, 1.4) * r * 2;
      fx.spawn({ x: from.x + Math.cos(a) * d, y: from.y + rand(0.2, 2.2) * r, z: from.z + Math.sin(a) * d, vx: -Math.cos(a) * d * 3.5, vz: -Math.sin(a) * d * 3.5, life: 0.3, size: 0.16, color: look.mind, colorEnd: look.core, glow: true, shape: i % 2 ? 'streak' : 'spark', stretch: 0.05, hold: 0.3 });
    }
    flash(fx, el, from, r, look, r, lit);
    flash(fx, el, to, r * 1.4, look, r, lit);
    column(fx, el, to, r * 0.8, 3 + r, look, 0.8);
    ground.shock(to, r, r * 4, look.mind, whoIs(entity), 0.5, 0.8);
    ground.sigil(to, r * 1.7, look.mind, whoIs(entity), 1.5);
  });
  g.events.on('Summoned', ({ entity, by }) => {
    const p = c.transform.get(entity)?.pos;
    if (!p) return;
    const { look, el, lit } = style(by);
    const r = c.body.get(entity)?.radius ?? 0.6;
    column(fx, el, p, r + 0.4, 3 + r * 2, look);
    flash(fx, el, p, r + 0.6, look, 0.6, lit);
    ground.sigil(p, r + 2.4, look.mind, whoIs(by), 2.4);
    ground.shock(p, r, r + 4, look.line, whoIs(by), 0.6, 0.7);
  });
  g.events.on('Darkened', ({ by }) => {
    const p = bodyAt(by);
    if (!p) return;
    const { look, lit } = style(by);
    for (let i = 0; i < 26; i++) { // light is drawn out of the place, and darkness poured from the caller
      const a = rand(0, Math.PI * 2);
      const s = rand(2, 6);
      fx.spawn({ x: p.x, y: p.y + rand(-0.5, 1), z: p.z, vx: Math.cos(a) * s, vy: rand(-0.5, 1.5), vz: Math.sin(a) * s, life: rand(1, 1.8), size: rand(0.9, 1.8), grow: 2.2, color: look.ember, colorEnd: [0, 0, 0], shape: 'wisp', alpha: 0.75, drag: 1.4, hold: 0.3 });
    }
    flash(fx, ELEMENTS.stain, p, 1.5, { ...look, core: look.mind, line: look.mind }, 0, lit);
  });
  g.events.on('GazeBurst', ({ by }) => {
    const to = bodyAt(g.player.id);
    const from = bodyAt(by, 0.95);
    if (!to) return;
    const { look, el, lit } = style(by);
    flash(fx, el, { ...to, y: to.y - 0.4 }, 0.9, { ...look, core: look.mind, line: look.mind }, 0.4, lit);
    fx.spawn({ x: to.x, y: to.y, z: to.z, life: 0.4, size: 1.2, grow: 4, color: look.mind, glow: true, shape: 'ring', thick: 0.1 });
    for (let i = 0; i < 14; i++) fx.spawn({ x: to.x, y: to.y, z: to.z, vx: rand(-4, 4), vy: rand(-2, 3), vz: rand(-4, 4), life: rand(0.3, 0.7), size: 0.14, color: look.core, colorEnd: look.mind, glow: true, shape: 'streak', stretch: 0.1, hold: 0.3 });
    if (from) for (let i = 0; i < 10; i++) { // the look itself, crossing the room
      const k = (i + 1) / 11;
      fx.spawn({ x: from.x + (to.x - from.x) * k, y: from.y + (to.y - from.y) * k, z: from.z + (to.z - from.z) * k, life: 0.25, size: 0.3 * (1 - k * 0.5), color: look.mind, glow: true, shape: 'spark', alpha: 0.9, spin: 5 });
    }
  });
  g.events.on('BossPhase', ({ entity, phase }) => {
    const p = c.transform.get(entity)?.pos;
    if (!p || phase === 0) return;
    const r = c.body.get(entity)?.radius ?? 0.5;
    const { look, el, lit } = style(entity);
    burst(fx, el, p, 2 + r * 1.3, look, 1.5, lit);
    column(fx, el, p, r * 0.8 + 0.6, 4 + r * 2, look, 1.3);
    ground.shock(p, r, r * 5 + 6, look.line, whoIs(entity), 0.9, 1.6);
    ground.shock(p, r, r * 3 + 4, look.ring, whoIs(entity), 0.6, 1);
    ground.scar(p, r * 1.6 + 2, look.line, whoIs(entity), 14);
  });

  /** A gaze while it builds: the look streams from the eye to the investigator's head, thicker as the mind gives, and a ring closes about it. */
  function gazing(id: number): void {
    const eye = bodyAt(id, 0.95);
    const head = bodyAt(g.player.id, 1);
    const k = g.reality.gaze;
    if (!eye || !head || k <= 0) return;
    const { look } = style(id);
    const [dx, dy, dz] = [head.x - eye.x, head.y - eye.y, head.z - eye.z];
    const len = Math.hypot(dx, dy, dz) || 1;
    for (let i = 0; i < 1 + Math.round(k * 3); i++) {
      const t = Math.random();
      fx.spawn({ x: eye.x + dx * t + rand(-0.15, 0.15), y: eye.y + dy * t + rand(-0.15, 0.15), z: eye.z + dz * t + rand(-0.15, 0.15), vx: (dx / len) * 16, vy: (dy / len) * 16, vz: (dz / len) * 16, life: 0.2, size: 0.1 + 0.14 * k, color: look.mind, colorEnd: look.core, glow: true, shape: 'streak', stretch: 0.08, hold: 0.3 });
    }
    if (tick % 3 === 0) fx.spawn({ x: eye.x, y: eye.y, z: eye.z, life: 0.14, size: 0.5 + k * 1.3, grow: 1.4, color: look.core, glow: true, shape: 'spark', rot: rand(0, 3), spin: 3 });
    if (tick % 4 === 0) fx.spawn({ x: head.x, y: head.y, z: head.z, life: 0.35, size: 2.4 - 1.5 * k, grow: 0.25, color: look.mind, glow: true, shape: 'ring', thick: 0.1, alpha: 0.5 + 0.5 * k });
  }

  /** A pulse of dread going out (a `sanity` move with no gaze in it): its front, the ring the telegraph draws, thrown up in motes of the mind's colour as it passes. */
  function pulse(id: number, sa: { window: readonly [number, number]; range: number }, frame: number): void {
    const p = c.transform.get(id)?.pos;
    if (!p) return;
    const t = (frame - sa.window[0]) / (sa.window[1] - sa.window[0]);
    const r = (c.body.get(id)?.radius ?? 0.5) + t * sa.range;
    const { look } = style(id);
    const n = Math.min(14, 4 + Math.round(r * 0.6));
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2);
      const [x, z] = [p.x + Math.cos(a) * r, p.z + Math.sin(a) * r];
      fx.spawn({ x, y: g.world.ground(x, z) + rand(0.1, 0.5), z, vx: Math.cos(a) * 2.5, vz: Math.sin(a) * 2.5, vy: rand(0.6, 2.2), life: rand(0.35, 0.6), size: rand(0.12, 0.22), grow: 0.6, color: look.mind, colorEnd: look.core, glow: true, shape: i % 3 ? 'spark' : 'streak', stretch: 0.08, alpha: 0.85 * (1 - t * 0.6), hold: 0.3, spin: 4 });
    }
  }

  let tick = 0;
  return {
    update(alpha) {
      tick++;
      const keep = Math.min(1, 10 / Math.max(1, c.bolt.size)); // a barrage's thirty bolts trail thinner than one
      for (const [e, b] of c.bolt) {
        if (keep < 1 && Math.random() > keep) continue;
        const p = c.transform.get(e)!;
        const at = { x: p.prev.x + (p.pos.x - p.prev.x) * alpha, y: p.prev.y + (p.pos.y - p.prev.y) * alpha, z: p.prev.z + (p.pos.z - p.prev.z) * alpha };
        if (b.pool?.fire && b.faction === 'player') continue;
        if (!near(at)) continue;
        const { look, el } = style(b.owner);
        trail(fx, el, at, b.vel, b.radius, b.conjured ? { ...look, line: look.mind } : look, el.glow || look.motif === 'plain');
        if (el.glow && b.faction === 'enemy') flashLight(at, whiteOf(b.conjured ? look.mind : look.line), Math.min(FLASH_LIGHTS.bolt.most, FLASH_LIGHTS.bolt.strength + b.radius * FLASH_LIGHTS.bolt.per), Math.min(FLASH_LIGHTS.bolt.rangeMost, FLASH_LIGHTS.bolt.range + b.radius * FLASH_LIGHTS.bolt.rangePer), FLASH_LIGHTS.bolt.seconds, e); // a foe's bolt of light or fire lights the ground it crosses (round 83; round 84: not an ally's, which the investigator's own are not either)
      }
      for (const [e, mk] of c.mark) {
        const p = c.transform.get(e)!.pos;
        const k = 1 - mk.delay / mk.total; // 0 just marked ... 1 about to burst
        const { look, el } = style(mk.owner);
        if (Math.random() > 0.35 + 0.9 * k) continue;
        for (let i = 0; i < 1 + Math.round(k * 2); i++) {
          const a = rand(0, Math.PI * 2);
          const d = Math.sqrt(Math.random()) * mk.radius;
          fx.spawn({ x: p.x + Math.cos(a) * d, y: p.y + 0.1, z: p.z + Math.sin(a) * d, vy: rand(1, 2.2) + 3 * k, life: 0.5, size: 0.1 + 0.1 * k, grow: 0.5, color: look.line, colorEnd: look.core, glow: true, shape: el.glint ?? 'spark', hold: 0.4 });
        }
      }
      for (const [e, w] of c.wave) {
        if (w.lane) continue; // a wall of water throws its own spray (surgeView.ts)
        const p = c.transform.get(e)!.pos;
        const { look, el } = style(w.owner);
        const r = w.r + w.speed * alpha;
        const n = Math.min(16, 3 + Math.round(r * 0.45)); // round 59: four to a frame left a colossus's front a scatter of specks; it is thrown up along its whole round
        for (let i = 0; i < n; i++) {
          const a = rand(0, Math.PI * 2);
          const x = p.x + Math.cos(a) * r;
          const z = p.z + Math.sin(a) * r;
          const y = g.world.ground(x, z); // on the ground it runs over, not at the height of where it began
          if (!near({ x, y, z }, 60)) continue;
          fx.spawn({ x, y: y + 0.2, z, vy: rand(1, 3.5), vx: Math.cos(a) * 1.5, vz: Math.sin(a) * 1.5, life: 0.5, size: 0.3 + w.width * 0.1, grow: el.chunk === 'shard' ? 1 : 2, color: i % 2 ? look.ring : look.line, glow: false, shape: i % 2 ? 'wisp' : el.chunk, gravity: 6, alpha: 0.7, drag: 2, spin: rand(-8, 8) });
        }
      }
      for (const [id, a] of c.actor) {
        const def = moveDef(a);
        if (!def || isAbsent(g, id) || c.dead.has(id)) continue;
        const body = bodyAt(id, 0.7);
        if (!body || !near(body)) continue;
        const rel = releaseFrame(def);
        if (rel !== undefined && a.frame < rel && a.frame >= rel - GATHER && tick % 2 === 0) {
          const { look, el } = style(id);
          const r = Math.min(4, Math.max(0.9, (c.body.get(id)?.radius ?? 0.5) * 1.2));
          charge(fx, el, bodyAt(id, def.effect?.kind === 'gaze' ? 0.95 : 0.85)!, r, 1 - (rel - a.frame) / GATHER, look);
        }
        const ef = def.effect;
        if (ef?.kind === 'gaze' && a.frame >= ef.window[0] && a.frame < ef.window[1]) gazing(id);
        const sa = def.sanity;
        if (sa && !sa.sight && a.frame >= sa.window[0] && a.frame < sa.window[1] && tick % 2 === 0) pulse(id, sa, a.frame + alpha);
        const pl = def.pull;
        if (pl && a.frame >= pl.window[0] - 20 && a.frame < pl.window[1]) {
          const p = c.transform.get(id)!.pos;
          const { look } = style(id);
          for (let i = 0; i < 2; i++) {
            const ang = rand(0, Math.PI * 2);
            const r = pl.range * rand(0.5, 1);
            const k = -r * 1.4;
            fx.spawn({ x: p.x + Math.cos(ang) * r, y: p.y + rand(0.2, 2), z: p.z + Math.sin(ang) * r, vx: Math.cos(ang) * k - Math.sin(ang) * 3.5, vz: Math.sin(ang) * k + Math.cos(ang) * 3.5, vy: rand(-0.2, 0.8), life: 0.7, size: rand(0.12, 0.22), color: i ? look.mind : look.line, colorEnd: look.core, glow: true, shape: i ? 'streak' : 'spark', stretch: 0.07, hold: 0.3 });
          }
        }
        const sw = def.sweep;
        if (sw && a.frame >= sw.window[0] && a.frame < sw.window[1]) {
          const { to, from } = beamLine(g, id, sw, a.frame + alpha);
          const { look, el } = style(id);
          fx.spawn({ x: to.x, y: to.y + 0.3, z: to.z, life: 0.12, size: 1 + sw.width, grow: 1.3, color: look.core, glow: true, shape: 'wisp', alpha: 0.9 });
          for (let i = 0; i < 3; i++) fx.spawn({ x: to.x, y: to.y + 0.2, z: to.z, vx: rand(-3, 3), vy: rand(1.5, 5), vz: rand(-3, 3), life: rand(0.3, 0.7), size: rand(0.1, 0.2), color: look.core, colorEnd: look.line, glow: true, shape: el.glint ?? 'spark', gravity: 7, spin: 8, hold: 0.3 });
          fx.spawn({ x: from.x, y: from.y, z: from.z, life: 0.1, size: 0.9 + sw.width, grow: 1.2, color: look.core, glow: true, shape: 'wisp', alpha: 0.8 });
          if ((a.frame - sw.window[0]) % 5 === 0) ground.scar({ x: to.x, y: g.world.ground(to.x, to.z), z: to.z }, 0.9 + sw.width, look.line, whoIs(id), 1.6);
        }
      }
    },
  };
}
