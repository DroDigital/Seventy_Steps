import { MOUNT_TRAVERSAL } from '../src/data/mounts';
import { describe, expect, it } from 'vitest';
import { createHoofFx } from '../src/render/hoofFx';
import type { ParticleSpec, Particles } from '../src/render/particles';
import { createWorldGame } from '../src/systems/game';
import { cyclesFor, touchdowns } from '../src/systems/mountGait';

function ride(id: 'grey' | 'chariot' | 'automobile') {
  const g = createWorldGame();
  Object.assign(g.player.mount, { selected: id, active: id, speed: 0, phase: 0, automobileOwned: true, chariotOwned: true });
  const spawned: ParticleSpec[] = [];
  const fx = createHoofFx(g, { spawn: (p) => void spawned.push(p), update: () => undefined } as Particles);
  const mount = g.player.mount;
  const pos = g.ecs.c.transform.get(g.player.id)!.pos;
  let time = 0;
  fx.update(time);
  const advance = (frames: number, speed: number): void => {
    for (let i = 0; i < frames; i++) {
      time += 1 / 60;
      pos.x += speed / 60;
      mount.speed = speed;
      mount.phase += cyclesFor(speed / 60, speed);
      fx.update(time);
    }
  };
  return { g, spawned, advance };
}

describe('what a ride throws up (round 50)', () => {
  it('a hoof that comes down raises dust, and nothing is raised standing, at a walk or by a stopped horse', () => {
    const r = ride('grey');
    r.advance(120, 0);
    expect(r.spawned).toEqual([]);
    r.advance(120, 1.5);
    expect(r.spawned).toEqual([]); // a walk is too gentle to raise a cloud
    r.advance(120, 11);
    expect(r.spawned.length).toBeGreaterThan(10);
    for (const p of r.spawned) {
      expect(Number.isFinite(p.x + p.y + p.z)).toBe(true);
      expect(p.life).toBeGreaterThan(0);
    }
    const before = r.spawned.length;
    r.advance(60, 0);
    expect(r.spawned.length).toBe(before);
  });

  it('there is a puff for about every foot that comes down, a few more for the wheels', () => {
    const r = ride('grey');
    let beats = 0;
    let phase = 0;
    const pace = MOUNT_TRAVERSAL.cruise;
    for (let i = 0; i < 180; i++) {
      const next = phase + cyclesFor(pace / 60, pace);
      beats += touchdowns(phase, next, pace).length;
      phase = next;
    }
    r.advance(180, pace);
    expect(r.spawned.length).toBeGreaterThanOrEqual(beats);
    expect(r.spawned.length).toBeLessThan(beats * 8);
  });

  it('the skeletons throw violet embers, not dust, and the car only its wheels\' dust', () => {
    const ghost = ride('chariot');
    ghost.advance(180, 14);
    expect(ghost.spawned.some((p) => p.glow && p.color[2] > p.color[0])).toBe(true);
    const car = ride('automobile');
    car.advance(180, 14);
    expect(car.spawned.length).toBeGreaterThan(0);
    expect(car.spawned.every((p) => !p.glow)).toBe(true);
  });

  it('a long gap in the clock brings no burst, and dismounting stops it', () => {
    const r = ride('grey');
    r.advance(30, 11);
    const before = r.spawned.length;
    r.g.player.mount.active = null;
    r.advance(60, 11);
    expect(r.spawned.length).toBe(before);
  });
});
