import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import type { MountId } from '../src/data/mounts';
import { createMountAudio } from '../src/render/audio/mountAudio';
import { buildFigure } from '../src/render/figures';
import { createMountViews } from '../src/render/mountViews';
import { createGame } from '../src/systems/game';
import { HORSE_TOSS, tossAt, type HorseToss } from '../src/systems/horseIdle';
import { cyclesFor } from '../src/systems/mountGait';
import { createMountState, dismissMount } from '../src/systems/mounts';

const DT = 1 / 60;
interface Heard { key: string; at: number }
interface Pose { neck: number; head: number; bitY: number }

/** The source scheduler, with an explicit render clock rather than a second clock in the test. */
function horse(id: MountId = 'grey') {
  const g = createGame({ seed: 148 });
  Object.assign(g.player.mount, { active: id, selected: id, speed: 0, phase: 0 });
  const heard: Heard[] = [];
  let time = 0;
  let randomState = 11;
  const withAudioRandom = (fn: () => void): void => {
    const original = Math.random;
    Math.random = () => { randomState = (randomState * 1664525 + 1013904223) >>> 0; return randomState / 4294967296; };
    try { fn(); } finally { Math.random = original; }
  }; // Three's UUID generation must not consume the scheduler's seeded choices
  let beforeAudio: ((time: number, dt: number) => void) | undefined;
  let onSound: ((key: string) => void) | undefined;
  const audio = createMountAudio(g, (key) => {
    heard.push({ key, at: time });
    onSound?.(key);
    return true;
  });
  g.seaTime = () => time;
  withAudioRandom(() => audio.update(DT, time));
  const step = (speed = 0, dt = DT): void => {
    time += dt;
    g.frame++;
    const tr = g.ecs.c.transform.get(g.player.id)!;
    tr.prev = { ...tr.pos };
    tr.pos.x += speed * dt;
    g.player.mount.speed = speed;
    g.player.mount.phase += cyclesFor(speed * dt, speed);
    beforeAudio?.(time, dt); // main.ts places the visible mount before updating its audio
    withAudioRandom(() => audio.update(dt, time));
  };
  const untilToss = (): HorseToss => {
    for (let frame = 0; frame < 300 * 60; frame++) {
      step();
      if (g.player.mount.idleToss) return g.player.mount.idleToss;
    }
    throw new Error('seeded standing horse did not choose a head toss in five minutes');
  };
  return {
    g, heard, step, untilToss,
    get time() { return time; },
    beforeAudio(fn: (time: number, dt: number) => void) { beforeAudio = fn; },
    onSound(fn: (key: string) => void) { onSound = fn; },
  };
}

/** Two real mount views at identical clocks: the second has only its optional toss cue removed. */
function compareWithCalm(r: ReturnType<typeof horse>) {
  const scene = new THREE.Scene(), calmScene = new THREE.Scene();
  const figure = buildFigure('player'), calmFigure = buildFigure('player');
  const view = createMountViews(scene, r.g), calmView = createMountViews(calmScene, r.g);
  let shown: Pose | undefined, calm: Pose | undefined;
  const pose = (from: THREE.Scene): Pose => {
    const draft = from.getObjectByName('mount-grey')!.getObjectByName('draft-horse')!;
    draft.updateWorldMatrix(true, true);
    return {
      neck: draft.getObjectByName('neck')!.rotation.x,
      head: draft.getObjectByName('head')!.rotation.x,
      bitY: draft.getObjectByName('draft-bit')!.getWorldPosition(new THREE.Vector3()).y,
    };
  };
  const render = (time: number, dt: number): void => {
    const tr = r.g.ecs.c.transform.get(r.g.player.id)!;
    figure.root.position.set(tr.pos.x, tr.pos.y, tr.pos.z);
    figure.root.rotation.set(0, tr.yaw, 0);
    view.place(figure, time, dt);
    const cue = r.g.player.mount.idleToss;
    r.g.player.mount.idleToss = null;
    try {
      calmFigure.root.position.set(tr.pos.x, tr.pos.y, tr.pos.z);
      calmFigure.root.rotation.set(0, tr.yaw, 0);
      calmView.place(calmFigure, time, dt);
    } finally {
      r.g.player.mount.idleToss = cue;
    }
    shown = pose(scene); calm = pose(calmScene);
  };
  r.beforeAudio(render);
  return {
    render,
    delta(): Pose {
      if (!shown || !calm) throw new Error('mount views have not rendered');
      return { neck: shown.neck - calm.neck, head: shown.head - calm.head, bitY: shown.bitY - calm.bitY };
    },
  };
}

describe('a standing horse tosses its head where its harness is heard', () => {
  it('raises the actual rig at the rattle, in the production view-before-audio order, then settles back to the same idle pose', () => {
    const r = horse(), visible = compareWithCalm(r);
    const rattles: { at: number; pose: Pose; envelope: number }[] = [];
    r.onSound((key) => {
      if (key === 'mount:grey:toss') rattles.push({ at: r.time, pose: visible.delta(), envelope: tossAt(r.time, r.g.player.mount.idleToss) });
    });
    const cue = r.untilToss();
    const breath = r.heard.at(-1)!;
    expect(breath.key).toMatch(/:(blow|snort)$/);
    expect(cue.start).toBeCloseTo(breath.at, 8);
    expect(cue.peak - cue.start).toBeGreaterThanOrEqual(0.28);
    expect(cue.peak - cue.start).toBeLessThanOrEqual(0.45);
    while (r.time <= cue.peak + 2 * DT) r.step();
    expect(rattles).toHaveLength(1);
    const rattle = rattles[0];
    expect(Math.abs(rattle.at - cue.peak)).toBeLessThanOrEqual(DT + 1e-8);
    expect(rattle.envelope).toBeGreaterThan(0.9);
    expect(rattle.pose.neck).toBeLessThan(-0.25);
    expect(rattle.pose.head).toBeLessThan(-0.09);
    expect(rattle.pose.bitY).toBeGreaterThan(0.12); // a visible head lift, rather than a sound key alone

    while (r.time <= cue.peak + HORSE_TOSS.settle + 2 * DT) r.step();
    expect(tossAt(r.time, cue)).toBe(0);
    for (const delta of Object.values(visible.delta())) expect(Math.abs(delta)).toBeLessThan(1e-8);
  });

  it.each(['moving', 'dismissed', 'long gap'] as const)('cancels the pending pose and rattle when %s before the peak', (cause) => {
    const r = horse(), visible = compareWithCalm(r);
    const cue = r.untilToss();
    expect(r.time).toBeLessThan(cue.peak);
    r.heard.length = 0;
    if (cause === 'dismissed') dismissMount(r.g);
    r.step(cause === 'moving' ? 0.5 : 0, cause === 'long gap' ? 1 : DT);
    expect(r.g.player.mount.idleToss).toBeNull();
    visible.render(r.time, 0);
    for (const delta of Object.values(visible.delta())) expect(Math.abs(delta)).toBeLessThan(1e-8);
    for (let frame = 0; frame < 90; frame++) r.step(cause === 'moving' ? 0.5 : 0);
    expect(r.heard.filter(h => h.key === 'mount:grey:toss')).toEqual([]);
    expect(r.g.player.mount.idleToss).toBeNull();
  });

  it('starts each mount lifecycle without a toss carried from an earlier summon', () => {
    expect(createMountState().idleToss).toBeNull();
    const r = horse();
    const oldCue = r.untilToss();
    dismissMount(r.g);
    expect(r.g.player.mount.idleToss).toBeNull();
    r.step();
    r.g.player.mount.active = 'grey';
    r.g.player.mount.idleToss = oldCue;
    r.step(); // the scheduler observes a new summon and clears stale presentation state
    expect(r.g.player.mount.idleToss).toBeNull();
    r.heard.length = 0;
    for (let frame = 0; frame < 90; frame++) r.step();
    expect(r.heard.filter(h => h.key === 'mount:grey:toss')).toEqual([]);
  });

  it.each(['chariot', 'automobile'] as const)('does not give the %s a living horse toss', (id) => {
    const r = horse(id);
    for (let frame = 0; frame < 120 * 60; frame++) {
      r.step();
      expect(r.g.player.mount.idleToss).toBeNull();
    }
    expect(r.heard.filter(h => h.key === 'mount:grey:toss')).toEqual([]);
  });
});
