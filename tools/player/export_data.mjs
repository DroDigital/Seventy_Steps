#!/usr/bin/env node
/**
 * Writes what the Blender tools (tools/player/*.py) need to know of the game as JSON into tools/player/build/game.json: every move of every
 * weapon (its frames and windows), the investigator's joint frame, the palette, and the lantern's colour. Read with Vite's own TypeScript loader, so
 * the numbers are the game's, not a copy. Run: node tools/player/export_data.mjs
 */
import { createServer } from 'vite';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const server = await createServer({ root, logLevel: 'error', server: { middlewareMode: true }, appType: 'custom' });
try {
  const { WEAPONS, WEAPON_IDS, armedMoves } = await server.ssrLoadModule('/src/data/weapons.ts');
  const { PLAYER_MOVES, REACTIONS } = await server.ssrLoadModule('/src/data/moves.ts');
  const { BASE } = await server.ssrLoadModule('/src/render/palette.ts');
  const { LANTERN } = await server.ssrLoadModule('/src/data/tuning.ts');
  const moves = {};
  for (const id of WEAPON_IDS) moves[id] = armedMoves(id);
  const out = { weapons: WEAPON_IDS, moves, base: BASE, lantern: LANTERN.color, reactions: REACTIONS, playerMoves: Object.keys(PLAYER_MOVES) };
  const dir = join(root, 'tools', 'player', 'build');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'game.json'), JSON.stringify(out, null, 1));
  console.log('wrote tools/player/build/game.json:', WEAPON_IDS.map((id) => `${id} ${Object.keys(moves[id]).length}`).join(', '));
} finally {
  await server.close();
}
