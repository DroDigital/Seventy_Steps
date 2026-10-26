/**
 * Round 84: the two optional mounts on itch.io. Steam has its own check (steam.js: the store says who owns a DLC); itch.io has no
 * DLC a game can ask about, so a buyer of the separate "Mounts" project downloads one small text file that holds a CODE, and
 * pastes it in the Mounts tab. The code is a signature: `SS-MOUNTS.<payload>.<signature>`, the payload (base64url JSON) naming
 * the mounts it opens, the signature Ed25519 over `SS-MOUNTS.<payload>` made with a private key that is not in this repository
 * (`tools/mount_unlock.mjs` makes the pair and signs). The game holds the public key only, so a made-up code fails; a SHARED
 * code is honoured, which is all an honour system can promise for $0.99 of appearances (docs/MOUNTS.md). Only an itch.io pack of
 * the full game honours a code (`channel` "itch", `edition` "full"); a Steam build never reads one and the demo has no paid mounts.
 * Nothing here is saved with a save: ownership is read again from the stored code each time it is asked (main.js).
 */

import { createPublicKey, verify } from 'node:crypto';
import { channel, edition } from './steam.js';

export const UNLOCK_TAG = 'SS-MOUNTS';
export const UNLOCK_FOR = 'seventy-steps-mounts';
/** The appearances a code may open (the ids of src/data/mounts.ts); an id it does not know is left out. */
export const UNLOCK_MOUNTS = Object.freeze(['chariot', 'automobile']);
/** The raw 32 bytes of the Ed25519 public key, base64. Rotating it (a leaked code) means a new build: tools/mount_unlock.mjs keygen. */
export const UNLOCK_PUBLIC_KEY = '5Eg9HLt56eztsnFPpiZxzPQMk3Sr+jbb1H7hpSHAFpo=';

const SPKI_ED25519 = Buffer.from('302a300506032b6570032100', 'hex'); // what DER puts before a raw Ed25519 key
const SHAPE = /SS-MOUNTS\.([A-Za-z0-9_-]{16,2048})\.([A-Za-z0-9_-]{86})/; // 86 characters: a 64-byte signature, unpadded

/** The code in a text (a clipboard holding the whole unlock file, a line wrapped on the way, stray words): null when there is none. */
export function findCode(text) {
  const m = SHAPE.exec(String(text ?? '').replace(/\s+/g, ''));
  return m ? `${UNLOCK_TAG}.${m[1]}.${m[2]}` : null;
}

/** What a code opens: `{ mounts, id }` when its signature is the key's and its payload is ours, else null. Never throws. */
export function unlockedMounts(text, publicKey = UNLOCK_PUBLIC_KEY) {
  const code = findCode(text);
  if (!code) return null;
  const [tag, payload, signature] = code.split('.');
  try {
    const key = createPublicKey({ key: Buffer.concat([SPKI_ED25519, Buffer.from(publicKey, 'base64')]), format: 'der', type: 'spki' });
    const signed = Buffer.from(signature, 'base64url');
    if (signed.length !== 64 || !verify(null, Buffer.from(`${tag}.${payload}`), key, signed)) return null;
    const body = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (body?.v !== 1 || body.for !== UNLOCK_FOR || !Array.isArray(body.mounts)) return null;
    const mounts = UNLOCK_MOUNTS.filter((id) => body.mounts.includes(id));
    return mounts.length ? { mounts, id: typeof body.id === 'string' ? body.id.slice(0, 64) : '' } : null;
  } catch {
    return null; // a key that is not a key, a payload that is not JSON
  }
}

/** Whether this pack may honour a code at all: the itch.io full game. `pkg` as steam.js takes it (the program's own package.json when omitted). */
export const honoursCode = (pkg) => channel(pkg) === 'itch' && edition(pkg) === 'full';

/** The mounts a stored code opens in this pack: none outside an itch.io full game. */
export function mountsUnlockedHere(stored, pkg, publicKey) {
  return honoursCode(pkg) ? (unlockedMounts(stored, publicKey)?.mounts ?? []) : [];
}

/**
 * The player pressed "Paste unlock code": what the clipboard's text comes to. `ok` with the `code` to keep and the `mounts` it opens;
 * else `reason`: `store` (this pack takes no code), `none` (no code in the text) or `invalid` (a code, but not one this game's key signed).
 */
export function redeem(clipboard, pkg, publicKey) {
  if (!honoursCode(pkg)) return { ok: false, reason: 'store' };
  const code = findCode(clipboard);
  if (!code) return { ok: false, reason: 'none' };
  const opens = unlockedMounts(code, publicKey);
  return opens ? { ok: true, mounts: opens.mounts, code } : { ok: false, reason: 'invalid' };
}
