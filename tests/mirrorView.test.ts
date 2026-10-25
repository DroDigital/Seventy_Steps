import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { createMirrorView } from '../src/render/mirrorView';
import { worldUniforms } from '../src/render/worldMaterial';

/** A scene with one mirror mesh, its glass at z = 0 facing +z. */
function room(): { scene: THREE.Scene; glass: THREE.Mesh } {
  const scene = new THREE.Scene();
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(2, 3), new THREE.MeshBasicMaterial());
  glass.userData.mirrors = [{ x: 0, y: 1.5, z: 0, nx: 0, ny: 0, nz: 1 }];
  scene.add(glass, new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial()));
  return { scene, glass };
}
const eye = (x: number, y: number, z: number, at: [number, number, number]): THREE.PerspectiveCamera => {
  const c = new THREE.PerspectiveCamera(66, 16 / 9, 0.1, 140);
  c.position.set(x, y, z);
  c.lookAt(...at);
  c.updateMatrixWorld();
  return c;
};
const renderer = (seen: boolean[]) => {
  const calls: THREE.Camera[] = [];
  const r = { getRenderTarget: () => null, setRenderTarget: vi.fn(), render: vi.fn((_: unknown, cam: THREE.Camera) => { calls.push(cam); seen.push(true); }) };
  return { r: r as unknown as THREE.WebGLRenderer, calls, render: r.render };
};

describe('the mirror view (round 74)', () => {
  it('draws the room once more from behind the glass, with the glass itself out of it, and shows it', () => {
    const { scene, glass } = room();
    const view = createMirrorView();
    const visibleDuring: boolean[] = [];
    const { r, calls, render } = renderer([]);
    render.mockImplementation((_: unknown, cam: THREE.Camera) => { calls.push(cam); visibleDuring.push(glass.visible); });
    view.render(r, scene, eye(0, 1.6, 6, [0, 1.5, 0]));
    expect(calls).toHaveLength(1);
    expect(calls[0]!.position.z).toBeLessThan(0); // behind the glass
    expect(visibleDuring).toEqual([false]);
    expect(glass.visible).toBe(true); // and back
    expect(worldUniforms.uMirrorOn.value).toBe(1);
    expect(worldUniforms.uMirrorPlane.value.toArray()).toEqual([0, 0, 1, -0]);
    expect(view.state).toEqual({ found: 1, drawn: true });
    expect(worldUniforms.uMirrorMap.value).toBe(view.target.texture);
  });

  it('draws nothing from behind the glass, from too far, or with the back turned, and says the glass is dark', () => {
    for (const cam of [eye(0, 1.6, -5, [0, 1.5, 0]), eye(0, 1.6, 60, [0, 1.5, 0]), eye(0, 1.6, 6, [0, 1.5, 12])]) {
      const { scene } = room();
      const view = createMirrorView();
      const { r, render } = renderer([]);
      worldUniforms.uMirrorOn.value = 1;
      view.render(r, scene, cam);
      expect(render).not.toHaveBeenCalled();
      expect(worldUniforms.uMirrorOn.value).toBe(0);
      expect(view.state.drawn).toBe(false);
    }
  });

  it('finds a mirror that comes into the scene later (a chunk is built), within a moment', () => {
    const view = createMirrorView();
    const scene = new THREE.Scene();
    const { r, render } = renderer([]);
    const cam = eye(0, 1.6, 6, [0, 1.5, 0]);
    const now = vi.spyOn(performance, 'now');
    now.mockReturnValue(1000);
    view.render(r, scene, cam);
    expect(view.state.found).toBe(0);
    const { scene: built } = room();
    scene.add(...built.children);
    now.mockReturnValue(1100);
    view.render(r, scene, cam);
    expect(view.state.found).toBe(0); // looked for only every so often
    now.mockReturnValue(1600);
    view.render(r, scene, cam);
    expect(view.state.found).toBe(1);
    expect(render).toHaveBeenCalledTimes(1);
    now.mockRestore();
  });
});
