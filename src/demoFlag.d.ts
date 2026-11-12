/**
 * True only in the demo build (vite.config.ts: `vite build --mode demo`), false in the dev server, the full build and the tests. The
 * demo's bundle must not hold the rest of the game, so code that names it is written `__DEMO__ ? <the demo's> : <the game's>` and the bundler
 * folds the condition and drops what only the dead side used (docs/DEMO_BUILD.md). Never read it for a runtime lock.
 */
declare const __DEMO__: boolean;
