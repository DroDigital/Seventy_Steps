/**
 * What crosses the sky (playtest round 18; data/fauna.ts SKY_VISITORS): now and then, over the open
 * world, a flock of the region's birds (drawn by fauna.ts) or one of its realm's great winged things
 * (a roster creature's likeness, from the sprite atlas, in a small batch of its own) comes out of the
 * dark on one side, passes high over the investigator, and is gone on the other, crying as it passes
 * nearest. Read-only on the simulation.
 */

import * as THREE from 'three';
import type { V3 } from '../core/geom';
import { SKY_VISITORS, type SkyVisitor } from '../data/fauna';
import { FAUNA } from '../data/tuning';
import type { VoiceId } from '../data/voices';
import type { Game } from '../systems/components';
import type { Fauna } from './fauna';
import { CELL, spriteKey, type SpriteAtlas } from './sprites/atlas';
import { spriteBatch } from './sprites/batch';
import { loopFrame, resolveDirectionalClip, spriteDirection, type DirectionalClips, type SpriteDirection } from './sprites/directional';
import { reviewedClips, reviewedSize, type ReviewedEntity, type ReviewedManifest } from './sprites/reviewed';
import { worldUniforms } from './worldMaterial';

const CAPACITY = 8;

interface Shape extends V3 {
  frames: readonly number[];
  reviewed?: { entity: ReviewedEntity; clips: DirectionalClips<number>; width: number; height: number; groundOffset: number };
  direction?: SpriteDirection;
  yaw: number;
  vx: number;
  vz: number;
  t: number; // seconds under way (below 0: not yet come)
  size: number;
  phase: number;
}

export interface SkyLife {
  update(camera: THREE.Camera, time: number, hidden: boolean): void;
}

const between = ([lo, hi]: readonly [number, number]): number => lo + (hi - lo) * Math.random();

export function createSkyLife(scene: THREE.Scene, g: Game, fauna: Fauna, sheet: { atlas: SpriteAtlas; texture: THREE.Texture; reviewed?: { manifest: ReviewedManifest; textures: THREE.Texture[] } }, cry: (voice: VoiceId, at: V3) => void): SkyLife {
  const fog = { value: 1 }; // a shape against the night sky is dark, not fogged pale (FAUNA.fog)
  const batches = [spriteBatch(scene, sheet.texture, CAPACITY), ...(sheet.reviewed?.textures.map((texture) => spriteBatch(scene, texture, CAPACITY, true)) ?? [])];
  for (const batch of batches) batch.mesh.material.uniforms.uFogAmount = fog;
  const counts = batches.map(() => 0);
  const reviewed = new Map<string, NonNullable<Shape['reviewed']>>();
  for (const [key, entity] of Object.entries(sheet.reviewed?.manifest.entities ?? {})) {
    reviewed.set(key, { entity, clips: reviewedClips(entity, key), ...reviewedSize(entity, sheet.reviewed!.manifest) });
  }

  const next = new Map<SkyVisitor, number>(); // when each comes next
  const shapes: Shape[] = [];
  const cries: { when: number; voice: VoiceId; at: V3 }[] = [];
  let last = -1;

  /** One visitor's pass: out of the dark on one side, nearest at the middle, into it on the other. */
  const launch = (v: SkyVisitor, me: V3, time: number): void => {
    const yaw = Math.random() * Math.PI * 2;
    const [dx, dz] = [Math.sin(yaw), Math.cos(yaw)];
    const side = between(FAUNA.passBy) * (Math.random() < 0.5 ? 1 : -1);
    const half = (v.speed * FAUNA.pass) / 2;
    const mid = { x: me.x + dz * side, y: me.y + between(v.height), z: me.z - dx * side };
    const start = { x: mid.x - dx * half, y: mid.y, z: mid.z - dz * half };
    const count = Math.round(between(v.count));
    if (v.flock) fauna.flock(v.flock, count, start, yaw, v.speed, FAUNA.pass);
    const key = v.shape ? spriteKey(v.shape) : '';
    const frames = sheet.atlas.frames.get(key)?.move;
    const art = reviewed.get(key);
    for (let i = 0; (art || frames) && i < count && shapes.length < CAPACITY; i++) {
      const [lag, off] = [i * 1.4, (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 5];
      shapes.push({ x: start.x + dz * off, y: start.y + (Math.random() - 0.5) * 4, z: start.z - dx * off, frames: frames ?? [], reviewed: art, yaw, vx: dx * v.speed, vz: dz * v.speed, t: -lag, size: v.size ?? 3, phase: Math.random() * 10 });
    }
    if (v.cry) cries.push({ when: time + FAUNA.pass / 2, voice: v.cry, at: mid });
  };

  const m4 = new THREE.Matrix4();
  const right = new THREE.Vector3();
  const eye = new THREE.Vector3();
  return {
    update(camera, time, hidden) {
      const dt = last < 0 ? 0 : Math.min(0.1, Math.max(0, time - last));
      last = time;
      const region = g.overworld?.region;
      const me = g.ecs.c.transform.get(g.player.id)?.pos;
      for (const v of (!hidden && region && me && SKY_VISITORS[region]) || []) {
        const due = next.get(v);
        if (due === undefined) next.set(v, time + between(v.every) * 0.6); // the first comes a little sooner
        else if (time >= due) {
          next.set(v, time + between(v.every));
          launch(v, me!, time);
        }
      }
      for (let i = cries.length - 1; i >= 0; i--) {
        if (time < cries[i].when) continue;
        cry(cries[i].voice, cries[i].at);
        cries.splice(i, 1);
      }
      fog.value = worldUniforms.uFogAmount.value * FAUNA.fog;
      camera.updateMatrixWorld();
      right.setFromMatrixColumn(camera.matrixWorld, 0);
      camera.getWorldPosition(eye);
      counts.fill(0);
      for (let i = shapes.length - 1; i >= 0; i--) {
        const s = shapes[i];
        s.t += dt;
        if (s.t >= FAUNA.pass) {
          shapes.splice(i, 1);
          continue;
        }
        if (s.t < 0) continue;
        [s.x, s.z] = [s.x + s.vx * dt, s.z + s.vz * dt];
        const seen = Math.min(1, s.t / 2, (FAUNA.pass - s.t) / 2);
        if (hidden || seen <= 0) continue;
        const bob = Math.sin(s.t * 0.9 + s.phase);
        if (s.reviewed && sheet.reviewed) {
          s.direction = spriteDirection(s.yaw, s, eye, s.direction);
          const clip = resolveDirectionalClip(s.reviewed.clips, s.direction, 'move');
          if (!clip) continue;
          const frame = sheet.reviewed.manifest.frames[clip.frames[loopFrame(time + s.phase, clip.frames.length)]];
          const page = sheet.reviewed.manifest.pages[frame.page];
          const batch = batches[frame.page + 1];
          const n = counts[frame.page + 1]++;
          batch.cells.setXYZW(n, frame.x / page.width, frame.y / page.height, (frame.x + frame.width) / page.width, (frame.y + frame.height) / page.height);
          batch.info.setXYZW(n, 0, seen, clip.mirror_horizontal ? 1 : 0, 0);
          const scale = s.size / s.reviewed.width; // visitor sizes are metres across; preserve its authored canvas aspect
          batch.mesh.setMatrixAt(n, m4.makeScale(s.size, s.reviewed.height * scale, 1).setPosition(s.x, s.y + bob - s.reviewed.groundOffset * scale, s.z));
        } else {
          const cell = s.frames[Math.floor((time + s.phase) * 2.5) % s.frames.length];
          const [cx, cy] = [(cell % (sheet.atlas.width / CELL)) * CELL, Math.floor(cell / (sheet.atlas.width / CELL)) * CELL];
          const batch = batches[0];
          const n = counts[0]++;
          batch.cells.setXYZW(n, cx / sheet.atlas.width, cy / sheet.atlas.height, (cx + CELL) / sheet.atlas.width, (cy + CELL) / sheet.atlas.height);
          batch.info.setXYZW(n, 0, seen, s.vx * right.x + s.vz * right.z < 0 ? 1 : 0, 0);
          batch.mesh.setMatrixAt(n, m4.makeScale(s.size, s.size, 1).setPosition(s.x, s.y + bob, s.z));
        }
      }
      batches.forEach((batch, page) => batch.finish(counts[page]));
    },
  };
}
