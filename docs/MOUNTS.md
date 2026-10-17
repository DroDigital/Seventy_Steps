# Mounts

The plain chariot, one horse drawing a wooden coach, is included in the base game. The spectral chariot and the
automobile are optional cosmetic DLCs, each with a target US price of **$0.99**. Traversal, handling and every other
gameplay characteristic match the free chariot: all three share one frozen `MOUNT_TRAVERSAL` object. The early-game quest
unlocks mount use; owning either DLC does not skip the quest, and neither paid appearance is faster. The save id of the
included mount is still `grey`, so a journey saved before this change keeps it.

## Play and inspect

The Borrowed Reins is offered at the start of a new or resumed journey. Speak with Peaslee on the Miskatonic Quad,
then discover the Sleeper’s Sign (`hub_dream`); no boss, consumable or payment is required. The quest grants the plain chariot.
At any Elder Sign, the Mounts tab selects an available appearance. B (rebindable) or the pad’s L3 summons/dismisses it on clear,
dry open ground. Hold the dodge/sprint button while moving to gallop. Acting or taking damage dismisses it;
resting, travelling, death, forced movement and entering a boss fight also dismiss it. Riding into a dungeon
or a boss arena dismisses it at the threshold, and it cannot be summoned again until the investigator is outside.
Buildings, water and steep terrain still stop the ride where it stands.

Every appearance uses the exact same frozen `MOUNT_TRAVERSAL` object: cruise 11 m/s, gallop 18 m/s, shared
acceleration, braking, steering, terrain checks and a multi-circle footprint. Galloping uses normal sprint stamina.
The rider keeps the ordinary hurtbox; mounting gives no healing, stamina refill, invulnerability or combat bonus.
Only the preferred appearance is saved. Mount use resets on load; ownership is checked from Steam again.
Removal or failed ownership verification falls back to the included chariot.

The `?mounts` coach house is a standalone visual exhibit (keys 1–3) with orbit, rest/cruise/gallop, pause and inspection
resolution controls. It never opens a save or grants DLC access. The included chariot is the spectral coach's body and
seat, without curtains, crest, violet lamps or mourning black, drawn by one horse. That horse is a chestnut draft horse built in code (`horseBody.ts`, `horseLegs.ts`, `draftHorse.ts`). No mesh is imported.
The spectral chariot’s violet fire is parented to each skeleton horse’s spine, neck and hooves and kept dim. Procedural coachwork
is batched; the spectral horses' limbs are instanced.

A ride is heard as a body of sound (round 50; `data/mountSounds.ts`, `render/audio/mountAudio.ts`, `mountBed.ts`). They are the rider's own
foley (not placed in the world, or the follow camera would swallow them) and presentation only: nothing here is noise the simulation
hears. Every hoofbeat is a foot that comes down in the gait the picture shows (`systems/mountGait.ts`: the simulation counts the cycle
in `MountState.phase`, by metres ridden), panned by the foot, its timbre by the ground (dirt, road, stone, shallows) and by the shoe
(iron, or a skeleton's bone, with an echo); for the included horse a recorded footfall pitched down lies beneath. Beneath the beats, beds
follow the speed and the ground: a chassis roar, a soft low roll (a low-passed noise whose cut-off follows the ground, swelling a little with
the wheel's turn; it was a bandpassed rattle at the wheel's rate until round 52, which was metallic and tiring), the air rushing by, the motor
car's engine (four gears, it climbs through each with its speed, drops at the shift, and starts and stalls on summon and dismiss), the spectral chariot's
cold drone with a breath of wind through it that rises as it quickens. Over them: the leather and timber shifting on each second stride, timber creaks, soft wheel
thumps, a snort at the gallop and one now and then at rest (round 52 took out the brass jingle and the chain's rattle: most of their energy lay above
2.5 kHz). Every one-shot is held between -22 and -11 dBFS rms (a landed blow is about -18) and below full scale, a walking hoofbeat
5 dB under a gallop's and far above a footfall: `tests/mountAudio.test.ts`. A recorded set can replace the recipes later without
changing when they play.

## Turning (round 52)

A horse-drawn rig, the plain chariot and the spectral one, follows a circle (`systems/mountSteer.ts`, numbers in `MOUNT_TURNING`): the tightest circle
widens with the pace, so a turn takes it down toward a walk and no further and it never stops to turn; a standing horse steps round on the spot, and that
fades out as the pace quickens. The yaw rate takes hold and lets go over a few tenths of a second and never passes the heading the rig is coming round
to. The horses lead the carriage into the turn and bend with it (`bend` in `render/mountViews.ts`). The motor car keeps its arcade steering, with a creep in
place of a stop. In `moveMounted` (`mountMotion.ts`) a rotation the colliders refuse is tried at half and a quarter of its step, a scrape nudges the heading
away from the wall only while the rider is steering, and a jam of six frames backs the rig off the obstacle: a mount no longer holds still against a wall
it is turning on. `tests/mountTurning.test.ts` holds each of these (run against the previous code the stall tests fail).

Peaslee’s spoken lines do not name the mount. The journal, the completion notice, the Mounts tab and `hint.mount`
(English, German, French, Spanish) are what changed. A new voiced line would need a recording in `public/voice`.

The corrected automobile brief is **1890–1940**. The model uses a coherent circa-1914 touring silhouette,
documented in [the historical reference brief](MOUNT_CAR_REFERENCES.md). The automobile and the spectral coach are original procedural art in the
game’s retro pipeline. The plain chariot reuses that coach. Its horse is a chestnut draft horse of sixteen hands: a lofted barrel with haunches and shoulders, an arched neck, a flaxen mane and tail, a blaze, white stockings with feathered fetlocks, ears, eyes, and a black harness with brass (collar and hames, back pad and tugs, girth, breeching, crupper, bridle, blinkers and bit) hitched to the shafts. It is rigged on a horse's joints; each leg is a two-bone solve placing the fetlock, so hooves lie flat on the ground at every speed and each foot stands still on it while down. The gait is one pure model (`mountGait.ts`: walk, trot, canter, gallop, with the cycle's length and the share a foot is down), which also drives the skeleton horses' feet, the hoofbeats and the dust (`hoofFx.ts`).

## Steam entitlement

The desktop shell exposes `desktop.ownsAutomobileDlc()` and `desktop.ownsChariotDlc()`, each a `Promise<boolean>`.
Every call reads Steam's current `apps.isSubscribedApp` and `apps.isDlcInstalled` for that appearance's app id; both
must return true. The two ids must differ, and neither may be the base game id. The page cannot supply an app id.
No save file, browser storage flag or simulated purchase grants ownership. Each entitlement is false when Steam is
unavailable, its id is unset or invalid, the binding lacks either method, the check fails, or the build is packaged
for itch.io. A thrown check fails both closed. Browser builds have no Steam entitlement bridge. Refreshing ownership
can detect installation or removal while the game is running; no ownership is cached here.

The repository does not have live Steam app ids. Until `steam.chariotDlcAppId` (or `STEAM_CHARIOT_DLC_APP_ID`) is set,
the spectral chariot stays locked and the plain chariot is what a finished quest summons. Store configuration remains release work:

1. Create the chariot and the automobile as separate DLCs attached to the real base game in Steamworks.
2. Set each US price to $0.99 and review Steam's regional pricing before publishing.
3. Set `steam.appId` to the base game id and add `steam.automobileDlcAppId` and `steam.chariotDlcAppId` to `package.json`.
   `STEAM_AUTOMOBILE_DLC_APP_ID` and `STEAM_CHARIOT_DLC_APP_ID` override those for developer testing. Zero, an omitted id,
   the base game id, or the same number for both DLCs disables that access.
4. Configure each DLC so Steam reports it installed when enabled. The cosmetic assets ship in the base game build;
   there is no separate asset download in this implementation.
5. In a Steam test branch, verify an owner with each DLC installed, a non-owner, an owner with it disabled, offline
   startup, and refund/removal followed by an ownership refresh. Confirm the early quest grants only the plain chariot, and that
   all three appearances handle identically once owned. A non-Steam build offers only the plain chariot.

The game never starts a purchase or changes a Steam subscription. Unit tests use fake read-only Steam clients;
live account entitlement, checkout, regional pricing and refund behavior require the configured Steam test branch.

## Notes

Journal notes and letters use the burnt-paper screen by default (`documentSkin`: `kind === 'note'` is paper unless
`skin: 'plain'`). A future note gets that screen without a new call site. Tomes stay on the plain page unless
`skin: 'paper'`. Rumours, which are written notes, open on the same burnt paper. The world pickup (`figures.ts`
`note`) is one shared prop: a charred rim and two small embers, so every placed note matches. Bestiary field notes
stay in the journal; they are a catalog, not papers found in the world.

## Verification

- `npm run check` must pass before commit. The violet fire's shader compiled for no one until round 50 (an undeclared uniform): read the
  browser console for `Shader Error` after changing `mountEffects.ts`, in the game and at `?mounts`.
- Live Steam purchase and entitlement were not available here. The coach house at `?mounts` shows each mount at rest, a walk and a gallop.
