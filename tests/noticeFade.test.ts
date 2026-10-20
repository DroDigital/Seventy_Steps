import { describe, expect, it } from 'vitest';
import { NOTICE, createNoticeBoard, noticeGone, noticeHold, noticeOpacity } from '../src/ui/noticeFade';

describe('round 58: a notice stands long enough to read, and fades slowly', () => {
  it('stands longer for longer words, within bounds', () => {
    const [short, gate, vast] = ['PARRY', 'THE DOOR IS SEALED · 1 OF 4 GREAT HORRORS HAVE FALLEN', 'X'.repeat(500)];
    expect(noticeHold(short)).toBeGreaterThanOrEqual(NOTICE.base);
    expect(noticeHold(gate)).toBeGreaterThan(noticeHold(short));
    expect(noticeHold(gate)).toBeGreaterThan(2000); // the gate's line was up for 1.1 s, then 4.5 s; it is read in about two and a quarter
    expect(noticeHold(gate) + NOTICE.fadeOut).toBeLessThan(3500); // and is gone in about three, half what it was
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

describe('round 58: the board that keeps the line in the middle of the screen', () => {
  const GATE = 'THE DOOR IS SEALED · 1 OF 4 GREAT HORRORS HAVE FALLEN';
  const rig = () => {
    const screen = { text: '' };
    const board = createNoticeBoard((t) => (screen.text = t));
    return { screen, board };
  };

  it('shows a notice at once, keeps the next waiting until the one up has stood in full, and then shows it', () => {
    const { screen, board } = rig();
    board.say(GATE, 0);
    expect(screen.text).toBe(GATE);
    board.say('PARRY', 500);
    expect(screen.text).toBe(GATE); // waits
    board.step(noticeHold(GATE) - 1);
    expect(screen.text).toBe(GATE);
    board.step(noticeHold(GATE));
    expect(screen.text).toBe('PARRY');
  });

  it('a notice said again while it is up stands afresh instead of twice', () => {
    const { screen, board } = rig();
    board.say('PARRY', 0);
    const hold = noticeHold('PARRY');
    board.say('PARRY', hold + 500); // in its fade
    expect(board.opacity(hold + 500)).toBe(1);
    board.step(hold * 3);
    expect(screen.text).toBe('PARRY');
    board.say('RIPOSTE', hold + 600);
    board.say('RIPOSTE', hold + 700);
    board.step(hold * 10);
    expect(screen.text).toBe('RIPOSTE'); // once
  });

  it('keeps at most NOTICE.queued waiting', () => {
    const { screen, board } = rig();
    board.say('A', 0);
    for (const t of ['B', 'C', 'D', 'E', 'F']) board.say(t, 10);
    const seen: string[] = [screen.text];
    for (let now = 10_000; now < 100_000; now += 10_000) {
      board.step(now);
      if (screen.text !== seen[seen.length - 1]) seen.push(screen.text);
    }
    expect(seen).toEqual(['A', 'B', 'C', 'D']);
    expect(NOTICE.queued).toBe(3);
  });

  it('a death or a fall takes the notice that is up, and what waits, and it does not come back at the waking (Codex, PR 146)', () => {
    const { screen, board } = rig();
    board.say(GATE, 0);
    board.say('PARRY', 100);
    expect(board.opacity(1000)).toBe(1);
    board.clear(); // the fall begins at 1 s
    expect(screen.text).toBe('');
    expect(board.opacity(1000)).toBe(0);
    // the waking, after the dying: a notice's own hold (2.2 s) and fade would have run on
    for (const now of [2500, 3000, 4600, 5500, 60_000]) {
      board.step(now);
      expect(board.opacity(now), `at ${now}`).toBe(0);
      expect(screen.text).toBe('');
    }
    board.say(GATE, 70_000); // and the next notice shows as the first
    expect(screen.text).toBe(GATE);
    expect(board.opacity(70_000 + NOTICE.fadeIn)).toBe(1);
  });

  it('clearing an empty board does nothing, and a notice said just after a clear is shown', () => {
    const { screen, board } = rig();
    board.clear();
    expect(board.opacity(0)).toBe(0);
    board.say('PARRY', 0);
    board.clear();
    board.say('PARRY', 1);
    expect(screen.text).toBe('PARRY');
  });
});
