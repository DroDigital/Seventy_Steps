/**
 * What a great one gives the picture (round 78; render/bossPresence.ts, render/footfalls.ts, render/creatureAura.ts,
 * data/creatureAura.ts, core/pace.ts voiceLevel): how deep in its fight it is, how loud its voice is, the dust and
 * jolt of its stride, and the twelve recipes of what it lets go of, in the anomaly hues only.
 */
import { describe, expect, it } from 'vitest';
import { voicedCurve, voiceLevel } from '../src/core/pace';
import { AURA, AURA_TUNING } from '../src/data/creatureAura';
import { BOSS_PRESENCE } from '../src/data/fxTuning';
import { SIM } from '../src/data/tuning';
import { TIERS } from '../src/data/schema';
import { createBossPresence } from '../src/render/bossPresence';
import { auraRate, createCreatureAura } from '../src/render/creatureAura';
import { createFootfalls } from '../src/render/footfalls';
import { ANOMALY, scaleRgb } from '../src/render/palette';
import type { Particles, ParticleSpec } from '../src/render/particles';
import { spawnCreature } from '../src/systems/creatures';
import { createWorldGame } from '../src/systems/game';
import { worldUniforms } from '../src/render/worldMaterial';

const recording = (): { curve: Float32Array; rate: number } => { // a second of silence, a second of voice, a second of silence
  const rate = 8000;
  const s = new Float32Array(rate * 3);
  for (let i = rate; i < rate * 2; i++) s[i] = 0.5 * Math.sin(i * 0.2);
  return { curve: voicedCurve(s, rate), rate };
};

const particles = (): { into: ParticleSpec[]; sink: Particles } => {
  const into: ParticleSpec[] = [];
  return { into, sink: { spawn: (p: ParticleSpec) => void into.push(p), update: () => undefined } as unknown as Particles };
};

describe('the loudness of a voice', () => {
  it('is nothing in a pause and strong where the voice sounds, and never leaves 0..1', () => {
    const { curve } = recording();
    expect(voiceLevel(curve, 0.4)).toBe(0);
    expect(voiceLevel(curve, 2.6)).toBe(0);
    expect(voiceLevel(curve, 1.5)).toBeGreaterThan(0.7);
    for (let t = -1; t < 5; t += 0.07) expect(voiceLevel(curve, t)).toBeGreaterThanOrEqual(0);
    for (let t = -1; t < 5; t += 0.07) expect(voiceLevel(curve, t)).toBeLessThanOrEqual(1);
  });

  it('follows the rate a recording is played at', () => {
    const { curve } = recording();
    expect(voiceLevel(curve, 0.75, 2)).toBeGreaterThan(0.7); // at twice the rate the voice is heard in half the time
    expect(voiceLevel(curve, 1.5, 2)).toBe(0);
  });
});

describe('a horror\'s depth and voice', () => {
  const g = createWorldGame();
  const id = spawnCreature(g, 'cthulhu', { x: 0, z: 0, yaw: 0 })!;
  const presence = createBossPresence(g);

  it('is 0 for a body that is not fought, and rises from its first phase to its last', () => {
    expect(presence.deep(id)).toBe(0);
    const script = { phases: [{}, {}, {}] };
    g.ecs.c.fight.set(id, { id: 'cthulhu', script, phase: 0, engaged: true } as never);
    expect(presence.deep(id)).toBe(0);
    g.ecs.c.fight.get(id)!.phase = 1;
    expect(presence.deep(id)).toBeCloseTo(0.5, 5);
    g.ecs.c.fight.get(id)!.phase = 2;
    expect(presence.deep(id)).toBe(1);
    g.ecs.c.fight.get(id)!.engaged = false;
    expect(presence.deep(id)).toBe(0);
  });

  it('swells with the line its own speaker says, is told of by the recording, and settles after it', () => {
    const { curve, rate } = recording();
    expect(presence.voice(id, 0)).toBe(0);
    g.events.emit('Speaking', { speaker: 'boss:cthulhu', text: 'x', rate: 1, seconds: 3, curve });
    void rate;
    expect(presence.voice(id, 10)).toBe(0); // (it began at 10: a pause)
    let peak = 0;
    for (let t = 10; t < 13.4; t += 1 / 60) peak = Math.max(peak, presence.voice(id, t));
    expect(peak).toBeGreaterThan(0.5);
    expect(presence.voice(id, 14.5)).toBeLessThan(0.05);
  });

  it('hears no other horror\'s line', () => {
    const { curve } = recording();
    g.events.emit('Speaking', { speaker: 'boss:hastur', text: 'x', rate: 1, seconds: 3, curve });
    let peak = 0;
    for (let t = 20; t < 23.4; t += 1 / 60) peak = Math.max(peak, presence.voice(id, t));
    expect(peak).toBe(0);
  });
});

describe('a colossus\'s footfalls', () => {
  const setup = () => {
    const g = createWorldGame();
    const id = spawnCreature(g, 'cthulhu', { x: 0, z: 10, yaw: 0 })!;
    g.ecs.c.fight.get(id)!.engaged = true; // roused: a horror that is not is not drawn
    const p = particles();
    const jolts: number[] = [];
    const feet = createFootfalls(g, p.sink, (_at, strength) => void jolts.push(strength));
    const tr = g.ecs.c.transform.get(id)!;
    const body = g.ecs.c.body.get(id)!;
    const step = (speed: number): void => {
      tr.prev = { ...tr.pos };
      tr.pos = { ...tr.pos, z: tr.pos.z + speed / SIM.hz };
    };
    return { g, id, p, jolts, feet, tr, body, step, me: { x: 0, y: 0, z: 0 } as never };
  };

  it('leave dust and a jolt at each stride of its own length, and nothing while it stands', () => {
    const s = setup();
    for (let i = 0; i < 120; i++) s.feet.update(s.me, 1, false);
    expect(s.p.into.length).toBe(0);
    let strides = 0;
    const length = BOSS_PRESENCE.stride * s.body.height;
    for (let i = 0; i < SIM.hz * 8; i++) {
      s.step(4);
      const before = s.jolts.length;
      s.feet.update(s.me, 1, false);
      strides += s.jolts.length - before;
    }
    expect(strides).toBeGreaterThanOrEqual(1);
    expect(strides).toBeLessThanOrEqual(Math.ceil((4 * 8) / length) + 1);
    expect(s.p.into.length).toBeGreaterThan(strides * 3);
    expect(s.jolts.every((j) => j > 0)).toBe(true);
  });

  it('give none to a body far from the investigator, a hidden one, or a room under a roof', () => {
    const s = setup();
    s.g.ecs.c.transform.get(s.id)!.pos.z = 900;
    s.g.ecs.c.transform.get(s.id)!.prev.z = 900;
    for (let i = 0; i < SIM.hz * 3; i++) { s.step(4); s.feet.update(s.me, 1, false); }
    expect(s.jolts.length).toBe(0);
    const t = setup();
    for (let i = 0; i < SIM.hz * 3; i++) { t.step(4); t.feet.update(t.me, 1, true); }
    expect(t.jolts.length).toBe(0);
  });
});

describe('the aura recipes', () => {
  it('number twelve, belong to the tiers of the Mythos, and use the anomaly hues alone', () => {
    expect(Object.values(AURA).flat().length).toBe(12);
    expect(AURA.lesser).toBeUndefined();
    expect(AURA.ally).toBeUndefined();
    for (const tier of Object.keys(AURA)) expect(TIERS as readonly string[]).toContain(tier);
    for (const r of Object.values(AURA).flat()) {
      expect(Object.keys(ANOMALY)).toContain(r.hue);
      expect(r.gain).toBeLessThanOrEqual(1);
      expect(r.life).toBeGreaterThan(2); // slow
      expect(r.alpha).toBeLessThanOrEqual(0.7);
    }
  });

  it('grow stronger up the tiers', () => {
    const total = (t: keyof typeof AURA): number => AURA[t]!.reduce((n, r) => n + r.rate, 0);
    expect(total('greater')).toBeLessThan(total('named'));
    expect(total('named')).toBeLessThan(total('great_old_one'));
    expect(total('great_old_one')).toBeLessThan(total('outer_god'));
  });

  it('give a failing mind more, and a horror deep in its fight more', () => {
    const r = AURA.named![0];
    expect(auraRate(r, 8, 1, 0)).toBeGreaterThan(auraRate(r, 8, 0, 0));
    expect(auraRate(r, 8, 0, 1)).toBeGreaterThan(auraRate(r, 8, 0, 0));
    expect(auraRate(r, 8, 0, 0)).toBeCloseTo(r.rate * 8 * AURA_TUNING.mind[0], 6);
  });
});

describe('a horror giving off its aura', () => {
  const run = (id: string): { g: ReturnType<typeof createWorldGame>; e: number; into: ParticleSpec[] } => {
    const g = createWorldGame();
    const e = spawnCreature(g, id, { x: 0, z: 12, yaw: 0 })!;
    const f = g.ecs.c.fight.get(e);
    if (f) f.engaged = true;
    const p = particles();
    const aura = createCreatureAura(g, p.sink, () => ({ bottom: 0, top: 20 }), { deep: () => 0, voice: () => 0 });
    worldUniforms.uMind.value = 1;
    let time = 1;
    for (let i = 0; i < 360; i++) aura.update({ x: 0, y: 1.6, z: 0 } as never, (time += 1 / 60), 1);
    worldUniforms.uMind.value = 0;
    return { g, e, into: p.into };
  };

  it('lets go of motes in its recipes\' anomaly hues, from the height of its painted body', () => {
    const { g, e, into } = run('cthulhu');
    expect(into.length).toBeGreaterThan(40);
    const colours = AURA.great_old_one!.map((r) => scaleRgb(ANOMALY[r.hue], r.gain));
    const foot = g.ecs.c.transform.get(e)!.pos;
    for (const m of into) {
      expect(colours.some((c) => c.every((v, k) => Math.abs(v - m.color[k]) < 1e-9))).toBe(true);
      expect(m.y).toBeGreaterThanOrEqual(foot.y);
      expect(m.y).toBeLessThanOrEqual(foot.y + 20);
    }
  });

  it('gives a frame no more than its allowance, and a lesser creature none at all', () => {
    expect(run('deep_one').into.length).toBe(0);
    const g = createWorldGame();
    for (let i = 0; i < 30; i++) g.ecs.c.fight.get(spawnCreature(g, 'cthulhu', { x: i, z: 12, yaw: 0 })!)!.engaged = true;
    const p = particles();
    const aura = createCreatureAura(g, p.sink, () => ({ bottom: 0, top: 20 }), { deep: () => 1, voice: () => 0 });
    aura.update({ x: 0, y: 1.6, z: 0 } as never, 1, 1);
    p.into.length = 0;
    aura.update({ x: 0, y: 1.6, z: 0 } as never, 1.1, 1);
    expect(p.into.length).toBeGreaterThan(0);
    expect(p.into.length).toBeLessThanOrEqual(AURA_TUNING.frameMost);
  });
});
