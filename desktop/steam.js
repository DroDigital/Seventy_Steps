/**
 * Steam (round 47): the shell speaks to Steam through steamworks.js when Steam is there, and the game runs
 * as ever when it is not (a build run outside Steam, `npm run desktop`, a machine without it). What it does:
 * achievements (the game's own ids are the API names set up in Steamworks: docs/STEAM.md), the overlay, and,
 * in a release build, a relaunch through Steam when the game is started outside it. Saves need nothing here:
 * Steam Auto-Cloud keeps the saves folder (main.js). The app id: `STEAM_APP_ID`, else `steam.appId` in
 * package.json (0 until there is one), else a `steam_appid.txt` beside the program (Steam's own, for a dev run).
 * Another store's build (itch.io) is packed with `channel` set in its package.json (`-c.extraMetadata.channel=itch`): the shell then
 * keeps off Steam altogether, whatever app id is set (no relaunch through Steam, no overlay, no achievements sent).
 */

import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);

/** The app id, or undefined when none is set (steamworks.js then reads steam_appid.txt). */
export function steamAppId(env = process.env, pkg = readPkg()) {
  const id = Number(env.STEAM_APP_ID || pkg?.steam?.appId || 0);
  return Number.isInteger(id) && id > 0 ? id : undefined;
}

/** A positive DLC id, distinct from the base game. Unconfigured or invalid ids never grant access. */
function rawDlcId(raw, env, pkg) {
  if (typeof raw !== 'number' && (typeof raw !== 'string' || !/^\d+$/.test(raw))) return undefined;
  const id = Number(raw);
  return Number.isSafeInteger(id) && id > 0 && id <= 0xffffffff && id !== steamAppId(env, pkg) ? id : undefined;
}

/** The optional cosmetic automobile's DLC id. The same number as the chariot's id grants neither. */
export function automobileDlcAppId(env = process.env, pkg = readPkg()) {
  const id = rawDlcId(env.STEAM_AUTOMOBILE_DLC_APP_ID ?? pkg?.steam?.automobileDlcAppId ?? 0, env, pkg);
  const other = rawDlcId(env.STEAM_CHARIOT_DLC_APP_ID ?? pkg?.steam?.chariotDlcAppId ?? 0, env, pkg);
  return id !== undefined && id !== other ? id : undefined;
}

/** The optional spectral chariot's DLC id. The same number as the automobile's id grants neither. */
export function chariotDlcAppId(env = process.env, pkg = readPkg()) {
  const id = rawDlcId(env.STEAM_CHARIOT_DLC_APP_ID ?? pkg?.steam?.chariotDlcAppId ?? 0, env, pkg);
  const other = rawDlcId(env.STEAM_AUTOMOBILE_DLC_APP_ID ?? pkg?.steam?.automobileDlcAppId ?? 0, env, pkg);
  return id !== undefined && id !== other ? id : undefined;
}

function readPkg() {
  try {
    return JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  } catch {
    return null;
  }
}

/** The store this build is for: "itch" when packed for itch.io (docs/RELEASE.md), else "steam". */
export function channel(pkg = readPkg()) {
  return pkg?.channel === 'itch' ? 'itch' : 'steam';
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
  if (channel() !== 'steam') return false; // another store's build never goes through Steam
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
  if (channel() !== 'steam') return null;
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

/**
 * Read Steam's current ownership and installation state; nothing in a save can unlock paid content.
 * Rechecked on every call so installing/removing the DLC during a session takes effect on refresh.
 * Arguments allow a binding-free test; the IPC handler always calls this with the real client/config.
 */
function ownsApp(id, dlcClient, pkg) {
  if (channel(pkg) !== 'steam' || !dlcClient || !id) return false;
  try {
    return dlcClient.apps.isSubscribedApp(id) === true && dlcClient.apps.isDlcInstalled(id) === true;
  } catch {
    return false; // Steam unavailable, an older binding, or a failed entitlement check
  }
}

export function steamOwnsAutomobileDlc(dlcClient = client, env = process.env, pkg = readPkg()) {
  return ownsApp(automobileDlcAppId(env, pkg), dlcClient, pkg);
}

/** The spectral chariot, read the same way as the automobile: subscribed and installed, or locked. */
export function steamOwnsChariotDlc(dlcClient = client, env = process.env, pkg = readPkg()) {
  return ownsApp(chariotDlcAppId(env, pkg), dlcClient, pkg);
}

/** Whether the shell is speaking to Steam. */
export const steamOn = () => client !== null;

/** Whether steamworks.js (its native binding for this platform) loaded at all, Steam running or not: what a packed build is checked for (`--smoke-test`, main.js). */
export const steamBinding = () => !!load();
