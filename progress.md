Original prompt: Implement all reviewed creature sprites and animations correctly into the game at https://github.com/DroDigital/Seventy_Steps.

## Plan

1. Import the active 105-creature registrations and pack original RGBA frames losslessly.
2. Connect camera-relative directions, exact mirroring, variable cycles and combat timing.
3. Update bosses, sky visitors and the bestiary while preserving gameplay.
4. Verify all assets, run the complete checks/build, and inspect the served game.
5. Publish the integration branch and a pull request.

## Progress

- Current game main checked out at 546cef2dc22ae6254db0a4a4d5f23d44ca2d76fc.
- Imported 105 entries, 1,050 animation scopes and 2,577 distinct source files.
- Every source file hash and every packed RGBA crop verified; no art transformation.
- Four nearest-filter PNG pages total 9.53 MB; seven allies retain their procedural art.
- Added direction hysteresis, index-controlled mirroring and count-aware animation helpers.
- Connected reviewed PNGs to creature rendering, including the nine assembly bosses.
- PNG alpha is treated as transparency; procedural glow and distortion do not alter reviewed art.
- Initial complete repository check passed: 202 files / 2,180 tests, including audits; initial normal production build passed.
- Final camera-projection and Innsmouth routing corrections passed fresh typecheck and 40 focused tests.
- Corrected production renderer exercised all 105 creatures, 1,050 scopes and 3,059 poses with no mismatches, empty frames or browser errors.
- All 2,577 browser-decoded source canvases and page transport hashes passed; all 105 reviewed bestiary forms exposed.
- Inspected 630 side samples across all entries; normal Innsmouth alone needed left/right registration routing correction.
- Final code bundle compiled successfully; normal local copy of older cached audio stalled, so clean-checkout CI will verify final packaging.
- Final live production browser pass and GitHub publication pending.

## PR 148 review fix (2026-10-20)

- Request: address and fix the issues found by the review.
- The arrival stamp played a hoofbeat and recorded footfall without a matching hoof animation. Remove that extra cue; keep the whinny, harness settle, whicker and the gait/paw landing sounds.
- Updated the arrival regression to reject both the stamp and its recorded footfall; confirmed it fails against the reviewed code before applying the fix.
- Validation: `npm run check -- --maxWorkers=2` (272 files, 2,622 tests), `npm run build`, and `git diff --check` passed. Browser checks with the actual mount renderer and scheduler passed standing arrival/rest, walking (11 hoof cues and 11 footfall samples), dismissal and two shared-clock paw landings; no browser errors. The browser harness logs source callbacks rather than playing the audio mix.
