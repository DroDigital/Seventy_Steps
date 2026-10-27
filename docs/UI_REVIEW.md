# The interface review

A review of every player-facing menu and screen, run in the game itself, and the few changes it justified. Everything that worked
was left alone. The mist (the menus' drifting violet mist and the title's violet edges) was not touched; the proof is below.

## What was reviewed, and how

- **References.** The brief names screenshots and a navigation recording. None came with it (the uploads held two 2–3 second
  gameplay clips and Codex's sprite files), so the baseline is the running game: `npm run dev`, Playwright's Chromium on a software
  renderer (a few frames a second while the world draws; the menus keep their own clocks), a fresh browser profile per run.
- **State.** Disposable `?fresh&debug` worlds, seeded through `window.game`: 3 quests under way and 3 done, 14 of 53 documents read,
  25 of 100 creatures beheld, 5 arms, 4 star-stones, 1,840 Echoes, 12 of 28 achievements; two seeded save slots for the title. No
  real save was read or written. Empty states (a fresh world) were captured as well.
- **Sizes and scale.** 960×540, 1024×768, 1280×720, 1920×1080; the UI scale setting at ×1 and ×1.5. English, German, French, Spanish.
- **Input.** Keyboard and mouse (real events). A pad was **simulated** through the Gamepad API's own shape (no physical controller
  was available). Touch is not supported by the game.
- **Evidence** (kept out of the repo: CLAUDE.md allows no picture files without the author's say): `ui_review_evidence.zip`, before
  and after stills of every changed screen, the two navigation recordings, the mist measurements, and the scripts.

## The inventory and its map

`createScreen` (ui/menuKit.ts) makes a screen; each is a page that can change. **Mist** says which look it stands on: *skin* is the
menus' canvas mist (ui/skins/mist.ts through ui/menuSkin.ts, only for a screen with the standard panel); *veil* is the title's violet
haunting (ui/veil.ts); *own* is a panel with its own look and no mist.

| Screen (source) | From → back | Mist | Seen in the game |
|---|---|---|---|
| Title gate, "press any key" (titleScreen.ts `gate`) | load → main | veil | not reached: the browser here allows sound at once (source only) |
| Title main (titleScreen.ts) | gate → | veil | yes, with and without saves |
| New game: slots; "Begin anew?" over a full one; "How deep do you sleep?" | main → main / slots | veil | yes |
| Load: slots | main → main | veil | yes |
| Settings, 5 tabs: display, sound, play, accessibility, controls (menuPages.ts) | title or pause → same | veil / skin | yes, every tab, four languages |
| Controls: rebind, capture, refused key, reset, Swap A/B | settings → settings | same | yes |
| Credits (credits.ts) | title, pause, ending → same | veil / skin / own | yes, start to end |
| Opening cards (intro.ts) | New game → world | skin | yes, first cards |
| Loading veil, place line (veil.ts, journeys.ts) | any journey | veil | yes (seen, not changed) |
| Pause (pauseMenu.ts) | Esc, Start → world | skin | yes |
| Map (mapScreen.ts) | M, pause → world | own (canvas) | yes (a first-hour map: little charted) |
| Journal: Under way (with Follow it on the map), Documents, Field Guide, Bestiary; a document; a hint; the bestiary list; an entry (journal.ts, fieldGuide.ts, bestiaryPage.ts, dialogue.ts) | pause, J → | skin | yes, empty and seeded |
| Arms (armsPage.ts) | pause → pause | skin | yes |
| Achievements (achievements.ts) | pause → pause | skin | yes, top and end, empty and seeded |
| Elder Sign menu: Grow, Arms (with Move reinforcement and its page), Relics (and a slot's page), Travel, a region's signs; the Court's two endings; the Sleeper's Sign (signMenu.ts) | rest at a sign → world | skin | yes, all (the descent button: its closed line only) |
| Merchants: Morgan, Curtis, Dyer (shopMenu.ts) | the talk's last line → world | skin | Morgan (rich, poor, a purchase) and Curtis; Dyer's list is Curtis's with oil |
| Talk (dialogue.ts) | a person → world | own (words on the world) | yes |
| Reading a tome or note in the world (dialogue.ts) | pick-up → world | own (the dark framed leaf) | yes |
| Where to rise (riseMenu.ts) | a fall near a candle | own (on the veil) | yes |
| Ending card: the words, afterwards, credits, the numbers, "Begin anew?" (endingCard.ts) | an ending | own | yes, all five pages |
| UNMADE and place banners (banner.ts) | a fall, a region | own | UNMADE yes; the place line not triggered |
| Cutscene bars and lines (cinemaUi.ts) | arrivals, falls | own | source only (cutscenes were turned off for the runs) |
| Crash screen (crashScreen.ts) | no WebGL, a lost context, a thrown frame | own | yes (WebGL off) |
| HUD: vitals, minimap, hints, notices, boss bar, nameplates, quest stars (hud.ts and its parts) | always | none | seen behind every menu; not reviewed screen by screen |
| Desktop only: Quit to desktop, native pads, Steam | pause, title | — | not reachable in a browser (source only) |
| Developer pages: `?debug` panel, F3 meter, `?bestiary`, `?look`, `?bench`, `?trailer` | URL | — | not player-facing; left alone |

Every screen above was found in source first and then opened in the game; none was found only in the game.

## What was changed

Each line: what was seen → what it did to the player → the fix → how it was checked.

1. **Controls › Swap A/B could never be used.** The button was built disabled (`button(…, false, hint)`, since round 45): it was dim,
   skipped by every key, and its setting could not be turned on. Fix: enabled. Checked by the keys (focus reaches it, a click turns it
   on and off, `padSwap` is kept 1 then 0) and by the simulated pad. *Turning it on then exposed a second fault:* the A that did it was
   still down and, read through the new exchange, was a B, so the menu went back one level at once (reproduced in the pad run before
   the fix: the page behind it appears). `pollPad` (menuKit.ts) now takes no edge from a held button in the frame the exchange
   changes. Checked: A on the control stays on it; the east button then acts as A and turns it off; B goes back; B resumes.
2. **Controls: the right-hand column was cut off at the panel's edge** at 1080p in English, and in French and Spanish the second
   KEY/PAD columns were lost (the 6-column grid kept labels on one line). Fix: the label columns give way and wrap
   (`minmax(0,1fr)`), the grid may stand 16 px into the panel's padding. Checked at 1280×720, 1920×1080, and in all four languages.
3. **Controls: Esc while a key is awaited left Settings altogether**, and the foot said nothing of what was awaited. Fix: Esc
   cancels the wait; a second goes back; the foot reads "Press the new key for “Move forward”. Esc cancels." (new line `ctl.waiting`,
   in all four languages). Checked by the keys.
4. **Credits: the roll was cut flat at both ends and its last line stood on the Back row** (title and ending credits). Fix: the
   roll's own edges fade (a mask on the roll, no change to its height or speed, so the panel and its mist are the same size).
   Smallest print raised from 32–40% to 50–55%. Checked at start, middle and end, at three sizes.
5. **Scrolling bodies cut a line in half and gave no sign there was more** (documents, bestiary, achievements, the Elder Sign's
   Grow, Arms and Travel at ×1.5 and at the Sleeper's Sign, "Done" quests under Journal › Under way, which sat entirely out of
   sight). Fix: a body with more beyond an edge fades toward that edge (`ui/scrollCue.ts`, one rule in the menus' style sheet;
   it follows the scroll). Checked on each of those pages; pages that fit show no fade.
6. **Elder Sign › Arms: a row's numbers wrapped, leaving a lone "m"** ("…whole to 3 → 4.5 / m"). Fix: the name, the step and the
   cost stay on the line; the numbers it will change stand on a smaller line beneath, as the title's Continue already does.
   A click on that line is a click on the row (menuKit.ts keeps the focus there). Checked at ×1 and ×1.5.
7. **Title › New game / Load: a saved slot wrapped with a "·" opening its second line.** Fix: the slot's name is the line and what
   it holds is its second line (widest: 420 px). `slotParts` (titleSlots.ts), tested for all four languages' wording.
8. **Ending card: the choice's lozenge stood on the first letter** of its button ("◆Go on"). Fix: for these boxed buttons the lozenge stands in the padding (3 px from the edge); the buttons keep their width, so the three of "Begin anew?" still make one row (a first fix that widened them wrapped the third onto a second row and was replaced).
9. **Faint text that carries something to read**, measured against the menus' ground (#0b0a09; the standard menus also sit under
   an 80–87% black backdrop, so a bright world behind adds little):

   | Text | Was | Now |
   |---|---|---|
   | Achievements, a locked one's note, 12 px | 35% · 2.3:1 | 50% · 3.6:1 |
   | …its name | 45% · 3.1:1 | 60% · 4.7:1 |
   | …an earned one's note | 60% | 70% |
   | Journal › Done quests | 40% · 2.7:1 | 55% · 4.1:1 |
   | Title: the keys line | 30% · 2.0:1 | 50% · 3.6:1 |
   | The foot's keys line; inactive tabs | 44% · 3.0:1 | 55% · 4.1:1 |
   | Controls: the fixed controls; the pad report | 40–45% | 55% |
   | Opening: "Esc · skip", "E · go on" | 40% · 2.7:1 | 55% · 4.1:1 |
   | Credits: the small print | 32–40% · 2.1–2.7:1 | 50–55% · 3.6–4.1:1 |

   Locked and unlocked entries stay distinct (the lozenge, the three levels); no screen was brightened as a whole.

## Reviewed and retained

- **The look.** Fonts, the spaced capitals, violet accents, lozenges, hairlines, the framed reading leaf, the cursor, the sounds.
  Hover on a tab only lights it; the open tab keeps its underline, and a hover never changes the page.
- **Navigation.** Resume, Map, Journal, Arms, Achievements | Settings, Credits | Quit to title (it saves first; no question is
  asked, and none was added). Back paths: a document opened from the Journal returns to Documents; an entry to the Bestiary.
- **Title.** "Begin anew?" defaults to "No, go back" (round 95: the page after it, "How deep do you sleep?", is gone with the three difficulties);
  the retained-endings line stands.
- **The dark framed reading leaf** (a tome picked up in the world), against the mist page a document has from the Journal: two
  interfaces, two looks, as designed. Documents are short (the longest 383 characters): none scrolls.
- **Shops.** Price, "n left", what is carried and its capacity, and "Not enough Echoes" / "Sold out" / "No room to carry it" on
  choosing a row it cannot take. (The reason shows when the row is chosen, not when it is focused: showing it earlier adds a line
  to the foot and moves the panel, so it was left.)
- **Settings** keep their promise (each change applies and is kept; no Apply); ranges and steps unchanged.
- **Map, HUD, banners, the crash screen:** read, no fault found. The map's help line is small (10 px) but 4.7:1.
- **Not changed, documented elsewhere:** the Elder Sign menu, journal, arms, shop, achievements, ending card and dialogue chrome stay
  English in other languages (docs/LOCALIZATION.md); a page's height differs 12 px between two settings tabs.

## The mist, and the animations

**What there is.** (1) The menus' mist, drawn on a canvas behind a standard panel (ui/skins/mist.ts, attached by
ui/menuSkin.ts): the pause menu and its pages, the Elder Sign menu, the shops, the opening. (2) The veil's violet haunting at the
title's edges (ui/veil.ts): the title, its slots, settings and credits. (3) The world's fog (render/volumetricFog.ts) is the
game's, not the interface's.

**What was not touched.** The diff against the branch's base (`origin/main`) has no line in `src/ui/skins/`, `ui/menuSkin.ts`, `ui/veil.ts`, `ui/cursor.ts`,
`ui/logo*.ts`, `ui/ashCard.ts`, `ui/ashFx.ts`, `ui/journeys.ts`, `ui/loading.ts`; nor in `bring`, `leave`, the closing fade or any
duration in `menuKit.ts`. Panel sizes are what the mist follows, and none of the measured pages changed size.

**Measured.** With `?debug`, a skin can be drawn still at a chosen moment (`window.skins[i].seek(ms)`). For eleven pages (pause,
journal ×2, arms, achievements, settings ×5, credits) the canvas was read back at 0, 0.7, 1.3, 2.6 and 9 s after opening, the
surge of a page change first allowed to fall, and hashed (SHA-256 of every pixel): **55 of 55 identical** between the unmodified code
and the changed code, at the same panel size on every page. (A first attempt without letting the surge fall differed on
re-measuring *the same code*; that was the measurement, not the mist.) The veil moves with the clock and cannot be seeked: its code,
its calls and the title's wiring around it are unchanged, and the stills of the title show the same framing before and after.

**Animations.** Page, tab and closing transitions, the cursor, the credits' speed (22 px/s), the intro's cards: no duration, easing
or sequence was edited. What is new is static (a mask on a scrolling body and on the credits roll, a smaller line in a row).
Two recordings of the same walk (pause → journal tabs → arms → achievements → settings tabs → credits → resume), before and after,
are in the evidence zip.

## Verified, and how

- **Build and tests.** `npm run check` (typecheck and the everyday Vitest set): 195 test files and 1,974 tests pass (five of them new). `npm run build`: builds clean (`tsc` and Vite, 468 modules).
  New tests: `tests/menuParts.test.ts` (the scroll cue's rule; a slot's two parts in every language; the `title.slot` line keeps its
  one separator in all four).
- **In the game** (keys and mouse): every screen in the table, every tab, the back path of each, the rebind states, the swap, the
  scroll cue, the slot lines, the credits' ends, empty and seeded lists, four sizes, ×1 and ×1.5, four languages. After each fix the
  page was drawn again and compared with its baseline.
- **Simulated pad** (Start, D-pad, A, B, LB/RB through a fake standard pad in the combat arena): Start opens the pause menu, the
  D-pad moves the focus, A chooses, RB and LB change the tabs, the Swap control works as above, B goes back and then resumes.
- **Not done, and why.** A physical pad, or a pad's real timing. The gate page (the browser here lets the theme sound at once).
  The desktop shell's pages and Steam. Cutscene bars. A fully populated late game (all 53 documents, all 100 creatures; the lists
  were seeded with a quarter). Fonts and scripts beyond Latin. A pixel comparison of the veil (time-driven; compared by code).

## Disposition of the inventory

Refined and checked in the game: Settings (all tabs), Controls, Credits (title, pause, ending), Pause pages that scroll
(Journal › Under way and Documents, Bestiary, Achievements), Elder Sign menu (Grow, Arms, Travel, Sleeper's Sign, Court), Title
slots (New game, Load), Ending card, Opening cards' hints.

Reviewed, retained, and checked in the game: Title main, Begin anew, Pause main, Map, Arms, Bestiary entry, a document
(Journal and world), merchants, talk, where to rise, UNMADE, crash screen, loading veil.

Reviewed in source, not opened: the title gate, the place banner, cutscene bars, the desktop shell's pages.

Not player-facing, left alone: the developer pages.

## Round 52: numbers in menus

The Elder Sign's tabs (Level up, Weapons, Relics, Travel, Mounts), a relic's slot page, the merchant's wares and the pause menu's Arms page say their
numbers one way (`ui/menuChips.ts`; decision in docs/DECISIONS.md, "Menus, round 52"): the figure a row would change under its name (green when it favours
the investigator, red when it costs them), its price boxed at the right (bright when it can be paid, red when it cannot, "MAX" when there is no more),
and what is carried above, in a strip with the figure the tab spends lit. Checked in a browser (960×540, before and after kept in the session's
scratchpad): every tab, the relic page, a poor investigator (all prices red, one star-stone), the merchant at 3000 Echoes (one price red, one
"left"), and Arms with two relics worn. Not changed: the pause, rise, settings, journal and map pages, which already said little.
