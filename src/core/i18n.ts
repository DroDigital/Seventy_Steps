/**
 * The game's words in the player's language (round 46). Every line of the interface is a key of the English table
 * (data/lang/en.ts), which is the source: `t('menu.settings')` reads the line in the language chosen, and where a
 * language has not the line, the English one. A line may carry `{name}` places that `vars` fill. The other tables are
 * typed to hold every key the English one does (so a line added there cannot be forgotten here, by the compiler), and
 * a test keeps their `{places}` the same. Pure: the language is chosen by `setLocale` (the Language setting).
 */

import { LANGS, type LangId } from '../data/lang';
import type { Key } from '../data/lang/en';

let current = 0;

/** The language in use, as its place in LANGS (what the Language setting holds). */
export const locale = (): number => current;
export const localeId = (): LangId => LANGS[current].id;

export function setLocale(i: number): void {
  current = Number.isInteger(i) && i >= 0 && i < LANGS.length ? i : 0;
}

/** The language a browser asks for, as its place in LANGS (English where it is none of them). */
export function detectLocale(preferred: readonly string[]): number {
  for (const p of preferred) {
    const i = LANGS.findIndex((l) => l.id === p.toLowerCase().split('-')[0]);
    if (i >= 0) return i;
  }
  return 0;
}

export function t(key: Key, vars?: Readonly<Record<string, string | number>>): string {
  const text = LANGS[current].table[key] ?? LANGS[0].table[key] ?? key;
  return vars ? text.replace(/\{(\w+)\}/g, (m, name: string) => (name in vars ? String(vars[name]) : m)) : text;
}
