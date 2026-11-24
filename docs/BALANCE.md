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

- On the first journey a boss has its authored health at the standing it is met at, and grows past it to meet a stronger investigator: its health with their damage (Might and the edge of the weapon in hand), its blows with their health, each at most 1.5 times; its damage also gains 0.3% per purchased player level. Boss health rises on later journeys, capped at NG+7. **Boss health** is the most it had in that run.
- **Seconds** is how long the boss took with this bot's choices; actual players' fight times will differ.
- **Lives** is the damage taken against the health a person has there and the Reagent they carry there (4 doses of 40% at the start, a vial more as the horrors fall, to 8):
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
| 1 | Dr. Muñoz | 1/0/1 | 0 | 500 | 30 | 132 | 176 | 4 | 0.29 | 0 |
| 2 | Charles le Sorcier | 3/1/2 | 1 | 550 | 28 | 171 | 208 | 4 | 0.32 | 0 |
| 3 | The Outsider | 4/2/3 | 2 | 950 | 34 | 247 | 224 | 4 | 0.42 | 0 |
| 4 | Brown Jenkin | 5/2/4 | 2 | 450 | 50 | 165 | 240 | 4 | 0.26 | 0 |
| 5 | Ephraim Waite | 5/2/5 | 3 | 800 | 28 | 230 | 240 | 5 | 0.32 | 0 |
| 6 | The Colour Out of Space | 6/2/5 | 3 | 1300 | 105 | 622 | 256 | 5 | 0.81 | 0 |
| 7 | The Hound | 6/3/6 | 4 | 1450 | 41 | 300 | 256 | 5 | 0.39 | 0 |
| 8 | Keziah Mason | 6/3/6 | 4 | 1600 | 41 | 206 | 256 | 5 | 0.27 | 0 |
| 9 | The Unnamable | 7/3/7 | 4 | 2000 | 47 | 399 | 272 | 6 | 0.43 | 0 |
| 10 | The Black Man | 7/3/7 | 5 | 2500 | 61 | 211 | 272 | 6 | 0.23 | 0 |
| 11 | The Haunter of the Dark | 8/4/7 | 5 | 1050 | 227 | 1452 | 288 | 6 | 1.48 | 0 |
| 12 | The Terrible Old Man | 9/4/8 | 5 | 1500 | 35 | 674 | 304 | 7 | 0.58 | 0 |
| 13 | The Gorgon of Medusa's Coil | 9/4/9 | 5 | 1600 | 36 | 331 | 304 | 7 | 0.29 | 0 |
| 14 | Edward Hutchinson | 10/4/9 | 5 | 1700 | 35 | 360 | 320 | 7 | 0.30 | 0 |
| 15 | Simon Orne | 10/5/9 | 5 | 1700 | 54 | 421 | 320 | 7 | 0.35 | 0 |
| 16 | Lilith | 10/5/10 | 5 | 1900 | 53 | 521 | 320 | 8 | 0.39 | 0 |
| 17 | The Shunned House Entity | 11/5/10 | 5 | 1950 | 38 | 748 | 336 | 8 | 0.53 | 0 |
| 18 | Joseph Curwen | 11/5/11 | 5 | 2200 | 55 | 834 | 336 | 8 | 0.59 | 0 |
| 19 | Wilbur Whateley | 12/5/11 | 5 | 2400 | 71 | 1038 | 352 | 8 | 0.70 | 0 |
| 20 | The Dunwich Horror | 12/6/11 | 5 | 2950 | 62 | 1111 | 352 | 8 | 0.75 | 0 |
| 21 | The Whisperer in Akeley's Chair | 12/6/12 | 5 | 2950 | 67 | 683 | 352 | 8 | 0.46 | 0 |
| 22 | The Horror at Martin's Beach | 13/6/12 | 5 | 3400 | 61 | 502 | 368 | 8 | 0.32 | 0 |
| 23 | Mother Hydra | 11/5/11 | 5 | 2450 | 52 | 756 | 336 | 8 | 0.54 | 0 |
| 24 | Father Dagon | 11/5/11 | 5 | 2550 | 47 | 434 | 336 | 8 | 0.31 | 0 |
| 25 | Hypnos | 14/7/13 | 5 | 3450 | 62 | 599 | 384 | 8 | 0.37 | 0 |
| 26 | The Colossus Beneath the Pyramids | 16/7/15 | 5 | 3950 | 72 | 986 | 416 | 8 | 0.56 | 0 |
| 27 | High Priest Not to Be Described | 17/8/16 | 5 | 4700 | 65 | 437 | 432 | 8 | 0.24 | 0 |
| 28 | Yeb | 16/7/15 | 5 | 4200 | 73 | 1271 | 416 | 8 | 0.73 | 0 |
| 29 | Yig | 16/7/15 | 5 | 4300 | 90 | 2282 | 416 | 8 | 1.31 | 0 |
| 30 | Tsathoggua | 16/7/15 | 5 | 4350 | 97 | 1562 | 416 | 8 | 0.89 | 0 |
| 31 | Nug | 16/7/15 | 5 | 4500 | 94 | 2196 | 416 | 8 | 1.26 | 0 |
| 32 | Bokrug | 16/7/15 | 5 | 4550 | 107 | 1739 | 416 | 8 | 1.00 | 0 |
| 33 | The Great Ones | 16/7/15 | 5 | 4650 | 82 | 1587 | 416 | 8 | 0.91 | 0 |
| 34 | Rhan-Tegoth | 16/7/15 | 5 | 5100 | 119 | 2246 | 416 | 8 | 1.29 | 0 |
| 35 | Cthulhu | 16/7/15 | 5 | 6050 | 119 | 1556 | 416 | 8 | 0.89 | 0 |
| 36 | Ghatanothoa | 16/7/15 | 5 | 6050 | 219 | 1890 | 416 | 8 | 1.08 | 0 |
| 37 | Hastur | 16/7/15 | 5 | 7200 | 155 | 1265 | 416 | 8 | 0.72 | 0 |
| 38 | Zkauba the Wizard | 18/8/17 | 5 | 4150 | 101 | 1894 | 448 | 8 | 1.01 | 0 |
| 39 | The Thing Beyond Erich Zann's Window | 18/9/18 | 5 | 4750 | 66 | 875 | 448 | 8 | 0.47 | 0 |
| 40 | The Daemon Pipers | 18/9/17 | 5 | 3900 | 56 | 743 | 448 | 8 | 0.39 | 0 |
| 41 | Nyarlathotep | 18/9/17 | 5 | 5150 | 229 | 2701 | 448 | 8 | 1.44 | 0 |
| 42 | The Other Gods | 18/9/17 | 5 | 5200 | 89 | 1530 | 448 | 8 | 0.81 | 0 |
| 43 | The Ancient Ones | 18/9/17 | 5 | 5550 | 74 | 841 | 448 | 8 | 0.45 | 0 |
| 44 | 'Umr at-Tawil | 18/9/17 | 5 | 5850 | 90 | 947 | 448 | 8 | 0.50 | 0 |
| 45 | Yog-Sothoth | 18/9/17 | 5 | 6100 | 205 | 2838 | 448 | 8 | 1.51 | 0 |
| 46 | Shub-Niggurath | 18/9/17 | 5 | 7650 | 202 | 2235 | 448 | 8 | 1.19 | 0 |
| 47 | Azathoth | 18/9/17 | 5 | 15075 | 474 | 10645 | 448 | 8 | 5.66 | 0 |

Bounds held by the test: each non-exempt boss finishes within 6 to 450 seconds (under 6 seconds a fight is broken, not easy), and costs at most 3 lives (a colossus, 6; a Great Old One or an Outer God, 1.5), and the bot does not die, subject to the named pressure exceptions below.
Each tier has its band: a named horror takes 14 to 90 seconds and costs 0.2 to 1.2 lives (the Colour may cost up to 1.5); one of the 17 great fights takes 35 to 170 seconds and costs 0.45 to 1.5 lives. Named exceptions are brown jenkin 14–120 seconds; colossus pyramids 14–110 seconds; daemon pipers 14–145 seconds 0.2–1.6 lives; zkauba 14–130 seconds; mother hydra 0.2–1.5 lives; father dagon 0.2–1.5 lives; ghatanothoa 35–280 seconds; nyarlathotep 35–430 seconds 0.45–3 lives; shub niggurath 35–250 seconds; yog sothoth 35–400 seconds 0.45–2.5 lives; umr at tawil 0.25–1.5 lives; colour out of space 14–135 seconds. Yog-Sothoth is additionally capped at 2.5 lives at its expected standing. The upper end of each band fails the test; the lower end is a warning, listed below (2026-11-24: how hard a fight should be is the author's call, and the bot is not a person).

## Below their bands

None.

## At the cap

The same bot, from 9 starts (6 to 14 metres off), with every level bought (30 Vigour, 30 Endurance, 30 Might, which give 640 health, 340 stamina and blows of 1.96) and the cane at +5. Past its standing a boss grows to meet the investigator, at most 1.5 times: its health with their damage and its blows with their health (`overmatchHealth` and `overmatch` in `systems/bossScaling.ts`), so **Boss health** here is what it had in the fight. These fights become shorter as the investigator grows. Dagon and Hydra's combined encounter is additionally bounded in `tests/seaBosses.test.ts`.

| # | Boss | Vig/End/Might | Cane + | Boss health | Seconds | Taken | Our health | Doses | Lives | Deaths |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Dr. Muñoz | 30/30/30 | 5 | 750 | 7 | 45 | 640 | 4 | 0.03 | 0 |
| 2 | Charles le Sorcier | 30/30/30 | 5 | 825 | 8 | 72 | 640 | 4 | 0.04 | 0 |
| 3 | The Outsider | 30/30/30 | 5 | 1425 | 11 | 99 | 640 | 4 | 0.06 | 0 |
| 4 | Brown Jenkin | 30/30/30 | 5 | 675 | 8 | 91 | 640 | 4 | 0.05 | 0 |
| 5 | Ephraim Waite | 30/30/30 | 5 | 1200 | 11 | 166 | 640 | 5 | 0.09 | 0 |
| 6 | The Colour Out of Space | 30/30/30 | 5 | 1950 | 14 | 290 | 640 | 5 | 0.15 | 0 |
| 7 | The Hound | 30/30/30 | 5 | 2175 | 14 | 272 | 640 | 5 | 0.14 | 0 |
| 8 | Keziah Mason | 30/30/30 | 5 | 2400 | 21 | 109 | 640 | 5 | 0.06 | 0 |
| 9 | The Unnamable | 30/30/30 | 5 | 3000 | 21 | 264 | 640 | 6 | 0.12 | 0 |
| 10 | The Black Man | 30/30/30 | 5 | 3496 | 36 | 262 | 640 | 6 | 0.12 | 0 |
| 11 | The Haunter of the Dark | 30/30/30 | 5 | 1468 | 164 | 1983 | 640 | 6 | 0.91 | 0 |
| 12 | The Terrible Old Man | 30/30/30 | 5 | 2045 | 21 | 610 | 640 | 7 | 0.25 | 0 |
| 13 | The Gorgon of Medusa's Coil | 30/30/30 | 5 | 2129 | 18 | 411 | 640 | 7 | 0.17 | 0 |
| 14 | Edward Hutchinson | 30/30/30 | 5 | 2263 | 20 | 476 | 640 | 7 | 0.20 | 0 |
| 15 | Simon Orne | 30/30/30 | 5 | 2263 | 26 | 313 | 640 | 7 | 0.13 | 0 |
| 16 | Lilith | 30/30/30 | 5 | 2470 | 28 | 636 | 640 | 8 | 0.24 | 0 |
| 17 | The Shunned House Entity | 30/30/30 | 5 | 2535 | 19 | 588 | 640 | 8 | 0.22 | 0 |
| 18 | Joseph Curwen | 30/30/30 | 5 | 2796 | 30 | 767 | 640 | 8 | 0.29 | 0 |
| 19 | Wilbur Whateley | 30/30/30 | 5 | 3050 | 30 | 944 | 640 | 8 | 0.35 | 0 |
| 20 | The Dunwich Horror | 30/30/30 | 5 | 3749 | 32 | 1201 | 640 | 8 | 0.45 | 0 |
| 21 | The Whisperer in Akeley's Chair | 30/30/30 | 5 | 3668 | 40 | 560 | 640 | 8 | 0.21 | 0 |
| 22 | The Horror at Martin's Beach | 30/30/30 | 5 | 4227 | 43 | 586 | 640 | 8 | 0.22 | 0 |
| 23 | Mother Hydra | 30/30/30 | 5 | 3114 | 27 | 619 | 640 | 8 | 0.23 | 0 |
| 24 | Father Dagon | 30/30/30 | 5 | 3241 | 26 | 554 | 640 | 8 | 0.21 | 0 |
| 25 | Hypnos | 30/30/30 | 5 | 4199 | 51 | 662 | 640 | 8 | 0.25 | 0 |
| 26 | The Colossus Beneath the Pyramids | 30/30/30 | 5 | 4617 | 43 | 1104 | 640 | 8 | 0.41 | 0 |
| 27 | High Priest Not to Be Described | 30/30/30 | 5 | 5388 | 46 | 402 | 640 | 8 | 0.15 | 0 |
| 28 | Yeb | 30/30/30 | 5 | 4909 | 49 | 1544 | 640 | 8 | 0.57 | 0 |
| 29 | Yig | 30/30/30 | 5 | 5026 | 54 | 1608 | 640 | 8 | 0.60 | 0 |
| 30 | Tsathoggua | 30/30/30 | 5 | 5084 | 62 | 1610 | 640 | 8 | 0.60 | 0 |
| 31 | Nug | 30/30/30 | 5 | 5259 | 51 | 2191 | 640 | 8 | 0.82 | 0 |
| 32 | Bokrug | 30/30/30 | 5 | 5318 | 77 | 2096 | 640 | 8 | 0.78 | 0 |
| 33 | The Great Ones | 30/30/30 | 5 | 5435 | 57 | 1578 | 640 | 8 | 0.59 | 0 |
| 34 | Rhan-Tegoth | 30/30/30 | 5 | 5961 | 62 | 1828 | 640 | 8 | 0.68 | 0 |
| 35 | Cthulhu | 30/30/30 | 5 | 7071 | 55 | 1014 | 640 | 8 | 0.38 | 0 |
| 36 | Ghatanothoa | 30/30/30 | 5 | 7071 | 114 | 987 | 640 | 8 | 0.37 | 0 |
| 37 | Hastur | 30/30/30 | 5 | 8415 | 72 | 1039 | 640 | 8 | 0.39 | 0 |
| 38 | Zkauba the Wizard | 30/30/30 | 5 | 4669 | 64 | 1367 | 640 | 8 | 0.51 | 0 |
| 39 | The Thing Beyond Erich Zann's Window | 30/30/30 | 5 | 5247 | 43 | 809 | 640 | 8 | 0.30 | 0 |
| 40 | The Daemon Pipers | 30/30/30 | 5 | 4388 | 37 | 668 | 640 | 8 | 0.25 | 0 |
| 41 | Nyarlathotep | 30/30/30 | 5 | 5794 | 104 | 1508 | 640 | 8 | 0.56 | 0 |
| 42 | The Other Gods | 30/30/30 | 5 | 5850 | 86 | 2657 | 640 | 8 | 0.99 | 0 |
| 43 | The Ancient Ones | 30/30/30 | 5 | 6244 | 56 | 781 | 640 | 8 | 0.29 | 0 |
| 44 | 'Umr at-Tawil | 30/30/30 | 5 | 6581 | 64 | 771 | 640 | 8 | 0.29 | 0 |
| 45 | Yog-Sothoth | 30/30/30 | 5 | 6863 | 75 | 796 | 640 | 8 | 0.30 | 0 |
| 46 | Shub-Niggurath | 30/30/30 | 5 | 8606 | 116 | 1531 | 640 | 8 | 0.57 | 0 |
| 47 | Azathoth | 30/30/30 | 5 | 16959 | 293 | 9012 | 640 | 8 | 3.35 | 0 |

## The opening

The same bot against the horrors of the first hours (the hub about the first Elder Sign, and Arkham), at the standing a new
player has there: only those two realms' lesser foes (60% of them, in step) and their own bosses before it have
given Echoes and star-stones. Each may cost at most 1.5 lives; the Colour is capped at 1.3 lives.

| # | Boss | Vig/End/Might | Cane + | Boss health | Seconds | Taken | Our health | Doses | Lives | Deaths |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Dr. Muñoz | 1/0/1 | 0 | 500 | 30 | 132 | 176 | 4 | 0.29 | 0 |
| 2 | Charles le Sorcier | 3/1/2 | 1 | 550 | 28 | 171 | 208 | 4 | 0.32 | 0 |
| 3 | The Outsider | 4/2/3 | 2 | 950 | 34 | 247 | 224 | 4 | 0.42 | 0 |
| 4 | Brown Jenkin | 5/2/4 | 2 | 450 | 50 | 165 | 240 | 4 | 0.26 | 0 |
| 5 | Ephraim Waite | 5/2/5 | 3 | 800 | 28 | 230 | 240 | 5 | 0.32 | 0 |
| 6 | The Colour Out of Space | 6/2/5 | 3 | 1300 | 105 | 622 | 256 | 5 | 0.81 | 0 |
| 7 | The Hound | 6/3/6 | 4 | 1450 | 41 | 300 | 256 | 5 | 0.39 | 0 |
| 8 | Keziah Mason | 6/3/6 | 4 | 1600 | 41 | 206 | 256 | 5 | 0.27 | 0 |
| 9 | The Unnamable | 7/3/7 | 4 | 2000 | 47 | 399 | 272 | 6 | 0.43 | 0 |
| 10 | The Black Man | 7/3/7 | 5 | 2500 | 61 | 211 | 272 | 6 | 0.23 | 0 |
