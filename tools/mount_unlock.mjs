// Makes and checks the unlock codes of the itch.io "Mounts" project (round 85: desktop/mountUnlock.js, docs/MOUNTS.md).
//   node tools/mount_unlock.mjs keygen <private key file>                makes the key pair: the private key (PEM) is written to the file (it must be OUTSIDE the
//                                                                        repository: the tool refuses a path inside it) and the public key is printed for UNLOCK_PUBLIC_KEY
//   node tools/mount_unlock.mjs sign <private key file> [--mounts chariot,automobile] [--id halloween-2026]    prints a code (put it in the unlock file the buyers download)
//   node tools/mount_unlock.mjs check <a code, or a file that holds one>    says what the shipped public key makes of it
// The code is `SS-MOUNTS.<payload>.<signature>`; the same code opens the game for every buyer (an honour system), so a leaked one is
// retired by a new key pair, a new build and a new code.
import { createPrivateKey, generateKeyPairSync, sign } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { UNLOCK_FOR, UNLOCK_MOUNTS, UNLOCK_TAG, unlockedMounts } from '../desktop/mountUnlock.js';

const root = fileURLToPath(new URL('..', import.meta.url));

/** A fresh Ed25519 pair: the private key as PEM, the public key as the raw 32 bytes in base64 (what the game holds). */
export function newKeyPair() {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  return {
    privatePem: privateKey.export({ type: 'pkcs8', format: 'pem' }),
    publicKey: publicKey.export({ type: 'spki', format: 'der' }).subarray(-32).toString('base64'),
  };
}

/** A code opening `mounts` (any of the game's optional ids), signed with the private key. */
export function signCode(privatePem, { mounts = UNLOCK_MOUNTS, id = '' } = {}) {
  const payload = Buffer.from(JSON.stringify({ v: 1, for: UNLOCK_FOR, mounts: [...mounts], id })).toString('base64url');
  const head = `${UNLOCK_TAG}.${payload}`;
  return `${head}.${sign(null, Buffer.from(head), createPrivateKey(privatePem)).toString('base64url')}`;
}

function main(argv) {
  const [command, target, ...rest] = argv;
  const flag = (name) => (rest.includes(name) ? rest[rest.indexOf(name) + 1] : undefined);
  const fail = (text) => {
    console.error(text);
    process.exit(2);
  };
  if (command === 'keygen') {
    if (!target) fail('Name the file for the private key (outside the repository).');
    const file = resolve(target);
    if (!relative(root, file).startsWith('..')) fail(`${file} is inside the repository: a private key must never be committed. Choose a path outside it.`);
    if (existsSync(file)) fail(`${file} exists: it is not overwritten (a new key would retire every code made with the old one).`);
    const { privatePem, publicKey } = newKeyPair();
    writeFileSync(file, privatePem, { mode: 0o600 });
    console.log(`Private key written to ${file} (keep it safe; whoever holds it can make codes).\nPut this in desktop/mountUnlock.js as UNLOCK_PUBLIC_KEY:\n${publicKey}`);
  } else if (command === 'sign') {
    if (!target || !existsSync(target)) fail('Name the private key file made by keygen.');
    const mounts = (flag('--mounts') ?? UNLOCK_MOUNTS.join(',')).split(',').map((s) => s.trim()).filter(Boolean);
    const unknown = mounts.filter((m) => !UNLOCK_MOUNTS.includes(m));
    if (unknown.length || !mounts.length) fail(`--mounts takes ${UNLOCK_MOUNTS.join(', ')} (got "${mounts.join(',')}").`);
    const code = signCode(readFileSync(target, 'utf8'), { mounts, id: flag('--id') ?? '' });
    if (!unlockedMounts(code)) fail('The code made does not verify against the public key the game holds (UNLOCK_PUBLIC_KEY): the private key is not its pair.');
    console.log(code);
  } else if (command === 'check') {
    if (!target) fail('Give a code, or a file that holds one.');
    const opens = unlockedMounts(existsSync(target) ? readFileSync(target, 'utf8') : target);
    console.log(opens ? `valid: opens ${opens.mounts.join(' and ')}${opens.id ? ` (${opens.id})` : ''}` : 'not valid for this game');
    process.exit(opens ? 0 : 1);
  } else {
    fail('node tools/mount_unlock.mjs keygen <private key file> | sign <private key file> [--mounts a,b] [--id name] | check <code or file>');
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main(process.argv.slice(2));
