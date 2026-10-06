/**
 * Button names for the device in hand (playtest round 12: every prompt and hint said E, T, Space or
 * Esc even with a pad in hand). With keyboard and mouse a prompt names the key the player bound
 * (core/bindings.ts); with a pad, the standard layout's buttons as Steam shows them (A, B, RB…).
 * Texts carry `{action}` tokens that `fill` replaces.
 */

import { t } from '../core/i18n';
import { keyLayout, keyName } from '../core/bindings';
import { deviceInUse } from '../core/device';

export type Act = 'move' | 'look' | 'light' | 'heavy' | 'block' | 'parry' | 'dodge' | 'shoot' | 'reload' | 'lock' | 'heal' | 'item' | 'throw' | 'interact' | 'map' | 'journal' | 'pause' | 'back';

const PAD: Readonly<Record<Act, string>> = {
  move: 'the left stick',
  look: 'the right stick',
  light: 'RB',
  heavy: 'RT',
  block: 'LB',
  parry: 'LT',
  dodge: 'B',
  shoot: 'X',
  reload: 'D-pad ←',
  lock: 'R3',
  heal: 'Y',
  item: 'D-pad ↓',
  throw: 'D-pad ↑',
  interact: 'A',
  map: 'View',
  journal: 'Menu', // the pad has no button to spare: the pause menu holds it
  pause: 'Menu',
  back: 'B',
};

/** What the keyboard and mouse call an act. */
function keysName(act: Act): string {
  const k = keyLayout;
  switch (act) {
    case 'move':
      return [k.forward, k.left, k.back, k.right].map(keyName).join('');
    case 'look':
      return t('key.mouse');
    case 'light':
      return 'LMB';
    case 'heavy':
      return 'Shift+LMB';
    case 'block':
      return 'RMB';
    case 'parry':
      return 'Shift+RMB';
    case 'pause':
    case 'back':
      return 'Esc';
    default:
      return keyName(k[act]);
  }
}

/** The name of the button for `act` on the device in hand. */
const padName = (act: Act): string => (act === 'move' ? t('pad.moveStick') : act === 'look' ? t('pad.lookStick') : PAD[act]);
export const glyph = (act: Act): string => (deviceInUse() === 'pad' ? padName(act) : keysName(act));

/** `text` with each `{act}` replaced by its button's name (in capitals for a line in capitals). */
export const fill = (text: string, upper = false): string =>
  text.replace(/\{(\w+)\}/g, (m, act: string) => (act in PAD ? (upper ? glyph(act as Act).toUpperCase() : glyph(act as Act)) : m));
