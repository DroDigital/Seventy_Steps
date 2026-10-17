# itch.io DLC redemption service

Node.js 24, with no npm dependencies. This is a server, never an Electron renderer module. Follow [the dashboard and desktop setup guide](../../docs/ITCH_DLC_SETUP.md) before enabling purchases.

Set the server variables listed in that guide, then run `npm run dlc:serve` from the repository root. It binds to `127.0.0.1:8787` by default. Terminate HTTPS at a reverse proxy and forward `/redeem`, `/claim`, `/download` and optionally `/health`. Disable query-string access logging at every proxy/CDN: itch sends the claim JWT in the URL. Do not cache these responses.

`ITCH_REDEEM_SECRET` must be the dashboard's full generated secret (at least 32 bytes), not a new password. `DLC_SIGNING_KEY_FILE` must be a protected file containing the existing publisher Ed25519 key. `DLC_DB_PATH` must be an absolute path on persistent storage; in-memory and relative paths are rejected. Product IDs and the public HTTPS redemption URL must match the game's `package.json`. Missing configuration stops startup. The only health response is `ok`; it never exposes configuration.

## Docker

Build with the repository root as context:

```sh
docker build -f services/itch-redeem/Dockerfile -t seventy-steps-dlc .
docker volume create seventy-steps-dlc-data
```

Create a private server-only environment file outside the repository using the host's secret manager. It supplies `ITCH_REDEEM_SECRET`, `ITCH_CHARIOT_SUB_PRODUCT_ID` and `ITCH_AUTOMOBILE_SUB_PRODUCT_ID`. Do not paste their values into shell history. Ensure the mounted private-key file is readable by container user UID 1000, and not publicly readable.

```sh
docker run -d --name seventy-steps-dlc --restart unless-stopped \
  --env-file /secure/seventy-steps-dlc.env \
  -e DLC_SIGNING_KEY_FILE=/run/secrets/dlc-signing-key.pem \
  --mount type=bind,src=/secure/seventy-steps.dlc-private.pem,dst=/run/secrets/dlc-signing-key.pem,readonly \
  --mount type=volume,src=seventy-steps-dlc-data,dst=/data \
  -p 127.0.0.1:8787:8787 seventy-steps-dlc
```

The Dockerfile and its dedicated ignore file include only the service, the public configuration and the shared verifier. Never bake secrets or the purchase database into an image. Keep the database directory on a local persistent volume that supports SQLite locking, with a single writable database shared by all requests. Do not deploy independent replicas with independent databases. Restrict volume access to the service. Back up SQLite with its online backup facility or while the service is stopped; preserve/reconcile every redeemed purchase when restoring. Keep a separate secure backup of the signing key.

## Claim and recovery behavior

`GET /redeem?jwt=...` verifies HS256, expiration and the allow-listed numeric product ID. It checks the external ID if itch includes it. The token is not stored. A secure, HttpOnly cookie identifies a short-lived session, and a 303 redirect removes the JWT from the displayed claim page URL. No unlock is issued by this GET.

The player's `POST /claim` requires the correct origin and CSRF token. A SQLite transaction signs a version-2 receipt containing the purchase ID, inserts the unique purchase ID, and marks that session claimed. A failed transaction grants nothing. A second session cannot redeem that purchase, including after a service restart. Only the claimed session can download that stored receipt from `/download`, repeatedly for 15 minutes after issuance, without making a new grant. Interrupted downloads can therefore be retried in the same browser; a later claim link in that session also resumes the existing receipt while the JWT remains valid. Before issuance, the session ends at the earlier of JWT expiry or 15 minutes.

There is deliberately no public endpoint that resets a purchase or retrieves a receipt from a guessed purchase ID. For recovery outside the original session, verify the buyer's itch purchase receipt through the creator dashboard and arrange delivery of the existing stored receipt through an appropriately private support channel. Do not delete the purchase record or publish the database. This service does not verify accounts or revoke offline files after refunds. Keep a backup of each downloaded unlock.

The default listener logs no requests or tokens. Error messages are generic. Add monitoring at the proxy without recording query strings, cookies, POST bodies or downloaded receipt contents. Apply the host's normal request-rate and body-size limits, and configure service restarts and storage alerts.

## Local verification

```sh
npx vitest run tests/itchDlc.test.mjs tests/itchDlcTools.test.mjs tests/itchRedeem.test.mjs tests/mountStoreUi.test.ts
npm run check
npm run build
```

Tests use synthetic secrets and purchases; they do not charge buyers. Before opening real sales, confirm a real dashboard-generated token uses HS256 with the configured project secret, both product IDs match, PayPal is offered, cookies survive the HTTPS proxy, and each Claim action downloads the correct appearance. This PR does not provision hosting, create itch sub-products, or set live dashboard secrets.
