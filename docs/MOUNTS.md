# Mounts

The spectral chariot, pulled by two skeleton horses, is included in the base game. The automobile is an optional
cosmetic DLC with a target US price of **$0.99**. Its traversal, handling and other gameplay characteristics
match the free chariot. The early-game quest unlocks mount use; owning the DLC does not skip the quest.

## Play and inspect

The Borrowed Reins is offered at the start of a new or resumed journey. Speak with Peaslee on the Miskatonic Quad,
then discover the Sleeper’s Sign (`hub_dream`); no boss, consumable or payment is required. At any Elder Sign,
the Mounts tab selects an available appearance. B (rebindable) or the pad’s L3 summons/dismisses it on clear,
dry open ground. Hold the dodge/sprint button while moving to gallop. Acting or taking damage dismisses it;
resting, travelling, death, forced movement and entering a boss fight also dismiss it. Dungeons, buildings,
water, steep terrain and boss grounds exclude mounted traversal.

Both appearances use the exact same frozen `MOUNT_TRAVERSAL` object: cruise 11 m/s, gallop 18 m/s, shared
acceleration, braking, steering, terrain checks and a multi-circle footprint. Galloping uses normal sprint stamina.
The rider keeps the ordinary hurtbox; mounting gives no healing, stamina refill, invulnerability or combat bonus.
Only the preferred appearance is saved. Mount use resets on load; ownership is checked from Steam again.
Removal or failed ownership verification falls back to the included chariot.

The `?mounts` coach house is a standalone visual exhibit with orbit, rest/cruise/gallop, pause and inspection
resolution controls. It never opens a save or grants DLC access. Procedural coachwork is batched; horse limbs
are instanced, with articulated gait, terrain response, flexible reins, suspension, steering and spectral flame.
Travel sounds are scheduled by actual movement; parked carriage wheels and rider footsteps stay quiet.

The corrected automobile brief is **1890–1940**. The model uses a coherent circa-1914 touring silhouette,
documented in [the historical reference brief](MOUNT_CAR_REFERENCES.md). This is original procedural art in the
game’s retro pipeline. The requested Elden Ring fidelity remains a quality target, not an established equivalence;
production art review and animation polish are still needed before presenting this as a premium showcase.

## Steam entitlement

The desktop shell exposes `desktop.ownsAutomobileDlc(): Promise<boolean>`. Every call reads Steam's current
`apps.isSubscribedApp` and `apps.isDlcInstalled` results for the configured DLC app id; both must return true.
The page cannot supply an app id. No save file, browser storage flag or simulated purchase grants ownership.
The entitlement is false when Steam is unavailable, the DLC id is unset or invalid, the binding lacks either
method, the check fails, or the build is packaged for itch.io. Browser builds have no Steam entitlement bridge.
Refreshing ownership can detect installation or removal while the game is running; no ownership is cached here.

The repository does not have live Steam app ids. Store configuration and pricing remain external release work:

1. Create the automobile as DLC attached to the real base game in the Steamworks partner site.
2. Set its US price to $0.99 and review Steam's regional pricing before publishing it.
3. Set `steam.appId` to the base game id and add `steam.automobileDlcAppId` to `package.json` with the DLC id.
   `STEAM_AUTOMOBILE_DLC_APP_ID` overrides the latter for developer testing. Zero or an omitted DLC id disables access;
   the base game id cannot be used as the DLC id.
4. Configure the DLC so Steam reports it installed when enabled. The cosmetic assets ship in the base game build;
   there is no separate asset download in this implementation.
5. In a Steam test branch, verify an owner with the DLC installed, a non-owner, an owner with it disabled/uninstalled,
   offline startup, and refund/removal followed by an ownership refresh. Confirm the early quest and identical handling
   with both appearances. A non-Steam build currently offers only the included chariot.

The game never starts a purchase or changes a Steam subscription. Unit tests use fake read-only Steam clients;
live account entitlement, checkout, regional pricing and refund behavior require the configured Steam test branch.

## Verification

- `npm run check`: 222 files, 2,199 tests passed; `npm run audit`: 11 files, 229 tests passed.
- `npm run build`: production bundle built successfully.
- Chromium: both exhibit models, gait/pause/orbit controls, locked/unlocked mount menu, forged-save ownership rejection,
  in-game seated mounts, camera transitions and ownership removal checked without runtime or shader errors.
- Production preview: automobile selection and exhibit controls passed at the standard 600×338 render resolution;
  the exhibit kept local storage empty. No live Steam purchase or entitlement was available to test.
