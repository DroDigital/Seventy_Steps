/**
 * The files a demo build may hold (docs/DEMO_BUILD.md): its page, its edition marker, its hashed scripts and styles, and the files the
 * demo ships (tools/demo/assets.ts, given the strings of the build's own bundle). Anything else in the demo's dist is a file of the
 * rest of the game.
 */

const SHELL = new Set(['index.html', 'edition.json']);
const SCRIPTS = /^assets\/[^/]+\.(js|css)$/;

export const allowedFile = (file: string, shipped: ReadonlySet<string>): boolean => SHELL.has(file) || SCRIPTS.test(file) || shipped.has(file);
