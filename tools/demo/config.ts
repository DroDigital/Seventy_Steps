/**
 * The vite configuration of both editions, shared by `vite.config.ts` and the leak check's own builds (docs/DEMO_BUILD.md). The demo
 * is a build of its own (`vite build --mode demo`, `npm run build:demo`): `__DEMO__` is true in it alone, the rest of the game is
 * pruned out of its bundle (tools/demo/rules) and left out of its dist (tools/demo/assets.ts).
 *
 * What the demo's production build sets besides the pruning: the game's own modules are written without side effects at their top
 * level but for the entry (`main.ts`, `boot.ts`), and a module nothing of the demo reads must not ride along for the sake of a
 * registration it makes: so a module of src/ is dropped when nothing it exports is used. No sourcemaps: a map carries the names of
 * every module.
 */

import type { BuildEnvironmentOptions, UserConfig } from 'vite';
import type { PruneRule } from './prune.ts';
import { demoStrip, editionMarker } from './vitePlugin.ts';

export const DEMO_BUILD: BuildEnvironmentOptions = {
  sourcemap: false,
  rolldownOptions: {
    treeshake: {
      moduleSideEffects: [{ test: /\/src\/(?!main\.ts$|boot\.ts$)/, sideEffects: false }],
    },
  },
};

/** The config for a mode: `demo` is the demo's, any other the whole game's. `rules` is for the leak check's canary alone. */
export function viteConfig(mode: string, version: string, rules?: readonly PruneRule[]): UserConfig {
  const demo = mode === 'demo';
  return {
    define: { __APP_VERSION__: JSON.stringify(version), __DEMO__: JSON.stringify(demo) },
    plugins: [editionMarker(demo), ...(demo ? [demoStrip(rules)] : [])],
    ...(demo ? { build: DEMO_BUILD } : {}),
  };
}
