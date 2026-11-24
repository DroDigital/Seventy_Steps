/**
 * Each horror's own death (2026-11-23; data/bossDeaths.ts, shaders/deathFx.ts, render/creatureFx.ts, render/creatureLook.ts,
 * render/bossDeathFx.ts, render/gore.ts): every horror that is vanquished has one, no two are alike, each follows its tale, the shader
 * knows every one by the number it is told, the picture moves as its death says, its cues play by how far through its death it is,
 * and a blade's cut parts only those whose tale is one of a blade or a tearing.
 */
import { describe, expect, it } from 'vitest';
import type * as THREE from 'three';
import { DEATHS, DEATH_KEYS, DEATH_MOTIONS, DEATH_ORDERS, DEATH_STYLE_BASE, deathKey, deathMoveAt, deathOf, deathStyleOf, type DeathCue } from '../src/data/bossDeaths';
import { MATTER } from '../src/data/bossDeathMatter';
import { FX_STYLE } from '../src/data/creatureFx';
import { goreOf } from '../src/data/gore';
import { getEntity, variantOf } from '../src/data/registry';
import { SAMPLE_SETS } from '../src/data/samples';
import { STINGERS } from '../src/data/sounds';
import { createBossDeathFx } from '../src/render/bossDeathFx';
import { createCreatureFx } from '../src/render/creatureFx';
import { lookOf } from '../src/render/creatureLook';
import { createGore } from '../src/render/gore';
import { createGroundFx } from '../src/render/groundFx';
import { PARTICLE_SHAPES, type ParticleSpec } from '../src/render/particles';
import { CAST_FRAG } from '../src/render/shaders/castSprite';
import { SPRITE_FRAG } from '../src/render/shaders/sprite';
import { startMove } from '../src/systems/actions';
import { spawnCreature } from '../src/systems/creatures';
import { createGame } from '../src/systems/game';
import { worldLayout } from '../src/world/placements';

/** Every horror the world vanquishes, by its picture's key: each `boss:` spawn, a boss version of a common creature by its own. */
const VANQUISHED = worldLayout().spawns.filter((s) => s.id.startsWith('boss:')).map((s) => (s.variant ? `${s.entity}#${s.variant}` : s.entity));
const cueAt = (c: DeathCue): number => c.at;

describe('each horror\'s own death (data/bossDeaths.ts)', () => {
  it('is written for every horror the world vanquishes, and for nothing else', () => {
    expect(VANQUISHED.length).toBeGreaterThan(40);
    expect([...new Set(VANQUISHED)].sort()).toEqual([...DEATH_KEYS]);
  });

  it('is its own: no two go in the same order and motion, and no two are the same death', () => {
    const pairs = DEATH_KEYS.map((k) => `${DEATHS[k].body.order}/${DEATHS[k].body.motion}`);
    expect(new Set(pairs).size).toBe(pairs.length);
    expect(new Set(DEATH_KEYS.map((k) => JSON.stringify({ ...DEATHS[k], lore: '' }))).size).toBe(DEATH_KEYS.length);
    expect(pairs).not.toContain('top/sink'); // (none is merely the plain melt, burn or shatter of data/creatureFx.ts)
    expect(pairs).not.toContain('char/none');
    expect(pairs).not.toContain('blocks/scatter');
  });

  it('follows its tale: each says what its story makes of it, by the story\'s name', () => {
    for (const key of DEATH_KEYS) {
      const def = getEntity(key.split('#')[0])!;
      const lore = DEATHS[key].lore;
      expect(lore.length, key).toBeGreaterThan(80);
      if (key !== 'voice_in_the_tomb') expect(lore, key).toContain(def.source); // (whose title names a man the demo does not hold)
    }
  });

  it('uses the whole of the shader\'s vocabulary and nothing outside it', () => {
    const orders = new Set(DEATH_KEYS.map((k) => DEATHS[k].body.order));
    const motions = new Set(DEATH_KEYS.map((k) => DEATHS[k].body.motion));
    expect([...orders].sort()).toEqual([...DEATH_ORDERS].sort());
    expect([...motions].sort()).toEqual([...DEATH_MOTIONS].sort());
  });

  it('times its cues within its death, with matter, sounds and shapes the game has', () => {
    for (const key of DEATH_KEYS) {
      const d = DEATHS[key];
      expect(d.cues.length, key).toBeGreaterThan(1);
      for (const c of d.cues) {
        expect(cueAt(c), key).toBeGreaterThanOrEqual(0);
        expect(cueAt(c), key).toBeLessThanOrEqual(1);
        if ('until' in c) [expect(c.until, key).toBeGreaterThan(c.at), expect(c.until, key).toBeLessThanOrEqual(1), expect(c.n, key).toBeGreaterThan(0)];
        if ('stream' in c) expect(MATTER[c.stream], key).toBeDefined();
        if ('burst' in c) expect(MATTER[c.burst], key).toBeDefined();
        if ('set' in c) expect(SAMPLE_SETS[c.set], `${key} ${c.set}`).toBeDefined();
        if ('sting' in c) expect(STINGERS[c.sting], `${key} ${c.sting}`).toBeDefined();
      }
      const b = d.body;
      expect(b.first ?? 0, key).toBeLessThan(0.7);
      for (const v of [...b.rim, ...(b.tint ?? [])]) [expect(v).toBeGreaterThanOrEqual(0), expect(v).toBeLessThanOrEqual(1)];
    }
    for (const m of Object.values(MATTER)) expect(PARTICLE_SHAPES).toContain(m.shape ?? 'disc');
  });

  it('is found from a picture\'s key: an eldritch form dies as its horror, a boss version of a common creature only as itself', () => {
    expect(deathKey('high_priest#eldritch')).toBe('high_priest');
    expect(deathKey('shoggoth#boss')).toBe('shoggoth#boss');
    expect(deathKey('shoggoth')).toBeUndefined();
    expect(deathKey('shoggoth#eldritch')).toBeUndefined();
    expect(deathKey('deep_one')).toBeUndefined();
    DEATH_KEYS.forEach((k, i) => expect(deathStyleOf(k)).toBe(DEATH_STYLE_BASE + i));
    expect(DEATH_STYLE_BASE).toBeGreaterThan(Math.max(...Object.values(FX_STYLE)));
  });

  it('cuts and pools only those whose tale is a blade or a tearing: Wilbur, torn by the dog, and the Gorgon, by the machete', () => {
    expect(DEATH_KEYS.filter((k) => DEATHS[k].gore).sort()).toEqual(['medusa_gorgon', 'wilbur_whateley']);
    for (const k of ['medusa_gorgon', 'wilbur_whateley']) expect(goreOf(k)[0]).not.toBe('none');
  });

  it('moves its whole picture as its move says: in at the start, whole at the end, a tremble that dies away', () => {
    const colour = DEATHS.colour_out_of_space.move!;
    expect(deathMoveAt(colour, 0, 0)).toEqual({ lift: 0, sx: 1, sy: 1, away: 0, shake: 0 });
    const end = deathMoveAt(colour, 1, 0);
    expect(end.lift).toBeCloseTo(colour.y!, 6);
    expect(end.sy).toBeCloseTo(colour.sy!, 6);
    expect(deathMoveAt(colour, 0.5, 0).lift).toBeLessThan(colour.y! / 2); // (it eases in: a rocket)
    expect(Math.abs(deathMoveAt(DEATHS.keziah_mason.move, 0.2, 1.3).shake)).toBeGreaterThan(0);
    expect(Math.abs(deathMoveAt(DEATHS.keziah_mason.move, 1, 1.3).shake)).toBe(0);
    expect(deathMoveAt(undefined, 0.7, 0)).toEqual({ lift: 0, sx: 1, sy: 1, away: 0, shake: 0 });
  });
});

describe('what the picture is told (shaders/deathFx.ts, render/creatureFx.ts, render/creatureLook.ts)', () => {
  it('holds a row of each table for every death, in the sprite and in its cast shadow', () => {
    for (const frag of [SPRITE_FRAG, CAST_FRAG]) {
      for (const name of ['DEATH_BODY', 'DEATH_RIM', 'DEATH_TINT']) expect(frag).toContain(`const vec4 ${name}[${DEATH_KEYS.length}]`);
      expect(frag).toContain(`const float DEATH_DIR[${DEATH_KEYS.length}]`);
      expect(frag).toContain('deathKeep(uv, col, s)');
      expect(frag).toContain('p = deathSource(p, s)');
    }
  });

  it('dies a horror in its own style, and every other creature by its matter', () => {
    const g = createGame();
    const fx = createCreatureFx(g);
    const curwen = spawnCreature(g, 'joseph_curwen', { x: 4, z: 4, yaw: 0 })!;
    const dying = { state: 'hurt' as const, frame: 0, opacity: 1, sink: 0, lash: 0, dissolve: 0.5 };
    expect(fx.gone(curwen, getEntity('joseph_curwen')!, 'creature:joseph_curwen', dying, 1).style).toBe(deathStyleOf('joseph_curwen'));
    const shoggoth = variantOf(getEntity('shoggoth')!, 'boss')!;
    expect(fx.gone(curwen, shoggoth, 'creature:shoggoth#boss', dying, 1).style).toBe(deathStyleOf('shoggoth#boss'));
    expect(fx.gone(curwen, getEntity('deep_one')!, 'creature:deep_one', dying, 1).style).toBe(FX_STYLE.melt);
  });

  it('moves the picture of one dying its own death: the Colour up and drawn out, Brown Jenkin away from the one who struck it', () => {
    const g = createGame();
    const me = g.ecs.c.transform.get(g.player.id)!;
    [me.pos.x, me.pos.z] = [0, 0];
    const colour = spawnCreature(g, 'colour_out_of_space', { x: 0, z: 6, yaw: 0 })!;
    const jenkin = spawnCreature(g, 'brown_jenkin', { x: 6, z: 0, yaw: 0 })!;
    for (const e of [colour, jenkin]) {
      const a = g.ecs.c.actor.get(e)!;
      startMove(a, 'death');
      a.frame = Math.round(a.moves.death.frames * 0.9);
    }
    const up = lookOf(g, colour, 2)!;
    expect(up.dissolve).toBeCloseTo(0.9, 1);
    expect(up.sink).toBe(0);
    expect(up.lift!).toBeGreaterThan(1);
    expect(up.sy!).toBeGreaterThan(2);
    const kicked = lookOf(g, jenkin, 2)!;
    expect(kicked.lift!).toBeLessThan(-0.8);
    expect(kicked.drift!.x).toBeGreaterThan(0.5); // (away: the investigator is at the origin, it to the east)
    const deep = spawnCreature(g, 'deep_one', { x: -6, z: 0, yaw: 0 })!;
    startMove(g.ecs.c.actor.get(deep)!, 'death');
    expect(lookOf(g, deep, 2)!.lift).toBeUndefined();
  });
});

describe('what it lets loose (render/bossDeathFx.ts)', () => {
  const rig = () => {
    const g = createGame();
    const spawned: ParticleSpec[] = [];
    const sounds: string[] = [];
    let bolts = 0;
    const ground = createGroundFx();
    const deaths = createBossDeathFx(g, {
      particles: { spawn: (p) => void spawned.push(p), update: () => undefined },
      ground,
      beams: { bolt: () => void bolts++ } as never,
      audio: { sample: (s) => void sounds.push(s), stinger: (s) => void sounds.push(`!${s}`) },
      figure: () => ({ bottom: 0, top: 2.2 }),
      painted: new Map(),
    });
    const camera = { matrixWorld: { elements: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] } } as unknown as THREE.Camera;
    return { g, spawned, sounds, bolts: () => bolts, ground, deaths, camera };
  };
  /** Plays the death of `id`, stepping its frame `by` at a time and drawing the effects after each step. */
  const play = (r: ReturnType<typeof rig>, id: string, by: number): void => {
    const e = spawnCreature(r.g, id, { x: 3, z: 3, yaw: 0 })!;
    const a = r.g.ecs.c.actor.get(e)!;
    startMove(a, 'death');
    const last = a.moves.death.frames;
    for (let f = 0, time = 0; ; f = Math.min(last, f + by), time += by / 60) { // (to its last frame, whatever the step)
      a.frame = f;
      r.deaths.update(time, r.camera);
      if (f === last) break;
    }
  };

  it('plays each cue once, at its share of the death, and a stream gives the same handful however fast the death plays', () => {
    const slow = rig();
    play(slow, 'joseph_curwen', 1);
    expect(slow.sounds).toEqual(['whisper']);
    expect(slow.ground.count()).toBe(1); // the little heap of dust
    const fast = rig();
    play(fast, 'joseph_curwen', 9);
    expect(Math.abs(fast.spawned.length - slow.spawned.length)).toBeLessThanOrEqual(1);
    expect(slow.spawned.length).toBeGreaterThan(60);
    expect(slow.spawned.every((p) => p.floor !== undefined)).toBe(true); // (the salts settle on the floor)
  });

  it('calls down the sky where its tale has thunder, and lets nothing loose for a creature that dies by its matter', () => {
    const dunwich = rig();
    play(dunwich, 'dunwich_horror', 2);
    expect(dunwich.bolts()).toBe(1);
    const plain = rig();
    play(plain, 'deep_one', 2);
    expect(plain.spawned).toEqual([]);
    expect(plain.sounds).toEqual([]);
  });
});

describe('the cut a horror\'s own death allows (render/gore.ts)', () => {
  const kill = (id: string): boolean => {
    const g = createGame();
    const blood = { gush: () => undefined, spray: () => undefined, pool: () => undefined } as never;
    const gore = createGore(g, blood);
    const e = spawnCreature(g, id, { x: 0, z: 2, yaw: Math.PI })!;
    startMove(g.ecs.c.actor.get(g.player.id)!, 'light1');
    g.events.emit('Hit', { attacker: g.player.id, target: e, outcome: 'kill', damage: 500 });
    const body = {
      key: id, silhouette: getEntity(id)!.sprite?.silhouette, x: 0, y: 0, z: 2, base: 0, across: { x: -1, z: 0 }, facing: Math.PI, mirror: false, side: false,
      frame: { width: 100, height: 100, bounds: [25, 10, 75, 95] }, size: { w: 2.2, h: 2.2 }, painted: 1,
    };
    return !!gore.dying(e, 0.1, body, 1)?.plan;
  };

  it('parts the Gorgon and Wilbur under a blade, and no other horror that dies its own death', () => {
    expect(kill('medusa_gorgon')).toBe(true);
    expect(kill('wilbur_whateley')).toBe(true);
    expect(kill('joseph_curwen')).toBe(false); // (dust, by the formula)
    expect(kill('keziah_mason')).toBe(false);
    expect(kill('cthulhu_cultist')).toBe(true); // a creature with no death of its own comes apart as round 113 made it
    expect(deathOf('cthulhu_cultist')).toBeUndefined();
  });
});
