# itch.io publishing copy

Target: [Seventy Steps](https://digitaldro.itch.io/seventy-steps).

Prepared on 17 October 2026. These files are ready to paste; they have **not** been published or applied to the live itch.io page. This session has no authenticated itch.io page editor. The build uploader (`tools/itch_push.mjs`) does not edit descriptions or create devlogs.

## Description insertion

Add [Updates and save games](itch/description-update.md) after the existing Windows/macOS installation advice and before the free-for-a-limited-time notice. Preserve the existing description, images, platform advice and sale text.

An [HTML fragment](itch/description-update.html) is also supplied for the description editor’s HTML/source mode. Paste only the fragment, without Markdown code fences. Save the page, then check the public description and its itch.io app link.

## Devlogs

1. Publish [Since launch: the Chariot, smoother combat, and a more vivid Dreamlands](devlogs/2026-10-17-since-launch.md) as the first catch-up update. Use the first line as its title and the rest as its body. Suggested type: **Major Update or Launch**. Date it when published; the post covers updates since launch rather than pretending each change had its own earlier devlog.
2. Publish [How to update Seventy Steps and keep your saves](devlogs/updating-and-saves.md) as a separate reference post. Suggested type: **Misc**. The description contains the essential instructions even if players do not open this post.

The files contain ordinary headings, paragraphs, lists and links. Use the editor’s formatting controls if Markdown is not converted on paste. Preview each post before publishing and verify the public post afterwards.

## Evidence and scope

- The public game page records launch on **15 October 2026 at 14:11 Europe/Berlin**. The catch-up excludes the prelaunch release-candidate feature list from `CHANGELOG.md`.
- Postlaunch changes were checked against commits after the launch baseline `a26e1ec`, PRs #104–#127, `docs/DECISIONS.md`, and the final implementation. The later mount review in `edbd163b9b8cd18d8bd7c1da5d6451fef46930be` was read through the public GitHub API; it is newer than this workspace’s starting checkout.
- [Release workflow 39031339974](https://github.com/DroDigital/Seventy_Steps/actions/runs/39031339974) built `edbd163` for itch on all three platforms, passed startup checks, and completed each “Push to itch.io” step on 17 October. The public itch page then reported an update matching that run. Raw upload logs could not be read, so this is corroborating release evidence rather than a per-channel build-ID audit.
- Earlier uploads repeated the `1.0.0-rc.1` label. The next release base is `1.0.1`; the corrected workflow gives each new itch build a label such as `1.0.1-build.42.1` before packaging. This change has not been uploaded in this session. [itch’s butler documentation](https://itch.io/docs/butler/pushing.html) explains that upload order determines updates independently of the visible label. Date the catch-up post, or name the exact label only after confirming it is live.
- Automatic updating is supported by the [official itch.io app page](https://itch.io/app). Browser downloads require manual replacement. Installing the app alone does not update a separately downloaded copy; the game must be installed through the app.
- Desktop storage uses `app.getPath('userData')/saves` (`desktop/main.js`), outside the installation folder. The app identity and storage path are stable, and supported older saves migrate through `src/systems/saveVersion.ts`. `tests/save.test.ts` and `tests/saveVersion.test.ts` cover loading, migration and backup recovery.
- No paid mount availability, Steam Cloud support, or cross-computer synchronization is promised. This PR adds native itch sub-product checkout and signed unlock imports for the spectral chariot and motor car, but they must not be advertised as available until the redemption service and live dashboard are configured; see [DLC setup](ITCH_DLC_SETUP.md). Reverted tooltip changes and the reverted general flying-creature change are excluded.
