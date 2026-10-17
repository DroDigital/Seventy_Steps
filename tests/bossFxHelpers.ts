/** Every move of one horror, fired in the arena with the render side of its attacks running beside the simulation (round 51), against stand-ins for what draws: nothing may throw, nothing be left not a number, and the budgets of the batches that draw it must hold. */

import * as THREE from 'three';
import { createAttackFx } from '../src/render/attackFx';
import { createBeams } from '../src/render/beams';
import type { Decals } from '../src/render/decals';
import { createGroundFx } from '../src/render/groundFx';
import { createMeleeFx } from '../src/render/meleeFx';
import { PARTICLE_SHAPES, type ParticleSpec, type Particles } from '../src/render/particles';
import { createTelegraphs } from '../src/render/telegraphs';
import { moveDef, startMove } from '../src/systems/actions';
import { stepGame } from '../src/systems/game';
import { emptyInput } from '../src/core/input';
import { bossGame } from './bossHelpers';

const SKIP = new Set(['stagger', 'guardBreak', 'parried', 'death', 'interrupted']);
const DECAL_CAPACITY = 256;
const PARTICLE_CAPACITY = 2400;
const DECAL_KINDS = ['disc', 'sector', 'lane', 'ring', 'swirl', 'scar', 'sigil'] as const;

export interface FxAudit {
  moves: string[]; // fired
  bad: string[]; // what was left not a number or out of its range
  spawned: number;
  peakLive: number; // most particles alive at once (of 2400)
  peakDecals: number; // most decals in one frame (of 256)
  perMove: Record<string, number>; // particles each move threw
  kinds: Set<string>; // decal kinds drawn
  shapes: Set<string>; // particle shapes thrown
}

export function fxAudit(id: string): FxAudit {
  const { g, boss } = bossGame(id, undefined, 7);
  const c = g.ecs.c;
  const me = c.health.get(g.player.id)!;
  me.hp = me.max = 1e7;
  c.brain.delete(boss);
  const bad: string[] = [];
  const alive: number[] = [];
  const audit: FxAudit = { moves: [], bad, spawned: 0, peakLive: 0, peakDecals: 0, perMove: {}, kinds: new Set(), shapes: new Set() };
  let time = 0;
  let current = '';
  const finite = (label: string, ...ns: (number | undefined)[]): void => void (ns.every((n) => n === undefined || Number.isFinite(n)) || bad.push(`${current}: ${label} not finite`));
  const particles = {
    spawn(p: ParticleSpec) {
      audit.spawned++;
      audit.perMove[current] = (audit.perMove[current] ?? 0) + 1;
      finite('particle', p.x, p.y, p.z, p.vx, p.vy, p.vz, p.life, p.size, p.alpha, p.grow, p.spin, p.rot);
      if (!(p.life > 0 && p.life < 4 && p.size > 0 && p.size < 10)) bad.push(`${current}: particle life ${p.life} size ${p.size}`);
      if (p.shape && !PARTICLE_SHAPES.includes(p.shape)) bad.push(`${current}: shape ${p.shape}`);
      if ([...p.color, ...(p.colorEnd ?? [])].some((n) => !Number.isFinite(n) || n < 0)) bad.push(`${current}: particle colour`);
      audit.shapes.add(p.shape ?? 'disc');
      alive.push(time + p.life);
    },
    update() {},
  } as Particles;
  let frameDecals = 0;
  const record = (kind: string) => (...args: unknown[]): void => {
    frameDecals++;
    audit.kinds.add(kind);
    if (args.some((a) => typeof a === 'number' && !Number.isFinite(a))) bad.push(`${current}: decal ${kind} not finite`);
  };
  const decals = { begin: () => void (frameDecals = 0), end: () => undefined, style: () => undefined, ...Object.fromEntries(DECAL_KINDS.map((k) => [k, record(k)])) } as unknown as Decals;
  const ground = createGroundFx();
  const attack = createAttackFx(g, particles, ground);
  const melee = createMeleeFx(g, particles, ground);
  const telegraphs = createTelegraphs(g, decals, ground);
  const scene = new THREE.Scene();
  const beams = createBeams(scene, g);
  const camera = new THREE.PerspectiveCamera();
  camera.position.set(0, 5, 20);
  camera.updateMatrixWorld();
  const act = c.actor.get(boss)!;
  for (const move of Object.keys(act.moves)) {
    if (SKIP.has(move)) continue;
    audit.moves.push(move);
    current = `${id}/${move}`;
    startMove(act, move);
    const frames = (moveDef(act)?.frames ?? 60) + 60;
    for (let f = 0; f < frames; f++) {
      stepGame(g, emptyInput());
      time += 1 / 60;
      for (let i = alive.length - 1; i >= 0; i--) if (alive[i]! <= time) alive.splice(i, 1);
      telegraphs.update(1, time);
      attack.update(1);
      melee.update(1);
      beams.update(1, time, camera);
      audit.peakLive = Math.max(audit.peakLive, alive.length);
      audit.peakDecals = Math.max(audit.peakDecals, frameDecals);
      if (frameDecals > DECAL_CAPACITY) bad.push(`${current}: ${frameDecals} decals in a frame`);
      if (alive.length > PARTICLE_CAPACITY) bad.push(`${current}: ${alive.length} particles alive`);
      if (c.health.get(boss) && (c.health.get(boss)!.hp <= 0 || c.dead.has(boss))) break;
    }
    for (const e of [...c.bolt.keys()]) g.ecs.despawn(e);
  }
  return audit;
}
