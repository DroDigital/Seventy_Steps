import { describe, expect, it } from 'vitest';
import { CREDITS } from '../src/data/credits';

describe('the credits', () => {
  it("open with the studio's name, set as a title, and keep its maker's name beneath it", () => {
    expect(CREDITS[0].lines[0]).toBe('Digital Dro Studios');
    expect(CREDITS[0].title).toBe(true);
    expect(CREDITS[1].lines).toContain('Alessandro A. Foddis');
  });

  it("carry the notice under the maker's name, and set one title only", () => {
    const notice = CREDITS[1].lines.join(' ');
    expect(notice).toContain('© 2026 Digital Dro Studios');
    expect(CREDITS.filter((b) => b.title)).toHaveLength(1);
  });
});
