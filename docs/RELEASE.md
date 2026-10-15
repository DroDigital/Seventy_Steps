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
3. **Windows**: nothing is needed to run through Steam. A signed `SeventySteps.exe` (an EV or OV code-signing certificate) only
   matters for a build handed out outside Steam.
4. **Try it on a real machine of each kind** before setting a build live: Windows 10 and 11, a Mac with Apple Silicon and an Intel
   Mac (or the Rosetta start), a controller on each, Steam's overlay (Shift+Tab), fullscreen (F11, Alt+Enter), alt-tab and back,
   a save, quitting and continuing, and Steam Cloud between two machines. CI proves a packed build starts and reaches its title on
   a runner with no controller and no Steam; it has not played the game.
5. **The version**: `1.0.0-rc.1` is in `package.json` and goes into the macOS bundle, where Apple wants digits only: set `1.0.0`
   when it is released, and `CHANGELOG.md` with it. Steam's build ids are its own.

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
