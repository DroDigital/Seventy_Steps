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
const SHAPE = /SS-MOUNTS\.([A-Za-z0-9_-]{16,2048})\.([A-Za-z0-9_-]{86})/g; // 86 characters: a 64-byte signature, unpadded
/** How many codes a pack keeps: one for each purchase it was given (a code for one mount, then another for the other), the newest last. */
export const UNLOCK_KEEP = 8;

/** Every code in a text (a clipboard holding the whole unlock file, a line wrapped on the way, stray words, several codes), once each, in order. */
export function findCodes(text) {
  const flat = String(text ?? '').replace(/\s+/g, '');
  return [...new Set([...flat.matchAll(SHAPE)].map((m) => `${UNLOCK_TAG}.${m[1]}.${m[2]}`))];
}

/** The first code in a text: null when there is none. */
export const findCode = (text) => findCodes(text)[0] ?? null;

/** What one code opens: `{ mounts, id }` when its signature is the key's and its payload is ours, else null. Never throws. */
function opens(code, publicKey) {
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

/** What the codes in a text open together (a code for each mount adds up): `{ mounts, id }` of the first valid, else null. Never throws. */
export function unlockedMounts(text, publicKey = UNLOCK_PUBLIC_KEY) {
  const got = findCodes(text).map((code) => opens(code, publicKey)).filter(Boolean);
  if (!got.length) return null;
  return { mounts: UNLOCK_MOUNTS.filter((id) => got.some((g) => g.mounts.includes(id))), id: got[0].id };
}

/** Whether this pack may honour a code at all: the itch.io full game. `pkg` as steam.js takes it (the program's own package.json when omitted). */
export const honoursCode = (pkg) => channel(pkg) === 'itch' && edition(pkg) === 'full';

/** The mounts a stored code opens in this pack: none outside an itch.io full game. */
export function mountsUnlockedHere(stored, pkg, publicKey) {
  return honoursCode(pkg) ? (unlockedMounts(stored, publicKey)?.mounts ?? []) : [];
}

/**
 * The player pressed "Paste unlock code": what the clipboard's text comes to, with the codes kept from before (`stored`, which a code for
 * the other mount must not replace). `ok` with the `code` to keep (every valid code, one a line, the newest last) and the `mounts` they
 * open together; else `reason`: `store` (this pack takes no code), `none` (no code in the text) or `invalid` (a code, but not one this
 * game's key signed).
 */
export function redeem(clipboard, pkg, publicKey, stored = '') {
  if (!honoursCode(pkg)) return { ok: false, reason: 'store' };
  const pasted = findCodes(clipboard);
  if (!pasted.length) return { ok: false, reason: 'none' };
  const fresh = pasted.filter((code) => opens(code, publicKey));
  if (!fresh.length) return { ok: false, reason: 'invalid' };
  const kept = findCodes(stored).filter((code) => opens(code, publicKey));
  const code = [...new Set([...kept, ...fresh])].slice(-UNLOCK_KEEP).join('\n');
  return { ok: true, mounts: unlockedMounts(code, publicKey).mounts, code };
}
