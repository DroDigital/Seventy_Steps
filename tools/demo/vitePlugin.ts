/**
 * The demo build's plugins (docs/DEMO_BUILD.md). `editionMarker` is in every production build: it writes dist/edition.json,
 * which the packaged shell and the smoke test read to be sure a pack is the edition it says it is. `demoStrip` is in the demo's
 * alone: it prunes the data tables of the rest of the game (tools/demo/rules) and writes only the demo's own files (tools/demo/assets.ts).
 */

import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import type { Plugin, ResolvedConfig } from 'vite';
import { demoShip, sourceOf } from './assets.ts';
import { literalsOf } from './leak.ts';
import { pruneModule, type PruneRule } from './prune.ts';
import { PRUNE_RULES, REST_MODULES } from './rules/index.ts';

export function editionMarker(demo: boolean): Plugin {
  return {
    name: 'seventy-steps:edition-marker',
    apply: 'build',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'edition.json', source: JSON.stringify({ edition: demo ? 'demo' : 'full' }) + '\n' });
    },
  };
}

/** A module's path as the rules write it: from the repository root, forward slashes, no query. */
const relativeId = (root: string, id: string): string => {
  const path = id.split('?')[0]!.replace(/\\/g, '/');
  const base = root.replace(/\\/g, '/').replace(/\/$/, '') + '/';
  return path.startsWith(base) ? path.slice(base.length) : path;
};

export function demoStrip(rules: readonly PruneRule[] = PRUNE_RULES): Plugin {
  const byFile = new Map<string, PruneRule[]>();
  for (const r of rules) byFile.set(r.file, [...(byFile.get(r.file) ?? []), r]);
  const seen = new Set<string>();
  let config: ResolvedConfig;
  return {
    name: 'seventy-steps:demo-strip',
    configResolved(c) {
      config = c;
    },
    config(_, env) {
      return env.command === 'build' ? { build: { copyPublicDir: false } } : {}; // public/ is copied by writeBundle, only what the demo ships
    },
    transform(code, id) {
      const file = relativeId(config.root, id);
      const mine = byFile.get(file);
      if (!mine) return null;
      seen.add(file);
      return { code: pruneModule(code, mine).code, map: null };
    },
    buildEnd() {
      for (const file of byFile.keys()) if (!seen.has(file)) this.error(`demo prune: ${file} has rules but was never part of the build (the rule is stale)`);
    },
    writeBundle(_options, bundle) {
      if (config.command !== 'build') return;
      const out = resolve(config.root, config.build.outDir);
      const lines = new Set<string>(); // the strings the bundle holds: a voice clip ships when its words are among them
      for (const item of Object.values(bundle)) if (item.type === 'chunk') for (const s of literalsOf(item.code)) lines.add(s);
      const ship = demoShip(config.root, lines);
      for (const f of ship.files) {
        const to = join(out, f);
        mkdirSync(dirname(to), { recursive: true });
        if (f === 'voice/index.json') {
          writeFileSync(to, JSON.stringify(ship.voiceIndex, null, 1) + '\n');
          continue;
        }
        const from = sourceOf(config.root, f);
        if (!existsSync(from)) throw new Error(`demo build: ${f} is listed for the demo but does not exist`);
        copyFileSync(from, to);
      }
    },
  };
}

/**
 * For the demo's tests (vitest has no tree-shaking, so what the build never reaches would still be read): a module that is wholly the
 * rest of the game reads as empty, and what the demo reaches of it is found missing at once.
 */
export function restStub(rest: readonly string[] = REST_MODULES): Plugin {
  const set = new Set(rest);
  let root = process.cwd();
  return {
    name: 'seventy-steps:rest-stub',
    configResolved(c) {
      root = c.root;
    },
    load(id) {
      return set.has(relativeId(root, id)) ? 'export {};\n' : null;
    },
  };
}
