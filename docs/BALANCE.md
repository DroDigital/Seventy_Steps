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

- Bosses gain 0.75% maximum health and 0.3% damage per player level, a level counted by what it is worth (round 71, the soft caps: each attribute's levels count whole to 20, 50% from 21, 20% from 27: thirty are worth 23.8, so ninety bought are 71.4). Level one retains the authored stats;
  ordinary enemies, summons and spawning roots keep their existing stats. **Scaled health** is the boss's actual maximum in that run.
- **Seconds** is how long the boss took with this bot's choices; actual players' fight times will differ.
- **Lives** is the damage taken against the health a person has there and the Reagent they carry there (4 doses of 40% at the start, a vial more as the horrors fall, to 10):
  1 is the equivalent of all of it. A selected dodge can fail to start or avoid damage, and a value above 1 exceeds the carried healing
  in this simulation; these raw costs are never divided by the scaling factors.
- Ghatanothoa is fought with the gaze waived (its seconds scaled by the half of a fight in its sight), Shub-Niggurath with
  its roots down (forty seconds more, to cut them), and the Great Ones and 'Umr at-Tawil with the void under their hidden
  platforms shut (a person with insight keeps to the platforms): the bot plays those badly. Azathoth and the Haunter of the Dark are not held
  to the bounds: Azathoth is blind and cannot be wounded (the piping is outlasted, and what it costs the bot is the noise the bot
  makes), the Haunter is hurt only by lamplight (a person lures it to a lamp).
- Dagon and Hydra share one encounter. Their individual rows are supplemental; `tests/seaBosses.test.ts` also checks both together at the expected standing, including combined time and damage against one healing inventory. Solo pressure floors are lower for these two members, while their upper limits remain in force.


| # | Boss | Vig/End/Might | Cane + | Scaled health | Seconds | Taken | Our health | Doses | Lives | Deaths |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Dr. Muñoz | 1/0/1 | 0 | 913 | 64 | 385 | 176 | 4 | 0.84 | 0 |
| 2 | Charles le Sorcier | 3/1/2 | 1 | 1096 | 64 | 520 | 208 | 4 | 0.96 | 0 |
| 3 | The Outsider | 4/2/3 | 2 | 1521 | 56 | 370 | 224 | 4 | 0.63 | 0 |
| 4 | Brown Jenkin | 5/2/4 | 2 | 1137 | 139 | 771 | 240 | 4 | 1.24 | 0 |
| 5 | Ephraim Waite | 5/2/5 | 3 | 1308 | 44 | 472 | 240 | 5 | 0.66 | 0 |
| 6 | The Hound | 6/2/5 | 3 | 2387 | 89 | 749 | 256 | 5 | 0.97 | 0 |
| 7 | Keziah Mason | 6/3/5 | 4 | 2652 | 71 | 805 | 256 | 5 | 1.05 | 0 |
| 8 | The Unnamable | 6/3/6 | 4 | 3338 | 86 | 662 | 256 | 5 | 0.86 | 0 |
| 9 | The Colour Out of Space | 7/3/6 | 4 | 4032 | 143 | 1195 | 272 | 6 | 1.29 | 0 |
| 10 | The Black Man | 7/3/7 | 5 | 4566 | 168 | 1166 | 272 | 6 | 1.26 | 0 |
| 11 | The Haunter of the Dark | 8/4/7 | 5 | 1799 | 390 | 4255 | 288 | 6 | 4.35 | 0 |
| 12 | Wilbur Whateley | 9/4/8 | 5 | 2691 | 59 | 619 | 304 | 7 | 0.54 | 0 |
| 13 | The Gorgon of Medusa's Coil | 9/4/9 | 5 | 2796 | 100 | 883 | 304 | 7 | 0.76 | 0 |
| 14 | The Whisperer in Akeley's Chair | 10/4/9 | 5 | 2814 | 66 | 675 | 320 | 7 | 0.56 | 0 |
| 15 | Edward Hutchinson | 10/5/10 | 5 | 3028 | 77 | 941 | 320 | 7 | 0.77 | 0 |
| 16 | Simon Orne | 11/5/10 | 5 | 3047 | 105 | 1256 | 336 | 8 | 0.89 | 0 |
| 17 | The Horror at Martin's Beach | 11/5/11 | 5 | 3337 | 68 | 495 | 336 | 8 | 0.35 | 0 |
| 18 | The Terrible Old Man | 12/5/11 | 5 | 3358 | 130 | 1593 | 352 | 8 | 1.08 | 0 |
| 19 | Lilith | 12/5/11 | 5 | 3449 | 95 | 1318 | 352 | 8 | 0.89 | 0 |
| 20 | The Shunned House Entity | 12/6/11 | 5 | 3561 | 69 | 1210 | 352 | 9 | 0.75 | 0 |
| 21 | Joseph Curwen | 12/6/12 | 5 | 4043 | 93 | 1121 | 352 | 9 | 0.69 | 0 |
| 22 | The Dunwich Horror | 13/6/12 | 5 | 5454 | 148 | 3012 | 368 | 9 | 1.78 | 0 |
| 23 | Mother Hydra | 11/5/11 | 5 | 4419 | 92 | 1399 | 336 | 10 | 0.83 | 0 |
| 24 | Father Dagon | 11/5/11 | 5 | 4600 | 103 | 870 | 336 | 10 | 0.52 | 0 |
| 25 | Hypnos | 14/7/13 | 5 | 3577 | 92 | 948 | 384 | 10 | 0.49 | 0 |
| 26 | High Priest Not to Be Described | 16/7/15 | 5 | 5012 | 88 | 632 | 416 | 10 | 0.30 | 0 |
| 27 | The Colossus Beneath the Pyramids | 17/8/16 | 5 | 7747 | 200 | 4661 | 432 | 10 | 2.16 | 0 |
| 28 | Bokrug | 16/7/15 | 5 | 7228 | 170 | 2629 | 416 | 10 | 1.26 | 0 |
| 29 | Nug | 16/7/15 | 5 | 7228 | 173 | 3638 | 416 | 10 | 1.75 | 0 |
| 30 | Rhan-Tegoth | 16/7/15 | 5 | 7228 | 201 | 3785 | 416 | 10 | 1.82 | 0 |
| 31 | Yeb | 16/7/15 | 5 | 7228 | 153 | 3308 | 416 | 10 | 1.59 | 0 |
| 32 | The Great Ones | 16/7/15 | 5 | 8288 | 167 | 3090 | 416 | 10 | 1.49 | 0 |
| 33 | Yig | 16/7/15 | 5 | 8288 | 215 | 6060 | 416 | 10 | 2.91 | 0 |
| 34 | Tsathoggua | 16/7/15 | 5 | 8385 | 258 | 5302 | 416 | 10 | 2.55 | 0 |
| 35 | Ghatanothoa | 16/7/15 | 5 | 9348 | 489 | 4764 | 416 | 10 | 2.29 | 0 |
| 36 | Hastur | 16/7/15 | 5 | 9830 | 268 | 2625 | 416 | 10 | 1.26 | 0 |
| 37 | Cthulhu | 16/7/15 | 5 | 10312 | 261 | 5184 | 416 | 10 | 2.49 | 0 |
| 38 | The Thing Beyond Erich Zann's Window | 18/8/17 | 5 | 5158 | 76 | 715 | 448 | 10 | 0.32 | 0 |
| 39 | Zkauba the Wizard | 18/9/18 | 5 | 5718 | 232 | 4108 | 448 | 10 | 1.83 | 0 |
| 40 | The Other Gods | 18/9/17 | 5 | 7382 | 174 | 3755 | 448 | 10 | 1.68 | 0 |
| 41 | 'Umr at-Tawil | 18/9/17 | 5 | 7581 | 183 | 1814 | 448 | 10 | 0.81 | 0 |
| 42 | The Daemon Pipers | 18/9/17 | 5 | 7781 | 244 | 5140 | 448 | 10 | 2.29 | 0 |
| 43 | The Ancient Ones | 18/9/17 | 5 | 8080 | 136 | 1346 | 448 | 10 | 0.60 | 0 |
| 44 | Nyarlathotep | 18/9/17 | 5 | 10274 | 610 | 8557 | 448 | 10 | 3.82 | 0 |
| 45 | Shub-Niggurath | 18/9/17 | 5 | 10873 | 368 | 5618 | 448 | 10 | 2.51 | 0 |
| 46 | Yog-Sothoth | 18/9/17 | 5 | 12170 | 580 | 7607 | 448 | 10 | 3.40 | 0 |
| 47 | Azathoth | 18/9/17 | 5 | 13367 | 90 | 9839 | 448 | 10 | 4.39 | 0 |

Bounds held by the test: each boss finishes within 6 to 800 seconds, and costs at most 3 lives (a colossus, 6; a Great Old One or an Outer God, 3.4), and the bot does not die, subject to the named pressure exceptions below.
Each tier has its band: a named horror takes 14 to 200 seconds and costs 0.2 to 2.4 lives (the Colour may cost up to 1.5); one of the 16 great fights takes 35 to 340 seconds and costs 0.45 to 3.4 lives. Named exceptions are colossus pyramids 14–240 seconds; daemon pipers 14–280 seconds 0.2–2.6 lives; zkauba 14–280 seconds; mother hydra 0.2–1.5 lives; father dagon 0.2–1.5 lives; ghatanothoa 35–580 seconds; nyarlathotep 35–740 seconds 0.45–4.5 lives; shub niggurath 35–440 seconds; yog sothoth 35–700 seconds 0.45–3.8 lives; umr at tawil 0.25–1.5 lives; colour out of space 14–170 seconds. Yog-Sothoth is additionally capped at 3.8 lives at its expected standing.

## At the cap

The same bot, from 9 starts (6 to 14 metres off), with every level bought (30 Vigour, 30 Endurance, 30 Might, which the soft caps make 541 health, 290 stamina and blows of 1.95) and the cane at +5. The horrors have grown past what a person has when they meet them:
their health by the Might the investigator has beyond the standing above, and their blows by the Vigour (`overmatch` in `systems/bossScaling.ts`, `BOSS_OVERMATCH`). A named horror still takes at least 10 seconds and costs a bot 0.1 to 1.5 lives; a great fight 30 and 0.4 to 1.875 lives, except 'Umr at-Tawil's 0.18 life floor, Dagon and Hydra's 0.2 life floor per member, and the ceilings of Yog-Sothoth (2.2), the Daemon Pipers (2) and Nyarlathotep (3.1). Dagon and Hydra's combined encounter is additionally bounded in `tests/seaBosses.test.ts`.

| # | Boss | Vig/End/Might | Cane + | Scaled health | Seconds | Taken | Our health | Doses | Lives | Deaths |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Dr. Muñoz | 30/30/30 | 5 | 1988 | 19 | 393 | 541 | 4 | 0.28 | 0 |
| 2 | Charles le Sorcier | 30/30/30 | 5 | 2261 | 19 | 336 | 541 | 4 | 0.24 | 0 |
| 3 | The Outsider | 30/30/30 | 5 | 3001 | 31 | 557 | 541 | 4 | 0.40 | 0 |
| 4 | Brown Jenkin | 30/30/30 | 5 | 2163 | 42 | 441 | 541 | 4 | 0.31 | 0 |
| 5 | Ephraim Waite | 30/30/30 | 5 | 2420 | 28 | 628 | 541 | 5 | 0.39 | 0 |
| 6 | The Hound | 30/30/30 | 5 | 4386 | 47 | 695 | 541 | 5 | 0.43 | 0 |
| 7 | Keziah Mason | 30/30/30 | 5 | 4840 | 49 | 943 | 541 | 5 | 0.58 | 0 |
| 8 | The Unnamable | 30/30/30 | 5 | 5929 | 65 | 989 | 541 | 5 | 0.61 | 0 |
| 9 | The Colour Out of Space | 30/30/30 | 5 | 7115 | 89 | 1398 | 541 | 6 | 0.76 | 0 |
| 10 | The Black Man | 30/30/30 | 5 | 7851 | 131 | 1482 | 541 | 6 | 0.81 | 0 |
| 11 | The Haunter of the Dark | 30/30/30 | 5 | 3053 | 251 | 4007 | 541 | 6 | 2.18 | 0 |
| 12 | Wilbur Whateley | 30/30/30 | 5 | 4425 | 50 | 850 | 541 | 7 | 0.41 | 0 |
| 13 | The Gorgon of Medusa's Coil | 30/30/30 | 5 | 4487 | 70 | 1254 | 541 | 7 | 0.61 | 0 |
| 14 | The Whisperer in Akeley's Chair | 30/30/30 | 5 | 4487 | 56 | 652 | 541 | 7 | 0.32 | 0 |
| 15 | Edward Hutchinson | 30/30/30 | 5 | 4687 | 67 | 1120 | 541 | 7 | 0.54 | 0 |
| 16 | Simon Orne | 30/30/30 | 5 | 4687 | 64 | 1138 | 541 | 8 | 0.50 | 0 |
| 17 | The Horror at Martin's Beach | 30/30/30 | 5 | 5019 | 52 | 570 | 541 | 8 | 0.25 | 0 |
| 18 | The Terrible Old Man | 30/30/30 | 5 | 5019 | 85 | 1374 | 541 | 8 | 0.60 | 0 |
| 19 | Lilith | 30/30/30 | 5 | 5154 | 80 | 1447 | 541 | 8 | 0.64 | 0 |
| 20 | The Shunned House Entity | 30/30/30 | 5 | 5290 | 54 | 1622 | 541 | 9 | 0.65 | 0 |
| 21 | Joseph Curwen | 30/30/30 | 5 | 5875 | 76 | 1207 | 541 | 9 | 0.48 | 0 |
| 22 | The Dunwich Horror | 30/30/30 | 5 | 7878 | 105 | 2645 | 541 | 9 | 1.06 | 0 |
| 23 | Mother Hydra | 30/30/30 | 5 | 6646 | 75 | 2025 | 541 | 10 | 0.75 | 0 |
| 24 | Father Dagon | 30/30/30 | 5 | 6917 | 79 | 883 | 541 | 10 | 0.33 | 0 |
| 25 | Hypnos | 30/30/30 | 5 | 4998 | 63 | 820 | 541 | 10 | 0.30 | 0 |
| 26 | High Priest Not to Be Described | 30/30/30 | 5 | 6647 | 71 | 603 | 541 | 10 | 0.22 | 0 |
| 27 | The Colossus Beneath the Pyramids | 30/30/30 | 5 | 9963 | 145 | 3574 | 541 | 10 | 1.32 | 0 |
| 28 | Bokrug | 30/30/30 | 5 | 9587 | 145 | 2472 | 541 | 10 | 0.91 | 0 |
| 29 | Nug | 30/30/30 | 5 | 9587 | 134 | 3704 | 541 | 10 | 1.37 | 0 |
| 30 | Rhan-Tegoth | 30/30/30 | 5 | 9587 | 175 | 4254 | 541 | 10 | 1.57 | 0 |
| 31 | Yeb | 30/30/30 | 5 | 9587 | 124 | 3691 | 541 | 10 | 1.36 | 0 |
| 32 | The Great Ones | 30/30/30 | 5 | 10993 | 138 | 3184 | 541 | 10 | 1.18 | 0 |
| 33 | Yig | 30/30/30 | 5 | 10993 | 150 | 4589 | 541 | 10 | 1.70 | 0 |
| 34 | Tsathoggua | 30/30/30 | 5 | 11121 | 182 | 4135 | 541 | 10 | 1.53 | 0 |
| 35 | Ghatanothoa | 30/30/30 | 5 | 12400 | 381 | 4693 | 541 | 10 | 1.73 | 0 |
| 36 | Hastur | 30/30/30 | 5 | 13039 | 228 | 2937 | 541 | 10 | 1.09 | 0 |
| 37 | Cthulhu | 30/30/30 | 5 | 13678 | 175 | 4813 | 541 | 10 | 1.78 | 0 |
| 38 | The Thing Beyond Erich Zann's Window | 30/30/30 | 5 | 6473 | 61 | 741 | 541 | 10 | 0.27 | 0 |
| 39 | Zkauba the Wizard | 30/30/30 | 5 | 7007 | 136 | 2439 | 541 | 10 | 0.90 | 0 |
| 40 | The Other Gods | 30/30/30 | 5 | 9212 | 129 | 2972 | 541 | 10 | 1.10 | 0 |
| 41 | 'Umr at-Tawil | 30/30/30 | 5 | 9461 | 139 | 1332 | 541 | 10 | 0.49 | 0 |
| 42 | The Daemon Pipers | 30/30/30 | 5 | 9710 | 187 | 4464 | 541 | 10 | 1.65 | 0 |
| 43 | The Ancient Ones | 30/30/30 | 5 | 10083 | 103 | 1240 | 541 | 10 | 0.46 | 0 |
| 44 | Nyarlathotep | 30/30/30 | 5 | 12822 | 466 | 6946 | 541 | 10 | 2.57 | 0 |
| 45 | Shub-Niggurath | 30/30/30 | 5 | 13569 | 294 | 4906 | 541 | 10 | 1.81 | 0 |
| 46 | Yog-Sothoth | 30/30/30 | 5 | 15187 | 413 | 5823 | 541 | 10 | 2.15 | 0 |
| 47 | Azathoth | 30/30/30 | 5 | 16681 | 90 | 11646 | 541 | 10 | 4.31 | 0 |

## The opening

The same bot against the horrors of the first hours (the hub about the first Elder Sign, and Arkham), at the standing a new
player has there: only those two realms' lesser foes (60% of them, in step) and their own bosses before it have
given Echoes and star-stones. Each may cost at most 1.5 lives; the Colour is capped at 1.3 lives.

| # | Boss | Vig/End/Might | Cane + | Scaled health | Seconds | Taken | Our health | Doses | Lives | Deaths |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Dr. Muñoz | 1/0/1 | 0 | 913 | 64 | 385 | 176 | 4 | 0.84 | 0 |
| 2 | Charles le Sorcier | 3/1/2 | 1 | 1096 | 64 | 520 | 208 | 4 | 0.96 | 0 |
| 3 | The Outsider | 4/2/3 | 2 | 1521 | 56 | 370 | 224 | 4 | 0.63 | 0 |
| 4 | Brown Jenkin | 5/2/4 | 2 | 1137 | 139 | 771 | 240 | 4 | 1.24 | 0 |
| 5 | Ephraim Waite | 5/2/5 | 3 | 1308 | 44 | 472 | 240 | 5 | 0.66 | 0 |
| 6 | The Hound | 6/2/5 | 3 | 2387 | 89 | 749 | 256 | 5 | 0.97 | 0 |
| 7 | Keziah Mason | 6/3/5 | 4 | 2652 | 71 | 805 | 256 | 5 | 1.05 | 0 |
| 8 | The Unnamable | 6/3/6 | 4 | 3338 | 86 | 662 | 256 | 5 | 0.86 | 0 |
| 9 | The Colour Out of Space | 7/3/6 | 4 | 4032 | 143 | 1195 | 272 | 6 | 1.29 | 0 |
| 10 | The Black Man | 7/3/7 | 5 | 4566 | 168 | 1166 | 272 | 6 | 1.26 | 0 |
