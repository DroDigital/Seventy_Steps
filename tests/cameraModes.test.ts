/** The camera's three looks (round 77): Classic is the boom as it was; the others hang differently, and Low hero frames a locked-on foe. */

import { PerspectiveCamera } from 'three';
import { describe, expect, it } from 'vitest';
import { v3, type V3 } from '../src/core/geom';
import { CAMERA_MODES, CAMERA_MODE_IDS, cameraModeOf, type CameraMode } from '../src/data/cameraModes';
import { getEntity } from '../src/data/registry';
import { CAMERA, RENDER, SETTINGS } from '../src/data/tuning';
import { fovOf, nearLens } from '../src/render/followCamera';
import { anchorPoint, createCameraRig, fitFov, hangPoint, resetAim, resetBoom, setCameraMode, stepCamera, type CameraRig, type Frame } from '../src/systems/camera';
import { toCombatant } from '../src/systems/creatures';
import { setLock } from '../src/systems/lockOn';
import { steps, scriptedGame } from './helpers';
import type { CollisionWorld } from '../src/world/colliders';
import { createArenaWorld } from '../src/world/arena';

const open: CollisionWorld = { colliders: [], off: new Set(), ground: () => 0, contain: () => undefined }; // flat ground, no walls
const RAD = Math.PI / 180;
const still = { lookX: 0, lookY: 0, behind: 0 };

/** Steps a rig on a lock of `foe` (or none) with the investigator at `pivot`. */
function run(rig: CameraRig, n: number, pivot: V3, foe: Frame | null, w: CollisionWorld = open): void {
  const focus = foe ? { x: foe.feet.x, y: foe.feet.y + Math.min(6, foe.height * 0.6), z: foe.feet.z } : null;
  for (let i = 0; i < n; i++) stepCamera(rig, { ...still, pivot, focus, frame: foe }, w, 1 / 60);
}

/** Is `p` inside the lens's vertical and horizontal field of view? (The picture is 16:9.) */
function seen(rig: CameraRig, pivot: V3, p: V3, room = 1): boolean {
  const { base } = hangPoint(open, anchorPoint(pivot, rig.yaw, rig.lead, rig.rise), rig.yaw, undefined, CAMERA_MODES[rig.mode].shoulder);
  const [look, to] = [sub(base, rig.pos), sub(p, rig.pos)];
  const [lp, tp] = [Math.atan2(look.y, Math.hypot(look.x, look.z)), Math.atan2(to.y, Math.hypot(to.x, to.z))];
  const vertical = (rig.fov * RAD) / 2;
  const horizontal = Math.atan(Math.tan(vertical) * (16 / 9));
  const turn = Math.abs(Math.atan2(to.x, to.z) - Math.atan2(look.x, look.z));
  return Math.abs(tp - lp) < vertical * room && Math.min(turn, 2 * Math.PI - turn) < horizontal * room;
}
const sub = (a: V3, b: V3): V3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const horizontal = (a: V3, b: V3): number => Math.hypot(a.x - b.x, a.z - b.z);

describe('the setting', () => {
  it('names a look for each value, Classic for the default and for anything out of range', () => {
    expect(CAMERA_MODE_IDS.map((_, i) => cameraModeOf(i))).toEqual(['classic', 'hero', 'shoulder']);
    expect(cameraModeOf(SETTINGS.camera[3])).toBe('classic');
    expect(cameraModeOf(-4)).toBe('classic');
    expect(cameraModeOf(99)).toBe('shoulder');
    expect(SETTINGS.camera[1]).toBe(CAMERA_MODE_IDS.length - 1);
  });

  it('keeps Classic as the numbers it always had', () => {
    const c = CAMERA_MODES.classic;
    expect([c.pivotHeight, c.distance, c.shoulder, c.pitch, c.fov, c.frame]).toEqual([CAMERA.pivotHeight, CAMERA.distance, CAMERA.shoulder, CAMERA.pitch, RENDER.fovDeg, null]);
    expect(createCameraRig(0).mode).toBe('classic');
  });
});

describe('Classic', () => {
  it('is not moved by a foe held in the lock: the same camera with or without a frame', () => {
    const [a, b] = [createCameraRig(0), createCameraRig(0)];
    const foe: Frame = { feet: v3(0, 0, 8), height: 14 };
    run(a, 240, v3(0, CAMERA.pivotHeight, 0), foe);
    for (let i = 0; i < 240; i++) stepCamera(b, { ...still, pivot: v3(0, CAMERA.pivotHeight, 0), focus: { x: 0, y: 6, z: 8 } }, open, 1 / 60); // (the same lock, the frame left out)
    expect(a.lead).toBe(0);
    expect(a.rise).toBe(0);
    expect(a.reach).toBe(CAMERA.distance);
    expect(a.fov).toBe(RENDER.fovDeg);
    expect(a.pos).toEqual(b.pos);
    expect(a.pitch).toBe(b.pitch);
  });
});

describe('the looks that frame a foe', () => {
  const colossus: Frame = { feet: v3(0, 0, 8), height: 14 };
  const person: Frame = { feet: v3(0, 0, 5), height: 1.8 };
  const looks: CameraMode[] = ['hero'];

  for (const mode of looks) {
    const tune = CAMERA_MODES[mode];
    const pivot = v3(0, tune.pivotHeight, 0);

    it(`${mode}: stands back and takes in all of a colossus, which Classic's boom does not`, () => {
      const rig = createCameraRig(0, mode);
      run(rig, 400, pivot, colossus);
      expect(rig.lead).toBeCloseTo(4, 0); // half the way to it
      expect(rig.rise).toBeGreaterThan(2); // up toward its middle
      expect(horizontal(rig.pos, pivot)).toBeGreaterThan(CAMERA.distance * 1.6);
      const top = v3(0, 14, 8);
      const feet = v3(0, 0, 8);
      expect([seen(rig, pivot, top, 0.97), seen(rig, pivot, feet, 0.97), seen(rig, pivot, pivot, 0.97)]).toEqual([true, true, true]); // the horror whole, and the investigator before it, with a little of the picture to spare
    });

    it(`${mode}: the lens stays on the line the picture looks along, behind the investigator`, () => {
      const rig = createCameraRig(0, mode);
      run(rig, 400, pivot, colossus);
      expect(Math.abs(rig.pos.x - pivot.x)).toBeLessThan(tune.shoulder + 0.01); // no sideways drift but the shoulder
      expect(rig.pos.z).toBeLessThan(pivot.z); // behind: the foe is toward +z
      expect(rig.yaw).toBeCloseTo(0, 3);
    });

    it(`${mode}: a person is framed closely and the lens is not narrowed for them`, () => {
      const rig = createCameraRig(0, mode);
      run(rig, 400, pivot, person);
      const f = tune.frame!;
      expect(horizontal(rig.pos, pivot)).toBeLessThan(Math.max(tune.distance, f.back[0] + f.back[1] * 1.8) + 1); // its own boom, or the little more a person asks
      expect(rig.fov).toBeCloseTo(tune.fov, 0);
      expect(seen(rig, pivot, v3(0, 1.8, 5))).toBe(true);
    });

    it(`${mode}: lets go slowly when the lock is lost, and comes back to its own boom`, () => {
      const rig = createCameraRig(0, mode);
      run(rig, 400, pivot, colossus);
      const [lead, reach] = [rig.lead, rig.reach];
      run(rig, 20, pivot, null);
      expect(rig.lead).toBeGreaterThan(lead * 0.3); // a third of a second later, a good part is still there: no cut
      expect(rig.lead).toBeLessThan(lead);
      expect(rig.reach).toBeGreaterThan(tune.distance + (reach - tune.distance) * 0.3);
      run(rig, 600, pivot, null);
      expect(rig.lead).toBeLessThan(0.05);
      expect(Math.abs(rig.rise)).toBeLessThan(0.05);
      expect(rig.reach).toBeCloseTo(tune.distance, 1);
      expect(rig.fov).toBeCloseTo(tune.fov, 0);
    });

    it(`${mode}: the lens moves smoothly as a lock is taken, never more than a step's share of the boom`, () => {
      const rig = createCameraRig(0, mode);
      run(rig, 60, pivot, null);
      let worst = 0;
      let last = { ...rig.pos };
      for (let i = 0; i < 300; i++) {
        run(rig, 1, pivot, colossus);
        worst = Math.max(worst, Math.hypot(rig.pos.x - last.x, rig.pos.y - last.y, rig.pos.z - last.z));
        last = { ...rig.pos };
      }
      expect(worst).toBeLessThan(0.6);
    });
  }

  it('a talk, a rig driven: no frame is asked of them (the frame comes only with a lock)', () => {
    const rig = createCameraRig(0, 'hero');
    for (let i = 0; i < 300; i++) stepCamera(rig, { ...still, pivot: v3(0, 1.05, 0), focus: { x: 0, y: 1.5, z: 4 } }, open, 1 / 60);
    expect([rig.lead, rig.rise]).toEqual([0, 0]);
  });

  it('a wall stops the anchor short, as it stops the boom', () => {
    const w = createArenaWorld();
    const rig = createCameraRig(0, 'hero');
    const pivot = v3(-8, 1.05, -2); // the pillar at (-8, 1) is between it and a foe beyond
    run(rig, 300, pivot, { feet: v3(-8, 0, 6), height: 14 }, w);
    expect(rig.lead).toBeLessThan(2.2);
  });
});

describe('fitting a foe in the lens', () => {
  it('asks for the field of view that holds a foe from its feet to its top, with a little to spare', () => {
    // the lens 2 m up and 10 m behind the point it looks at, a 14 m foe standing 20 m from the lens
    const fov = fitFov(v3(0, 2, -10), v3(0, 1.5, 0), v3(0, 0, 10), 14);
    expect(fov).toBeCloseTo(78, 0);
    expect(fitFov(v3(0, 2, -10), v3(0, 1.5, 0), v3(0, 0, 10), 1.8)).toBeLessThan(15); // a person: a narrow lens does
  });

  it('widens the lens as a framed foe comes near, so the whole of it stays in the picture', () => {
    const tune = CAMERA_MODES.hero;
    const pivot = v3(0, tune.pivotHeight, 0);
    for (const gap of [10, 5, 3]) {
      const rig = createCameraRig(0, 'hero');
      const foe: Frame = { feet: v3(0, 0, gap), height: 14 };
      run(rig, 500, pivot, foe);
      expect(seen(rig, pivot, v3(0, 14, gap), 1), `${gap} m`).toBe(true);
      expect(seen(rig, pivot, v3(0, 0, gap), 1), `${gap} m`).toBe(true);
    }
  });
});

describe('changing the look', () => {
  it('takes up the new look at its own resting pitch and boom, and does nothing for the look it has', () => {
    const rig = createCameraRig(1, 'classic');
    run(rig, 30, v3(0, 1.7, 0), null);
    rig.pitch = 0.9;
    setCameraMode(rig, 'classic');
    expect(rig.pitch).toBe(0.9);
    setCameraMode(rig, 'hero');
    expect([rig.mode, rig.pitch, rig.prevPitch, rig.dist, rig.reach, rig.fov, rig.yaw]).toEqual(['hero', CAMERA_MODES.hero.pitch, CAMERA_MODES.hero.pitch, 4.4, 4.4, 76, rig.yaw]);
    expect(rig.yaw).toBeCloseTo(1, 1);
  });

  it('a respawn or a journey sets each look to rest: no framing, no lift, the look\'s boom', () => {
    for (const mode of CAMERA_MODE_IDS) {
      const rig = createCameraRig(0, mode);
      Object.assign(rig, { lead: 5, rise: 3, reach: 20, fov: 20, mountLift: 1, dist: 2 });
      resetBoom(rig);
      resetAim(rig, 2);
      const t = CAMERA_MODES[mode];
      expect([rig.lead, rig.rise, rig.reach, rig.fov, rig.mountLift, rig.dist, rig.pitch, rig.yaw]).toEqual([0, 0, t.distance, t.fov, 0, t.distance, t.pitch, 2]);
    }
  });
});

describe('what the game gives the camera', () => {
  it('reads a colossus as tall and a person as a person', () => {
    const size = (id: string): number => {
      const c = toCombatant(getEntity(id)!);
      return Math.max(c.height, c.reach ?? 0);
    };
    expect(size('colossus_pyramids')).toBeGreaterThan(8);
    expect(size('edward_hutchinson')).toBeLessThan(3);
  });

  it('a lock held in the game is framed in Low hero and not in Classic', () => {
    for (const [mode, framed] of [['hero', true], ['classic', false]] as const) {
      const { g, deepOne } = scriptedGame();
      setCameraMode(g.camera, mode);
      setLock(g, deepOne);
      steps(g, 240);
      expect(g.camera.lead > 0.5, mode).toBe(framed);
    }
  });

  it('keeps the world\'s clear zone and the listener within reach of the investigator when the boom runs long', () => {
    const { g, player } = scriptedGame();
    const me = g.ecs.c.transform.get(player)!.pos;
    const camera = new PerspectiveCamera();
    camera.position.set(me.x + 3, me.y + 2, me.z + 3);
    expect(nearLens(camera, g)).toBe(camera.position); // a short boom: the lens itself
    camera.position.set(me.x, me.y + 4, me.z - 14);
    const at = nearLens(camera, g);
    expect(Math.hypot(at.x - me.x, at.z - me.z)).toBeCloseTo(CAMERA.near, 5);
    expect(at.z).toBeLessThan(me.z); // on the same side of them as the lens
    g.camera.prevFov = 70;
    g.camera.fov = 60;
    expect(fovOf(g, 0.5)).toBe(65);
  });
});
