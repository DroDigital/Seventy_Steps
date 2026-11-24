import { afterEach, describe, expect, it } from 'vitest';
import { keyLayout, rebind } from '../src/core/bindings';
import { useDevice } from '../src/core/device';
import { detectLocale, localeId, setLocale, t } from '../src/core/i18n';
import { LANGS, type Key } from '../src/data/lang';
import { EN } from '../src/data/lang/en';
import { SETTINGS } from '../src/data/tuning';
import { fill, padName } from '../src/ui/glyphs';

const places = (text: string): string[] => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
/** Strip `{slots}` and the lowercase SI seconds symbol (` s`) so all-caps lines with placeholders are checked too. */
const plain = (text: string): string => text.replace(/\{\w+\}/g, '').replace(/(^| )s(?=$| ·)/g, '$1');

describe('the languages (round 46)', () => {
  afterEach(() => {
    setLocale(0);
    useDevice('keys');
  });

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
        const bare = plain(v);
        if (bare === bare.toUpperCase() && /[A-Z]{4}/.test(bare)) {
          const line = plain((lang.table as Record<string, string>)[k]);
          expect(line, `${lang.id} ${k}`).toBe(line.toUpperCase());
        }
      }
    }
  });

  it('every hint and button-bearing notice names a real button on keyboard, rebound keys, and pad', () => {
    const hints = Object.keys(EN).filter((k) => k.startsWith('hint.')) as Key[];
    const buttonNotices: readonly Key[] = ['hud.signFound', 'n.newWeapon', 'hud.mountSummon', 'hud.mountRide', 'mounts.intro', 'map.press', 'sig.alertHelm', 'sig.umrOffer'];
    const was = { ...keyLayout };
    try {
      for (let i = 0; i < LANGS.length; i++) {
        setLocale(i);
        for (const device of ['keys', 'pad'] as const) {
          useDevice(device);
          for (const k of hints) {
            const shown = fill(t(k));
            expect(shown, `${LANGS[i].id} ${device} ${k}`).not.toMatch(/[{}]/);
          }
          for (const k of buttonNotices) {
            const shown = fill(t(k, { name: 'ARKHAM' }), true);
            expect(shown, `${LANGS[i].id} ${device} ${k}`).not.toMatch(/[{}]/);
          }
        }
      }
      setLocale(0);
      useDevice('keys');
      rebind(keyLayout, 'interact', 'KeyG');
      expect(fill(t('sig.alertHelm'), true)).toContain('G AT HER HELM');
      expect(fill(t('map.press'), true)).toBe('PRESS G');
      useDevice('pad');
      expect(fill(t('map.press'), true)).toBe('PRESS A');
      expect(fill(t('sig.alertHelm'), true)).toContain('A AT HER HELM');
      expect([padName('interact', 'xbox'), padName('interact', 'playstation'), padName('interact', 'nintendo')]).toEqual(['A', '✕', 'B']);
    } finally {
      Object.assign(keyLayout, was);
    }
  });

  it('t reads the language chosen, fills the places, and falls back to English for what is unknown', () => {
    expect(t('pause.resume')).toBe('Resume');
    expect(t('title.slot', { n: 2, line: 'empty' })).toBe('Slot 2  ·  empty');
    setLocale(1);
    expect(localeId()).toBe('de');
    expect(t('pause.resume')).toBe('Weiter');
    expect(t('n.noRounds')).toBe('KEINE PATRONEN');
    expect(t('sig.rams')).toBe('DIE ALERT RAMMT ES');
    setLocale(2);
    expect(t('sig.rams')).toBe('L’ALERT L’ÉPERONNE');
    setLocale(3);
    expect(t('sig.rams')).toBe('EL ALERT LO EMBISTE');
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
