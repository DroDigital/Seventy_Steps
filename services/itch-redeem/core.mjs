/** Server-only itch purchase validation and durable, single-issue DLC redemption. Node >=24. */
import { createHash, createHmac, createPrivateKey, createPublicKey, randomBytes, sign, timingSafeEqual } from 'node:crypto';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { DLC_GAME, purchaseUnlockPayload } from '../../desktop/itchDlc.js';

const PRODUCTS = { chariot: 'spectral-chariot', automobile: 'brassbound-motor-car' };
const positiveId = value => Number.isSafeInteger(value) && value > 0;
const hash = value => createHash('sha256').update(value).digest('hex');
const seconds = () => Math.floor(Date.now() / 1000);
const SESSION_TTL = 15 * 60;

export class ClaimError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const invalid = () => new ClaimError(400, 'Invalid purchase link. Return to your itch.io purchase page and choose Claim again.');

function decode(segment) {
  if (!segment || !/^[A-Za-z0-9_-]+$/.test(segment)) throw invalid();
  const bytes = Buffer.from(segment, 'base64url');
  if (bytes.toString('base64url') !== segment) throw invalid();
  return bytes;
}

/** Pin the shared-secret JWT algorithm; never accept an unsigned token or a token-selected key. */
export function verifyPurchaseJwt(token, config, now = seconds()) {
  if (typeof token !== 'string' || token.length > 16_384) throw invalid();
  try {
    const segments = token.split('.');
    if (segments.length !== 3) throw invalid();
    const [headerPart, payloadPart, signaturePart] = segments;
    const header = JSON.parse(decode(headerPart).toString('utf8'));
    if (!header || header.alg !== 'HS256' || (header.typ !== undefined && header.typ !== 'JWT') || header.crit !== undefined || header.b64 !== undefined) throw invalid();
    const expected = createHmac('sha256', config.secret).update(`${headerPart}.${payloadPart}`).digest();
    const signature = decode(signaturePart);
    if (signature.length !== expected.length || !timingSafeEqual(signature, expected)) throw invalid();
    const payload = JSON.parse(decode(payloadPart).toString('utf8'));
    if (!payload || !positiveId(payload.purchase_id) || !positiveId(payload.sub_product_id) ||
        !Number.isSafeInteger(payload.iat) || !Number.isSafeInteger(payload.exp) || payload.iat <= 0 ||
        payload.iat > now + 30 || payload.exp <= payload.iat ||
        (payload.nbf !== undefined && (!Number.isSafeInteger(payload.nbf) || payload.nbf > now))) throw invalid();
    if (payload.exp <= now) throw new ClaimError(410, 'This claim link has expired. Return to your itch.io purchase page and choose Claim again.');
    const mount = Object.keys(PRODUCTS).find(id => config.products[id].subProductId === payload.sub_product_id);
    if (!mount || (payload.external_id !== undefined && payload.external_id !== PRODUCTS[mount])) throw invalid();
    return { purchaseId: payload.purchase_id, subProductId: payload.sub_product_id, mount, expires: payload.exp };
  } catch (error) {
    if (error instanceof ClaimError) throw error;
    throw invalid();
  }
}

/** Fail startup if deployment and the shipped game's public product configuration disagree. */
export function loadConfig(env, pkg) {
  if (!env.ITCH_REDEEM_SECRET || Buffer.byteLength(env.ITCH_REDEEM_SECRET) < 32) throw new Error('Set the dashboard-generated ITCH_REDEEM_SECRET (at least 32 bytes).');
  if (!env.DLC_SIGNING_KEY_FILE || !env.DLC_DB_PATH || !isAbsolute(env.DLC_DB_PATH)) throw new Error('Set DLC_SIGNING_KEY_FILE and an absolute, persistent DLC_DB_PATH.');
  const config = pkg.itchDlc;
  if (config?.purchaseUrl !== 'https://digitaldro.itch.io/seventy-steps/purchase') throw new Error('Configure the base game native checkout URL in package.json.');
  let redeem;
  try { redeem = new URL(config.redemptionUrl); } catch { throw new Error('Configure itchDlc.redemptionUrl with the deployed HTTPS /redeem URL.'); }
  if (redeem.protocol !== 'https:' || redeem.username || redeem.password || redeem.pathname !== '/redeem' ||
      config.redemptionUrl.includes('?') || config.redemptionUrl.includes('#')) throw new Error('The redemption URL must be HTTPS /redeem without credentials, query or fragment.');
  const privateKey = createPrivateKey(readFileSync(env.DLC_SIGNING_KEY_FILE));
  if (privateKey.asymmetricKeyType !== 'ed25519' || createPublicKey(privateKey).export({ type: 'spki', format: 'pem' }).toString() !== config.publicKey) throw new Error('The server signing key must match the game public key.');
  const products = {};
  for (const [mount, externalId] of Object.entries(PRODUCTS)) {
    const raw = env[mount === 'chariot' ? 'ITCH_CHARIOT_SUB_PRODUCT_ID' : 'ITCH_AUTOMOBILE_SUB_PRODUCT_ID'];
    const subProductId = typeof raw === 'string' && /^[1-9]\d*$/.test(raw) ? Number(raw) : NaN;
    const product = config.products?.[mount];
    if (!positiveId(subProductId) || product?.externalId !== externalId || String(product?.subProductId) !== raw) throw new Error(`Configure matching actual ${mount} sub-product IDs in the server and package.json.`);
    products[mount] = { subProductId, externalId };
  }
  if (products.chariot.subProductId === products.automobile.subProductId) throw new Error('The two sub-product IDs must be distinct.');
  return { secret: env.ITCH_REDEEM_SECRET, privateKey, products, dbPath: env.DLC_DB_PATH, origin: redeem.origin };
}

export class ClaimStore {
  constructor(config, now = seconds) {
    this.config = config;
    this.now = now;
    if (config.dbPath !== ':memory:') mkdirSync(dirname(config.dbPath), { recursive: true, mode: 0o700 });
    this.db = new DatabaseSync(config.dbPath);
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS purchases (
        purchase_id INTEGER PRIMARY KEY, sub_product_id INTEGER NOT NULL, mount TEXT NOT NULL,
        receipt TEXT NOT NULL, issued_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS sessions (
        token_hash TEXT PRIMARY KEY, purchase_id INTEGER NOT NULL, sub_product_id INTEGER NOT NULL,
        mount TEXT NOT NULL, csrf TEXT NOT NULL, expires INTEGER NOT NULL, claimed INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS session_expiry ON sessions(expires);`);
  }
  close() { this.db.close(); }
  session(token) {
    if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
    return this.db.prepare('SELECT * FROM sessions WHERE token_hash=? AND expires>?').get(hash(token), this.now()) ?? null;
  }
  start(token, previousToken) {
    const purchase = verifyPurchaseJwt(token, this.config, this.now());
    const previous = this.session(previousToken);
    const issued = this.db.prepare('SELECT purchase_id FROM purchases WHERE purchase_id=?').get(purchase.purchaseId);
    if (issued) {
      if (previous?.claimed && previous.purchase_id === purchase.purchaseId && previous.sub_product_id === purchase.subProductId && previous.mount === purchase.mount) return previousToken;
      throw new ClaimError(409, 'This purchase has already been claimed. Use your saved unlock file, or contact the developer with your itch.io purchase receipt for recovery.');
    }
    // Clean expired sessions without storing the JWT or the purchaser's identity.
    this.db.prepare('DELETE FROM sessions WHERE expires<=?').run(this.now());
    const sessionToken = randomBytes(32).toString('base64url');
    this.db.prepare('INSERT INTO sessions(token_hash,purchase_id,sub_product_id,mount,csrf,expires) VALUES(?,?,?,?,?,?)')
      .run(hash(sessionToken), purchase.purchaseId, purchase.subProductId, purchase.mount, randomBytes(32).toString('base64url'), Math.min(purchase.expires, this.now() + SESSION_TTL));
    return sessionToken;
  }
  claim(token, csrf) {
    const session = this.session(token);
    if (!session) throw new ClaimError(410, 'Your claim session has expired. Return to itch.io and choose Claim again.');
    if (typeof csrf !== 'string' || csrf !== session.csrf) throw new ClaimError(403, 'Invalid claim request. Reload the claim page and try again.');
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const issued = this.db.prepare('SELECT * FROM purchases WHERE purchase_id=?').get(session.purchase_id);
      if (issued && (!session.claimed || issued.mount !== session.mount || issued.sub_product_id !== session.sub_product_id)) throw new ClaimError(409, 'This purchase has already been claimed. Contact the developer if you need to recover its unlock file.');
      if (!issued) {
        const receipt = JSON.stringify({ version: 2, game: DLC_GAME, mount: session.mount, purchaseId: session.purchase_id,
          signature: sign(null, Buffer.from(purchaseUnlockPayload(session.mount, session.purchase_id)), this.config.privateKey).toString('base64') }, null, 2) + '\n';
        this.db.prepare('INSERT INTO purchases(purchase_id,sub_product_id,mount,receipt,issued_at) VALUES(?,?,?,?,?)')
          .run(session.purchase_id, session.sub_product_id, session.mount, receipt, this.now());
        this.db.prepare('UPDATE sessions SET claimed=1,expires=? WHERE token_hash=?').run(this.now() + SESSION_TTL, hash(token));
      }
      this.db.exec('COMMIT');
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  download(token) {
    const session = this.session(token);
    if (!session?.claimed) throw new ClaimError(403, 'Claim your purchase before downloading its unlock file.');
    return this.db.prepare('SELECT mount,receipt FROM purchases WHERE purchase_id=? AND sub_product_id=? AND mount=?')
      .get(session.purchase_id, session.sub_product_id, session.mount);
  }
}
