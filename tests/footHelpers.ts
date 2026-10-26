/** Helpers for the footprint and footing tests (round 80): a point on a given ground, and a walk by hand. */

import { REGIONS } from '../src/data/regions';
import type { Game } from '../src/systems/components';
import { kitOfRoom, roomAt } from '../src/world/dungeonKit';
import { groundAt, type GroundKind } from '../src/world/groundKind';
import { worldLayout } from '../src/world/placements';
import { regionRect } from '../src/world/worldMap';

/** A point of `region` whose ground is `kind` for `run` metres along `yaw` too (found on a 4 m grid). */
export function findGround(g: Game, region: string, kind: GroundKind, run = 0, yaw = 0): { x: number; z: number } | null {
  const r = regionRect(REGIONS.find((x) => x.id === region)!);
  const whole = (x: number, z: number): boolean => {
    for (let d = 0; d <= run; d += 1.5) if (groundAt(g, x + Math.sin(yaw) * d, 1, z + Math.cos(yaw) * d) !== kind) return false;
    return true;
  };
  for (let z = r.z0 + 8; z < r.z1 - 8 - run; z += 4) for (let x = r.x0 + 8; x < r.x1 - 8 - run; x += 4) if (whole(x, z)) return { x, z };
  return null;
}

/** Carries the investigator `metres` along `yaw` in one go (their body and its last place both), as a frame of a walk would. */
export function stride(g: Game, metres: number, yaw: number): void {
  const tr = g.ecs.c.transform.get(g.player.id)!;
  tr.prev = { ...tr.pos };
  tr.pos = { x: tr.pos.x + Math.sin(yaw) * metres, y: tr.pos.y, z: tr.pos.z + Math.cos(yaw) * metres };
}

/** The middle of a dungeon room whose floor (`kitOfRoom`'s) is one of `floors` and which is `half` metres or more to a side: where a body is put to walk or stand indoors (round 86). */
export function findRoom(floors: readonly string[], half = 8): { x: number; z: number } | null {
  for (const { layout } of worldLayout().dungeons) for (const room of layout.rooms) if (floors.includes(kitOfRoom(layout, room).floor) && room.half >= half) return { x: room.x, z: room.z };
  return null;
}

/** The start of `run` metres along +x, three metres in from the edge, of open ground inside a dungeon's bounding rectangle (where `surfaceAt` says 'stone' but no room has its floor: a branching dungeon's branches leave such ground between them), if any (round 86). */
export function findGap(run = 14): { x: number; z: number } | null {
  for (const { layout } of worldLayout().dungeons) {
    const r = layout.rect;
    for (let z = r.z0 + 3; z <= r.z1 - 3; z += 1) {
      let open = 0;
      for (let x = r.x0 + 3; x <= r.x1 - 3; x += 1) {
        open = roomAt(layout, x, z) ? 0 : open + 1;
        if (open >= run + 2) return { x: x - run, z };
      }
    }
  }
  return null;
}
