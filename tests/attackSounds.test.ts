import { describe, expect, it } from 'vitest';
import type { V3 } from '../src/core/geom';
import { ATTACK_MIX, TIMBRE, arrive, burst, DARKNESS, depart, gather, GAZE_BURST, gazeTone, hum, landed, loosed, phase, summon, swing } from '../src/data/attackSounds';
import type { Sound } from '../src/data/sounds';
import { AOE_MOTIFS } from '../src/render/aoeLook';
import { createAttackAudio } from '../src/render/audio/attackAudio';
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

function listen(id: string, loaded = true) {
  const b = bossGame(id, undefined, 8);
  engage(b);
  calm(b);
  steps(b.g, 70);
  const samples: { set: string; at: V3 | null; gain: number }[] = [];
  createAttackAudio(b.g, (set, at, o) => (samples.push({ set, at, gain: o?.gain ?? 1 }), loaded));
  const act = b.g.ecs.c.actor.get(b.boss)!;
  const run = (frames: number): void => { steps(b.g, frames); };
  return { ...b, samples, act, run, heard: (set: string) => samples.filter((p) => p.set === set) };
}
const at: V3 = { x: 5, y: 1, z: 5 };

describe('recorded attack cues without caster blips', () => {
  it('a volley uses one recorded release and each real landing uses its element recording', () => {
    const w = listen('keziah_mason');
    const emit = (n: number): void => { for (let i = 0; i < n; i++) w.g.events.emit('BoltLoosed', { owner: w.boss, at, vel: { x: 1, y: 0, z: 0 }, fire: false, conjured: false }); };
    emit(5);
    expect(w.heard('atkFwoosh')).toHaveLength(1);
    expect(w.heard('atkFwoosh')[0]!.at).toEqual(at);
    steps(w.g, 10);
    emit(1);
    expect(w.heard('atkFwoosh')).toHaveLength(2);
    w.g.events.emit('BoltLoosed', { owner: w.boss, at, vel: { x: 1, y: 0, z: 0 }, fire: true, conjured: false });
    expect(w.heard('atkFwoosh')).toHaveLength(2);
    const land = (on: 'body' | 'ground' | 'wall' | 'spent') => w.g.events.emit('BoltLanded', { owner: w.boss, faction: 'enemy', at, vel: { x: 1, y: 0, z: 0 }, on, radius: 0.3, lob: false, fire: false, conjured: false });
    land('spent');
    expect(w.heard('atkFire')).toHaveLength(0);
    land('ground');
    land('body');
    expect(w.heard('atkFire')).toHaveLength(2);
    expect(w.heard('atkFire')[1]!.gain).toBeLessThan(w.heard('atkFire')[0]!.gain);
  });

  it('eruption and quake impacts stay recorded, and ordinary swings add no synthesized layer', () => {
    const w = listen('cthulhu');
    w.g.events.emit('Erupted', { at, radius: 2, by: w.boss });
    expect(w.samples.map((s) => s.set)).toEqual(['atkWater', 'boom']);
    expect(w.heard('atkWater')[0]!.at).toEqual(at);
    w.g.events.emit('Quaked', { at, by: w.boss });
    expect(w.heard('atkWater')).toHaveLength(2);
    const before = w.samples.length;
    w.g.events.emit('Swung', { entity: w.boss, at, yaw: 0 });
    expect(w.samples).toHaveLength(before);
  });

  it('teleports, summons, gaze, darkness and phase changes add no procedural attack cues', () => {
    const w = listen('keziah_mason');
    w.g.events.emit('Teleported', { entity: w.boss, from: at, to: { x: 20, y: 0, z: 20 } });
    w.g.events.emit('Summoned', { entity: w.boss, by: w.boss });
    w.g.events.emit('BossPhase', { entity: w.boss, phase: 1 });
    w.g.events.emit('GazeBurst', { sanity: 5, by: w.boss });
    w.g.events.emit('Darkened', { by: w.boss });
    expect(w.samples).toEqual([]);
  });

  it('caster wind-ups and sustained beams stay free of repeated tones', () => {
    const w = listen('edward_hutchinson');
    startMove(w.act, 'projectile');
    w.run(15);
    expect(w.samples).toEqual([]);
    w.run(105);
    expect(w.heard('atkFrostCast')).toHaveLength(1); // the frost caster's own throw (round 68)
    w.samples.length = 0;
    startMove(w.act, 'sweep_beam');
    w.run(150);
    expect(w.samples).toEqual([]);
  });

  it('unloaded recordings do not trigger extra fallback cues', () => {
    const w = listen('keziah_mason', false);
    w.g.events.emit('BoltLoosed', { owner: w.boss, at, vel: { x: 1, y: 0, z: 0 }, fire: false, conjured: false });
    expect(w.samples.map((s) => s.set)).toEqual(['atkFwoosh']);
  });
});
