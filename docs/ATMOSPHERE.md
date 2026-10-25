# Atmosphere (round 78)

What deepens the game's air without touching its rules: eleven packages built in parallel, each filling one empty part of the two hubs (`src/render/atmosphere.ts` and `src/render/audio/atmosphereAudio.ts`, parts in `src/render/atm/` and `src/render/audio/atm/`), so they touch each other's files only at a few additive seams. Presentation only: nothing here writes sanity, health, damage, drops, AI, quests or a save (one cosmetic key, `seen:<region>`, in `ow.told`). Each section says what a player now sees or hears, the file whose numbers tune it, what was left out and what to watch. The decisions are in `docs/DECISIONS.md` (Round 78).

Verification, honestly: everything runs in a software renderer (a frame in seconds) and nothing was heard by ear; levels and filters of the sound were measured offline. Each package's stills were looked at by its builder; where a feature was never seen in a still its section says so. No real-GPU frame time was measured.


## Sky: the sky answers the weather and the hours


### Built

- **Overcast** (`render/overcast.ts`, `shaders/sky.ts` `uOver`): rain, a thunderstorm and (half) a gale close a cloud ceiling from the horizon up as the spell gathers (full once it is 60% there, 6 s to close); the stars go out behind it, the cloud is mottled, darker than a drift, and the moon's silver is only a faint glow in it. The moonlight on the ground dims by up to 60% (never below 0.4 of itself), the ambient by 12%, the sky/horizon/the land's haze/the mist's own light by 14%, and the mist loses its pale lobe on the moon's side (`uFogAir.z`). After the spell the stars come back over about 40 s. Each lightning flash now lights the cloud's belly in its structure (the flat wash is cut by 60% under cloud); the dimming leaves the flash's own light whole (it is read back off the sky's `uFlash`; a test pins this to lightning.ts).
- **Moon veil**: on a clear night a bank of cloud crosses the moon now and then (hashed slots of 260 s, 85% of them with a bank of 24 to 48 s, a function of the render clock so pause/replay agree), thickest at the moon, dimming its light by up to 39%; thin cloud draws a 22 degree ring about the moon while it comes and goes. None where the realm's cloud cover is under 0.15 (Mountains, Pnakotus, Yuggoth) or the realm has no moon.
- **Hours** (`render/skyHours.ts`, `data/hours.ts`, `systems/clock.ts` `afterglowOf`/`falseDawnOf`/`skyTurnOf`): a low afterglow along the horizon opposite where the moon rose (whole at the turn of the night, thinning over the gloaming, none in the deep, gathering again just before the turn); a pale false dawn wedge opposite where the moon sets in the waning hour, sinking back at the turn; each realm its own colour (10 realms; none for K'n-yan, Yuggoth, the Beyond, the Outer Dark). The stars wheel about a raised pole (0.6 rad per night; a vigil's called hour, 90x, turns them in sight); held still in the Pale Lattice. A hint of the glow warms the ambient light (0.01) and the mist (dawn).
- **Heat lightning** (`render/heatLightning.ts`): clear nights, in regions that know thunderstorms, a low bank on a far horizon flickers silently (2 to 4 pulses, flicker() of lightning.ts so the Flashes setting melts them), every 45 to 130 s, at least 60 degrees off where the camera looks; never in rain/storm/under a roof/in a cutscene/with Flashes 0. Silent (the brief); the horizon builder's glow domes/windows are NOT built.
- **Wrong moon and Alignment** (`render/skyOmen.ts`, `shaders/skyOmen.ts`): as the mind fails the moon swells (up to +30%, slow, different every night) and sours toward violet (50%); every few minutes (more often the worse the mind, or the more insight gathered, even steady) a patch of stars stops crawling and settles into the game's own Elder Sign, nine stars in dotted lines, 28 s (8 in, 12 held, 8 out), placed in front of where the eye looked when it began. Strength is read off the sky's `uWrong` (so the FX cap and the dread toggle govern it); the insight part is not capped (a still, quiet figure, no flicker). fx.ts, fxController.ts and main.ts are untouched.


### Knobs

`src/data/skyAir.ts`: OVERCAST {kinds, gather 0.6, rise 6, fall 40, moon 0.6, ambient 0.12, sky 0.14, lobe 1}; VEIL {slot 260, chance 0.85, last [24,48], light 0.65, mist 0.6, clouds [0.15,0.5]}; HEAT {every [45,130], pulses [2,4], strength [0.35,0.8], away 1.05, width 0.9}; OMEN {slot 150, last 28, fade 8, hold 12, chance 0.75, know 0.5, elevation, lean 0.5, size 0.21, swell 0.3, period 90, sour 0.5}. `src/data/hours.ts`: HOURS {band 0.5, falloff 5.5, spread 2.5, cone {spread 5, lean 2.4, band 0.5}, turn 0.6, pole}, HOUR_COLOURS per realm.


### Left out

- The horizon builder's candidate parts (glow domes, far windows following the clock) by instruction.
- No rumble for heat lightning (the brief says silent; the candidate had a low thunder: `audio.thunder(0.08..0.18)` is one line in heatLightning.ts if wanted).
- The Alignment's insight part is not behind the FX cap (a calm, static figure); the stress part is.
- The mist's moon lobe is only scaled by my part; the mist builder's part runs after mine and may overwrite `uFogAir.z`: it can read `sky.userData.atm.over`/`.veil` (0..1) to keep it.


### Watch

- Perf: one extra fbm per sky pixel only under overcast/veil, a rotation per pixel always; no new draws or particles.
- Taste: the afterglow/false dawn and the heat lightning pass through the grade and the 64 colours; see the stills. The moon floor 0.4 under a storm at the deepest of the night leaves the lantern as the light.
- `uFogAir.z` and `worldUniforms.uFogColor` are scaled after the lightning has added to them (read-back through `uFlash`): if LIGHTNING's constants or the 0.085 in lightning.ts change, tests/overcast.test.ts says so.


## Mist and light: shafts, window spill, a living mist


### Built

- **Moonlight shafts and shadow wedges in the mist.** The post pass (shaders/fog.ts, new shaders/fogShaft.ts) reads the moon's own 1536 px depth map (the world's `uShadowMap`/`uShadowMat`/`uShadow`, shared by reference) along each pixel's ray, 16 dithered taps over the first 34 m, in the air and not on a surface. What it finds is the mean, weighed by the mist there, of how far the moon reaches the mist, less 0.8 (the share it is taken to reach on average). The mist's own light within the shadows' reach is then dimmed (behind trunks, roofs, stones, the investigator) or lifted (in the gaps) by `uShaft.x` times that. Because it modulates the real mist's light (and not an added term) it can never go negative, it is nothing where the mist is thin, and the mean glow of round 58 is unchanged. The shader runs the march only when `uShaft.x > 0 && uShadow.x > 0` (no map under a roof, in the arena, with Shadows off, or with the moon lower than 0.14).
  `render/moonShafts.ts`: pure `shaftStrength` (moon height 0.18 to 0.38 rises, from 0.62 to 0.95 falls to half; thick as the mist is: none at Fog 0; veiled by weather: rain 55 %, storm 100 %, gale 35 % at their fullest) eased over 1.4 s.
- **The mist's bright quarter follows the moon.** `nightFx.ts` writes the sky's moon direction to the post pass's `uMoonDir` (it had stood where the night began, so the mist's moon lobe never moved).
- **Lamps and windows throw their glow somewhere.** `glowAlong` takes an aim (xyz, sharpness): a lit window pours outward from its glass and none behind its wall (0.85), a street lamp's glow hangs downward (0.55); fires, torches, the lantern and the signs stay all round. `render/lampAim.ts` writes `uLampAim` slot for slot from the lights the world chose (`LIGHT_VIEW.seen`). The world shader's own lamps are untouched.
- **Window spill on the ground.** `render/windowSpill.ts` (+ pure `spillPlan.ts`): one instanced additive draw (32 windows, nearest first, within 28 m of the eye) of a soft trapezoid of the window's colour running 3.6 to 6 m out from the wall (more for a higher window), 1.1 m wide at the wall to 3.4 m at its end, with the dark cross of its mullion and transom, flickering with the pane, gone as the window goes out in the waning hour (`paneLit`). Its length stops short of what stands in its way (a ray cast once per window, kept), it lies on the plane the ground makes there, fades by the world's fog, and is not drawn under a roof.
- **A living mist.** `shaders/fog.ts`: the fine noise octave is carried 1.5x as fast as the banks and turned 25 degrees (the mist shears and flows instead of sliding as one sheet); the banks swell and thin by up to +-40 % over a 250 m wavelength, rolling over minutes (a few sines: no extra noise); a crypt's is still. `volumetricFog.ts`: after hard rain the mist rises by up to 60 % (follows `wetness`, so it settles as the puddles dry), never past the thickest it was (3.4 x); wind drives it up to 3x as fast in a gale (follows `uWind`); both are read from the weather itself, so `main.ts` is untouched.


### Knobs

`SHAFT` {steps 16, reach 34, gain 1.4, floor 0.8, moonLow/Full/High, mistLeast/Full, cloud, ease}; `BEAM` {window.sharp .85, lamp.sharp .55}; `SPILL` {within 28, count 32, reach 4.8, tall .12, near 1.1, far 3.4, gain 1.05, fall 1.15, bars [...], margin .25}; `LIVING` {afterRain .6, thickMax 3.4, gale 2, gust 2.4, swell .5, fine {speed 1.5, turn 25 deg}}.


### Left out

- `FOG.afterRain/thickMax/gale/swell` were put in `data/mistLight.ts` (`LIVING`) and not in `playTuning.ts`'s `FOG`, to leave the shared file alone; `main.ts`'s `mist.update` call is unchanged (the mist reads `wetness` and `uWind` itself).
- The ground spill's `LightSpot.size` (the window's width from houseMesh.ts) was not added: the shape is the same for every window (0.7 m panes).
- Not seen in stills: the gale's faster drift and the banks' slow swell (they move over time; unit tests pin the drive and the cap, the shader strings are checked, and a gale/crypt were not photographed); the fine layer's shear is in every after still but not separable by eye.
- The window spill was only checked on first-floor windows of the hub's brick houses (3 to 4 m up); a ground-floor window and a side-wall window (`turn`) were not photographed.
- No second pass for the moon's wedges at the map's edge or for terrain shadows (the moon's map has no terrain: a hill does not shade the valley's mist).


### Watch

- Perf: 16 extra shadow taps per pixel plus about 3 exp per tap, gated by the Fog and Shadows settings and the moon; autoQuality's first rung removes Fog/Shadows. Not measured on a real GPU (software GL only).
- Taste: the shaft contrast depends on the mist's light, which is faint in thin regions (hub, mountains). If shafts read too subtle, raise `SHAFT.gain`; if the mist reads too dark in a wood, raise `SHAFT.floor`.
- Tests that pin numbers: none known to; `tests/fog.test.ts` stubs only the uniforms the mist writes (`uFogAir.w` exists in its stub).
- `LIGHT_VIEW` is module-level (like `LIGHT_NERVES`): the last `createWorldLights` wins (one in the game).


## Air: each realm's own air, weather skins, breath, lantern motes


### Built

- **Regional air fields** (the surveyor's `regional-air-fields` and `realm-air`, merged). Every one of the 19 realms keeps a field of its own small matter, always a little, in clear weather too, on a ring 3 to 15 m about the investigator, mostly where the camera looks (a speck born behind is kept 30% of the time, so a turn finds air about it). Hub: russet leaves where trees stand, a little ground mist, a gnat's glint under the lamps. Arkham: grey ash settling, crawling ground mist, and one rare magenta spark (the Colour). Dunwich: ground drift, thistle fluff in the gusts. Innsmouth: salt spray streaming along the sea wind (FOGS.innsmouth.wind) and mist. Providence: leaves. Vermont: gold and rust leaves (5/s, by wood) and pale spores by night. Mountains: diamond dust (glints), spindrift streamers low and fast, snow flakes. Pnakotus: sand streaks, grey grit, a little dust. K'n-yan: blue light hung in the vault's air. Dreamlands: lilac petals, gold motes. R'lyeh: brine, bubbles. Yuggoth: rose spores (glow) and rare violet ones. Beyond: cyan motes. Outer Dark: Cloud Summit gold drift and motes, Black Wood cinders and red spores, Pale Lattice hung-still prisms, Piping Dark notes and spores, Gate of Spheres bubbles, Court at the Centre embers and ash.
  - Wind: the speck's first velocity is `FOGS[region].wind` rolled by `gustAt` (the very `sin(uTime*0.31 + x*0.045 - z*0.03)` the grass shader bends by), so a leaf is lifted in each gust as the blades bow. A gale carries them harder (`uWind`).
  - Rate follows: the wood under the point (leaves), the mist's thickness and the Fog setting (mist wisps), the gusts (spindrift, sand, fluff), the hour (spores, gnat glints), rain (leaves, petals, spray are washed from the air), and the camera shake setting for what streaks (0 = none).
  - A mind past `AIR_FIELD.madness` (the Uneasy floor) sees what falls rise (cosmetic).
  - Stands down within a court that has its own `air` (as arenaAir does), under a roof, in the arena, while hidden; nothing is born within 2.4 m (more by size, 6 m for a mist wisp) of the lens.
  - Budget: at most 24 specks/s for a realm (a test pins it), at most 380 of ours alive (tracked by our own death times, the pool is 4096 and shared); no per-frame allocation.
- **Weather skins** (`weather-skins-blizzard` + `weather-skin`, merged). `data/weatherSkins.ts` gives each land the matter of its weather; the hub and every unlisted realm are the default, which is what was always drawn. Mountains: a gale is a ground blizzard (380 driven short white streaks, strands and clouds white-blue, snow flakes where leaves were, no puddles), a storm a whiteout (680), no drops where it lands, fog closes to 0.3/0.55, the bed is the wind alone. Pnakotus: a storm is sand on the wind (560 hissing near-horizontal sand streaks, sand strands and clouds, dry ground), a gale the dust alone. Arkham: the gale throws the heath's grey ash instead of leaves. Innsmouth: salt spray instead of leaves. Dreamlands: the dream's motes are partly petals. Yuggoth: its motes are the Fungi's rose and ember spores. Snow and sand that leave the box sideways come in again at the windward edge, at any height (rain, which falls out of the bottom, comes in at the top).
  - `weatherHaze` reads the land's own reach (module state set by `createWeatherFx.update`, so `main.ts` is untouched); `windOf` is unchanged (`windOfSkin` calls it and overrides slant, fall and length for snow and sand).
  - Audio: `bedKind(region, kind)` turns a storm or rain on snow or sand into the wind bed (no wash of rain): one import and one changed call in `gameAudio.ts`.
- **Breath in the cold** (`cold-breath`). A pale puff leaves the mouth at each breath: 3.8 s apart at rest, 2.2 s walking, 1.1 s when sprinting or below 25% stamina (then heavier, 1.5x alpha, one puff more); strongest on the Mountains (cold 1), then Vermont .6, Pnakotus .55, Dunwich .45, Providence .4, hub .35, Arkham .35, Innsmouth .3; the deep of the night keeps all the cold, the day's edges half; a storm adds 25%; carried away by the realm's wind and `uWind`. None mounted, under a roof, with the lens within 1.8 m of the mouth, or in warm realms. Visual only.
- **Motes in the lantern's light** (`lantern-motes`). 5/s outdoors, 9/s under a roof (falling), 0.8 to 5.5 m from the lantern, warm bone discs 2 to 3.5 cm, NOT self-lit, so the particle shader lights them by `lanternAt()` and they show only in the pool of light. None when the flame is out or guttering (below 0.35 of its 1.15), when `uWind` is past 1.6, within 1 m of the lens, or in an arena's fight.


### Knobs

- `data/airFields.ts`: `AIR_FIELD` {ring [3, 15], maxRate 24, anomalyRate 1, alive 380, cone .15, behind .3, wood .2, stand 40, lens 2.4, madness .5} and `AIR_FIELDS` (each layer: kind, tone from the look's accents/mist/moon or a colour, rate/s, size, pale, by, dry, glow, sea, anomaly, fast).
- `render/airKinds.ts`: each kind's flight (drag and gravity: terminal fall = gravity/drag), sizes, lives.
- `data/weatherSkins.ts`: `SKINS` (precip, dust, cloud, fleck, wet, streak, thick, haze, bed, motes), `STREAKS` (380, 680, 560), `DRIVEN` (slant, fall, length).
- `data/coldBreath.ts`: `COLD` and `BREATH`. `data/lanternMotes.ts`: `LANTERN_MOTES`.


### Left out

- The blizzard's howl scaled 1.15 (optional in the brief): the bed is the wind alone, unscaled.
- The "stride powder" puffs in the snow (the FOOTSTEPS builder owns trail puffs).
- Heat lightning for Pnakotus (the HORIZON builder's).
- Leaves only under trees in the default gale (it would change the hub's branch, which must stay as it was).
- No `docs/` or `CLAUDE.md` edits (the integrator's), and no entry in `data/tuning.ts` (numbers live in the new data files).
- The pool pressure of others is unknown to us: only our own share is capped (380).


### Watch

- Taste: the fields are sparse by design (24/s at most) and the specks 1 to 3 low-res pixels; an owner who wants more will raise `rate` and `alive`. In stills the ash and spores can read as stars against the sky: the dither is bold, but this is the thing to look at.
- Perf: at most 380 live specks plus the weather's own; per frame a loop over three layers. No draw calls. Software-GL frame rates cannot say anything about the real cost.
- Tests that might pin numbers: none known. `tests/wetGround.test.ts` counts drops of size 0.07 (the stride) and `spark`/`wisp` shapes in the default weather: the default branch still produces the same. The new tests pin the Mountains' 0.8 white strands, Pnakotus's streak colour 0.78 and Yuggoth's 0.92 mote.
- `weatherHaze` now reads module state set by the weather's update: with two weathers in one process the last wins (only tests do that).
- The `?debug` hooks `airWarm`/`airBreath` are on `globalThis` only under `?debug`.


## Footsteps: prints, puffs and the ground heard


### Built

**The ground keeps prints (render/atm/steps.ts -> render/footprints.ts).**
- Every footfall (one per `strideAt(speed)` metres, same guards as the foley: none mounted, in a move, after a jump over 3 m, fallen, in a cutscene) lays a boot print where the foot comes down, on the ground it came down on. One `InstancedMesh` of 128 quads, one draw call (hidden when none shows), oldest give way (about 100 m of trail).
- A print is a film laid over the ground already drawn (normal alpha blend, `depthWrite` off, polygon offset), its colour lit as the particles are (ambient + moon + the lantern's pool, `min(.., 1)`), so it keeps its shape in the lantern's glare and is as dark by night as the land it lies on. (A first version multiplied the ground; it vanished where the lantern blows snow out to white, so it was dropped.) 0.42 x 0.19 m, a boot's sole (heel, waist and ball) or, for the haunting, a bare foot with four long toes. Snow: pressed dark with a pale lip of pushed snow, 95 s. Mud: near black, a dark wet ring, the toe wall gleaming, 50 s. Sand: shallow, soft lip, 42 s. Flesh (Yuggoth) and rot: dark ooze, 32 s / 26 s. Fade is Bayer-dithered (like the shadows) and thins into the fog; the print follows the slope (three ground samples) and snaps with the PS1 vertex grid.
- Rain-soaked grass, dirt, leaves, gravel, road and cobbles take a shallow wet print whose life and strength scale with `wetness.value` (above 0.3, 14 s at full wet on grass).
- After the sea (a `Splash` near the player, or a footfall in the shallows) every footfall on any dry ground, stone and boards too, leaves a wet print for ten seconds, shorter and fainter as the boots dry.
- Stone, slab, boards, dry grass/dirt/leaves/road and the arena keep nothing. Mud kit floors of cellars and mines keep prints (they are `mud`).

**Puffs at a run** (render/footPuffs.ts, shared particles, at most 40 specs a second, only from 3 m/s): snow powder wisps, dust on dirt/road/gravel, sand wisps, three leaf shards on leaves, two mud flecks that land, grass blades, ooze flecks, a spray of drops in the shallows.

**A second set follows a failing mind.** Fractured or Unmoored, on ground that keeps a print, every second footfall also lays a bare, 1.25x, heel-less four-toe print 0.9 m to the left and one stride behind, fading in over 2.2 s and lasting 40 s; none in a fight, a move or a cutscene. It keeps to the FX intensity setting: the audio part tells the picture the capped stress each frame (`FOOT_MIND`), and the set is not laid when the cap holds it under 0.5.

**Every ground has its own step (audio).** `world/groundKind.groundAt` names what is under the foot (sea, dungeon room by its kit's floor, open arena's floor, road, else the region texture with the biome's patch laid where the ground shader lays it: the shader's `hash12`/`vnoise` ported). The recorded step is taken as the ground takes it (`FEEL`: snow 0.55 and dulled to 2.4 kHz, sand, mud lower, grass, gravel, leaves, flesh, rot; boards play the stone recording at 0.5 with a hollow pitch; a slab or cobble under the open sky now plays the stone recording instead of dirt's), and a short recipe is laid over it on the same stride: snow crust grains and a squeak, sand hush, gravel clicks, leaves crackle, grass swish and thump, mud squelch and suck, boards knock (and a creak one step in seven), flesh slap, rot squelch. Stone, road and the sea keep the recordings that were already right.

**The body.** A coat swishes as a walk begins and at each sprint stride, a satchel buckle at one sprint stride in three, the lantern's bail ticks (one stride in four walking, one in two at a sprint), all at about -37 to -43 dB rms. Breath: panting after a sprint of 2 s or more, one gasp each time the stamina bar falls under 20% (re-armed above 35%), a ragged wet breath near death that quickens with the heart (`HEART.need` over 0.3), and a slow quiet exhale every 4-6 s standing or walking in the cold (realm cold x darkness of the hour, rain adds, none under a roof, none in the Beyond and the dimensions past the stars).

**A step that is not yours (audio).** Fractured (12% a stride) or Unmoored (28%): a duller second step from the recording of the ground, 0.45-0.85 s after yours, panned 0.75 to one side, pitched 0.88, low-passed at 900 Hz; and when a walk of 4 s or more ends, one more arrives 0.8 s later (25%). Never in a fight or a scene; the FX cap holds it too.


### Knobs

`src/data/bodyTuning.ts` `STEPS`: `capacity` 128, `dry` (life/look/alpha per ground), `soaked` (seconds at full wet per ground), `soakedAbove` 0.3, `afterWater` {10 s, 0.85}, `lift` 0.05, `length` 0.42, `width` 0.19, `across` 0.13, `ahead` 0.16, `fadeIn/fadeOut`, `haunt` {every 2, aside 0.9, behind 1 stride, scale 1.25, fadeIn 2.2, life 40, alpha 0.9, stressFrom 0.5, bands}, `puffs` {speed 3, perSecond 40}; `PUFFS`/`PUFF_OF` the heel's kick per ground; `COLD` per realm. Shader look multipliers (core, lip, gleam) are in `footprints.ts` `lookOf`.
`src/data/footSounds.ts`: `FOOT_GAIN` {steps 0.5, gear 0.4, breath 0.4, phantom 0.22}, `STEP_LAYERS` (each trimmed to its own level), `FEEL` (the recorded step per ground), `GEAR`, `BREATH`, `BODY` (when the body speaks, the phantom's odds, delays, pan, pitch, low-pass).


### Left out

- Hoof prints and a hoof kick for the mounts (the optional S extension); hoofFx.ts is untouched.
- The camera sense of breath/sprint (FOV push, step dip) from `breath-and-exertion`: it needs main.ts and `FEEL`; cut. The vapour of the breath is the AIR builder's.
- No new recordings; the recipes were measured offline (levels, length, spectral centroid) and not judged by ear: the recorded steps still carry the weight, a bad recipe is bounded under them. Expect to tune `STEP_LAYERS` trims by ear.
- No footprints on hard dungeon floors except after the sea; no snow fill-in animation beyond the dithered fade.
- `groundAt` reads the nearest region's ground only: at the blended band between two regions the print may be of the other region's ground for a few metres.


### Watch

- Perf: one extra draw (only while a print shows), 128 instances updated per frame (trivial), up to 40 particle specs a second at a run, `groundAt` three times per footfall (foley, body, prints; a handful of table scans).
- Taste: the print shader and the sound recipes are the parts to tune (`lookOf` in footprints.ts, `trim`s in footSounds.ts). The wet-print and haunting numbers are first guesses.
- The print is lit by its own copy of the particles' light (`uAmbient`, `uLightColor`, the lantern), not by the world shader's: if the GROUND builder changes how the night is lit, `vLight` in footprints.ts is the one line to follow. It writes no depth, and draws at renderOrder 1 like the decals.
- `tests/budgets.test.ts` counts draw calls of its own scenes only; nothing there pins this.
- The second set depends on the audio part running to know the FX cap (`FOOT_MIND`); without audio (-1) it falls back to the band alone.


## Ground skin: coats of the land, grass that parts, rings in puddles


### Built

- **Realm coats** (data/coats.ts, render/coat.ts, world shader). The matter of a realm lies on its props (stone, wood, cloth, roofs, the Elder Signs' stones, doors; not the terrain, the plants, the flesh, glass, lit things or the living): snow caps and rime on the windward faces in the Mountains of Madness (and a thinner hoar-frost on the Cloud Summit), drifted sand on tops and a film on the wind-facing sides at Pnakotus, a stain of brine that ends in a wandering tide line with a pale salt crust dried along it at Innsmouth (a darker, higher, greener slime, and slime on the tops, at R'lyeh), soot on the tops of Yuggoth's pillars. Snow, sand and salt hold a little of the sky's light (a `lit` lift), so they read in the dark. It is eased in as the investigator crosses between realms (3 s, at once on a journey) and taken off in 0.35 s under a roof. Nothing costs where there is no coat (`uCoatA.w` is 0: one uniform branch).
- **The grass parts for bodies** (render/bodyPush.ts, vertex shader SWAY block). The investigator (a rig is wider) and the nearest three bodies awake within 14 m of the camera lean the blades, ferns, reeds and tall grass away and press them down; only what is low (below about 1.7 m above the body's feet) and has sway moves, so crowns and trunks stand. Excluded, as the blob shadows are: absent, unseen (the Dunwich Horror is deliberately kept out: the grass that bent for it would show where it stands), hidden, dead, `fx:` models and hovering things.
- **A lane that stays** (render/trample.ts). A 64x64 half-metre toroidal field about the investigator: every body stamps its footprint (the investigator's swept along the way, so a slow frame leaves no gaps), it rises again over 8 s; the vertex shader reads it (bilinear, three more taps for the gradient) and lays stems flat away from the lane's middle, a random lean where it has none. Heights above 1.4 to 2.4 m over the investigator's feet are out of it (a tree's crown, a banner).
- **Rings in puddles** (fragment shader `footRings`, bodyPush `step`). In soaked weather (`wetness` over 0.5) each stride lays a double ring, spreading 0.9 m/s and dying in 1.7 s, six at once, lit by the lantern it stands in; on a puddle bright, on other soaked flat ground a fainter one. Rigs ring at their hooves (1.6 m stride, wider).
- **Region cover** (data/coverKinds.ts, render/coverPieces.ts; groundCover and baseCover). A share of the ground's cover is the place's own: weed strands lying on Innsmouth's mud (13%), bleached ribs and potsherds in the Pnakotic sand (2.5% and 7%), pale fungus caps in K'n-yan (16%). Same merged geometries, no draw call added; faces: Innsmouth +14%, Pnakotus -9%, K'n-yan -3% on a measured chunk.


### Knobs

- data/coats.ts `COATS` (per realm: colours, `capShare`, `wind`, `stainShare`, `line` above the realm's mean ground, `soft`, `wobble`, `crust`), `COAT_EASE`.
- data/groundSkin.ts `BODY_PUSH` (slots 4, reach 14, rig 1.0, foot 0.55), `TRAMPLE` (cell 0.5 m, hold 8 s, reach 1.2), `FOOT_RINGS` (6 rings, wet 0.5, stride 0.95, life 1.7 s).
- data/coverKinds.ts `REGION_COVER` shares and `PIECE_COLORS`.
- shaders/world.ts: push `min(blade*0.8, 0.55)` m and the 1.7 m height gate; lane lay `0.85 * min(blade, 0.9)`; the coat's lift `0.14`.


### Left out

- poi-ground (the secrets' ground treatments): cut (needs terrainMesh and a new world helper; no time after the shader work).
- Foes' and horses' own footfall rings, and a persistent trample for flying things: only the investigator's strides and a rig's hooves ring.
- Snow on needles or boughs (the `leaf` material is excluded from coats: it also carries every blade of cover).
- A height-above-ground foot line for sand drifts and moss: props carry no per-prop ground height without a new vertex attribute that every merged geometry would have to carry (propMeshes/houseMesh are not mine); the brine line is therefore absolute (the realm's mean ground + an offset), so on lower ground it stands higher up the wall, which reads as damp collecting in the low quarters.
- Coat on the Outer Dark's other realms and the arenas' own sets (set pieces go through propMeshes, so they do take a coat in a coated realm).


### Watch

- Taste: at night everything is dark; the coats are bold only in the lantern's pool and where the sky lights a top. I raised their value after the first stills (caps hold a little of the sky's light, the salt crust is pale); the owner may want them stronger or weaker (`COATS` shares, the 0.14 lift).
- Perf: the vertex SWAY block grows by a 4-iteration loop and, for vertices inside the 32 m window, five taps of a 64x64 R8 texture; vertices with no sway skip it all. The fragment coat block runs only in coated realms (two `vnoise`). Please spot-check a low-end GPU with trees and reeds near the camera.
- Tests that pin numbers: none known; wetGround/lanternShadow/mountArt/baseCover pass. `coatable()` also coats dungeon walls seen from outside (not under a roof) and the Elder Signs' stones.
- The trample texture is shared by every swaying material (one sampler in the vertex stage).


## Horizon and the eye: far towns, a lighthouse, the eye adapting


### Built

- **Far windows follow the night and wink** (render/skylineShader.ts). The far towns' lit cells now use the near windows' own rules (`PANE_GLSL`: `paneLit`, `windowShare`, `uHurried`): the last seeds go out first as the hour wears on (all lit in the gloaming, about a third in the waning hour, lit anew at the turn), some are put out for a spell, some dim as someone passes, some waver. A failing mind (`LIGHT_NERVES.madness`) sees them strobe, a few at a time.
- **Glow over far towns** (render/horizonGlow.ts, one extra quad inside each lit silhouette's own geometry: no new mesh, no new draw call). A town, minaret city or tower city with lit windows lays an additive glow in its window colour (amber; gold over Celephais; cyan over K'n-yan) over its roofs: widest at the roofs, rising and thinning. Strength follows the share of windows lit (`windowShare(phase)`: full in the gloaming, `DOME.night` of it by the waning hour), the town's `lit` count, the distance (none inside 150 m, full by 340 m, thinning with the air), and the weather (rain, storm, gale: the glow lies on the cloud, +70%). Swells and sinks a little (5%).
- **A lamp that turns** on Devil Reef (Innsmouth), Kingsport's head (seen from Innsmouth and from Miskatonic over Providence). A pilot light always seen on the tower, a flash as the beam comes round to the eye (about a second, once per 11 s on the reef; 15 s at Kingsport), and the shaft standing out to one side in the haze, longest when it is broadside. One more quad in the silhouette's geometry, a fixed size in metres whatever the silhouette's scale.
- **The eye** (render/eyeAdapt.ts). The post pass's vignette and bloom follow `Game.lit` (the same lamplight the mind mends by): in a pool of lamp, fire or lit window the corners open (x0.72 of the base vignette) and what shines blooms 20% more; in the dark they close over two or three seconds (x1.1 with the lantern kindled, x1.22 with it gone out), so the lantern's circle is all there is. Opens in about 0.7 s, closes over about 2.4 s. Keeps off cutscenes, the arena (no overworld), and any picture a wound, a faint, a fall or a stone gaze has taken (`uFaint`, `uFade`, `uStone`: it adds nothing to them); under a dungeon's roof it keeps 40% of itself. Reads `lightAt` at about 8 Hz, not every frame. It composes with another writer of `uVig`/`uBloom` (see Risks).


### Knobs

`DOME` {strength 0.62, across 0.58, up 0.95, lit 0.3, floor 0.62, night 0.28, near [150,340], half 1500, overcast 0.7}; `LAMPS` (region, index, x, period, phase, colour, size); `BEAM` {pilot, flash, reach 24 m, thick, turn 40}; `WINK.nerves`; `EYE` {vignette {dark 1.22, lantern 1.1, lit 0.72}, bloom 0.2, clamp [0.28, 0.6], rise 0.7, fall 2.4, take [0.1, 0.65], roofed 0.4}.


### Left out

- Heat lightning (silent sheet lightning on clear nights, a rumble ten seconds later): the brief gave it to the sky package; nothing was built.
- The brief's second dome plan (`uDome[3]` pushed into the sky shader, three nearest towns) was not used: the sky shader is the sky builder's. The glow lives in each silhouette's geometry instead, which also lets the roofs cover it and costs no uniform array.
- No ambient-occlusion change in the eye (the brief's title lists AO, its plan says vignette and bloom only): left alone.
- The lamp's beam does not sweep the water (no light on the sea); it is a flash and a shaft in the haze.
- The reef's lamp and the Kingsport lamps use a warm white and amber; they pass through the realm's palette like every window.


### Watch

- **Another writer of `uVig`/`uBloom`**: the ui-mood package's death "breath" also writes both (from the constants, in `hurtFx.update`, which runs before the atmosphere parts). Mine scales whatever it finds, unless it finds its own last value (then it scales `LIGHTING`), so the two compose; the integrator should keep `horizon` after any other writer in `createAtmosphere`'s list or in `hurtFx` (it is after `dread`, before `sleeper`). If a later part writes the uniforms by overwriting from the constants, mine is lost for that frame.
- Taste: in the open dark with the lantern kindled the corners are 10% darker than before (0.42 to 0.46); in a lamp's pool they open to 0.30. Both numbers are in `EYE.vignette`. The pool follows `lightAt` exactly, so a street between lamps breathes, and a dungeon corridor between torches breathes at 40%.
- Perf: none measurable. One extra quad per lit silhouette (two triangles) and one for each lamp; the windows' extra GLSL runs only on lit cells. `lightAt` is read at about 8 Hz for the eye.
- Premultiplied blend on every silhouette (the outline's output is premultiplied by its own alpha: identical result to before); the fake false landmark uses it too. GLSL compiled in the browser with no errors.
- Tests that might pin numbers: none known (`tests/skyline.test.ts`, `landmarks`, `paneLife`, `palette` pass). Stills made with `?trailer`, `store_shots.mjs`, `itch_art.mjs` change by design.


## Dread, the picture: pressure, shock, watchers, eyes in the dark


### Built

- **Pressure** (the picture and the whispers lean toward madness while something presses on the mind). `render/pressure.ts` reads the simulation without re-implementing it: the smoothed RATE at which sanity is being lost (auras, roars, gazes, clouds, a place's dread, a vigil's call: all of them arrive as a falling `g.mind.sanity`, and a swallow of Laudanum that holds the drain off clears the head at once), plus a jolt for every `SanityLost` (first sight, a blow of the mind), fading over 1.6 s. Halved in a horror's fight (eased over 1.2 s) and zero under a cutscene. `fx.ts` `computeFx` gains `felt` (= stress + 0.4 x pressure x (1 - stress), never past the FX intensity cap) and uses it ONLY for the edges: ripple, chroma, ghost, lens breathing and shear, the surge; `blur`/`strange` (soft edges, wrong stars) lean further (0.6); fog, colour, dither, displacement, affine, tear and ALL audio detune/distortion stay on the true stress. The whispers take `fx.heard` (leans 0.75, so one reaches the ear only at the top of a pressure). With pressure 0/undefined the output is bit-identical to before (tested). A player at full sanity who walks into a horror's aura now sees colour fringes on lit windows and a faint second image, the soft edges and crowding multicolour stars; backing off settles it over ~3 s.
- **The shock.** A `SanityLost` of 4.5+ (SANITY.jolt x 3; whole at 12) now: closes the world's high end (`setMuffle`, up to 0.7) and lets the bed give way (`setHush`, up to 0.55), both easing back over ~2.4 s; plays a thin shimmering tone in the head (`RING`, two sines 4.5 Hz apart at 3.9 kHz, 5.5 s, a moment after the blow, at gain 0.05 x shock, quiet and not a stinger); and sends half a band-change's ring across the picture (`FxState.pulseScale`, 0.5; a band lost still sends the whole one). All of it held by the FX intensity setting (none at 0).
- **Watchers step and a darter crosses the corner.** (`watchers.ts`, `watcherSteps.ts`, `gaze.ts`) A watcher that has stood 25 s and is out of the picture (by half the field of view + 0.2 rad) comes 1.0 to 1.6 m nearer every 2 to 4 s (if the way is clear), never within 26 m, never while it is in the picture or looked at; turning back finds it nearer. From 2 watchers (sanity < 25), while the lens swings faster than 0.7 rad/s, every 60 to 180 s a dark upright shape appears at 9 to 15 m near the leading edge of the picture, crosses sideways at 4 to 6 m/s and is gone within 1.2 s or the instant the lens turns to it (< 0.3 rad); never in a fight, a talk, a cutscene, at FX intensity 0 or with Flashes at 0. While watchers stand, the bed gives way by 0.25 each (max 0.45) and swells back as they go (`WATCHING.count` -> `DREAD_AIR.hush`).
- **Eyes beyond the lantern.** (`darkEyes.ts`, `darkEyeRules.ts`) Up to 3 pairs (4 below sanity 60, blinking out of step) of faint eyes on one halo batch, depth-tested so trees hide them, at hound height (0.9 to 1.5 m, fixed per pair; each halo's radius grows with the distance, `EYES.radius + d x EYES.grow`, so it stays a point of light at 40 m), 26 to 52 m ahead or to the sides, only where the ground (and 14 m around it) is unlit, open, dry and not roofed, more readily among trees; they fade in 1.5 s, hang 6 to 20 s, blink for 0.18 s every 4 to 9 s (never in Innsmouth; red in the Black Wood; none in the hub, mountains, the dream, the cities, the Outer Dark but the Black Wood), then rest 30 to 90 s. Gone in 0.2 s when the lens' axis rests on them 0.8 s, when the investigator comes within 16 m, when it is lit, in a fight/talk/cutscene, under a roof or at FX intensity 0; thinned in the last hour's grey.


### Knobs

`PRESSURE`: lean 0.4 (picture), leanDread 0.6 (soft edges/stars), leanHeard 0.75 (whispers), rate 0.9 (sanity/s that is a pressure of 1), attack 0.4 s, release 2.6 s, shock 10, shockSeconds 1.6, fight 0.5. `SHOCK`: from 4.5, full 12, ringScale 0.5, muffle 0.7, hush 0.55, seconds 2.4, tone {gain 0.05, hz 3900, beat 4.5, seconds 5.5}. `STEP`: after 25, turned 0.2, every [2,4], metres [1,1.6], closest 26, held 0.25/0.45. `DARTER`: yawRate 0.7, from 2, every [60,180], near [9,15], edge 0.85, speed [4,6], seconds 1.2, gone 0.3. `EYES`: max 3, near 16, from/far 26/52, height [0.9,1.5], span 0.3, radius 0.05 + grow 0.0035 per metre, gain 0.7, life [6,20], rest [30,90], blink 0.18 every [4,9], stare 0.26/0.8 s, per-region colour and blinking. `SHADE`: every [70,170], lasts [25,45], near [11,22], side [1.22,1.92], height 3.7, reach 6, mostHeight 8, slide [0.5,1.2], turnedAway 1.05, gone 8, moon 0.08.


### Left out

- No Settings toggle for the eyes (the brief offered one; it needs four languages); they are held by the FX intensity and the calm rules instead.
- The pressure has no `place` term of its own (the surveyor's `FX.pressure.place` + `placeDread`): a place's dread already shows as a falling sanity, and adding it directly would have kept the picture leaning while Laudanum holds the drain off.
- The debug-panel row was replaced by `window.dread` (no edit to debugHooks/debugPanel).
- The shock's ring across the picture is faint by design (half a band's ring: at most 0.012 of the picture's height at its peak) and could not be reliably caught in a still (the software GL runs the clock a tenth of a second a frame); the unit tests pin it.
- Held-breath hush is in the bed only (e.setHush: the realm music also follows `e.hushed`, so it dips with the bed).


### Watch

- Taste: the pressure at its top shows colour-fringed windows, a faint second image and multicolour crowding stars at full sanity; if the owner finds it too much lower `PRESSURE.leanDread` (stars/blur) first. Eyes: the pair size/brightness was tuned in software GL stills only.
- `gameAudio.ts` / `audio/dread.ts` merge hunks (see Files). Tests that pin FxParams keys exactly (none found) would need `felt`/`heard`.
- The watcher numbers above are the real stride (1 to 1.6 m a step) over little game time; no still shows a watcher nearer than before.


## Dread, the ears and the Sleeper: the mind heard, the step behind, the breath of a colossus


### Built

**The Sleeper's breath** (the showpiece). About a colossus that has not yet woken (`isUnroused`, alive, not in a hidden layer, `body.height >= 8`: the same line `audio/dread.ts` hushes the ground by) the dream draws breath. One breath is 9 to 15 s (8 s + 0.15 s per metre of height: Cthulhu 14 s, Father Dagon 9.7 s), 60% a slow draw in and 40% a quicker letting go, eased at both ends (not a sine). Its reach is the hush's: `hushOf(past, hushReach(height))`, so it is whole at the ring and gone 25 to 85 m outside it. At the peak of the draw, with the whole reach on one, the low mist's density is up 110%, the thin haze up 70%, the mist's own light up 35%, the lantern's light drawn down 25% (and given back), and the picture's corners 50% darker; the sound beneath is a sub-bass bed (31 Hz and 46.5 Hz sines, a 93 Hz triangle so laptop speakers get it, and a lowpassed rush of air that is drawn in as it fills and let go as it empties), lower the taller the sleeper, on the effects bus (-17.8 dBFS at its peak, -31 dBFS RMS over two breaths, measured offline in Chromium's OfflineAudioContext on the real graph). It stops dead (0.4 s) when the fight engages, the boss dies, a cutscene plays or one steps under a roof, and it comes in over 2.5 s on approach. No camera shake (presence.ts owns that). The Fog setting 0 leaves it the lantern, the corners and the sound.

**The failing mind heard** (`audio/mindEars.ts`, `mindTide.ts`):
- A thin ringing: two sines (4150 and 4153 Hz, a 3 Hz throb) on the bed bus that creeps in over 3 s once the stress passes 0.3 (sanity 70), rising on a smoothstep to a hard ceiling of -46 dBFS peak at the end of madness (-54 at sanity 40; nothing at 0.3). A heavy blow taken (a hurt `Hit` on the investigator of 6% or more of their greatest health, steady minds excepted) rings the ears a moment more: up to -42 dBFS added, up in 30 ms, gone in 1.5 s, at most once in 4 s.
- The lantern: its spit, its dying and its catching are heard where the picture shows them. A spit (short pop and a little hiss) at each dip of the gutter (counted by hysteresis on `lanternGain`: from above 0.6 to below 0.3), one last spit and a falling hiss as it goes out, a soft whump and a rising hiss as it catches again at Fractured. In the head, a little to the left where it hangs; every one under -18 dBFS peak (a whisper's best), none when it burns steady, none in a menu or cutscene, and a game loaded Unmoored (lantern dark from the first frame) is not heard going out.
- The tide: Unmoored (stress 0.85 to 0.97) the world's high end breathes: the engine's muffle is asked for up to 0.28 of its range more (16 kHz down to about 9 kHz) in a 7 s swell (`sin(0.9 t)`). One line in gameAudio's `setMuffle(Math.max(HEART.need, hush * 0.9, MIND_TIDE.muffle))`: near death the heart's muffle wins.

**The tread** (`audio/follower.ts`, merging the brief's `unseen-tread` and the `mind-heard` phantom steps: one scheduler, two forms by what the investigator is doing when it comes). From Fractured (stress 0.6, the whispers' line), an episode every 110 s (at the line) down to 50 s (end of madness), drawn 0.6 to 1.4 times over and never nearer than 40 s. Walking: a second set of footfalls a half-stride (45 to 55% of the investigator's own measured stride) behind, softer (0.28 to 0.4 of the set's level against the investigator's 0.55 to 1), pitched 0.82 to 0.9, low-passed at 1.1 kHz, alternating ears (0.25), on the ground's own step set (stone, road, dirt), for 6 to 14 footfalls. When they stop (no footfall for max(0.45 s, 1.6 strides)), theirs stop, and 0.4 to 0.7 s on, one step more lands: louder (0.45), brighter (2.6 kHz), nearer; then nothing. Standing still (1.5 s) when it comes: after 1.2 s, 4 to 7 slow steps from behind the listener (0.6 to 0.75 s apart) closing from 6 to 3.5 m (louder and brighter each step); the instant the camera looks within ~50 degrees of where they are, nothing more (they stop on the instant); if the investigator sets off instead, the tread comes along; uninterrupted and Unmoored, half the time a breath at the ear ends it. Never during `fighting(g)`, an engaged boss, a cutscene, a talk, a kneel, a roll or attack, a horse, water, near death, or a menu; follows `fx.stress` (the Accessibility cap). Uses only existing CC0 step recordings (never the same take twice running: the sampler guarantees it).


### Knobs

`data/sleeperBreath.ts` BREATH: `minHeight` 8; `period` {8, 0.15/m, 9..15}; `inhale` 0.6; `swell` {mist 1.1, haze 0.7, lantern 0.25, glow 0.35, vignette 0.5}; `ease` {up 2.5 s, down 0.4 s}; `bed` {hz [31, 46.5, 93], drop 0.28 over 40 m, gain [0.45, 0.4, 0.2], noise {260 Hz, Q 0.7, gain 2.2}, peak 0.1, glide 0.25 s}.
`data/mindSounds.ts` MIND_EARS: `ring` {from 0.3, ceiling -46 dBFS, hz 4150 + 3, rise 3 s, fall 0.5 s, struck {from 0.06, full 0.3, add -42 dBFS, decay 1.5 s, gap 4 s}}; `tide` {from 0.85, full 0.97, depth 0.28, rate 0.9}; `lantern` {high 0.6, low 0.3, out 0.01, catches 0.35, pan -0.4, spit 0.45, died 0.5, kindled 0.18}; `tread` {from 0.6, every [110, 50] s, steps [6, 14], gain [0.28, 0.4], pitch [0.82, 0.9], lowpass 1100, delay [0.45, 0.55], stop 0.45 / stopBy 1.6, last {wait [0.4, 0.7], gain 0.45, lowpass 2600, pitch 0.8}, approach {still 1.5, steps [4, 7], 6 to 3.5 m, gap [0.6, 0.75], lead 1.2, turned cos 50deg, breath 0.5}, gap 40 s}.
Debug (`?debug`): `(await import('/src/render/sleeperBreath.ts')).BREATH_DEBUG` = `{ phase: 0..1 | null, reach: 0..1 | null }` holds the breath where it is asked and gives it a reach whatever the sleeper's; with `window.fxlab.hold(true)` the world stands still, so only the breath differs between two stills. Sleepers to walk to: Cthulhu ring centre (1376, 2384) r 48, h 40; the Dagon and Hydra hall (824, 768) r 23, h 11; Ghatanothoa (1144, 2256) r 23, h 20.


### Left out

- The optional `watchers.ts` swell on a watcher's placing (dread-picture owns that file).
- `Foley.stride` field and `follower.update` call from gameAudio (the follower is made by the hub part and keeps its own stride count: no foley.ts/gameAudio.ts hunk beyond the muffle line).
- The always-on lantern hiss bed (-48 dBFS) and the tide's A/B on a real speaker: none of the audio could be heard here, only measured.
- The bed duck of the breath near a fight, a bed dip as the tread ends ("the night goes still"): the engine has no per-effect bed duck; the silence is the absence of the steps.
- No Particles use; no draw calls added (post uniforms and one lantern uniform only).


### Watch

- Taste (audio could not be listened to): the ring's presence at -46 dBFS (a continuous 4 kHz tone can tire: `MIND_EARS.ring.ceiling`), the sub-bass's level on small speakers (`BREATH.bed.peak`), the tread's level (`tread.gain`) and frequency (`tread.every`). All are single numbers.
- The sleeper's visual swell is deliberately bold (the mist is a thin low layer, a third of what it was, and a 30% swell was not seen after the 64-colour palette and dither); it is slow (9 to 15 s) and within the reach only. If it reads too strong, lower `BREATH.swell.mist` and `vignette` first.
- `uVig` is set absolutely from the value read when the breath was made (0.42); if another builder animates the vignette in the same frame, one of the two wins (nobody else writes it as of this branch).
- The same-line merge in gameAudio's `setMuffle` (with dread-picture) and the two rings in the sound (dread-picture's shock ring at 0.05 x shock gain, mine at -46 to -42 dBFS): they overlap only after a heavy sanity blow, and mine is the quieter.
- The follower's stride counter copies foley's: if footing changes foley's stride rule the tread's "in time with yours" drifts (never wrong, only off the beat).


## Acoustics: a room for every place, sound through walls, the hearth


### Built

**A room for every place** (candidate `acoustic-spaces`, the main thing). Every one-shot (and a share of the bed: drones, ambience, far calls) is now also sent into a two-convolver reverb made in code, and where the investigator stands says how much goes to which and how dark the answer is. The change slides over about a second (time constant 0.4 s), so a doorway is heard as a threshold.
- The reverb: send tap (sfx x1, bed x0.08..0.3 by space) -> 180 Hz low cut -> pre-delay (8..44 ms) -> a short ROOM (0.9 s impulse, measured RT60 0.52 s) and a long HALL (4.2 s impulse, measured RT60 2.5 s) -> a low-pass (1.5..6.5 kHz) -> back into the sanity shaper beside the dry sound (so the sanity distortion, the near-death muffle, the limiter and the effects/ambience sliders govern it; no new setting). Impulses are noise under a falling envelope, bright at first and duller after (the highs die sooner), six early reflections laid over the start (so it reads as walls, not a wash), a different ear each, made once per context and normalised to ONE unit of energy (so the numbers in `data/acoustics.ts` are shares of amplitude: 0.36 is a wet 9 dB under the dry sound's energy). `ConvolverNode.normalize = false`.
- The rooms (`SPACES`, by kit via `KIT_SPACE`, by region via `REGION_SPACE`): open (fields: nearly dry, -20 dB wet/dry on a sequence), ruin (walls, no roof), timber (houses: short and woody, room reverb), library (books drink the tail), nave (church, marble hall), vault (masonry, crypt, cellar, brick, basalt, the Seventy Steps), cave (the mine), drowned (Y'ha-nthlei, the drowned temple, risen R'lyeh: held long and dull, dark 1.5 kHz), cosmos (the Beyond and all six Outer Dark regions: an endless faint hall), and fight (any engaged boss fight draws the room toward a sealed hall of its own: hall 0.24, dark 4.2 kHz; max with the place's own, never smaller).
- The room's shape shapes it (`ROOM_SHAPE`): a corridor is close (hall x0.6, room x1.3), a wide hall opens (hall x1.4), a pit or a well rings (hall x1.6, darker x0.8), a bridge opens a little. The long reverb is capped at 0.7.
- Paused (a menu): the wet is x0.4, so menu sounds do not carry a vault's tail.
- Safety: if the frames average under 28 fps for 6 s (needs 60 frames seen; checked once a second) the convolvers are disconnected (`bus.enable(false)`), and come back after 20 s over 40 fps. A single hitch does not trip it.

**Sound through walls** (candidate `walls-between`). A placed sound (every recipe, recorded take and stinger that has a place) is now shut off by what is between the investigator's head and it: stone walls, hills and great columns (not trees, fences, planks or posts: `stopsSound`), a horror's fog wall (full), and a roof between them (0.4 with the line clear, 0.8 with a wall as well). Heard: level x (1 - 0.45 x occ), never silent, low-pass by octaves from 18 kHz (clear) to 0.7 kHz (wholly shut), a wall in the line (0.7) comes to about 1.5 kHz, "as through stone". The investigator's own sounds and anything within 3 m are untouched. In an engaged boss fight a pillar does not mute the horror (the fight is one hall); its fog still does. A look is kept for 15 simulation frames by the 0.5 m cell the sound falls in, and at most 12 rays are cast per frame.

**The hearth of fires and lamps** (candidate `living-light-sound`). The world's lights now make their small noise, placed: the nearest few (4 voices) of the lights in earshot (18 m) are heard through a low-pass, a flicker, a level and a pan, into the bed. A torch spits and pops at the investigator's side; a fire or brazier crackles broader and deeper (range 14 m); a street lamp hisses thinly (7 m); a lit Elder Sign (found signs only) carries a soft shimmering hum, two pairs of sines (98/98.3 Hz and 147/147.45 Hz, beating at 0.3 and 0.45 Hz) with a breath of air (12.5 m). The flame voices are looped textures drawn once in code (3 s, 24 kHz mono, loops close; rumble that swells, flame hiss, random pops with a tick and a few sharp snaps). The level follows the game's own law (whole within 3 m, squared to nothing at the range), the crackle swells and falls with the flame's flicker (`waver`) and DROPS OUT with the mind's gutter (the flames guttering out as the mind fails, in step with what the eye sees). A torch or fire the eye cannot see (lightSight.ts's `v`, eased) is heard dulled and at 38% of its level (round a corner it opens as the flame comes into view); a lamp or Sign is asked of a ray. Voices follow a light by its position, glide in and out over 0.3 s and are let go 1.6 s after fading, so none pops. A street lamp hisses only as the dusk lights it (`darkOf(phaseOf(time))` x2, capped at 1; lamps burn in the picture at every hour but are only seen at night). Paused: all fade. About -38 dBFS rms at 2 m (fire -37.7, torch -38.8, sigil -39.6, lamp -46).


### Knobs

`src/data/acoustics.ts`: `SPACES` (room/hall wet amplitude, dark Hz, pre ms, bed send per place; vault is hall 0.36, drowned 0.5, timber room 0.22, open hall 0.055), `SPACE` (`room`/`hall` impulses: seconds, rt60, early reflections ms, damp; `hallMost` 0.7; `hpHz` 180; `slide` 0.4 s; `paused` 0.4; `safety`), `OCCLUSION` (gain 0.45, cutoff 18000 -> 700 Hz, `curve` 0.75, blocked 0.7, roof 0.4/0.8, fog 1, near 3 m, keepFrames 15, perFrame 12, wall = 0.45 m thick and 2 m tall, column radius 1.2).
`src/data/lightSounds.ts`: `HEARTH` (voices 4, reach 18 m, per-kind range/gain/cutoff, `floor` 0.38, flame specs, the Sign's tones).


### Left out

- A town-street space (between houses) and an under-water space: no cheap, truthful predicate (the open world has no "between buildings" query short of counting colliders); the sea's own hush already exists.
- The `?debug` panel / F3 line ("space id, wet, cutoff"): those are `ui/` files other builders may touch; read `window.audio.space.state` and `HEARTH_NOW` (`await import('/src/render/audio/hearth.ts')`) instead.
- Occluded sounds do not get "more wet" (optional in the brief).
- The bed send is one shared tap (its level follows the space), not per-source: the realm music and boss scores are NOT sent (they have their own buses), nor speech.
- docs/SOUND.md and DECISIONS.md are the integrator's.


### Watch

- The reverb's level is set by measurement, not by ear (as SOUND.md admits of earlier mixes): the vault, cave and drowned halls are the hottest (wet/dry on a mixed sequence -4 to -5 dB; the tail of one footfall within 40 dB of its peak for about a second). If they read too wet, lower `hall` in `SPACES` (each -3 dB is x0.7); the whole thing is that one table.
- Chromium runs the long convolver stages off the audio thread; Safari and Firefox untested. The 4.2 s hall impulse is about 2 MB of floats and one 200k-tap partitioned convolution; the safety lets it go on a machine that cannot hold its frames.
- Occlusion costs up to 12 rays a frame (cached a quarter second by cell), and every `recorded`/`recipe` that has a place pays one cache lookup. `fogsUp()` allocates a filtered array per fresh look (about once per sound per quarter second).
- It slightly lowers the clarity of cues players use to locate foes through walls (never more than -45% gain, never silent; the foe bars keep the information), and a creature heard past a wall changes at once from clear to dull as the line opens (kept a quarter second).
- Tests that might pin numbers: none known; `tests/soundMix.test.ts` renders recipes dry. The reverb is not in any measured mix. SOUND.md's fight totals and limiter figures have NOT been re-measured with the reverb in (the wet never exceeds the dry's peak in the offline sequence; the limiter's behaviour on a boss roar with a hall tail is unmeasured).
- `place()` now returns a wider object; any other builder calling `foley`'s `place` shape is fine (extra fields).


## Night voices: the hours heard, each realm's far voices, the sea and wind placed


### Built

**The night's hours heard** (`data/ambienceHours.ts`, `render/audio/ambience.ts`). Outdoors in the open world every bed reader has an "hour" gain between its own breath and its pan, followed over 3 s and told twice a second:
- crickets and frogs: full at the gloaming, 0.55 in the deep, 0.09 in the Still, 0.21 in the waning, back to 0.94 by the turn (the lamps lit anew);
- the winds lift by `dawnOf` (a quarter more of `wind`, a fifth more of `wind_cold`, a tenth of `wind_ghost`) toward the grey of the last hour, and are a little lower in the gloaming;
- leaves, the sea, the cave, the drips and the murmur are flat, the leaves half-sink in the Still;
- the **Still**: phases 0.46 to 0.54 (about 86 s, eased over 0.02 phase either side): insects sink to 0.09, leaves 0.5, wind 0.6, and the region's spot sounds hold (a spot due inside it is drawn again for after its end, not all at once); when it ends, 2.5 s later, one deliberate far dog howl (the `farHowl` recording) in the waking world's realms (hub, arkham, dunwich, innsmouth, providence, vermont);
- spots by the hour: owls x1.5 in the deep, whippoorwills x1.3/1.5 in the gloaming/deep and x0.4 in the waning, dogs x1.2 in the evening; each spot's wait is divided by its weight.
Under a roof, in the arena and at the title the hour does nothing (as the sky's grey does not).

**Place voices** (`data/placeSounds.ts`, `data/ambienceSounds.ts`, `render/audio/placeVoices.ts`). Twelve procedural recipes (foghorn, buoy bell, cracked toll, church organ, windpipe, ice boom, dry chime, K'n-yan drip and throb, muffled temple bell, Leng drum, woods drone, R'lyeh swell) and three existing recordings shut in by a low-pass (`rumble` for Sentinel Hill, `chant` for the Order of Dagon, `raven` for the waning's crows). Per realm: Innsmouth horn + buoy + chant (all from the sea's side), Arkham organ + crows, Dunwich hill rumble, Providence toll + organ + crows, Vermont woods drone + crows, Mountains ice + piping, Pnakotus dry chime, K'n-yan drip, Dreamlands temple bell + Leng drum, R'lyeh swell, hub toll + crows. Each voice has its own hour weights (the organ only in the deep, the toll in the evening, crows and piping in the waning...). Rare: about 2 to 3.6 voices per ten minutes in a realm (one in 3 to 5 minutes), never two within 60 s, never the same twice running where another could sound, nothing in a fight, a cutscene, a pause, a storm or gale, under a roof, while the ground is going quiet before a horror (`AudioEngine.hushed`), or in the Still.

**The sea where the sea is, the wind where it blows** (`render/audio/exposure.ts`, `render/audio/bedShape.ts`, `data/ambienceRoles.ts`). Every 0.25 s the land about the investigator is read on 4 rings (14, 40, 100, 180 m) x 12 bearings (`landHeight`; 0.06 ms a look): shore (0..1, how much of the horizon is sea and how near), which way (against the listener's right, every frame, so it swings across the picture as the head turns), and exposure (-1 lee .. +1 height over the land about the 40 and 100 m rings). `surf` and `waves` play whole, bright and drawn toward the water on the shore, and fall to 0.3 of their level and a 1800 Hz cutoff inland; `wind`, `wind_cold`, `wind_ghost` go from 0.5 to 1.35 of their level and a 30 % brighter or duller cutoff by exposure. The hull's knock and the gurgle come from the water's side and are softer inland. Realms without a sea (`biome.sea` false: Pnakotus, K'n-yan, Beyond, the Outer Dark) hear none; wind is not placed at a gallop (the mount's bed carries it). The real coast turns out to be the rim of the world only (a realm is a 512 m tile, only the outer tiles have sea): at Innsmouth the east and north edges, so the surf there is now loud only within about 100 m of them.

Offline measurements (real recordings through the real `ambience.ts` in Chromium, an OfflineAudioContext; images in `/mnt/project-files/atmosphere/night-voices/`): Dunwich insect band (3 to 6 kHz) 21.7 dB at the gloaming, 16.5 deep, 6.1 Still, 11.3 waning (`hours-dunwich.png`); Innsmouth surf total -27.6 dBFS on the quay, -31.7 at 60 m, -38.0 in the streets (before: -28.5 everywhere, `shore-innsmouth.png`); Mountains wind +1.8 dB and 5.5 dB brighter on a ridge, -6.3 dB and 13.5 dB duller in a lee (`wind-mountains.png`); each far voice stands 11 to 50 dB above the beds in its own band at a typical placing (gain 0.55: foghorn +29, buoy +33, toll +29, organ +19, windpipe +23, ice +39, chime +11, drip +15, temple bell +17, drum +27, drone +25, swell +52; rumble +8, chant +10, crows ~+7 after the raise, howl +7); `far-voices-spectrograms.png` are the twelve recipes.


### Knobs

- `data/ambienceHours.ts`: `STILL {from .46, to .54, ease .02}`, `STILL_DEPTH` per bed, `HOUR_BEDS` curves (insect keyframes), `SPOT_HOURS`, `STILL_HOWL {after 2.5 s, gain .85, lowpass 1900, realms}`.
- `data/ambienceRoles.ts`: `SENSE` (rings, bearings, share per ring, rise 1.2 s / fall 4 s), `SEA_PLACE {inland .3, low 1800, high 1000, pan .6}`, `WIND_PLACE {lift .35, lee .5, bright .3, most 1.6}`, `SEA_SPOT`.
- `data/placeSounds.ts`: `PACE` 1.4 (one knob for how rare: every wait x PACE), `GAP` 60 s, `REACH` 2.5, `HUSH_MOST` .12, `MASKED` {storm, gale}, per voice `every/gain/far/hours/lowpass/pitch/seaward`.
- `data/ambienceSounds.ts`: `FAR_MIX` per recipe (rms about -21 dBFS before the placing).


### Left out

- No far voices for Beyond, Yuggoth and the six Outer Dark realms (their beds and drones carry them; adding a voice there is a row in `PLACE_VOICES`).
- No in-game debug read-out of shore/bearing/exposure (the debug panel is a shared UI file); `window.__nv`-style inspection: import `render/audio/exposure.ts`'s `PLACED` in the console.
- Not run through the live game by ear: I cannot listen. The audio path was verified offline (see Built); a live-game smoke run under the GL lock (`?fresh&debug`, scenario kept at scratchpad/nv/smoke.mjs: audio started by a click, travel to the reef, the quay and the streets, the Still and the waning, logging `PLACED` and the beds' targets) sat behind 16 other builders in the lock queue for ~25 minutes after the rate-limit pause and was withdrawn; it was NOT run. What stands in for it: `tests/nightVoicesPart.test.ts` drives the real part against a real world game, and the offline Chromium runs drive the real `createAmbience` and `createPlaceVoices` with the real recordings (no console errors).
- Recordings that stand in front of recipes (`RECORDED_FOR`, plannedSounds) are not used: the far recipes bypass `recipe()` on purpose (bus), so no recording may later "stand in front" of them without a code change.
- Wind exposure is not applied while mounted at speed; the sea beds are, which is right.


### Watch

- Taste: levels were set by measurement (band SNR 7 to 50 dB over the beds), not by ear; `FAR_MIX`, `PLACE_VOICES[*].gain` and `PACE` are the knobs. The sub-bass recipes (drip's throb, R'lyeh's swell, the ice boom) carry real energy below 60 Hz that small speakers will not play: they sound thinner there, not louder.
- The insects are 45 % quieter in the deep than before (the new game opens at phase .3), which is intended; if the owner misses the crickets raise `INSECTS` mid keyframes.
- Perf: one `landHeight` read of 49 points every 0.25 s (0.06 ms), a 0.25 s roof/fight look, and per frame only `setTargetAtTime` on the sea readers (<= 4 nodes); far voices create ~10 to 20 nodes per play, a few times per ten minutes. No Particles, no draws.
- `synth.ts` hunk may conflict textually if another builder edits `playSound`'s two `.connect(sfx)` lines.
- `tests/samples.test.ts` pins are untouched (`AMBIENCE`, `Spot`, `nextSpot`, `BED_MANNER`).


## UI mood: realm title cards, the night's turns, the body tide, the quiet walk


### Built

1. **Realm title cards** (priority 1). Entering a realm for the first time on a save shows a large card: the realm's name inked in a
   letter at a time from the middle outward (opacity + a 5 px blur + a 4 px sink, per-letter jitter so it is not a metronome), a
   hairline rule drawn out from the middle, and a one-or-two-line Lovecraft epigraph a beat later; the whole card tinted bone toward the
   realm's first accent (luma floor so a dark accent never goes unreadable); it sinks away from the ends in. Coming back to a realm is
   the old small place card, now inked and tinted too. 14 realms have an epigraph (hub, arkham, innsmouth, providence, pnakotus,
   dreamlands, rlyeh, beyond and the six of the Outer Dark); dunwich/vermont/mountains/kn_yan/yuggoth have none (the card is the name and
   the rule). A card waits (one slot, 90 s stale) while the veil, a cutscene, a journey or a menu is up; if the veil already said the
   epigraph on the way in (journeys), the card does not say it again.
2. **Night turns / hour cards** (priority 2). Keyed only on the hour of the world clock changing (GLOAMING, THE DEEP, THE WANING with
   "the sky greys, the morning will not come", THE NIGHT TURNS with "no dawn came"). Skipped under a roof, in a boss fight, in a menu,
   in a cutscene, under the veil, and for 3 s after a world is made (a loaded save is not a turn). The minimap's hour label is now
   localised through `hour.*` (it was English only). Lowest rank: it never cuts another card short.
3. **Body tide** (priority 3). When the investigator is struck down the world drains of colour (post-pass `uFaint.y` to .88) and the
   corners close in (`uFade` to .5) over 2.2 s of wall-clock; rising from an Elder Sign (a `Rested` before the kneeling-to-null edge) the
   corners open and the light swells for 1.8 s, easing out. Cleared on Respawned / alive / Travelled. Additive by `max()` over what
   hurtFx already writes.
4. **Quiet walk** (priority 4). With no blow, wound, lock-on or hunt for 7 s (and health, stamina full, sanity >= 70) the vitals, counters,
   minimap and quest tracker fade to 30% (one `dim` wrapper layer); standing still 5 s more and the camera draws back 10% and rises
   .04 rad (ray-clamped against the world so it never enters a wall). Snaps back in 0.4 s at the first threat, blow, lock-on, fog pass,
   mount, fall, kneel, cutscene or boss fight. Setting `Settings > Play > Quiet walk` (default on).
5. **The veil that knows where it is going** (priority 5). The journey's veil names the destination in larger, wider letters inked in
   (`ink()` on the first full-cover frame); on a first journey into a realm it holds at least 3.6 s and says the realm's epigraph (once
   for each realm, remembered in localStorage `lore-shown` as `epigraph:<region>`; no storage = no epigraph, so the old timing is kept).
   The lore line beneath rises after the last letter is inked.


### Knobs

`INK` (span 1.1, letter .75, out .8, jitter .025, blur 5, sink 4, rule {delay .5, draw 1.4, width 420}, epigraph {delay 1.6, rise 1.0},
tint .45, floor .62); `CARD` (realmHold 4.8, stale 90); `VEIL` (epigraphMs 3600, loreRise 700); `HOUR` (hold 3.4, settle 3);
`TIDE` (drain 2.2, grey .88, close .5, breath {vig .55, bloom .35, seconds 1.8, decay .7}); `QUIET` (hudAfter 7, hudTo .3, camAfter 5,
back 1.1, lift .04, in 2.5, out .4, sanity 70, still .2, turn .25). Card look (size 38, letter-spacing .12 to .2 em) is the `realm` row of `LOOK` in `banner.ts`.


### Left out

- The horror's name plate in `cinemaUi` was not given the ink (the brief's optional extra).
- `hourName` in `clock.ts` is left unused (the cards use `hour.*` keys).
- No epigraph for dunwich, vermont, mountains, kn_yan, yuggoth (no line I could stand behind; the card is name + rule).
- No new spoken lines, no sound: the card is silent (nothing in `audio/` touched).
- Real-game stills of the tide/breath and the veil: see Risks.


### Watch

- **Verification gap.** Real GL stills exist for the quiet walk (HUD dimmed, view drawn back), the hour card (THE WANING over the
  greying sky) and the first-entry realm cards (before the size-38/.2em/fit fix; after it the card was shown in a non-GL harness with
  the animations frozen: Innsmouth with epigraph, Arkham, Pnakotus, the Court at the Centre, mid-ink frame). NOT seen in the real game:
  the tide's drain and the rising breath (covered by `tests/tide.test.ts`, the maths and the clearing), the larger inked veil name and
  the first-journey epigraph (covered by `tests/loreLine.test.ts`, `journeys.test.ts`, `veil.test.ts`), and the realm card in the real
  scene after the fix. Two scenario runs for these were queued behind the shared GL lock (`/tmp/claude-0/ui-mood-scn/run_both.sh`
  then `run_veil.sh`; they write `after-tide-a|b|c`, `after-breath`, `after-breath-over`, `after-veil-a|b` and the `before-` twins to
  `/mnt/project-files/atmosphere/ui-mood/` and `both.done` / `veil.done` beside the scripts when finished). If those files are absent, they did not run.
- **HUD vs the round-52 permanent-vitals decision.** The owner kept the vitals permanently on screen; the quiet walk dims them to 30%
  (never hides) and only when everything is calm, with a setting to turn it off. A design call to confirm.
- **`seen:<region>` written to `ow.told`** (cosmetic; saved; nothing reads it but `realmCards`). An old save sees the hub's card once
  (and every other realm's first revisit). `saveVersion` untouched.
- **`uVig` / `uBloom.x` written from LIGHTING constants only while the breath is active** (they are otherwise set by the lighting
  hooks); another package that animates the vignette or bloom in `hurtFx` should be merged with this in mind.
- **`banner.show` gains a 5th parameter** and `Tone` two members (`banner.ts` is where a merge will conflict if another package touches the banner). The quest tracker is now parented under the `dim` wrapper (its own fade still works inside it). A `busy` getter I had added to `Banner` was removed again in the last commit (nothing read it; `hud.ts`'s `great` spread would have frozen it).
- **`createHud` has a new 6th parameter** (`HudOptions`); `main.ts` is the only caller.
- Perf: none measurable (a few DOM spans per card; the tide adds two uniform writes; the calm adds one `raycast` per frame while its eased value is above .001, i.e. only in the quiet walk's camera draw-back)
- The Outer Dark epigraphs are five clauses from one poem; the German, French and Spanish lines of all the new strings are mine, not a translator's.
- Narrow screens: the realm card is sized for 960 px up and shrinks for names over 22 letters; checked at 960x540 only.
