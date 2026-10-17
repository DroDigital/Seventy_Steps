import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setLocale } from '../src/core/i18n';
import type { Desktop, MountDlcStore } from '../src/ui/desktop';
import { MOUNT_QUEST } from '../src/data/mounts';
import { QUESTS } from '../src/data/quests';
import { createWorldGame } from '../src/systems/game';
import type { Game } from '../src/systems/components';
import { mountsTab, refreshMountEntitlement } from '../src/ui/mounts';

const bridge = vi.hoisted(() => ({ desktop: undefined as Partial<Desktop> | undefined }));
vi.mock('../src/ui/desktop', () => ({ get desktop() { return bridge.desktop; } }));
vi.mock('../src/ui/autosave', () => ({ saveNow: vi.fn() }));
vi.mock('../src/ui/glyphs', () => ({ fill: (text: string) => text }));

interface Node {
  textContent: string;
  style: { marginTop?: string };
  disabled: boolean;
  isConnected: boolean;
  run(): void;
  setAttribute(name: string, value: string): void;
  hint: string;
}
interface Panel { nodes: Node[]; isConnected: boolean }
function add(parent: Panel, text: string, run = () => {}, enabled = true, hint = ''): Node {
  const node: Node = { textContent: text, style: {}, disabled: !enabled, isConnected: true, run, setAttribute() {}, hint };
  parent.nodes.push(node);
  return node;
}
vi.mock('../src/ui/menuKit', () => ({
  ACCENT: '#aaa',
  el: (parent: Panel, _tag: string, text = '') => add(parent, text),
  heading: (parent: Panel, text: string) => add(parent, text),
  button: (parent: Panel, text: string, run: () => void, enabled = true, hint = '') => add(parent, text, run, enabled, hint),
  option: (parent: Panel, text: string, run: () => void, enabled: boolean, why: string) => add(parent, text, run, enabled, why),
}));

const store = (chariot = true, automobile = true): MountDlcStore => ({ channel: 'itch', chariot, automobile });
const game = (): Game => {
  const g = createWorldGame();
  g.overworld!.quests.set(MOUNT_QUEST, QUESTS[MOUNT_QUEST].stages.length);
  return g;
};
function render(g: Game) {
  const panel: Panel = { nodes: [], isConnected: true };
  const redraw = vi.fn();
  mountsTab(panel as unknown as HTMLElement, g, redraw);
  return { panel, redraw, text: () => panel.nodes.map((node) => `${node.textContent} ${node.hint}`).join('\n') };
}
async function ready(g: Game) {
  const initial = render(g);
  await vi.waitFor(() => expect(initial.redraw).toHaveBeenCalled());
  initial.panel.isConnected = false;
  return render(g);
}
const named = (panel: Panel, text: string) => panel.nodes.filter((node) => node.textContent === text);

beforeEach(() => { bridge.desktop = undefined; });
afterEach(() => setLocale(0));

describe('mount purchases in the Elder Sign menu', () => {
  it('preserves localized mount text and translates purchase and import controls in every interface language', async () => {
    bridge.desktop = { mountDlcStore: async () => store(), buyMountDlc: async () => true, importMountDlc: async () => ({ status: 'cancelled' }) };
    const labels = [
      ['DIE GELIEHENEN ZÜGEL', 'Auf itch.io kaufen · 0,99 $', 'Gefährt-Freischaltdatei importieren'],
      ['LES RÊNES EMPRUNTÉES', 'Acheter sur itch.io · 0,99 $', 'Importer un fichier de déverrouillage'],
      ['LAS RIENDAS PRESTADAS', 'Comprar en itch.io · 0,99 $', 'Importar archivo de desbloqueo'],
    ];
    for (const [index, [title, buy, importFile]] of labels.entries()) {
      setLocale(index + 1);
      const view = await ready(game());
      expect(view.text()).toContain(title);
      expect(named(view.panel, buy)).toHaveLength(2);
      expect(named(view.panel, importFile)).toHaveLength(1);
      expect(view.text()).not.toContain('Buy on itch.io');
    }
  });

  it('offers configured itch purchases and opens a browser without granting either appearance', async () => {
    const buy = vi.fn(async () => true);
    const owns = vi.fn(async () => false);
    bridge.desktop = { mountDlcStore: async () => store(), buyMountDlc: buy, importMountDlc: async () => ({ status: 'cancelled' }), ownsChariotDlc: owns, ownsAutomobileDlc: owns };
    const g = game();
    const view = await ready(g);
    const buttons = named(view.panel, 'Buy on itch.io · $0.99');
    expect(buttons).toHaveLength(2);
    expect(buttons.every((button) => !button.disabled)).toBe(true);
    buttons[0].run();
    await vi.waitFor(() => expect(view.text()).toContain('After payment on itch.io, download'));
    expect(buy).toHaveBeenCalledWith('chariot');
    expect(owns).not.toHaveBeenCalled();
    expect(g.player.mount.chariotOwned).toBe(false);
    expect(g.player.mount.automobileOwned).toBe(false);
    expect(view.text()).not.toContain('Steam');
  });

  it('shows pending setup for an unconfigured appearance and never invents a Steam purchase route', async () => {
    bridge.desktop = { mountDlcStore: async () => store(false, true), buyMountDlc: async () => true };
    const view = await ready(game());
    expect(named(view.panel, 'Purchase setup pending')).toHaveLength(1);
    expect(named(view.panel, 'Purchase setup pending')[0].disabled).toBe(true);
    expect(named(view.panel, 'Buy on itch.io · $0.99')).toHaveLength(1);
    expect(view.text()).not.toContain('Steam');
  });

  it('requires the desktop edition on the web without naming Steam', async () => {
    const view = await ready(game());
    expect(named(view.panel, 'Desktop edition required')).toHaveLength(2);
    expect(view.text()).toContain('unlock-file import require the desktop edition');
    expect(view.text()).not.toContain('Steam');
    expect(named(view.panel, 'Import mount unlock file')).toHaveLength(0);
  });

  it('keeps Steam-specific instructions in the Steam edition', async () => {
    bridge.desktop = { mountDlcStore: async () => ({ channel: 'steam', chariot: false, automobile: false }), ownsChariotDlc: async () => false, ownsAutomobileDlc: async () => false };
    const view = await ready(game());
    expect(view.text()).toContain('through Steam');
    expect(named(view.panel, 'Buy on itch.io · $0.99')).toHaveLength(0);
    expect(named(view.panel, 'Import mount unlock file')).toHaveLength(0);
  });

  it('refreshes verified ownership after an imported file and redraws available appearances', async () => {
    let imported = false;
    const owns = vi.fn(async () => imported);
    bridge.desktop = {
      mountDlcStore: async () => store(), ownsChariotDlc: owns, ownsAutomobileDlc: async () => false,
      importMountDlc: async () => { imported = true; return { status: 'imported', mount: 'chariot' }; },
    };
    const g = game();
    const view = await ready(g);
    named(view.panel, 'Import mount unlock file')[0].run();
    await vi.waitFor(() => expect(view.text()).toContain('The Spectral Chariot unlocked.'));
    expect(owns).toHaveBeenCalledOnce();
    expect(g.player.mount.chariotOwned).toBe(true);
    expect(view.redraw).toHaveBeenCalledOnce();
    const updated = render(g);
    expect(updated.text()).toContain('The Spectral Chariot  ·  Available');
  });

  it('does not let a pre-import ownership check hide the newly imported unlock', async () => {
    let finishOld!: (owned: boolean) => void;
    const owns = vi.fn().mockImplementationOnce(() => new Promise<boolean>((resolve) => { finishOld = resolve; })).mockResolvedValue(true);
    bridge.desktop = {
      mountDlcStore: async () => store(), ownsChariotDlc: owns, ownsAutomobileDlc: async () => false,
      importMountDlc: async () => ({ status: 'imported', mount: 'chariot' }),
    };
    const g = game();
    const old = refreshMountEntitlement(g);
    const view = await ready(g);
    named(view.panel, 'Import mount unlock file')[0].run();
    finishOld(false);
    await old;
    await vi.waitFor(() => expect(g.player.mount.chariotOwned).toBe(true));
    expect(owns).toHaveBeenCalledTimes(2);
  });

  it('handles cancellation and invalid files without granting an appearance', async () => {
    for (const status of ['cancelled', 'invalid', 'unavailable'] as const) {
      bridge.desktop = { mountDlcStore: async () => store(), importMountDlc: async () => ({ status }) };
      const g = game();
      const view = await ready(g);
      named(view.panel, 'Import mount unlock file')[0].run();
      await vi.waitFor(() => expect(view.redraw).toHaveBeenCalled());
      expect(g.player.mount.chariotOwned).toBe(false);
      expect(g.player.mount.automobileOwned).toBe(false);
      expect(view.text()).toContain(status === 'cancelled' ? 'Import cancelled.' : status === 'invalid' ? 'could not be verified' : 'unavailable in this build');
    }
  });

  it('shows purchase, store and import errors without unhandled rejections or granting access', async () => {
    bridge.desktop = {
      mountDlcStore: async () => store(), buyMountDlc: async () => { throw Error('offline'); },
      importMountDlc: async () => { throw Error('file unavailable'); },
    };
    const g = game();
    const view = await ready(g);
    named(view.panel, 'Buy on itch.io · $0.99')[0].run();
    await vi.waitFor(() => expect(view.text()).toContain('purchase page could not be opened'));
    const retry = render(g);
    named(retry.panel, 'Import mount unlock file')[0].run();
    await vi.waitFor(() => expect(retry.text()).toContain('unlock file could not be imported'));
    expect(g.player.mount.chariotOwned).toBe(false);
    bridge.desktop = { mountDlcStore: async () => { throw Error('offline'); } };
    const errorView = await ready(game());
    expect(errorView.text()).toContain('Purchase options could not be loaded');
    expect(errorView.text()).not.toContain('Steam');
  });
});
