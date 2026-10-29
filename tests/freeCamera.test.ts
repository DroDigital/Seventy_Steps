import { describe, expect, it } from 'vitest';
import { PerspectiveCamera, Vector3 } from 'three';
import { emptyInput } from '../src/core/input';
import { createFreeCamera } from '../src/ui/freeCamera';

describe('free camera', () => {
  it('takes up the current view and restores control when disabled', () => {
    const camera = new PerspectiveCamera();
    camera.position.set(4, 5, 6);
    camera.lookAt(9, 3, 12);
    const before = camera.getWorldDirection(new Vector3());
    const flight = createFreeCamera();
    flight.enable(camera);
    flight.apply(camera);
    expect(camera.position.toArray()).toEqual([4, 5, 6]);
    expect(camera.getWorldDirection(new Vector3()).distanceTo(before)).toBeLessThan(1e-8);
    flight.disable();
    camera.position.set(1, 2, 3);
    flight.apply(camera);
    expect(camera.position.toArray()).toEqual([1, 2, 3]);
  });

  it('flies with movement, look, and vertical controls without moving the player', () => {
    const camera = new PerspectiveCamera();
    camera.lookAt(0, 0, 1);
    const flight = createFreeCamera();
    flight.enable(camera);
    const input = emptyInput();
    input.moveY = 1;
    input.held.dodge = true;
    flight.step(input, 1);
    flight.apply(camera);
    expect(camera.position.z).toBeCloseTo(10 / Math.sqrt(2));
    expect(camera.position.y).toBeCloseTo(10 / Math.sqrt(2));
    const turn = emptyInput();
    turn.lookX = Math.PI / 2;
    flight.step(turn, 1 / 60);
    flight.apply(camera);
    expect(camera.getWorldDirection(new Vector3()).x).toBeCloseTo(-1);
  });
});
