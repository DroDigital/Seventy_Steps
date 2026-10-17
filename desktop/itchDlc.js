/** DRM-free itch DLC: verify a publisher-signed download, never a save flag or a checkout return. */
import { createPublicKey, verify } from 'node:crypto';
import { mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const DLC_GAME = 'com.digitaldro.seventysteps';
export const DLC_LIMIT = 16_384;
export const paidMount = (id) => id === 'chariot' || id === 'automobile';
export const unlockPayload = (id) => `${DLC_GAME}\n1\n${id}\n`;
export const readDlcPackage = () => JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

function publicKey(pkg) {
  try {
    const pem = pkg?.itchDlc?.publicKey;
    if (typeof pem !== 'string' || !pem.startsWith('-----BEGIN PUBLIC KEY-----')) return null;
    const key = createPublicKey(pem);
    return key.asymmetricKeyType === 'ed25519' ? key : null;
  } catch { return null; }
}

/** Source builds without a configured Steam app are itch builds for DLC purposes too. */
export const dlcChannel = (pkg) => pkg?.channel === 'itch' || (!pkg?.channel && !pkg?.steam?.appId) ? 'itch' : 'steam';

/** The renderer supplies a product id, never a URL. Only the publisher's configured itch pages can open. */
export function mountCheckoutUrl(id, pkg = readDlcPackage()) {
  if (!paidMount(id) || dlcChannel(pkg) !== 'itch' || !publicKey(pkg)) return null;
  try {
    const url = new URL(pkg?.itchDlc?.urls?.[id]);
    if (url.protocol !== 'https:' || url.hostname !== 'digitaldro.itch.io' || url.port || url.username || url.password) return null;
    // Separate paid product pages, not the base game checkout or an arbitrary site.
    if (!/^\/[a-z0-9][a-z0-9-]*(?:\/purchase)?\/?$/.test(url.pathname) || /^\/seventy-steps(?:\/purchase)?\/?$/.test(url.pathname)) return null;
    return url.href;
  } catch { return null; }
}

export function mountDlcStore(pkg = readDlcPackage()) {
  return { channel: dlcChannel(pkg), chariot: !!mountCheckoutUrl('chariot', pkg), automobile: !!mountCheckoutUrl('automobile', pkg) };
}

/** A signed file unlocks only the product it names; user-modified JSON does not grant another appearance. */
export function verifyMountUnlock(text, pkg = readDlcPackage()) {
  if (typeof text !== 'string' || Buffer.byteLength(text, 'utf8') > DLC_LIMIT || dlcChannel(pkg) !== 'itch') return null;
  try {
    const file = JSON.parse(text);
    if (file.version !== 1 || file.game !== DLC_GAME || !paidMount(file.mount) || typeof file.signature !== 'string') return null;
    const signature = Buffer.from(file.signature, 'base64');
    if (signature.length !== 64 || signature.toString('base64') !== file.signature) return null;
    const key = publicKey(pkg);
    return key && verify(null, Buffer.from(unlockPayload(file.mount)), key, signature) ? file.mount : null;
  } catch { return null; }
}

export function ownsItchMount(id, dir, pkg = readDlcPackage()) {
  if (!paidMount(id) || dlcChannel(pkg) !== 'itch') return false;
  try {
    const path = join(dir, `${id}.seventysteps-dlc`);
    if (statSync(path).size > DLC_LIMIT) return false;
    return verifyMountUnlock(readFileSync(path, 'utf8'), pkg) === id;
  } catch { return false; }
}

/** Keep validated DLC in user data, outside the installation and save files. */
export function installMountUnlock(text, dir, pkg = readDlcPackage()) {
  const mount = verifyMountUnlock(text, pkg);
  if (!mount) return { status: 'invalid' };
  try {
    mkdirSync(dir, { recursive: true });
    const path = join(dir, `${mount}.seventysteps-dlc`);
    writeFileSync(`${path}.tmp`, text, { mode: 0o600 });
    renameSync(`${path}.tmp`, path);
    return { status: 'imported', mount };
  } catch { return { status: 'unavailable' }; }
}
