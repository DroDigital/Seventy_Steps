/**
 * Steam (round 47): the shell speaks to Steam through steamworks.js when Steam is there, and the game runs
 * as ever when it is not (a build run outside Steam, `npm run desktop`, a machine without it). What it does:
 * achievements (the game's own ids are the API names set up in Steamworks: docs/STEAM.md), the overlay, and,
 * in a release build, a relaunch through Steam when the game is started outside it. Saves need nothing here:
 * Steam Auto-Cloud keeps the saves folder (main.js). The app id: `STEAM_APP_ID`, else `steam.appId` in
 * package.json (0 until there is one), else a `steam_appid.txt` beside the program (Steam's own, for a dev run).
 */

import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);

/** The app id, or undefined when none is set (steamworks.js then reads steam_appid.txt). */
export function steamAppId(env = process.env, pkg = readPkg()) {
  const id = Number(env.STEAM_APP_ID || pkg?.steam?.appId || 0);
  return Number.isInteger(id) && id > 0 ? id : undefined;
}

function readPkg() {
  try {
    return JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  } catch {
    return null;
  }
}

let lib = null;
let client = null;

function load() {
  if (lib !== null) return lib;
  try {
    lib = require('steamworks.js');
  } catch {
    lib = false; // no binding for this platform, or not installed
  }
  return lib;
}

/** Before the app is ready: the overlay must be asked for first. Returns true when a release build was relaunched through Steam (quit at once). */
export function steamEarly(packaged) {
  const sw = load();
  if (!sw) return false;
  const id = steamAppId();
  try {
    if (packaged && id && sw.restartAppIfNecessary(id)) return true;
    if (process.env.SteamGameId || process.env.SteamAppId) sw.electronEnableSteamOverlay(); // only when Steam started the game: the overlay's switches change how Chromium draws
  } catch {
    // Steam not running: the game goes on without it.
  }
  return false;
}

/** Steam's client, once the app is ready; null without Steam. */
export function startSteam() {
  const sw = load();
  if (!sw) return null;
  try {
    client = sw.init(steamAppId());
  } catch {
    client = null; // Steam is not running, or does not know this app
  }
  return client;
}

/** Tells Steam an achievement is earned (its API name is the game's id). True when Steam took it. */
export function steamAchieve(id) {
  if (!client) return false;
  try {
    return client.achievement.isActivated(id) || client.achievement.activate(id);
  } catch {
    return false;
  }
}

/** Whether the shell is speaking to Steam. */
export const steamOn = () => client !== null;
