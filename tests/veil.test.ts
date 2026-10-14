import { describe, expect, it } from 'vitest';
import { DUNGEONS } from '../src/data/dungeons';
import { UPGRADES } from '../src/data/tuning';
import { closedBy, heldOpen, listed, PASSAGES } from '../src/systems/veil';

describe('what insight holds open, and what spending it would shut', () => {
  it('lists every doorway and bridge that waits on insight, once', () => {
    const wanted = DUNGEONS.flatMap((d) => d.rooms.filter((r) => r.hidden?.minInsight !== undefined).map((r) => `${d.id}/${r.id}`));
    expect(PASSAGES.length).toBe(wanted.length);
    expect(PASSAGES.length).toBeGreaterThan(10);
    expect(PASSAGES.find((p) => p.dungeon === 'The Witch House' && p.room === 'closet')?.need).toBe(1);
    expect(PASSAGES.find((p) => p.room === 'earth race')?.need).toBe(1); // an id with an underscore reads as words
  });

  it('holds open exactly those the insight reaches', () => {
    expect(heldOpen(0)).toEqual([]);
    expect(heldOpen(1).every((p) => p.need <= 1)).toBe(true);
    expect(heldOpen(3).length).toBe(PASSAGES.length);
    expect(heldOpen(2).length).toBeGreaterThan(heldOpen(1).length);
  });

  it('shuts a passage only when what is left falls below what it needs', () => {
    const witch = (n: number) => closedBy(n, UPGRADES.resolve.cost).filter((p) => p.dungeon === 'The Witch House').map((p) => p.room);
    expect(witch(2).sort()).toEqual(['burrow', 'closet']); // 2 − 2 = 0: both the closet (1) and the burrow (2) shut
    expect(witch(1)).toEqual([]); // a cost of 2 cannot be paid from 1: nothing shuts for it here, the purchase is refused
    expect(closedBy(3, 2).map((p) => p.room)).not.toContain('closet'); // 3 − 2 = 1: the closet stays open
    expect(closedBy(3, 2).map((p) => p.room)).toContain('burrow');
    expect(closedBy(0, 2)).toEqual([]); // nothing open, nothing to shut
    expect(closedBy(5, 2).map((p) => p.need).every((n) => n > 3)).toBe(true);
  });

  it('says them in words, and trims a long list', () => {
    expect(listed([])).toBe('');
    expect(listed(PASSAGES.slice(0, 1))).toBe(`${PASSAGES[0].dungeon}: ${PASSAGES[0].room}`);
    expect(listed(PASSAGES, 2)).toMatch(/; and \d+ more$/);
  });

  it('counts only what is still to be found: a passage whose tome is read is no loss', () => {
    const read = new Set(["Keziah's Formulae"]);
    expect(heldOpen(1, read).some((p) => p.room === 'closet')).toBe(false);
    expect(heldOpen(1).some((p) => p.room === 'closet')).toBe(true);
    expect(closedBy(2, 2, read).map((p) => p.room)).toContain('burrow'); // its diary is not read
    expect(closedBy(2, 2, read).map((p) => p.room)).not.toContain('closet');
    const all = new Set(PASSAGES.flatMap((p) => (p.tome ? [p.tome] : [])));
    expect(heldOpen(3, all).every((p) => p.tome === undefined)).toBe(true); // all that is left are the bridges
  });
});
