import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { lightFlame } from '../src/render/lantern';
import { LANTERN_LIFE, gutterGain, kindleGain, lanternGain } from '../src/render/lanternLife';
import { createWorldGame } from '../src/systems/game';
import { setSanity } from '../src/systems/sanity';

const sample = (f: (age: number) => number, seconds: number): number[] => Array.from({ length: Math.round(seconds * 60) + 1 }, (_, i) => f(i / 60));
const dips = (xs: number[]): number => xs.reduce((n, x, i) => n + (i > 0 && xs[i - 1] > 0.6 && x < 0.3 ? 1 : 0), 0);

describe('round 58: the lantern gutters out when the mind comes Unmoored, and catches again above it', () => {
  it('gutters: up at first, stuttering lower and lower, then out', () => {
    const xs = sample(gutterGain, LANTERN_LIFE.gutter);
    expect(xs[0]).toBeGreaterThan(0.95);
    expect(xs.every((x) => x >= 0 && x <= 1)).toBe(true);
    expect(dips(xs)).toBeGreaterThanOrEqual(2); // a flicker, not a fade
    expect(xs.some((x, i) => i > 0 && x > xs[i - 1] + 0.2)).toBe(true); // it flares back between the dips
    const half = Math.floor(xs.length / 2);
    expect(Math.max(...xs.slice(half))).toBeLessThan(Math.max(...xs.slice(0, half))); // weaker in the second half
    expect(gutterGain(LANTERN_LIFE.gutter)).toBe(0);
    expect(gutterGain(60)).toBe(0);
    expect(LANTERN_LIFE.gutter).toBeLessThan(2.5); // a brief moment
  });

  it('kindles: dark at first, catching with fewer stutters, then steady and full', () => {
    const xs = sample(kindleGain, LANTERN_LIFE.kindle);
    expect(xs[0]).toBeLessThan(0.1);
    expect(xs.every((x) => x >= 0 && x <= 1)).toBe(true);
    expect(kindleGain(LANTERN_LIFE.kindle)).toBe(1);
    expect(kindleGain(99)).toBe(1);
    expect(xs[xs.length - 2]).toBeGreaterThan(0.9);
  });

  it('follows the band: lit at Lucid, out when Unmoored, dark until Fractured, and a save loaded Unmoored begins dark', () => {
    const g = createWorldGame();
    expect(lanternGain(g)).toBe(1);
    setSanity(g, 10);
    expect(g.mind.band).toBe('unmoored');
    expect(lanternGain(g)).toBeGreaterThan(0.95); // the instant it falls: still burning
    g.frame += 35;
    const seen: number[] = [];
    for (let i = 0; i < 54; i++) { g.frame += 1; seen.push(lanternGain(g)); }
    expect(seen.some((x) => x < 0.3) && seen.some((x) => x > 0.6)).toBe(true); // guttering
    g.frame += 120;
    expect(lanternGain(g)).toBe(0); // out
    g.frame += 60 * 600;
    expect(lanternGain(g)).toBe(0); // and out it stays, however long
    setSanity(g, 17);
    expect(g.mind.band).toBe('unmoored'); // (three points of hysteresis: sanity.ts)
    expect(lanternGain(g)).toBe(0);
    setSanity(g, 18);
    expect(g.mind.band).toBe('fractured'); // one band above
    expect(lanternGain(g)).toBeLessThan(0.1);
    g.frame += Math.ceil(LANTERN_LIFE.kindle * 60) + 1;
    expect(lanternGain(g)).toBe(1);

    const loaded = createWorldGame();
    loaded.mind.band = 'unmoored';
    expect(lanternGain(loaded)).toBe(0);
  });

  it('draws the flame smaller and dimmer as it fails, and not at all when it is out', () => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.ShaderMaterial({ uniforms: { uEmissive: { value: 1 } } }));
    lightFlame(mesh, 1);
    expect(mesh.visible && mesh.scale.x === 1).toBe(true);
    lightFlame(mesh, 0.4);
    expect(mesh.scale.x).toBeLessThan(1);
    expect((mesh.material as THREE.ShaderMaterial).uniforms.uEmissive.value).toBeCloseTo(0.4);
    lightFlame(mesh, 0);
    expect(mesh.visible).toBe(false);
  });
});
