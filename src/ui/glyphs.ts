/**
 * Button names for the device in hand (playtest round 12: every prompt and hint said E, T, Space or
 * Esc even with a pad in hand). With keyboard and mouse a prompt names the key the player bound
 * (core/bindings.ts); with a pad, the standard layout's buttons as Steam shows them (A, B, RB…).
 * Texts carry `{action}` tokens that `fill` replaces.
 */

import { t } from '../core/i18n';
import { keyLayout, keyName } from '../core/bindings';
import { deviceInUse } from '../core/device';
import { padFamily, type PadFamily } from '../core/padFamily';
import { padInHand } from '../core/pads';

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

/** The same buttons as Sony and Nintendo print them (round 47): the standard layout numbers them by place, so the act stays on the same button. */
const FAMILY: Readonly<Record<Exclude<PadFamily, 'xbox'>, Partial<Record<Act, string>>>> = {
  playstation: { light: 'R1', heavy: 'R2', block: 'L1', parry: 'L2', dodge: '○', shoot: '□', heal: '△', interact: '✕', map: 'Create', journal: 'Options', pause: 'Options', back: '○' },
  nintendo: { light: 'R', heavy: 'ZR', block: 'L', parry: 'ZL', dodge: 'A', shoot: 'Y', heal: 'X', interact: 'B', map: '−', journal: '+', pause: '+', back: 'A' },
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
export function padName(act: Act, family: PadFamily = padFamily(padInHand())): string {
  if (act === 'move') return t('pad.moveStick');
  if (act === 'look') return t('pad.lookStick');
  return (family !== 'xbox' && FAMILY[family][act]) || PAD[act];
}
export const glyph = (act: Act): string => (deviceInUse() === 'pad' ? padName(act) : keysName(act));

/** `text` with each `{act}` replaced by its button's name (in capitals for a line in capitals). */
export const fill = (text: string, upper = false): string =>
  text.replace(/\{(\w+)\}/g, (m, act: string) => (act in PAD ? (upper ? glyph(act as Act).toUpperCase() : glyph(act as Act)) : m));
