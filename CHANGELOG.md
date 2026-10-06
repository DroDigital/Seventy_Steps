# Changelog

The game was made in numbered rounds (every judgment call is in [`docs/DECISIONS.md`](docs/DECISIONS.md)); this lists what a
player would notice, newest first. Versions before 1.0 were never released.

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
