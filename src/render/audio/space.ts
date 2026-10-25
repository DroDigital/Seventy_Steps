/**
 * The room the one-shots are heard in (round 80). The engine's one-shots (and a share of its bed) are tapped into a send:
 * a low cut, a pre-delay, a short ROOM and a long HALL (two convolvers, their impulses made in code: audio/spaceImpulse.ts),
 * and a low-pass on the answer, which returns to the sanity shaper beside the dry sound, so the failing mind's distortion, the
 * near-death muffle, the limiter and the effects and ambience settings govern it with no setting of its own. Where the
 * investigator stands says how much goes to each and how dark it is (audio/spacePlan.ts); they glide over about a second, and
 * are told only of a change. The convolvers can be let go (`enable(false)`) on a machine that cannot spare them.
 */

import { SPACE, SPACES, type SpaceRow } from '../../data/acoustics';
import { spaceImpulse } from './spaceImpulse';

export interface SpaceBus {
  /** Plays `row` (its wet times `wet`), gliding there. Asked every look; the nodes are told only of a change. */
  set(row: SpaceRow, wet?: number): void;
  /** Lets the convolvers go (false) or takes them up again (true). */
  enable(on: boolean): void;
  /** What was last asked, and whether the convolvers are in (for the debug hooks: `audio.space.state`). */
  readonly state: Readonly<SpaceRow & { on: boolean; wet: number }>;
}

const closer = (a: number, b: number, tol: number): boolean => Math.abs(a - b) <= tol;

/** Builds the send from the engine's one-shots `sfx` and `bed` to `out` (the sanity shaper's input), standing in the open air unless told of `start` (an offline render begins in the room it renders). */
export function createSpaceBus(ctx: AudioContext, sfx: AudioNode, bed: AudioNode, out: AudioNode, start: SpaceRow = SPACES.open): SpaceBus {
  const open = start;
  const sendSfx = ctx.createGain();
  sendSfx.gain.value = SPACE.sfx;
  const sendBed = ctx.createGain();
  sendBed.gain.value = open.bed;
  const input = ctx.createGain();
  const cut = ctx.createBiquadFilter();
  cut.type = 'highpass';
  cut.frequency.value = SPACE.hpHz;
  cut.Q.value = 0.5;
  const pre = ctx.createDelay(0.2);
  pre.delayTime.value = open.pre / 1000;
  const feeds = [ctx.createGain(), ctx.createGain()]; // [room, hall]
  feeds[0]!.gain.value = open.room;
  feeds[1]!.gain.value = open.hall;
  const convolvers = [ctx.createConvolver(), ctx.createConvolver()];
  convolvers.forEach((c, i) => {
    c.normalize = false; // (before the buffer: the impulse carries its own unit of energy)
    c.buffer = spaceImpulse(ctx, i === 0 ? 'room' : 'hall', i === 0 ? SPACE.room : SPACE.hall);
  });
  const dull = ctx.createBiquadFilter();
  dull.type = 'lowpass';
  dull.frequency.value = open.dark;
  dull.Q.value = 0.5;
  sfx.connect(sendSfx).connect(input);
  bed.connect(sendBed).connect(input);
  input.connect(cut).connect(pre);
  convolvers.forEach((c, i) => pre.connect(feeds[i]!).connect(c).connect(dull));
  dull.connect(out);

  const sent = { room: open.room, hall: open.hall, bed: open.bed, dark: open.dark, pre: open.pre }; // what the nodes were last told
  const state = { ...open, on: true, wet: 1 };
  return {
    state,
    set(row, wet = 1) {
      const t = ctx.currentTime;
      const [room, hall, send] = [row.room * wet, row.hall * wet, row.bed * wet];
      if (!closer(room, sent.room, 0.002)) feeds[0]!.gain.setTargetAtTime((sent.room = room), t, SPACE.slide);
      if (!closer(hall, sent.hall, 0.002)) feeds[1]!.gain.setTargetAtTime((sent.hall = hall), t, SPACE.slide);
      if (!closer(send, sent.bed, 0.002)) sendBed.gain.setTargetAtTime((sent.bed = send), t, SPACE.slide);
      if (!closer(Math.log(row.dark), Math.log(sent.dark), 0.03)) dull.frequency.setTargetAtTime((sent.dark = Math.min(ctx.sampleRate * 0.45, Math.max(300, row.dark))), t, SPACE.slide);
      if (!closer(row.pre, sent.pre, 0.5)) pre.delayTime.setTargetAtTime((sent.pre = row.pre) / 1000, t, SPACE.preSlide);
      Object.assign(state, row, { wet });
      state.echo = row.echo; // (a room with none leaves no echo of the last one)
    },
    enable(on) {
      if (on === state.on) return;
      state.on = on;
      try {
        if (on) feeds.forEach((f) => pre.connect(f));
        else pre.disconnect(); // (the convolvers are given nothing, and idle once their tails are out)
      } catch {
        /* a graph that will not be re-made stays as it is */
      }
    },
  };
}
