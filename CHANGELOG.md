# Changelog

The game was made in numbered rounds (every judgment call is in [`docs/DECISIONS.md`](docs/DECISIONS.md)); this lists what a
player would notice, newest first. Versions before 1.0 were never released.

## Horrors' attacks

- Every attack of a horror was redrawn. A mark on the ground is now found on any floor (Cthulhu's was a teal nearly as dark as the ground): the colours that must be seen are lifted to a floor of brightness, in the horror's own hue, with a dark outline so they read on pale ground and dark.
- A telegraph shows the whole of what is coming from its first frame, fills toward its front, runs chevrons along a charge's lane, and flashes as the blow falls. A swirl draws a vortex's arms and its eye.
- Each horror's blows are made of its element: the sea throws drops and spray, stone shards and dust, fire embers that cool to black and smoke that climbs, frost splinters and a settling fog, spores and ash drift, ink falls in black beads, stars and eyes flash and shed light.
- A blow leaves its mark: burnt ground whose cracks glow and cool, shock rings racing out, a summoning's circle, the arc a swing swept. Bolts leave in a flash, trail their light and land in a spray and a scar. A beam has a hot core in an aura that crawls, with flares at both ends and a scorch where it crosses the ground.
- A caster gathers before it looses: light is drawn in to it, and a gaze streams from its eye to your head, thicker as your mind gives way. A teleport collapses where it was and arrives under a sigil; a summoning rises as a column of light from a circle; a phase change shakes the arena.
- You can hear them. A bolt as it leaves and lands, a burst, a swing, a summoning, an arrival, a phase change, the gaze and the dark each sound as the horror's element (water splashes, stone cracks, fire crackles, frost shatters, ink slaps); a beam and a vortex hum while they last, and the gathering before a blow rises to its release. A burst, a slam, a phase change and a gaze jolt the camera by how near they are (the Screen shake setting scales it).

## Riding

- You can hear a ride now. Every hoofbeat is a foot coming down in the horse's gait, panned left and right, on dirt, road, stone or in the shallows; under them run the wheels' roar and rattle, the rush of air and, for the motor car, an engine that climbs with its speed; over them the harness' brass, the creak of timber and a snort at the gallop.
- The chariot's horse is a new chestnut draft horse with a flaxen mane and white stockings, in black and brass harness, hitched to the shafts. It walks, trots, canters and gallops with its feet on the ground and stops where it stands. Its hooves throw dust, spray and sparks.
- The spectral chariot's violet fire is visible at last (it was not drawn at all), and the skeleton horses use the same gait.
- The mount's prompts, refusals and the Mounts tab are in English, German, French and Spanish.

## Mounts

- The included mount is called Chariot. The summon and ride prompts leave after a few seconds.
- A mount drops when the ride reaches a dungeon or a boss arena. It cannot be summoned in either place.

## Plain chariot

- The included mount is a one-horse wooden chariot. Its body and seat follow the spectral coach, without the funeral dress or the violet fire. Its horse is a chestnut draft horse (see Riding).
- The save id is still `grey`, so an older journey keeps its mount. The spectral chariot and the motor car are unchanged, and still no faster.
- On the desktop build, looking for a controller no longer closes and reopens the helper process, which was waking the macOS dock and pausing the game.

## Edges and horrors

- Walking off the land, into the sea, or through a pit, a well or a bridge's gap is fatal. A ride stops short of the land's edge, as it does at a wall: it is on foot that the edge is walked off. The Lost Echoes stay on the ground where you stepped off.
- Each horror's attacks keep their motion and take that horror's own colours: the telegraphs, the bursts and the beams.
- Casters no longer share one green fireball. Yog-Sothoth still throws that light. The Colour's orb is its own hue. Other shots are shards, drops, sparks or darts.
- A horror's areas wear its own mark: tide, runes, cracks, flame, spores, coils, an eye, roots, stars, frost, ash or a stain. The ground they cover, and when they land, is unchanged.

## Allied sprites

- Nodens, the Tritons, the Cats of Ulthar, Pickman, Nasht and Kaman-Thah, the Light-Being from Algol and the Yithian Archivist are drawn from authored sprites: idle, walk or glide, attack and hurt, from all four sides.

## Mount update

- The Borrowed Reins unlocks the Borrowed Grey, a plain saddled mare from the university stables.
- The spectral chariot is now optional $0.99 DLC, gated like the motor car. Neither is faster than the grey.
- Mount foley is audible: hooves by gait and ground, wheels, harness, idle breath or wind, summon and dismiss. The recipes are procedural placeholders.
- Violet fire follows each spectral horse. Notes and rumours use the burnt-paper screen; placed notes are charred.
- A read-only coach-house exhibit (`?mounts`) presents all three models. Steam app IDs still require release setup.

## 1.0.0-rc.1: the release candidate

**For the first hour and the way to a release**
- Hints before it costs: a foe closing in, a spent breath, a horror's mist ahead, a person to talk to; a parry says what follows.
  Only gentle foes stand about the first Elder Sign.
- A first launch measures its own first seconds and sets the picture for the computer (shadows, sharpness, fog); never over a
  player's own settings. F3 shows the frame rate and the 1% low; `?bench` measures eight places.
- A save before the last is kept, and a damaged save is mended from it. A break leaves a crash report to copy (and, in the desktop
  game, a file in the logs folder).
- The interface in English, German, French and Spanish (Settings › Display › Language). The story and the voices stay English.

**Combat and the horrors**
- The parry is the cane across the face with the body behind it; a parried foe is knocked back and stoops, open to a riposte.
- A candle before each horror's fog lights as you pass; a fall within 100 m of a lit one lets you rise there or at the Elder Sign.
- Resting at an Elder Sign brings back every foe killed (even where sixty were already standing); the guards about a dungeon's sign
  stay down until you rest at another, so there is nothing to farm.
- Bosses strike no oftener than about once a second; two servants at most, lighter and slower; a summoner calls no oftener than every
  nine seconds. Ranged foes take turns and shoot slower; the Elder Thing is calmer.
- Three difficulties (Light Slumber, Deep Slumber, Nightmare) chosen once, as a new dream begins.

**The picture and the menus**
- Mound dungeons have no notch of sky over the gate and no dashed slit along the ridge; floors have no glitchy inlay edges; the walk
  through a horror's fog is a walk; stars lose their rings.
- The mist is the one look of the menus; they dissolve as they close and between pages. The opening's cards gather out of ash and
  blow away as ash. The vitals are a step less saturated.
- The pad's A and B can never again be read two ways (one table of buttons, and a Swap A / B setting).

**Accessibility, controllers and saves**
- A new Accessibility tab: caption size and a dark band behind captions (cutscene lines, talks, what is overheard), Flashes (lightning dimmer, its strobe softened into one swell, or none), with Screen shake and FX intensity beside them.
- A PlayStation or Nintendo pad has its prompts named as its buttons are printed (✕ ○ □ △, R1; B A Y X, ZR).
- On a Steam Deck the first launch takes larger text; the smallest HUD text is a step larger everywhere.
- Saves carry their format and the version that wrote them; a dream begun on this release candidate goes on after 1.0, and a save from a newer build is kept and named as such, never shown as empty or mended over.

**Steam and balance**
- Steam: achievements reach Steam as they are earned (and those earned before, at the next launch); the Steam overlay; packed for Steam with `npm run package` (docs/STEAM.md).
- The Colour Out of Space heals more slowly (18 health a second, from 30): met early in Arkham, it was a wall.

**Voices**
- Morgan is spoken by the library voice Josef Hammer. The intro narrator is a voice designed for the game (a slow, grave English baritone), where a widely used library voice stood.

## Before this round

The whole game: an open world of thirteen regions from Miskatonic University through Arkham, Dunwich, Innsmouth, Providence, Vermont,
the mountains of madness, Pnakotus and K'n-yan, the Dreamlands, R'lyeh and Yuggoth to the gate beyond; a hundred creatures and forty-seven horrors, each
with its own arena, music and mechanic; sanity and insight; a revolver, Laudanum, lamp oil and West's Reagent; the Elder Signs and
fast travel between them; levels bought with Echoes; star-stones and weapon tempers; three endings and a second journey; people,
quests and documents; photo mode; the desktop shell for Steam; save slots; rebindable keys and pad support. See the rounds in
`docs/DECISIONS.md` and the playtests in `docs/PLAYTEST.md`.

## Before 1.0

- [ ] Run `?bench` on real machines and fill the table in `docs/PERFORMANCE.md`; write the minimum and recommended specs.
- [ ] Native-speaker read of the German, French and Spanish interface (`docs/LOCALIZATION.md`).
- [x] Packaging (`npm run package`) and Steamworks in the shell (achievements, overlay); Auto-Cloud needs no code.
- [ ] The Steamworks partner-site steps: app id into `package.json`, depots, Auto-Cloud roots, the achievements and their icons (`docs/STEAM.md`); pack Windows and macOS on those systems; macOS signing.
- [ ] Confirm the licence of every generated voice and track for a commercial release (`docs/STORE_PAGE.md`, AI disclosure).
- [ ] Capsule art, a trailer and screenshots from a real GPU (`tools/store_shots.mjs`, `?trailer`).
