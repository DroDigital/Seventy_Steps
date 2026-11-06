/**
 * Who lights the world as they strike (round 87; render/flashLights.ts, fxKit.ts `lit`, attackFx.ts `foe`): only a foe's blow, shot and bolt do,
 * and softly. The investigator's blow already lights the creature it lands on (the sprite's own wound flash), so neither his blow nor his shot
 * lays a lamp, nor does an ally's, nor the lantern-lit creature's own: XDro, the hit flashes were too much and for the player's own strikes
 * not needed.
 */

import * as THREE from 'three';
import { afterEach, describe, expect, it } from 'vitest';
import { FLASH_LIGHTS } from '../src/data/fxTuning';
import { LIGHTS } from '../src/data/tuning';
import { createAttackFx } from '../src/render/attackFx';
import { createCombatFx } from '../src/render/combatFx';
import { putOutFlashes, layFlashes } from '../src/render/flashLights';
import { createGroundFx } from '../src/render/groundFx';
import { createImpactFx } from '../src/render/impactFx';
import { burst, ELEMENTS, flash, impact } from '../src/render/fxKit';
import { lookOf } from '../src/render/attackLook';
import { createMeleeFx } from '../src/render/meleeFx';
import type { ParticleSpec, Particles } from '../src/render/particles';
import { LAMP_SLOTS } from '../src/render/shaders/world';
import { moveDef, startMove } from '../src/systems/actions';
import { createGame } from '../src/systems/game';
import { place, scriptedGame } from './helpers';

const slots = () => ({ lamps: Array.from({ length: LAMP_SLOTS }, () => new THREE.Vector4()), colors: Array.from({ length: LAMP_SLOTS }, () => new THREE.Vector3()) });
const eye = { x: 0, y: 1, z: 0 };
const fresh = (): Particles & { made: ParticleSpec[] } => {
  const made: ParticleSpec[] = [];
  return { made, spawn: (p) => void made.push(p), update: () => undefined };
};
/** How many lights are laid, and the brightest component of any, a moment after the sources have called. */
function lit(): { n: number; peak: number } {
  const { lamps, colors } = slots();
  layFlashes(lamps, colors, [], 50, eye);
  const n = layFlashes(lamps, colors, [], 50 + FLASH_LIGHTS.attack, eye);
  return { n, peak: Math.max(0, ...colors.flatMap((c) => c.toArray())) };
}

afterEach(putOutFlashes);

describe('who lights the world as they strike (round 87)', () => {
  it('the investigator’s landed blow throws sparks and ichor but lays no light', () => {
    const { g, player, deepOne } = scriptedGame();
    place(g, player, 0, 0, 0);
    place(g, deepOne, 0, 1.4, Math.PI);
    const fx = fresh();
    createImpactFx(g, fx);
    g.events.emit('Hit', { attacker: player, target: deepOne, outcome: 'kill', damage: 60 });
    expect(fx.made.length).toBeGreaterThan(10);
    expect(lit().n).toBe(0);
  });

  it('his shot lays no light either (its muzzle was one lamp before)', () => {
    const { g, player } = scriptedGame();
    place(g, player, 0, 0, 0);
    createCombatFx(g, fresh(), () => ({ x: 0, y: 1.2, z: 0.6 }));
    g.events.emit('Shot', { shooter: player, from: { x: 0, y: 1.2, z: 0.4 }, to: { x: 0, y: 1.2, z: 8 } } as never);
    expect(lit().n).toBe(0);
  });

  it('a foe’s slam lays one soft light, never brighter than the most a blow of a foe throws', () => {
    const g = createGame({ creature: 'gug' });
    const c = g.ecs.c;
    const foe = [...c.actor.keys()].find((k) => k !== g.player.id && c.dread.has(k))!;
    c.brain.delete(foe);
    place(g, g.player.id, 0, 0, 0);
    place(g, foe, 0, 2, Math.PI);
    createMeleeFx(g, fresh(), createGroundFx());
    const a = c.actor.get(foe)!;
    startMove(a, 'slam');
    a.frame = moveDef(a)!.hit!.window[0];
    const t = c.transform.get(foe)!;
    g.events.emit('Swung', { entity: foe, at: { ...t.pos }, yaw: t.yaw });
    const { n, peak } = lit();
    expect(n).toBeGreaterThan(0);
    expect(n).toBeLessThanOrEqual(FLASH_LIGHTS.slots);
    expect(peak).toBeLessThanOrEqual(FLASH_LIGHTS.burst.most + 1e-6);
  });

  it('a foe’s bolt landing lights; the investigator’s, an ally’s and a mark he or an ally sets off do not', () => {
    const { g, player, deepOne } = scriptedGame();
    place(g, player, 0, 0, 0);
    place(g, deepOne, 0, 6, Math.PI);
    createAttackFx(g, fresh(), createGroundFx());
    const land = (owner: number): number => {
      putOutFlashes();
      g.events.emit('BoltLanded', { owner, faction: g.ecs.c.combatant.get(owner)?.faction ?? 'enemy', at: { x: 0, y: 1, z: 3 }, vel: { x: 0, y: 0, z: 1 }, on: 'body', radius: 0.5, lob: false, fire: false, conjured: false });
      return lit().n;
    };
    const erupt = (by: number): number => {
      putOutFlashes();
      g.events.emit('Erupted', { at: { x: 0, y: 0, z: 3 }, radius: 3, by });
      return lit().n;
    };
    expect(land(deepOne)).toBe(1);
    expect(erupt(deepOne)).toBe(1);
    expect(land(player)).toBe(0);
    expect(erupt(player)).toBe(0);
    g.ecs.c.combatant.get(deepOne)!.faction = 'player'; // (an ally: a conjured thing on the investigator’s side)
    expect(land(deepOne)).toBe(0);
    expect(erupt(deepOne)).toBe(0);
  });

  it('a foe already gone when its effect lands (a minion cleared with the fight) still lights it; an ally\'s bolt, by the faction it carries, does not', () => {
    const { g, player, deepOne } = scriptedGame();
    place(g, player, 0, 0, 0);
    createAttackFx(g, fresh(), createGroundFx());
    const gone = deepOne;
    g.ecs.despawn(gone);
    const bolt = (faction: 'enemy' | 'player'): number => {
      putOutFlashes();
      g.events.emit('BoltLanded', { owner: gone, faction, at: { x: 0, y: 1, z: 3 }, vel: { x: 0, y: 0, z: 1 }, on: 'body', radius: 0.5, lob: false, fire: false, conjured: false });
      return lit().n;
    };
    expect(bolt('enemy')).toBe(1);
    expect(bolt('player')).toBe(0);
    putOutFlashes();
    g.events.emit('Erupted', { at: { x: 0, y: 0, z: 3 }, radius: 3, by: gone });
    expect(lit().n).toBe(1);
  });

  it('a kit flash or impact asked to be unlit lays none, and the lit ones are small', () => {
    const el = ELEMENTS.flame;
    const look = { ...lookOf('cthulhu'), sig: null };
    const at = { x: 0, y: 1, z: 2 };
    const fx = fresh();
    flash(fx, el, at, 3, look, 0.4, false);
    burst(fx, el, at, 4, look, 1, false);
    impact(fx, el, at, { x: 0, z: 1 }, 1, look, false);
    expect(fx.made.length).toBeGreaterThan(10); // (the matter is still thrown)
    expect(lit().n).toBe(0);
    for (const radius of [1, 6, 30]) {
      putOutFlashes();
      burst(fx, el, at, radius, look);
      expect(lit().peak, `radius ${radius}`).toBeLessThanOrEqual(FLASH_LIGHTS.burst.most + 1e-6);
    }
    expect(FLASH_LIGHTS.burst.most).toBeLessThanOrEqual(LIGHTS.kinds.torch.strength + 0.2); // no brighter than a torch (the strongest of a foe’s blows)
    expect(FLASH_LIGHTS.bolt.most).toBeLessThanOrEqual(LIGHTS.kinds.torch.strength);
    expect(FLASH_LIGHTS.burst.seconds).toBeLessThanOrEqual(0.25);
  });
});
