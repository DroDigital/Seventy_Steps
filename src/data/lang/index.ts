/**
 * The languages the interface is in (core/i18n.ts): English, the source, and the translations, each holding every key.
 * The Language setting holds a place in this list, so new languages go at the end.
 */

import { DE } from './de';
import { EN, type Key } from './en';
import { ES } from './es';
import { FR } from './fr';

export type { Key };
export const LANGS = [
  { id: 'en', name: 'English', table: EN as Readonly<Record<Key, string>> },
  { id: 'de', name: 'Deutsch', table: DE },
  { id: 'fr', name: 'Français', table: FR },
  { id: 'es', name: 'Español', table: ES },
] as const;
export type LangId = (typeof LANGS)[number]['id'];
