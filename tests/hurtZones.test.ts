/**
 * Multipart colossus hitboxes follow the picture and recovery pose, with normal damage everywhere.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { emptyInput } from '../src/core/input';
import { globes, pictured, zoneShapes } from '../src/data/assemblyShape';
import { ZONES } from '../src/data/bossTuning';
import { getEntity } from '../src/data/registry';
import { reviewedSize, type ReviewedManifest } from '../src/render/sprites/reviewed';
import { COMBAT, PLAYER } from '../src/data/tuning';
import { startMove } from '../src/systems/actions';
import { stepGame } from '../src/systems/game';
import { refreshStoops, stooped, zoneGap, zonesOf } from '../src/systems/hurt';
import { setLock } from '../src/systems/lockOn';
import { shotSystem } from '../src/systems/revolver';
import { bossGame } from './bossHelpers';
import { place, press } from './helpers';

const recipe = (id: string) => getEntity(id)!.assembly!;

/** Damage of each blow the investigator lands on `id` in five seconds, held at the edge of its body. */
function blows(id: string, stoop: boolean): number[] {
  const { g, boss } = bossGame(id, undefined, 30);
  const c = g.ecs.c;
  c.body.get(boss)!.fixed = true;
  c.brain.delete(boss);
  const me = c.health.get(g.player.id)!;
  me.hp = me.max = 1e7;
  g.player.levels.might = 0;
  const at = { ...c.transform.get(boss)!.pos };
  const out: number[] = [];
  g.events.on('Hit', (e) => void (e.attacker === g.player.id && e.target === boss && out.push(e.damage)));
  for (let frame = 0; frame < 300; frame++) {
    place(g, g.player.id, at.x, at.z + c.body.get(boss)!.radius + PLAYER.radius + 0.05, Math.PI);
    c.stamina.get(g.player.id)!.value = PLAYER.stamina;
    g.camera.yaw = g.camera.prevYaw = 0;
    if (frame === 2) setLock(g, boss);
    if (stoop) c.fight.get(boss)!.stoopUntil = g.frame + 5;
    stepGame(g, frame % 40 === 5 ? press('light') : emptyInput());
  }
  return out;
}

describe('hurt zones (round 24)', () => {
  it('belong to the tall assembly bodies, and to no other', () => {
    for (const id of ['cthulhu', 'ghatanothoa', 'father_dagon', 'shub_niggurath', 'yog_sothoth']) {
      const { g, boss } = bossGame(id);
      expect(zonesOf(g, boss), id).not.toBeNull();
    }
    for (const id of ['deep_one', 'dunwich_horror', 'hastur']) {
      const { g, boss } = bossGame(id);
      expect(zonesOf(g, boss), id).toBeNull();
    }
  });

  it('a column keeps its legs, torso and head hitboxes; stooped, the head follows its pose', () => {
    const [h, r] = [20, 6];
    const up = zoneShapes(recipe('ghatanothoa'), r, h, 1, false)!;
    expect(up).toHaveLength(3);
    expect(up[2].y0).toBeGreaterThan(3); // out of a blade's reach
    const down = zoneShapes(recipe('ghatanothoa'), r, h, 1, true)!;
    expect(down[2].y1).toBeLessThanOrEqual(ZONES.head.stoop);
    expect(down[2].y0).toBe(0);
  });

  it('a body of spheres is its spheres, a ring of them resting low about its foot', () => {
    const r = recipe('yog_sothoth');
    const gl = globes(r, 7);
    expect(gl.length).toBe(r.spheres);
    expect(gl.filter((s) => s.y < 4).length).toBeGreaterThanOrEqual(4);
    expect(globes(r, 7)).toEqual(gl); // the same each time: the picture and the fight agree
    expect(zoneShapes(r, 7.6, 20, 7, false)!.every((z) => z.ball)).toBe(true);
  });

  it('Yog-Sothoth is struck where its spheres are painted: ringed about it, within a blade\'s reach of its body, the lowest on the ground', () => {
    const r = recipe('yog_sothoth');
    const body = { height: 20, radius: 7.6 };
    expect(r.hit).toHaveLength(7);
    const zones = zoneShapes(r, body.radius, body.height, 7, false)!;
    expect(zones.every((z) => z.ball)).toBe(true);
    expect(zones.length).toBeGreaterThan(r.hit!.length); // ringed
    for (const z of zones) expect(Math.hypot(z.x, z.z) + z.r).toBeLessThanOrEqual(body.radius * 1.15 + 1e-9);
    expect(Math.min(...zones.map((z) => z.y0 - z.r))).toBeLessThan(0.1); // a blade on the ground reaches one
    expect(zoneShapes(r, body.radius, body.height, 99, false)).toEqual(zones); // not from the seed
    expect(pictured([[0.01, 0.3, 0.1]], 20, 7.6)).toHaveLength(1); // on the axis: one, not four
  });

  it('and its table lies within the painted body, in the art\'s own scale', () => {
    const manifest = JSON.parse(readFileSync('public/creatures/reviewed/index.json', 'utf8')) as ReviewedManifest;
    const entity = manifest.entities.yog_sothoth;
    const frame = manifest.frames[entity.directions.front.actions.idle![0]];
    const size = reviewedSize(entity, manifest);
    const ground = frame.height * (1 - size.groundOffset / size.height);
    const [x0, y0, x1, y1] = frame.bounds as number[];
    const tall = y1 - y0; // the figure's height in pixels is `scale` metres: a fraction of the scale is that fraction of it
    for (const [across, up, size] of recipe('yog_sothoth').hit!) {
      const [px, py, pr] = [frame.width / 2 + across * tall, ground - up * tall, size * tall];
      expect(px - pr).toBeGreaterThanOrEqual(x0 - 2);
      expect(px + pr).toBeLessThanOrEqual(x1 + 2);
      expect(py - pr).toBeGreaterThanOrEqual(y0 - 2);
      expect(py + pr).toBeLessThanOrEqual(y1 + 2);
    }
  });

  it('a blade deals the same damage whether it touches the legs or the stooped head', () => {
    const feet = blows('ghatanothoa', false);
    const head = blows('ghatanothoa', true);
    expect(feet.length).toBeGreaterThan(0);
    expect(head.length).toBeGreaterThan(0);
    expect(head[0]).toBe(feet[0]);
  });

  it.each(['ghatanothoa', 'cthulhu', 'father_dagon', 'shub_niggurath', 'yog_sothoth'])('%s takes normal damage on every body part', (id) => {
    const { g, boss } = bossGame(id);
    const at = g.ecs.c.transform.get(boss)!.pos;
    for (const z of zonesOf(g, boss)!) {
      const p = { x: at.x + z.x, y: at.y + (z.y0 + z.y1) / 2, z: at.z + z.z };
      expect(zoneGap(g, boss, p, p, 0)).toEqual({ gap2: 0, damage: 1 });
    }
  });

  it('stoops after its own blow: from its recovery on, and a little after', () => {
    const { g, boss } = bossGame('ghatanothoa', undefined, 30);
    const a = g.ecs.c.actor.get(boss)!;
    g.ecs.c.brain.delete(boss);
    expect(stooped(g, boss)).toBe(false);
    startMove(a, 'slam');
    const open = a.moves.slam.open!;
    expect(open).toBeGreaterThan(0);
    a.frame = open - 1;
    refreshStoops(g);
    expect(stooped(g, boss)).toBe(false);
    a.frame = open;
    refreshStoops(g);
    expect(stooped(g, boss)).toBe(true);
    g.frame += ZONES.linger + 1;
    a.move = null;
    expect(stooped(g, boss)).toBe(false);
  });

  it('the locked revolver aims at the usual body height while a colossus stands or stoops', () => {
    const { g, boss } = bossGame('ghatanothoa', undefined, 12);
    g.rng = () => 0; // no random scatter: compare the actual shot line to its lock-on aim
    setLock(g, boss);
    const tr = g.ecs.c.transform.get(boss)!;
    const body = g.ecs.c.body.get(boss)!;
    const a = g.ecs.c.actor.get(g.player.id)!;
    const shots: { from: { x: number; y: number; z: number }; to: { x: number; y: number; z: number } }[] = [];
    g.events.on('Shot', (e) => shots.push(e));
    for (const stoop of [false, true]) {
      g.ecs.c.fight.get(boss)!.stoopUntil = stoop ? g.frame + 5 : 0;
      startMove(a, 'shoot');
      a.frame = a.moves.shoot.shot!.frame;
      shotSystem(g);
      const shot = shots.at(-1)!;
      const flat = Math.hypot(shot.to.x - shot.from.x, shot.to.z - shot.from.z);
      const aimDistance = Math.hypot(tr.pos.x - shot.from.x, tr.pos.z - shot.from.z);
      expect((shot.to.y - shot.from.y) / flat).toBeCloseTo((tr.pos.y + body.aimHeight - shot.from.y) / aimDistance, 8);
      expect(shot.from.y).toBe(COMBAT.muzzleHeight);
    }
  });
});
