/**
 * The Elder Sign's menu (spec §3D), opened by resting at one: spend Echoes on a level of Vigour,
 * Endurance or Might (playtest round 4) and insight on Resolve or a Draught; set star-stones into a
 * weapon (round 12) and move them from one weapon to another (signMove.ts); choose the two relics to wear (signRelics.ts); travel to any Elder Sign
 * found, chosen by region and then by name (playtest round 12: one list grew past forty); at the hub's
 * Sleeper's Sign, descend the Seventy Steps into the Dreamlands; and at the Court's, once Azathoth
 * slumbers, choose one of two endings (Phase 5), first of all. A menu screen (menuKit.ts: mouse, keys
 * or pad; E or Esc leaves); the investigator takes no input while it is open.
 */

import { getRegion } from '../data/regions';
import { DESCENT_LINE } from '../data/loreLines';
import { PLAYER_MOVES } from '../data/moves';
import { DEFAULT_DIFFICULTY, DIFFICULTIES, GUN, LEVELS, REINFORCE, UPGRADES, type LevelId, type UpgradeId } from '../data/tuning';
import { WEAPONS } from '../data/weapons';
import { canReinforce, edgeAt, reinforce, reinforceCost } from '../systems/arms';
import { ENDINGS } from '../data/endings';
import { descentOpen, dream, signPlace, travel } from '../systems/checkpoints';
import { courtEndings, endGame } from '../systems/endings';
import { canUpgradeGun, gunCost, gunEdge, upgradeGun } from '../systems/gun';
import type { Game } from '../systems/components';
import { buyUpgrade, upgradeName } from '../systems/insight';
import { closedBy, heldOpen, listed } from '../systems/veil';
import { currentLead } from '../systems/lead';
import { buyLevel, canLevel, LEVEL_IDS, levelName, levelsBought, might, nextLevelCost } from '../systems/levels';
import { worldLayout, type SignPlace } from '../world/placements';
import { button, createScreen, el, footer, heading, option, tabs, title, type Page } from './menuKit';
import { chips, price, resources, type Chip } from './menuChips';
import { keyLayout } from '../core/bindings';
import { moveSection, movePage } from './signMove';
import { relicsTab, slotPage } from './signRelics';
import { mountsTab, refreshMountEntitlement } from './mounts';
import { t } from '../core/i18n';
import { MOUNT_TRAVERSAL } from '../data/mounts';

/** What one more level of each gives, in words. */
const GAINS: Record<LevelId | UpgradeId, string> = {
  vigour: `+${LEVELS.vigour.hp} health`,
  endurance: `+${LEVELS.endurance.stamina} stamina, faster recovery`,
  might: `+${Math.round(LEVELS.might.damage! * 100)}% damage`,
  resolve: `sanity losses −${Math.round(UPGRADES.resolve.resist! * 100)}%`,
  draught: `+${UPGRADES.draught.doses} Laudanum`,
};

export interface SignMenu {
  readonly open: boolean;
}

/** `go` makes a long jump under the veil (journeys.ts). */
export function createSignMenu(g: Game, go: (words: string, jump: () => void, line?: string) => void): SignMenu {
  const screen = createScreen(3, '#050506cc');
  screen.onClose = () => void (g.player.kneeling = null); // rested at the stone, they rise when the menu is left, not when they next move (round 29)
  const close = (): void => screen.close();
  const journey = (s: SignPlace): void => (close(), go(s.name.toUpperCase(), () => travel(g, s.id)));
  /** The signs found, but the one rested at, by region in the world's order. */
  const found = (): Map<string, SignPlace[]> => {
    const ow = g.overworld!;
    const regions = new Map<string, SignPlace[]>();
    for (const s of worldLayout().signs) if (ow.discovered.has(s.id) && s.id !== ow.sign) regions.set(s.region, [...(regions.get(s.region) ?? []), s]);
    return regions;
  };
  const regionName = (id: string): string => getRegion(id)?.name ?? id;

  const TABS = ['Level up', 'Weapons', 'Relics', 'Travel', 'Mounts'];
  let tab = 0; // the tab open: Level up again at each rest
  /** What the foot says on each tab until a line is chosen (round 52: one long line about resting stood on all five). */
  const HINTS = (): string[] => [
    'Resting restores you fully; the slain return.',
    `Each level adds ${Math.round(REINFORCE.damage * 100)}% to a weapon’s blows, ${Math.round(GUN.level.damage * 100)}% to the revolver’s shots.`,
    'Two are worn at once. Those kept do nothing until worn.',
    found().size ? 'Choose a region, then the Elder Sign to wake beside.' : 'Each Elder Sign you find, and rest at, can be travelled to from any other.',
    `${t('mounts.same')}\n${t('mounts.speeds', { cruise: MOUNT_TRAVERSAL.cruise, gallop: MOUNT_TRAVERSAL.gallop })}`,
  ];

  /** Levels and the mind's upgrades: each row a name and its count, what one more gives (green; a passage it would shut, red) and what it costs, boxed at the right. */
  function grow(panel: HTMLElement): void {
    heading(panel, 'BODY').style.margin = '0 0 4px';
    for (const id of LEVEL_IDS) {
      const full = g.player.levels[id] >= LEVELS[id].max;
      const b = option(panel, `${levelName(id)}  ${g.player.levels[id]}/${LEVELS[id].max}`, () => (buyLevel(g, id), main.redraw?.()), canLevel(g, id), full ? `${levelName(id)} is fully grown.` : `Not enough Echoes: the next level costs ${nextLevelCost(g)}, and you carry ${g.player.echoes}.`);
      chips(b, [{ text: GAINS[id], tone: 'good' }]);
      price(b, full ? 'MAX' : `${nextLevelCost(g)} Echoes`, full ? 'max' : canLevel(g, id) ? 'ok' : 'no');
    }
    heading(panel, 'MIND').style.margin = '12px 0 4px';
    const read = g.overworld?.read;
    const open = heldOpen(g.mind.insight, read);
    if (open.length) el(panel, 'div', `Insight holds ${open.length} hidden passage${open.length === 1 ? '' : 's'} open. Spending it shuts ${open.length === 1 ? 'it' : 'them'}.`, 'opacity:.6;font-size:12px;line-height:1.5;padding:0 14px 4px');
    for (const id of Object.keys(UPGRADES) as UpgradeId[]) {
      const u = UPGRADES[id];
      const level = g.mind.upgrades[id];
      const full = level >= u.max;
      const can = !full && g.mind.insight >= u.cost;
      const shut = can ? closedBy(g.mind.insight, u.cost, read) : [];
      const costs = shut.length ? `Spending ${u.cost} insight shuts ${listed(shut, 3)} again, before you have passed ${shut.length === 1 ? 'it' : 'them'}.` : '';
      const b = option(panel, `${upgradeName(id)}  ${level}/${u.max}`, () => (buyUpgrade(g, id), main.redraw?.()), can, full ? `${upgradeName(id)} is fully grown.` : `Not enough insight: ${u.cost}, and you hold ${g.mind.insight}. Insight comes of tomes, and of what the mind has borne.`, costs);
      const list: Chip[] = [{ text: GAINS[id], tone: 'good' }];
      if (shut.length) list.push({ text: `shuts ${shut.length} passage${shut.length === 1 ? '' : 's'}`, tone: 'bad' });
      chips(b, list);
      price(b, full ? 'MAX' : `${u.cost} insight`, full ? 'max' : can ? 'ok' : 'no');
    }
  }

  /** Star-stones set into the weapons owned, and the revolver, a level at a time (round 12; round 38: a tab, no longer a page of its own). Round 52: each row says what the next level does, in green, and its cost in star-stones, boxed at the right. */
  function arms(panel: HTMLElement): void {
    const [level, cost] = [g.player.gun, gunCost(g)];
    const shot = (n: number): number => Math.round(PLAYER_MOVES.shoot.shot.damage * might(g, g.player.id) * gunEdge(n));
    const whole = (n: number): number => GUN.reach.near + n * GUN.level.reach;
    const [lacks, stones] = [(n: number): string => `Not enough star-stones: ${n}, and you carry ${g.player.stones}.`, (n: number): string => `${n} ★`];
    const gun = option(panel, cost === undefined ? `Revolver  +${level}` : `Revolver  +${level} → +${level + 1}`, () => (upgradeGun(g), main.redraw?.()), canUpgradeGun(g), cost === undefined ? 'The revolver is fully set.' : lacks(cost));
    if (cost !== undefined) chips(gun, [{ text: `Shot ${shot(level)} → ${shot(level + 1)}`, tone: 'good' }, { text: `Reach ${whole(level)} → ${whole(level + 1)} m`, tone: 'good' }]);
    price(gun, cost === undefined ? 'MAX' : stones(cost), cost === undefined ? 'max' : canUpgradeGun(g) ? 'ok' : 'no');
    for (const id of g.player.arms) {
      const level = g.player.reinforced[id];
      const cost = reinforceCost(g, id);
      const light = (n: number): number => Math.round((WEAPONS[id].moves.light1?.hit?.damage ?? 0) * might(g, g.player.id) * edgeAt(n));
      const b = option(panel, cost === undefined ? `${WEAPONS[id].name}  +${level}` : `${WEAPONS[id].name}  +${level} → +${level + 1}`, () => (reinforce(g, id), main.redraw?.()), canReinforce(g, id), cost === undefined ? `${WEAPONS[id].name} is fully reinforced.` : lacks(cost));
      if (cost !== undefined) chips(b, [{ text: `Light blow ${light(level)} → ${light(level + 1)}`, tone: 'good' }]);
      price(b, cost === undefined ? 'MAX' : stones(cost), cost === undefined ? 'max' : canReinforce(g, id) ? 'ok' : 'no');
    }
    moveSection(panel, g, (from) => screen.show(movePage(g, from, () => screen.show(main))));
  }

  /** The regions with signs found: one line each rather than every sign in one long list (round 12). */
  function travelTab(panel: HTMLElement): void {
    const regions = found();
    if (!regions.size) return void el(panel, 'div', 'No other Elder Sign found yet.', 'opacity:.6;line-height:1.5;padding:0 14px');
    for (const [region, signs] of regions) {
      if (signs.length === 1) button(panel, `${regionName(region)}  ·  ${signs[0].name}`, () => journey(signs[0]));
      else button(panel, `${regionName(region)}  ·  ${signs.length} signs  ›`, () => screen.show(regionPage(region)));
    }
  }

  const pinned = (panel: HTMLElement): HTMLElement => {
    const box = el(panel, 'div');
    box.dataset.pin = ''; // stays above the tabs' body
    return box;
  };

  function build(panel: HTMLElement): void {
    const ow = g.overworld!;
    const here = signPlace(ow.sign);
    panel.dataset.body = '366';
    title(panel, (here?.name ?? 'Elder Sign').toUpperCase());
    const lead = [g.player.cycle ? `JOURNEY ${g.player.cycle + 1}` : '', g.player.difficulty === DEFAULT_DIFFICULTY ? '' : DIFFICULTIES[g.player.difficulty].name.toUpperCase()].filter(Boolean).join('  ·  ');
    resources(panel, [
      { label: 'LEVEL', value: levelsBought(g) + 1 },
      { label: 'ECHOES', value: g.player.echoes, hot: tab === 0 },
      { label: 'INSIGHT', value: g.mind.insight, hot: tab === 0 },
      { label: '★ STAR-STONES', value: g.player.stones, hot: tab === 1 },
    ], lead);
    const next = currentLead(g)?.text; // what the story asks next: a resting place is where it is thought of (round 38)
    if (next) {
      const line = el(panel, 'div', `NEXT  ·  ${next}`, `margin:-6px 14px 10px;text-align:center;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;opacity:.7`);
      [line.title, line.dataset.pin] = [next, ''];
    }
    const endings = courtEndings(g, ow.sign); // the choice the whole dream led to comes first (round 12)
    if (endings.length) {
      const box = pinned(panel);
      heading(box, 'THE COURT OF AZATHOTH').style.marginTop = '0';
      for (const id of endings) button(box, ENDINGS[id].choice, () => void (close(), endGame(g, id)));
    }
    if (here?.dream) {
      const box = pinned(panel);
      heading(box, 'THE SLEEPER’S SIGN').style.marginTop = '0';
      if (descentOpen(g)) button(box, 'Descend the Seventy Steps of Light Slumber', () => (close(), go('THE SEVENTY STEPS OF LIGHT SLUMBER', () => dream(g), DESCENT_LINE)));
      else el(box, 'div', 'The stair will not open while Keziah Mason troubles the sleepers, in the Witch House in Arkham.', 'opacity:.6;margin:4px 0 8px;font-size:13px');
    }
    tabs(panel, TABS, tab, (i) => ((tab = i), main.redraw?.()), main);
    if (tab === 0) grow(panel);
    else if (tab === 1) arms(panel);
    else if (tab === 2) relicsTab(panel, g, (slot) => screen.show(slotPage(g, slot, () => screen.show(main))));
    else if (tab === 3) travelTab(panel);
    else mountsTab(panel, g, () => main.redraw?.());
    footer(panel, HINTS()[tab], close);
  }

  // E and Esc leave without reaching the game (E would rest again at once).
  const main: Page = {
    build,
    back: close,
    get backKeys() {
      return [keyLayout.interact];
    },
  };
  const regionPages = new Map<string, Page>(); // one each, so coming back finds the focus where it was
  const regionPage = (region: string): Page => {
    let p = regionPages.get(region);
    if (!p) {
      const page: Page = {
        back: () => screen.show(main),
        build(panel) {
          title(panel, regionName(region).toUpperCase());
          for (const s of found().get(region) ?? []) button(panel, s.name, () => journey(s));
          footer(panel, '', page.back);
        },
      };
      regionPages.set(region, (p = page));
    }
    return p;
  };

  g.events.on('Rested', () => {
    tab = 0;
    screen.show(main);
    void refreshMountEntitlement(g).then(() => { if (screen.open) main.redraw?.(); });
  });
  return {
    get open() {
      return screen.open;
    },
  };
}
