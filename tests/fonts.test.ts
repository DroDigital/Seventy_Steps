import { existsSync, readFileSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { serveFrom } from '../desktop/serve.js';
import { FONT_FILES } from '../src/ui/fonts';
import { SERIF, TYPEWRITER } from '../src/ui/hudKit';

const families = [...new Set(FONT_FILES.map((f) => f.family))];
const first = (stack: string): string => stack.split(',')[0]!.replace(/'/g, '');

describe('the interface typefaces (round 74)', () => {
  it('ships each font as a WOFF2 file, small, with its licence and credit beside it', () => {
    const credits = readFileSync('public/fonts/CREDITS.md', 'utf8');
    for (const f of FONT_FILES) {
      const path = `public/fonts/${f.file}`;
      expect(existsSync(path), path).toBe(true);
      expect(Array.from(readFileSync(path).subarray(0, 4)), `${path} is not WOFF2`).toEqual([0x77, 0x4f, 0x46, 0x32]); // 'wOF2'
      expect(statSync(path).size, `${path} is large for a subset`).toBeLessThan(120_000);
      expect(credits, `${f.file} is not credited`).toContain(f.file);
    }
    for (const family of families) {
      const name = family.replace(/ /g, '');
      expect(existsSync(`public/fonts/OFL-${name}.txt`) || existsSync(`public/fonts/LICENSE-${name}.txt`), `${family} licence`).toBe(true);
    }
  });

  it('puts a loaded family first in each stack, with a system face behind it', () => {
    expect(families).toContain(first(SERIF));
    expect(families).toContain(first(TYPEWRITER));
    expect(SERIF).toMatch(/,serif$/);
    expect(TYPEWRITER).toMatch(/,monospace$/);
  });

  it('is served as a font by the desktop shell', async () => {
    const res = await serveFrom('public')(new Request('app://seventy-steps/fonts/IMFellEnglish-Regular.woff2'));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('font/woff2');
  });
});
