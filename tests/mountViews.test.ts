import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { buildFigure } from '../src/render/figures';
import { createMountViews } from '../src/render/mountViews';
import { createGame } from '../src/systems/game';

describe('mount presentation lifecycle', () => {
  it('seats the rider at the moving mount seat and reuses each model across summons', () => {
    const g = createGame(), scene = new THREE.Scene(), f = buildFigure('player');
    const view = createMountViews(scene, g);
    g.player.mount.active = 'chariot';
    for (let i = 0; i < 6; i++) { f.root.position.set(5, 0, 5); view.place(f, i / 10, 0.1); }
    const mount = scene.getObjectByName('mount-chariot')!;
    const seat = mount.getObjectByName('rider-seat-feet-origin')!;
    expect(f.root.position.distanceTo(seat.getWorldPosition(new THREE.Vector3()))).toBeLessThan(1e-6);
    g.player.mount.active = null;
    for (let i = 0; i < 6; i++) { f.root.position.set(5, 0, 5); view.place(f, 1 + i / 10, 0.1); }
    expect(mount.visible).toBe(false);
    expect(f.root.position.toArray()).toEqual([5, 0, 5]);
    g.player.mount.active = 'chariot'; f.root.position.set(7, 0, 9); view.place(f, 2, 0.1);
    expect(scene.getObjectByName('mount-chariot')).toBe(mount);
    expect(mount.position.toArray()).toEqual([7, 0, 9]);
  });

  it('clears the model immediately on player death even when the hidden rider stops rendering', () => {
    const g = createGame(), scene = new THREE.Scene(), f = buildFigure('player');
    const view = createMountViews(scene, g);
    g.player.mount.active = 'chariot'; view.place(f, 0.1, 0.1);
    const mount = scene.getObjectByName('mount-chariot')!;
    expect(mount.visible).toBe(true);
    g.events.emit('Died', { entity: g.player.id, killer: null, at: { x: 0, y: 0, z: 0 } });
    expect(g.player.mount.active).toBe(null);
    expect(mount.visible).toBe(false);
  });
});
