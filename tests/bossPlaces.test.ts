/**
 * The nineteen outdoor boss places (round 71; world/places/*.ts, world/placeKit.ts, docs/BOSS_PLACES.md): each stands from the supplied packs'
 * baked models, keeps its fight's ring clear, its way in open, its pieces within the budget, and the packs' licences as they were given.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { HOUSE } from '../src/data/arenaHouses';
import { MODEL_INFO } from '../src/data/models/index';
import { BOSS_INFO } from '../src/data/models/bossIndex';
import type { Collider } from '../src/world/colliders';
import { worldLayout } from '../src/world/placements';
import { EXTRAS, PLACES } from '../src/world/places';
import { propColliders } from '../src/world/props';
import type { Prop } from '../src/world/props';

const arenas = worldLayout().arenas;
const BOSSES = [...Object.keys(PLACES), ...Object.keys(EXTRAS)];
const arenaOf = (boss: string) => arenas.find((a) => a.bosses[0] === boss)!;
const setProps = (ps: readonly Prop[]) => ps.filter((p) => p.kind === 'set' && p.set && MODEL_INFO[p.set.id]?.kit && BOSS_INFO[p.set.id]);
const trisOf = (ps: readonly Prop[]) => ps.reduce((n, p) => n + (MODEL_INFO[p.set!.id]?.tris ?? 0), 0);
const solidInBody = (c: Collider) => (c.kind === 'box' ? c.min.y : c.y0) < 1.8 && (c.kind === 'box' ? c.max.y : c.y1) > 0.2;
/** The nearest metres from (x, z) to a collider's footprint (0 inside it). */
function near(c: Collider, x: number, z: number): number {
  if (c.kind === 'cylinder') return Math.max(0, Math.hypot(x - c.x, z - c.z) - c.radius);
  if (c.kind === 'box') return Math.hypot(Math.max(c.min.x - x, 0, x - c.max.x), Math.max(c.min.z - z, 0, z - c.max.z));
  const [s, k] = [Math.sin(c.yaw), Math.cos(c.yaw)];
  const [dx, dz] = [x - c.x, z - c.z];
  const [lx, lz] = [dx * k - dz * s, dx * s + dz * k]; // (toBoxFrame's rotation)
  return Math.hypot(Math.max(Math.abs(lx) - c.hx, 0), Math.max(Math.abs(lz) - c.hz, 0));
}

describe('the twenty boss places', () => {
  it('stand about every one of the twenty open arenas (round 73 added the hall of Nyarlathotep), and each of them has the packs in it', () => {
    expect(new Set(BOSSES).size).toBe(20);
    for (const boss of BOSSES) {
      const a = arenaOf(boss);
      expect(a, boss).toBeTruthy();
      expect(a.house, boss).toBeTruthy();
      if (boss in PLACES) expect(a.house!.kind, boss).toBe('place');
      const set = setProps(a.house!.props);
      expect(set.length, `${boss}: its pieces`).toBeGreaterThan(40);
      expect(new Set(set.map((p) => MODEL_INFO[p.set!.id]!.kit)).size, `${boss}: kits`).toBeGreaterThanOrEqual(2);
    }
  });

  it('are each their own: no two are made of the same models, and none borrows another boss\'s whole set', () => {
    const sets = BOSSES.map((b) => [b, [...new Set(setProps(arenaOf(b).house!.props).map((p) => p.set!.id))].sort()] as const);
    for (const [b, ids] of sets) {
      expect(ids.length, `${b}: models`).toBeGreaterThanOrEqual(6);
      const same = sets.filter(([o, other]) => o !== b && other.join() === ids.join());
      expect(same.map(([o]) => o), `${b}: the same models as`).toEqual([]);
      const shared = sets.filter(([o, other]) => o !== b && other.filter((id) => ids.includes(id)).length / ids.length > 0.85);
      expect(shared.map(([o]) => o), `${b}: nearly the same models as`).toEqual([]);
    }
  });

  it('keep the fight\'s ring clear of anything a body bumps into, and a way from the gate to it open', () => {
    for (const boss of BOSSES) {
      const a = arenaOf(boss);
      const cols = a.house!.props.flatMap(propColliders).filter(solidInBody);
      const ring = a.radius - 1;
      for (const c of cols) expect(near(c, a.x, a.z), `${boss}: a piece in the fight`).toBeGreaterThan(ring);
      const g = a.house!.gate;
      const steps = Math.ceil(Math.hypot(g.x - a.x, g.z - a.z) / 0.5);
      for (let i = 0; i <= steps; i++) {
        const [x, z] = [g.x + ((a.x - g.x) * i) / steps, g.z + ((a.z - g.z) * i) / steps];
        const hit = cols.find((c) => near(c, x, z) < 0.45);
        expect(hit, `${boss}: the way in, ${(i * 0.5).toFixed(1)} m from the gate`).toBeUndefined();
      }
    }
  });

  it('have their gate on the wall, their stake within it, and every piece within the ground levelled for it', () => {
    for (const boss of BOSSES) {
      const a = arenaOf(boss);
      const h = a.house!;
      if (h.kind === 'place') {
        expect(Math.abs(h.gap(h.gate)), `${boss}: gate on the wall`).toBeLessThan(0.6);
        expect(h.gap(h.stake), `${boss}: the stake within`).toBeLessThan(-HOUSE.margin);
        for (const p of h.props) {
          expect(h.gap(p), `${boss}: a piece at ${p.set?.id} (${p.x.toFixed(0)}, ${p.z.toFixed(0)}) is out in the wild`).toBeLessThan(40);
        }
      }
      expect(h.rect.x1 - h.rect.x0, boss).toBeLessThan(260);
      expect(h.rect.z1 - h.rect.z0, boss).toBeLessThan(260);
    }
  });

  it('are light enough: each within its triangle budget, and the whole of them within the world\'s', () => {
    let total = 0;
    for (const boss of BOSSES) {
      const tris = trisOf(setProps(arenaOf(boss).house!.props));
      total += tris;
      expect(tris, `${boss}: the triangles of its pieces`).toBeLessThan(110000);
    }
    expect(total / BOSSES.length, 'the mean place').toBeLessThan(60000);
  });

  it('breathe: each has sources of mist, sparks, wisps or flame that stand where something is', () => {
    for (const boss of BOSSES) {
      const h = arenaOf(boss).house!;
      const emits = (h.living ?? []).filter((l) => l.kind === 'emit');
      expect(emits.length, `${boss}: what it breathes`).toBeGreaterThanOrEqual(3);
      const shapes = new Set(emits.map((e) => (e.kind === 'emit' ? e.shape : '')));
      expect(shapes.size, `${boss}: a single sort of thing breathes`).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('the packs\' licences (docs/BOSS_PLACES.md)', () => {
  const dir = 'tools/models/boss';
  const manifests = readdirSync(dir).filter((f) => /^manifest.*\.py$/.test(f)).map((f) => readFileSync(`${dir}/${f}`, 'utf8')).join('\n');

  it('bake nothing from pack 07, whose licence forbids its raw assets being shipped in a public build', () => {
    expect(manifests).not.toMatch(/p07/);
    for (const [id, info] of Object.entries(BOSS_INFO)) expect(info.kit, id).not.toBe('p07');
  });

  it('bake nothing from pack 41 (PSX Shelves), which may not be redistributed as assets, nor name its models (round 77)', () => {
    expect(manifests).not.toMatch(/p41/);
    for (const [id, info] of Object.entries(BOSS_INFO)) expect(info.kit, id).not.toBe('p41');
    expect(Object.keys(BOSS_INFO).filter((id) => id.startsWith('ps_'))).toEqual([]);
  });

  it('credit every pack a model comes from, and name the changes the CC BY ones ask for', () => {
    const credits = readFileSync('src/data/models/CREDITS.md', 'utf8');
    const kits = new Set(Object.values(BOSS_INFO).map((i) => i.kit).filter((k) => k !== 'proc'));
    for (const k of kits) expect(credits, `credits of ${k}`).toContain(`Pack ${k.slice(1)}`);
    expect(credits).toMatch(/CC BY 4\.0/);
    expect(credits).toMatch(/modified|changes/i);
  });
});
