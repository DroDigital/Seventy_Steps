/**
 * 2026-11-27, the playtest: "a burning thing right next to, even touching, a wooden shelf". In every dungeon no torch, brazier or lit piece
 * of a set stands within a metre of a piece of the set that burns (a case of books, a crate, a curtain), and no thing of wood or paper on a
 * hall's wall stands within a metre of a fire: its middle is further from each than half its breadth and that metre (data/burns.ts).
 */
import { describe, expect, it } from 'vitest';
import { worldLayout } from '../src/world/placements';
import { dungeonPieces } from '../src/render/siteMeshes';
import { burnsAsSet, dressing, type DressLog } from '../src/render/dungeonDressing';
import type { LightSpot } from '../src/render/worldLights';
import { propColliders } from '../src/world/props';
import { colliderGap } from '../src/world/colliders';
import { BURNING_ITEMS, FIRE } from '../src/data/burns';

describe('nothing that burns stands by a fire (2026-11-27)', () => {
  it('keeps every torch, brazier and lit piece a metre from what burns, in every dungeon', () => {
    const near: string[] = [];
    let braziers = 0;
    for (const d of worldLayout().dungeons) {
      const lights: LightSpot[] = [];
      const job = dungeonPieces(d, lights);
      for (let r = job.next(); !r.done; r = job.next());
      const torches = lights.filter((l) => l.kind === 'torch');
      const log: DressLog = { items: [], fires: [] };
      dressing(d.layout, () => [0.5, 0.5, 0.5], { x: 0, z: 0 }, torches, d.decor, log);
      braziers += log.fires.length;
      const fires = [...torches.map((t) => ({ x: t.x, y: t.y, z: t.z, r: 0 })), ...log.fires.map((f) => ({ ...f, y: NaN })), ...d.decor.filter((p) => p.set?.lit).map((p) => ({ x: p.x, y: NaN, z: p.z, r: 0 }))];
      for (const p of d.decor.filter(burnsAsSet)) {
        const shapes = propColliders(p);
        for (const f of fires) {
          if (Math.abs(f.y - p.y) > 4) continue; // (a torch on another floor; a brazier and a lit piece stand on this one)
          const gap = shapes.length ? Math.min(...shapes.map((c) => colliderGap(c, f.x, f.z))) : Math.hypot(p.x - f.x, p.z - f.z) - Math.max(p.w, p.d);
          if (gap - f.r < FIRE.burns - 0.05) near.push(`${d.layout.def.id}: ${p.set!.id} ${gap.toFixed(2)} m from a fire`);
        }
      }
      for (const it of log.items.filter((i) => BURNING_ITEMS.has(i.item))) {
        for (const f of fires) if (Math.hypot(it.x - f.x, it.z - f.z) - f.r < FIRE.half + FIRE.burns - 0.05) near.push(`${d.layout.def.id}: its ${it.item} by a fire`);
      }
    }
    expect(near).toEqual([]);
    expect(braziers).toBeGreaterThan(20); // (the halls keep their braziers: a corner its cases fill has one a step out of it)
  });
});
