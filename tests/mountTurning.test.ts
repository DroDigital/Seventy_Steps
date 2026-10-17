import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { wrapAngle } from '../src/core/geom';
import { emptyInput } from '../src/core/input';
import { MOUNT_QUEST, MOUNT_TRAVERSAL as T, MOUNT_TURNING } from '../src/data/mounts';
import { QUESTS } from '../src/data/quests';
import { SIM } from '../src/data/tuning';
import { teleport } from '../src/systems/checkpoints';
import type { Game } from '../src/systems/components';
import { createWorldGame } from '../src/systems/game';
import { paceFor, steerArcade, steerHorse, turnCap, turnRadius } from '../src/systems/mountSteer';
import { controlMount, selectMount, setAutomobileEntitlement, setChariotEntitlement, toggleMount } from '../src/systems/mounts';
import { movementSystem } from '../src/systems/movement';
import { swingAbout } from '../src/render/mountKit';

const horse = MOUNT_TURNING.grey;
const DT = 1 / SIM.hz;

describe('a horse-drawn rig comes round on a circle (round 52)', () => {
  it('the faster it goes, the wider its tightest circle, and the slower it must go to turn tightly', () => {
    let last = 0;
    for (const v of [0, 1.5, 4, 8, 11, 18]) {
      const r = turnRadius(v, horse);
      expect(r).toBeGreaterThanOrEqual(last);
      last = r;
    }
    expect(turnRadius(0, horse)).toBeLessThan(3);
    expect(turnRadius(T.gallop, horse)).toBeGreaterThan(12);
    for (const v of [2.4, 6, 11, 18]) expect(turnCap(v, horse)).toBeLessThanOrEqual(v / turnRadius(v, horse) + horse.pivot * Math.max(0, 1 - v / 4) + 1e-9);
    expect(turnCap(0, horse)).toBeCloseTo(horse.pivot, 5); // a horse steps round on the spot, slowly
    expect(turnCap(T.gallop, horse)).toBeLessThan(turnCap(6, horse) + 0.3);
  });

  it('a small error keeps the pace asked for; a turn about brings it to a creep and no lower', () => {
    expect(paceFor(11, 0.1, horse)).toBe(11);
    expect(paceFor(11, Math.PI, horse)).toBeCloseTo(horse.creep, 5);
    expect(paceFor(1, Math.PI, horse)).toBe(1); // a gentle push is not raised to a creep
    let last = 11;
    for (const e of [0.4, 0.8, 1.2, 1.6, 2, 3]) {
      const v = paceFor(11, e, horse);
      expect(v).toBeLessThanOrEqual(last + 1e-9);
      last = v;
    }
  });

  it('a U-turn at a cruise never stops, never spins on the spot, follows a circle no tighter than it may, and comes round in a few seconds', () => {
    let [yaw, rate, speed, x, z]: number[] = [0, 0, T.cruise, 0, 0];
    const path: [number, number][] = [];
    let frames = 0;
    let slowest = Infinity;
    let peak = 0;
    while (frames < 60 * 12) {
      const before = speed;
      const s = steerHorse(horse, rate, speed, yaw, Math.PI - 1e-3, T.cruise, DT);
      [rate, speed] = [s.yawRate, s.speed];
      yaw = wrapAngle(yaw + rate * DT);
      x += Math.sin(yaw) * speed * DT;
      z += Math.cos(yaw) * speed * DT;
      path.push([x, z]);
      slowest = Math.min(slowest, speed);
      peak = Math.max(peak, Math.abs(rate) / Math.max(1e-6, turnCap(Math.max(before, speed), horse)));
      frames++;
      if (Math.abs(wrapAngle(Math.PI - yaw)) < 0.02) break;
    }
    expect(Math.abs(wrapAngle(Math.PI - yaw))).toBeLessThan(0.05); // it came round
    expect(slowest).toBeGreaterThanOrEqual(horse.creep - 0.01); // never to a stop
    expect(peak).toBeLessThanOrEqual(1.001); // never faster than the circle it is on allows
    expect(frames / 60).toBeGreaterThan(1.6); // not a spin
    expect(frames / 60).toBeLessThan(6);
    const [cx, cz] = [(path[0]![0] + x) / 2, (path[0]![1] + z) / 2]; // the loop's width: its diameter at least twice the tightest radius it reached
    const width = Math.max(...path.map(([px, pz]) => Math.hypot(px - cx, pz - cz))) * 2;
    expect(width).toBeGreaterThan(turnRadius(horse.creep, horse) * 1.2);
  });

  it('with the stick let go it comes to a stop straight, and turns no more', () => {
    let [yaw, rate, speed]: number[] = [0.3, 0.8, T.cruise];
    for (let i = 0; i < 240; i++) {
      const s = steerHorse(horse, rate, speed, yaw, null, 0, DT);
      [rate, speed] = [s.yawRate, s.speed];
      yaw += rate * DT;
    }
    expect(speed).toBe(0);
    expect(Math.abs(rate)).toBeLessThan(1e-6);
  });

  it('standing, it steps round toward a heading at its pivot rate, stepping off at once', () => {
    let [yaw, rate, speed]: number[] = [0, 0, 0];
    for (let i = 0; i < 30; i++) {
      const s = steerHorse(horse, rate, speed, yaw, Math.PI / 2, T.cruise, DT);
      [rate, speed] = [s.yawRate, s.speed];
      yaw += rate * DT;
    }
    expect(yaw).toBeGreaterThan(0.15);
    expect(speed).toBeGreaterThan(1); // it steps off at once
    expect(speed).toBeLessThan(paceFor(T.cruise, 0, horse)); // and does not leap to a cruise with the heading still far off
  });

  it('the car keeps its fixed steering rate, and holds a creep rather than a stop while it points the wrong way', () => {
    const car = MOUNT_TURNING.automobile;
    let [yaw, speed]: number[] = [0, T.cruise];
    let slowest = Infinity;
    for (let i = 0; i < 60 * 6 && Math.abs(wrapAngle(Math.PI - yaw)) > 0.02; i++) {
      const s = steerArcade(car, speed, yaw, Math.PI - 1e-3, T.cruise, DT, false);
      expect(Math.abs(s.yawRate)).toBeLessThanOrEqual(T.turnRate + 1e-9);
      speed = s.speed;
      yaw += s.yawRate * DT;
      slowest = Math.min(slowest, speed);
    }
    expect(slowest).toBeGreaterThanOrEqual(car.creep - 0.01);
    expect(Math.abs(wrapAngle(Math.PI - yaw))).toBeLessThan(0.05);
  });

  it('the horse leads a turn about the collar its shafts meet: the collar stays where it was, the horse swings round it', () => {
    const horseRoot = new THREE.Group();
    const home = { x: 0, z: 2.5 };
    const pivot = { x: 0, z: 3 };
    for (const angle of [-0.3, 0, 0.2, 0.32]) {
      horseRoot.position.set(home.x, 0, home.z);
      swingAbout(horseRoot, home, pivot, angle);
      horseRoot.updateMatrixWorld(true);
      const at = horseRoot.localToWorld(new THREE.Vector3(0, 0, 0.5));
      expect(at.x).toBeCloseTo(pivot.x, 6);
      expect(at.z).toBeCloseTo(pivot.z, 6);
      expect(horseRoot.rotation.y).toBe(angle);
    }
  });
});

/** An open patch of ground, the borrowed reins done. */
function openGame(): Game {
  const g = createWorldGame();
  g.world = { ground: () => 0, colliders: [], off: new Set(), contain: () => {} };
  teleport(g, { x: 256, z: 240, yaw: 0 });
  g.overworld!.quests.set(MOUNT_QUEST, QUESTS[MOUNT_QUEST].stages.length);
  return g;
}

const where = (g: Game) => g.ecs.c.transform.get(g.player.id)!;

/** Holds the stick toward `heading` (a world yaw: the camera yaw is set to 0, so moveY is +z and moveX is -x ... as `controlMount` turns it). */
function hold(g: Game, heading: number, gallop = false): void {
  g.camera.yaw = 0;
  const input = emptyInput();
  input.moveY = Math.cos(heading);
  input.moveX = -Math.sin(heading); // x = s*moveY - c*moveX with the camera at yaw 0: x = -moveX
  input.held.dodge = gallop;
  if (gallop) input.pressed.dodge = true;
  controlMount(g, input);
}

describe('a rig riding the world does not stop to turn (round 52)', () => {
  it.each(['grey', 'chariot', 'automobile'] as const)('%s: turned about at a cruise in the open, it keeps moving the whole way round', (id) => {
    const g = openGame();
    setAutomobileEntitlement(g, true);
    setChariotEntitlement(g, true);
    expect(selectMount(g, id)).toBe(true);
    expect(toggleMount(g)).toBe(true);
    for (let i = 0; i < 60; i++) { hold(g, 0); movementSystem(g, DT); }
    expect(g.player.mount.speed).toBeCloseTo(T.cruise, 0);
    let slowest = Infinity;
    for (let i = 0; i < 60 * 8; i++) {
      hold(g, Math.PI - 1e-3);
      movementSystem(g, DT);
      slowest = Math.min(slowest, g.player.mount.speed);
      if (Math.abs(wrapAngle(Math.PI - where(g).yaw)) < 0.03) break;
    }
    expect(Math.abs(wrapAngle(Math.PI - where(g).yaw))).toBeLessThan(0.06);
    expect(slowest).toBeGreaterThan(MOUNT_TURNING[id].creep - 0.3);
  });

  it('a horse-drawn rig turned against a wall it cannot swing into is backed off it and comes round, where it used to stand fast', () => {
    const g = openGame();
    expect(toggleMount(g)).toBe(true);
    const p = where(g);
    // A wall across the rig's nose, a hand's breadth from it, and one down its left side: swinging left would take its whole length into the wall.
    const nose = p.pos.z + Math.max(...T.offsets) + T.radius;
    g.world.colliders.push({ kind: 'box', min: { x: 240, y: -1, z: nose + 0.35 }, max: { x: 272, y: 5, z: nose + 0.5 } });
    g.world.colliders.push({ kind: 'box', min: { x: p.pos.x + T.radius + 0.12, y: -1, z: p.pos.z - 6 }, max: { x: p.pos.x + T.radius + 0.3, y: 5, z: nose + 0.5 } });
    for (let i = 0; i < 20; i++) { hold(g, 0); movementSystem(g, DT); }
    const start = { ...p.pos };
    let turned = false;
    for (let i = 0; i < 60 * 6; i++) {
      hold(g, -Math.PI / 2); // away from the wall on the left, toward the open side
      movementSystem(g, DT);
      if (Math.abs(wrapAngle(-Math.PI / 2 - p.yaw)) < 0.1) { turned = true; break; }
    }
    expect(turned).toBe(true);
    expect(Math.hypot(p.pos.x - start.x, p.pos.z - start.z)).toBeLessThan(12); // it came round within a few lengths
    expect(g.player.mount.active).not.toBe(null);
  });

  it('a rider driving straight at a wall stops at it, and the rig is not slid along it', () => {
    const g = openGame();
    expect(toggleMount(g)).toBe(true);
    g.world.colliders.push({ kind: 'box', min: { x: 240, y: -1, z: 256 }, max: { x: 272, y: 5, z: 256.2 } });
    for (let i = 0; i < 60 * 4; i++) { hold(g, 0); movementSystem(g, DT); }
    expect(g.player.mount.speed).toBe(0);
    expect(where(g).pos.x).toBeCloseTo(256, 1);
    expect(where(g).yaw).toBeCloseTo(0, 2);
  });

  it('the turn the picture shows is the rig\'s own rate, positive to the left', () => {
    const g = openGame();
    expect(toggleMount(g)).toBe(true);
    for (let i = 0; i < 60; i++) { hold(g, 0); movementSystem(g, DT); }
    for (let i = 0; i < 20; i++) { hold(g, 1.2); movementSystem(g, DT); }
    expect(g.player.mount.yawRate).toBeGreaterThan(0.3);
    for (let i = 0; i < 400; i++) { hold(g, -1.2); movementSystem(g, DT); if (g.player.mount.yawRate < -0.3) break; }
    expect(g.player.mount.yawRate).toBeLessThan(-0.3);
  });
});
