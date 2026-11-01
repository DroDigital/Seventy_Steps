import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { PLACE_VOICES } from '../src/data/placeSounds';
import { AMBIENCE, DUNGEON_AMBIENCE } from '../src/data/samples';
import { createGameAudio } from '../src/render/audio/gameAudio';
import type { AudioEngine } from '../src/render/audio/engine';
import type { Drones } from '../src/render/audio/drones';
import { soundscapeAt } from '../src/render/audio/soundscape';
import type { FxParams } from '../src/render/fx';
import { createWorldGame } from '../src/systems/game';
import { worldLayout } from '../src/world/placements';

const heard = vi.hoisted(() => ({ bed: vi.fn(), voices: vi.fn() }));
vi.mock('../src/render/audio/ambience', () => ({ createAmbience: () => ({ set: heard.bed, update: () => undefined }) }));
vi.mock('../src/render/audio/placeVoices', () => ({ createPlaceVoices: () => ({ update: heard.voices }) }));

const world = worldLayout();
const sign = world.signs.find((s) => s.id === 'knyan_serpents')!;
const arena = world.arenas.find((a) => a.bosses.includes('yig'))!;
const depths = world.signs.find((s) => s.id === 'knyan_depths')!;

describe('the Serpent Temple soundscape', () => {
  it('covers the sign, the approach and Yig’s enclosure, but not the rest of the realm', () => {
    const mid = { x: (sign.x + arena.x) / 2, z: (sign.z + arena.z) / 2 };
    for (const p of [sign, sign.rest, { x: sign.x, z: sign.z - 80 }, mid, arena, ...[[50, 0], [-50, 0], [0, 50], [0, -50]].map(([dx, dz]) => ({ x: arena.x + dx, z: arena.z + dz }))]) {
      expect(soundscapeAt('kn_yan', p)).toBe('serpent_temple');
    }
    expect(soundscapeAt('kn_yan', { x: mid.x + 95, z: mid.z })).toBe('kn_yan');
    expect(soundscapeAt('kn_yan', depths)).toBe('kn_yan');
    expect(soundscapeAt('arkham', sign)).toBe('arkham');
    expect(soundscapeAt('kn_yan')).toBe('kn_yan');
    expect(soundscapeAt(null, sign)).toBeNull();
  });

  it('replaces the cavern recordings and far drip with wind', () => {
    expect(AMBIENCE.serpent_temple.beds.map(([file]) => file)).toEqual(['wind', 'wind_ghost']);
    expect(AMBIENCE.serpent_temple.spots).toEqual([]);
    expect(PLACE_VOICES.serpent_temple ?? []).toEqual([]);
    expect(AMBIENCE.kn_yan.beds.map(([file]) => file)).toContain('drips');
    expect(AMBIENCE.kn_yan.spots.map((spot) => spot.set)).toContain('chains');
    expect(PLACE_VOICES.kn_yan.some((voice) => voice.recipe === 'drip')).toBe(true);
  });

  it('routes both outdoor audio layers together and still chooses a roofed room’s ambience', () => {
    const g = createWorldGame();
    const engine = { ctx: null, bed: null, sfx: null, score: null, music: null, hushed: 0, playing: 0, detune: 0, onStart: () => undefined, setDistortion: () => undefined, setMuffle: () => undefined, setHush: () => undefined } as unknown as AudioEngine;
    const drones = { set: () => undefined, update: () => undefined } as unknown as Drones;
    const audio = createGameAudio(engine, drones, g);
    const camera = new THREE.PerspectiveCamera();
    const fx = { detune: 0, wobble: 0, distortion: 0, heard: 0 } as FxParams;
    const at = g.ecs.c.transform.get(g.player.id)!.pos;
    const move = (region: string, p: { x: number; z: number }, seconds: number): void => {
      g.overworld!.region = region;
      Object.assign(at, { x: p.x, z: p.z });
      audio.update(fx, seconds, camera, true);
    };

    move('kn_yan', sign.rest, 0);
    expect(heard.bed).toHaveBeenLastCalledWith(AMBIENCE.serpent_temple);
    expect(heard.voices).toHaveBeenLastCalledWith(0, expect.objectContaining({ region: 'serpent_temple' }));
    move('kn_yan', arena, 1);
    expect(heard.bed).toHaveBeenLastCalledWith(AMBIENCE.serpent_temple);
    expect(heard.voices).toHaveBeenLastCalledWith(1, expect.objectContaining({ region: 'serpent_temple' }));
    move('kn_yan', depths, 2);
    expect(heard.bed).toHaveBeenLastCalledWith(AMBIENCE.kn_yan);
    expect(heard.voices).toHaveBeenLastCalledWith(2, expect.objectContaining({ region: 'kn_yan' }));

    const house = world.dungeons.find((d) => d.layout.def.id === 'witch_house')!.layout.rooms[0];
    move('arkham', house, 3);
    expect(heard.bed).toHaveBeenLastCalledWith(DUNGEON_AMBIENCE.house);
    expect(heard.voices).toHaveBeenLastCalledWith(3, expect.objectContaining({ outdoors: false }));
  });
});
