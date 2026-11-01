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
  to the bounds: it is hurt only by lamplight (a person lures it to a lamp). Azathoth is also exempt from the bot's time and pressure bounds:
  its increased health is deliberate and is checked through combat tests instead.
- Dagon and Hydra share one encounter. Their individual rows are supplemental; `tests/seaBosses.test.ts` also checks both together at the expected standing, including combined time and damage against one healing inventory. Solo pressure floors are lower for these two members, while their upper limits remain in force.


| # | Boss | Vig/End/Might | Cane + | Boss health | Seconds | Taken | Our health | Doses | Lives | Deaths |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Dr. Muñoz | 1/0/1 | 0 | 600 | 39 | 263 | 176 | 4 | 0.58 | 0 |
| 2 | Charles le Sorcier | 3/1/2 | 1 | 699 | 39 | 304 | 208 | 4 | 0.56 | 0 |
| 3 | The Outsider | 4/2/3 | 2 | 950 | 31 | 270 | 224 | 4 | 0.46 | 0 |
| 4 | Brown Jenkin | 5/2/4 | 2 | 700 | 71 | 407 | 240 | 4 | 0.65 | 0 |
| 5 | Ephraim Waite | 5/2/5 | 3 | 800 | 25 | 370 | 240 | 5 | 0.51 | 0 |
| 6 | The Hound | 6/2/5 | 3 | 1450 | 51 | 384 | 256 | 5 | 0.50 | 0 |
| 7 | Keziah Mason | 6/3/5 | 4 | 1600 | 41 | 474 | 256 | 5 | 0.62 | 0 |
| 8 | The Unnamable | 6/3/6 | 4 | 2000 | 46 | 427 | 256 | 5 | 0.56 | 0 |
| 9 | The Colour Out of Space | 7/3/6 | 4 | 2400 | 104 | 838 | 272 | 6 | 0.91 | 0 |
| 10 | The Black Man | 7/3/7 | 5 | 2700 | 59 | 168 | 272 | 6 | 0.18 | 0 |
| 11 | The Haunter of the Dark | 8/4/7 | 5 | 1050 | 213 | 1997 | 288 | 6 | 2.04 | 0 |
| 12 | Wilbur Whateley | 9/4/8 | 5 | 1550 | 31 | 371 | 304 | 7 | 0.32 | 0 |
| 13 | The Gorgon of Medusa's Coil | 9/4/9 | 5 | 1600 | 46 | 504 | 304 | 7 | 0.44 | 0 |
| 14 | The Whisperer in Akeley's Chair | 10/4/9 | 5 | 1600 | 33 | 283 | 320 | 7 | 0.23 | 0 |
| 15 | Edward Hutchinson | 10/5/10 | 5 | 1700 | 41 | 501 | 320 | 7 | 0.41 | 0 |
| 16 | Simon Orne | 11/5/10 | 5 | 1700 | 43 | 625 | 336 | 8 | 0.44 | 0 |
| 17 | The Horror at Martin's Beach | 11/5/11 | 5 | 1850 | 35 | 218 | 336 | 8 | 0.15 | 0 |
| 18 | The Terrible Old Man | 12/5/11 | 5 | 1850 | 52 | 582 | 352 | 8 | 0.39 | 0 |
| 19 | Lilith | 12/5/11 | 5 | 1900 | 46 | 662 | 352 | 8 | 0.45 | 0 |
| 20 | The Shunned House Entity | 12/6/11 | 5 | 1950 | 36 | 730 | 352 | 9 | 0.45 | 0 |
| 21 | Joseph Curwen | 12/6/12 | 5 | 2200 | 43 | 522 | 352 | 9 | 0.32 | 0 |
| 22 | The Dunwich Horror | 13/6/12 | 5 | 2950 | 62 | 1149 | 368 | 9 | 0.68 | 0 |
| 23 | Mother Hydra | 11/5/11 | 5 | 2450 | 49 | 769 | 336 | 10 | 0.46 | 0 |
| 24 | Father Dagon | 11/5/11 | 5 | 2550 | 50 | 522 | 336 | 10 | 0.31 | 0 |
| 25 | Hypnos | 14/7/13 | 5 | 1900 | 50 | 533 | 384 | 10 | 0.28 | 0 |
| 26 | High Priest Not to Be Described | 16/7/15 | 5 | 2600 | 43 | 267 | 416 | 10 | 0.13 | 0 |
| 27 | The Colossus Beneath the Pyramids | 17/8/16 | 5 | 3950 | 63 | 1052 | 432 | 10 | 0.49 | 0 |
| 28 | Bokrug | 16/7/15 | 5 | 3750 | 82 | 1261 | 416 | 10 | 0.61 | 0 |
| 29 | Nug | 16/7/15 | 5 | 3750 | 59 | 1053 | 416 | 10 | 0.51 | 0 |
| 30 | Rhan-Tegoth | 16/7/15 | 5 | 3750 | 66 | 1340 | 416 | 10 | 0.64 | 0 |
| 31 | Yeb | 16/7/15 | 5 | 3750 | 62 | 1497 | 416 | 10 | 0.72 | 0 |
| 32 | The Great Ones | 16/7/15 | 5 | 4300 | 79 | 1495 | 416 | 10 | 0.72 | 0 |
| 33 | Yig | 16/7/15 | 5 | 4300 | 74 | 1585 | 416 | 10 | 0.76 | 0 |
| 34 | Tsathoggua | 16/7/15 | 5 | 4350 | 105 | 1891 | 416 | 10 | 0.91 | 0 |
| 35 | Ghatanothoa | 16/7/15 | 5 | 4850 | 129 | 1057 | 416 | 10 | 0.51 | 0 |
| 36 | Hastur | 16/7/15 | 5 | 5100 | 81 | 752 | 416 | 10 | 0.36 | 0 |
| 37 | Cthulhu | 16/7/15 | 5 | 5350 | 75 | 1218 | 416 | 10 | 0.59 | 0 |
| 38 | The Thing Beyond Erich Zann's Window | 18/8/17 | 5 | 2600 | 32 | 249 | 448 | 10 | 0.11 | 0 |
| 39 | Zkauba the Wizard | 18/9/18 | 5 | 2850 | 65 | 1029 | 448 | 10 | 0.46 | 0 |
| 40 | The Other Gods | 18/9/17 | 5 | 3700 | 46 | 842 | 448 | 10 | 0.38 | 0 |
| 41 | 'Umr at-Tawil | 18/9/17 | 5 | 3800 | 65 | 585 | 448 | 10 | 0.26 | 0 |
| 42 | The Daemon Pipers | 18/9/17 | 5 | 3900 | 72 | 1401 | 448 | 10 | 0.63 | 0 |
| 43 | The Ancient Ones | 18/9/17 | 5 | 4050 | 55 | 309 | 448 | 10 | 0.14 | 0 |
| 44 | Nyarlathotep | 18/9/17 | 5 | 5150 | 218 | 2318 | 448 | 10 | 1.03 | 0 |
| 45 | Shub-Niggurath | 18/9/17 | 5 | 5450 | 136 | 1247 | 448 | 10 | 0.56 | 0 |
| 46 | Yog-Sothoth | 18/9/17 | 5 | 6100 | 255 | 3450 | 448 | 10 | 1.54 | 0 |
| 47 | Azathoth | 18/9/17 | 5 | 15075 | 501 | 11178 | 448 | 10 | 4.99 | 0 |

Bounds held by the test: each non-exempt boss finishes within 6 to 450 seconds, and costs at most 3 lives (a colossus, 6; a Great Old One or an Outer God, 1.5), and the bot does not die, subject to the named pressure exceptions below.
Each tier has its band: a named horror takes 14 to 90 seconds and costs 0.2 to 1.2 lives (the Colour may cost up to 1.5); one of the 17 great fights takes 35 to 170 seconds and costs 0.45 to 1.5 lives. Named exceptions are brown jenkin 14–120 seconds; colossus pyramids 14–110 seconds; daemon pipers 14–145 seconds 0.2–1.6 lives; zkauba 14–130 seconds; mother hydra 0.2–1.5 lives; father dagon 0.2–1.5 lives; ghatanothoa 35–280 seconds; nyarlathotep 35–430 seconds 0.45–3 lives; shub niggurath 35–250 seconds; yog sothoth 35–400 seconds 0.45–2.5 lives; umr at tawil 0.25–1.5 lives; colour out of space 14–135 seconds; black man 0.1–1.2 lives; martins beach horror 0.1–1.2 lives; high priest 0.1–1.2 lives; zann window thing 0.1–1.2 lives; ancient ones 0.1–1.2 lives; hastur 0.3–1.5 lives. Yog-Sothoth is additionally capped at 2.5 lives at its expected standing.

## At the cap

The same bot, from 9 starts (6 to 14 metres off), with every level bought (30 Vigour, 30 Endurance, 30 Might, which give 640 health, 340 stamina and blows of 2.20) and the cane at +5. Boss health remains at its authored value; their blows still grow with levels and with Vigour beyond their expected standing (`overmatch` in `systems/bossScaling.ts`). These fights can become shorter as the investigator grows. Dagon and Hydra's combined encounter is additionally bounded in `tests/seaBosses.test.ts`.

| # | Boss | Vig/End/Might | Cane + | Boss health | Seconds | Taken | Our health | Doses | Lives | Deaths |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Dr. Muñoz | 30/30/30 | 5 | 600 | 6 | 124 | 640 | 4 | 0.07 | 0 |
| 2 | Charles le Sorcier | 30/30/30 | 5 | 699 | 6 | 181 | 640 | 4 | 0.11 | 0 |
| 3 | The Outsider | 30/30/30 | 5 | 950 | 7 | 32 | 640 | 4 | 0.02 | 0 |
| 4 | Brown Jenkin | 30/30/30 | 5 | 700 | 8 | 122 | 640 | 4 | 0.07 | 0 |
| 5 | Ephraim Waite | 30/30/30 | 5 | 800 | 8 | 98 | 640 | 5 | 0.05 | 0 |
| 6 | The Hound | 30/30/30 | 5 | 1450 | 8 | 165 | 640 | 5 | 0.09 | 0 |
| 7 | Keziah Mason | 30/30/30 | 5 | 1600 | 10 | 185 | 640 | 5 | 0.10 | 0 |
| 8 | The Unnamable | 30/30/30 | 5 | 2000 | 10 | 171 | 640 | 5 | 0.09 | 0 |
| 9 | The Colour Out of Space | 30/30/30 | 5 | 2400 | 16 | 286 | 640 | 6 | 0.13 | 0 |
| 10 | The Black Man | 30/30/30 | 5 | 2700 | 20 | 178 | 640 | 6 | 0.08 | 0 |
| 11 | The Haunter of the Dark | 30/30/30 | 5 | 1050 | 87 | 1501 | 640 | 6 | 0.69 | 0 |
| 12 | Wilbur Whateley | 30/30/30 | 5 | 1550 | 11 | 195 | 640 | 7 | 0.08 | 0 |
| 13 | The Gorgon of Medusa's Coil | 30/30/30 | 5 | 1600 | 13 | 192 | 640 | 7 | 0.08 | 0 |
| 14 | The Whisperer in Akeley's Chair | 30/30/30 | 5 | 1600 | 12 | 142 | 640 | 7 | 0.06 | 0 |
| 15 | Edward Hutchinson | 30/30/30 | 5 | 1700 | 14 | 330 | 640 | 7 | 0.14 | 0 |
| 16 | Simon Orne | 30/30/30 | 5 | 1700 | 15 | 394 | 640 | 8 | 0.15 | 0 |
| 17 | The Horror at Martin's Beach | 30/30/30 | 5 | 1850 | 14 | 139 | 640 | 8 | 0.05 | 0 |
| 18 | The Terrible Old Man | 30/30/30 | 5 | 1850 | 15 | 266 | 640 | 8 | 0.10 | 0 |
| 19 | Lilith | 30/30/30 | 5 | 1900 | 19 | 535 | 640 | 8 | 0.20 | 0 |
| 20 | The Shunned House Entity | 30/30/30 | 5 | 1950 | 11 | 523 | 640 | 9 | 0.18 | 0 |
| 21 | Joseph Curwen | 30/30/30 | 5 | 2200 | 15 | 217 | 640 | 9 | 0.07 | 0 |
| 22 | The Dunwich Horror | 30/30/30 | 5 | 2950 | 19 | 562 | 640 | 9 | 0.19 | 0 |
| 23 | Mother Hydra | 30/30/30 | 5 | 2450 | 13 | 413 | 640 | 10 | 0.13 | 0 |
| 24 | Father Dagon | 30/30/30 | 5 | 2550 | 14 | 298 | 640 | 10 | 0.09 | 0 |
| 25 | Hypnos | 30/30/30 | 5 | 1900 | 17 | 265 | 640 | 10 | 0.08 | 0 |
| 26 | High Priest Not to Be Described | 30/30/30 | 5 | 2600 | 15 | 221 | 640 | 10 | 0.07 | 0 |
| 27 | The Colossus Beneath the Pyramids | 30/30/30 | 5 | 3950 | 27 | 890 | 640 | 10 | 0.28 | 0 |
| 28 | Bokrug | 30/30/30 | 5 | 3750 | 33 | 974 | 640 | 10 | 0.30 | 0 |
| 29 | Nug | 30/30/30 | 5 | 3750 | 25 | 1279 | 640 | 10 | 0.40 | 0 |
| 30 | Rhan-Tegoth | 30/30/30 | 5 | 3750 | 28 | 1066 | 640 | 10 | 0.33 | 0 |
| 31 | Yeb | 30/30/30 | 5 | 3750 | 28 | 972 | 640 | 10 | 0.30 | 0 |
| 32 | The Great Ones | 30/30/30 | 5 | 4300 | 32 | 1118 | 640 | 10 | 0.35 | 0 |
| 33 | Yig | 30/30/30 | 5 | 4300 | 36 | 978 | 640 | 10 | 0.31 | 0 |
| 34 | Tsathoggua | 30/30/30 | 5 | 4350 | 45 | 1328 | 640 | 10 | 0.42 | 0 |
| 35 | Ghatanothoa | 30/30/30 | 5 | 4850 | 62 | 688 | 640 | 10 | 0.21 | 0 |
| 36 | Hastur | 30/30/30 | 5 | 5100 | 39 | 1079 | 640 | 10 | 0.34 | 0 |
| 37 | Cthulhu | 30/30/30 | 5 | 5350 | 46 | 1200 | 640 | 10 | 0.37 | 0 |
| 38 | The Thing Beyond Erich Zann's Window | 30/30/30 | 5 | 2600 | 15 | 182 | 640 | 10 | 0.06 | 0 |
| 39 | Zkauba the Wizard | 30/30/30 | 5 | 2850 | 24 | 526 | 640 | 10 | 0.16 | 0 |
| 40 | The Other Gods | 30/30/30 | 5 | 3700 | 25 | 594 | 640 | 10 | 0.19 | 0 |
| 41 | 'Umr at-Tawil | 30/30/30 | 5 | 3800 | 30 | 235 | 640 | 10 | 0.07 | 0 |
| 42 | The Daemon Pipers | 30/30/30 | 5 | 3900 | 29 | 866 | 640 | 10 | 0.27 | 0 |
| 43 | The Ancient Ones | 30/30/30 | 5 | 4050 | 27 | 304 | 640 | 10 | 0.09 | 0 |
| 44 | Nyarlathotep | 30/30/30 | 5 | 5150 | 57 | 723 | 640 | 10 | 0.23 | 0 |
| 45 | Shub-Niggurath | 30/30/30 | 5 | 5450 | 83 | 960 | 640 | 10 | 0.30 | 0 |
| 46 | Yog-Sothoth | 30/30/30 | 5 | 6100 | 48 | 534 | 640 | 10 | 0.17 | 0 |
| 47 | Azathoth | 30/30/30 | 5 | 15075 | 198 | 5930 | 640 | 10 | 1.85 | 0 |

## The opening

The same bot against the horrors of the first hours (the hub about the first Elder Sign, and Arkham), at the standing a new
player has there: only those two realms' lesser foes (60% of them, in step) and their own bosses before it have
given Echoes and star-stones. Each may cost at most 1.5 lives; the Colour is capped at 1.3 lives.

| # | Boss | Vig/End/Might | Cane + | Boss health | Seconds | Taken | Our health | Doses | Lives | Deaths |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Dr. Muñoz | 1/0/1 | 0 | 600 | 39 | 263 | 176 | 4 | 0.58 | 0 |
| 2 | Charles le Sorcier | 3/1/2 | 1 | 699 | 39 | 304 | 208 | 4 | 0.56 | 0 |
| 3 | The Outsider | 4/2/3 | 2 | 950 | 31 | 270 | 224 | 4 | 0.46 | 0 |
| 4 | Brown Jenkin | 5/2/4 | 2 | 700 | 71 | 407 | 240 | 4 | 0.65 | 0 |
| 5 | Ephraim Waite | 5/2/5 | 3 | 800 | 25 | 370 | 240 | 5 | 0.51 | 0 |
| 6 | The Hound | 6/2/5 | 3 | 1450 | 51 | 384 | 256 | 5 | 0.50 | 0 |
| 7 | Keziah Mason | 6/3/5 | 4 | 1600 | 41 | 474 | 256 | 5 | 0.62 | 0 |
| 8 | The Unnamable | 6/3/6 | 4 | 2000 | 46 | 427 | 256 | 5 | 0.56 | 0 |
| 9 | The Colour Out of Space | 7/3/6 | 4 | 2400 | 104 | 838 | 272 | 6 | 0.91 | 0 |
| 10 | The Black Man | 7/3/7 | 5 | 2700 | 59 | 168 | 272 | 6 | 0.18 | 0 |
