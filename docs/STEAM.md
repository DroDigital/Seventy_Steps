# Steam

How Seventy Steps goes onto Steam (round 47). The shell is ready; what is left needs the Steamworks partner site, which only
the author can reach.

## What the game does

- **Steamworks** through `steamworks.js` (`desktop/steam.js`). With Steam running and the app known, the shell starts the
  Steam API, enables the overlay, and tells Steam of every achievement as it is earned, and again of those earned before
  (once a launch: one earned offline is not lost). Without Steam, the game runs as ever: nothing waits on it.
- **The app id** is read from `STEAM_APP_ID`, else `"steam": { "appId": … }` in `package.json` (0 until there is one),
  else a `steam_appid.txt` beside the program. **Set `steam.appId` in `package.json` once Steam gives one.** A release build
  started outside Steam is then started again through it (`restartAppIfNecessary`); with the id at 0 it is not.
- **Saves** are files in the user's data folder, `saves/` (`desktop/main.js`), which Steam Auto-Cloud keeps (below).
- **Steam Deck**: Steam sets `SteamDeck=1`; a first launch there takes larger text and captions (`DECK` in `playTuning`).
  Steam Input presents the Deck's controls as an Xbox pad, which the game reads and names.

## Packaging

`npm run package` builds the game and packs it for the platform it runs on, unpacked, into `release/` (electron-builder,
the `build` field of `package.json`): a folder to upload as a depot, not an installer (Steam installs it).

- `npm run package:win`, `package:linux`, `package:mac` name the platform. **Pack each platform on that platform** (or
  in CI on one of each): the controllers' SDL library (`@kmamal/sdl`) downloads its native build for the machine it is
  installed on. `steamworks.js` carries all three.
- The executables: `SeventySteps.exe` (Windows), `seventy-steps` (Linux), `Seventy Steps.app` (macOS). On Linux, give
  Steam the launch option `--no-sandbox` only if the Steam Runtime's container refuses Chromium's sandbox.
- The packed game holds `dist/` (the built page, its music, sounds and voices), `desktop/`, and the native modules
  unpacked beside the archive. About 615 MB on Linux.
- macOS: an app Apple has not notarised is refused by Gatekeeper outside Steam; signing and notarisation need an Apple
  developer account (`mac.identity`, `notarize` in the `build` field). Not set up.

## In the Steamworks partner site

1. **App id**: put it in `package.json` (`steam.appId`).
2. **Depots**: one a platform; upload `release/win-unpacked`, `release/linux-unpacked`, `release/mac` with SteamPipe.
3. **Launch options**: the executable above for each platform.
4. **Steam Cloud › Auto-Cloud**, a root a platform (the shell's data folder, Electron's `userData`, named after the product):

   | Platform | Root | Subdirectory | Pattern |
   | --- | --- | --- | --- |
   | Windows | `WinAppDataRoaming` | `Seventy Steps/saves` | `*.json` |
   | Linux | `LinuxXdgConfigHome` | `Seventy Steps/saves` | `*.json` |
   | macOS | `MacAppSupport` | `Seventy Steps/saves` | `*.json` |

   (`saves/` also holds the settings and the records; `window.json` and `logs/` stay on the machine.)
5. **Achievements** (Stats & Achievements): one for each below, its **API name** exactly the game's id. Their names and
   descriptions are the game's own; an icon for each is to be made (drawn in code would match the game: none exist yet).
   `tests/steam.test.ts` keeps this list whole.

| API name | Name | Description |
| --- | --- | --- |
| `signs` | Signs in the Dark | Find another Elder Sign. |
| `witch` | The Angles of the House | Put down Keziah Mason in the Witch House. |
| `colour` | What the Heath Remembers | Put down the Colour Out of Space. |
| `dunwich` | The Powder of Ibn Ghazi | Put down the Dunwich Horror. |
| `deep` | Y'ha-nthlei | Put down Father Dagon and Mother Hydra. |
| `steps` | Seventy Steps | Go down to the Cavern of Flame. |
| `seals` | Kadath's Door | Break four of the seals on Kadath. |
| `cthulhu` | Where Johansen Stood | Ram Cthulhu with the Alert. |
| `hastur` | The Third Naming | Put down Hastur. |
| `shub` | The Thousand Young | Put down Shub-Niggurath. |
| `chaos` | The Crawling Chaos | Put down Nyarlathotep. |
| `piping` | The Piping Fades | Outlast Azathoth. |
| `sealed` | The Gate Is Sealed | Wake, and seal the Gate. |
| `through` | Through the Ultimate Gate | Pass through with 'Umr at-Tawil. |
| `herald` | Herald of the Crawling Chaos | Kneel. |
| `every` | Every Door | Reach all three endings. |
| `stones` | Set in Star-stone | Reinforce a weapon to +5. |
| `strength` | The Weight of Echoes | Reach level 30. |
| `people` | The Other Sleepers | Talk with everyone in the dream. |
| `hundred` | A Hundred Horrors | Kill a hundred foes in one dream. |
| `again` | Once More into the Dream | Begin a second journey, carrying your strength. |
| `growth` | First Growth | Spend Echoes on a first level at an Elder Sign. |
| `reader` | A Reader of Dangerous Books | Read ten tomes and notes. |
| `fieldwork` | Field Notes | Behold twenty-five of the dream's creatures. |
| `armed` | A Room of Arms | Find every weapon in the dream. |
| `naturalist` | Natural History of the Dream | Behold seventy-five of its creatures. |
| `library` | The Whole Library | Read every tome and note. |
| `searcher` | Searcher After Horror | Find fifty of the dream's named places. |

6. **Steam Deck compatibility**: submit for review once the build is up; see docs/PERFORMANCE.md for what to measure first.
