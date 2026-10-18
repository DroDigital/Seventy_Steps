/**
 * Which game this build is (round 56): the full game, or the free demo (systems/demo.ts). A pack is made a demo with
 * `-c.extraMetadata.edition=demo` (docs/RELEASE.md), which the desktop shell reads and hands the page (desktop/preload.cjs);
 * in a browser, `?demo` in the address shows it. Data only.
 */

export type Edition = 'full' | 'demo';

const shell = (globalThis as { desktop?: { edition?: string } }).desktop?.edition;
const asked = typeof location !== 'undefined' && new URLSearchParams(location.search).has('demo');

export const EDITION: Edition = shell === 'demo' || asked ? 'demo' : 'full';
