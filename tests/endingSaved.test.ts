import { afterEach, describe, expect, it, vi } from 'vitest';
import { endGame } from '../src/systems/endings';
import { createWorldGame } from '../src/systems/game';
import { loadRecords } from '../src/systems/records';
import type { SaveStore } from '../src/systems/save';
import { createEndingCard } from '../src/ui/endingCard';
import { startAutosave } from '../src/ui/autosave';

// The card's screen is the DOM's: its pages are not what is under test here, only when the ending is kept.
vi.mock('../src/ui/menuKit', async (original) => ({
  ...(await original<typeof import('../src/ui/menuKit')>()),
  createScreen: () => ({ show: vi.fn(), close: vi.fn(), open: false }),
}));

const memStore = (): SaveStore & { items: Map<string, string> } => {
  const items = new Map<string, string>();
  return { items, getItem: (k) => items.get(k) ?? null, setItem: (k, v) => void items.set(k, v), removeItem: (k) => void items.delete(k) };
};

afterEach(() => vi.unstubAllGlobals());

describe('an ending is kept when it is chosen (round 55)', () => {
  it('is remembered beyond the save at the choice, before any scene or card, and the card does not count it again', () => {
    const g = createWorldGame();
    const store = memStore();
    const card = createEndingCard(g, store);
    expect(loadRecords(store).finished).toBe(0);
    endGame(g, 'seal');
    expect(loadRecords(store)).toMatchObject({ endings: ['seal'], finished: 1 }); // a quit during the scene keeps it
    card.show('seal');
    expect(loadRecords(store)).toMatchObject({ endings: ['seal'], finished: 1 });
  });

  it('is saved at once, not on the next interval: a kill before it must not put the investigator back at the Court with both endings offered', () => {
    vi.stubGlobal('addEventListener', vi.fn());
    vi.stubGlobal('setInterval', vi.fn());
    vi.stubGlobal('document', { addEventListener: vi.fn(), visibilityState: 'visible' });
    const g = createWorldGame();
    const store = memStore();
    startAutosave(g, store);
    const endingsSaved = (): (string | undefined)[] =>
      [...store.items.values()].map((v) => {
        try {
          return (JSON.parse(v) as { ending?: string }).ending;
        } catch {
          return undefined;
        }
      });
    expect(endingsSaved()).not.toContain('herald');
    endGame(g, 'herald');
    expect(endingsSaved()).toContain('herald');
  });
});
