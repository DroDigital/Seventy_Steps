# The balance table

Written by `tests/balance.test.ts` (`BALANCE_WRITE=1 npm run audit`; round 25, playtest note 8). A bot fights each scripted boss
in the arena at the standing a person has when they reach it (`tests/balanceModel.ts`). Round 60: the world is open, so
the bosses are met ring by ring as it opens about the start (the university; Arkham; the waking world beyond it; the realms down
the stair and through its gates; Beyond the Gate). In each ring its lesser foes give 60% of their Echoes in step with its named
horrors and colossi, met the weak first, each slain giving most of its own; its gods may be met in any order, so each is met
halfway through its ring with no god's Echoes in hand. The Echoes are spent on levels as a person builds (Vigour and Might most,
Endurance less), and the star-stones the bosses leave are set into the sword-cane. The bot closes to the edge of the body and
strikes when it can retain enough stamina for a roll, selects 55% of telegraphed blows for a dodge attempt, strikes down a servant or a phantom at
its elbow, takes the Alert's helm, keeps behind a monolith from a gaze that turns flesh to stone, and (round 58) drinks Laudanum
when the HUD calls for it, as a person is told to. It cannot be killed, and what it took is the tally. Each fight is the mean of
three, from 7, 10, 13 metres off (a bot's path through a fight is chaos), and a colossus is fought with the arena's middle pillars,
low walls and training dummy set aside: a body that wide finds no place to stand among them, as its own arena in the world has
nothing in its way.

- On the first journey bosses keep their authored maximum health at every level. Boss health rises on later journeys, capped at NG+7; it does not scale with player level. On the first journey their damage gains 0.3% per purchased player level. **Boss health** is the maximum in that run.
- **Seconds** is how long the boss took with this bot's choices; actual players' fight times will differ.
- **Lives** is the damage taken against the health a person has there and the Reagent they carry there (4 doses of 40% at the start, a vial more as the horrors fall, to 10):
  1 is the equivalent of all of it. A selected dodge can fail to start or avoid damage, and a value above 1 exceeds the carried healing
  in this simulation; these raw costs are never divided by the scaling factors.
- Ghatanothoa is fought with the gaze waived (its seconds scaled by the half of a fight in its sight), Shub-Niggurath with
  its roots down (forty seconds more, to cut them), and the Great Ones and 'Umr at-Tawil with the void under their hidden
  platforms shut (a person with insight keeps to the platforms): the bot plays those badly. The Haunter of the Dark is not held
  to the bounds: it is hurt only by lamplight (a person lures it to a lamp). Azathoth is held to bounds of its own and must cost the bot more than
  any other horror (2026-10-29): its blows are rhythms over the whole court, which the bot reads badly, and its fight is the hardest there is.
- Dagon and Hydra share one encounter. Their individual rows are supplemental; `tests/seaBosses.test.ts` also checks both together at the expected standing, including combined time and damage against one healing inventory. Solo pressure floors are lower for these two members, while their upper limits remain in force.


| # | Boss | Vig/End/Might | Cane + | Boss health | Seconds | Taken | Our health | Doses | Lives | Deaths |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Dr. Muñoz | 1/0/1 | 0 | 900 | 65 | 388 | 176 | 4 | 0.85 | 0 |
| 2 | Charles le Sorcier | 3/1/2 | 1 | 1049 | 64 | 535 | 208 | 4 | 0.99 | 0 |
| 3 | The Outsider | 4/2/3 | 2 | 1425 | 51 | 317 | 224 | 4 | 0.54 | 0 |
| 4 | Brown Jenkin | 5/2/4 | 2 | 1050 | 118 | 650 | 240 | 4 | 1.04 | 0 |
| 5 | Ephraim Waite | 5/2/5 | 3 | 1200 | 40 | 432 | 240 | 5 | 0.60 | 0 |
| 6 | The Hound | 6/2/5 | 3 | 2175 | 79 | 690 | 256 | 5 | 0.90 | 0 |
| 7 | Keziah Mason | 6/3/5 | 4 | 2400 | 63 | 673 | 256 | 5 | 0.88 | 0 |
| 8 | The Unnamable | 6/3/6 | 4 | 3000 | 73 | 564 | 256 | 5 | 0.73 | 0 |
| 9 | The Colour Out of Space | 7/3/6 | 4 | 3600 | 135 | 1098 | 272 | 6 | 1.19 | 0 |
| 10 | The Black Man | 7/3/7 | 5 | 4050 | 133 | 842 | 272 | 6 | 0.91 | 0 |
| 11 | The Haunter of the Dark | 8/4/7 | 5 | 1575 | 305 | 3123 | 288 | 6 | 3.19 | 0 |
| 12 | Wilbur Whateley | 9/4/8 | 5 | 2325 | 57 | 592 | 304 | 7 | 0.51 | 0 |
| 13 | The Gorgon of Medusa's Coil | 9/4/9 | 5 | 2400 | 77 | 827 | 304 | 7 | 0.72 | 0 |
| 14 | The Whisperer in Akeley's Chair | 10/4/9 | 5 | 2400 | 58 | 575 | 320 | 7 | 0.47 | 0 |
| 15 | Edward Hutchinson | 10/5/10 | 5 | 2550 | 67 | 829 | 320 | 7 | 0.68 | 0 |
| 16 | Simon Orne | 11/5/10 | 5 | 2550 | 80 | 985 | 336 | 8 | 0.70 | 0 |
| 17 | The Horror at Martin's Beach | 11/5/11 | 5 | 2775 | 49 | 490 | 336 | 8 | 0.35 | 0 |
| 18 | The Terrible Old Man | 12/5/11 | 5 | 2775 | 75 | 786 | 352 | 8 | 0.53 | 0 |
| 19 | Lilith | 12/5/11 | 5 | 2850 | 72 | 968 | 352 | 8 | 0.65 | 0 |
| 20 | The Shunned House Entity | 12/6/11 | 5 | 2925 | 55 | 1084 | 352 | 9 | 0.67 | 0 |
| 21 | Joseph Curwen | 12/6/12 | 5 | 3300 | 67 | 790 | 352 | 9 | 0.49 | 0 |
| 22 | The Dunwich Horror | 13/6/12 | 5 | 4425 | 102 | 1847 | 368 | 9 | 1.09 | 0 |
| 23 | Mother Hydra | 11/5/11 | 5 | 3675 | 74 | 1276 | 336 | 10 | 0.76 | 0 |
| 24 | Father Dagon | 11/5/11 | 5 | 3825 | 79 | 742 | 336 | 10 | 0.44 | 0 |
| 25 | Hypnos | 14/7/13 | 5 | 2850 | 78 | 807 | 384 | 10 | 0.42 | 0 |
| 26 | High Priest Not to Be Described | 16/7/15 | 5 | 3900 | 59 | 448 | 416 | 10 | 0.22 | 0 |
| 27 | The Colossus Beneath the Pyramids | 17/8/16 | 5 | 5925 | 116 | 2770 | 432 | 10 | 1.28 | 0 |
| 28 | Bokrug | 16/7/15 | 5 | 5625 | 126 | 1761 | 416 | 10 | 0.85 | 0 |
| 29 | Nug | 16/7/15 | 5 | 5625 | 99 | 1888 | 416 | 10 | 0.91 | 0 |
| 30 | Rhan-Tegoth | 16/7/15 | 5 | 5625 | 112 | 2299 | 416 | 10 | 1.11 | 0 |
| 31 | Yeb | 16/7/15 | 5 | 5625 | 102 | 2272 | 416 | 10 | 1.09 | 0 |
| 32 | The Great Ones | 16/7/15 | 5 | 6450 | 117 | 2083 | 416 | 10 | 1.00 | 0 |
| 33 | Yig | 16/7/15 | 5 | 6450 | 111 | 2947 | 416 | 10 | 1.42 | 0 |
| 34 | Tsathoggua | 16/7/15 | 5 | 6525 | 164 | 3367 | 416 | 10 | 1.62 | 0 |
| 35 | Ghatanothoa | 16/7/15 | 5 | 7275 | 327 | 2986 | 416 | 10 | 1.44 | 0 |
| 36 | Hastur | 16/7/15 | 5 | 7650 | 199 | 2044 | 416 | 10 | 0.98 | 0 |
| 37 | Cthulhu | 16/7/15 | 5 | 8025 | 185 | 3402 | 416 | 10 | 1.64 | 0 |
| 38 | The Thing Beyond Erich Zann's Window | 18/8/17 | 5 | 3900 | 55 | 613 | 448 | 10 | 0.27 | 0 |
| 39 | Zkauba the Wizard | 18/9/18 | 5 | 4275 | 140 | 2013 | 448 | 10 | 0.90 | 0 |
| 40 | The Other Gods | 18/9/17 | 5 | 5550 | 89 | 1558 | 448 | 10 | 0.70 | 0 |
| 41 | 'Umr at-Tawil | 18/9/17 | 5 | 5700 | 86 | 620 | 448 | 10 | 0.28 | 0 |
| 42 | The Daemon Pipers | 18/9/17 | 5 | 5850 | 160 | 3189 | 448 | 10 | 1.42 | 0 |
| 43 | The Ancient Ones | 18/9/17 | 5 | 6075 | 80 | 982 | 448 | 10 | 0.44 | 0 |
| 44 | Nyarlathotep | 18/9/17 | 5 | 7725 | 356 | 4389 | 448 | 10 | 1.96 | 0 |
| 45 | Shub-Niggurath | 18/9/17 | 5 | 8175 | 265 | 3760 | 448 | 10 | 1.68 | 0 |
| 46 | Yog-Sothoth | 18/9/17 | 5 | 9150 | 376 | 4403 | 448 | 10 | 1.97 | 0 |
| 47 | Azathoth | 18/9/17 | 5 | 10050 | 282 | 6666 | 448 | 10 | 2.98 | 0 |

Bounds held by the test: each boss finishes within 6 to 800 seconds, and costs at most 3 lives (a colossus, 6; a Great Old One or an Outer God, 3.4), and the bot does not die, subject to the named pressure exceptions below.
Each tier has its band: a named horror takes 14 to 200 seconds and costs 0.2 to 2.4 lives (the Colour may cost up to 1.5); one of the 17 great fights takes 35 to 340 seconds and costs 0.45 to 3.4 lives. Named exceptions are colossus pyramids 14–240 seconds; daemon pipers 14–280 seconds 0.2–2.6 lives; zkauba 14–280 seconds; mother hydra 0.2–1.5 lives; father dagon 0.2–1.5 lives; ghatanothoa 35–580 seconds; nyarlathotep 35–740 seconds 0.45–4.5 lives; azathoth 90–580 seconds 1.7–6.4 lives; shub niggurath 35–440 seconds; yog sothoth 35–700 seconds 0.45–3.8 lives; umr at tawil 0.25–1.5 lives; colour out of space 14–170 seconds. Yog-Sothoth is additionally capped at 3.8 lives at its expected standing.

## At the cap

The same bot, from 9 starts (6 to 14 metres off), with every level bought (30 Vigour, 30 Endurance, 30 Might, which give 640 health, 340 stamina and blows of 2.20) and the cane at +5. Boss health remains at its authored value; their blows still grow with levels and with Vigour beyond their expected standing (`overmatch` in `systems/bossScaling.ts`). These fights can become shorter as the investigator grows. Dagon and Hydra's combined encounter is additionally bounded in `tests/seaBosses.test.ts`.

| # | Boss | Vig/End/Might | Cane + | Boss health | Seconds | Taken | Our health | Doses | Lives | Deaths |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Dr. Muñoz | 30/30/30 | 5 | 900 | 8 | 152 | 640 | 4 | 0.09 | 0 |
| 2 | Charles le Sorcier | 30/30/30 | 5 | 1049 | 8 | 212 | 640 | 4 | 0.13 | 0 |
| 3 | The Outsider | 30/30/30 | 5 | 1425 | 10 | 117 | 640 | 4 | 0.07 | 0 |
| 4 | Brown Jenkin | 30/30/30 | 5 | 1050 | 10 | 136 | 640 | 4 | 0.08 | 0 |
| 5 | Ephraim Waite | 30/30/30 | 5 | 1200 | 11 | 224 | 640 | 5 | 0.12 | 0 |
| 6 | The Hound | 30/30/30 | 5 | 2175 | 12 | 249 | 640 | 5 | 0.13 | 0 |
| 7 | Keziah Mason | 30/30/30 | 5 | 2400 | 15 | 280 | 640 | 5 | 0.15 | 0 |
| 8 | The Unnamable | 30/30/30 | 5 | 3000 | 17 | 321 | 640 | 5 | 0.17 | 0 |
| 9 | The Colour Out of Space | 30/30/30 | 5 | 3600 | 35 | 458 | 640 | 6 | 0.21 | 0 |
| 10 | The Black Man | 30/30/30 | 5 | 4050 | 33 | 413 | 640 | 6 | 0.19 | 0 |
| 11 | The Haunter of the Dark | 30/30/30 | 5 | 1575 | 153 | 2891 | 640 | 6 | 1.33 | 0 |
| 12 | Wilbur Whateley | 30/30/30 | 5 | 2325 | 16 | 355 | 640 | 7 | 0.15 | 0 |
| 13 | The Gorgon of Medusa's Coil | 30/30/30 | 5 | 2400 | 23 | 396 | 640 | 7 | 0.16 | 0 |
| 14 | The Whisperer in Akeley's Chair | 30/30/30 | 5 | 2400 | 20 | 332 | 640 | 7 | 0.14 | 0 |
| 15 | Edward Hutchinson | 30/30/30 | 5 | 2550 | 21 | 489 | 640 | 7 | 0.20 | 0 |
| 16 | Simon Orne | 30/30/30 | 5 | 2550 | 24 | 604 | 640 | 8 | 0.22 | 0 |
| 17 | The Horror at Martin's Beach | 30/30/30 | 5 | 2775 | 21 | 236 | 640 | 8 | 0.09 | 0 |
| 18 | The Terrible Old Man | 30/30/30 | 5 | 2775 | 28 | 483 | 640 | 8 | 0.18 | 0 |
| 19 | Lilith | 30/30/30 | 5 | 2850 | 29 | 741 | 640 | 8 | 0.28 | 0 |
| 20 | The Shunned House Entity | 30/30/30 | 5 | 2925 | 19 | 753 | 640 | 9 | 0.26 | 0 |
| 21 | Joseph Curwen | 30/30/30 | 5 | 3300 | 26 | 370 | 640 | 9 | 0.13 | 0 |
| 22 | The Dunwich Horror | 30/30/30 | 5 | 4425 | 35 | 1047 | 640 | 9 | 0.36 | 0 |
| 23 | Mother Hydra | 30/30/30 | 5 | 3675 | 24 | 701 | 640 | 10 | 0.22 | 0 |
| 24 | Father Dagon | 30/30/30 | 5 | 3825 | 26 | 630 | 640 | 10 | 0.20 | 0 |
| 25 | Hypnos | 30/30/30 | 5 | 2850 | 29 | 561 | 640 | 10 | 0.18 | 0 |
| 26 | High Priest Not to Be Described | 30/30/30 | 5 | 3900 | 26 | 223 | 640 | 10 | 0.07 | 0 |
| 27 | The Colossus Beneath the Pyramids | 30/30/30 | 5 | 5925 | 55 | 1297 | 640 | 10 | 0.41 | 0 |
| 28 | Bokrug | 30/30/30 | 5 | 5625 | 60 | 1496 | 640 | 10 | 0.47 | 0 |
| 29 | Nug | 30/30/30 | 5 | 5625 | 47 | 1372 | 640 | 10 | 0.43 | 0 |
| 30 | Rhan-Tegoth | 30/30/30 | 5 | 5625 | 53 | 1397 | 640 | 10 | 0.44 | 0 |
| 31 | Yeb | 30/30/30 | 5 | 5625 | 50 | 1408 | 640 | 10 | 0.44 | 0 |
| 32 | The Great Ones | 30/30/30 | 5 | 6450 | 58 | 1620 | 640 | 10 | 0.51 | 0 |
| 33 | Yig | 30/30/30 | 5 | 6450 | 63 | 2180 | 640 | 10 | 0.68 | 0 |
| 34 | Tsathoggua | 30/30/30 | 5 | 6525 | 68 | 1747 | 640 | 10 | 0.55 | 0 |
| 35 | Ghatanothoa | 30/30/30 | 5 | 7275 | 99 | 1146 | 640 | 10 | 0.36 | 0 |
| 36 | Hastur | 30/30/30 | 5 | 7650 | 60 | 1023 | 640 | 10 | 0.32 | 0 |
| 37 | Cthulhu | 30/30/30 | 5 | 8025 | 98 | 2929 | 640 | 10 | 0.92 | 0 |
| 38 | The Thing Beyond Erich Zann's Window | 30/30/30 | 5 | 3900 | 26 | 293 | 640 | 10 | 0.09 | 0 |
| 39 | Zkauba the Wizard | 30/30/30 | 5 | 4275 | 41 | 951 | 640 | 10 | 0.30 | 0 |
| 40 | The Other Gods | 30/30/30 | 5 | 5550 | 50 | 1362 | 640 | 10 | 0.43 | 0 |
| 41 | 'Umr at-Tawil | 30/30/30 | 5 | 5700 | 67 | 941 | 640 | 10 | 0.29 | 0 |
| 42 | The Daemon Pipers | 30/30/30 | 5 | 5850 | 48 | 1576 | 640 | 10 | 0.49 | 0 |
| 43 | The Ancient Ones | 30/30/30 | 5 | 6075 | 46 | 578 | 640 | 10 | 0.18 | 0 |
| 44 | Nyarlathotep | 30/30/30 | 5 | 7725 | 120 | 1455 | 640 | 10 | 0.45 | 0 |
| 45 | Shub-Niggurath | 30/30/30 | 5 | 8175 | 128 | 1831 | 640 | 10 | 0.57 | 0 |
| 46 | Yog-Sothoth | 30/30/30 | 5 | 9150 | 94 | 993 | 640 | 10 | 0.31 | 0 |
| 47 | Azathoth | 30/30/30 | 5 | 10050 | 125 | 3253 | 640 | 10 | 1.02 | 0 |

## The opening

The same bot against the horrors of the first hours (the hub about the first Elder Sign, and Arkham), at the standing a new
player has there: only those two realms' lesser foes (60% of them, in step) and their own bosses before it have
given Echoes and star-stones. Each may cost at most 1.5 lives; the Colour is capped at 1.3 lives.

| # | Boss | Vig/End/Might | Cane + | Boss health | Seconds | Taken | Our health | Doses | Lives | Deaths |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Dr. Muñoz | 1/0/1 | 0 | 900 | 65 | 388 | 176 | 4 | 0.85 | 0 |
| 2 | Charles le Sorcier | 3/1/2 | 1 | 1049 | 64 | 535 | 208 | 4 | 0.99 | 0 |
| 3 | The Outsider | 4/2/3 | 2 | 1425 | 51 | 317 | 224 | 4 | 0.54 | 0 |
| 4 | Brown Jenkin | 5/2/4 | 2 | 1050 | 118 | 650 | 240 | 4 | 1.04 | 0 |
| 5 | Ephraim Waite | 5/2/5 | 3 | 1200 | 40 | 432 | 240 | 5 | 0.60 | 0 |
| 6 | The Hound | 6/2/5 | 3 | 2175 | 79 | 690 | 256 | 5 | 0.90 | 0 |
| 7 | Keziah Mason | 6/3/5 | 4 | 2400 | 63 | 673 | 256 | 5 | 0.88 | 0 |
| 8 | The Unnamable | 6/3/6 | 4 | 3000 | 73 | 564 | 256 | 5 | 0.73 | 0 |
| 9 | The Colour Out of Space | 7/3/6 | 4 | 3600 | 135 | 1098 | 272 | 6 | 1.19 | 0 |
| 10 | The Black Man | 7/3/7 | 5 | 4050 | 133 | 842 | 272 | 6 | 0.91 | 0 |
