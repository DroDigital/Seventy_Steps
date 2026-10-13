import { describe, expect, it } from 'vitest';
import { EPITHETS } from '../src/data/bossCards';
import { BESPOKE } from '../src/data/cutscenesBoss';
import { MORE, arrivalOf } from '../src/data/cutscenesMore';
import { getEntity } from '../src/data/registry';
import { SAMPLE_SETS } from '../src/data/samples';
import { STINGERS } from '../src/data/sounds';
import { bossLine } from '../src/data/speechLines';
import { speaking } from '../src/render/cinemaDirector';
import { frameOf, sceneLength, shotAt, type Anchor } from '../src/render/cinemaPlan';

const player: Anchor = { x: 0, y: 0, z: 0, yaw: 0, height: 1.8 };
const horror = (height: number): Anchor => ({ x: 0, y: 0, z: 9, yaw: Math.PI, height });
const ids = Object.keys(MORE);
const SPEAKERS = ['black_man', 'terrible_old_man', 'umr_at_tawil', 'medusa_gorgon', 'lilith'];
const arrival = (id: string, name = 'X') => arrivalOf(id, name, undefined)!;

describe('ten more arrivals of their own', () => {
  it('are for bosses in the roster that fight from a script, each with its card, and none that has one already', () => {
    expect(ids.length).toBe(10);
    for (const id of ids) {
      expect(getEntity(id)?.bossScript, id).toBeDefined();
      expect(EPITHETS[id], id).toBeTruthy();
      expect(Object.keys(BESPOKE), id).not.toContain(id);
      expect(arrival(id).id).toBe(`arrival:${id}`);
    }
    expect(arrivalOf('cthulhu', 'X', undefined)?.id).toBe('arrival:cthulhu'); // the first seventeen are still found
    expect(arrivalOf('deep_one', 'X', undefined)).toBeUndefined();
  });

  it('are made of shots that last, beats that fall inside them, and a name that comes up with time to be read', () => {
    for (const id of ids) {
      const s = arrival(id, 'Name');
      const len = sceneLength(s);
      expect(len, id).toBeGreaterThan(5);
      expect(len, id).toBeLessThan(13);
      for (const sh of s.shots) expect(sh.dur, id).toBeGreaterThan(0.5);
      for (const b of s.beats) {
        expect(b.at, `${id} beat`).toBeGreaterThanOrEqual(0);
        expect(b.at, `${id} beat`).toBeLessThan(len);
        if (b.caption) expect(b.caption.length, `${id} caption`).toBeLessThan(64);
        if (b.set) expect(SAMPLE_SETS, `${id} ${b.set}`).toHaveProperty(b.set);
        if (b.sound) expect(STINGERS, `${id} ${b.sound}`).toHaveProperty(b.sound);
      }
      const title = s.beats.filter((b) => b.title);
      expect(title.length, id).toBe(1);
      expect(title[0].title?.[0]).toBe('NAME');
      expect(len - title[0].at, `${id}: the name has time on the screen`).toBeGreaterThan(2.4);
    }
  });

  it('let the screen go clear again after anything it is taken to', () => {
    for (const id of ids) {
      const fades = arrival(id).beats.filter((b) => b.fade).sort((a, b) => a.at - b.at);
      if (fades.length) expect(fades[fades.length - 1].fade, id).toBe('clear');
    }
  });

  it('give a finite lens, looking at something, at every moment, whatever the size of the horror', () => {
    for (const id of ids) {
      const scene = arrival(id);
      for (const [h, other] of [[0.8, horror(0.8)], [4, horror(4)], [12, horror(12)]] as const) {
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

  it('leave those that speak to their own words, and give those that are silent two lines to read between the shots', () => {
    for (const id of ids) {
      const captions = arrival(id).beats.filter((b) => b.caption);
      if (SPEAKERS.includes(id)) {
        expect(bossLine(id, 'arrive'), id).toBeDefined();
        expect(captions, id).toEqual([]);
      } else {
        expect(bossLine(id, 'arrive'), id).toBeUndefined();
        expect(captions.length, id).toBeGreaterThanOrEqual(2);
        for (let i = 1; i < captions.length; i++) expect(captions[i].at - captions[i - 1].at, `${id}: a caption waits for the one before`).toBeGreaterThanOrEqual((captions[i - 1].hold ?? 3) - 0.9);
      }
    }
    expect(SPEAKERS.every((id) => ids.includes(id))).toBe(true);
  });

  it('take the horror\'s own words laid over them where it has any, as every arrival does', () => {
    for (const id of ids) {
      const base = arrival(id);
      const said = speaking(base, id, 'arrive');
      expect(sceneLength(said), id).toBeGreaterThanOrEqual(sceneLength(base));
      expect(said.beats.length, id).toBe(base.beats.length + (bossLine(id, 'arrive') ? 1 : 0));
    }
  });
});
