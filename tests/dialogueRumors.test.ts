// World news has no voice recordings: it is read after the recorded conversation, and survives an abort.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NPCS } from '../src/data/npcs';
import { RUMORS } from '../src/data/rumors';
import { clipOf } from '../src/data/speech';
import { npcLines } from '../src/data/speechLines';
import { createWorldGame } from '../src/systems/game';
import { talk } from '../src/systems/npcs';
import { createDialogue } from '../src/ui/dialogue';
import type { Page } from '../src/ui/menuKit';
import { record } from './worldHelpers';

interface Panel { buttons: (() => void)[]; text: string[] }
interface Screen { open: boolean; page?: Page; panel: Panel; show(page: Page): void; close(): void }
const menu = vi.hoisted(() => ({ screens: [] as Screen[] }));

vi.mock('../src/ui/menuKit', () => ({
  createScreen() {
    const screen: Screen = {
      open: false, panel: { buttons: [], text: [] },
      show(page) {
        this.open = true;
        this.page = page;
        this.panel = { buttons: [], text: [] };
        page.build(this.panel as unknown as HTMLElement);
      },
      close() { this.open = false; },
    };
    menu.screens.push(screen);
    return screen;
  },
  el(parent: Panel, _tag: string, text: string) {
    parent.text.push(text);
    return { ...parent, style: {}, textContent: text, append() {} };
  },
  button(parent: Panel, _text: string, action: () => void) {
    parent.buttons.push(action);
    return {};
  },
  frame: () => '',
}));

beforeEach(() => {
  menu.screens.length = 0;
  vi.useFakeTimers();
  vi.stubGlobal('window', { setTimeout });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
});
afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals(); });

const advance = (): void => menu.screens[0].panel.buttons[0]();

describe('voiced conversations and written rumours', () => {
  it('Nasht keeps two recorded lines, followed by a written note only after both are finished', () => {
    const g = createWorldGame();
    const dialogue = createDialogue(g);
    const said = record(g, 'Said');
    g.overworld!.slain.add('boss:keziah_mason');
    talk(g, 'nasht');
    expect(menu.screens[0].panel.text).toContain('1 / 2');
    expect(dialogue.reading).toBe(false);
    advance();
    expect(menu.screens[0].panel.text).toContain('2 / 2');
    advance();
    expect(dialogue.talking).toBe(false);
    expect(dialogue.reading).toBe(true);
    expect(menu.screens[1].panel.text).toContain('A RUMOUR');
    expect(menu.screens[1].panel.text).toContain(RUMORS.keziah_mason);
    expect(said).toHaveLength(2);
    expect(g.overworld!.told.has('rumor:nasht:keziah_mason')).toBe(true);
    menu.screens[1].page!.keys!({ code: 'KeyE', repeat: true } as KeyboardEvent);
    expect(dialogue.reading).toBe(true);
    menu.screens[1].page!.keys!({ code: 'KeyE', repeat: false } as KeyboardEvent);
    expect(dialogue.reading).toBe(false);
    talk(g, 'nasht');
    advance(); advance();
    expect(dialogue.open).toBe(false); // the same note is not shown a second time
  });

  it.each(['Escape', 'hit'])('an %s abort neither shows nor consumes an unread rumour', (abort) => {
    const g = createWorldGame();
    const dialogue = createDialogue(g);
    g.overworld!.slain.add('boss:keziah_mason');
    talk(g, 'nasht');
    if (abort === 'Escape') menu.screens[0].page!.back!();
    else g.events.emit('Hit', { attacker: 999, target: g.player.id, damage: 1, outcome: 'hit' });
    expect(dialogue.open).toBe(false);
    expect(g.overworld!.told.has('rumor:nasht:keziah_mason')).toBe(false);
    talk(g, 'nasht');
    advance(); advance();
    expect(dialogue.reading).toBe(true);
  });

  it('a merchant opens their wares after the written note is dismissed', () => {
    const g = createWorldGame();
    const dialogue = createDialogue(g);
    const trades = record(g, 'Trade');
    g.overworld!.slain.add('boss:keziah_mason');
    g.events.emit('Talked', { npc: 'morgan', name: 'Morgan', title: 'Merchant', lines: ['Welcome.'], shop: 'morgan', rumor: { boss: 'keziah_mason', text: RUMORS.keziah_mason } });
    advance();
    expect(dialogue.reading).toBe(true);
    expect(trades).toHaveLength(0);
    menu.screens[1].page!.back!();
    expect(dialogue.open).toBe(false);
    expect(trades).toEqual([{ shop: 'morgan', name: 'Morgan' }]);
  });

  it('a merchant with no new rumour opens their wares directly', () => {
    const g = createWorldGame();
    const dialogue = createDialogue(g);
    const trades = record(g, 'Trade');
    g.events.emit('Talked', { npc: 'morgan', name: 'Morgan', title: 'Merchant', lines: ['Welcome.'], shop: 'morgan' });
    advance();
    expect(dialogue.open).toBe(false);
    expect(trades).toEqual([{ shop: 'morgan', name: 'Morgan' }]);
  });

  it('every person keeps every possible boss rumour outside their recorded dialogue', () => {
    const g = createWorldGame();
    const spoken = record(g, 'Talked');
    const recorded = new Set(npcLines().map((l) => clipOf(l.speaker, l.text)));
    for (const n of NPCS) for (const [boss, text] of Object.entries(RUMORS)) {
      g.overworld!.slain.clear();
      g.overworld!.slain.add(`boss:${boss}`);
      talk(g, n.id);
      const dialogue = spoken[spoken.length - 1];
      expect(dialogue.rumor, `${n.id}: ${boss}`).toEqual({ boss, text });
      for (const line of dialogue.lines) expect(recorded.has(clipOf(`npc:${n.id}`, line)), `${n.id}: ${line}`).toBe(true);
      expect(dialogue.lines).not.toContain(text);
    }
  });
});
