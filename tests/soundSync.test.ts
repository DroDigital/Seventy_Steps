import { describe, expect, it } from 'vitest';
import { ACT_CUES, actCues, TIMING } from '../src/data/actBeats';
import { DOOR_LOOKS } from '../src/data/doors';
import { doorSound } from '../src/data/doorSounds';
import { ACTS, HAND_FRAMES, HANDS, mistPass } from '../src/data/foleySounds';
import { PLAYER_MOVES } from '../src/data/moves';
import { SAMPLE_SETS } from '../src/data/samples';
import { SAMPLE_LEVELS } from '../src/data/sampleLevels';
import { armedMoves } from '../src/data/weapons';
import { WEAPON_IDS } from '../src/data/weapons';
import { STINGERS } from '../src/data/sounds';
import { SIM } from '../src/data/tuning';
import { DOOR_KINDS } from '../src/render/doorViews';
import { render } from './soundRender';

const frames = (sec: number): number => sec * SIM.hz;

describe('a sound lasts as long as the motion it goes with (round 40)', () => {
  const move = (id: keyof typeof PLAYER_MOVES) => PLAYER_MOVES[id] as { frames: number; item?: number; volley?: { frame: number }; parry?: readonly [number, number] };

  it("the investigator's hands: each sound begins on a frame of its move, and is over by the move's end", () => {
    const plan: [keyof typeof PLAYER_MOVES, keyof typeof HANDS, number][] = [
      ['parry', 'guard', HAND_FRAMES.parry.guard],
      ['drink', 'swallow', HAND_FRAMES.drink.swallow],
      ['inject', 'needle', HAND_FRAMES.inject.needle],
      ['inject', 'plunger', HAND_FRAMES.inject.plunger],
      ['throw', 'glug', HAND_FRAMES.throw.glug],
      ['throw', 'lob', HAND_FRAMES.throw.lob],
    ];
    for (const [m, sound, at] of plan) {
      const def = move(m);
      const r = render(HANDS[sound]);
      expect(at, `${sound} begins inside ${m}`).toBeGreaterThanOrEqual(0);
      expect(at, `${sound} begins inside ${m}`).toBeLessThan(def.frames);
      expect(at + frames(r.sec), `${m}: ${sound} is over within it (${def.frames} frames)`).toBeLessThanOrEqual(def.frames + 4);
    }
  });

  it('the draught: cork at frame 10, then the swallow, the item on its own frame between; the bottle is set down as the move ends', () => {
    const swallow = render(HANDS.swallow);
    expect(HAND_FRAMES.drink.swallow).toBeGreaterThan(10); // after the cork (render/audio/foley.ts)
    expect(HAND_FRAMES.drink.swallow).toBeLessThanOrEqual(move('drink').item! - 2); // the first swallow is before the dose is taken
    expect(HAND_FRAMES.drink.swallow + frames(swallow.sec)).toBeGreaterThan(move('drink').frames - 12); // and the sound reaches the end
  });

  it('the needle is in by the item frame and the plunger sounds with it', () => {
    const item = move('inject').item!;
    expect(HAND_FRAMES.inject.needle + frames(render(HANDS.needle).sec)).toBeLessThanOrEqual(item + 2);
    expect(Math.abs(HAND_FRAMES.inject.plunger - item)).toBeLessThanOrEqual(4);
  });

  it("the lob's whoosh is ending as the flask leaves the hand", () => {
    const release = move('throw').volley!.frame;
    const lob = render(HANDS.lob);
    const end = HAND_FRAMES.throw.lob + frames(lob.sec);
    expect(end).toBeGreaterThanOrEqual(release - 4);
    expect(end).toBeLessThanOrEqual(release + 8);
  });

  it("the roll and the backstep's scuffs are on frames of their moves (render/audio/foley.ts)", () => {
    expect(5).toBeLessThan(PLAYER_MOVES.roll.frames);
    expect(26).toBeLessThan(PLAYER_MOVES.roll.frames);
    expect(10).toBeLessThan(PLAYER_MOVES.backstep.frames);
  });

  it("every arm's blows are heard as they are struck: the whoosh begins before the hit window, close to it, and is not far longer than the move", () => {
    const lead = 4; // render/audio/foley.ts SWING_LEAD
    const dur = (set: 'swingLight' | 'swingHeavy'): number => SAMPLE_SETS[set].files.reduce((n, f) => n + SAMPLE_LEVELS[`sfx/${f}`].sec, 0) / SAMPLE_SETS[set].files.length;
    for (const id of WEAPON_IDS) {
      for (const [name, def] of Object.entries(armedMoves(id))) {
        if (!name.startsWith('light') && !name.startsWith('heavy')) continue;
        const hit = (def as { frames: number; hit?: { window: readonly [number, number]; poise: number } }).hit;
        if (!hit) continue;
        const start = Math.max(0, hit.window[0] - lead);
        const heavy = name.startsWith('heavy') || hit.poise >= 30;
        const sec = dur(heavy ? 'swingHeavy' : 'swingLight');
        expect(start, `${id} ${name}`).toBeLessThanOrEqual(hit.window[0]);
        expect(start + frames(sec), `${id} ${name}: its whoosh outlasts the move (${(def as { frames: number }).frames} frames)`).toBeLessThanOrEqual((def as { frames: number }).frames + 14);
        expect(frames(sec), `${id} ${name}: its whoosh is over before the blow lands`).toBeGreaterThan(lead);
      }
    }
  });

  it('the reload: the rounds are heard going in before the item frame, and the cylinder closes on it', () => {
    const r = render(STINGERS.reload);
    const item = PLAYER_MOVES.reload.item;
    expect(frames(r.sec)).toBeLessThanOrEqual(item);
    expect(frames(r.sec)).toBeGreaterThan(item * 0.6);
    expect(PLAYER_MOVES.reload.frames).toBeGreaterThan(item);
  });

  it("the doors: their sound is the swing's length, which is the leaf's time to move (data/doorSounds.ts)", () => {
    for (const look of Object.values(DOOR_LOOKS)) {
      const swing = DOOR_KINDS[look!.kind].seconds;
      const d = doorSound(look!, swing, false, () => 0.5);
      const end = Math.max(...d.sound.map((l) => (l.at ?? 0) + l.dur));
      expect(end).toBeGreaterThan(swing - 0.05);
      expect(end).toBeLessThan(swing + d.tail + 0.5);
    }
  });

  it("the mist wall's sound is the walk through it, whatever its length: it swells to the middle and is gone as it ends", () => {
    for (const walk of [0.67, 1.5, 3, 5]) {
      const r = render(mistPass(walk));
      expect(r.sec).toBeGreaterThan(walk * 0.45);
      expect(r.sec).toBeLessThanOrEqual(walk + 0.1);
      const peakAt = r.samples.reduce((best, s, i) => (Math.abs(s) > Math.abs(r.samples[best]) ? i : best), 0) / 22050;
      expect(peakAt).toBeGreaterThan(walk * 0.25);
      expect(peakAt).toBeLessThan(walk * 0.75);
    }
  });

  it('the people: each act sounds on its own beat, inside the window of the motion it makes', () => {
    const inPulse = (t: number, [period, from, len]: readonly [number, number, number, number?]): boolean => {
      const u = (((t % period) + period) % period) - from;
      return u >= 0 && u <= len;
    };
    const turn = actCues('read', 0, 66, () => 1);
    expect(turn.length).toBe(6); // a page every eleven seconds
    for (const { t } of turn) expect(inPulse(t, TIMING.read.turn)).toBe(true);
    const draws = actCues('lounge', 0, 60, () => 1);
    expect(draws.filter((c) => c.cue.sound === 'inhale').every(({ t }) => inPulse(t, TIMING.pipe.draw))).toBe(true);
    expect(draws.filter((c) => c.cue.sound === 'exhale').every(({ t }) => inPulse(t, TIMING.pipe.out))).toBe(true);
    for (const { t } of actCues('write', 0, 140, () => 1)) expect(inPulse(t, TIMING.write.think), 'no scratching while they think').toBe(false);
    for (const { t } of actCues('whittle', 0, 120, () => 1)) expect(inPulse(t, TIMING.whittle.look), 'no scraping while they look').toBe(false);
    for (const { t } of actCues('watch', 0, 130, () => 1)) expect(inPulse(t, TIMING.watch.listen), 'the watch is heard at the ear').toBe(true);
    for (const { t } of actCues('lean', 0, 80, () => 1)) expect(inPulse(t, TIMING.lean.tap)).toBe(true);
    for (const { t } of actCues('drink', 0, 170, () => 1)) expect(inPulse(t, TIMING.drink.sup), 'drunk while the bottle is up').toBe(true);
  });

  it('the acts: each cue fits in the time between its repeats, and no two of a kind overlap', () => {
    for (const [kind, cues] of Object.entries(ACT_CUES)) {
      for (const cue of cues!) {
        const length = render(ACTS[cue.sound]).sec;
        const gap = cue.every ?? cue.period;
        expect(length, `${kind} ${cue.sound} is shorter than the time before it comes again`).toBeLessThan(gap + 0.001);
      }
    }
  });
});
