/**
 * The mirrors (round 79: a mirror was a framed dark panel): when the eye stands before a hall's mirror and looks toward it, the scene is drawn once more
 * from the eye's image behind the glass, small (the picture is low-res as it is), with the mirror itself left out, and the mirror's shader lays that on
 * its glass, dimmed and cooled (shaders/surfaces.ts). One mirror at a time, the nearest. The mirrors are found among the scene's meshes (a chunk's or a
 * site's mirror mesh carries the spots of its glass, `userData.mirrors`, from render/propMeshes.ts), looked for again every so many frames. Render only.
 */

import * as THREE from 'three';
import { RENDER } from '../data/tuning';
import { inView, mirrorCamera, pickMirror, type MirrorSpot } from './mirrorMath';
import { worldUniforms } from './worldMaterial';

const WIDTH = 256;
const EVERY = 2; // the picture is drawn every this many frames while the same mirror is in view (the second picture is the dearest thing the dungeons do)
const LOOK_EVERY = 0.4; // seconds between looks through the scene for mirror meshes (chunks come and go: by the clock, not the frame count, so a slow picture finds them too)

export interface MirrorView {
  /** The picture the mirror shows (to be looked at, in the lab and the tests). */
  readonly target: THREE.WebGLRenderTarget;
  /** The mirrors found in the scene, and whether one was drawn in the last frame. */
  readonly state: { found: number; drawn: boolean };
  /** Draws the mirror's picture, before the frame, if there is a mirror to be seen. */
  render(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera): void;
}

export function createMirrorView(): MirrorView {
  const target = new THREE.WebGLRenderTarget(WIDTH, Math.round((WIDTH * RENDER.height) / RENDER.width), { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, generateMipmaps: false, depthBuffer: true });
  const virtual = new THREE.PerspectiveCamera();
  const [eye, forward] = [new THREE.Vector3(), new THREE.Vector3()];
  const u = worldUniforms;
  u.uMirrorMap.value = target.texture;
  let [meshes, spots, looked] = [[] as THREE.Mesh[], [] as MirrorSpot[], -1e9];
  let [last, since] = [null as MirrorSpot | null, 0];
  const state = { found: 0, drawn: false };
  return {
    target,
    state,
    render(renderer, scene, camera) {
      state.drawn = false;
      const now = performance.now() / 1000;
      if (now - looked >= LOOK_EVERY) {
        looked = now;
        meshes = [];
        spots = [];
        scene.traverse((o) => {
          const found = (o as THREE.Mesh).userData?.mirrors as MirrorSpot[] | undefined;
          if (found && (o as THREE.Mesh).isMesh) {
            meshes.push(o as THREE.Mesh);
            spots.push(...found);
          }
        });
        state.found = spots.length;
      }
      if (!spots.length || !(camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
        u.uMirrorOn.value = 0;
        return;
      }
      camera.updateMatrixWorld();
      eye.setFromMatrixPosition(camera.matrixWorld);
      camera.getWorldDirection(forward);
      const spot = pickMirror(spots, eye, forward);
      if (!spot || !inView(spot, camera)) {
        u.uMirrorOn.value = 0;
        last = null;
        return;
      }
      if (spot === last && since < EVERY - 1) { // the last picture will do: it was taken a frame ago, from nearly where the eye is
        since++;
        u.uMirrorOn.value = 1;
        return;
      }
      [last, since] = [spot, 0];
      mirrorCamera(virtual, camera as THREE.PerspectiveCamera, spot, u.uMirrorMat.value);
      u.uMirrorPlane.value.set(spot.nx, spot.ny, spot.nz, -(spot.nx * spot.x + spot.ny * spot.y + spot.nz * spot.z));
      const [was, shown] = [renderer.getRenderTarget(), meshes.map((m) => m.visible)];
      meshes.forEach((m) => (m.visible = false)); // (the glass drawn into itself would be a loop)
      renderer.setRenderTarget(target);
      renderer.render(scene, virtual);
      renderer.setRenderTarget(was);
      meshes.forEach((m, i) => (m.visible = shown[i]!));
      u.uMirrorOn.value = 1;
      state.drawn = true;
    },
  };
}
