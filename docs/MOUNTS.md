# Mounts

The borrowed grey, a plain mare from the university stables, is included in the base game. The spectral chariot and the
automobile are optional cosmetic DLCs, each with a target US price of **$0.99**. Traversal, handling and every other
gameplay characteristic match the free grey: all three share one frozen `MOUNT_TRAVERSAL` object. The early-game quest
unlocks mount use; owning either DLC does not skip the quest, and neither paid appearance is faster.

## Play and inspect

The Borrowed Reins is offered at the start of a new or resumed journey. Speak with Peaslee on the Miskatonic Quad,
then discover the Sleeper’s Sign (`hub_dream`); no boss, consumable or payment is required. The quest grants the grey.
At any Elder Sign, the Mounts tab selects an available appearance. B (rebindable) or the pad’s L3 summons/dismisses it on clear,
dry open ground. Hold the dodge/sprint button while moving to gallop. Acting or taking damage dismisses it;
resting, travelling, death, forced movement and entering a boss fight also dismiss it. Dungeons, buildings,
water, steep terrain and boss grounds exclude mounted traversal.

Every appearance uses the exact same frozen `MOUNT_TRAVERSAL` object: cruise 11 m/s, gallop 18 m/s, shared
acceleration, braking, steering, terrain checks and a multi-circle footprint. Galloping uses normal sprint stamina.
The rider keeps the ordinary hurtbox; mounting gives no healing, stamina refill, invulnerability or combat bonus.
Only the preferred appearance is saved. Mount use resets on load; ownership is checked from Steam again.
Removal or failed ownership verification falls back to the included grey.

The `?mounts` coach house is a standalone visual exhibit (keys 1–3) with orbit, rest/cruise/gallop, pause and inspection
resolution controls. It never opens a save or grants DLC access. The grey is one saddled mare with a cool breath.
The chariot’s violet fire is parented to each skeleton horse’s spine, neck and hooves and kept dim. Procedural coachwork
is batched; horse limbs are instanced.

Travel sounds are the rider’s own foley (not placed in the world, or the follow camera would swallow them). They are
procedural placeholders in `src/render/audio/mountAudio.ts`: a nicker, breath and snort for the grey; a hollow wind,
paired hooves, harness and creak for the chariot; an engine for the motor car; wheels on both wheeled mounts; a summon
and a dismiss. Hoof and wheel timbre follows dirt, road, stone and water, and the stride shortens into a gallop.
Rendered peaks sit under −12 dBFS and above about −24 dBFS. No new audio files were added. A recorded set can replace
these recipes later without changing when they play.

Peaslee’s spoken lines do not name the mount. The journal, the completion notice, the Mounts tab and `hint.mount`
(English, German, French, Spanish) are what changed. A new voiced line would need a recording in `public/voice`.

The corrected automobile brief is **1890–1940**. The model uses a coherent circa-1914 touring silhouette,
documented in [the historical reference brief](MOUNT_CAR_REFERENCES.md). This is original procedural art in the
game’s retro pipeline. The grey is meant to be a simple early horse, in the spirit of a borrowed mare, and still wants
an in-engine look at silhouette, saddle and breath. The chariot’s fire wants the same pass for how subtle it reads in motion.

## Steam entitlement

The desktop shell exposes `desktop.ownsAutomobileDlc()` and `desktop.ownsChariotDlc()`, each a `Promise<boolean>`.
Every call reads Steam's current `apps.isSubscribedApp` and `apps.isDlcInstalled` for that appearance's app id; both
must return true. The two ids must differ, and neither may be the base game id. The page cannot supply an app id.
No save file, browser storage flag or simulated purchase grants ownership. Each entitlement is false when Steam is
unavailable, its id is unset or invalid, the binding lacks either method, the check fails, or the build is packaged
for itch.io. A thrown check fails both closed. Browser builds have no Steam entitlement bridge. Refreshing ownership
can detect installation or removal while the game is running; no ownership is cached here.

The repository does not have live Steam app ids. Until `steam.chariotDlcAppId` (or `STEAM_CHARIOT_DLC_APP_ID`) is set,
the spectral chariot stays locked and the grey is what a finished quest summons. Store configuration remains release work:

1. Create the chariot and the automobile as separate DLCs attached to the real base game in Steamworks.
2. Set each US price to $0.99 and review Steam's regional pricing before publishing.
3. Set `steam.appId` to the base game id and add `steam.automobileDlcAppId` and `steam.chariotDlcAppId` to `package.json`.
   `STEAM_AUTOMOBILE_DLC_APP_ID` and `STEAM_CHARIOT_DLC_APP_ID` override those for developer testing. Zero, an omitted id,
   the base game id, or the same number for both DLCs disables that access.
4. Configure each DLC so Steam reports it installed when enabled. The cosmetic assets ship in the base game build;
   there is no separate asset download in this implementation.
5. In a Steam test branch, verify an owner with each DLC installed, a non-owner, an owner with it disabled, offline
   startup, and refund/removal followed by an ownership refresh. Confirm the early quest grants only the grey, and that
   all three appearances handle identically once owned. A non-Steam build offers only the grey.

The game never starts a purchase or changes a Steam subscription. Unit tests use fake read-only Steam clients;
live account entitlement, checkout, regional pricing and refund behavior require the configured Steam test branch.

## Notes

Journal notes and letters use the burnt-paper screen by default (`documentSkin`: `kind === 'note'` is paper unless
`skin: 'plain'`). A future note gets that screen without a new call site. Tomes stay on the plain page unless
`skin: 'paper'`. Rumours, which are written notes, open on the same burnt paper. The world pickup (`figures.ts`
`note`) is one shared prop: a charred rim and two small embers, so every placed note matches. Bestiary field notes
stay in the journal; they are a catalog, not papers found in the world.

## Verification

- `npm run check` must pass before commit. In-engine review still wanted: the grey's silhouette and breath, how dim
  the violet fire reads while the horses move, and the mount mix against realm music and footsteps.
- Live Steam purchase and entitlement were not available here. Screenshot the coach house at `?mounts` when a browser can run.
