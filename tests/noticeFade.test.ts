import { describe, expect, it } from 'vitest';
import { NOTICE, noticeGone, noticeHold, noticeOpacity } from '../src/ui/noticeFade';

describe('round 58: a notice stands long enough to read, and fades slowly', () => {
  it('stands longer for longer words, within bounds', () => {
    const [short, gate, vast] = ['PARRY', 'THE DOOR IS SEALED · 1 OF 4 GREAT HORRORS HAVE FALLEN', 'X'.repeat(500)];
    expect(noticeHold(short)).toBeGreaterThanOrEqual(NOTICE.base);
    expect(noticeHold(gate)).toBeGreaterThan(noticeHold(short));
    expect(noticeHold(gate)).toBeGreaterThan(4000); // the gate's line was up for 1.1 s
    expect(noticeHold(vast)).toBe(NOTICE.max);
  });

  it('comes in at once, stands in full, and goes out gradually (never in a single step)', () => {
    const hold = noticeHold('THE DOOR IS SEALED');
    expect(noticeOpacity(0, hold)).toBe(0);
    expect(noticeOpacity(NOTICE.fadeIn, hold)).toBe(1);
    expect(noticeOpacity(hold - 1, hold)).toBe(1);
    let last = 1;
    for (let age = hold; age <= hold + NOTICE.fadeOut; age += 50) {
      const o = noticeOpacity(age, hold);
      expect(o).toBeLessThanOrEqual(last + 1e-9);
      expect(last - o).toBeLessThan(0.1); // a slow fade: a tenth or less in fifty milliseconds
      last = o;
    }
    expect(noticeOpacity(hold + NOTICE.fadeOut, hold)).toBe(0);
    expect(noticeGone(hold + NOTICE.fadeOut - 1, hold)).toBe(false);
    expect(noticeGone(hold + NOTICE.fadeOut, hold)).toBe(true);
  });

  it('is not shown before it is put up', () => {
    expect(noticeOpacity(-5, 2000)).toBe(0);
    expect(noticeOpacity(NaN, 2000)).toBe(0);
  });
});
