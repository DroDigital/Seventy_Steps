import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Page } from '../src/ui/menuKit';
import { NEW_GAME_PLUS } from '../src/data/tuning';
import { createWorldGame } from '../src/systems/game';
import { CARRY_KEY, storeCarry, takeCarry } from '../src/systems/records';
import { carryOf } from '../src/systems/cycles';
import type { SaveStore } from '../src/systems/save';

const ui = vi.hoisted(() => {
  class Node {
    style = { cssText: '' };
    dataset: Record<string, string> = {};
    children: Node[] = [];
    textContent = '';
    action?: () => void;
    append(...nodes: Node[]) { this.children.push(...nodes); }
    animate() { return {}; }
    get lastElementChild() { return this.children.at(-1); }
  }
  return { Node, page: null as Page | null, panel: null as Node | null, buttons: [] as Node[], open: false, saved: vi.fn(), rendered: vi.fn(() => ({})) };
});

vi.mock('../src/ui/menuKit', () => ({
  createScreen: () => ({
    get open() { return ui.open; },
    show(page: Page) {
      ui.page = page;
      ui.open = true;
      ui.buttons = [];
      ui.panel = new ui.Node();
      page.build(ui.panel as unknown as HTMLElement);
    },
    close() { ui.open = false; },
  }),
  heading: (parent: InstanceType<typeof ui.Node>, text: string) => {
    const node = new ui.Node(); node.textContent = text; parent.append(node); return node;
  },
  button: (parent: InstanceType<typeof ui.Node>, text: string, run: () => void) => {
    const node = new ui.Node(); node.textContent = text; node.action = run; parent.append(node); ui.buttons.push(node); return node;
  },
}));
vi.mock('../src/ui/credits', () => ({
  creditsPage: (next: () => void) => ({ build() { const b = new ui.Node(); b.textContent = 'Go on'; b.action = next; ui.buttons.push(b); } }),
}));
vi.mock('../src/ui/keepsake', () => ({ runCard: ui.rendered, savePng: ui.saved }));

import { createEndingCard, NEW_GAME_FLAG } from '../src/ui/endingCard';

const memory = (): SaveStore => {
  const values = new Map<string, string>();
  return { getItem: k => values.get(k) ?? null, setItem: (k, v) => void values.set(k, v), removeItem: k => void values.delete(k) };
};
const textOf = (node: InstanceType<typeof ui.Node> | null): string => node ? [node.textContent, ...node.children.map(textOf)].join(' ') : '';
const click = (name: string): void => {
  const b = ui.buttons.find(item => item.textContent === name);
  expect(b, `button ${name}`).toBeDefined();
  b!.action!();
};
function setup(store = memory(), session = memory()) {
  Object.assign(ui, { page: null, panel: null, buttons: [], open: false });
  ui.saved.mockClear(); ui.rendered.mockClear();
  const location = { pathname: '/game', href: '/ending' };
  vi.stubGlobal('document', { createElement: () => new ui.Node() });
  vi.stubGlobal('sessionStorage', session);
  vi.stubGlobal('location', location);
  const game = createWorldGame();
  const card = createEndingCard(game, store);
  card.show('seal');
  click('Go on'); // ending's words
  click('Go on'); // credits
  return { game, store, session, location, card };
}
afterEach(() => vi.unstubAllGlobals());

describe('ending choices', () => {
  it('makes New Game+ explicit and requires a separate confirmation before carrying anything or leaving', () => {
    const s = setup();
    s.game.player.levels.might = 8;
    expect(ui.buttons.map(b => b.textContent)).toEqual(['New Game+ · Journey 2', 'Continue this journey', 'New Game · Fresh start', 'Save the ending card']);
    click('New Game+ · Journey 2');
    expect(textOf(ui.panel)).toContain('levels, weapons and upgrades');
    expect(textOf(ui.panel)).toContain('current save slot and its backup are cleared');
    expect(s.store.getItem(CARRY_KEY)).toBeNull();
    expect(s.session.getItem(NEW_GAME_FLAG)).toBeNull();
    expect(s.location.href).toBe('/ending');
    click('Cancel');
    expect(s.store.getItem(CARRY_KEY)).toBeNull();
    click('New Game+ · Journey 2');
    click('Start New Game+');
    expect(s.session.getItem(NEW_GAME_FLAG)).toBe('1');
    expect(s.location.href).toBe('/game');
    expect(takeCarry(s.store)).toMatchObject({ cycle: 1, levels: { might: 8 } });
  });

  it('confirms saving the card and continuing the current journey separately', () => {
    const s = setup();
    click('Save the ending card');
    expect(ui.saved).not.toHaveBeenCalled();
    click('Cancel');
    click('Save the ending card');
    click('Save card');
    expect(ui.saved).toHaveBeenCalledOnce();
    expect(s.card.open).toBe(true);
    click('Continue this journey');
    expect(s.card.open).toBe(true);
    click('Continue journey');
    expect(s.card.open).toBe(false);
  });

  it('confirms a fresh game and clears a stale pending carry only after confirmation', () => {
    const s = setup();
    expect(storeCarry(s.store, carryOf(s.game))).toBe(true);
    click('New Game · Fresh start');
    expect(textOf(ui.panel)).toContain('current save slot and its backup will be cleared');
    click('Cancel');
    expect(s.store.getItem(CARRY_KEY)).not.toBeNull();
    click('New Game · Fresh start');
    click('Start fresh');
    expect(s.store.getItem(CARRY_KEY)).toBeNull();
    expect(s.location.href).toBe('/game');
  });

  it('does not leave or lose the pending journey if storage cannot keep the carry or reload flag', () => {
    const base = memory();
    const denied: SaveStore = { ...base, setItem: (k, v) => { if (k === CARRY_KEY) throw new Error('denied'); base.setItem(k, v); } };
    const first = setup(denied);
    click('New Game+ · Journey 2');
    click('Start New Game+');
    expect(textOf(ui.panel)).toContain('Your current journey has not been changed');
    expect(first.location.href).toBe('/ending');
    expect(first.card.open).toBe(true);
    const badSession: SaveStore = { ...memory(), setItem: () => { throw new Error('denied'); } };
    const second = setup(memory(), badSession);
    click('New Game+ · Journey 2');
    click('Start New Game+');
    expect(second.store.getItem(CARRY_KEY)).toBeNull();
    expect(second.location.href).toBe('/ending');
    expect(textOf(ui.panel)).toContain('Your current journey has not been changed');
  });

  it('does not advertise a journey past the New Game+ difficulty cap', () => {
    const s = setup();
    s.game.player.cycle = NEW_GAME_PLUS.most;
    // The labels are built when the card is shown, so reopen it with the current cycle.
    s.card.show('seal');
    click('Go on'); click('Go on');
    click(`New Game+ · Journey ${NEW_GAME_PLUS.most + 1}`);
    expect(textOf(ui.panel)).toContain('maximum New Game+ difficulty');
  });
});
