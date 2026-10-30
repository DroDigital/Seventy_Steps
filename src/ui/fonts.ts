/**
 * The interface's two typefaces (round 74, asked for): IM Fell English for what is read (SIL Open Font License) and Special Elite
 * (Apache 2.0, unused by any card since round 101); their licences and credits are in public/fonts. They are loaded before the game's
 * module (boot.ts), so a canvas card, which draws once and is never repainted, is never set in the fallback. One that
 * does not arrive leaves the system stack behind it in `hudKit` (which also sets what the fonts have no glyph for).
 */

export interface FontFile {
  family: string;
  file: string; // under public/fonts
  style: 'normal' | 'italic';
}

export const FONT_FILES: readonly FontFile[] = [
  { family: 'IM Fell English', file: 'IMFellEnglish-Regular.woff2', style: 'normal' },
  { family: 'IM Fell English', file: 'IMFellEnglish-Italic.woff2', style: 'italic' },
  { family: 'EB Garamond', file: 'EBGaramond-Regular.woff2', style: 'normal' },
  { family: 'EB Garamond', file: 'EBGaramond-Italic.woff2', style: 'italic' },
  { family: 'Special Elite', file: 'SpecialElite-Regular.woff2', style: 'normal' },
];

const GIVE_UP = 4000; // ms: a slow disk or a blocked file never holds the title back for longer

/** Never rejects: the fonts that load are added to the page, the rest are left to the stack's fallbacks. */
export async function loadFonts(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return;
  const loads = FONT_FILES.map(async (f) => {
    try {
      const face = new FontFace(f.family, `url(${import.meta.env.BASE_URL}fonts/${f.file}) format('woff2')`, { style: f.style, weight: '400' });
      document.fonts.add(await face.load());
    } catch (error) {
      console.warn(`font ${f.file} did not load; the system face stands in`, error);
    }
  });
  await Promise.race([Promise.all(loads), new Promise<void>((done) => setTimeout(done, GIVE_UP))]);
}
