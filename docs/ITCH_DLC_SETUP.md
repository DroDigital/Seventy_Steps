# Sell the cosmetic mounts on itch.io

The itch desktop build supports two independent cosmetic purchases: **The Spectral Chariot** and **The Brassbound Motor Car**, each with a minimum price of **US $0.99**. The included Chariot remains free. All three use the same movement settings, and the paid appearances still require completion of *The Borrowed Reins*.

The game opens a configured itch.io product page in the player's browser. itch.io handles checkout, including PayPal when enabled for the seller. After payment, the player downloads that product's signed unlock file and imports it through the game's Mounts tab. No PayPal credentials, payment-card details, itch seller API key, or signing private key belong in the game.

## Current setup

The public verification key is configured in `package.json` under `itchDlc.publicKey`. The two paid download files have been generated locally:

- `release/dlc/spectral-chariot.seventysteps-dlc`
- `release/dlc/brassbound-motor-car.seventysteps-dlc`

These files and the publisher's private key are excluded from git. They must also stay out of the freely downloadable base build and public release attachments. The product URLs are currently empty, so the game's purchase buttons show **Purchase setup pending** until real product pages are configured and the updated game is shipped.

## Enable PayPal checkout

1. Sign in to the itch.io account that owns [Seventy Steps](https://digitaldro.itch.io/seventy-steps), then open [Seller Settings](https://itch.io/user/settings/seller).
2. If this account already accepts PayPal purchases, keep its existing payment mode. Otherwise choose a supported payment mode:
   - **Collected by itch.io:** complete itch.io's seller onboarding, tax interview and seller terms. itch.io offers the supported buyer payment methods, including PayPal, and collects the payments. Configure your payout method separately to receive earnings.
   - **Direct to you:** connect the PayPal account that should receive payments. Some regions require a business PayPal account; follow the requirements shown by itch.io and PayPal.
3. Confirm that PayPal is offered by the product's checkout before announcing it for sale. Do not substitute a PayPal.me donation link: the downloadable product is delivered by itch.io after its own checkout.

The $0.99 price is a minimum before any additional tax or optional tip. Payment processing fees apply; itch.io notes that their fixed component is significant for purchases around $1. See the [official payment guide](https://itch.io/docs/creators/payments).

## Create two separate paid product pages

Use a separate project for each appearance so buyers can choose either one independently. Two files both priced at $0.99 on the base game's page would be a purchase tier: paying $0.99 would grant access to both files. See [itch.io's pricing rules](https://itch.io/docs/creators/pricing).

1. From the creator dashboard, create **Seventy Steps — The Spectral Chariot**. Describe it as optional cosmetic DLC requiring the desktop edition of Seventy Steps and the free mount quest. Link to the base game and explain the import steps below.
2. Set pricing to **Paid**, with a minimum of **US $0.99**. Upload only `spectral-chariot.seventysteps-dlc` as its downloadable unlock file. Do not enable free downloads for this file.
3. Create **Seventy Steps — The Brassbound Motor Car** in the same way, uploading only `brassbound-motor-car.seventysteps-dlc`, also at **US $0.99**.
4. Keep both new projects out of the base game's 100%-off promotion. Review the selected projects in any account-wide or future sale before publishing it.
5. Publish the two product pages and check each public checkout. Each page must deliver its own file, and its PayPal option must work through itch.io.

Do not attach these files to a free upload channel or commit them as sample data. The native itch.io Sub-products API is a different integration: its documented redemption flow requires a server, a private redeem secret, and a purchase database. This implementation uses ordinary paid downloadable projects.

## Configure the purchase buttons and ship

Copy the two actual published URLs into `package.json`:

- `itchDlc.urls.chariot`: the Spectral Chariot's product URL.
- `itchDlc.urls.automobile`: the Brassbound Motor Car's product URL.

Accepted URLs use `https://digitaldro.itch.io/` followed by the real project slug, optionally ending in `/purchase`. The base game's own page is not accepted as a DLC checkout. Do not invent slugs or use a PayPal URL in these fields.

Build, check and publish the updated itch edition through the normal [release process](RELEASE.md). Existing downloads will not gain working purchase buttons until players install this updated build. Checkout pages alone do not activate either appearance.

## Player instructions

1. Update to the desktop build that supports itch mount unlock files.
2. At an Elder Sign, open **Mounts** and choose **Buy on itch.io · $0.99** for the desired appearance.
3. Finish checkout on itch.io, choosing PayPal if desired, then download that appearance's `.seventysteps-dlc` file from the purchase's download page.
4. Return to **Mounts**, choose **Import mount unlock file**, and select the downloaded file. Import the other product's file separately if you bought both.
5. After completing *The Borrowed Reins*, select the unlocked appearance. Use **Refresh DLC ownership** if needed.

Imported files are kept in the user's game data folder under `dlc/`, separately from both the installation and `saves/`. Normal game updates preserve them. Keep the original download or your itch.io purchase link as a backup. A Steam build continues to use Steam's DLC ownership checks; an itch unlock file does not grant a Steam DLC license.

## Signing-key maintenance

The initial setup used this private-key path outside the repository:

```sh
node tools/itch_dlc.mjs init --key /workspace/work/seventy-steps.dlc-private.pem
node tools/itch_dlc.mjs pack --key /workspace/work/seventy-steps.dlc-private.pem
```

`init` has already run; do not generate a replacement key for routine builds. `pack` can recreate the two product files using that same private key. Keep a secure, persistent backup of the private key outside git and outside the base game's distribution; this workspace alone is not a backup. Use the restored private-key path when running these commands on another machine.

Only the public verification key ships with the game. Do not publish, print, email, or upload the private key as part of a DLC product. Do not rotate the configured public key without a migration plan: files signed with the previous key would stop working in new builds. If the private key is lost, restore its backup instead of replacing the configured publisher.

## Verification and limits

Before announcing the products, verify both paid downloads on the itch build: a valid file imports only its own appearance; editing its product name or signature fails; imported unlocks survive a restart and game update; the free Chariot and shared movement remain available as before. Verify both real checkout pages and their file delivery separately. Do not make a real charge solely as an automated test.

This is DRM-free downloadable DLC. The signature verifies that the publisher issued the file; it does not identify the individual buyer. Files can be copied between computers, and refunds do not automatically revoke an already downloaded offline unlock. No payment is accepted or marked successful by the game itself. Online purchase verification and refund revocation would require a different integration.
