import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { DOOR_LOOKS } from '../src/data/doors';
import { materialOf } from '../src/data/doorSounds';
import { ACTS, HANDS } from '../src/data/foleySounds';
import { PLANNED } from '../src/data/plannedSounds';
import { PLANNED_SETS, RECORDED_FOR, setOf } from '../src/data/samples';
import { SAMPLE_LEVELS } from '../src/data/sampleLevels';
import { createSampler, setFiles } from '../src/render/audio/sampler';
import type { AudioEngine } from '../src/render/audio/engine';

const MATERIALS = [...new Set(Object.values(DOOR_LOOKS).map((l) => materialOf(l!)))];

describe('the recordings the game is ready for (data/plannedSounds.ts, docs/SUNO_SOUNDS.md; round 40)', () => {
  it('each has a distinct set, a distinct file, a prompt in the form Suno Sounds reads, and a length that is a length', () => {
    expect(new Set(PLANNED.map((p) => p.id)).size).toBe(PLANNED.length);
    expect(new Set(PLANNED.map((p) => p.file)).size).toBe(PLANNED.length);
    for (const p of PLANNED) {
      expect(p.takes, p.id).toBeGreaterThanOrEqual(2); // a set of one plays the same take twice running
      expect(p.gain > 0 && p.gain <= 1, p.id).toBe(true);
      expect(p.seconds[0] > 0 && p.seconds[0] < p.seconds[1] && p.seconds[1] <= 5, p.id).toBe(true);
      expect(p.prompt, p.id).toMatch(/perspective/);
      expect(p.prompt, p.id).toMatch(/\d(\.\d)? seconds? duration/);
      expect(p.prompt, p.id).toMatch(/no music/);
      expect(p.prompt.length, p.id).toBeLessThan(300);
    }
  });

  it('answers recipes that exist: every door of every material, open and shut, and the hands, the mist and the acts it names', () => {
    for (const m of MATERIALS) for (const way of ['open', 'close']) expect(RECORDED_FOR[`door:${m}:${way}`], `door:${m}:${way}`).toBeDefined();
    for (const p of PLANNED) {
      for (const key of p.for) {
        const [kind, name] = key.split(':');
        if (kind === 'hands') expect(name in HANDS, key).toBe(true);
        else if (kind === 'act') expect(name in ACTS, key).toBe(true);
        else if (kind === 'mist') expect(['pass', 'close'], key).toContain(name);
        else expect(kind, key).toBe('door');
      }
    }
    expect(Object.keys(RECORDED_FOR).length).toBe(PLANNED.reduce((n, p) => n + p.for.length, 0)); // (no recipe has two recordings)
  });

  it('a motion of fixed length is fit to it: every door, and the mist wall', () => {
    for (const p of PLANNED) {
      const timed = p.for.some((k) => k.startsWith('door:') || k === 'mist:pass');
      expect(!!p.fit, p.id).toBe(timed);
    }
  });

  it('plays only the files that are there: a planned set is not asked for before it is recorded', () => {
    const present = PLANNED.filter((p) => existsSync(`public/audio/sfx/${p.file}1.mp3`));
    const asked = setFiles(Object.values(PLANNED_SETS));
    expect(asked.length).toBe(present.reduce((n, p) => n + p.takes, 0) - present.reduce((n, p) => n + Array.from({ length: p.takes }).filter((_, k) => !SAMPLE_LEVELS[`sfx/${p.file}${k + 1}`]).length, 0));
    expect(setFiles([{ files: ['thud1', 'nothing_here'], gain: 0.5, planned: true }])).toEqual(['sfx/thud1']);
    expect(setFiles([{ files: ['thud1', 'nothing_here'], gain: 0.5 }])).toEqual(['sfx/thud1', 'sfx/nothing_here']);
  });

  it('a file that is there is measured and credited as made, with the plan', () => {
    const credits = readFileSync('public/audio/CREDITS.md', 'utf8');
    for (const p of PLANNED) for (let k = 1; k <= p.takes; k++) {
      const file = `${p.file}${k}`;
      if (!existsSync(`public/audio/sfx/${file}.mp3`)) continue;
      expect(SAMPLE_LEVELS[`sfx/${file}`], `${file} is not measured: run python3 tools/audio_levels.py`).toBeDefined();
      expect(credits, `${file} is not credited`).toMatch(new RegExp(`\\| \`sfx/${file}\\.mp3\` \\| Suno Sounds \\|`));
    }
  });

  it('is described in docs/SUNO_SOUNDS.md, every one, as it is here (npx tsx tools/suno_sounds_doc.ts)', () => {
    const doc = readFileSync('docs/SUNO_SOUNDS.md', 'utf8');
    for (const p of PLANNED) {
      expect(doc, p.id).toContain(`### ${p.id}\n`);
      expect(doc, p.id).toContain(p.prompt);
      for (let k = 1; k <= p.takes; k++) expect(doc, p.id).toContain(`sfx/${p.file}${k}.mp3`);
    }
    expect([...doc.matchAll(/^### /gm)].length).toBe(PLANNED.length);
  });

  it('a set is found by its id, whether recorded or planned', () => {
    expect(setOf('thud').files[0]).toBe('thud1');
    expect(setOf('doorOakOpen').planned).toBe(true);
  });
});

describe('a recording fit to a motion (render/audio/sampler.ts)', () => {
  function engine(duration: number): { e: AudioEngine; rates: number[] } {
    const rates: number[] = [];
    const node = () => ({ connect: (x: unknown) => x, disconnect: vi.fn() });
    const ctx = {
      currentTime: 0,
      createBufferSource: () => {
        const s = { ...node(), buffer: null as unknown, playbackRate: { set value(v: number) { rates.push(v); } }, detune: { value: 0 }, start: vi.fn(), onended: null };
        return s;
      },
      createGain: () => ({ ...node(), gain: { value: 1 } }),
      createStereoPanner: () => ({ ...node(), pan: { value: 0 } }),
      createBiquadFilter: () => ({ ...node(), type: '', frequency: { value: 0 } }),
      decodeAudioData: async () => ({ duration }),
    };
    return { e: { ctx, sfx: node(), playing: 0, detune: 0, onStart: (fn: (c: unknown) => void) => fn(ctx) } as unknown as AudioEngine, rates };
  }
  const play = async (duration: number, fit?: number): Promise<number> => {
    vi.stubGlobal('fetch', async () => ({ ok: true, status: 200, arrayBuffer: async () => new ArrayBuffer(8) }));
    const { e, rates } = engine(duration);
    const sampler = createSampler(e, '');
    const set = { files: ['x1'], gain: 1, pitch: [1, 1] as const };
    await sampler.load(['sfx/x1']);
    expect(sampler.play(set, { fit })).toBe(true);
    vi.unstubAllGlobals();
    return rates.at(-1)!;
  };

  it('is played faster to be shorter and slower to be longer, to last as long as its motion, within a third either way', async () => {
    expect(await play(1, 0.8)).toBeCloseTo(1.25, 5);
    expect(await play(1, 1.25)).toBeCloseTo(0.8, 5);
    expect(await play(1, 1)).toBeCloseTo(1, 5);
    expect(await play(1, 0.1)).toBeCloseTo(1.33, 5); // (a motion far shorter is not made a chipmunk of it)
    expect(await play(1, 9)).toBeCloseTo(0.75, 5);
    expect(await play(1)).toBeCloseTo(1, 5); // no motion to fit: as it is
  });
});
