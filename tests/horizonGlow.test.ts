import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createRng } from '../src/core/rng';
import { BEAM, DOME, GLOWING, LAMPS } from '../src/data/horizonLife';
import { SKYLINES } from '../src/data/skylines';
import { beamAt, domeStrength, glowGeometry, glows, lampFor, lampPlace, nightGlow, overcastOf } from '../src/render/horizonGlow';
import { createPostPass } from '../src/render/postPass';
import { createRealmLook } from '../src/render/realmLook';
import { createSkyline } from '../src/render/skyline';
import { profile } from '../src/render/skylineShapes';
import { SKYLINE_FRAG } from '../src/render/skylineShader';
import { HOUR_FROM } from '../src/systems/clock';

const GLOAMING = 0.05;
const WANING = 0.88;
const town = { lit: 0.12, seed: 21 };

describe("round 80: the far towns' glow (render/horizonGlow.ts)", () => {
  it('belongs to cities of lit windows and to no other silhouette', () => {
    for (const list of Object.values(SKYLINES)) {
      for (const s of list) expect(glows(s), `${s.kind} ${s.seed}`).toBe(GLOWING.has(s.kind) && (s.lit ?? 0) > 0);
    }
    expect(Object.values(SKYLINES).flat().filter(glows).length).toBeGreaterThanOrEqual(10); // Arkham, Providence, Kingsport, K'n-yan's towers, Celephais...
    expect(glows({ kind: 'hills', lit: undefined })).toBe(false);
    expect(glows({ kind: 'titan', lit: undefined })).toBe(false);
  });

  it('is strongest in the gloaming and fades as the windows go out, but never to nothing', () => {
    const at = (phase: number): number => domeStrength(town, 500, phase);
    expect(at(GLOAMING)).toBeGreaterThan(at(0.4));
    expect(at(0.4)).toBeGreaterThan(at(WANING));
    expect(at(WANING)).toBeGreaterThan(at(GLOAMING) * DOME.night * 0.9); // a few lights are left
    expect(at(0.99)).toBeGreaterThan(at(WANING)); // and the lamps are lit anew as the night turns
    expect(nightGlow(HOUR_FROM.gloaming)).toBe(1);
    expect(nightGlow(0.96)).toBeCloseTo(DOME.night + (1 - DOME.night) * 0.3, 5);
  });

  it('is more where more windows are lit, never more than the cap, and never negative', () => {
    expect(domeStrength({ lit: 0.35, seed: 1 }, 500, GLOAMING)).toBeGreaterThan(domeStrength({ lit: 0.08, seed: 1 }, 500, GLOAMING));
    expect(domeStrength({ lit: 0.9, seed: 1 }, 500, GLOAMING)).toBeCloseTo(domeStrength({ lit: DOME.lit, seed: 1 }, 500, GLOAMING)); // the cap
    for (const d of [1, 100, 300, 1200, 9000]) for (const p of [0, 0.3, 0.8]) for (const o of [0, 1]) {
      const v = domeStrength(town, d, p, o, 17);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(DOME.strength * 1.1 * (1 + DOME.overcast));
    }
  });

  it('does not glow over a town walked up to, and grows as the town is left, then thins with the air between', () => {
    expect(domeStrength(town, 40, GLOAMING)).toBe(0);
    expect(domeStrength(town, DOME.near[0], GLOAMING)).toBe(0);
    expect(domeStrength(town, 250, GLOAMING)).toBeGreaterThan(0);
    expect(domeStrength(town, DOME.near[1], GLOAMING)).toBeGreaterThan(domeStrength(town, 250, GLOAMING));
    expect(domeStrength(town, 6000, GLOAMING)).toBeLessThan(domeStrength(town, 500, GLOAMING));
  });

  it('lies on the cloud: a closed sky brightens it, a clear one leaves it', () => {
    expect(domeStrength(town, 500, GLOAMING, 1)).toBeGreaterThan(domeStrength(town, 500, GLOAMING, 0) * 1.5);
    expect(overcastOf(undefined)).toBe(0);
    expect(overcastOf({ kind: 'clear', amount: 1 })).toBe(0);
    expect(overcastOf({ kind: 'motes', amount: 1 })).toBe(0);
    expect(overcastOf({ kind: 'rain', amount: 0.4 })).toBeCloseTo(0.4);
    expect(overcastOf({ kind: 'storm', amount: 3 })).toBe(1);
  });
});

describe("round 80: the far lamps (data/horizonLife.ts LAMPS)", () => {
  it('each stands on a silhouette of its region, and has a place on its outline', () => {
    expect(LAMPS.length).toBeGreaterThanOrEqual(2);
    for (const l of LAMPS) {
      const def = SKYLINES[l.region]?.[l.index];
      expect(def, `${l.region} ${l.index}`).toBeDefined();
      expect(lampFor(l.region, l.index)).toBe(l);
      const at = lampPlace(profile(def.kind, createRng(def.seed)), l);
      expect(at, `${l.region} ${l.index}`).not.toBeNull();
      expect(Math.abs(at!.x)).toBeLessThanOrEqual(0.5);
      expect(at!.y).toBeGreaterThan(0.05);
      expect(l.period).toBeGreaterThan(4); // slow
      expect(l.phase).toBeGreaterThanOrEqual(0);
      expect(l.phase).toBeLessThan(1);
    }
  });

  it("Devil Reef's lamp is the outline's own lamp-tower, on its top", () => {
    const reef = SKYLINES.innsmouth[0];
    expect(reef.kind).toBe('reef');
    const f = profile('reef', createRng(reef.seed));
    const l = LAMPS.find((x) => x.region === 'innsmouth' && x.index === 0)!;
    expect(l.x).toBeNull();
    const at = lampPlace(f, l)!;
    expect(at).toEqual({ x: f.lamp!.x, y: f.lamp!.y + l.rise });
    expect(f(f.lamp!.x)).toBeGreaterThan(0.45); // the tower stands there
  });

  it('flashes as the beam comes round to the eye, briefly, once a period, and its shaft stands out to one side then the other', () => {
    const lamp = { period: 10, phase: 0 };
    expect(beamAt(lamp, 0).flash).toBeCloseTo(1);
    expect(beamAt(lamp, 10).flash).toBeCloseTo(1);
    expect(beamAt(lamp, 5).flash).toBe(0); // turned away
    const flashing = Array.from({ length: 200 }, (_, i) => beamAt(lamp, i * 0.05).flash).filter((f) => f > 0.5).length;
    expect(flashing * 0.05).toBeLessThan(1.5); // a flash, not a glow
    expect(flashing).toBeGreaterThan(0);
    expect(beamAt(lamp, 2.5).sweep).toBeCloseTo(1); // a quarter turn: out to one side...
    expect(beamAt(lamp, 7.5).sweep).toBeCloseTo(-1); // ...and, three quarters, the other
    for (let t = 0; t < 30; t += 0.37) {
      const b = beamAt({ period: 11, phase: 0.3 }, t);
      expect(b.flash).toBeGreaterThanOrEqual(0);
      expect(b.flash).toBeLessThanOrEqual(1);
      expect(Math.abs(b.sweep)).toBeLessThanOrEqual(1);
      expect(b.shaft).toBeGreaterThanOrEqual(0.3);
      expect(b.shaft).toBeLessThanOrEqual(1);
    }
    expect(BEAM.reach).toBeGreaterThan(BEAM.thick * 20);
  });
});

describe('round 80: the silhouettes carry their glow in their own geometry, with no draw of their own', () => {
  const base = (): THREE.BufferGeometry => new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(-0.5, 0), new THREE.Vector2(0.5, 0), new THREE.Vector2(0, 1)]));
  const kinds = (g: THREE.BufferGeometry): number[] => Array.from({ length: g.getAttribute('aFx').count }, (_, i) => g.getAttribute('aFx').getX(i));

  it('draws the glow first, the outline over it and the lamp over that', () => {
    const g = glowGeometry(base(), true, { x: 0.1, y: 0.9 });
    const first = new Map<number, number>();
    const order = Array.from(g.index!.array).map((i) => kinds(g)[i]);
    for (const [at, k] of order.entries()) if (!first.has(k)) first.set(k, at);
    expect(first.get(1)!).toBeLessThan(first.get(0)!);
    expect(first.get(0)!).toBeLessThan(first.get(2)!);
    expect(new Set(kinds(g))).toEqual(new Set([0, 1, 2]));
    expect(g.index!.count % 3).toBe(0);
    expect(Math.max(...Array.from(g.index!.array))).toBeLessThan(g.getAttribute('position').count);
  });

  it('is the outline alone for a silhouette with neither', () => {
    const b = base();
    const g = glowGeometry(b, false, null);
    expect(g.getAttribute('position').count).toBe(b.getAttribute('position').count);
    expect(kinds(g).every((k) => k === 0)).toBe(true);
    expect(Array.from(g.index!.array)).toEqual(Array.from(b.index!.array));
  });

  it('is the same single mesh as before for every silhouette, and the glow quad spans a town and rises above it', () => {
    const scene = new THREE.Scene();
    createSkyline(scene, createRealmLook(createPostPass(new THREE.Texture())));
    const meshes = scene.children.filter((o): o is THREE.Mesh => o instanceof THREE.Mesh);
    expect(meshes.length).toBe(Object.values(SKYLINES).flat().length + 1);
    const lit = meshes.filter((m) => kinds(m.geometry).includes(1));
    expect(lit.length).toBe(Object.values(SKYLINES).flat().filter(glows).length);
    const withLamp = meshes.filter((m) => kinds(m.geometry).includes(2));
    expect(withLamp.length).toBe(LAMPS.length);
    for (const m of lit) {
      const pos = m.geometry.getAttribute('position');
      const xs = Array.from({ length: pos.count }, (_, i) => pos.getX(i));
      const ys = Array.from({ length: pos.count }, (_, i) => pos.getY(i));
      expect(Math.max(...xs)).toBeCloseTo(DOME.box.across);
      expect(Math.max(...ys)).toBeCloseTo(DOME.box.above);
    }
  });

  it("the shader's far windows follow the night: the pane rules and the clock are in it, and so is every lit kind's glow", () => {
    expect(SKYLINE_FRAG).toContain('paneLit(s, uWink)');
    expect(SKYLINE_FRAG).toContain('uniform float uHurried');
    expect(SKYLINE_FRAG).toContain('uNerves');
  });
});
