import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { gatePlace } from '../src/systems/checkpoints';
import { createWorldGame } from '../src/systems/game';
import { enterGate } from '../src/systems/gateWalk';
import { passGate } from '../src/systems/checkpoints';
import type { ParticleSpec, Particles } from '../src/render/particles';
import { createPortalViews, PORTAL } from '../src/render/portalViews';
import { goTo } from './worldHelpers';

function rig() {
  const g = createWorldGame();
  const scene = new THREE.Scene();
  const got: ParticleSpec[] = [];
  const fx: Particles = { spawn: (p) => void got.push(p), update: () => undefined };
  const views = createPortalViews(scene, g, fx);
  const veils = (): THREE.Mesh[] => scene.children.flatMap((c) => c.children).filter((m): m is THREE.Mesh => m instanceof THREE.Mesh);
  const at = (id: string): THREE.ShaderMaterial => {
    const t = gatePlace(id)!;
    const root = scene.children.find((c) => Math.abs(c.position.x - t.x) < 0.01 && Math.abs(c.position.z - t.z) < 0.01)!;
    return (root.children[0] as THREE.Mesh).material as THREE.ShaderMaterial;
  };
  return { g, scene, got, views, veils, at };
}

describe('the gates\' veils (round 60: "more ambitious, visually compelling animations")', () => {
  it('each gate has a door of light in the colours of the realm beyond, asleep from afar and waking as the investigator comes near', () => {
    const { g, views, veils, at } = rig();
    const eye = new THREE.Vector3();
    views.update(0, eye, false);
    expect(veils()).toHaveLength(g.ecs.c.gate.size);
    const gate = gatePlace('hub_australia')!;
    const [here, there] = [at('hub_australia').uniforms.uSky.value, at('pnakotus_gate').uniforms.uSky.value];
    expect(here.equals(there)).toBe(false); // each the colours of its own far side
    goTo(g, gate.x + 40, gate.z + 40);
    for (let t = 0; t < 3; t += 0.05) views.update(t, eye.set(gate.x, 2, gate.z + 10), false);
    expect(at('hub_australia').uniforms.uWake.value).toBe(0);
    goTo(g, gate.arrive.x, gate.arrive.z);
    for (let t = 3; t < 6; t += 0.05) views.update(t, eye, false);
    expect(at('hub_australia').uniforms.uWake.value).toBeGreaterThan(0.5);
  });

  it('stepping in, it blazes and motes are torn in; coming through, the twin bursts outward once the journey\'s veil lifts', () => {
    const { g, got, views, at } = rig();
    const gate = gatePlace('hub_australia')!;
    const eye = new THREE.Vector3(gate.x, 2, gate.z + 8);
    goTo(g, gate.x + (gate.arrive.x - gate.x) * 0.08, gate.z + (gate.arrive.z - gate.z) * 0.08); // at the veil, as a step into it leaves them
    views.update(0, eye, false);
    enterGate(g, gate);
    const torn = got.length;
    expect(torn).toBeGreaterThanOrEqual(PORTAL.burst);
    for (let t = 0; t < 1; t += 0.05) views.update(t, eye, false);
    expect(at('hub_australia').uniforms.uFlare.value).toBeGreaterThan(0.5);
    passGate(g, gate.id);
    const twin = gatePlace(gate.to)!;
    eye.set(twin.arrive.x, 2, twin.arrive.z);
    const before = got.length;
    for (let t = 1; t < 2; t += 0.05) views.update(t, eye, true); // under the veil: it waits
    expect(at(twin.id).uniforms.uFlare.value).toBe(0);
    views.update(2.05, eye, false);
    expect(got.length - before).toBeGreaterThanOrEqual(PORTAL.burst);
    expect(at(twin.id).uniforms.uFlare.value).toBeGreaterThan(0.5);
    for (const p of got) for (const n of [p.x, p.y, p.z, p.vx ?? 0, p.vy ?? 0, p.vz ?? 0, p.life, p.size]) expect(Number.isFinite(n)).toBe(true);
  });
});
