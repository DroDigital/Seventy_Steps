/**
 * What the endings stand in the world (round 98): the silver key before the Court sign, the tall man
 * aside, the clock tower, and the arch the Guide opens. Drawn while the court is open, and through
 * the scene that ends it. No collider. Render only.
 */

import * as THREE from 'three';
import type { Entity } from '../core/ecs';
import { COURT_SIGN, courtOpen, ended } from '../systems/endings';
import type { Fight, Game } from '../systems/components';
import { courtPlaces } from '../data/finale';
import type { SetLook } from '../world/props';
import { worldLayout } from '../world/placements';
import { tallMan } from './finaleMan';
import { crumbleOf, finaleHand, finaleScene, graspOf, stepHand } from './finalePose';
import { modelPiecesOf, modelsReady } from './modelKit';
import type { Rgb } from './palette';
import type { PropMat } from './propShapes';
import { createWorldMaterial, type WorldMaterialOptions } from './worldMaterial';

const STONE: Rgb = [0.56, 0.53, 0.5];
const MAT: Partial<Record<PropMat, WorldMaterialOptions>> = {
  stone: { texture: 'stone', seed: 6, vertexColors: true, vary: 0.45 },
  wood: { texture: 'wood', seed: 6, uvScale: [0.5, 0.5], vertexColors: true, vary: 0.35 },
  metal: { texture: 'cloth', seed: 8, vertexColors: true, vary: 0.12, emissive: 0.2 },
  slab: { texture: 'slab', seed: 5, vertexColors: true, vary: 0.4 },
};

const HOLD = new THREE.Vector3(0.02, -0.05, 0.07);
const wrist = new THREE.Vector3();

function model(look: SetLook, key: boolean): THREE.Group {
  const g = new THREE.Group();
  for (const p of modelPiecesOf(look, STONE)) {
    const base = MAT[p.mat] ?? MAT.stone!;
    const face = !key && look.id === 'fn_clock' && p.mat === 'metal';
    const mat = createWorldMaterial({ ...base, emissive: key ? 0.62 : face ? 0.85 : base.emissive, coat: key || face ? false : undefined });
    g.add(new THREE.Mesh(p.geo, mat));
  }
  return g;
}

export interface FinaleLook {
  update(time: number, g: Game): void;
}

/** The props, parented to `scene`, built once the model pack has been read. */
export function createFinaleLook(scene: THREE.Scene): FinaleLook {
  const root = new THREE.Group();
  scene.add(root);
  let built = false;
  let key!: THREE.Group;
  let arch!: THREE.Group;
  let clock!: THREE.Group;
  let man!: THREE.Group;
  let last = 0;
  const hover = new THREE.Vector3();

  const build = (): void => {
    key = model({ id: 'fn_key', dye: { metal: [0.8, 0.82, 0.86] }, keep: 0.62 }, true);
    arch = model({ id: 'fn_arch', keep: 0.4 }, false);
    clock = model({ id: 'fn_clock', keep: 0.45 }, false);
    man = tallMan();
    root.add(key, arch, clock, man);
    built = true;
  };

  return {
    update(time, g) {
      const dt = last ? Math.min(0.05, Math.max(0, time - last)) : 1 / 60;
      last = time;
      stepHand(dt);
      if (!built && modelsReady()) build();
      if (!built) return;
      const sign = g.overworld && worldLayout().signs.find((s) => s.id === COURT_SIGN);
      const show = !!sign && courtOpen(g) && (!ended(g) || g.cutscene);
      man.visible = clock.visible = show;
      const at = sign && show ? courtPlaces(sign) : null;
      if (at) {
        hover.set(at.key.x, at.key.y + Math.sin(time * 1.5) * 0.05, at.key.z);
        man.position.set(at.man.x, at.man.y, at.man.z);
        man.rotation.set(Math.sin(time * 0.7) * 0.012, at.man.yaw + Math.sin(time * 0.45) * 0.04, 0);
        clock.position.set(at.clock.x, at.clock.y, at.clock.z);
        clock.rotation.y = at.clock.yaw;
      }
      const hand = finaleHand();
      const k = graspOf();
      const fall = crumbleOf();
      if (hand && (k > 0.02 || fall > 0)) {
        hand.updateWorldMatrix(true, false);
        wrist.copy(HOLD);
        hand.localToWorld(wrist);
        key.position.lerpVectors(hover, wrist, fall > 0 ? 1 : Math.min(1, k));
        key.quaternion.copy(hand.quaternion);
        key.rotateX(0.7);
      } else if (at) {
        key.position.copy(hover);
        key.rotation.set(0.22 + Math.sin(time * 0.9) * 0.06, at.key.yaw + Math.sin(time * 0.55) * 0.28, 0.06);
      }
      key.visible = !!sign && show && fall < 0.98;
      key.scale.setScalar(Math.max(0.001, 1 - fall));
      let guide: [Entity, Fight] | undefined;
      for (const pair of g.ecs.c.fight) if (pair[1].id === 'umr_at_tawil') guide = pair;
      const open = guide?.[1].sig.gate === 1;
      const passing = finaleScene() === 'ending:silver_key';
      arch.visible = !!guide && (open || passing) && (!ended(g) || g.cutscene);
      if (arch.visible && guide && open) {
        const [e, f] = guide;
        const tr = g.ecs.c.transform.get(e)!;
        const y = g.world.ground(f.sig.gx!, f.sig.gz!);
        arch.position.set(f.sig.gx!, y, f.sig.gz!);
        arch.rotation.y = Math.atan2(f.sig.gx! - tr.pos.x, f.sig.gz! - tr.pos.z);
      }
    },
  };
}
