import { afterEach, describe, expect, it } from 'vitest';
import { detectLocale, localeId, setLocale, t } from '../src/core/i18n';
import { LANGS } from '../src/data/lang';
import { EN } from '../src/data/lang/en';
import { SETTINGS } from '../src/data/tuning';

const places = (text: string): string[] => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe('the languages (round 46)', () => {
  afterEach(() => setLocale(0));

  it('every language has every line, non-empty, with the same {places} as the English', () => {
    for (const lang of LANGS) {
      for (const [key, english] of Object.entries(EN)) {
        const line = (lang.table as Record<string, string | undefined>)[key];
        expect(line, `${lang.id} ${key}`).toBeTruthy();
        expect(places(line!), `${lang.id} ${key}`).toEqual(places(english));
      }
      expect(Object.keys(lang.table).length, lang.id).toBe(Object.keys(EN).length); // (none left over from a line that is gone)
    }
  });

  it('a language is told apart from English: most lines differ, and a line in capitals stays in capitals', () => {
    for (const lang of LANGS.slice(1)) {
      const same = Object.entries(EN).filter(([k, v]) => (lang.table as Record<string, string>)[k] === v).length;
      expect(same, lang.id).toBeLessThan(Object.keys(EN).length * 0.12); // (names and the odd word are alike)
      for (const [k, v] of Object.entries(EN)) {
        if (/^[A-Z0-9 ·{}×+−'.,:!?&-]+$/.test(v) && /[A-Z]{4}/.test(v)) {
          const line = (lang.table as Record<string, string>)[k];
          expect(line, `${lang.id} ${k}`).toBe(line.toUpperCase());
        }
      }
    }
  });

  it('t reads the language chosen, fills the places, and falls back to English for what is unknown', () => {
    expect(t('pause.resume')).toBe('Resume');
    expect(t('title.slot', { n: 2, line: 'empty' })).toBe('Slot 2  ·  empty');
    setLocale(1);
    expect(localeId()).toBe('de');
    expect(t('pause.resume')).toBe('Weiter');
    setLocale(99);
    expect(localeId()).toBe('en');
    expect(t('nothing.here' as never)).toBe('nothing.here');
  });

  it('a browser asks for its language by name, and gets English for any other', () => {
    expect(LANGS[detectLocale(['de-AT', 'en'])].id).toBe('de');
    expect(LANGS[detectLocale(['fr'])].id).toBe('fr');
    expect(LANGS[detectLocale(['pt-BR', 'es-MX'])].id).toBe('es');
    expect(LANGS[detectLocale(['ja'])].id).toBe('en');
    expect(detectLocale([])).toBe(0);
  });

  it('the Language setting reaches every language in the list', () => {
    expect(SETTINGS.language[1]).toBe(LANGS.length - 1);
    expect(SETTINGS.language[3]).toBe(0);
  });
});
