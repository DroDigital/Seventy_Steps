/**
 * No one is in view through the wake (round 39): a new game opens on the investigator alone in a strange town,
 * and the people at the sign are not there to be seen; once it has ended they come into the picture out of the
 * dark, a dither at a time, where they were (they are beside the sign: nothing hides them from the one who looks).
 * Held from the start of a game that will wake (through the intro's cards, which are read at the player's pace);
 * if the scene then never plays, they are let go after a while.
 */

export interface NpcVeil {
  /** 1 while they are hidden, falling to 0 as they come into view (`now`: wall seconds). */
  value(now: number): number;
  /** The world has shown (the intro's cards are done): the wake should begin soon. */
  arm(now: number): void;
}

const DELAY = 0.9; // seconds after the wake ends before the first of them shows
const FADE = 2.6; // seconds to be whole
const GIVE_UP = 25; // seconds, from the world showing, a wake that never begins is waited for

/** `wakes`: the game is a new one that opens on the wake; `active` and `scene` say what cinema is playing. */
export function createNpcVeil(wakes: boolean, cinema: { readonly active: boolean; readonly sceneId: string }): NpcVeil {
  let armedAt: number | null = null;
  let seen = false;
  let endedAt: number | null = null;
  return {
    arm(now) {
      armedAt ??= now;
    },
    value(now) {
      if (!wakes) return 0;
      const wake = cinema.active && cinema.sceneId === 'wake';
      if (wake) {
        seen = true;
        endedAt = null;
        return 1;
      }
      if (!seen) return armedAt !== null && now - armedAt > GIVE_UP ? 0 : 1; // not begun: still to come
      endedAt ??= now;
      return 1 - Math.min(1, Math.max(0, (now - endedAt - DELAY) / FADE));
    },
  };
}
