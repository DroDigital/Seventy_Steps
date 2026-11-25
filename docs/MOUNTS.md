# Mounts

The plain chariot, one horse drawing a wooden coach, is included in the base game. The **Brassbound Motor Car** is an
optional cosmetic DLC (the Spectral Chariot is currently shelved from menus, the coach-house exhibit, and runtime
entitlement while remaining save-compatible — legacy saves with `mount: 'chariot'` load cleanly and fall back to the
included chariot). No DLC prices are shown inside the resting menu. Traversal, handling and every other gameplay
characteristic match the free chariot: all appearances share one frozen `MOUNT_TRAVERSAL` object. The early-game quest
unlocks mount use; owning optional DLC does not skip the quest, and no paid appearance is faster. The save id of the
included mount is still `grey`, so a journey saved before this change keeps it.

## Play and inspect

The Borrowed Reins is offered at the start of a new or resumed journey. Speak with Peaslee on the Miskatonic Quad,
then discover the Sleeper’s Sign (`hub_dream`); no boss, consumable or payment is required. The quest grants the plain chariot.
At any Elder Sign, the Mounts tab selects an available appearance (`OFFERED_MOUNT_IDS`: `grey` and `automobile`, with no
store prices displayed). B (rebindable) or the pad’s L3 summons/dismisses it on clear,
dry open ground. Hold the dodge/sprint button while moving to gallop. Acting or taking damage dismisses it;
resting, travelling, death, forced movement and entering a boss fight also dismiss it. Riding into a dungeon
or a boss arena dismisses it at the threshold, and it cannot be summoned again until the investigator is outside.
Buildings, water and steep terrain still stop the ride where it stands.

Every appearance uses the exact same frozen `MOUNT_TRAVERSAL` object: cruise 11 m/s, gallop 18 m/s, shared
acceleration, braking, steering, terrain checks and a multi-circle footprint. Galloping uses normal sprint stamina.
The rider keeps the ordinary hurtbox; mounting gives no healing, stamina refill, invulnerability or combat bonus.
Only the preferred appearance is saved. Mount use resets on load. The desktop build checks access again on load.
Removal or failed ownership verification falls back to the included chariot.

The `?mounts` coach house is a standalone visual exhibit (keys 1–2) with orbit, rest/cruise/gallop, pause and inspection
resolution controls. It never opens a save or grants DLC access. The included chariot is a wooden coach drawn by one
chestnut draft horse built in code (`horseBody.ts`, `horseLegs.ts`, `draftHorse.ts`). No mesh is imported.
The Brassbound Motor Car (`render/mountAutomobile.ts`, `render/automobileMotion.ts`) is a circa-1914 touring motorcar
with continuous swept S-curve fenders, tapered louvered bonnet, chamfered brass radiator with winged Moto-Meter and
spinning cooling fan, rounded rear tonneau, diamond-tufted oxblood leather benches, mahogany instrument dash, left-hand
steering wheel, animated brass gear lever and front steering tie-rod, coiled brass bulb horn, running-board Prest-O-Lite
acetylene tank and touring chest, rear spare artillery wheel, graceful fanned folding canvas canopy with an open rear
sightline window, volumetric acetylene headlamp beams, warm lamp halos, brake-reactive ruby tail-lamp, and damped
4-DOF suspension (launch squat, brake dive, cornering body roll, gear-shift pitch lurch, idle engine shudder, and
tailpipe exhaust puffs).

A ride is heard as a body of sound (round 50; `data/mountSounds.ts`, `render/audio/mountAudio.ts`, `mountBed.ts`). They are the rider's own
foley (not placed in the world, or the follow camera would swallow them) and presentation only: nothing here is noise the simulation
hears. Every hoofbeat is a foot that comes down in the gait the picture shows (`systems/mountGait.ts`: the simulation counts the cycle
in `MountState.phase`, by metres ridden), panned by the foot, its timbre by the ground (dirt, road, stone, shallows) and by the shoe
(iron, or a skeleton's bone, with an echo); for the included horse a recorded footfall pitched down lies beneath. Beneath the beats, beds
follow the speed and the ground: a chassis roar, a soft low roll (a low-passed noise whose cut-off follows the ground, swelling a little with
the wheel's turn; it was a bandpassed rattle at the wheel's rate until round 52, which was metallic and tiring), the air rushing by, and the
motor car's WaveShaper-warmed inline-4 engine (four gears, living dual-LFO idle lope, throttle-load intake growl, resonant cast-iron exhaust
manifold formant, low-gear planetary gearbox hum, multi-stroke crank start, stumbling shutdown, gear-shift clunks, mechanical braking scrub,
and triple-beat overrun exhaust pops). Over them for the horse: the leather and timber shifting on each second stride, timber creaks, soft
wheel thumps, a snort at the gallop and one now and then at rest (round 52 took out the brass jingle and the chain's rattle: most of their
energy lay above 2.5 kHz). Every one-shot is held between -28 and -17 dBFS rms since round 61 (the asides to -36; a landed blow is about
-18, and the whole ride was one notch, 6 dB, down) and below full scale, a walking hoofbeat 5 dB under a gallop's and far above a footfall:
`tests/mountAudio.test.ts`. A recorded set can replace the recipes later without changing when they play.

## Turning (round 52)

A horse-drawn rig follows a circle (`systems/mountSteer.ts`, numbers in `MOUNT_TURNING`): the tightest circle
widens with the pace, so a turn takes it down toward a walk and no further and it never stops to turn; a standing horse steps round on the spot, and that
fades out as the pace quickens. The yaw rate takes hold and lets go over a few tenths of a second and never passes the heading the rig is coming round
to. The horse leads the carriage into the turn and bends with it (`bend` in `render/mountViews.ts`). The motor car keeps its arcade steering, with a creep in
place of a stop, steering front wheels, animated tie-rod, and driver hands turning the wheel into curves. In `moveMounted` (`mountMotion.ts`) a rotation the colliders refuse is tried at half and a quarter of its step, a scrape nudges the heading
away from the wall only while the rider is steering, and a jam of six frames backs the rig off the obstacle: a mount no longer holds still against a wall
it is turning on. `tests/mountTurning.test.ts` holds each of these (run against the previous code the stall tests fail).

Peaslee’s spoken lines do not name the mount. The journal, the completion notice, the Mounts tab and `hint.mount`
(English, German, French, Spanish) are what changed. A new voiced line would need a recording in `public/voice`.

The corrected automobile brief is **1890–1940**. The model uses a coherent circa-1914 touring silhouette,
documented in [the historical reference brief](MOUNT_CAR_REFERENCES.md). The automobile and coach are original procedural art in the
game’s retro pipeline. The plain chariot's horse is a chestnut draft horse of sixteen hands: a lofted barrel with haunches and shoulders, an arched neck, a flaxen mane and tail, a blaze, white stockings with feathered fetlocks, ears, eyes, and a black harness with brass (collar and hames, back pad and tugs, girth, breeching, crupper, bridle, blinkers and bit) hitched to the shafts. It is rigged on a horse's joints; each leg is a two-bone solve placing the fetlock, so hooves lie flat on the ground at every speed and each foot stands still on it while down. The gait is one pure model (`mountGait.ts`: walk, trot, canter, gallop, with the cycle's length and the share a foot is down), which also drives the hooves and the dust (`hoofFx.ts`).

## Steam entitlement

The Steam desktop build checks `apps.isSubscribedApp` and `apps.isDlcInstalled` for the car's configured app id on
every `desktop.ownsAutomobileDlc()` call. Both must return true. Refreshing ownership can detect installation or
removal while the game is running. Access falls back to the included chariot if verification fails. The renderer
keeps the shelved Spectral Chariot locked.

The repository does not have live Steam app ids. Store configuration and copy are documented in
[the Brassbound Motor Car DLC upload template](CAR_DLC_UPLOAD_TEMPLATE.md):

1. Create the Brassbound Motor Car as a DLC attached to the real base game in Steamworks.
2. Set the store price in Steamworks (do not display prices inside the game UI).
3. Set `steam.appId` to the base game id and add `steam.automobileDlcAppId` to `package.json`.
   `STEAM_AUTOMOBILE_DLC_APP_ID` overrides that for developer testing. Zero, an omitted id, or the base game id disables access.
4. Configure the DLC so Steam reports it installed when enabled. The cosmetic assets ship in the base game build.
5. In a Steam test branch, verify an owner with the DLC installed, a non-owner, an owner with it disabled, offline
   startup, and refund/removal followed by an ownership refresh. Confirm the early quest grants only the plain chariot, and that
   both offered appearances handle identically once owned.

The game never starts a purchase or changes a Steam subscription. Unit tests use fake read-only Steam clients;
live account entitlement, checkout, regional pricing and refund behavior require the configured Steam test branch.

## itch.io entitlement

In the full itch desktop build, rest at an Elder Sign and open **Mounts → Import DLC**. Select the
`brassbound-motor-car.seventysteps-dlc` file extracted from the buyer ZIP. The desktop shell verifies the file and
stores a copy in the current OS user profile, outside the save files. It checks that copy locally when the game
checks car access. Once The Borrowed Reins is complete, the car can be selected from Mounts. The import works
offline and the personal-use license prohibits redistributing the file.
See the [itch release checklist](RELEASE.md#brassbound-motor-car-for-itchio).

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
