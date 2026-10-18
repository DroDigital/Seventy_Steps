/**
 * Which game this build is (round 56): the full game, or the free demo (systems/demo.ts). A pack is made a demo with
 * `-c.extraMetadata.edition=demo` (docs/RELEASE.md), which the desktop shell reads and hands the page (desktop/preload.cjs);
 * in a browser, `?demo` in the address shows it, and the tab remembers it (session storage) through the game's own reloads,
 * which go back to the bare address (a return to the title, a crash's Try again, an ending's new game). Data only.
 */

export type Edition = 'full' | 'demo';

export const DEMO_KEY = 'lovecraft-souls-like/demo';

type Session = Pick<Storage, 'getItem' | 'setItem'>;

/** The edition, from the shell's word, else the address and what the tab remembers of it. A tab without storage has the address alone. */
export function editionOf(shell: string | undefined, search: string, session: Session | null): Edition {
  if (shell === 'demo') return 'demo';
  const asked = new URLSearchParams(search).has('demo');
  try {
    if (asked) session?.setItem(DEMO_KEY, '1');
    return asked || session?.getItem(DEMO_KEY) === '1' ? 'demo' : 'full';
  } catch {
    return asked ? 'demo' : 'full';
  }
}

const session = (): Session | null => {
  try {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage;
  } catch {
    return null; // (storage blocked: reading the property throws)
  }
};

export const EDITION: Edition = editionOf((globalThis as { desktop?: { edition?: string } }).desktop?.edition, typeof location === 'undefined' ? '' : location.search, session());
