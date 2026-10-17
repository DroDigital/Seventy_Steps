import { describe, expect, it, vi } from 'vitest';
import type { V3 } from '../src/core/geom';
import { MOUNT_IDS, type MountId } from '../src/data/mounts';
import type { Sound } from '../src/data/sounds';
import { createFoley } from '../src/render/audio/foley';
import { createMountAudio } from '../src/render/audio/mountAudio';
import type { Sampler } from '../src/render/audio/sampler';
import { createGame } from '../src/systems/game';
import { render } from './soundRender';

function ride(id: MountId) {
  const g = createGame();
  Object.assign(g.player.mount, { selected: id, active: id, automobileOwned: true, chariotOwned: true, speed: 16, phase: 0 });
  const heard: { key: string; sound: Sound; gain: number; at?: V3 | null }[] = [];
  const audio = createMountAudio(g, (key, sound, o) => (heard.push({ key, sound, gain: o?.gain ?? 1, at: o?.at }), true));
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
  it('idles without hoofbeats, then travel brings the gait; only wheeled mounts roll', () => {
    const chariot = ride('chariot');
    expect(chariot.heard.map((h) => h.key)).toEqual(['mount:chariot:summon']);
    expect(chariot.heard.every((h) => h.at == null)).toBe(true);
    chariot.heard.length = 0;
    chariot.advance(180);
    expect(chariot.heard.length).toBeGreaterThan(0);
    expect(chariot.heard.every((h) => h.key.endsWith(':wind'))).toBe(true);
    const before = { ...chariot.g.player.mount };
    chariot.heard.length = 0;
    chariot.advance(120, 16);
    expect(chariot.heard.some((h) => h.key.endsWith(':hooves'))).toBe(true);
    expect(chariot.heard.some((h) => h.key.endsWith(':wheels'))).toBe(true);
    expect(chariot.heard.some((h) => h.key.endsWith(':harness'))).toBe(true);
    expect(chariot.heard.some((h) => h.key.endsWith(':creak'))).toBe(true);
    expect(chariot.g.player.mount).toEqual(before);
    chariot.heard.length = 0;
    chariot.advance(120);
    expect(chariot.heard.every((h) => h.key.endsWith(':wind'))).toBe(true);

    const grey = ride('grey');
    expect(grey.heard.map((h) => h.key)).toEqual(['mount:grey:summon']);
    grey.heard.length = 0;
    grey.advance(180);
    expect(grey.heard.some((h) => /:(breath|snort|hooves|wheels|wind|engine|harness)$/.test(h.key))).toBe(false);
    grey.heard.length = 0;
    grey.advance(120, 16);
    expect(grey.heard.some((h) => h.key.endsWith(':hooves'))).toBe(true);
    expect(grey.heard.some((h) => h.key.endsWith(':wheels'))).toBe(true);
    expect(grey.heard.some((h) => h.key.endsWith(':harness'))).toBe(true);
    expect(grey.heard.some((h) => h.key.endsWith(':wind'))).toBe(false);
  });

  it('a parked automobile idles, rolls only once it moves, and dismounts with one stall', () => {
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
    expect(heard.map((h) => h.key)).toEqual(['mount:automobile:dismiss']);
  });

  it('teleports and long frame gaps never replay a backlog of hoofbeats or motor pulses', () => {
    for (const id of MOUNT_IDS) {
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

  it('mount sounds stay brief, audible, and below combat impact levels', () => {
    for (const id of MOUNT_IDS) {
      const { g, heard, audio, advance } = ride(id);
      advance(240, 16);
      g.player.mount.active = null;
      audio.update(1 / 60);
      const sounds = new Map(heard.map((h) => [h.key, h]));
      expect(sounds.size).toBeGreaterThan(0);
      for (const { key, sound, gain, at } of sounds.values()) {
        expect(at, key).toBeUndefined();
        const result = render(sound.map((l) => ({ ...l, gain: l.gain * gain })));
        expect(result.sec, key).toBeLessThan(0.5);
        expect(result.peak, key).toBeLessThan(-12);
        expect(result.peak, key).toBeGreaterThan(-24);
      }
    }
  });

  it('riding suppresses investigator footsteps and dismounting resumes them without accumulated strides', () => {
    const { g, pos } = ride('grey');
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
