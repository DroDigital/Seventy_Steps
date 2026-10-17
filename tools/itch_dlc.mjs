// Set up a publisher key, then produce paid unlock downloads. Private keys and paid files must stay out of git/base builds.
// node tools/itch_dlc.mjs init --key /private/path/seventy-steps.dlc-private.pem
// node tools/itch_dlc.mjs pack --key /private/path/seventy-steps.dlc-private.pem
import { createPrivateKey, createPublicKey, generateKeyPairSync, sign } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DLC_GAME, unlockPayload } from '../desktop/itchDlc.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const args = process.argv.slice(2);
const keyArg = args[args.indexOf('--key') + 1];
const fail = (message) => { console.error(message); process.exit(2); };
if (!args.includes('--key') || !keyArg || keyArg.startsWith('--')) fail('Provide --key with a private file path outside the repository.');
let keyPath = resolve(keyArg);
let ancestor = keyPath;
while (!existsSync(ancestor)) ancestor = dirname(ancestor);
keyPath = join(realpathSync(ancestor), relative(ancestor, keyPath));
const inside = relative(realpathSync(root), keyPath);
if (!isAbsolute(inside) && inside !== '..' && !inside.startsWith(`..${sep}`)) fail('The private signing key must be outside the repository, including through symlinks.');
const pkgPath = join(root, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));

if (args[0] === 'init') {
  if (!existsSync(keyPath)) {
    if (pkg.itchDlc?.publicKey) fail('A publisher key is already configured. Restore its private key; do not replace it and break existing paid downloads.');
    const { privateKey } = generateKeyPairSync('ed25519');
    mkdirSync(dirname(keyPath), { recursive: true });
    writeFileSync(keyPath, privateKey.export({ type: 'pkcs8', format: 'pem' }), { mode: 0o600, flag: 'wx' });
  }
  const privateKey = createPrivateKey(readFileSync(keyPath));
  if (privateKey.asymmetricKeyType !== 'ed25519') fail('The publisher key must be Ed25519.');
  const publicKey = createPublicKey(privateKey).export({ type: 'spki', format: 'pem' }).toString();
  if (pkg.itchDlc?.publicKey && pkg.itchDlc.publicKey !== publicKey) fail('That private key does not match the configured publisher.');
  pkg.itchDlc = { ...pkg.itchDlc, publicKey, urls: { chariot: '', automobile: '', ...pkg.itchDlc?.urls } };
  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  console.log('Public verification key configured. Back up the private key securely; it is never included in the game.');
} else if (args[0] === 'pack') {
  const privateKey = createPrivateKey(readFileSync(keyPath));
  const publicKey = createPublicKey(privateKey).export({ type: 'spki', format: 'pem' }).toString();
  if (!pkg.itchDlc?.publicKey || publicKey !== pkg.itchDlc.publicKey) fail('The signing key does not match package.json; initialize it first.');
  const dir = join(root, 'release', 'dlc');
  mkdirSync(dir, { recursive: true });
  for (const [mount, name] of [['chariot', 'spectral-chariot'], ['automobile', 'brassbound-motor-car']]) {
    const file = { version: 1, game: DLC_GAME, mount, signature: sign(null, Buffer.from(unlockPayload(mount)), privateKey).toString('base64') };
    writeFileSync(join(dir, `${name}.seventysteps-dlc`), `${JSON.stringify(file, null, 2)}\n`);
    console.log(`Prepared paid download: release/dlc/${name}.seventysteps-dlc`);
  }
} else fail('Use init or pack, followed by --key <private path>.');
