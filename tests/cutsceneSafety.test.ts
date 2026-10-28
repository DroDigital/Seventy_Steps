import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { arrival, fall, shot, WAKE, type Scene } from '../src/data/cutscenes';
import { ENDING_SCENES } from '../src/data/cutscenesEndings';
import { BOSS, REALITY, SIM } from '../src/data/tuning';
import { emptyInput } from '../src/core/input';
import { createCinema } from '../src/render/cinema';
import { createActorViews } from '../src/render/actorViews';
import { sceneLength } from '../src/render/cinemaPlan';
import { startMove } from '../src/systems/actions';
import { brainSystem } from '../src/systems/brain';
import { meleeSystem, shove, strike, targetsOf, type Blow } from '../src/systems/combat';
import type { Game } from '../src/systems/components';
import { createGame, createWorldGame, stepGame } from '../src/systems/game';
import { allFogs, passFog } from '../src/systems/fogGates';
import { hazardSystem, spawnPool } from '../src/systems/hazards';
import { movementSystem } from '../src/systems/movement';
import { playerControl } from '../src/systems/playerControl';
import { boltSystem, loose } from '../src/systems/projectiles';
import { HOOKS } from '../src/systems/reality';
import { bleed, loseSanity, sanitySystem } from '../src/systems/sanity';
import { specialSystem } from '../src/systems/specials';
import type { CinemaUi } from '../src/ui/cinemaUi';
import { hookFight } from './bossHelpers';
import { place, scriptedGame } from './helpers';

const DT = 1 / SIM.hz;
const BLOW: Blow = { damage: 20, poise: 100, guard: 100, hitstop: 3, parryable: true, interrupts: true };
const scene = (sim: Scene['sim']): Scene => ({ id: sim, sim, slow: 0.28, shots: [shot({ dur: 1 })], beats: [] });

function cinemaFor(g: Game, enabled = true) {
  const ui: CinemaUi = { bars: vi.fn(), fade: vi.fn(), caption: vi.fn(), title: vi.fn(), hint: vi.fn(), clear: vi.fn(), wipe: vi.fn() };
  return createCinema(g, ui, { stinger: vi.fn(), sample: vi.fn() } as never, { spawn: vi.fn() } as never, { enabled: () => enabled });
}

beforeEach(() => {
  vi.stubGlobal('addEventListener', vi.fn());
  vi.stubGlobal('document', { addEventListener: vi.fn() });
});
afterEach(() => vi.unstubAllGlobals());

describe('cutscene protection', () => {
  it.each([WAKE, arrival('person', 'X', undefined), fall('person'), ...Object.values(ENDING_SCENES)])('protects the player throughout $id and releases them on completion', async (s) => {
    const { g, player, deepOne } = scriptedGame();
    const hp = g.ecs.c.health.get(player)!.hp;
    const hits = vi.fn();
    g.events.on('Hit', hits);
    const cinema = cinemaFor(g);
    const done = cinema.play(s);
    expect(g.cutscene).toBe(true);
    expect(targetsOf(g, deepOne)).not.toContain(player);
    expect(strike(g, deepOne, player, BLOW)).toBe('dodged');
    expect(g.ecs.c.health.get(player)!.hp).toBe(hp);
    expect(hits).not.toHaveBeenCalled();
    for (let n = 0; cinema.active && n < 8; n++) {
      if (cinema.waiting) cinema.act();
      cinema.step(sceneLength(s));
    }
    await done;
    expect(cinema.active).toBe(false);
    expect(g.cutscene).toBe(false);
    expect(targetsOf(g, deepOne)).toContain(player);
    strike(g, deepOne, player, BLOW);
    expect(g.ecs.c.health.get(player)!.hp).toBeLessThan(hp);
  });

  it('protects before the first beat, and keeps protection through skip fades and queued scenes', async () => {
    const { g, player, deepOne } = scriptedGame();
    const cinema = cinemaFor(g);
    const outcomes: string[] = [];
    g.events.on('Said', () => outcomes.push(strike(g, deepOne, player, BLOW)));
    const first = cinema.play({ ...scene('slow'), beats: [{ at: 0, voice: { by: 'boss:test', text: 'A line' } }] });
    const second = cinema.play(scene('frozen'));
    expect(outcomes).toEqual(['dodged']);
    cinema.step(0.65);
    cinema.skip();
    cinema.step(0.2);
    expect(cinema.active).toBe(true);
    expect(strike(g, deepOne, player, BLOW)).toBe('dodged');
    expect(cinema.step(0.21)).toBe(false); // no live world step between scenes
    expect(cinema.sceneId).toBe('frozen');
    expect(g.cutscene).toBe(true);
    expect(strike(g, deepOne, player, BLOW)).toBe('dodged');
    cinema.step(0.65);
    cinema.skip();
    cinema.step(0.41);
    await Promise.all([first, second]);
    expect(g.cutscene).toBe(false);
    expect(strike(g, deepOne, player, BLOW)).not.toBe('dodged');
  });

  it('does not leave protection on when cutscenes are disabled', async () => {
    const { g } = scriptedGame();
    const cinema = cinemaFor(g, false);
    await cinema.play(WAKE);
    expect(cinema.active).toBe(false);
    expect(g.cutscene).toBe(false);
  });

  it('lets the slowed world run without melee, existing bolts or existing pools hitting the player', () => {
    const { g, player, deepOne } = scriptedGame();
    place(g, player, 0, 0, 0);
    place(g, deepOne, 0, 1.2, Math.PI);
    const a = g.ecs.c.actor.get(deepOne)!;
    const attack = Object.keys(a.moves).find((id) => a.moves[id].hit)!;
    startMove(a, attack);
    a.frame = a.moves[attack].hit!.window[0];
    loose(g, deepOne, { x: 0, y: 1, z: 0.5 }, { x: 0, y: 0, z: -30 }, { speed: 30, radius: 0.2, range: 10, damage: 30, poise: 100, lob: false });
    spawnPool(g, deepOne, 'enemy', { x: 0, z: 0 }, { radius: 3, damage: 20, tick: 1, life: 100 });
    const hp = g.ecs.c.health.get(player)!.hp;
    const poise = g.ecs.c.poise.get(player)!.value;
    const hits = vi.fn();
    g.events.on('Hit', hits);
    const cinema = cinemaFor(g);
    void cinema.play(fall('person'));
    let steps = 0;
    for (let i = 0; i < 120; i++) {
      if (!cinema.step(DT)) continue;
      steps++;
      meleeSystem(g);
      boltSystem(g);
      hazardSystem(g);
      sanitySystem(g, DT);
    }
    expect(steps).toBeGreaterThan(20);
    expect(steps).toBeLessThan(60);
    expect(g.ecs.c.health.get(player)!.hp).toBe(hp);
    expect(g.ecs.c.poise.get(player)!.value).toBe(poise);
    expect(g.ecs.c.actor.get(player)!.move).toBeNull();
    expect(hits).not.toHaveBeenCalled();
    cinema.step(sceneLength(fall('person')));
    meleeSystem(g);
    loose(g, deepOne, { x: 0, y: 1, z: 0.5 }, { x: 0, y: 0, z: -30 }, { speed: 30, radius: 0.2, range: 10, damage: 30, poise: 100, lob: false });
    boltSystem(g);
    hazardSystem(g);
    expect(g.ecs.c.health.get(player)!.hp).toBeLessThan(hp);
    expect(hits).toHaveBeenCalled();
  });

  it('holds enemy attack decisions and discards knockback while the camera controls the player', () => {
    const g = createGame();
    const player = g.player.id;
    const [deepOne] = g.ecs.c.brain.keys();
    Object.assign(g.ecs.c.brain.get(deepOne)!, { state: 'engage', target: player, cooldown: 0 });
    shove(g, player, { x: 10, y: 0, z: 0 }, 5);
    expect(g.ecs.c.shove.has(player)).toBe(true);
    const cinema = cinemaFor(g);
    void cinema.play(fall('person'));
    expect(g.ecs.c.shove.has(player)).toBe(false);
    brainSystem(g);
    shove(g, player, { x: 10, y: 0, z: 0 }, 5);
    expect(g.ecs.c.actor.get(deepOne)!.move).toBeNull();
    expect(g.ecs.c.shove.has(player)).toBe(false);
  });

  it('stops the player immediately and holds them through slowed steps, even during a roll or body possession', () => {
    const { g, player, deepOne } = scriptedGame();
    place(g, player, 0, 0, 0);
    place(g, deepOne, 0, 0.1, 0); // overlapping bodies must not push the player
    const tr = g.ecs.c.transform.get(player)!;
    const mover = g.ecs.c.mover.get(player)!;
    Object.assign(mover, { vx: 4, vz: 2, face: 1 });
    Object.assign(tr.prev, { x: -1, y: tr.pos.y, z: -1 });
    startMove(g.ecs.c.actor.get(player)!, 'roll');
    g.player.buffer.action = 'dodge';
    g.player.mount.speed = 4;
    g.reality.stolen = 100;
    const cinema = cinemaFor(g);
    void cinema.play(scene('slow'));
    const at = { ...tr.pos };
    expect(tr.prev).toEqual(at);
    expect(mover).toMatchObject({ vx: 0, vz: 0, face: null });
    expect(g.player.mount.speed).toBe(0);
    expect(g.player.buffer.action).toBeNull();
    for (let i = 0; i < 30; i++) {
      if (!cinema.step(DT)) continue;
      const input = emptyInput();
      input.moveY = 1;
      playerControl(g, input);
      movementSystem(g, DT);
      expect(tr.pos).toEqual(at);
    }
    cinema.step(1);
    g.reality.stolen = 0;
    const input = emptyInput();
    input.moveY = 1;
    playerControl(g, input);
    expect(mover.vz).not.toBe(0);
  });

  it('draws a standing gait as soon as a cutscene begins during the walk through fog', () => {
    const g = createWorldGame();
    for (const id of g.ecs.c.model.keys()) if (id !== g.player.id) g.ecs.c.model.delete(id);
    const w = allFogs().find((wall) => !wall.gate)!;
    place(g, g.player.id, w.x - Math.sin(w.yaw) * 1.6, w.z - Math.cos(w.yaw) * 1.6, 0);
    const scene3d = new THREE.Scene();
    const views = createActorViews(scene3d, g);
    passFog(g, w);
    for (let i = 1; i <= 45; i++) {
      stepGame(g, emptyInput());
      views.update(1, i * DT);
    }
    expect(g.player.fogPass).not.toBeNull();
    void cinemaFor(g).play(scene('frozen'));
    const time = 46 * DT;
    views.update(1, time);

    const idle = createWorldGame();
    for (const id of idle.ecs.c.model.keys()) if (id !== idle.player.id) idle.ecs.c.model.delete(id);
    const idleScene = new THREE.Scene();
    createActorViews(idleScene, idle).update(1, time);
    const leg = scene3d.children[1].children[0].children[1];
    const idleLeg = idleScene.children[1].children[0].children[1];
    expect(leg.quaternion.angleTo(idleLeg.quaternion)).toBeLessThan(1e-5);
  });

  it('blocks sanity attacks, Unmoored bleeding, gaze bursts and lethal petrification', () => {
    const { g, boss, fight } = hookFight(['petrify_buildup', 'hidden_platforms']);
    const hp = g.ecs.c.health.get(g.player.id)!.hp;
    g.mind.sanity = 10;
    g.mind.band = 'unmoored';
    g.reality.petrify = 1 - REALITY.petrifyRate / 2;
    g.reality.gaze = 1 - BOSS.gazeRate / 2;
    const a = g.ecs.c.actor.get(boss)!;
    a.moves = { ...a.moves, gaze: { frames: 3, effect: { kind: 'gaze', window: [0, 2], range: 100 } } };
    startMove(a, 'gaze');
    const died = vi.fn();
    const burst = vi.fn();
    g.events.on('Died', died);
    g.events.on('GazeBurst', burst);
    void cinemaFor(g).play(fall('person'));
    loseSanity(g, 100);
    sanitySystem(g, DT);
    bleed(g, 100);
    specialSystem(g);
    HOOKS.petrify_buildup(g, [[boss, fight]]);
    HOOKS.hidden_platforms(g, [[boss, fight]]);
    expect(g.mind.sanity).toBe(10);
    expect(g.ecs.c.health.get(g.player.id)!.hp).toBe(hp);
    expect(g.ecs.c.actor.get(g.player.id)!.move).toBeNull();
    expect(died).not.toHaveBeenCalled();
    expect(burst).not.toHaveBeenCalled();
  });
});
