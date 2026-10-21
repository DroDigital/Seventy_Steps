/**
 * The creatures' models (docs/MODELS.md): every `public/models/<id>.glb` the manifest names, loaded
 * while the world is made. Their vertex colours are the palette's as drawn; each is divided here by the
 * mean of the world texture its part is laid over (a texture gives the grain, not the colour: flesh's is
 * warm, hide's pale), kept in floats so nothing is clipped. A model that fails to load is left out:
 * its creature is drawn as its sprite.
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MODELLED, modelOf, type ModelFacts } from '../../data/models';
import { generateTexture, TEXTURE_KINDS, type TextureKind } from '../textures';

export interface ModelSource {
  facts: ModelFacts;
  scene: THREE.Object3D;
  clips: ReadonlyMap<string, THREE.AnimationClip>;
}

const means = new Map<TextureKind, readonly [number, number, number]>();

/** The mean colour of a world texture (its grain lies about it). */
function meanOf(kind: TextureKind): readonly [number, number, number] {
  if (!means.has(kind)) {
    const d = generateTexture(kind, 1);
    const sum = [0, 0, 0];
    for (let i = 0; i < d.length; i += 4) for (let c = 0; c < 3; c++) sum[c] += d[i + c];
    const n = (d.length / 4) * 255;
    means.set(kind, [Math.max(0.05, sum[0] / n), Math.max(0.05, sum[1] / n), Math.max(0.05, sum[2] / n)]);
  }
  return means.get(kind)!;
}

export const textureOf = (name: string): TextureKind => ((TEXTURE_KINDS as readonly string[]).includes(name) ? (name as TextureKind) : 'flesh');

function prepare(scene: THREE.Object3D): void {
  scene.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    const col = o.geometry.getAttribute('color') as THREE.BufferAttribute | undefined;
    if (!col) return;
    const [r, g, b] = meanOf(textureOf((o.material as THREE.Material).name));
    const out = new Float32Array(col.count * 4);
    for (let i = 0; i < col.count; i++) out.set([col.getX(i) / r, col.getY(i) / g, col.getZ(i) / b, col.itemSize > 3 ? col.getW(i) : 0], i * 4);
    o.geometry.setAttribute('color', new THREE.BufferAttribute(out, 4));
  });
}

/** Loads every model, telling `progress` the share done; resolves with those that loaded. */
export async function loadModels(progress: (share: number) => void = () => {}): Promise<Map<string, ModelSource>> {
  const loader = new GLTFLoader();
  const out = new Map<string, ModelSource>();
  let done = 0;
  await Promise.all(
    MODELLED.map(async (id) => {
      try {
        const gltf = await loader.loadAsync(`${import.meta.env.BASE_URL}models/${id}.glb`);
        prepare(gltf.scene);
        out.set(id, { facts: modelOf(id)!, scene: gltf.scene, clips: new Map(gltf.animations.map((c) => [c.name, c])) });
      } catch (e) {
        console.warn(`model ${id} did not load; its sprite stands in`, e);
      }
      progress(++done / Math.max(1, MODELLED.length));
    }),
  );
  return out;
}
