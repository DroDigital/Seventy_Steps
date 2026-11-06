/**
 * Where a note lies, a leaf of burning paper hangs (round 89; asked for by XDro: the notes in the world are animated, floating, flowing,
 * burning paper; the game still calls it a 'note': systems/insight.ts). One is built when the investigator first comes within reach of it
 * and floats, flows and burns (render/paperStand.ts, paperFlow.ts), throwing flames, sparks and smoke from its rim when it is near
 * (render/paperFire.ts). Taking it up opens its page and removes the thing from the world at once, as it always has; the leaf
 * stays where it hung, held, for as long as the page is read, and when the page is put away it burns away after a moment, and is
 * dithered out (render/paperBurn.ts). Render only: it reads the world and the one event.
 */

import * as THREE from 'three';
import type { Entity } from '../core/ecs';
import { isPaper, PAPER, PAPER_LOOK } from '../data/paperTuning';
import type { Game } from '../systems/components';
import { createFlames } from './flames';
import { createHalos } from './halos';
import { startBurn, stepBurn, type Burning } from './paperBurn';
import { burn } from './paperFire';
import { animate, buildLeaf, disposeLeaf, flames, type Leaf, type PaperCtx, type PaperFx } from './paperStand';

export interface PaperViews {
  /** `time`: render seconds (it stands still while the world does); `reading`: a page is open; `eye`: where the investigator is. */
  update(time: number, reading: boolean, eye: { x: number; z: number }): void;
  /** For a script and the debug hooks: how many leaves hang, are held for a page, and are burning away. */
  readonly counts: { standing: number; held: number; burning: number };
}

export function createPaperViews(scene: THREE.Scene, g: Game, fx: PaperFx): PaperViews {
  const halos = createHalos(32, 0.6); // the glow about each, soft through the mist
  const batch = createFlames(160); // 17 flames to a leaf
  const warm = buildLeaf('', { x: 0, y: -1e4, z: 0 }, 0, 0); // one leaf far below the world, never drawn: its shader is compiled with the scene's, not as the first note comes into view
  warm.root.userData.warm = true;
  scene.add(halos.mesh, batch.mesh, warm.root);
  const ctx: PaperCtx = { scene, fx, halos, flames: batch, ground: (x, z) => g.world.ground(x, z) };
  const stands = new Map<Entity, Leaf>();
  const byName = new Map<string, Leaf>();
  const held: { leaf: Leaf; wait: number }[] = [];
  const burning: Burning[] = [];
  let last: number | null = null;
  let seed = 1;

  g.events.on('Read', ({ name }) => {
    const leaf = byName.get(name);
    if (leaf) leaf.taken = true; // picked up: the thing is gone from the world this step, the leaf is not
  });

  /** A leaf that hangs: it floats, flows and burns, and its fire is thrown if the investigator is near. */
  const hang = (leaf: Leaf, time: number, dt: number, eye: { x: number; z: number }): void => {
    const near = animate(leaf, time, dt, eye);
    const p = leaf.root.position;
    halos.put(p.x, p.y + PAPER.hover, p.z, 1.3, PAPER_LOOK.flame, PAPER.halo * leaf.fire);
    flames(batch, leaf, time, 1);
    if (near > PAPER.burnReach) return;
    if ((leaf.flames -= dt) <= 0) {
      leaf.flames = 0.05 + Math.random() * 0.07;
      burn(fx, leaf, 1 + Math.floor(Math.random() * 2), 0, 0);
    }
    if ((leaf.sparks -= dt) <= 0) {
      leaf.sparks = 0.25 + Math.random() * 0.4;
      burn(fx, leaf, 0, 1, Math.random() < 0.4 ? 1 : 0);
    }
  };

  return {
    counts: {
      get standing() {
        return stands.size;
      },
      get held() {
        return held.length;
      },
      get burning() {
        return burning.length;
      },
    },
    update(time, reading, eye) {
      const dt = last === null ? 0 : Math.min(0.1, Math.max(0, time - last));
      last = time;
      const c = g.ecs.c;
      halos.begin();
      batch.begin();
      for (const [id, leaf] of stands) {
        if (c.tome.has(id)) continue;
        stands.delete(id);
        byName.delete(leaf.name);
        if (leaf.taken) held.push({ leaf, wait: 0 });
        else disposeLeaf(scene, leaf);
      }
      for (const [id, t] of c.tome) {
        const tr = c.transform.get(id);
        if (!isPaper(t) || !tr) continue;
        const d = Math.hypot(tr.pos.x - eye.x, tr.pos.z - eye.z);
        let leaf = stands.get(id);
        if (!leaf) {
          if (d > PAPER.reach) continue;
          leaf = buildLeaf(t.name, tr.pos, tr.yaw, ((id * 0.618) % 1) * Math.PI * 2);
          scene.add(leaf.root);
          stands.set(id, leaf);
          byName.set(t.name, leaf);
        }
        leaf.root.visible = d <= PAPER.reach * 1.15;
        if (leaf.root.visible) hang(leaf, time, dt, eye);
      }
      for (const h of held) hang(h.leaf, time, dt, eye); // (a held one goes on as it did while its page is read)
      if (!reading) {
        for (let i = held.length - 1; i >= 0; i--) {
          if ((held[i].wait += dt) < PAPER.burn.hold) continue;
          burning.push(startBurn(ctx, held.splice(i, 1)[0].leaf, seed++ * 7919));
        }
      } else for (const h of held) h.wait = 0;
      for (let i = burning.length - 1; i >= 0; i--) if (stepBurn(ctx, burning[i], dt)) burning.splice(i, 1);
      halos.end();
      batch.end();
    },
  };
}
