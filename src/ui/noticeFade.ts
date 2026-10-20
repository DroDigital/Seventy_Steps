/**
 * How long a notice stands (round 58): the line in the middle of the screen that says a door is sealed, a place is closed, a parry landed.
 * It was up for 1.1 s and gone in the last 0.3, too brief to read the longer ones. Now it comes in quickly, stands in full for as long as its
 * words take to read, and then fades out slowly. Pure numbers; ui/hud.ts holds the clock.
 */

export const NOTICE = Object.freeze({
  base: 1600, // ms a notice stands in full, however short
  read: 55, // and each character's worth of reading beyond that
  max: 8000, // the longest it stands in full
  fadeIn: 180, // ms to appear
  fadeOut: 1700, // ms to fade away after it has stood
  queued: 3, // notices kept waiting while one stands
});

const clamp = (v: number, lo = 0, hi = 1): number => Math.min(hi, Math.max(lo, v));
const smooth = (t: number): number => { const c = clamp(t); return c * c * (3 - 2 * c); };

/** The ms a notice of these words stands in full. */
export const noticeHold = (text: string): number => Math.min(NOTICE.max, NOTICE.base + NOTICE.read * text.length);

/** Its opacity `age` ms after it was put up, having stood `hold` ms in full: in over a moment, out slowly after. */
export function noticeOpacity(age: number, hold: number): number {
  if (!(age >= 0)) return 0;
  if (age < hold) return smooth(age / NOTICE.fadeIn);
  return 1 - smooth((age - hold) / NOTICE.fadeOut);
}

/** Whether it has gone from the screen altogether. */
export const noticeGone = (age: number, hold: number): boolean => age >= hold + NOTICE.fadeOut;

/** The line in the middle of the screen as a clock: what is up, what waits, and when each is to go. `put` writes the words on the screen (a button named in them filled in) and says what it wrote. */
export interface NoticeBoard {
  /** A notice said at `now` ms: shown at once if nothing stands in full, else kept waiting; said again while it is up, it stands afresh and is not shown twice. */
  say(text: string, now: number): void;
  /** Takes the next that waits, once the one up has stood in full. */
  step(now: number): void;
  /** 0..1 at `now`. */
  opacity(now: number): number;
  /** What is up goes at once, and what waits is dropped (a death, a fall: round 58: a long notice outlasts the fall and came back after the waking). */
  clear(): void;
}

export function createNoticeBoard(put: (text: string) => string): NoticeBoard {
  const waiting: string[] = [];
  let at = -Infinity;
  let holds = 0;
  let up = '';
  const show = (text: string, now: number): void => {
    up = text;
    at = now;
    holds = noticeHold(put(text));
  };
  return {
    say(text, now) {
      if (!text || waiting.includes(text)) return;
      const age = now - at;
      if (text === up && !noticeGone(age, holds)) return void (at = now - NOTICE.fadeIn); // said again while it is up: it stands afresh at once, not twice
      if (age < holds) void (waiting.length < NOTICE.queued && waiting.push(text)); // it stands in full before the next takes its place (round 19: two at once, the first was lost)
      else show(text, now);
    },
    step(now) {
      if (waiting.length && now - at >= holds) show(waiting.shift()!, now);
    },
    opacity: (now) => noticeOpacity(now - at, holds),
    clear() {
      waiting.length = 0;
      [up, at, holds] = ['', -Infinity, 0];
      put('');
    },
  };
}
