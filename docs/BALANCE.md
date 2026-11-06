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
| 1 | Dr. Muñoz | 1/0/1 | 0 | 500 | 31 | 164 | 176 | 4 | 0.36 | 0 |
| 2 | Charles le Sorcier | 3/1/2 | 1 | 550 | 28 | 201 | 208 | 4 | 0.37 | 0 |
| 3 | The Outsider | 4/2/3 | 2 | 950 | 32 | 213 | 224 | 4 | 0.37 | 0 |
| 4 | Brown Jenkin | 5/2/4 | 2 | 450 | 37 | 209 | 240 | 4 | 0.34 | 0 |
| 5 | Ephraim Waite | 5/2/5 | 3 | 800 | 29 | 296 | 240 | 5 | 0.41 | 0 |
| 6 | The Colour Out of Space | 6/2/5 | 3 | 1300 | 94 | 729 | 256 | 5 | 0.95 | 0 |
| 7 | Keziah Mason | 6/3/6 | 4 | 1350 | 47 | 277 | 256 | 5 | 0.36 | 0 |
| 8 | The Hound | 7/3/6 | 4 | 1450 | 38 | 311 | 272 | 5 | 0.38 | 0 |
| 9 | The Unnamable | 7/3/7 | 4 | 2000 | 43 | 389 | 272 | 6 | 0.42 | 0 |
| 10 | The Black Man | 7/3/7 | 5 | 3100 | 66 | 331 | 272 | 6 | 0.36 | 0 |
| 11 | The Haunter of the Dark | 8/4/7 | 5 | 1050 | 191 | 1529 | 288 | 6 | 1.56 | 0 |
| 12 | The Terrible Old Man | 9/4/8 | 5 | 1500 | 33 | 477 | 304 | 7 | 0.41 | 0 |
| 13 | The Gorgon of Medusa's Coil | 9/4/9 | 5 | 1600 | 46 | 522 | 304 | 7 | 0.45 | 0 |
| 14 | Edward Hutchinson | 10/4/9 | 5 | 1700 | 43 | 591 | 320 | 7 | 0.49 | 0 |
| 15 | Simon Orne | 10/5/9 | 5 | 1700 | 42 | 571 | 320 | 7 | 0.47 | 0 |
| 16 | Lilith | 10/5/10 | 5 | 1900 | 49 | 776 | 320 | 8 | 0.58 | 0 |
| 17 | The Shunned House Entity | 11/5/10 | 5 | 1950 | 38 | 830 | 336 | 8 | 0.59 | 0 |
| 18 | Joseph Curwen | 11/5/11 | 5 | 2200 | 45 | 794 | 336 | 8 | 0.56 | 0 |
| 19 | Wilbur Whateley | 12/5/11 | 5 | 2400 | 50 | 607 | 352 | 8 | 0.41 | 0 |
| 20 | The Dunwich Horror | 12/6/11 | 5 | 2950 | 60 | 1018 | 352 | 8 | 0.69 | 0 |
| 21 | The Whisperer in Akeley's Chair | 12/6/12 | 5 | 2950 | 58 | 601 | 352 | 8 | 0.41 | 0 |
| 22 | The Horror at Martin's Beach | 13/6/12 | 5 | 3400 | 64 | 514 | 368 | 8 | 0.33 | 0 |
| 23 | Mother Hydra | 11/5/11 | 5 | 2450 | 50 | 830 | 336 | 8 | 0.59 | 0 |
| 24 | Father Dagon | 11/5/11 | 5 | 2550 | 45 | 474 | 336 | 8 | 0.34 | 0 |
| 25 | Hypnos | 14/7/13 | 5 | 3450 | 73 | 829 | 384 | 8 | 0.51 | 0 |
| 26 | The Colossus Beneath the Pyramids | 16/7/15 | 5 | 3950 | 67 | 1061 | 416 | 8 | 0.61 | 0 |
| 27 | High Priest Not to Be Described | 17/8/16 | 5 | 4700 | 78 | 647 | 432 | 8 | 0.36 | 0 |
| 28 | Yeb | 16/7/15 | 5 | 4200 | 73 | 1672 | 416 | 8 | 0.96 | 0 |
| 29 | Yig | 16/7/15 | 5 | 4300 | 74 | 1724 | 416 | 8 | 0.99 | 0 |
| 30 | Tsathoggua | 16/7/15 | 5 | 4350 | 110 | 1744 | 416 | 8 | 1.00 | 0 |
| 31 | Nug | 16/7/15 | 5 | 4500 | 85 | 1759 | 416 | 8 | 1.01 | 0 |
| 32 | Bokrug | 16/7/15 | 5 | 4550 | 107 | 1505 | 416 | 8 | 0.86 | 0 |
| 33 | The Great Ones | 16/7/15 | 5 | 4650 | 83 | 1834 | 416 | 8 | 1.05 | 0 |
| 34 | Rhan-Tegoth | 16/7/15 | 5 | 5100 | 108 | 2068 | 416 | 8 | 1.18 | 0 |
| 35 | Cthulhu | 16/7/15 | 5 | 6050 | 149 | 2244 | 416 | 8 | 1.28 | 0 |
| 36 | Ghatanothoa | 16/7/15 | 5 | 6050 | 233 | 1755 | 416 | 8 | 1.00 | 0 |
| 37 | Hastur | 16/7/15 | 5 | 7200 | 161 | 1606 | 416 | 8 | 0.92 | 0 |
| 38 | Zkauba the Wizard | 18/8/17 | 5 | 4150 | 79 | 1666 | 448 | 8 | 0.89 | 0 |
| 39 | The Thing Beyond Erich Zann's Window | 18/9/18 | 5 | 4750 | 76 | 1389 | 448 | 8 | 0.74 | 0 |
| 40 | The Daemon Pipers | 18/9/17 | 5 | 3900 | 65 | 1378 | 448 | 8 | 0.73 | 0 |
| 41 | Nyarlathotep | 18/9/17 | 5 | 5150 | 217 | 2085 | 448 | 8 | 1.11 | 0 |
| 42 | The Other Gods | 18/9/17 | 5 | 5200 | 79 | 1308 | 448 | 8 | 0.70 | 0 |
| 43 | The Ancient Ones | 18/9/17 | 5 | 5550 | 85 | 1018 | 448 | 8 | 0.54 | 0 |
| 44 | 'Umr at-Tawil | 18/9/17 | 5 | 5850 | 135 | 1203 | 448 | 8 | 0.64 | 0 |
| 45 | Yog-Sothoth | 18/9/17 | 5 | 6100 | 171 | 2103 | 448 | 8 | 1.12 | 0 |
| 46 | Shub-Niggurath | 18/9/17 | 5 | 7650 | 231 | 2522 | 448 | 8 | 1.34 | 0 |
| 47 | Azathoth | 18/9/17 | 5 | 15075 | 501 | 11178 | 448 | 8 | 5.94 | 0 |

Bounds held by the test: each non-exempt boss finishes within 6 to 450 seconds, and costs at most 3 lives (a colossus, 6; a Great Old One or an Outer God, 1.5), and the bot does not die, subject to the named pressure exceptions below.
Each tier has its band: a named horror takes 14 to 90 seconds and costs 0.2 to 1.2 lives (the Colour may cost up to 1.5); one of the 17 great fights takes 35 to 170 seconds and costs 0.45 to 1.5 lives. Named exceptions are brown jenkin 14–120 seconds; colossus pyramids 14–110 seconds; daemon pipers 14–145 seconds 0.2–1.6 lives; zkauba 14–130 seconds; mother hydra 0.2–1.5 lives; father dagon 0.2–1.5 lives; ghatanothoa 35–280 seconds; nyarlathotep 35–430 seconds 0.45–3 lives; shub niggurath 35–250 seconds; yog sothoth 35–400 seconds 0.45–2.5 lives; umr at tawil 0.25–1.5 lives; colour out of space 14–135 seconds. Yog-Sothoth is additionally capped at 2.5 lives at its expected standing.

## At the cap

The same bot, from 9 starts (6 to 14 metres off), with every level bought (30 Vigour, 30 Endurance, 30 Might, which give 640 health, 340 stamina and blows of 1.96) and the cane at +5. Boss health remains at its authored value; their blows still grow with levels and with Vigour beyond their expected standing (`overmatch` in `systems/bossScaling.ts`). These fights can become shorter as the investigator grows. Dagon and Hydra's combined encounter is additionally bounded in `tests/seaBosses.test.ts`.

| # | Boss | Vig/End/Might | Cane + | Boss health | Seconds | Taken | Our health | Doses | Lives | Deaths |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Dr. Muñoz | 30/30/30 | 5 | 500 | 14 | 238 | 640 | 4 | 0.14 | 0 |
| 2 | Charles le Sorcier | 30/30/30 | 5 | 550 | 10 | 195 | 640 | 4 | 0.12 | 0 |
| 3 | The Outsider | 30/30/30 | 5 | 950 | 18 | 325 | 640 | 4 | 0.20 | 0 |
| 4 | Brown Jenkin | 30/30/30 | 5 | 450 | 8 | 153 | 640 | 4 | 0.09 | 0 |
| 5 | Ephraim Waite | 30/30/30 | 5 | 800 | 13 | 190 | 640 | 5 | 0.10 | 0 |
| 6 | The Colour Out of Space | 30/30/30 | 5 | 1300 | 21 | 421 | 640 | 5 | 0.22 | 0 |
| 7 | Keziah Mason | 30/30/30 | 5 | 1350 | 15 | 224 | 640 | 5 | 0.12 | 0 |
| 8 | The Hound | 30/30/30 | 5 | 1450 | 16 | 345 | 640 | 5 | 0.18 | 0 |
| 9 | The Unnamable | 30/30/30 | 5 | 2000 | 21 | 356 | 640 | 6 | 0.16 | 0 |
| 10 | The Black Man | 30/30/30 | 5 | 3100 | 41 | 479 | 640 | 6 | 0.22 | 0 |
| 11 | The Haunter of the Dark | 30/30/30 | 5 | 1050 | 169 | 3254 | 640 | 6 | 1.50 | 0 |
| 12 | The Terrible Old Man | 30/30/30 | 5 | 1500 | 19 | 608 | 640 | 7 | 0.25 | 0 |
| 13 | The Gorgon of Medusa's Coil | 30/30/30 | 5 | 1600 | 23 | 441 | 640 | 7 | 0.18 | 0 |
| 14 | Edward Hutchinson | 30/30/30 | 5 | 1700 | 21 | 539 | 640 | 7 | 0.22 | 0 |
| 15 | Simon Orne | 30/30/30 | 5 | 1700 | 22 | 596 | 640 | 7 | 0.25 | 0 |
| 16 | Lilith | 30/30/30 | 5 | 1900 | 26 | 940 | 640 | 8 | 0.35 | 0 |
| 17 | The Shunned House Entity | 30/30/30 | 5 | 1950 | 18 | 830 | 640 | 8 | 0.31 | 0 |
| 18 | Joseph Curwen | 30/30/30 | 5 | 2200 | 25 | 609 | 640 | 8 | 0.23 | 0 |
| 19 | Wilbur Whateley | 30/30/30 | 5 | 2400 | 38 | 938 | 640 | 8 | 0.35 | 0 |
| 20 | The Dunwich Horror | 30/30/30 | 5 | 2950 | 30 | 933 | 640 | 8 | 0.35 | 0 |
| 21 | The Whisperer in Akeley's Chair | 30/30/30 | 5 | 2950 | 40 | 640 | 640 | 8 | 0.24 | 0 |
| 22 | The Horror at Martin's Beach | 30/30/30 | 5 | 3400 | 39 | 629 | 640 | 8 | 0.23 | 0 |
| 23 | Mother Hydra | 30/30/30 | 5 | 2450 | 23 | 678 | 640 | 8 | 0.25 | 0 |
| 24 | Father Dagon | 30/30/30 | 5 | 2550 | 25 | 562 | 640 | 8 | 0.21 | 0 |
| 25 | Hypnos | 30/30/30 | 5 | 3450 | 38 | 775 | 640 | 8 | 0.29 | 0 |
| 26 | The Colossus Beneath the Pyramids | 30/30/30 | 5 | 3950 | 41 | 1283 | 640 | 8 | 0.48 | 0 |
| 27 | High Priest Not to Be Described | 30/30/30 | 5 | 4700 | 45 | 405 | 640 | 8 | 0.15 | 0 |
| 28 | Yeb | 30/30/30 | 5 | 4200 | 47 | 1523 | 640 | 8 | 0.57 | 0 |
| 29 | Yig | 30/30/30 | 5 | 4300 | 49 | 1464 | 640 | 8 | 0.54 | 0 |
| 30 | Tsathoggua | 30/30/30 | 5 | 4350 | 59 | 1399 | 640 | 8 | 0.52 | 0 |
| 31 | Nug | 30/30/30 | 5 | 4500 | 49 | 1637 | 640 | 8 | 0.61 | 0 |
| 32 | Bokrug | 30/30/30 | 5 | 4550 | 65 | 1872 | 640 | 8 | 0.70 | 0 |
| 33 | The Great Ones | 30/30/30 | 5 | 4650 | 52 | 1875 | 640 | 8 | 0.70 | 0 |
| 34 | Rhan-Tegoth | 30/30/30 | 5 | 5100 | 61 | 1834 | 640 | 8 | 0.68 | 0 |
| 35 | Cthulhu | 30/30/30 | 5 | 6050 | 61 | 988 | 640 | 8 | 0.37 | 0 |
| 36 | Ghatanothoa | 30/30/30 | 5 | 6050 | 116 | 959 | 640 | 8 | 0.36 | 0 |
| 37 | Hastur | 30/30/30 | 5 | 7200 | 74 | 1157 | 640 | 8 | 0.43 | 0 |
| 38 | Zkauba the Wizard | 30/30/30 | 5 | 4150 | 66 | 1746 | 640 | 8 | 0.65 | 0 |
| 39 | The Thing Beyond Erich Zann's Window | 30/30/30 | 5 | 4750 | 43 | 901 | 640 | 8 | 0.34 | 0 |
| 40 | The Daemon Pipers | 30/30/30 | 5 | 3900 | 42 | 1352 | 640 | 8 | 0.50 | 0 |
| 41 | Nyarlathotep | 30/30/30 | 5 | 5150 | 104 | 1211 | 640 | 8 | 0.45 | 0 |
| 42 | The Other Gods | 30/30/30 | 5 | 5200 | 67 | 1695 | 640 | 8 | 0.63 | 0 |
| 43 | The Ancient Ones | 30/30/30 | 5 | 5550 | 54 | 861 | 640 | 8 | 0.32 | 0 |
| 44 | 'Umr at-Tawil | 30/30/30 | 5 | 5850 | 70 | 956 | 640 | 8 | 0.36 | 0 |
| 45 | Yog-Sothoth | 30/30/30 | 5 | 6100 | 76 | 863 | 640 | 8 | 0.32 | 0 |
| 46 | Shub-Niggurath | 30/30/30 | 5 | 7650 | 142 | 1487 | 640 | 8 | 0.55 | 0 |
| 47 | Azathoth | 30/30/30 | 5 | 15075 | 306 | 9906 | 640 | 8 | 3.69 | 0 |

## The opening

The same bot against the horrors of the first hours (the hub about the first Elder Sign, and Arkham), at the standing a new
player has there: only those two realms' lesser foes (60% of them, in step) and their own bosses before it have
given Echoes and star-stones. Each may cost at most 1.5 lives; the Colour is capped at 1.3 lives.

| # | Boss | Vig/End/Might | Cane + | Boss health | Seconds | Taken | Our health | Doses | Lives | Deaths |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Dr. Muñoz | 1/0/1 | 0 | 500 | 31 | 164 | 176 | 4 | 0.36 | 0 |
| 2 | Charles le Sorcier | 3/1/2 | 1 | 550 | 28 | 201 | 208 | 4 | 0.37 | 0 |
| 3 | The Outsider | 4/2/3 | 2 | 950 | 32 | 213 | 224 | 4 | 0.37 | 0 |
| 4 | Brown Jenkin | 5/2/4 | 2 | 450 | 37 | 209 | 240 | 4 | 0.34 | 0 |
| 5 | Ephraim Waite | 5/2/5 | 3 | 800 | 29 | 296 | 240 | 5 | 0.41 | 0 |
| 6 | The Colour Out of Space | 6/2/5 | 3 | 1300 | 94 | 729 | 256 | 5 | 0.95 | 0 |
| 7 | Keziah Mason | 6/3/6 | 4 | 1350 | 47 | 277 | 256 | 5 | 0.36 | 0 |
| 8 | The Hound | 7/3/6 | 4 | 1450 | 38 | 311 | 272 | 5 | 0.38 | 0 |
| 9 | The Unnamable | 7/3/7 | 4 | 2000 | 43 | 389 | 272 | 6 | 0.42 | 0 |
| 10 | The Black Man | 7/3/7 | 5 | 3100 | 66 | 331 | 272 | 6 | 0.36 | 0 |
