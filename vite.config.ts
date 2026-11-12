import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import { viteConfig } from './tools/demo/config.ts';

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };

/** The page's own version, for a crash report to name (ui/crashLog.ts), and the edition (tools/demo/config.ts: the demo is `--mode demo`). */
export default defineConfig(({ mode }) => viteConfig(mode, version));
