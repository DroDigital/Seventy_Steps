/**
 * The cutscenes frame the horror as it is drawn: a shot aimed at it looks at its painted figure, not over its head. Its capsule (what
 * is struck) is for five of the bosses a third taller than its picture (the Haunter, the Colour, the Unnamable, Nug and Yeb), and the
 * Hound is drawn a third taller than its capsule; framed by that, the lens aimed above the Haunter's head with the Haunter sunk out
 * of the bottom of the picture.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { EPITHETS } from '../src/data/bossCards';
import { arrival, fall, scaleOf, shot, to, type Scene } from '../src/data/cutscenes';
import { bespokeFall } from '../src/data/cutscenesFall';
import { arrivalOf } from '../src/data/cutscenesMore';
import { ENTITIES, paramsOf } from '../src/data/registry';
import { createCinema } from '../src/render/cinema';
import { frameOf, GRAIN, keepGrain, SHOULDER, type Anchor, type Frame } from '../src/render/cinemaPlan';
import { reviewedSpan, type ReviewedManifest } from '../src/render/sprites/reviewed';
import { spawnCreature, toCombatant } from '../src/systems/creatures';
import { createGame } from '../src/systems/game';
import type { CinemaUi } from '../src/ui/cinemaUi';

const pack = JSON.parse(readFileSync('public/creatures/reviewed/index.json', 'utf8')) as ReviewedManifest;
const BOSSES = ENTITIES.filter((d) => d.bossScript && pack.entities[d.id]);
/** Shots that look away from the figure on purpose: the Colour goes up out of the well as it falls. */
const LOOKS_AWAY = new Set(['fall:colour_out_of_space#1']);

/** Where `p` falls on the screen (x, y in -1..1 across a 16:9 picture) and how far ahead of the lens it is. */
function project(f: Frame, p: { x: number; y: number; z: number }): [number, number, number] {
  const F = [f.look.x - f.pos.x, f.look.y - f.pos.y, f.look.z - f.pos.z];
  const n = Math.hypot(...F);
  const [fx, fy, fz] = F.map((v) => v / n);
  const rl = Math.hypot(fz, fx);
  const [rx, rz] = [-fz / rl, fx / rl];
  const [ux, uy, uz] = [-rz * fy, rz * fx - rx * fz, rx * fy];
  const d = [p.x - f.pos.x, p.y - f.pos.y, p.z - f.pos.z];
  const ahead = d[0] * fx + d[1] * fy + d[2] * fz;
  const t = Math.tan((f.fov * Math.PI) / 360);
  return [(d[0] * rx + d[2] * rz) / ahead / (t * 16 / 9), (d[0] * ux + d[1] * uy + d[2] * uz) / ahead / t, ahead];
}

describe('a cutscene frames the horror as it is drawn', () => {
  it('knows every boss with reviewed art, and the ones whose capsule and picture differ most', () => {
    expect(BOSSES.length).toBeGreaterThan(40);
    const drawn = (id: string) => reviewedSpan(pack.entities[id], pack);
    const capsule = (id: string) => toCombatant(ENTITIES.find((d) => d.id === id)!).height;
    expect(drawn('haunter_of_the_dark').top).toBeLessThan(capsule('haunter_of_the_dark') * 0.7);
    expect(drawn('the_unnamable').top).toBeLessThan(capsule('the_unnamable') * 0.7);
    expect(drawn('the_hound').top).toBeGreaterThan(capsule('the_hound') * 1.25);
    for (const d of BOSSES) {
      const s = drawn(d.id);
      expect(s.top, d.id).toBeGreaterThan(s.bottom);
      expect(s.bottom, d.id).toBeGreaterThanOrEqual(0);
    }
  });

  it('aims every shot at the horror on its figure, and keeps that figure in the picture', () => {
    const far = 9;
    for (const def of BOSSES) {
      const drawn = reviewedSpan(pack.entities[def.id], pack);
      const hover = paramsOf(def.behavior).hover; // the Haunter is drawn two metres up
      const span = { bottom: drawn.bottom + hover, top: drawn.top + hover };
      const height = span.top - span.bottom;
      const scenes: Scene[] = [arrivalOf(def.id, def.name, EPITHETS[def.id]) ?? arrival(scaleOf(height), def.name, EPITHETS[def.id]), bespokeFall(def.id) || fall(scaleOf(height))];
      const radius = toCombatant(def).radius;
      const horror: Anchor = { x: 0, y: span.bottom, z: 0, yaw: 0, height };
      const me: Anchor = { x: 0, y: 0, z: far + radius, yaw: Math.PI, height: 1.8 };
      for (const scene of scenes) {
        let from = 0;
        scene.shots.forEach((sh, i) => {
          const aimed = sh.aim === 'other' ? sh.on === 'player' : sh.on === 'target';
          for (const u of [0, 0.5, 1]) {
            const f = frameOf(sh, u, sh.on === 'target' ? horror : me, sh.on === 'target' ? me : horror, from + u * sh.dur);
            const where = `${def.id} ${scene.id} shot ${i} at ${u}`;
            if (aimed && !LOOKS_AWAY.has(`${scene.id}#${i}`)) {
              expect(f.look.y, where).toBeLessThanOrEqual(span.top + 0.05);
              expect(f.look.y, where).toBeGreaterThanOrEqual(span.bottom - 0.05);
            }
            if (!aimed) continue;
            const [, top, ahead] = project(f, { x: 0, y: span.top, z: 0 });
            const [, bottom] = project(f, { x: 0, y: span.bottom, z: 0 });
            expect(ahead, where).toBeGreaterThan(0);
            expect((Math.min(top, 1) - Math.max(bottom, -1)) / (top - bottom), `${where}: on the screen`).toBeGreaterThan(0.25);
          }
          from += sh.dur;
        });
      }
    }
  });

  it('stands back from a coarse picture until no pixel of it covers more than its share of the picture', () => {
    const near: Frame = { pos: { x: 0, y: 3, z: 1.6 }, look: { x: 0, y: 3.5, z: 0 }, fov: 45, roll: 0 };
    const grain = 1.75 / 28; // the Haunter: twenty-eight painted rows
    const kept = keepGrain(near, grain);
    const d = Math.hypot(kept.pos.x - kept.look.x, kept.pos.y - kept.look.y, kept.pos.z - kept.look.z);
    expect(grain / (2 * d * Math.tan((45 * Math.PI) / 360))).toBeCloseTo(GRAIN, 5);
    expect(kept.look).toEqual(near.look); // it looks where it looked, from further back along the same line
    expect((kept.pos.z - kept.look.z) / (kept.pos.y - kept.look.y)).toBeCloseTo((near.pos.z - near.look.z) / (near.pos.y - near.look.y), 5);
    expect(keepGrain(near, 0.001)).toBe(near); // a fine picture: as the shot has it
    expect(keepGrain(near, undefined)).toBe(near);
  });

  it('sees past the investigator over their shoulder, unless it looks over their head', () => {
    const me: Anchor = { x: 0, y: 0, z: 0, yaw: 0, height: 1.8 };
    const passBeside = (f: Frame): number => { // how far the line of sight passes from the investigator's axis, in the ground's plane
      const [ax, az, bx, bz] = [f.pos.x, f.pos.z, f.look.x, f.look.z];
      return Math.abs(ax * (bz - az) - az * (bx - ax)) / Math.hypot(bx - ax, bz - az);
    };
    const behind = shot({ dur: 2, on: 'player', aim: 'other', yaw: to(180, 176), dist: to(2.2, 3), up: to(0.9, 1.6), look: to(0.4, 0.7) });
    const person: Anchor = { x: 0, y: 0, z: 9, yaw: Math.PI, height: 1.8 };
    for (const u of [0, 0.5, 1]) expect(passBeside(frameOf(behind, u, me, person, 0)), `at ${u}`).toBeGreaterThan(SHOULDER - 0.02);
    const giant: Anchor = { x: 0, y: 0, z: 20, yaw: Math.PI, height: 40 };
    const upward = shot({ dur: 2, on: 'player', aim: 'other', yaw: to(180, 180), dist: to(2.4, 2.4), up: to(1, 1), look: to(0.9, 0.9) });
    expect(passBeside(frameOf(upward, 0.5, me, giant, 0))).toBeLessThan(0.05); // its face is far over their head: straight behind them, as it was
  });

  it("frames a target by its drawing where there is one, and by its body where not", () => {
    vi.stubGlobal('addEventListener', vi.fn());
    vi.stubGlobal('document', { addEventListener: vi.fn() });
    const g = createGame();
    const e = spawnCreature(g, 'haunter_of_the_dark', { x: 0, z: 6, yaw: 0 })!;
    const ui: CinemaUi = { bars: vi.fn(), fade: vi.fn(), caption: vi.fn(), title: vi.fn(), hint: vi.fn(), clear: vi.fn(), wipe: vi.fn() };
    const make = (figure?: (id: number) => { bottom: number; top: number } | undefined) =>
      createCinema(g, ui, { stinger: vi.fn(), sample: vi.fn() } as never, { spawn: vi.fn() } as never, { enabled: () => true, figure });
    expect(make().heightOf(e)).toBe(g.ecs.c.body.get(e)!.height);
    expect(make(() => ({ bottom: 0.1, top: 1.9 })).heightOf(e)).toBeCloseTo(1.8);
    expect(make(() => undefined).heightOf(e)).toBe(g.ecs.c.body.get(e)!.height);
    vi.unstubAllGlobals();
  });
});
