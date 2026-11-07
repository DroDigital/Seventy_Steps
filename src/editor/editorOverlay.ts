/**
 * What the world editor draws over the finished picture (round 110, development builds only): a box
 * about what is held, one about what the mouse is over, and marks for the foes' posts and the sites
 * about the camera; never fogged or graded, seen through walls.
 */

import * as THREE from 'three';
import type { Box } from './editorItems';

/** A box of edges from y 0 to 1 and x, z -1 to 1, and a tick out along +z: the way it faces. */
function unitBox(): THREE.BufferGeometry {
  const c = [-1, 1];
  const pts: number[] = [];
  const seg = (a: number[], b: number[]): void => void pts.push(...a, ...b);
  for (const x of c) for (const z of c) seg([x, 0, z], [x, 1, z]);
  for (const y of [0, 1]) {
    for (const x of c) seg([x, y, -1], [x, y, 1]);
    for (const z of c) seg([-1, y, z], [1, y, z]);
  }
  seg([0, 0.5, 0], [0, 0.5, 1.6]);
  return new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
}

const material = (rgb: readonly [number, number, number], alpha: number): THREE.ShaderMaterial =>
  new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Vector4(...rgb, alpha) } },
    vertexShader: 'void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform vec4 uColor; void main() { gl_FragColor = uColor; }',
    depthTest: false,
    depthWrite: false,
    transparent: true,
  });

export type MarkKind = 'foe' | 'site' | 'added';

export interface EditorOverlay {
  /** The held box (null: none), the hovered one, and the marks. */
  set(held: Box | null, hover: Box | null, marks: readonly { box: Box; kind: MarkKind }[]): void;
  draw(renderer: THREE.WebGLRenderer, camera: THREE.Camera): void;
  dispose(): void;
}

const MAX_MARKS = 300;

export function createEditorOverlay(): EditorOverlay {
  const scene = new THREE.Scene();
  const geo = unitBox();
  const mats = { held: material([1, 0.85, 0.2], 1), hover: material([1, 1, 1], 0.6), foe: material([1, 0.3, 0.25], 0.8), site: material([0.3, 0.9, 1], 0.8), added: material([0.4, 1, 0.4], 0.5) };
  const line = (m: THREE.ShaderMaterial): THREE.LineSegments => {
    const l = new THREE.LineSegments(geo, m);
    l.frustumCulled = false;
    l.visible = false;
    scene.add(l);
    return l;
  };
  const held = line(mats.held);
  const hover = line(mats.hover);
  const marks = Array.from({ length: MAX_MARKS }, () => line(mats.foe));
  const place = (l: THREE.LineSegments, b: Box | null, grow = 0): void => {
    l.visible = !!b;
    if (!b) return;
    l.position.set(b.x, b.y - grow, b.z);
    l.rotation.set(0, b.yaw, 0);
    l.scale.set(b.hx + grow, b.h + 2 * grow, b.hz + grow);
  };
  return {
    set(h, o, ms) {
      place(held, h, 0.05);
      place(hover, o && (!h || o.x !== h.x || o.z !== h.z) ? o : null, 0.02);
      marks.forEach((l, i) => {
        const m = ms[i];
        place(l, m?.box ?? null);
        if (m) l.material = mats[m.kind];
      });
    },
    draw(renderer, camera) {
      const auto = renderer.autoClear;
      renderer.autoClear = false;
      renderer.setRenderTarget(null);
      renderer.clearDepth();
      renderer.render(scene, camera);
      renderer.autoClear = auto;
    },
    dispose() {
      geo.dispose();
      for (const m of Object.values(mats)) m.dispose();
    },
  };
}
