/**
 * The spoken word (the voices): a line said by someone, a person at an Elder Sign or a horror, plays
 * its recording (public/voice, named by data/speech.ts `clipOf`) on the speech bus, one voice at a
 * time, the next cutting off the last, with some hall behind the great (data/speechCast.ts: a
 * playback rate that lowers a voice, an echo). A recording is fetched and decoded when its line is
 * first said, and a talk's next lines are fetched ahead; a few decoded ones are kept. A line with no
 * recording, or one that has not loaded, plays nothing: it is read, as every line was before.
 */

import { clipOf, VOICE_BASE } from '../../data/speech';
import { CAST } from '../../data/speechCast';
import type { AudioEngine } from './engine';
import { CHAMBER, roomBetween } from './voiceRoom';

const KEEP = 10; // decoded recordings kept
const FADE = 0.14; // seconds a cut-off voice takes to go
const ROOM_TAIL = CHAMBER.decay + CHAMBER.predelay + 0.3; // seconds a room's reverb sounds on after the voice
const HALL = { delay: 0.11, feedback: 0.4, wet: 0.55, tail: 2.5 }; // a full echo: one repeat a tenth of a second behind, fading; its tail in seconds

export interface Speech {
  /** Says a line: its recording, if it has one, cutting off whoever is speaking. */
  say(speaker: string, text: string): void;
  /** Has the recordings of these lines ready for when they are said. */
  ahead(speaker: string, texts: readonly string[]): void;
  /** Stops whoever is speaking, quickly but not with a click. */
  stop(): void;
  /** Holds the line where it is, or lets it go on from there. A line not yet sounding is left alone. */
  hold(on: boolean): void;
  /** Someone is speaking. */
  readonly speaking: boolean;
}

/** How a speaker's voice is played: the cast's rate, hall and level, or a plain one for a stranger. */
export function mannerOf(speaker: string): { rate: number; echo: number; gain: number } {
  const c = CAST[speaker];
  return { rate: c?.rate ?? 1, echo: c?.echo ?? 0, gain: c?.gain ?? 1 };
}

/** `map` with its oldest entries let go until `keep` remain (a Map keeps the order its entries came in). */
export function trim<K, V>(map: Map<K, V>, keep: number): void {
  while (map.size > keep) map.delete(map.keys().next().value as K);
}

interface Voice {
  src: AudioBufferSourceNode;
  out: GainNode;
  hall: AudioNode[]; // what the echo or the room is made of, to be let go after its tail
  tail: number; // seconds it sounds on
  buf: AudioBuffer;
  rate: number;
  offset: number; // seconds into the recording the voice is at
  startedAt: number; // the context's time the current source began
  held: boolean;
}

export function createSpeech(e: AudioEngine, base = VOICE_BASE, began?: (speaker: string, text: string, buf: AudioBuffer, rate: number) => void): Speech {
  let index: ReadonlySet<string> | null = null; // the recordings that exist (public/voice/index.json); none until it is read
  let listing: Promise<void> | undefined;
  const buffers = new Map<string, AudioBuffer | null>(); // null: it would not load
  const pending = new Map<string, Promise<AudioBuffer | null>>();
  let request = 0; // each request is distinct, even when two ask for the same recording before it loads
  let voice: Voice | null = null;

  /** Reads which recordings exist, once. A missing or broken list means none: the game is silent, not broken. */
  const known = (): Promise<void> =>
    (listing ??= fetch(`${base}index.json`)
      .then((r) => (r.ok ? (r.json() as Promise<unknown>) : []))
      .catch(() => [])
      .then((list) => void (index = new Set(Array.isArray(list) ? list.filter((x): x is string => typeof x === 'string') : []))));

  const load = (id: string): Promise<AudioBuffer | null> => {
    const have = buffers.get(id);
    const ctx = e.ctx;
    if (have !== undefined || !ctx) return Promise.resolve(have ?? null);
    let p = pending.get(id);
    if (!p) {
      p = fetch(`${base}${id}.mp3`)
        .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(`${id}: ${r.status}`))))
        .then((bytes) => ctx.decodeAudioData(bytes))
        .catch(() => null)
        .then((buf) => {
          pending.delete(id);
          buffers.set(id, buf);
          trim(buffers, KEEP);
          return buf;
        });
      pending.set(id, p);
    }
    return p;
  };

  /** Lets an echo's nodes go once its tail has sounded out. */
  const release = (v: Voice): void => void setTimeout(() => [v.out, ...v.hall].forEach((n) => n.disconnect()), (v.tail + FADE) * 1000);

  const stop = (): void => {
    request++;
    const v = voice;
    const ctx = e.ctx;
    voice = null;
    if (!v || !ctx) return;
    if (v.held) {
      release(v); // the source is already stopped: starting it again would say the word twice
      return;
    }
    try {
      v.out.gain.cancelScheduledValues(ctx.currentTime);
      v.out.gain.setTargetAtTime(0, ctx.currentTime, FADE / 3);
      v.src.stop(ctx.currentTime + FADE);
    } catch {
      // Already over.
    }
    release(v);
  };

  function play(speaker: string, text: string, buf: AudioBuffer): void {
    const { ctx, speech } = e;
    if (!ctx || !speech) return;
    const m = mannerOf(speaker);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = m.rate;
    const out = ctx.createGain();
    out.gain.value = m.gain;
    src.connect(out);
    const hall: AudioNode[] = [];
    const room = !!CAST[speaker]?.room;
    if (room) hall.push(...roomBetween(ctx, out, speech)); // the voice goes through the room, not straight to the bus
    else out.connect(speech);
    if (m.echo > 0) {
      const delay = ctx.createDelay(1);
      delay.delayTime.value = HALL.delay;
      const feedback = ctx.createGain();
      feedback.gain.value = HALL.feedback * m.echo;
      const wet = ctx.createGain();
      wet.gain.value = HALL.wet * m.echo;
      out.connect(delay);
      delay.connect(feedback).connect(delay);
      delay.connect(wet).connect(speech);
      hall.push(delay, feedback, wet);
    }
    const v: Voice = { src, out, hall, tail: room ? ROOM_TAIL : HALL.tail, buf, rate: m.rate, offset: 0, startedAt: ctx.currentTime, held: false };
    voice = v;
    src.onended = () => {
      if (v.held || voice !== v) return;
      voice = null;
      release(v);
    };
    src.start();
    began?.(speaker, text, buf, m.rate);
  }

  return {
    say(speaker, text) {
      const id = clipOf(speaker, text);
      stop();
      const wanted = request;
      void known().then(() => {
        if (request !== wanted || !index?.has(id)) return undefined;
        return load(id).then((buf) => void (buf && request === wanted && play(speaker, text, buf)));
      });
    },
    ahead(speaker, texts) {
      void known().then(() => texts.forEach((t) => index?.has(clipOf(speaker, t)) && void load(clipOf(speaker, t))));
    },
    stop,
    hold(on) {
      const ctx = e.ctx;
      const v = voice;
      if (!v || !ctx) return;
      if (on) {
        if (v.held) return;
        v.offset = Math.min(v.buf.duration, v.offset + Math.max(0, ctx.currentTime - v.startedAt) * v.rate);
        v.held = true;
        v.src.onended = null;
        try {
          v.src.stop();
        } catch {
          // Already over.
        }
        return;
      }
      if (!v.held) return;
      if (v.offset >= v.buf.duration - 0.03) {
        voice = null;
        release(v);
        return;
      }
      const src = ctx.createBufferSource();
      src.buffer = v.buf;
      src.playbackRate.value = v.rate;
      src.connect(v.out);
      v.src = src;
      v.held = false;
      v.startedAt = ctx.currentTime;
      src.onended = () => {
        if (v.held || voice !== v) return;
        voice = null;
        release(v);
      };
      try {
        src.start(0, v.offset);
      } catch {
        voice = null;
        release(v);
      }
    },
    get speaking() {
      return voice !== null;
    },
  };
}
