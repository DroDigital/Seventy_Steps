import { describe, expect, it } from 'vitest';
import { echoFigure } from '../src/render/echoFigure';
import { poseEcho } from '../src/render/echoPose';

describe('lost Echo animation', () => {
  it('keeps the lantern and ground halo in place while the light moves', () => {
    const f = echoFigure();
    const flame = f.root.getObjectByName('echo-flame')!;
    const orbit = f.root.getObjectByName('echo-orbit')!;
    const halo = f.root.getObjectByName('echo-halo')!;
    const lamp = f.root.children.find((child) => child !== f.body && child !== flame && child !== orbit && child !== halo)!;
    const lampPosition = lamp.position.clone();
    poseEcho(f, 0);
    const first = flame.position.clone();
    for (let time = 0; time < 30; time += 0.1) {
      poseEcho(f, time);
      expect(halo.position.y).toBeCloseTo(0.025);
      expect(lamp.position.equals(lampPosition)).toBe(true);
      expect(flame.position.y).toBeGreaterThan(0.25);
    }
    expect(flame.position.distanceTo(first)).toBeGreaterThan(0.001);
    expect(orbit.rotation.y).toBeGreaterThan(1);
  });

  it('returns to the same pose regardless of frame order', () => {
    const f = echoFigure();
    const flame = f.root.getObjectByName('echo-flame')!;
    poseEcho(f, 2.5);
    const position = flame.position.clone(), rotation = flame.rotation.clone(), scale = flame.scale.clone();
    poseEcho(f, 19);
    poseEcho(f, 2.5);
    expect(flame.position.equals(position)).toBe(true);
    expect(flame.rotation.equals(rotation)).toBe(true);
    expect(flame.scale.equals(scale)).toBe(true);
  });
});
