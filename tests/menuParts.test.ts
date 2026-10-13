import { describe, expect, it } from 'vitest';
import { moreAt } from '../src/ui/scrollCue';
import { slotParts } from '../src/ui/titleSlots';

describe('a scrolling page says where there is more to read', () => {
  it('has none when it all shows', () => {
    expect(moreAt(0, 300, 300)).toBe('');
    expect(moreAt(0, 300, 301)).toBe(''); // a pixel of rounding is not a line
  });
  it('has more below at the top of a long page, more above at its foot, both between', () => {
    expect(moreAt(0, 300, 520)).toBe('below');
    expect(moreAt(220, 300, 520)).toBe('above');
    expect(moreAt(100, 300, 520)).toBe('both');
  });
});

describe('a saved slot is its name and, beneath, what it holds', () => {
  const line = 'Slot 2  ·  Miskatonic University  ·  level 1  ·  1:01  ·  journey 3  ·  nightmare';
  it('puts what it holds on a line of its own, whole', () => {
    expect(slotParts(line, true)).toEqual(['Slot 2', 'Miskatonic University  ·  level 1  ·  1:01  ·  journey 3  ·  nightmare']);
  });
  it('leaves an empty slot as one line', () => {
    expect(slotParts('Slot 3  ·  empty', false)).toEqual(['Slot 3  ·  empty', '']);
  });
  it('holds in every language the title speaks', async () => {
    const { LANGS } = await import('../src/data/lang');
    for (const lang of LANGS) expect(lang.table['title.slot'].split('  ·  ')).toHaveLength(2);
  });
});
