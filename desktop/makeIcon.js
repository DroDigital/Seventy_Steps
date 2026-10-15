/** `npm run icon`: writes the icons (desktop/icon.js) to build/, 1024 square, for packaging and the stores. */

import { mkdirSync, writeFileSync } from 'node:fs';
import { iconPng } from './icon.js';

mkdirSync(new URL('../build/', import.meta.url), { recursive: true });
writeFileSync(new URL('../build/icon.png', import.meta.url), iconPng(1024)); // Windows, Linux
writeFileSync(new URL('../build/icon-mac.png', import.meta.url), iconPng(1024, 'mac')); // the Mac app: set in, with a shadow
writeFileSync(new URL('../build/avatar.png', import.meta.url), iconPng(1024, 'plain')); // a store's profile picture: a plain square
