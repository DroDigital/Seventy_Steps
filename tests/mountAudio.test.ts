import { describe, expect, it, vi } from 'vitest';
import type { Sound } from '../src/data/sounds';
import { createFoley } from '../src/render/audio/foley';
import { createMountAudio } from '../src/render/audio/mountAudio';
import type { Sampler } from '../src/render/audio/sampler';
import { createGame } from '../src/systems/game';
import { render } from './soundRender';

function ride(id: 'chariot' | 'automobile') {
  const g = createGame();
  Object.assign(g.player.mount, { selected: id, active: id, automobileOwned: true, speed: 16, phase: 0 });
  const heard: { key: string; sound: Sound; gain: number }[] = [];
  const audio = createMountAudio(g, (key, sound, o) => (heard.push({ key, sound, gain: o?.gain ?? 1 }), true));
  const pos = g.ecs.c.transform.get(g.player.id)!.pos;
  const advance = (frames: number, speed = 0): void => {
    for (let frame = 0; frame < frames; frame++) {
      pos.x += speed / 60;
      audio.update(1 / 60);
    }
  };
  audio.update(1 / 60);
  return { g, heard, audio, pos, advance };
}

describe('mounts, heard', () => {
  it('a stationary carriage makes no hoofbeats or rolling noise; actual travel brings both horses and the carriage to life', () => {
    const { g, heard, advance } = ride('chariot');
    expect(heard.map((h) => h.key)).toEqual(['mount:chariot:summon']);
    heard.length = 0;
    advance(180);
    expect(heard).toEqual([]);
    const before = { ...g.player.mount };
    advance(120, 16);
    expect(heard.some((h) => h.key.endsWith(':hooves'))).toBe(true);
    expect(heard.some((h) => h.key.endsWith(':wheels'))).toBe(true);
    expect(heard.some((h) => h.key.endsWith(':harness'))).toBe(true);
    expect(heard.some((h) => h.key.endsWith(':creak'))).toBe(true);
    expect(g.player.mount).toEqual(before); // presentation never changes either ride's gameplay state
    heard.length = 0;
    advance(120);
    expect(heard).toEqual([]);
  });

  it('a parked automobile idles softly, with wheel sounds only once it moves; dismounting silences it', () => {
    const { g, heard, advance } = ride('automobile');
    heard.length = 0;
    advance(120);
    expect(heard.length).toBeGreaterThan(0);
    expect(heard.every((h) => h.key.endsWith(':engine'))).toBe(true);
    advance(60, 16);
    expect(heard.some((h) => h.key.endsWith(':wheels'))).toBe(true);
    g.player.mount.active = null;
    heard.length = 0;
    advance(120);
    expect(heard).toEqual([]);
  });

  it('teleports and long frame gaps never replay a backlog of hoofbeats or motor pulses', () => {
    for (const id of ['chariot', 'automobile'] as const) {
      const { heard, audio, pos, advance } = ride(id);
      advance(10, 10);
      heard.length = 0;
      pos.x += 1000;
      audio.update(1 / 60);
      audio.update(30);
      audio.update(0);
      audio.update(1 / 60);
      expect(heard).toEqual([]);
    }
  });

  it('mount sounds stay brief and below combat impact levels', () => {
    for (const id of ['chariot', 'automobile'] as const) {
      const { heard, advance } = ride(id);
      advance(240, 16);
      const sounds = new Map(heard.map((h) => [h.key, h]));
      for (const { key, sound, gain } of sounds.values()) {
        const result = render(sound.map((l) => ({ ...l, gain: l.gain * gain })));
        expect(result.sec, key).toBeLessThan(0.5);
        expect(result.peak, key).toBeLessThan(-12);
      }
    }
  });

  it('riding suppresses investigator footsteps and dismounting resumes them without accumulated strides', () => {
    const { g, pos } = ride('chariot');
    const play = vi.fn(() => true);
    const sampler = { play } as unknown as Sampler;
    const foley = createFoley(g, sampler, () => true);
    const place = () => ({ gain: 1, pan: 0 });
    foley.update(0, place, () => undefined);
    for (let i = 1; i <= 120; i++) {
      pos.x += 0.2;
      foley.update(i / 60, place, () => undefined);
    }
    expect(play).not.toHaveBeenCalled();
    g.player.mount.active = null;
    foley.update(121 / 60, place, () => undefined);
    expect(play).not.toHaveBeenCalled();
    for (let i = 122; i <= 140; i++) {
      pos.x += 0.1;
      foley.update(i / 60, place, () => undefined);
    }
    expect(play).toHaveBeenCalled();
  });
});
