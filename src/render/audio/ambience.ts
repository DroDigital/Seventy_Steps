/**
 * Recorded ambience (playtest round 6): where the investigator stands, its beds (data/samples.ts)
 * loop under the drone. Each bed is read twice, half a loop apart and panned apart, so one mono
 * recording surrounds the listener without repeating in step. Another place's beds crossfade in over
 * AUDIO.fade as the last ones fade, once they have loaded; faded, the last place's beds are let go (a
 * decoded bed is megabytes). Spot sounds come now and then, far off: panned anywhere, dulled, each at
 * random within its interval.
 *
 * Round 80: the night is heard and the place is placed. Outdoors in the open world each reader has a gain of the hour (the insects
 * thin as the night deepens and sink in the Still, the wind lifts toward the last grey: data/ambienceHours.ts), and, by the
 * land about the investigator (render/audio/exposure.ts), the sea beds are loud, bright and drawn toward the water on the shore and
 * far and dull inland, the wind beds rise and brighten on a height and drop in a lee (render/audio/bedShape.ts). The spots come
 * oftener or rarer by the hour, hold through the Still, and the hull and the gurgle come from the water.
 *
 * Round 124: a bed may be made in code (`gen_`, render/audio/bedTextures.ts: drawn once for the context, a while after sound starts, so no
 * room waits on one; a loop that closes on itself, with no encoder's padding to skip), a spot may be a recipe (data/roomSounds.ts) at its
 * own level and through its own wall, and a seep comes again from the same place at the same pitch a few times (`run`) before it is still.
 */

import { hourOf, phaseOf } from '../../systems/clock';
import { spotHour, stillLeft, stillOf } from '../../data/ambienceHours';
import { SEA_PLACE } from '../../data/ambienceRoles';
import { ROOM_SOUNDS } from '../../data/roomSounds';
import { AMBIENCE, BED_MANNER, BED_TRIM, SAMPLE_SETS, SPOT_TRIM, type Ambience, type Spot } from '../../data/samples';
import { AUDIO } from '../../data/tuning';
import { bedTexture, GENERATED_BEDS, generatedOf, TEXTURE, type GeneratedBed } from './bedTextures';
import { shapeBed, spotPlace, type BedWorld } from './bedShape';
import type { AudioEngine } from './engine';
import { PLACED } from './exposure';
import type { Sampler } from './sampler';
import { playSound } from './synth';
import { createVarier } from './vary';

export interface AmbienceBeds {
  /** Holds `a` (null: silence). Its beds start once they have loaded. */
  set(a: Ambience | null): void;
  /** Spot sounds, on the game's clock (seconds). */
  update(seconds: number): void;
}

const EDGE = 0.06; // seconds of each end a loop skips: an MP3's encoder padding, where a browser keeps it
const AMBIENCE_WARM = 1500; // ms between the made beds being drawn, after sound starts (round 124: each takes a few hundredths of a second)
const WIDTH = 0.6; // how far apart a bed's two readers are panned

/** One reading of a bed: the nodes the hour and the place shape (round 80). */
interface Reader {
  file: string;
  side: number;
  base: number | undefined; // its own cutoff (BED_MANNER)
  hour: GainNode;
  soft: BiquadFilterNode | null;
  pan: StereoPannerNode;
  lean: number; // how far toward the water it was last drawn
}

interface Playing {
  a: Ambience;
  readers: Reader[];
  stop(): void;
}

const SHAPE_EVERY = 0.5; // seconds between the hour and the place being told to the beds...
const SHAPE_TAU = 3; // ...which follow them over this long
const PAN_TAU = 0.15; // and the stereo, which a turning head asks for every frame, this quickly

/** When a spot next sounds: `now` plus a wait drawn from its interval. */
export const nextSpot = (s: Spot, now: number, rand: () => number): number => now + s.every[0] + (s.every[1] - s.every[0]) * rand();

/** The same, the oftener the more `weight` (the hour's: data/ambienceHours.ts `SPOT_HOURS`). */
export const nextSpotAt = (s: Spot, now: number, rand: () => number, weight: number): number => now + (nextSpot(s, 0, rand)) / Math.max(0.1, weight);

/** Whether the hour applies to these beds: outdoors in the open world (a roof, the arena and the title have their own). */
const hourly = (a: Ambience): boolean => !a.roofed && a !== AMBIENCE.arena && a !== AMBIENCE.title;

const between = ([lo, hi]: readonly [number, number]): number => lo + (hi - lo) * Math.random();
const bare = (file: string): string => file.replace(/\.\w+$/, '');
/** The beds of `a` that are recordings to fetch (the made ones are drawn here). */
const fetched = (a: Ambience): string[] => a.beds.map(([file]) => file).filter((f) => !generatedOf(bare(f)));

const made = new WeakMap<BaseAudioContext, Map<GeneratedBed, AudioBuffer>>();
/** A made bed's loop as a buffer of `ctx`, drawn once (round 124). */
function madeBed(ctx: BaseAudioContext, id: GeneratedBed): AudioBuffer {
  let all = made.get(ctx);
  if (!all) made.set(ctx, (all = new Map()));
  let buf = all.get(id);
  if (!buf) {
    const x = bedTexture(id);
    buf = ctx.createBuffer(1, x.length, TEXTURE.rate);
    buf.copyToChannel(x, 0);
    all.set(id, buf);
  }
  return buf;
}

/** What the beds are told of the world at `seconds`. */
const worldOf = (a: Ambience, seconds: number): BedWorld => ({ hourly: hourly(a), placed: PLACED.on && hourly(a), phase: phaseOf(seconds), shore: PLACED.shore, pan: PLACED.pan, exposure: PLACED.exposure });

/** A reader's pan: apart on its side, drawn toward the water's bearing by `lean`. */
const panOf = (side: number, lean: number): number => side * WIDTH * (1 - lean) + lean * PLACED.pan * SEA_PLACE.reach;

export function createAmbience(e: AudioEngine, sampler: Sampler): AmbienceBeds {
  let want: Ambience | null = null;
  let playing: Playing | null = null;
  let spots: { spot: Spot; next: number }[] = [];
  let seeping: { at: number; play: () => void }[] = []; // the drops still to come of a seep (round 124)
  const vary = createVarier();
  let clock = 0;
  e.onStart?.((ctx) => GENERATED_BEDS.forEach((id, k) => setTimeout(() => madeBed(ctx, id), AMBIENCE_WARM * (k + 1)))); // (each made bed drawn a while after sound starts, one at a time, before a room asks for it)
  let asked: Ambience | null = null; // whose beds are loading
  let shaped = -Infinity; // the seconds the beds were last told of the hour and the place

  /** The hour and the place told to the beds (every SHAPE_EVERY, followed over SHAPE_TAU), and the stereo of the sea's, which follows a turning head every frame. */
  function shape(seconds: number): void {
    const { ctx } = e;
    if (!ctx || !playing) return;
    const t = ctx.currentTime;
    if (seconds - shaped >= SHAPE_EVERY || seconds < shaped) {
      shaped = seconds;
      const world = worldOf(playing.a, seconds);
      for (const r of playing.readers) {
        const s = shapeBed(r.file, r.base, world);
        r.hour.gain.setTargetAtTime(s.gain, t, SHAPE_TAU);
        if (r.soft && s.cutoff) r.soft.frequency.setTargetAtTime(s.cutoff, t, SHAPE_TAU);
        r.lean = s.lean;
        r.pan.pan.setTargetAtTime(panOf(r.side, s.lean), t, PAN_TAU);
      }
    } else for (const r of playing.readers) if (r.lean > 0) r.pan.pan.setTargetAtTime(panOf(r.side, r.lean), t, PAN_TAU); // (the sea's, toward the water, as the head turns)
  }

  function start(ctx: AudioContext, out: AudioNode, a: Ambience): Playing {
    const now = ctx.currentTime;
    const level = ctx.createGain();
    level.gain.setValueAtTime(0, now);
    level.gain.linearRampToValueAtTime(1, now + AUDIO.fade);
    level.connect(out);
    const sources: (AudioBufferSourceNode | OscillatorNode)[] = [];
    const readers: Reader[] = [];
    const world = worldOf(a, clock);
    for (const [file, gain] of a.beds) {
      const name = bare(file);
      const manner = BED_MANNER[name] ?? {};
      const gen = generatedOf(name);
      const buf = gen ? madeBed(ctx, gen) : sampler.buffer(`amb/${file}`);
      if (!buf || buf.duration < 4 * EDGE) continue;
      const edge = gen ? 0 : EDGE; // (a made loop closes on itself: there is no encoder's padding to skip)
      for (const side of [-1, 1]) {
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.loop = true;
        [src.loopStart, src.loopEnd] = [edge, buf.duration - edge];
        const g = ctx.createGain();
        const top = gain * (BED_MANNER[name] ? BED_TRIM.eased : BED_TRIM.rest) * Math.SQRT1_2; // two unrelated readers sum to the bed's level
        const breath = manner.breath ?? 0;
        g.gain.value = top * (1 - breath / 2);
        if (breath > 0) { // it swells and falls back, never above the bed's level, each reader on its own slow round
          const lfo = ctx.createOscillator();
          const [lo, hi] = manner.every ?? [40, 80];
          lfo.frequency.value = 1 / (lo + (hi - lo) * Math.random());
          const depth = ctx.createGain();
          depth.gain.value = (top * breath) / 2;
          lfo.connect(depth).connect(g.gain);
          lfo.start(now + Math.random() * 20); // from anywhere in its round
          sources.push(lfo);
        }
        const pan = ctx.createStereoPanner();
        const shaped = shapeBed(name, manner.lowpass, world);
        pan.pan.value = panOf(side, shaped.lean);
        const hour = ctx.createGain(); // round 80: the hour's and the place's share of the bed, after its own breath
        hour.gain.value = shaped.gain;
        let soft: BiquadFilterNode | null = null;
        let chain: AudioNode = src.connect(g);
        if (manner.lowpass) {
          soft = ctx.createBiquadFilter();
          soft.type = 'lowpass';
          soft.frequency.value = shaped.cutoff ?? manner.lowpass;
          chain = chain.connect(soft);
        }
        chain.connect(hour).connect(pan).connect(level);
        src.start(now, side < 0 ? edge : buf.duration / 2);
        sources.push(src);
        readers.push({ file: name, side, base: manner.lowpass, hour, soft, pan, lean: shaped.lean });
      }
    }
    return {
      a,
      readers,
      stop() {
        const t = ctx.currentTime;
        level.gain.cancelScheduledValues(t);
        level.gain.setValueAtTime(level.gain.value, t);
        level.gain.linearRampToValueAtTime(0, t + AUDIO.fade);
        for (const s of sources) s.stop(t + AUDIO.fade + 0.1);
        setTimeout(() => {
          const keep = new Set(want?.beds.map(([file]) => file));
          sampler.forget(fetched(a).filter((f) => !keep.has(f)).map((f) => `amb/${f}`)); // decoded, a bed is megabytes (a made one is kept: drawn once)
        }, (AUDIO.fade + 0.5) * 1000);
      },
    };
  }

  function reconcile(): void {
    const { ctx, bed } = e;
    if (!ctx || !bed || playing?.a === want) return;
    const a = want;
    if (a === null) {
      playing?.stop();
      playing = null;
      spots = [];
      seeping = [];
      return;
    }
    if (!fetched(a).every((file) => sampler.settled(`amb/${file}`))) {
      if (asked !== a) void sampler.load(fetched(a).map((file) => `amb/${file}`)).then(() => want === a && reconcile()); // until then the last beds play on
      asked = a;
      return;
    }
    playing?.stop();
    playing = start(ctx, bed, a);
    spots = a.spots.map((spot) => ({ spot, next: nextSpot(spot, clock, Math.random) }));
    seeping = [];
  }

  /** One spot, where `at` says: a recording or a recipe, at its own level and through its own wall (else dulled as far off); a seep's further drops are kept to come. */
  function sound(spot: Spot, at: { pan: number; gain: number }, seconds: number): void {
    const gain = SPOT_TRIM * at.gain * (spot.gain ?? 1);
    const lowpass = spot.lowpass ?? 2500 + 3500 * Math.random();
    const bus = e.bed ?? undefined;
    const play = (k: number, pitch: number | undefined): boolean =>
      spot.recipe ? playSound(e, vary(`room:${spot.recipe}`, ROOM_SOUNDS[spot.recipe], spot.run ? 0.35 : 1), { gain: gain * k, pan: at.pan, pitch, lowpass, bus }) : !!spot.set && sampler.play(SAMPLE_SETS[spot.set], { gain: gain * k, pan: at.pan, pitch, lowpass, bus });
    const pitch = spot.pitch ? between(spot.pitch) : undefined;
    play(1, pitch);
    if (!spot.run) return;
    const [drops, gap] = [Math.round(between(spot.run.count)), between(spot.run.gap)];
    for (let k = 1; k < drops; k++) seeping.push({ at: seconds + k * gap * (1 + 0.05 * (Math.random() * 2 - 1)), play: () => void play(0.8 + 0.2 * Math.random(), pitch && pitch * (1 + 0.008 * (Math.random() * 2 - 1))) }); // (the same drop from the same place, near enough the same each time)
  }

  return {
    set(a) {
      if (a === want) return;
      want = a;
      reconcile();
    },
    update(seconds) {
      clock = seconds;
      reconcile();
      shape(seconds);
      for (const s of spots) {
        if (seconds < s.next || !playing) continue;
        const world = worldOf(playing.a, seconds);
        if (world.hourly && stillOf(world.phase) > 0.2) { // the world holds its breath: the spots hold with it
          s.next = seconds + stillLeft(world.phase) + 4 + s.spot.every[0] * Math.random() * 0.5; // (not all at once as it ends)
          continue;
        }
        s.next = world.hourly && s.spot.set ? nextSpotAt(s.spot, seconds, Math.random, spotHour(s.spot.set, hourOf(world.phase))) : nextSpot(s.spot, seconds, Math.random);
        sound(s.spot, spotPlace(s.spot.set ?? '', world, Math.random() * 2 - 1), seconds);
      }
      if (seeping.some((d) => d.at <= seconds)) {
        const due = seeping.filter((d) => d.at <= seconds);
        seeping = seeping.filter((d) => d.at > seconds);
        if (playing) for (const d of due) d.play();
      }
    },
  };
}
