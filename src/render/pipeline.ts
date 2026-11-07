/**
 * Render pipeline (spec §2): the world renders into a low-res target (400×225 scaled by the
 * resolution setting: 640×360 by default (2026-11-03, as in round 56: a whole number of times over on the common screens; 800×450 from round 58)), then the one post pass draws into a picture of the same
 * size, and the last pass (present.ts, 2026-11-03) puts it on the canvas: with even pixels, a canvas as many pixels as the screen gives
 * its letterboxed 16:9 box, every picture pixel drawn the same size (evenPixels.ts); without, a canvas of the picture's size, which CSS
 * upscales nearest-neighbour (`image-rendering: pixelated`), as before.
 * The shaders a scene needs are compiled ahead, out of sight (playtest round 10: compiled on the
 * first frame drawn, they held the page on black): in parallel, where the browser can.
 */

import * as THREE from 'three';
import { FX, LIGHTING, RENDER, SETTINGS } from '../data/tuning';
import { createLanternShadow, type LanternShadow } from './lanternShadow';
import { createLampShadows, type LampShadows } from './lampShadows';
import { createMirrorView, type MirrorView } from './mirrorView';
import { createReflection, type Reflection } from './reflection';
import { createMoonShadow, type MoonShadow } from './moonShadow';
import { createPostPass, type PostPass } from './postPass';
import { createPresent } from './present';
import { castSilhouettes } from './silhouetteCasters';
import { createSoftDepth, drawSoft } from './softParticles';
import { worldUniforms } from './worldMaterial';

export interface Pipeline {
  renderer: THREE.WebGLRenderer;
  post: PostPass;
  /** The moon's shadows (round 34): `render` says where and whether, and draws the map before the world. */
  shadow: MoonShadow;
  /** The lantern's shadows (round 34): drawn from the investigator in the way the camera looks, in the open night and under a roof alike. */
  lantern: LanternShadow;
  /** The lamps' shadows (round 35): `update` is told the lamps that may cast before the frame is drawn. */
  lamps: LampShadows;
  /** The sea's mirror (round 35): drawn before the frame when there is water about. */
  reflection: Reflection;
  mirror: MirrorView;
  /** Internal render size in pixels (low-res target, or full canvas when pixelation is off). */
  size: THREE.Vector2;
  /** `scale` multiplies the low-res target (the settings menu's resolution scale); `even`: the picture is spread over the screen's own pixels, each of its pixels drawn the same size (Settings › Display), or else blown up nearest-neighbour by the browser. */
  resize(lowRes: boolean, scale?: number, even?: boolean): void;
  /** The device pixel ratio the canvas was last sized for: when the window moves to another screen it can change with no resize. */
  readonly dpr: number;
  /** The last frame as shown, before it is spread over the screen: a canvas the picture's size (P keeps it). */
  shot(): HTMLCanvasElement;
  /** `shadowAt`: where the shadow maps are centred (the investigator), or null for none (the setting off, not in the world: round 34); `moon`: the moon is drawn over the open ground too, and not under a roof or in a dungeon. */
  render(scene: THREE.Scene, camera: THREE.Camera, shadowAt?: { x: number; y: number; z: number } | null, moon?: boolean): void;
  /** The particles' batch, drawn after the world and softened where they meet it (round 113: render/softParticles.ts); none: drawn with the world. */
  softParticles(mesh: THREE.Mesh | undefined): void;
  /** Starts compiling every shader the scene and the post pass need; resolves once they can be drawn without a stall. */
  compile(scene: THREE.Scene, camera: THREE.Camera): Promise<void>;
  /** Compiles, then draws a frame (sending the GPU what the scene holds), so the next one shown comes at once. */
  warm(scene: THREE.Scene, camera: THREE.Camera): Promise<void>;
  /** The last frame's low-res picture as the world drew it, before the post pass: RGBA bytes, rows from the bottom (the glitch hunts read it: round 21). */
  grab(): { data: Uint8Array; width: number; height: number };
}

export function createPipeline(parent: HTMLElement): Pipeline {
  // Shaders work directly in display sRGB, so no colour-space conversions anywhere.
  THREE.ColorManagement.enabled = false;
  const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.setPixelRatio(1);
  renderer.setClearColor(new THREE.Color(...FX.fogColor));
  renderer.info.autoReset = false;
  parent.appendChild(renderer.domElement);

  const target = new THREE.WebGLRenderTarget(RENDER.width, RENDER.height, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    generateMipmaps: false,
    depthBuffer: true,
    depthTexture: new THREE.DepthTexture(RENDER.width, RENDER.height), // read by the volumetric fog (round 16)
  });
  const post = createPostPass(target.texture, target.depthTexture);
  const softDepth = createSoftDepth(target.depthTexture!, RENDER.width, RENDER.height); // the world's depth for the particles to meet softly (round 113)
  let soft: THREE.Mesh | null = null;
  const picture = new THREE.WebGLRenderTarget(RENDER.width, RENDER.height, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, generateMipmaps: false, depthBuffer: false }); // what the post pass draws, at the low-res size (the last pass filters it bilinearly where two of its pixels share a screen pixel)
  const present = createPresent(picture.texture);
  const canvasSize = new THREE.Vector2(RENDER.width, RENDER.height);
  let dpr = 1;
  const shadow = createMoonShadow();
  const lantern = createLanternShadow();
  const lamps = createLampShadows();
  const reflection = createReflection();
  const mirror = createMirrorView();
  worldUniforms.uMarkCharacters.value = 1; // the post pass reads characters from the target's alpha
  const size = new THREE.Vector2(RENDER.width, RENDER.height);

  const render = (scene: THREE.Scene, camera: THREE.Camera, shadowAt: { x: number; y: number; z: number } | null = null, moon = true): void => {
    renderer.info.reset();
    if (shadowAt) shadow.focus.set(shadowAt.x, shadowAt.y, shadowAt.z);
    shadow.enabled = !!shadowAt && moon;
    shadow.render(renderer, scene);
    lantern.enabled = !!shadowAt;
    lantern.render(renderer, scene, camera, shadowAt ?? shadow.focus);
    lamps.enabled = !!shadowAt;
    lamps.render(renderer, scene, shadowAt ?? shadow.focus);
    reflection.render(renderer, scene, camera);
    mirror.render(renderer, scene, camera);
    const pu = post.uniforms;
    pu.uContact.value.x = shadowAt ? LIGHTING.contact.strength : 0; // fine shadows go with the shadows (round 113)
    camera.updateMatrixWorld();
    pu.uProj.value.copy(camera.projectionMatrix);
    pu.uView.value.copy(camera.matrixWorldInverse);
    renderer.setRenderTarget(target);
    if (soft) drawSoft(renderer, target, softDepth, soft, camera, () => renderer.render(scene, camera));
    else renderer.render(scene, camera);
    renderer.setRenderTarget(picture);
    renderer.render(post.scene, post.camera);
    renderer.setRenderTarget(null);
    renderer.render(present.scene, present.camera);
  };
  /** Every program is also taken into use (its uniforms read) once compiled: that waits on the GPU, and would stall the first frame that draws it. */
  const compile = async (scene: THREE.Scene, camera: THREE.Camera): Promise<void> => {
    await Promise.all([renderer.compileAsync(scene, camera), renderer.compileAsync(post.scene, post.camera), renderer.compileAsync(present.scene, present.camera), renderer.compileAsync(castSilhouettes.scene, camera)]); // (round 94: the foes' shapes in the shadow maps too)
    for (const root of [scene, post.scene, present.scene, castSilhouettes.scene]) {
      root.traverse((o) => {
        for (const m of [(o as Partial<THREE.Mesh>).material ?? []].flat()) (renderer.properties.get(m) as { currentProgram?: THREE.WebGLProgram }).currentProgram?.getUniforms();
      });
    }
  };

  return {
    renderer,
    post,
    shadow,
    lantern,
    lamps,
    reflection,
    mirror,
    size,
    get dpr() {
      return dpr;
    },
    render,
    compile,
    softParticles(mesh) {
      soft = mesh ?? null;
    },
    async warm(scene, camera) {
      await compile(scene, camera);
      render(scene, camera);
    },
    grab() {
      const [width, height] = [target.width, target.height];
      const data = new Uint8Array(width * height * 4);
      renderer.readRenderTargetPixels(target, 0, 0, width, height, data);
      return { data, width, height };
    },
    shot() {
      const [width, height] = [picture.width, picture.height];
      const data = new Uint8Array(width * height * 4);
      renderer.readRenderTargetPixels(picture, 0, 0, width, height, data);
      const image = new ImageData(width, height);
      for (let y = 0; y < height; y++) image.data.set(data.subarray((height - 1 - y) * width * 4, (height - y) * width * 4), y * width * 4); // (its rows come from the bottom)
      const canvas = Object.assign(document.createElement('canvas'), { width, height });
      canvas.getContext('2d')!.putImageData(image, 0, 0);
      return canvas;
    },
    resize(lowRes, scale = SETTINGS.resolution[3], even = true) {
      const aspect = RENDER.width / RENDER.height;
      const cssW = Math.min(innerWidth, innerHeight * aspect);
      const cssH = cssW / aspect;
      dpr = devicePixelRatio || 1;
      const screenW = Math.max(1, Math.round(cssW * dpr)); // the screen's pixels in the box
      const screenH = Math.max(1, Math.round(cssH * dpr));
      const w = lowRes ? Math.round(RENDER.width * scale) : screenW;
      const h = lowRes ? Math.round(RENDER.height * scale) : screenH;
      const spread = lowRes && even;
      canvasSize.set(spread ? screenW : w, spread ? screenH : h);
      renderer.setSize(canvasSize.x, canvasSize.y, false);
      renderer.domElement.style.width = `${spread ? screenW / dpr : cssW}px`; // spread: one canvas pixel to each of the screen's
      renderer.domElement.style.height = `${spread ? screenH / dpr : cssH}px`;
      target.setSize(w, h);
      softDepth.setSize(w, h);
      picture.setSize(w, h);
      size.set(w, h);
      present.set(size, canvasSize, spread);
    },
  };
}
