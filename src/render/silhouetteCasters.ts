/**
 * The foes' own shapes in the shadow maps (round 93; render only). Round 83 stood each creature in the moon's, the lantern's and the
 * lamps' shadows as a rounded stand-in body of one shape for all, capped in height, so a shadow was the same wedge for a Deep One
 * and a colossus. Each creature drawn from the sprite batches now casts its own picture instead: one more mesh for each batch,
 * sharing its geometry, instance matrices and texels (a claw raised in a blow is raised in the shadow, a body that crumbles
 * crumbles in it), stood across the light and leaned back from it (render/castPlan.ts, shaders/castSprite.ts), larger than the
 * body for a horror, and drawn into whichever depth map a pass is making, after the solids, from the light's own camera. The
 * meshes live in a scene of their own, so the passes' override materials (which have no texture to cut a shape out of) do not
 * reach them, and no camera of the player's ever draws them.
 */

import * as THREE from 'three';
import { CAST } from '../data/fxTuning';
import { loomOf } from './castPlan';
import { CAST_FRAG, CAST_VERT } from './shaders/castSprite';
import { worldUniforms } from './worldMaterial';

/** The light a map is drawn from: its direction (`point` false: the moon's, toward it) or its place (the lantern, a lamp). */
export interface CastLight {
  x: number;
  y: number;
  z: number;
  point: boolean;
}

export interface SilhouetteCasters {
  /** What the passes draw: empty until the batches are adopted. Compiled ahead with the rest (render/pipeline.ts). */
  readonly scene: THREE.Scene;
  /** Takes the sprite batches' meshes (the procedural fallback first, then each page of the reviewed art), forgetting any taken before. */
  adopt(batches: readonly THREE.InstancedMesh[]): void;
  /** A frame begins: no body casts; `right` is the camera's right, level. */
  begin(right: { x: number; z: number }): void;
  /**
   * Instance `index` of batch `slot` (in the order adopted) casts its picture: it stands at (x, z) and is `height` metres painted tall with its feet
   * `feet` metres above the bottom of its picture, in the last phase `deep` (0..1) of its fight, `keep` (0..1) of it left; `from` is the investigator, whom it is too far from to matter.
   */
  put(slot: number, index: number, x: number, z: number, height: number, feet: number, deep: number, keep: number, from: { x: number; z: number }): void;
  /** The frame's bodies are told. */
  end(): void;
  /** Draws the bodies into the map being made, as `camera` sees it (the light's own), after its solids; `back` is how far behind a body its cut-out stands (a map drawn from a point: round 93's `CAST.back`). */
  draw(renderer: THREE.WebGLRenderer, camera: THREE.Camera, light: CastLight): void;
}

interface Cast {
  source: THREE.InstancedMesh;
  mesh: THREE.InstancedMesh;
  info: THREE.InstancedBufferAttribute;
}

export function createSilhouetteCasters(): SilhouetteCasters {
  const scene = new THREE.Scene();
  const uniforms = { uCastLight: { value: new THREE.Vector4() }, uCastRight: { value: new THREE.Vector3(1, 0, 0) }, uCastBack: { value: 0 }, uTime: worldUniforms.uTime };
  let casts: Cast[] = [];
  let any = false;
  const loom = { tall: 1, wide: 1 };

  const forget = (): void => {
    for (const c of casts) {
      scene.remove(c.mesh);
      c.mesh.geometry.dispose();
      (c.mesh.material as THREE.Material).dispose();
    }
    casts = [];
  };

  return {
    scene,
    adopt(batches) {
      forget();
      casts = batches.map((source) => {
        const from = source.geometry;
        const geo = new THREE.BufferGeometry(); // the batch's own buffers, shared, and one more
        geo.setIndex(from.getIndex());
        for (const name of ['position', 'uv', 'aCell', 'aInfo', 'aWeird', 'aFx']) geo.setAttribute(name, from.getAttribute(name));
        const capacity = source.instanceMatrix.count;
        const info = new THREE.InstancedBufferAttribute(new Float32Array(capacity * 4), 4).setUsage(THREE.DynamicDrawUsage);
        geo.setAttribute('aCast', info);
        const shared = (source.material as THREE.ShaderMaterial).uniforms;
        const material = new THREE.ShaderMaterial({
          uniforms: { ...uniforms, uAtlas: shared.uAtlas, uCastMin: { value: shared.uReviewed.value > 0.5 ? CAST.alpha.reviewed : CAST.alpha.drawn } },
          vertexShader: CAST_VERT,
          fragmentShader: CAST_FRAG,
          side: THREE.DoubleSide,
          colorWrite: false,
        });
        const mesh = new THREE.InstancedMesh(geo, material, capacity);
        mesh.instanceMatrix = source.instanceMatrix; // the same places, the same sizes
        mesh.frustumCulled = false;
        mesh.count = 0;
        mesh.visible = false;
        scene.add(mesh);
        return { source, mesh, info };
      });
    },
    begin(right) {
      const [x, z] = [right.x, right.z];
      const len = Math.hypot(x, z) || 1;
      uniforms.uCastRight.value.set(x / len, 0, z / len);
      for (const c of casts) c.info.array.fill(0);
      any = false;
    },
    put(slot, index, x, z, height, feet, deep, keep, from) {
      const c = casts[slot];
      if (!c || index < 0 || index >= c.info.count || keep <= CAST.keep || Math.hypot(x - from.x, z - from.z) > CAST.reach) return;
      loomOf(height, deep, loom);
      c.info.setXYZW(index, 1, loom.tall, loom.wide, feet);
      any = true;
    },
    end() {
      for (const c of casts) c.info.needsUpdate = true;
    },
    draw(renderer, camera, light) {
      let drawn = false;
      for (const c of casts) {
        c.mesh.count = c.source.count;
        c.mesh.visible = any && c.mesh.count > 0;
        drawn ||= c.mesh.visible;
        c.mesh.layers.mask = camera.layers.mask; // whichever map this is, it looks at them
      }
      if (!drawn) return;
      uniforms.uCastLight.value.set(light.x, light.y, light.z, light.point ? 1 : 0);
      uniforms.uCastBack.value = light.point ? CAST.back : 0;
      const clears = renderer.autoClear; // the solids are in the map already
      renderer.autoClear = false;
      try {
        renderer.render(scene, camera);
      } finally {
        renderer.autoClear = clears;
      }
    },
  };
}

/** The one the game has: the sprite batches adopt into it, and the moon's, the lantern's and the lamps' passes draw it. */
export const castSilhouettes = createSilhouetteCasters();
