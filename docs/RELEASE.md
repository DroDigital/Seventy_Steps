# Release

What stands between the game and Steam, for Windows and macOS (and Linux). Round 50. The first half is done and checked by a
machine of each platform; the second half is what only the author can do, because it needs an account or a device that is theirs.

## What is done

- **The desktop game** (`desktop/`, Electron 44): one window at a time (Steam launching it again only brings the first forward), its
  own id on the Windows taskbar, no menu bar and no developer tools in a release (macOS keeps the app menu a Mac needs: About, Hide,
  Quit, full screen; a tester can be asked to start it with `--devtools`), a crash report kept as a file, saves as files that Steam
  Auto-Cloud keeps (docs/STEAM.md), controllers read natively (SDL), Steam's overlay and achievements when Steam is there.
- **Packing**, one folder a platform, which is what a Steam depot is (`npm run package:win`, `package:mac`, `package:linux`: each
  makes the icon first, builds the page, and packs into `release/`):

  | Platform | Folder in `release/` | What Steam launches |
  | --- | --- | --- |
  | Windows (x64) | `win-unpacked` | `SeventySteps.exe` |
  | macOS, Apple Silicon | `mac-arm64` | `Seventy Steps.app` |
  | macOS, Intel | `mac` | `Seventy Steps.app` |
  | macOS, both in one | `mac-universal` (`npm run package:mac -- --universal`) | `Seventy Steps.app` |
  | Linux (x64) | `linux-unpacked` | `seventy-steps` |

  A Mac build makes each architecture with its own copy of the controllers' SDL library (`@kmamal/sdl` downloads the one of the
  machine it is installed on; `tools/package_mac.mjs` fetches the other), so **a Mac build is made on a Mac**; Windows on Windows.
  The Mac apps are packed without an asar (`-c.asar=false`): the two architectures then differ only in their native files, which is
  what `@electron/universal` needs to merge them. The universal app holds both apps whole (`app-arm64`, `app-x64`) behind a small
  launcher, so it is about the size of the two together (913 MB zipped, against 469 and 476) and starts the one that fits the Mac.
- **A packed game is started, not only packed** (`npm run smoke`, `tools/smoke_packaged.mjs`, the shell's `--smoke-test`): it must
  reach the title, find the shell's bridge, load the Steam binding and start the controllers' worker, or it fails. It runs against a
  temporary data folder, never a player's saves, and an uncaught error in the shell ends it with the error printed instead of the
  error box nobody could click away. `--arch x86_64` starts an Intel app under Rosetta, `--timeout` and `--verbose` (Chromium's log,
  and on a Mac a stack sample of a start that never answers) are for finding out why one does not start.
- **CI does both on a machine of each platform** (`.github/workflows/release-builds.yml`: runs when the shell or packaging changes,
  by hand, and on a `v*` tag) and keeps the depots as artifacts for seven days. On GitHub's hosted runners it has packed and started
  (title reached, bridge, Steam binding and the controllers' worker all found): Windows Server 2025 (x64); Ubuntu (x64, a virtual
  screen and software GL, so without the controllers' worker); macOS 26 on Apple Silicon: the Apple Silicon app, the Intel app
  under Rosetta (its first start takes minutes: Rosetta translates the Electron framework before the app runs) and the universal
  app on its Apple Silicon side, all signed ad hoc, the universal one passing `codesign --verify --deep --strict`. **Not run
  anywhere**: the universal app on its Intel side, a real Steam client (the binding loads and finds none), a controller, a GPU,
  a window kept open for more than the title, and Windows 10 / an older macOS.
- **Uploading**: `tools/steam_upload.mjs` writes the SteamPipe scripts for the folders above (`steam/build/`, not kept) and, with
  `--run`, sends them with `steamcmd`. It refuses to set a build live on `default`: that is done on the partner site.

## What only the author can do

1. **Steamworks**: an app (its id goes in `package.json` as `steam.appId`: until then a release started outside Steam is not sent
   through it), a depot for each platform, the launch options of the table above, Auto-Cloud (the roots of docs/STEAM.md), the 28
   achievements with their icons (docs/STEAM.md), the store page (docs/STORE_PAGE.md, and the capsules: `tools/store_shots.mjs`
   makes the header, small, main, vertical and library capsules and the page background; Steam also asks for a library hero
   (3840 × 1240), a library logo with a transparent ground, and the client and community icons: none made), the price, the age
   rating, and the Steam Deck review.
2. **A Mac that can open the game**: macOS only runs an app that is signed. The packed apps are signed *ad hoc* (what Steam itself
   needs to run them, and what makes them start on Apple Silicon), which is not enough for a player who downloads the app outside
   Steam. For a release: an Apple Developer account (99 USD a year), a "Developer ID Application" certificate in the keychain of the
   Mac that packs, then `MAC_SIGN_IDENTITY="Developer ID Application: Name (TEAMID)" APPLE_ID=… APPLE_APP_SPECIFIC_PASSWORD=…
   APPLE_TEAM_ID=… npm run package:mac -- --universal`: every app is signed with the hardened runtime and
   `packaging/entitlements.mac.plist`, and notarised. (CI does not do this: it would need the certificate as a secret.)
3. **Windows**: nothing is needed to run through Steam. `SeventySteps.exe` is not code-signed (CI reads its signature as
   `NotSigned`); a signed one (an EV or OV code-signing certificate) only matters for a build handed out outside Steam, where
   SmartScreen warns about an unsigned one.
4. **Try it on a real machine of each kind** before setting a build live: Windows 10 and 11, a Mac with Apple Silicon and an Intel
   Mac (or the Rosetta start), a controller on each, Steam's overlay (Shift+Tab), fullscreen (F11, Alt+Enter), alt-tab and back,
   a save, quitting and continuing, and Steam Cloud between two machines. CI proves a packed build starts and reaches its title on
   a runner with no controller and no Steam; it has not played the game.
5. **The version**: `package.json`'s (`1.0.0-rc.3`; raise it before each build that goes out, `-rc.4`, `-rc.5`…, with its `CHANGELOG.md` heading) is what itch.io shows for a build, and it goes into the macOS bundle, where Apple wants digits only: set `1.0.0`
   when it is released. A push to itch.io takes another label if asked: the workflow's *itch_version* input, or `ITCH_VERSION` / `--version` for `tools/itch_push.mjs`. Steam's build ids are its own.

## Sending a build

```
npm ci
npm run package:win        # on Windows;  npm run package:mac -- --universal  on a Mac;  npm run package:linux  on Linux
npm run smoke              # it starts, and reaches its title
STEAM_APP_ID=… STEAM_DEPOT_WINDOWS=… STEAM_DEPOT_MACOS=… STEAM_DEPOT_LINUX=… STEAM_BRANCH=beta \
  STEAM_USER=<build account> npm run steam:upload -- --run
```

Without `--run` it only writes the scripts, so they can be read first. Each platform's folder is sent from the machine that
packed it (or from CI's artifacts, unzipped: a Mac's with `ditto -x -k`, a Linux's with `tar -xzf`, so that the links and the
executable bit are kept).

## itch.io (before Steam)

A build packed with `channel` set to `itch` in its package.json keeps off Steam altogether (no relaunch through Steam, no overlay,
nothing sent to Steam), whatever `steam.appId` holds: `desktop/steam.js`. `tools/itch_push.mjs` refuses a pack that is not marked,
because a Steam build started outside Steam would relaunch itself through it.

- **From CI (the way):** Actions › Release builds › Run workflow, tick *itch*. Each platform is packed for itch.io, started (`--channel itch`
  must show in its report) and pushed with butler to the channels `windows`, `osx` (the universal app) and `linux`, as version
  `package.json`'s. It needs the repository secret `BUTLER_API_KEY` (itch.io › Settings › API keys); without it only the plan is shown.
  The project is `digitaldro/seventy-steps` unless the *itch_target* input says another.
- **From a machine:** `npm run package:win -- -c.extraMetadata.channel=itch` (likewise `package:linux`; the Mac: `npm run package:mac --
  --universal --channel itch`), then `ITCH_TARGET=digitaldro/seventy-steps npm run itch:push -- --get-butler` (shows the plan) and again
  with `--run` (sends it; `butler login` once, or `BUTLER_API_KEY`).
- **What a player meets.** *Windows:* the exe is not code-signed, so a download from the website can show SmartScreen's "unknown publisher"
  (More info › Run anyway). *macOS:* an app that is not notarised is stopped by Gatekeeper when it comes from a browser download ("cannot be
  opened" or "damaged"); the way round is System Settings › Privacy & Security › Open Anyway, or `xattr -dr com.apple.quarantine "Seventy Steps.app"`.
  Say both on the page, and point players to the itch app, whose installs I expect are not quarantined (not checked). To remove the Mac
  warning, get an Apple Developer ID ($99 a year) and set the secrets `MAC_CERT_P12_BASE64` (the Developer ID Application certificate exported
  as .p12, base64), `MAC_CERT_PASSWORD`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD` and `APPLE_TEAM_ID`: the Mac job then signs with the
  hardened runtime and notarises the universal app (written, not yet run: expect one round of fixing when the first certificate is used).
- **The page's pictures:** `node tools/itch_art.mjs frames` (the dev server running, and Playwright: see its header) photographs the title and
  five fights (the investigator walks into each horror's ring and strikes: Cthulhu's talons overhead, Shub-Niggurath's young, Yog-Sothoth's beam,
  Hastur, the Colossus) into `store/itch/frames/`, 1920 × 1080, with no sanity distortion and no hint over them; you choose the best by eye, and
  `node tools/itch_art.mjs pack --hero <the best> <the others...>` makes the set: numbered screenshots, the cover (630 × 500), the social image
  (1200 × 630), the wide cover (21:9), a transparent logo and the profile picture (the Elder Sign, 512 square). A software renderer is a minute a
  place and flatter than a GPU's: pictures of your own (photo mode, P) go through `pack` just as well. The icon of the .exe and the .app is the
  Elder Sign too (`npm run icon`: `desktop/icon.js`; the Mac's is set in from the edge with a shadow, as macOS draws them), and CI prints what each
  shipped file carries. There is no .dmg: the Mac build is the `.app` (itch's app runs it; a browser download gets it zipped).
- **Not checked:** an actual push (it needs the key and the project), the itch app launching the universal `.app`, and a Mac download
  through a browser.

