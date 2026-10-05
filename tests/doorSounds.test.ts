import { describe, expect, it } from 'vitest';
import { DOOR_LOOKS, type DoorKind } from '../src/data/doors';
import { DOOR_GAIN, doorSound, materialOf, type DoorMaterial } from '../src/data/doorSounds';
import { DOOR_KINDS } from '../src/render/doorViews';
import { RATE, render } from './soundRender';

const seeded = (n: number): (() => number) => {
  let s = n;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
};
const looks = Object.entries(DOOR_LOOKS).map(([kit, look]) => ({ kit, look: look! }));
const scale = (sound: ReturnType<typeof doorSound>['sound'], m: DoorMaterial) => sound.map((l) => ({ ...l, gain: l.gain * DOOR_GAIN[m] }));

/** When the loudest 20 ms of a rendered sound is. */
function loudestAt(samples: Float32Array): number {
  const win = Math.round(RATE * 0.02);
  let [best, at] = [0, 0];
  for (let w = 0; w + win <= samples.length; w += win) {
    let e = 0;
    for (let i = w; i < w + win; i++) e += samples[i] * samples[i];
    if (e > best) [best, at] = [e, w / RATE];
  }
  return at;
}

describe('the doors sound as they move (round 40)', () => {
  it('knows every door by what it is made of', () => {
    const made = new Set(looks.map(({ look }) => materialOf(look)));
    for (const m of ['oak', 'lacquer', 'bronze', 'iron', 'timber', 'stone', 'grind', 'flesh', 'cloth'] as const) expect(made.has(m), m).toBe(true);
    expect(materialOf(DOOR_LOOKS.cyclopean!)).toBe('grind'); // R'lyeh's slab slides: it grinds
    expect(materialOf(DOOR_LOOKS.mine!)).toBe('timber'); // a timber-and-strap gate
    expect(materialOf(DOOR_LOOKS.brick!)).toBe('iron'); // rusted bars
    expect(materialOf(DOOR_LOOKS.marble!)).toBe('lacquer');
    expect(materialOf(DOOR_LOOKS.tsath!)).toBe('bronze');
  });

  it('lasts as long as the swing it goes with, and its stop lands as the swing ends', () => {
    for (const { kit, look } of looks) {
      const full = DOOR_KINDS[look.kind as DoorKind].seconds;
      for (const closing of [false, true]) {
        for (const swing of [full, full * 0.65]) {
          const d = doorSound(look, swing, closing, seeded(3));
          const r = render(scale(d.sound, materialOf(look)));
          const where = `${kit} ${closing ? 'closing' : 'opening'} ${swing.toFixed(2)} s`;
          expect(r.sec, where).toBeGreaterThan(swing * 0.5);
          expect(r.sec, where).toBeLessThan(swing + d.tail + 0.3);
          if (closing && materialOf(look) !== 'cloth') expect(loudestAt(r.samples), `${where}: a door shut is loudest at its stop`).toBeGreaterThan(swing - 0.25); // (a door let swing open may be loudest in its grinding; a drape has no stop: it is drawn and falls still)
          expect(loudestAt(r.samples), where).toBeLessThan(swing + 0.4);
          for (const l of d.sound) expect((l.at ?? 0) + l.dur, `${where}: a layer past its tail`).toBeLessThan(swing + d.tail + 0.45);
          for (const u of d.under) expect(u.at, `${where}: a recording starts before the stop`).toBeGreaterThan(swing - 0.15);
        }
      }
    }
  });

  it('is in the loudness of a door in the room, a closing door the louder, and never over a peak of −3 dBFS', () => {
    for (const { kit, look } of looks) {
      const m = materialOf(look);
      const swing = DOOR_KINDS[look.kind as DoorKind].seconds;
      const levels = [false, true].map((closing) => render(scale(doorSound(look, swing, closing, seeded(9)).sound, m)));
      const [open, shut] = levels;
      const [lo, hi] = m === 'cloth' ? [-37, -27] : [-35, -19];
      expect(open.rms, `${kit} opening`).toBeGreaterThan(lo);
      expect(open.rms, `${kit} opening`).toBeLessThan(hi - 3);
      expect(shut.rms, `${kit} closing`).toBeGreaterThan(lo + 2);
      expect(shut.rms, `${kit} closing`).toBeLessThan(hi);
      if (m !== 'cloth') expect(shut.rms, `${kit}: shut louder than opened`).toBeGreaterThan(open.rms + 0.5);
      for (const r of levels) expect(r.peak, kit).toBeLessThan(-3);
    }
  });

  it('is heavier the heavier the door: stone over oak over a drape', () => {
    const rms = (kit: string): number => {
      const look = DOOR_LOOKS[kit as keyof typeof DOOR_LOOKS]!;
      return render(scale(doorSound(look, DOOR_KINDS[look.kind as DoorKind].seconds, true, seeded(5)).sound, materialOf(look))).rms;
    };
    expect(rms('masonry')).toBeGreaterThan(rms('library') - 4);
    expect(rms('library')).toBeGreaterThan(rms('dream') + 4);
  });

  it('is never the same twice: another door, or the same door again, is drawn anew', () => {
    const look = DOOR_LOOKS.library!;
    const rand = seeded(11);
    const a = doorSound(look, 0.8, false, rand).sound;
    const b = doorSound(look, 0.8, false, rand).sound;
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
    const [ra, rb] = [render(a), render(b)];
    let diff = 0;
    for (let i = 0; i < Math.min(ra.samples.length, rb.samples.length); i++) diff += Math.abs(ra.samples[i] - rb.samples[i]);
    expect(diff / ra.samples.length).toBeGreaterThan(1e-4);
    expect(JSON.stringify(doorSound(look, 0.8, false, seeded(4)).sound)).toBe(JSON.stringify(doorSound(look, 0.8, false, seeded(4)).sound)); // (but the same draw is the same sound)
  });

  it('lays recordings only where they belong: wood on a thud, iron on a clang, stone on a boom, and a drape on none', () => {
    const set = (kit: string): string[] => doorSound(DOOR_LOOKS[kit as keyof typeof DOOR_LOOKS]!, 1, true, seeded(2)).under.map((u) => u.set);
    expect(set('library')).toEqual(['thud']);
    expect(set('brick')).toEqual(['clang']);
    expect(set('masonry')).toEqual(['boom']);
    expect(set('fungoid')).toEqual(['flesh']);
    expect(set('dream')).toEqual([]);
  });
});
