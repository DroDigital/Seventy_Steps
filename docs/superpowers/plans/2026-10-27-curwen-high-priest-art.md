# Curwen and High Priest Artwork Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development. Check each completed task against the scope and final delivery hashes.

**Goal:** Integrate the approved Joseph Curwen and both High Priest redraws into the current game's atlas with correct animation routing.

**Architecture:** Use the existing `tools/replace_reviewed_sprite.py` importer to replace the three complete registrations in place, remove unused old frames and preserve the other 102 creatures. Regenerate art-derived rendering metadata with `tools/reviewed_look.py`. Keep gameplay data and animation timing unchanged.

**Tech Stack:** TypeScript, Three.js, Vite, Vitest; Pillow/NumPy atlas tooling.

**Spec:** Approved `Seventy-Steps-Curwen-High-Priest-Reworks` delivery, `MANIFEST.json`, `review/REVIEWED-FRAMES.json` and `IMPORT-NOTES.md` in the adjacent artwork workspace.

## Global Constraints

- Import only `joseph_curwen`, `high_priest`, and `high_priest#eldritch`.
- Preserve all 87 delivered PNG pixel arrays, alpha and palettes exactly.
- Per form: idle 2 and movement 4 in all four directions; front attack 3 and hurt 2.
- Right idle/movement uses left sources with one mirror operation. Side/back attack and hurt fall back to front.
- Keep canvases 64×64, ground row 62, existing world scales and gameplay tuning.
- Preserve unrelated creature registrations and pixels, allies, boss combat and saves.

## Review Focus

1. Obsolete movement frames must not remain reachable after shorter cycles replace 6/8-frame sequences.
2. The right view must match the delivered mirrored sprite without double mirroring.
3. Side/back attacks and hurts must use the approved front poses.
4. Index hashes, page hashes and source-index registrations must agree with the new atlas.
5. Non-target creatures must retain their authored pixels and metadata despite global index remapping.

## Task 1: Import the three reviewed drawings

**Files:** `public/creatures/reviewed/index.json`, `source-index.json`, affected `creatures-*.png`, generated `src/data/reviewedLook.ts`.

- [x] Verify the delivered 87 PNG byte hashes against the review and delivery manifests.
- [x] Run the existing importer with `--dry` for the three keys and approved package directory.
- [x] Apply the importer and regenerate `reviewedLook.ts`.
- [x] Record exact changed files and confirm only the target forms' art-derived values changed.

## Task 2: Pin delivery correctness and preserve the remaining roster

**Files:** `tests/curwenHighPriestReworks.test.ts`, its fixture, updated inventory expectations in `tests/reviewedCreatureAssets.test.ts` and `tests/redrawnCreatures.test.ts`.

- [x] Capture approved frame/pixel hashes and a stable signature for all non-target registrations from the pre-import main commit.
- [x] Add regression assertions for counts/order, source hashes, rendered pixels including mirrored right, fixed scale/ground, front combat fallback and unchanged non-target signature.
- [x] Demonstrate the new regression fails on the old atlas and passes after import.
- [x] Update existing inventory totals and the superseded eldritch High Priest expectations using the actual importer output.

## Task 3: Verify and publish a reviewable integration

- [x] Run `npm run check:all` and `npm run build`.
- [x] Verify all imported target pixels against the delivery and all other registered frame pixels against the pre-import atlas.
- [x] Inspect the final diff and obtain a fresh independent integration review.
- [ ] Commit and push the scoped branch, open and attach a pull request, and inspect CI for that commit.
- [ ] Report the tested result and distinguish build/registration verification from unperformed real-time gameplay observation.
