// Provision the redemption server's publisher key. The private key must stay outside git and game builds.
// node tools/itch_dlc.mjs init --key /private/path/seventy-steps.dlc-private.pem
// Only the redemption server issues purchase-specific unlocks after verifying an itch.io sub-product purchase.
import { createPrivateKey, createPublicKey, generateKeyPairSync } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const args = process.argv.slice(2);
const keyArg = args[args.indexOf('--key') + 1];
const fail = (message) => { console.error(message); process.exit(2); };
if (args[0] !== 'init') fail('Use init --key <private path>. Purchase-specific unlocks are issued by the redemption server, not this tool.');
if (!args.includes('--key') || !keyArg || keyArg.startsWith('--')) fail('Provide --key with a private file path outside the repository.');
let keyPath = resolve(keyArg);
let ancestor = keyPath;
while (!existsSync(ancestor)) ancestor = dirname(ancestor);
keyPath = join(realpathSync(ancestor), relative(ancestor, keyPath));
const inside = relative(realpathSync(root), keyPath);
if (!isAbsolute(inside) && inside !== '..' && !inside.startsWith(`..${sep}`)) fail('The private signing key must be outside the repository, including through symlinks.');
const pkgPath = join(root, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));

if (!existsSync(keyPath)) {
  if (pkg.itchDlc?.publicKey) fail('A publisher key is already configured. Restore its private key; do not replace it and break existing paid unlocks.');
  const { privateKey } = generateKeyPairSync('ed25519');
  mkdirSync(dirname(keyPath), { recursive: true });
  writeFileSync(keyPath, privateKey.export({ type: 'pkcs8', format: 'pem' }), { mode: 0o600, flag: 'wx' });
}
const privateKey = createPrivateKey(readFileSync(keyPath));
if (privateKey.asymmetricKeyType !== 'ed25519') fail('The publisher key must be Ed25519.');
const publicKey = createPublicKey(privateKey).export({ type: 'spki', format: 'pem' }).toString();
if (pkg.itchDlc?.publicKey && pkg.itchDlc.publicKey !== publicKey) fail('That private key does not match the configured publisher.');
const config = { ...pkg.itchDlc };
delete config.urls;
pkg.itchDlc = {
  ...config,
  publicKey,
  purchaseUrl: config.purchaseUrl ?? 'https://digitaldro.itch.io/seventy-steps/purchase',
  redemptionUrl: config.redemptionUrl ?? '',
  products: {
    ...config.products,
    chariot: { externalId: 'spectral-chariot', subProductId: '', ...config.products?.chariot },
    automobile: { externalId: 'brassbound-motor-car', subProductId: '', ...config.products?.automobile },
  },
};
writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
console.log('Public verification key configured. Keep the private key securely on the redemption server; it is never included in the game.');
