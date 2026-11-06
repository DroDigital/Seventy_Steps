import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { ENDING_IDS, type EndingId } from '../src/data/endings';
import { ENDING_NARRATION, endingLines } from '../src/data/endingNarration';
import { ENDING_SCENES, NARRATION_AT } from '../src/data/cutscenesEndings';
import { NARRATOR } from '../src/data/intro';
import { clipOf, shown, wordsOf } from '../src/data/speech';
import { CAST } from '../src/data/speechCast';
import { speechLines } from '../src/data/speechLines';
import { sceneLength } from '../src/render/cinemaPlan';
import { createDirector } from '../src/render/cinemaDirector';
import { createGame } from '../src/systems/game';
import { COURT_SIGN } from '../src/systems/endings';

/** The seconds of an MPEG-1 layer III file, from its frames (the length as the player hears it). */
function seconds(file: string): number {
  const b = readFileSync(file);
  let i = b[0] === 0x49 && b[1] === 0x44 && b[2] === 0x33 ? 10 + ((b[6]! << 21) | (b[7]! << 14) | (b[8]! << 7) | b[9]!) : 0;
  const KBPS = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320];
  const HZ = [44100, 48000, 32000];
  let samples = 0;
  let rate = 44100;
  while (i + 4 < b.length) {
    if (b[i] === 0xff && (b[i + 1]! & 0xe0) === 0xe0 && ((b[i + 1]! >> 3) & 3) === 3 && ((b[i + 1]! >> 1) & 3) === 1) {
      const [kbps, hz, pad] = [KBPS[b[i + 2]! >> 4], HZ[(b[i + 2]! >> 2) & 3], (b[i + 2]! >> 1) & 1];
      if (kbps && hz) {
        samples += 1152;
        rate = hz;
        i += Math.floor((144 * kbps * 1000) / hz) + pad;
        continue;
      }
    }
    i++;
  }
  return samples / rate;
}

const GAP = 0.8; // seconds a line is let to finish before the next begins, at the least

describe('the narrator over the endings (round 55)', () => {
  it('is the opening\'s narrator, in his voice as the opening has it: three lines to an ending, none whispered', () => {
    for (const id of ENDING_IDS) expect(ENDING_NARRATION[id], id).toHaveLength(3);
    expect(CAST[NARRATOR]).toMatchObject({ name: 'The Archivist (Intro Narrator)', room: true }); // set in his stone chamber, as the opening plays him
    expect(CAST[NARRATOR]!.rate).toBeUndefined(); // and not lowered or raised: the pitch the opening has
    expect(CAST[NARRATOR]!.echo).toBeUndefined();
    for (const l of endingLines()) {
      expect(l.speaker).toBe(NARRATOR);
      expect(l.say).not.toMatch(/\[(whispers|softly|quietly)\]/);
      expect(wordsOf(l.say)).toBe(wordsOf(l.text));
    }
    for (const l of endingLines()) expect(speechLines().some((s) => s.speaker === l.speaker && s.text === l.text)).toBe(true);
  });

  it('is recorded, each line once, as the opening\'s are: an untouched take of 44.1 kHz and 128 kbit/s, as long as the scene counts on', () => {
    for (const id of ENDING_IDS) {
      for (const l of ENDING_NARRATION[id]) {
        const file = `public/voice/${clipOf(NARRATOR, shown(l.say))}.mp3`;
        expect(existsSync(file), `${id}: ${shown(l.say)} has no recording (${file})`).toBe(true);
        expect(Math.abs(seconds(file) - l.seconds), `${file} is not ${l.seconds} s`).toBeLessThan(0.15);
      }
    }
  });

  it.each([...ENDING_IDS])('lays %s\'s lines over its scene, each said in full, one after another, and the scene ends after them', (id: EndingId) => {
    const scene = ENDING_SCENES[id]!;
    const lines = ENDING_NARRATION[id];
    const voiced = scene.beats.filter((b) => b.voice).sort((a, b) => a.at - b.at);
    expect(voiced.map((b) => b.at)).toEqual([...NARRATION_AT[id]]);
    voiced.forEach((b, i) => {
      const text = shown(lines[i]!.say);
      expect(b.voice).toEqual({ by: NARRATOR, text });
      expect(b.caption).toBe(text); // the words shown are the words said
      expect(b.hold! + 0.9).toBeLessThanOrEqual(lines[i]!.seconds + 0.5); // shown no longer than it is said
      if (i > 0) expect(b.at, `line ${i + 1} begins before line ${i} is done`).toBeGreaterThanOrEqual(voiced[i - 1]!.at + lines[i - 1]!.seconds + GAP);
    });
    const last = voiced.at(-1)!;
    expect(sceneLength(scene)).toBeGreaterThan(last.at + lines.at(-1)!.seconds); // the last is said before the black
    expect(scene.beats.filter((b) => b.caption)).toHaveLength(3); // and nothing else is written over it
    expect(scene.beats.filter((b) => b.title)).toHaveLength(0);
  });

  it('has the herald kneel while the second line says the knee bends, and no other ending kneel', () => {
    const [, second] = ENDING_NARRATION.herald;
    const at = NARRATION_AT.herald[1]!;
    const knees = ENDING_SCENES.herald!.beats.filter((b) => b.kneel);
    expect(knees).toHaveLength(1);
    expect(knees[0]!.at).toBeGreaterThan(at);
    expect(knees[0]!.at).toBeLessThan(at + second!.seconds);
    for (const id of ['seal', 'silver_key']) expect(ENDING_SCENES[id]!.beats.some((b) => b.kneel)).toBe(false);
  });

  it('anchors the passage to the Guide and the other endings to the Court', () => {
    const play = vi.fn(() => Promise.resolve());
    const g = createGame({ creature: 'umr_at_tawil' });
    createDirector(g, { play, active: false } as never, () => undefined);
    const guide = [...g.ecs.c.fight].find(([, f]) => f.id === 'umr_at_tawil')![0];
    g.events.emit('Ending', { id: 'silver_key' });
    expect(play).toHaveBeenLastCalledWith(ENDING_SCENES.silver_key, { target: guide });
    g.events.emit('Ending', { id: 'seal' });
    expect(play).toHaveBeenLastCalledWith(ENDING_SCENES.seal, { sign: COURT_SIGN });
    g.events.emit('Ending', { id: 'herald' });
    expect(play).toHaveBeenLastCalledWith(ENDING_SCENES.herald, { sign: COURT_SIGN });
  });
});
