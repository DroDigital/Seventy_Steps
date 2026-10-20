import { describe, expect, it, vi } from 'vitest';
import { BESPOKE } from '../src/data/cutscenesBoss';
import { FALLS, bespokeFall } from '../src/data/cutscenesFall';
import { SAMPLE_SETS } from '../src/data/samples';
import { STINGERS } from '../src/data/sounds';
import { bossLine } from '../src/data/speechLines';
import { createDirector, speaking } from '../src/render/cinemaDirector';
import { frameOf, sceneLength, shotAt, type Anchor } from '../src/render/cinemaPlan';
import { createGame } from '../src/systems/game';

const player: Anchor = { x: 0, y: 0, z: 0, yaw: 0, height: 1.8 };
const horror = (height: number): Anchor => ({ x: 0, y: 0, z: 9, yaw: Math.PI, height });
const ids = Object.keys(FALLS);
const SILENT = ['haunter_of_the_dark', 'colour_out_of_space', 'azathoth', 'ghatanothoa', 'colossus_pyramids', 'yig'];

describe('the great horrors\' own falls', () => {
  it('are for the seventeen that arrive in their own way, and no others', () => {
    expect(ids.sort()).toEqual(Object.keys(BESPOKE).sort());
    for (const id of ids) expect(bespokeFall(id)?.id).toBe(`fall:${id}`);
    expect(bespokeFall('deep_one')).toBeUndefined();
  });

  it('are slowed, shot for long enough to be read, with every beat inside them and only sounds the game has', () => {
    for (const id of ids) {
      const s = FALLS[id];
      const len = sceneLength(s);
      expect(s.sim, id).toBe('slow');
      expect(s.slow!, id).toBeGreaterThan(0.1);
      expect(s.slow!, id).toBeLessThan(0.4);
      expect(len, id).toBeGreaterThan(4.5);
      expect(len, id).toBeLessThan(10);
      for (const sh of s.shots) expect(sh.dur, id).toBeGreaterThan(0.5);
      for (const b of s.beats) {
        expect(b.at, `${id} beat`).toBeGreaterThanOrEqual(0);
        expect(b.at, `${id} beat`).toBeLessThan(len);
        expect(b.title, `${id}: no name is given on a fall`).toBeUndefined();
        if (b.caption) expect(b.caption.length, `${id} caption`).toBeLessThan(64);
        if (b.set) expect(SAMPLE_SETS, `${id} ${b.set}`).toHaveProperty(b.set);
        if (b.sound) expect(STINGERS, `${id} ${b.sound}`).toHaveProperty(b.sound);
      }
    }
  });

  it('let the screen go clear again: whatever it is taken to is lifted before the scene is over', () => {
    for (const id of ids) {
      const fades = FALLS[id].beats.filter((b) => b.fade).sort((a, b) => a.at - b.at);
      if (!fades.length) continue; // Azathoth: nothing is taken from the screen
      const last = fades[fades.length - 1];
      expect(last.fade, id).toBe('clear');
      expect(last.at + (last.over ?? 1), `${id}: clear by the scene's end`).toBeLessThanOrEqual(sceneLength(FALLS[id]) + 1e-9);
    }
  });

  it('give a finite lens, looking at something, at every moment, whatever the size of the horror', () => {
    for (const id of ids) {
      const scene = FALLS[id];
      for (const [h, other] of [[0.8, horror(0.8)], [12, horror(12)], [40, horror(40)]] as const) {
        for (let t = 0; t <= sceneLength(scene); t += 0.25) {
          const { shot, u } = shotAt(scene, t);
          const f = frameOf(shot, u, shot.on === 'target' ? horror(h) : player, shot.on === 'target' ? player : other, t);
          for (const n of [f.pos.x, f.pos.y, f.pos.z, f.look.x, f.look.y, f.look.z, f.fov, f.roll]) expect(Number.isFinite(n), `${id} at ${t}`).toBe(true);
          expect(f.fov, id).toBeGreaterThan(25);
          expect(f.fov, id).toBeLessThan(110);
          expect(Math.hypot(f.pos.x - f.look.x, f.pos.y - f.look.y, f.pos.z - f.look.z), id).toBeGreaterThan(0.2);
        }
      }
    }
  });

  it('leave those that speak to their own last words, and give those that are silent one line of their own', () => {
    for (const id of ids) {
      const captions = FALLS[id].beats.filter((b) => b.caption);
      if (SILENT.includes(id)) {
        expect(bossLine(id, 'fall'), id).toBeUndefined();
        expect(captions.length, id).toBe(1);
      } else {
        expect(bossLine(id, 'fall'), id).toBeDefined();
        expect(captions, id).toEqual([]);
      }
    }
  });

  it('take the horror\'s last words laid over them, the last shot held until they are said', () => {
    for (const id of ids) {
      const base = FALLS[id];
      const said = speaking(base, id, 'fall');
      expect(sceneLength(said), id).toBeGreaterThanOrEqual(sceneLength(base));
      expect(said.beats.length, id).toBe(base.beats.length + (bossLine(id, 'fall') ? 1 : 0));
    }
  });

  it('are played by the director in place of the size\'s fall, for the horror that has one', () => {
    for (const [creature, expected] of [['cthulhu', 'fall:cthulhu'], ['black_man', 'fall:person']] as const) {
      const g = createGame({ creature });
      const play = vi.fn(() => Promise.resolve());
      createDirector(g, { play, active: false, heightOf: (e: number) => g.ecs.c.body.get(e)?.height ?? 2 } as never, () => undefined);
      const [e] = [...g.ecs.c.fight.keys()];
      g.events.emit('Vanquished', { entity: e, name: 'X' });
      expect((play.mock.calls[0] as unknown[])[0], creature).toMatchObject({ id: expected });
    }
  });
});
