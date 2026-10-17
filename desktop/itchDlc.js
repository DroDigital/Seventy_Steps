/** DRM-free itch DLC: verify a publisher-signed download, never a save flag or a checkout return. */
import { createPublicKey, verify } from 'node:crypto';
import { mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const DLC_GAME = 'com.digitaldro.seventysteps';
export const DLC_LIMIT = 16_384;
export const paidMount = (id) => id === 'chariot' || id === 'automobile';
export const unlockPayload = (id) => `${DLC_GAME}\n1\n${id}\n`;
export const purchaseUnlockPayload = (id, purchaseId) => `${DLC_GAME}\n2\n${id}\n${purchaseId}\n`;
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

const PURCHASE_URL = 'https://digitaldro.itch.io/seventy-steps/purchase';
const PRODUCT_EXTERNAL_IDS = Object.freeze({ chariot: 'spectral-chariot', automobile: 'brassbound-motor-car' });
function subProductId(value) {
  if (typeof value !== 'number' && (typeof value !== 'string' || !/^[1-9]\d*$/.test(value))) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? String(id) : null;
}
function redemptionConfigured(value) {
  if (typeof value !== 'string' || value.includes('?') || value.includes('#')) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && url.pathname === '/redeem';
  } catch { return false; }
}

/** The renderer supplies a mount id, never a URL. Native itch sub-products stay on the base game's checkout. */
export function mountCheckoutUrl(id, pkg = readDlcPackage()) {
  if (!paidMount(id) || dlcChannel(pkg) !== 'itch' || !publicKey(pkg)) return null;
  const config = pkg?.itchDlc;
  if (config?.purchaseUrl !== PURCHASE_URL || !redemptionConfigured(config.redemptionUrl)) return null;
  const product = config.products?.[id];
  const productId = subProductId(product?.subProductId);
  const otherId = subProductId(config.products?.[id === 'chariot' ? 'automobile' : 'chariot']?.subProductId);
  if (!productId || productId === otherId || product.externalId !== PRODUCT_EXTERNAL_IDS[id]) return null;
  const url = new URL(PURCHASE_URL);
  url.searchParams.set('external_product_id', PRODUCT_EXTERNAL_IDS[id]);
  return url.href;
}

export function mountDlcStore(pkg = readDlcPackage()) {
  return { channel: dlcChannel(pkg), chariot: !!mountCheckoutUrl('chariot', pkg), automobile: !!mountCheckoutUrl('automobile', pkg) };
}

/** A signed file unlocks only the product it names; user-modified JSON does not grant another appearance. */
export function verifyMountUnlock(text, pkg = readDlcPackage()) {
  if (typeof text !== 'string' || Buffer.byteLength(text, 'utf8') > DLC_LIMIT || dlcChannel(pkg) !== 'itch') return null;
  try {
    const file = JSON.parse(text);
    if (file.game !== DLC_GAME || !paidMount(file.mount) || typeof file.signature !== 'string') return null;
    // Retain previously issued v1 files; native itch redemption always issues purchase-specific v2.
    if (file.version !== 1 && file.version !== 2) return null;
    if (file.version === 2 && (!Number.isSafeInteger(file.purchaseId) || file.purchaseId <= 0)) return null;
    const signature = Buffer.from(file.signature, 'base64');
    if (signature.length !== 64 || signature.toString('base64') !== file.signature) return null;
    const key = publicKey(pkg);
    const payload = file.version === 2 ? purchaseUnlockPayload(file.mount, file.purchaseId) : unlockPayload(file.mount);
    return key && verify(null, Buffer.from(payload), key, signature) ? file.mount : null;
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
