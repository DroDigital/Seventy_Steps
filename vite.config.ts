import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };

/** The page's own version, for a crash report to name (ui/crashLog.ts). */
export default defineConfig({ define: { __APP_VERSION__: JSON.stringify(version) } });
