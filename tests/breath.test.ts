/** Round 80: the breath in the cold (render/breath.ts, data/coldBreath.ts). */
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { BREATH, COLD } from '../src/data/coldBreath';
import { REGION_IDS } from '../src/data/regions';
import { coldOf, createBreath, cycleOf } from '../src/render/breath';
import type { ParticleSpec, Particles } from '../src/render/particles';
import { createWorldGame } from '../src/systems/game';

/** The investigator in `region` for `seconds`, the camera `back` metres behind and above: the puffs they breathed. */
function breathe(region: string, seconds: number, set: (g: ReturnType<typeof createWorldGame>) => void = () => {}, o: { back?: number; hidden?: boolean } = {}) {
  const g = createWorldGame();
  g.overworld!.region = region;
  set(g);
  const born: ParticleSpec[] = [];
  const b = createBreath(g, { spawn: (p: ParticleSpec) => born.push(p) } as unknown as Particles);
  const me = g.ecs.c.transform.get(g.player.id)!;
  const camera = new THREE.PerspectiveCamera();
  camera.position.set(me.pos.x, me.pos.y + 3, me.pos.z - (o.back ?? 5));
  for (let i = 0; i < seconds * 60; i++) b.update(camera, i / 60, o.hidden ?? false);
  return { born, me, g };
}

describe('the breath in the cold (round 80)', () => {
  it('names real regions, and is coldest on the plateau', () => {
    for (const id of Object.keys(COLD)) expect(REGION_IDS, id).toContain(id);
    expect(Math.max(...Object.values(COLD))).toBe(COLD.mountains);
    expect(COLD.vermont).toBeGreaterThan(COLD.hub!);
    expect(COLD.rlyeh).toBeUndefined();
  });

  it('is colder in the deep of the night, and colder still in a storm', () => {
    expect(coldOf('mountains', 1, false)).toBe(1);
    expect(coldOf('mountains', 0, false)).toBeCloseTo(BREATH.night, 5);
    expect(coldOf('mountains', 1, true)).toBeCloseTo(1 + BREATH.storm, 5);
    expect(coldOf('rlyeh', 1, false)).toBe(0);
    expect(coldOf(null, 1, false)).toBe(0);
  });

  it('breathes slow at rest, quicker walking, and short when spent', () => {
    expect(cycleOf(100, false, 0)).toBe(BREATH.period.rest);
    expect(cycleOf(100, false, 3)).toBe(BREATH.period.walk);
    expect(cycleOf(100, true, 6)).toBe(BREATH.period.spent);
    expect(cycleOf(0.1, false, 0)).toBe(BREATH.period.spent);
    expect(BREATH.period.spent).toBeLessThan(BREATH.period.walk);
    expect(BREATH.period.walk).toBeLessThan(BREATH.period.rest);
  });

  it('ghosts out in front of the face at the height of the mouth, and goes on the wind', () => {
    const { born, me } = breathe('mountains', 20);
    expect(born.length).toBeGreaterThan(10);
    for (const p of born) {
      expect(p.y).toBeGreaterThan(me.pos.y + BREATH.head - 0.1);
      expect(p.y).toBeLessThan(me.pos.y + BREATH.head + 0.1);
      expect(p.shape).toBe('wisp');
      expect(p.grow).toBe(BREATH.grow);
      expect(p.glow).toBeUndefined(); // lit by the lantern and the moon, not a light of its own
    }
    const fwd = born.map((p) => ((p.vx ?? 0) * Math.sin(me.yaw) + (p.vz ?? 0) * Math.cos(me.yaw)));
    expect(fwd.reduce((n, v) => n + v, 0) / fwd.length).toBeGreaterThan(0.3); // forward, from the mouth
  });

  it('is heavier and more often when spent, and none when warm, hidden, mounted or in a close shot', () => {
    const rest = breathe('mountains', 30).born;
    const spent = breathe('mountains', 30, (g) => void (g.player.sprinting = true)).born;
    expect(spent.length).toBeGreaterThan(rest.length * 2);
    expect(Math.max(...spent.map((p) => p.alpha ?? 0))).toBeGreaterThan(Math.max(...rest.map((p) => p.alpha ?? 0)));
    expect(breathe('rlyeh', 30).born).toHaveLength(0);
    expect(breathe('mountains', 30, () => {}, { hidden: true }).born).toHaveLength(0);
    expect(breathe('mountains', 30, (g) => void (g.player.mount.active = 'horse' as never)).born).toHaveLength(0);
    expect(breathe('mountains', 30, () => {}, { back: -0.5 }).born).toHaveLength(0); // the lens is at the face
    const low = breathe('mountains', 30, (g) => void (g.ecs.c.stamina.get(g.player.id)!.value = 5)).born;
    expect(low.length).toBeGreaterThan(rest.length * 2);
  });

  it('writes nothing to the body', () => {
    const { g } = breathe('mountains', 20, (g) => void (g.ecs.c.stamina.get(g.player.id)!.value = 40));
    expect(g.ecs.c.stamina.get(g.player.id)!.value).toBe(40);
  });
});
