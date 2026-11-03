import { describe, expect, it } from 'vitest';
import { DEFAULT_KEYS, ACTIONS } from '../src/core/bindings';
import { INTRO, introText } from '../src/data/intro';
import { createWorldGame } from '../src/systems/game';
import { questMarks } from '../src/systems/questMarks';
import { talk } from '../src/systems/npcs';

describe('who has something for the investigator', () => {
  it('the first talk answers the carriage errand and begins the main line, whose next person answers', () => {
    const g = createWorldGame();
    expect(questMarks(g).get('peaslee')).toBe('answer');
    talk(g, 'peaslee');
    const marks = questMarks(g);
    expect(marks.get('gilman')).toBe('answer');
    expect(marks.get('peaslee')).toBeUndefined();
  });
});

describe('the journal key', () => {
  it('is J by default, and no other action has it', () => {
    expect(DEFAULT_KEYS.journal).toBe('KeyJ');
    expect(ACTIONS.filter((a) => DEFAULT_KEYS[a] === 'KeyJ')).toEqual(['journal']);
  });
});

describe('the opening', () => {
  it('is short cards in sentence case, with no shouting and no STOP', () => {
    expect(INTRO.length).toBeLessThanOrEqual(6);
    for (const c of INTRO) {
      const t = introText(c);
      expect(t.split(/\s+/).length, c.heading).toBeLessThanOrEqual(45);
      expect(t).not.toMatch(/\bSTOP\b/);
      expect(t.replace(/\b(READING|ELSE)\b/g, '')).not.toMatch(/[A-Z]{3,}/); // a word stressed, not a line shouted
    }
  });
});
