/**
 * The game felt in the hands (2026-11-03): the controller's rumble for what the eye and ear already
 * have. A blow of the investigator's lands as a buzz that thickens with its weight (the same weight the
 * impact's sound and sparks take: audio/impact.ts); a wound taken thuds by its share of their health; a
 * parry rings sharp, a guard thumps, a guard broken shakes; the revolver kicks; the ground struck near
 * rolls by its distance; a horror's roar, its phases and its fall are long rolls; near death the heart
 * (feel.ts) beats in the palms. Felt only while a pad is the device in hand and at the Vibration setting
 * (Settings › Accessibility); the recipes are `RUMBLE` (data/rumble.ts). No Three.js: the events only.
 */

import { deviceInUse } from '../core/device';
import { createRumbler, type Rumbler } from '../core/rumble';
import type { V3 } from '../core/geom';
import { RUMBLE, type PulseSpec } from '../data/rumble';
import { HURT, IMPACT } from '../data/tuning';
import type { Game } from '../systems/components';
import { blowWeight, landedBlow, LANDS } from './audio/impact';
import { HEART } from './feel';

export interface RumbleFx {
  /** Mixes and sends this frame's rumble; `gain` is the Vibration setting, `held` stops it (a pause, a menu, the title). */
  update(gain: number, held: boolean): void;
  readonly rumbler: Rumbler;
}

/** `a` and `b` mixed `k` of the way (0..1). */
export const between = (a: PulseSpec, b: PulseSpec, k: number): PulseSpec => {
  const m = (x: number, y: number): number => x + (y - x) * Math.max(0, Math.min(1, k));
  return { strong: m(a.strong, b.strong), weak: m(a.weak, b.weak), ms: m(a.ms, b.ms) };
};

/** How much of the ground's roll reaches someone `d` metres from where it is struck. */
export const groundShare = (d: number): number => (d <= RUMBLE.near ? 1 : d >= RUMBLE.far ? 0 : 1 - (d - RUMBLE.near) / (RUMBLE.far - RUMBLE.near));

export function createRumbleFx(g: Game, now: () => number = () => performance.now(), rumbler: Rumbler = createRumbler()): RumbleFx {
  const me = (): number => g.player.id;
  const felt = (): boolean => deviceInUse() === 'pad';
  const add = (spec: PulseSpec, scale = 1, delay = 0): void => void (felt() && rumbler.add(spec, now(), scale, delay));
  const ground = (at: V3, scale = 1): void => {
    const p = g.ecs.c.transform.get(me())?.pos;
    if (p) add(RUMBLE.ground, scale * groundShare(Math.hypot(at.x - p.x, at.z - p.z)));
  };

  g.events.on('Hit', (e) => {
    if (e.attacker === me() && !e.lingering) {
      const l = landedBlow(g, e);
      if (l && LANDS.includes(l.outcome)) add(between(RUMBLE.land[0], RUMBLE.land[1], (blowWeight(l) - 0.5) / (IMPACT.weight.most - 0.5)));
      else if (e.outcome === 'blocked' || e.outcome === 'parried') add(RUMBLE.guarded);
      return;
    }
    if (e.target !== me()) return;
    if (e.outcome === 'parried') return add(RUMBLE.parry);
    if (e.outcome === 'dodged') return add(RUMBLE.dodged);
    if (e.outcome === 'guardBreak') return add(RUMBLE.guardBreak);
    if (e.outcome === 'blocked') return add(RUMBLE.block);
    if (e.damage <= 0) return;
    if (e.lingering) return add(RUMBLE.lingering);
    const max = g.ecs.c.health.get(me())?.max ?? 100;
    add(between(RUMBLE.hurt[0], RUMBLE.hurt[1], e.damage / (max / 3)));
  });
  g.events.on('Shot', (e) => void (e.shooter === me() && add(RUMBLE.shot)));
  g.events.on('DryFire', (e) => void (e.entity === me() && add(RUMBLE.dryFire)));
  g.events.on('Reloaded', (e) => void (e.entity === me() && add(RUMBLE.reloaded)));
  g.events.on('Healed', (e) => void (e.entity === me() && add(RUMBLE.healed)));
  g.events.on('Died', (e) => void (e.entity === me() && add(RUMBLE.died)));
  g.events.on('LevelUp', () => add(RUMBLE.levelUp));
  g.events.on('BossEngaged', () => add(RUMBLE.engaged));
  g.events.on('BossPhase', () => add(RUMBLE.phase));
  g.events.on('Vanquished', () => add(RUMBLE.vanquished));
  g.events.on('GateOpened', () => add(RUMBLE.gate));
  g.events.on('Quaked', (e) => ground(e.at));
  g.events.on('Erupted', (e) => ground(e.at, 0.8));
  g.events.on('StrikeLanded', (e) => ground(e.at));
  g.events.on('WardLanded', (e) => void (!e.mute && ground(e.at, 0.7)));
  g.events.on('FloorTremor', (e) => ground(e.at, Math.min(1, e.strength)));
  const omen = (shake: number): void => add({ strong: Math.min(1, shake * RUMBLE.omen.per), weak: 0, ms: RUMBLE.omen.ms });
  g.events.on('WayOmen', (e) => omen(e.shake));
  g.events.on('Foreboding', (e) => omen(e.shake));

  let beats = HEART.beats;
  return {
    rumbler,
    update(gain, held) {
      const t = now();
      if (HEART.beats !== beats) { // a stroke of the heart near death, and its softer second
        beats = HEART.beats;
        const h = RUMBLE.heart;
        const spec = { strong: h.strong[0] + (h.strong[1] - h.strong[0]) * HEART.need, weak: h.weak, ms: h.ms };
        if (HEART.need > 0) (add(spec), add(spec, 0.6, HURT.dub * 1000));
      }
      if (held || !felt()) return rumbler.stop(t);
      rumbler.update(t, gain);
    },
  };
}
