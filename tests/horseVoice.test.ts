import { describe, expect, it, vi } from 'vitest';
import { MOUNT_TRAVERSAL, type MountId } from '../src/data/mounts';
import { PLANNED } from '../src/data/plannedSounds';
import { RECORDED_FOR, SAMPLE_SETS } from '../src/data/samples';
import type { Sound } from '../src/data/sounds';
import { createMountAudio } from '../src/render/audio/mountAudio';
import type { Sampler } from '../src/render/audio/sampler';
import { createGame } from '../src/systems/game';
import { cyclesFor } from '../src/systems/mountGait';

/** The horse called and standing, heard (round 59: its voice and harness are recordings, data/plannedSounds.ts). */
interface Heard { key: string; sound: Sound; gain: number; at: number }

function ride(id: MountId) {
  const g = createGame();
  Object.assign(g.player.mount, { selected: id, active: id, automobileOwned: true, chariotOwned: true, speed: 0, phase: 0 });
  const heard: Heard[] = [];
  const stepped: unknown[] = [];
  let frame = 0;
  const audio = createMountAudio(
    g,
    (key, sound, o) => (heard.push({ key, sound, gain: o?.gain ?? 1, at: frame / 60 }), true),
    { play: (set: unknown) => (stepped.push(set), true) } as unknown as Pick<Sampler, 'play'>,
    { set: () => undefined },
  );
  const mount = g.player.mount;
  audio.update(1 / 60);
  const advance = (frames: number, speed = 0): void => {
    for (let i = 0; i < frames; i++) {
      frame++;
      mount.speed = speed;
      mount.phase += cyclesFor(speed / 60, speed);
      audio.update(1 / 60);
    }
  };
  return { heard, stepped, mount, advance };
}
const ARRIVAL = /:(settle|stamp|greet)$/;

describe('a called horse arrives (round 59)', () => {
  it('whinnies, shifts under the harness as the rider takes its weight, plants a hoof, and whickers low once it has settled: once each, in that order, within the first three seconds', () => {
    const r = ride('grey');
    expect(r.heard.map((h) => h.key)).toEqual(['mount:grey:summon']); // the call itself is at once
    r.heard.length = 0;
    r.advance(60 * 4, 0);
    const arrival = r.heard.filter((h) => ARRIVAL.test(h.key));
    expect(arrival.map((h) => h.key)).toEqual(['mount:grey:settle', 'mount:grey:stamp', 'mount:grey:greet']);
    const [settle, stamp, greet] = arrival.map((h) => h.at);
    expect(settle).toBeGreaterThan(0.15);
    expect(settle).toBeLessThan(0.45);
    expect(stamp).toBeGreaterThan(0.8);
    expect(stamp).toBeLessThan(1.3);
    expect(greet).toBeGreaterThan(1.8);
    expect(greet).toBeLessThan(2.7);
    expect(r.heard.every((h) => !h.key.includes(':hoof:'))).toBe(true); // (a standing horse is without hoofbeats: the stamp is its own)
    expect(r.stepped).toHaveLength(1); // and the planted hoof has the recorded footfall beneath it, once
    expect(Object.values(SAMPLE_SETS)).toContain(r.stepped[0]);
  });

  it('only the included horse: the skeletons and the car have their own summons and no hoof, harness or whicker of a living horse', () => {
    for (const id of ['chariot', 'automobile'] as const) {
      const r = ride(id);
      r.heard.length = 0;
      r.advance(60 * 4, 0);
      expect(r.heard.filter((h) => ARRIVAL.test(h.key)), id).toEqual([]);
      expect(r.stepped, id).toEqual([]);
    }
  });

  it('a long gap or a second summon brings no late arrival: what was begun and not heard is not played after', () => {
    const r = ride('grey');
    r.heard.length = 0;
    r.advance(10, 0);
    r.mount.active = null;
    r.advance(1, 0); // dismissed a moment after the call
    r.heard.length = 0;
    r.advance(60 * 4, 0);
    expect(r.heard.filter((h) => ARRIVAL.test(h.key))).toEqual([]);
  });
});

describe('a horse standing at its harness (round 59)', () => {
  it('sometimes raises its head after a breath out, and the harness answers a moment later; never a shake straight after a shake, nor the same noise twice running', () => {
    let tosses = 0, all = 0;
    for (const seed of [11, 12, 13, 14, 15, 16]) { // (the order of its noises is a matter of chance: six rounds of it, each the same every run)
      const random = vi.spyOn(Math, 'random').mockImplementation(((state) => () => { state = (state * 1664525 + 1013904223) >>> 0; return state / 4294967296; })(seed));
      const r = ride('grey');
      r.heard.length = 0;
      r.advance(60 * 60 * 20, 0); // twenty minutes
      random.mockRestore();
      const noises = r.heard.filter((h) => /:(blow|whicker|shake|swish|flutter|snort|toss)$/.test(h.key));
      all += noises.length;
      noises.forEach((h, i) => {
        if (h.key !== 'mount:grey:toss') return;
        tosses++;
        expect(noises[i - 1].key, `before the toss at ${h.at.toFixed(1)} s (seed ${seed})`).toMatch(/:(blow|snort)$/);
        expect(h.at - noises[i - 1].at).toBeGreaterThan(0.25);
        expect(h.at - noises[i - 1].at).toBeLessThan(0.55);
        if (noises[i + 1]) expect(noises[i + 1].key, `after the toss at ${h.at.toFixed(1)} s (seed ${seed})`).not.toBe('mount:grey:shake');
      });
      const rounds = noises.filter((h) => h.key !== 'mount:grey:toss'); // the round of noises, with the tosses that answer some of them left out of it
      for (let i = 1; i < rounds.length; i++) expect(rounds[i].key, `at ${rounds[i].at.toFixed(1)} s (seed ${seed})`).not.toBe(rounds[i - 1].key); // (a toss between two is not a reason to repeat)
    }
    expect(tosses).toBeGreaterThan(20);
    expect(tosses).toBeLessThan(all / 3);
  });

  it('a horse that is called, ridden, slapped and hauled up plays every recipe that a recording stands in front of, and each recording has its recipe to fall back on', () => {
    const r = ride('grey');
    r.advance(60 * 60 * 10, 0); // ten minutes at its harness
    for (let i = 0; i < 30; i++) { r.mount.reins.struck++; r.advance(60, 0); } // slapped: it answers now and then
    r.mount.reins.halts++;
    r.mount.reins.haltSpeed = MOUNT_TRAVERSAL.gallop;
    r.advance(60, 0);
    r.advance(60 * 20, MOUNT_TRAVERSAL.gallop); // and a gallop: its snort
    const heard = new Set(r.heard.map((h) => h.key));
    const recorded = Object.keys(RECORDED_FOR).filter((k) => k.startsWith('mount:'));
    expect(recorded.length).toBe(PLANNED.filter((p) => p.for[0].startsWith('mount:')).reduce((n, p) => n + p.for.length, 0));
    for (const key of recorded) expect(heard.has(key), `${key} is never played by the ride`).toBe(true);
    for (const h of r.heard) if (RECORDED_FOR[h.key]) expect(h.sound.length, h.key).toBeGreaterThan(0); // (the recipe is there to play where the file has not loaded)
  });
});
