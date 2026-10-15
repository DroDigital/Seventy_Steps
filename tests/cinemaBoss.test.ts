import { describe, expect, it } from 'vitest';
import { EPITHETS } from '../src/data/bossCards';
import { BESPOKE, bespokeArrival } from '../src/data/cutscenesBoss';
import { getEntity } from '../src/data/registry';
import { SAMPLE_SETS } from '../src/data/samples';
import { STINGERS } from '../src/data/sounds';
import { bossLine } from '../src/data/speechLines';
import { speaking } from '../src/render/cinemaDirector';
import { frameOf, sceneLength, shotAt, type Anchor } from '../src/render/cinemaPlan';

const player: Anchor = { x: 0, y: 0, z: 0, yaw: 0, height: 1.8 };
const horror = (height: number): Anchor => ({ x: 0, y: 0, z: 9, yaw: Math.PI, height });

describe('the great horrors\' own arrivals (round 34)', () => {
  const ids = Object.keys(BESPOKE);

  it('are for bosses that are in the roster and fight from a script, each with its card', () => {
    expect(ids.length).toBe(17);
    for (const later of ['ghatanothoa', 'mother_hydra', 'colossus_pyramids', 'tsathoggua', 'yig', 'wilbur_whateley', 'joseph_curwen']) expect(ids, later).toContain(later);
    for (const id of ids) {
      expect(getEntity(id)?.bossScript, id).toBeDefined();
      expect(EPITHETS[id], id).toBeTruthy();
      expect(bespokeArrival(id, 'X', undefined)?.id).toBe(`arrival:${id}`);
    }
    expect(bespokeArrival('deep_one', 'X', undefined)).toBeUndefined();
  });

  it('are made of shots that last, beats that fall inside them, and a name that comes up with time to be read', () => {
    for (const id of ids) {
      const s = bespokeArrival(id, 'Name', 'Epithet')!;
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

  it('gives a finite lens, looking at something, at every moment, whatever the size of the horror', () => {
    for (const id of ids) {
      const scene = bespokeArrival(id, 'X', undefined)!;
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

  it('leave the horrors that speak (of the later seven) to their own words: no caption of the scene\'s to run over them', () => {
    for (const id of ['mother_hydra', 'tsathoggua', 'wilbur_whateley', 'joseph_curwen']) {
      expect(bossLine(id, 'arrive'), id).toBeDefined();
      expect(bespokeArrival(id, 'X', undefined)!.beats.filter((b) => b.caption), id).toEqual([]);
    }
  });

  it('give those that are silent their lines, kept short enough to read between the shots', () => {
    for (const id of ['ghatanothoa', 'colossus_pyramids', 'yig']) {
      expect(bossLine(id, 'arrive'), id).toBeUndefined();
      const captions = bespokeArrival(id, 'X', undefined)!.beats.filter((b) => b.caption);
      expect(captions.length, id).toBeGreaterThanOrEqual(2);
      for (let i = 1; i < captions.length; i++) expect(captions[i].at - captions[i - 1].at, `${id}: a caption waits for the one before`).toBeGreaterThanOrEqual((captions[i - 1].hold ?? 3) - 0.9);
    }
  });

  it('open on black, to be lifted from it, where the horror is met in the dark', () => {
    for (const id of ['colossus_pyramids', 'tsathoggua']) {
      const s = bespokeArrival(id, 'X', undefined)!;
      expect(s.dark, id).toBe(true);
      expect(s.blend?.[0], id).toBe(0);
      expect(s.beats.some((b) => b.fade === 'clear'), id).toBe(true);
    }
  });

  it('take the horror\'s own words laid over them where it has any, as every arrival does', () => {
    for (const id of ids) {
      const base = bespokeArrival(id, 'X', undefined)!;
      const said = speaking(base, id, 'arrive');
      expect(sceneLength(said), id).toBeGreaterThanOrEqual(sceneLength(base));
      expect(said.beats.length, id).toBeGreaterThanOrEqual(base.beats.length);
    }
  });
});
