/**
 * Builds the demo into a directory, the way `npm run build:demo` does (`vite build --mode demo`, tools/demo/config.ts), with the given
 * pruning rules (the leak check's canary builds the whole game through the same path, with none). Used by the leak check's test.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import { viteConfig } from './config.ts';
import type { PruneRule } from './prune.ts';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));

export async function buildDemo(outDir: string, rules?: readonly PruneRule[], minify = true): Promise<void> {
  const { version } = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { version: string };
  const config = viteConfig('demo', version, rules);
  await build({ ...config, root: ROOT, configFile: false, logLevel: 'error', build: { ...config.build, outDir, emptyOutDir: true, minify } });
}
