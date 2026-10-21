import { describe, expect, it } from 'vitest';
import { EPITHETS } from '../src/data/bossCards';
import { DEEP } from '../src/data/cutscenesDeep';
import { arrivalOf } from '../src/data/cutscenesMore';
import { REST } from '../src/data/cutscenesRest';
import { worldLayout } from '../src/world/placements';
import { SAMPLE_SETS } from '../src/data/samples';
import { STINGERS } from '../src/data/sounds';
import { bossLine } from '../src/data/speechLines';
import { frameOf, sceneLength, shotAt, type Anchor } from '../src/render/cinemaPlan';

const player: Anchor = { x: 0, y: 0, z: 0, yaw: 0, height: 1.8 };
const horror = (height: number): Anchor => ({ x: 0, y: 0, z: 9, yaw: Math.PI, height });
const ALL = { ...REST, ...DEEP };
const ids = Object.keys(ALL);
const arrival = (id: string, name = 'X') => arrivalOf(id, name, undefined)!;
/** What they have that those of data/cutscenesBoss.ts and cutscenesMore.ts do not: the horrors that still arrived by their size alone (round 61). */
const NOT_ARRIVED_FOR = ['brown_jenkin', 'curwen_pit_thing', 'dunwich_horror', 'voice_in_the_tomb']; // one that joins another's fight, one that is not yet seen, one without a script of its own, one that speaks without a fight

describe('the entrances of the horrors that arrived by their size alone (round 61)', () => {
  it('are for the bosses the world raises, and found by arrivalOf', () => {
    expect(ids.length).toBe(20);
    const bosses = new Set(worldLayout().spawns.filter((s) => s.id.startsWith('boss:')).map((s) => s.entity)); // (the Shoggoth and the Polyp fight as bosses by their variant, not a script of their own)
    for (const id of ids) {
      expect(bosses.has(id), id).toBe(true);
      expect(arrival(id).id).toBe(`arrival:${id}`);
    }
    expect(Object.keys(REST).filter((id) => id in DEEP)).toEqual([]);
  });

  it('leave no horror that fights from a script and is seen to arrive by its size alone', () => {
    const left = Object.keys(Object.fromEntries(
      ['dr_munoz', 'charles_le_sorcier', 'the_unnamable', 'martins_beach_horror', 'ephraim_waite', 'simon_orne', 'edward_hutchinson', 'shunned_house_entity', 'whisperer', 'shoggoth', 'flying_polyp', 'nug', 'yeb', 'bokrug', 'other_gods', 'great_ones', 'hypnos', 'zkauba', 'daemon_pipers', 'ancient_ones'].map((id) => [id, 1]),
    )).filter((id) => !arrivalOf(id, 'X', EPITHETS[id]));
    expect(left).toEqual([]);
    for (const id of NOT_ARRIVED_FOR) expect(ids, id).not.toContain(id);
  });

  it('are made of shots that last, beats that fall inside them, sounds that exist, and a name that comes up with time to be read', () => {
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

  it('each have an effect of their own: a fade, a burst or a stinger the others of their kind do not repeat wholesale', () => {
    const marks = ids.map((id) => {
      const beats = arrival(id).beats;
      return JSON.stringify([beats.filter((b) => b.burst).map((b) => b.burst!.kind), beats.filter((b) => b.fade).map((b) => b.fade), beats.filter((b) => b.set || b.sound).map((b) => b.set ?? b.sound)]);
    });
    expect(new Set(marks).size).toBe(ids.length);
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
      if (bossLine(id, 'arrive')) expect(captions, id).toEqual([]);
      else {
        expect(captions.length, id).toBeGreaterThanOrEqual(2);
        for (let i = 1; i < captions.length; i++) expect(captions[i].at - captions[i - 1].at, `${id}: a caption waits for the one before`).toBeGreaterThanOrEqual((captions[i - 1].hold ?? 3) - 0.9);
      }
    }
  });
});
