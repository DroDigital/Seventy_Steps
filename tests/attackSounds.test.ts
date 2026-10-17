import { describe, expect, it } from 'vitest';
import type { V3 } from '../src/core/geom';
import { ATTACK_MIX, TIMBRE, arrive, burst, DARKNESS, depart, gather, GAZE_BURST, gazeTone, hum, landed, loosed, phase, summon, swing } from '../src/data/attackSounds';
import type { Sound } from '../src/data/sounds';
import { AOE_MOTIFS } from '../src/render/aoeLook';
import { createAttackAudio } from '../src/render/audio/attackAudio';
import { lookOf } from '../src/render/attackLook';
import { startMove } from '../src/systems/actions';
import { bossGame, calm, engage } from './bossHelpers';
import { steps } from './helpers';
import { render } from './soundRender';

const heard = (sound: Sound, gain: number) => render(sound.map((l) => ({ ...l, gain: l.gain * gain })));

describe('a horror\'s blows, heard (round 51)', () => {
  it('every blow of every element is as present as a landed blow, never over full scale by much, and brief', () => {
    for (const motif of AOE_MOTIFS) {
      const t = TIMBRE[motif];
      const shots: [string, Sound, number][] = [
        ['loosed', loosed(t), ATTACK_MIX.loosed], ['landed small', landed(t, 0.1), ATTACK_MIX.landed], ['landed big', landed(t, 1), ATTACK_MIX.landed],
        ['burst', burst(t, 0.3), ATTACK_MIX.burst], ['burst big', burst(t, 1), ATTACK_MIX.burst], ['summon', summon(t), ATTACK_MIX.summon],
        ['arrive', arrive(t), ATTACK_MIX.arrive], ['depart', depart(t), ATTACK_MIX.depart], ['phase', phase(t), ATTACK_MIX.phase], ['swing', swing(t, 0.5), ATTACK_MIX.swing],
      ];
      for (const [name, sound, gain] of shots) {
        const r = heard(sound, gain);
        expect(r.rms, `${motif} ${name}`).toBeGreaterThan(-26);
        expect(r.rms, `${motif} ${name}`).toBeLessThan(-12);
        expect(r.peak, `${motif} ${name}`).toBeLessThan(2);
        expect(r.sec, `${motif} ${name}`).toBeLessThan(1.3);
      }
      const gathering = heard(gather(t, 28 / 60), ATTACK_MIX.gather);
      expect(gathering.rms, `${motif} gather`).toBeGreaterThan(-28);
      expect(gathering.rms, `${motif} gather`).toBeLessThan(-16);
      for (const kind of ['beam', 'vortex'] as const) { // kept up, under everything else
        const r = heard(hum(t, kind), ATTACK_MIX.hum);
        expect(r.rms, `${motif} ${kind}`).toBeGreaterThan(-34);
        expect(r.rms, `${motif} ${kind}`).toBeLessThan(-20);
      }
    }
    for (const [name, sound, gain] of [['gaze burst', GAZE_BURST, ATTACK_MIX.gazeBurst], ['darkness', DARKNESS, ATTACK_MIX.dark]] as const) {
      const r = heard(sound, gain);
      expect(r.rms, name).toBeGreaterThan(-24);
      expect(r.rms, name).toBeLessThan(-12);
      expect(r.peak, name).toBeLessThan(2);
    }
    for (const level of [0, 1]) expect(heard(gazeTone(level), ATTACK_MIX.gaze).rms).toBeGreaterThan(-32);
  });

  it('the elements do not sound alike', () => {
    const landings = new Set(AOE_MOTIFS.map((m) => JSON.stringify(landed(TIMBRE[m], 0.5))));
    expect(landings.size).toBe(AOE_MOTIFS.length);
    const grains = AOE_MOTIFS.map((m) => heard(landed(TIMBRE[m], 0.5), 1).rms);
    expect(Math.max(...grains) - Math.min(...grains)).toBeGreaterThan(0.5);
  });
});

function listen(id: string) {
  const b = bossGame(id, undefined, 8);
  engage(b);
  calm(b);
  steps(b.g, 70); // the move the engagement began has ended
  const plays: { key: string; at: V3 | null | undefined; gain: number; pitch?: number }[] = [];
  const samples: string[] = [];
  const audio = createAttackAudio(b.g, (key, _sound, o) => (plays.push({ key, at: o?.at, gain: o?.gain ?? 1, pitch: o?.pitch }), true), (set) => (samples.push(set), true));
  const act = b.g.ecs.c.actor.get(b.boss)!;
  const run = (frames: number): void => {
    for (let i = 0; i < frames; i++) {
      steps(b.g, 1);
      audio.update(1 / 60);
    }
  };
  plays.length = 0;
  return { ...b, plays, samples, act, run, keys: (prefix: string) => plays.filter((p) => p.key.startsWith(prefix)) };
}
const at: V3 = { x: 5, y: 1, z: 5 };

describe('a horror\'s blows are heard where they happen (round 51)', () => {
  it('a volley is one sound leaving and each landing is heard in the horror\'s element; a bolt that gave out is not', () => {
    const w = listen('keziah_mason'); // fire
    const emit = (n: number): void => { for (let i = 0; i < n; i++) w.g.events.emit('BoltLoosed', { owner: w.boss, at, vel: { x: 1, y: 0, z: 0 }, fire: false, conjured: false }); };
    emit(5);
    expect(w.keys('atk:loose:')).toHaveLength(1);
    expect(w.keys('atk:loose:')[0]!.key).toBe('atk:loose:flame');
    steps(w.g, 10);
    emit(1);
    expect(w.keys('atk:loose:')).toHaveLength(2);
    w.g.events.emit('BoltLoosed', { owner: w.boss, at, vel: { x: 1, y: 0, z: 0 }, fire: true, conjured: false }); // a flask: its own sound is elsewhere
    expect(w.keys('atk:loose:')).toHaveLength(2);
    const land = (on: 'body' | 'ground' | 'wall' | 'spent') => w.g.events.emit('BoltLanded', { owner: w.boss, at, vel: { x: 1, y: 0, z: 0 }, on, radius: 0.3, lob: false, fire: false, conjured: false });
    land('spent');
    expect(w.keys('atk:land:')).toHaveLength(0);
    land('ground');
    land('body');
    expect(w.keys('atk:land:').map((p) => p.key)).toEqual(['atk:land:flame', 'atk:land:flame']);
    expect(w.keys('atk:land:')[1]!.gain).toBeLessThan(w.keys('atk:land:')[0]!.gain); // struck flesh: the wound is the loud part
  });

  it('a burst is placed where it bursts and boomed; a slam of a horror is heard, an ordinary foe\'s is not', () => {
    const w = listen('cthulhu'); // the sea
    w.g.events.emit('Erupted', { at, radius: 2, by: w.boss });
    expect(w.keys('atk:burst:tide')).toHaveLength(1);
    expect(w.keys('atk:burst:tide')[0]!.at).toEqual(at);
    expect(w.keys('atk:burst:tide')[0]!.pitch).toBeCloseTo(lookOf('cthulhu').pitch, 5); // each horror's own pitch
    expect(w.samples).toEqual(['boom']);
    w.g.events.emit('Swung', { entity: w.boss, at, yaw: 0 });
    expect(w.plays.length).toBeGreaterThanOrEqual(2);
    const [other] = [...w.g.ecs.c.combatant.keys()].filter((id) => id !== w.boss && id !== w.g.player.id && !w.g.ecs.c.fight.has(id));
    const before = w.plays.length;
    w.g.events.emit('Swung', { entity: other!, at, yaw: 0 });
    expect(w.plays.length).toBe(before);
  });

  it('a summoning, an arrival, a phase change, a gaze and the dark each sound; a teleport is two sounds in two places', () => {
    const w = listen('keziah_mason');
    const there: V3 = { x: 20, y: 0, z: 20 };
    w.g.events.emit('Teleported', { entity: w.boss, from: at, to: there });
    expect(w.keys('atk:depart:')[0]!.at).toEqual(at);
    expect(w.keys('atk:arrive:')[0]!.at).toEqual(there);
    w.g.events.emit('BossPhase', { entity: w.boss, phase: 1 });
    w.g.events.emit('BossPhase', { entity: w.boss, phase: 0 });
    expect(w.keys('atk:phase:')).toHaveLength(1);
    w.g.events.emit('GazeBurst', { sanity: 5, by: w.boss });
    w.g.events.emit('Darkened', { by: w.boss });
    expect(w.keys('atk:gaze')).toHaveLength(1);
    expect(w.keys('atk:dark')).toHaveLength(1);
    expect(w.keys('atk:gaze')[0]!.at).toBeUndefined(); // in the head
  });

  it('the gathering before a caster\'s blow is heard once, as it begins; a beam hums while it sweeps and not after', () => {
    const w = listen('edward_hutchinson'); // frost
    startMove(w.act, 'projectile');
    w.run(120);
    expect(w.keys('atk:gather:frost')).toHaveLength(1);
    w.plays.length = 0;
    startMove(w.act, 'sweep_beam');
    w.run(150);
    const breaths = w.keys('atk:hum:beam').length;
    expect(breaths).toBeGreaterThanOrEqual(2);
    expect(breaths).toBeLessThanOrEqual(8);
    w.plays.length = 0;
    w.run(120);
    expect(w.keys('atk:hum:')).toHaveLength(0);
  });
});
