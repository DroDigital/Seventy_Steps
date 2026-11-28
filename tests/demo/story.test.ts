/**
 * The demo's story in every language, in the demo's own build of the sources (`vitest --mode demo`: __DEMO__ true, the rest of the game
 * pruned out of the English and of each translation alike): every line the demo shows is translated. What the demo leaves out of a
 * translation is the leak check's to hold (tests/demoLeak.test.ts), so only what is missing counts here.
 */

import { describe, expect, it } from 'vitest';
import { BOOKS, storyFaults } from '../storyCheck.ts';

describe("the demo's story in every language (1.5.0)", () => {
  it('every line the demo shows has its translation', () => {
    for (const [lang, book] of Object.entries(BOOKS)) expect(storyFaults(lang, book).filter((f) => !f.includes('left over'))).toEqual([]);
  });
});
