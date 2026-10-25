import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LANGS } from '../src/data/lang';
import { CLOCK, SIM } from '../src/data/tuning';
import { HOUR } from '../src/data/uiMood';
import { HOUR_FROM, hourOf, NIGHT, phaseOf, type Hour } from '../src/systems/clock';
import type { Game } from '../src/systems/components';
import { createHourCards, HOUR_CARDS, HOUR_LABEL, hourChange } from '../src/ui/hourCards';

describe('the night\'s turns announced (round 78)', () => {
  it('names a change of hour, the turn being the last hour giving way to the gloaming', () => {
    expect(hourChange('gloaming', 'deep')).toBe('deep');
    expect(hourChange('deep', 'waning')).toBe('waning');
    expect(hourChange('waning', 'gloaming')).toBe('turn');
    expect(hourChange('deep', 'gloaming')).toBe('turn'); // (a vigil that hurries the night past the last hour)
    expect(hourChange('deep', 'deep')).toBeNull();
    expect(hourChange(null, 'waning')).toBeNull(); // the first look is not a change
  });

  it('has words for every card and hour, in every language, the names in capitals as the clock\'s were', () => {
    const hours: Hour[] = ['gloaming', 'deep', 'waning'];
    for (const lang of LANGS) {
      const table = lang.table as Record<string, string>;
      for (const h of hours) expect(table[HOUR_LABEL[h]], `${lang.id} ${h}`).toBe(table[HOUR_LABEL[h]].toUpperCase());
      for (const [title, note] of Object.values(HOUR_CARDS)) {
        expect(table[title], lang.id).toBe(table[title].toUpperCase());
        if (note) expect(table[note], lang.id).toBeTruthy();
      }
    }
  });

  describe('the cards, over a game', () => {
    beforeEach(() => void vi.useFakeTimers());
    afterEach(() => {
      vi.useRealTimers();
      NIGHT.hurried = 0;
    });

    /** A game with only what the cards read: the clock's seconds, an overworld, the investigator in the open and no fight. */
    const fake = () => {
      const g = { overworld: {}, frame: 0, player: { id: 1 }, ecs: { c: { transform: new Map([[1, { pos: { x: 0, y: 0, z: 0 } }]]), fight: new Map() } } };
      return g as unknown as Game & { frame: number };
    };
    /** The game's frame at which the night is at `phase`. */
    const frameAt = (phase: number): number => Math.round((((phase - CLOCK.start + 1) % 1) * CLOCK.night) * SIM.hz);

    it('says nothing on loading or in the first moments, then each change of hour once, and waits while it may not be shown', () => {
      const g = fake();
      const shown: string[] = [];
      let allowed = true;
      const cards = createHourCards(g, (title, note) => shown.push(note ? `${title} | ${note}` : title), () => allowed);
      g.frame = frameAt(HOUR_FROM.deep - 0.01);
      cards.update();
      vi.advanceTimersByTime(HOUR.settle * 1000 + 100);
      cards.update();
      expect(shown).toEqual([]);
      g.frame = frameAt(HOUR_FROM.deep + 0.01);
      expect(hourOf(phaseOf(g.frame / SIM.hz))).toBe('deep');
      allowed = false; // a menu is open
      cards.update();
      expect(shown).toEqual([]);
      allowed = true;
      cards.update();
      expect(shown).toEqual(['THE DEEP']);
      cards.update();
      expect(shown).toHaveLength(1);
      g.frame = frameAt(HOUR_FROM.waning + 0.01);
      cards.update();
      expect(shown[1]).toBe('THE WANING | The sky greys. The morning will not come.');
      g.frame = frameAt(0.02);
      cards.update();
      expect(shown[2]).toBe('THE NIGHT TURNS | No dawn came. The lamps are lit anew.');
    });

    it('lets go of a card that waited too long', () => {
      const g = fake();
      const shown: string[] = [];
      let allowed = true;
      const cards = createHourCards(g, (title) => shown.push(title), () => allowed);
      vi.advanceTimersByTime(HOUR.settle * 1000 + 100);
      g.frame = frameAt(HOUR_FROM.deep - 0.01);
      cards.update();
      allowed = false;
      g.frame = frameAt(HOUR_FROM.deep + 0.01);
      cards.update();
      vi.advanceTimersByTime(120_000);
      allowed = true;
      cards.update();
      expect(shown).toEqual([]);
    });
  });
});
