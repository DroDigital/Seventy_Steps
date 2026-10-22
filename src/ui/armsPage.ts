/**
 * Arms (playtest round 4), from the pause menu: the weapons the investigator owns, how each
 * handles, and which is in hand; choosing one takes it up (systems/arms.ts). Round 12: each shows its
 * numbers, its blows with Might and its reinforcement counted, and how far it is reinforced. Round 22: the
 * revolver's rounds and levels. Round 60 (the collection: many did not know what they had, or what was left to
 * find): each weapon has its mark and a NEW tag until the page has been seen, those not yet found are sealed
 * lines that tell, when chosen, where the rumour has it, and the count of found and of all stands in each
 * heading; the relics, found and not, are here too, with which are worn.
 */

import { PLAYER_MOVES } from '../data/moves';
import { GUN, SIM } from '../data/tuning';
import { WEAPON_IDS, WEAPON_WHERE, WEAPONS, type WeaponDef } from '../data/weapons';
import { edgeAt, equip } from '../systems/arms';
import type { Game } from '../systems/components';
import { falloff, gunEdge } from '../systems/gun';
import { might } from '../systems/levels';
import { clearNew, isNew } from '../systems/finds';
import { owned, slotsOf } from '../systems/relics';
import { RELICS, RELIC_IDS, RELIC_SLOTS } from '../data/relics';
import { fill } from './glyphs';
import { price } from './menuChips';
import { button, el, footer, heading, title, type Page } from './menuKit';
import { relicGlyph } from './relicGlyphs';
import { effectChips } from './signRelics';
import { unfoundGlyph, weaponGlyph } from './weaponGlyphs';

/** A weapon's numbers: its first light and heavy blows (times `k`, the Might bonus), how soon the light one lands, its reach and cost. */
export function weaponStats(w: WeaponDef, k = 1): string {
  const [light, heavy] = [w.moves.light1, w.moves.heavy1];
  const dmg = (m: typeof light): number => Math.round((m?.hit?.damage ?? 0) * k);
  const lands = ((light?.hit?.window[0] ?? 0) / SIM.hz).toFixed(2);
  return `light ${dmg(light)}  ·  heavy ${dmg(heavy)}  ·  lands in ${lands} s  ·  reach ${(light?.hit?.reach ?? 0).toFixed(1)} m  ·  ${light?.stamina ?? 0} stamina`;
}

export function armsPage(g: Game, back: () => void, show: (p: Page) => void): Page {
  const page: Page = {
    back,
    build(p) {
      title(p, 'ARMS');
      heading(p, `MELEE  ·  ${g.player.arms.length} OF ${WEAPON_IDS.length} FOUND`).style.margin = '0 14px 4px';
      const list = el(p, 'div');
      for (const id of WEAPON_IDS) {
        if (!g.player.arms.includes(id)) { // not yet found: a sealed line, and the rumour when it is chosen
          const sealed = button(list, 'Not yet found', () => undefined, true, '', id === 'cane' ? '' : WEAPON_WHERE[id]); // (the rumour is told on the line itself)
          sealed.prepend(unfoundGlyph());
          sealed.style.opacity = '.6';
          continue;
        }
        const w = WEAPONS[id];
        const level = g.player.reinforced[id];
        const b = button(list, `${w.name}${level ? ` +${level}` : ''}${id === g.player.weapon ? '    ·  in hand' : ''}`, () => {
          equip(g, id);
          show(page);
        });
        b.prepend(weaponGlyph(id));
        if (isNew(g, 'weapon', id)) price(b, 'NEW');
        b.dataset.hint = `${w.note}\n${weaponStats(w, might(g, g.player.id) * edgeAt(level))}`;
      }
      heading(p, 'SIDEARM').style.margin = '14px 14px 4px';
      const shot = Math.round(PLAYER_MOVES.shoot.shot.damage * might(g, g.player.id) * gunEdge(g.player.gun));
      const left = (m: number): number => Math.round(100 * falloff(m, g.player.gun));
      el(p, 'div', `Revolver${g.player.gun ? ` +${g.player.gun}` : ''}   ·   ${g.player.ammo}/${GUN.chamber} loaded   ·   ${g.player.rounds} spare`, 'padding:4px 14px 0');
      el(p, 'div', `shot ${shot}  ·  ${left(6)}% at 6 m  ·  ${left(9)}% at 9 m  ·  ${left(12)}% at 12 m`, 'padding:0 14px;opacity:.55;font-size:12px;font-variant-numeric:lining-nums tabular-nums');
      const [found, slots] = [owned(g), slotsOf(g)];
      heading(p, `RELICS  ·  ${found.length} OF ${RELIC_IDS.length} FOUND  ·  ${slots.filter(Boolean).length} OF ${RELIC_SLOTS} WORN`).style.margin = '14px 14px 4px';
      for (const id of found) {
        const at = slots.indexOf(id);
        const b = button(p, `${RELICS[id].name}${at >= 0 ? '    ·  worn' : '    ·  kept'}`, () => undefined, true, `${RELICS[id].note}\n${at >= 0 ? 'Worn.' : 'Not worn: it does nothing until it is put on.'} Changed at an Elder Sign.`);
        b.prepend(relicGlyph(id));
        if (isNew(g, 'relic', id)) price(b, 'NEW');
        effectChips(b, id);
      }
      const unfound = RELIC_IDS.length - found.length;
      if (unfound > 0) el(p, 'div', `${unfound === 1 ? 'One more is' : `${unfound} more are`} left by a horror slain for good.`, 'padding:4px 14px 0;opacity:.5;font-style:italic;font-size:13px');
      el(p, 'div', 'Two are worn at a time; changed at an Elder Sign.', 'padding:2px 14px 0;opacity:.4;font-size:12px;font-style:italic');
      clearNew(g); // seen now: the pause menu's mark on Arms is gone
      footer(p, fill('Choose a weapon to take it up. {reload} reloads the revolver.'), back);
    },
  };
  return page;
}
