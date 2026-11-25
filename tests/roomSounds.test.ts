import { describe, expect, it } from 'vitest';
import { ROOM_MIX, ROOM_SOUNDS, type RoomSoundId } from '../src/data/roomSounds';
import { STINGERS, type Sound } from '../src/data/sounds';
import { FAR } from '../src/data/ambienceSounds';
import { RATE, render } from './soundRender';

const audible = (hz: number | undefined): boolean => hz === undefined || (hz >= 20 && hz <= 20000);

/** What would keep a recipe from playing as written: every layer playable and bounded (as tests/ambienceHours.test.ts asks of the far voices). */
function problems(sound: Sound): string[] {
  const out: string[] = [];
  if (sound.length === 0) out.push('no layers');
  sound.forEach((l, i) => {
    const bad = (why: string): number => out.push(`layer ${i}: ${why}`);
    if (l.src !== 'noise' && (!audible(l.hz) || l.hz === undefined)) bad(`pitch ${l.hz}`);
    if (l.src === 'noise' && !l.filter) bad('noise needs a filter');
    if (!audible(l.to)) bad(`glide to ${l.to}`);
    if (!(l.dur > 0 && l.dur <= 4)) bad(`duration ${l.dur}`);
    if (!((l.at ?? 0) >= 0 && (l.at ?? 0) < 3)) bad(`start ${l.at}`);
    if (!(l.gain > 0 && l.gain <= 1)) bad(`gain ${l.gain}`);
    if ((l.attack ?? 0) < 0 || (l.attack ?? 0) > l.dur) bad(`attack ${l.attack}`);
    if (l.filter && (!audible(l.filter.hz) || !audible(l.filter.to) || (l.filter.q ?? 1) <= 0)) bad('filter out of range');
  });
  return out;
}

/** The share of a rendered sound's energy above `hz`, by a one-pole split (enough to tell a bright thing from a dark one). */
function above(samples: Float32Array, hz: number): number {
  const k = 1 - Math.exp((-2 * Math.PI * hz) / RATE);
  let [low, eLow, eAll] = [0, 0, 0];
  for (const x of samples) {
    low += k * (x - low);
    eLow += low * low;
    eAll += x * x;
  }
  return Math.max(0, 1 - eLow / Math.max(eAll, 1e-12));
}

describe('what is heard now and then inside (round 124, data/roomSounds.ts)', () => {
  const ids = Object.keys(ROOM_SOUNDS) as RoomSoundId[];

  it('every one is a playable recipe, short, soft and alike in level; none is a cue or a far voice the game already has', () => {
    expect(Object.keys(ROOM_MIX).sort()).toEqual([...ids].sort());
    expect(ids.length).toBeGreaterThanOrEqual(12);
    for (const id of ids) {
      expect(problems(ROOM_SOUNDS[id]), id).toEqual([]);
      expect(id in STINGERS || id in FAR, id).toBe(false);
      const r = render(ROOM_SOUNDS[id]);
      expect(r.samples.every(Number.isFinite), id).toBe(true);
      expect(r.rms, id).toBeGreaterThan(-31.5); // (ROOM_MIX levels them: about -30 dBFS)
      expect(r.rms, id).toBeLessThan(-28.5);
      expect(r.peak, id).toBeLessThan(-8);
      expect(r.sec, id).toBeLessThan(3);
    }
  });

  it('each is what it is named: a drop and a clink bright and brief, a thud, a swell and the pump low, a draught long', () => {
    const r = (id: RoomSoundId) => render(ROOM_SOUNDS[id]);
    expect(r('drop').sec).toBeLessThan(0.4);
    expect(above(r('drop').samples, 600)).toBeGreaterThan(0.6);
    expect(above(r('clink').samples, 1500)).toBeGreaterThan(0.6);
    for (const id of ['thud', 'swell', 'pump'] as const) expect(above(r(id).samples, 300), id).toBeLessThan(0.3);
    expect(r('draught').sec).toBeGreaterThan(2);
    const strokes = new Set(ROOM_SOUNDS.pump.filter((l) => l.src === 'sine').map((l) => l.at ?? 0));
    expect(strokes.size).toBeGreaterThanOrEqual(3); // (a machine's strokes, not one thump)
    const ticks = ROOM_SOUNDS.skitter.filter((l) => l.src === 'noise' && l.dur < 0.02).map((l) => l.at ?? 0).sort((a, b) => a - b);
    const gaps = ticks.slice(1).map((t, i) => t - ticks[i]!);
    expect(Math.max(...gaps)).toBeGreaterThan(0.15); // (two runs of claws with a pause between)
  });

  it('a drop carries its own faint answer (the bed\'s share of the room\'s reverb is small), later and much softer than it', () => {
    const plinks = ROOM_SOUNDS.drop.filter((l) => l.src === 'sine');
    const first = plinks.filter((l) => (l.at ?? 0) < 0.1);
    const answer = plinks.filter((l) => (l.at ?? 0) >= 0.1);
    expect(answer.length).toBe(first.length);
    answer.forEach((l, i) => {
      expect(l.gain).toBeLessThan(first[i]!.gain * 0.5);
      expect(l.hz).toBe(first[i]!.hz);
    });
  });
});
