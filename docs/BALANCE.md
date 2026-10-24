# The balance table

Written by `tests/balance.test.ts` (`BALANCE_WRITE=1 npm run audit`; round 25, playtest note 8). A bot fights each scripted boss
in the arena at the standing a person has when they reach it (`tests/balanceModel.ts`). Round 60: the world is open, so
the bosses are met ring by ring as it opens about the start (the university; Arkham; the waking world beyond it; the realms down
the stair and through its gates; Beyond the Gate). In each ring its lesser foes give 60% of their Echoes in step with its named
horrors and colossi, met the weak first, each slain giving most of its own; its gods may be met in any order, so each is met
halfway through its ring with no god's Echoes in hand. The Echoes are spent on levels as a person builds (Vigour and Might most,
Endurance less), and the star-stones the bosses leave are set into the sword-cane. The bot closes to the edge of the body and
strikes without pause, reads the wind-up of every blow and rolls from 55% of them, strikes down a servant or a phantom at
its elbow, takes the Alert's helm, keeps behind a monolith from a gaze that turns flesh to stone, and (round 58) drinks Laudanum
when the HUD calls for it, as a person is told to. It cannot be killed, and what it took is the tally. Each fight is the mean of
three, from 7, 10, 13 metres off (a bot's path through a fight is chaos), and a colossus is fought with the arena's middle pillars,
low walls and training dummy set aside: a body that wide finds no place to stand among them, as its own arena in the world has
nothing in its way.

- Bosses gain 0.75% maximum health and 0.3% damage per player level, a level counted by what it is worth (round 71, the soft caps: each attribute's levels count whole to 18, 50% from 19, 15% from 27: thirty are worth 22.6, so ninety bought are 67.8). Level one retains the authored stats;
  ordinary enemies, summons and spawning roots keep their existing stats. **Scaled health** is the boss's actual maximum in that run.
- **Seconds** is how long the boss took at that steady pace. A person strikes for perhaps a third of a fight, so their fight
  is about three times as long.
- **Lives** is the damage taken against the health a person has there and the Reagent they carry there (4 doses of 40% at the start, a vial more as the horrors fall, to 10):
  1 is a fight that spends all of it, for a bot that rolls from 55% of blows.
  A value above 1 exceeds the carried healing at this bot's dodge rate; these raw costs are never divided by the scaling factors.
- Ghatanothoa is fought with the gaze waived (its seconds scaled by the half of a fight in its sight), Shub-Niggurath with
  its roots down (forty seconds more, to cut them), and the Great Ones and 'Umr at-Tawil with the void under their hidden
  platforms shut (a person with insight keeps to the platforms): the bot plays those badly. Azathoth and the Haunter of the Dark are not held
  to the bounds: Azathoth is blind and cannot be wounded (the piping is outlasted, and what it costs the bot is the noise the bot
  makes), the Haunter is hurt only by lamplight (a person lures it to a lamp).


| # | Boss | Vig/End/Might | Cane + | Scaled health | Seconds | Taken | Our health | Doses | Lives | Deaths |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Dr. Muñoz | 1/0/1 | 0 | 558 | 21 | 210 | 172 | 4 | 0.47 | 0 |
| 2 | Charles le Sorcier | 3/1/2 | 1 | 627 | 20 | 188 | 196 | 4 | 0.37 | 0 |
| 3 | The Outsider | 4/2/3 | 2 | 1014 | 22 | 199 | 208 | 4 | 0.37 | 0 |
| 4 | Brown Jenkin | 5/2/4 | 2 | 704 | 28 | 238 | 220 | 4 | 0.42 | 0 |
| 5 | Ephraim Waite | 5/2/5 | 3 | 872 | 27 | 430 | 220 | 5 | 0.65 | 0 |
| 6 | Keziah Mason | 6/2/5 | 3 | 1207 | 26 | 312 | 232 | 5 | 0.45 | 0 |
| 7 | The Black Man | 6/3/5 | 4 | 1271 | 23 | 156 | 232 | 5 | 0.22 | 0 |
| 8 | The Colour Out of Space | 7/3/6 | 4 | 1288 | 27 | 601 | 244 | 5 | 0.82 | 0 |
| 9 | The Hound | 7/3/7 | 4 | 1635 | 25 | 375 | 244 | 6 | 0.45 | 0 |
| 10 | The Unnamable | 8/3/7 | 5 | 2270 | 29 | 517 | 256 | 6 | 0.59 | 0 |
| 11 | The Haunter of the Dark | 8/4/7 | 5 | 1200 | 169 | 2969 | 256 | 6 | 3.41 | 0 |
| 12 | The Terrible Old Man | 9/4/8 | 5 | 1331 | 24 | 255 | 268 | 7 | 0.25 | 0 |
| 13 | The Gorgon of Medusa's Coil | 9/4/9 | 5 | 1398 | 32 | 569 | 268 | 7 | 0.56 | 0 |
| 14 | The Horror at Martin's Beach | 10/4/9 | 5 | 1700 | 26 | 278 | 280 | 7 | 0.26 | 0 |
| 15 | Wilbur Whateley | 10/5/10 | 5 | 1841 | 22 | 369 | 280 | 7 | 0.35 | 0 |
| 16 | The Whisperer in Akeley's Chair | 11/5/10 | 5 | 1912 | 25 | 298 | 292 | 8 | 0.24 | 0 |
| 17 | Edward Hutchinson | 11/5/11 | 5 | 2044 | 37 | 420 | 292 | 8 | 0.34 | 0 |
| 18 | Simon Orne | 12/5/11 | 5 | 2057 | 31 | 669 | 304 | 8 | 0.52 | 0 |
| 19 | Lilith | 12/5/11 | 5 | 2299 | 34 | 657 | 304 | 8 | 0.51 | 0 |
| 20 | The Shunned House Entity | 12/6/11 | 5 | 2374 | 28 | 859 | 304 | 9 | 0.61 | 0 |
| 21 | Joseph Curwen | 12/6/12 | 5 | 2695 | 30 | 386 | 304 | 9 | 0.28 | 0 |
| 22 | The Dunwich Horror | 13/6/12 | 5 | 3636 | 41 | 1024 | 316 | 9 | 0.70 | 0 |
| 23 | Mother Hydra | 11/5/11 | 5 | 4509 | 52 | 1692 | 292 | 10 | 1.16 | 0 |
| 24 | Father Dagon | 11/5/11 | 5 | 4690 | 66 | 1818 | 292 | 10 | 1.25 | 0 |
| 25 | Hypnos | 14/7/13 | 5 | 1631 | 37 | 489 | 328 | 10 | 0.30 | 0 |
| 26 | High Priest Not to Be Described | 16/7/15 | 5 | 3341 | 37 | 354 | 352 | 10 | 0.20 | 0 |
| 27 | The Colossus Beneath the Pyramids | 17/8/16 | 5 | 4315 | 46 | 1607 | 364 | 10 | 0.88 | 0 |
| 28 | Ghatanothoa | 16/7/15 | 5 | 4626 | 91 | 812 | 352 | 10 | 0.46 | 0 |
| 29 | Bokrug | 16/7/15 | 5 | 4819 | 58 | 1714 | 352 | 10 | 0.97 | 0 |
| 30 | Nug | 16/7/15 | 5 | 4819 | 56 | 1617 | 352 | 10 | 0.92 | 0 |
| 31 | Rhan-Tegoth | 16/7/15 | 5 | 4819 | 57 | 1856 | 352 | 10 | 1.05 | 0 |
| 32 | Yeb | 16/7/15 | 5 | 4819 | 53 | 1145 | 352 | 10 | 0.65 | 0 |
| 33 | The Great Ones | 16/7/15 | 5 | 5526 | 64 | 1935 | 352 | 10 | 1.10 | 0 |
| 34 | Yig | 16/7/15 | 5 | 5526 | 59 | 2008 | 352 | 10 | 1.14 | 0 |
| 35 | Tsathoggua | 16/7/15 | 5 | 5590 | 74 | 2142 | 352 | 10 | 1.22 | 0 |
| 36 | Cthulhu | 16/7/15 | 5 | 5975 | 70 | 1411 | 352 | 10 | 0.80 | 0 |
| 37 | Hastur | 16/7/15 | 5 | 6554 | 74 | 1055 | 352 | 10 | 0.60 | 0 |
| 38 | Zkauba the Wizard | 18/8/17 | 5 | 2976 | 38 | 927 | 376 | 10 | 0.49 | 0 |
| 39 | The Thing Beyond Erich Zann's Window | 18/9/17 | 5 | 3458 | 40 | 538 | 376 | 10 | 0.29 | 0 |
| 40 | Yog-Sothoth | 18/9/17 | 5 | 3591 | 43 | 953 | 376 | 10 | 0.51 | 0 |
| 41 | The Ancient Ones | 18/9/17 | 5 | 3791 | 40 | 476 | 376 | 10 | 0.25 | 0 |
| 42 | Shub-Niggurath | 18/9/17 | 5 | 4123 | 84 | 983 | 376 | 10 | 0.52 | 0 |
| 43 | The Daemon Pipers | 18/9/17 | 5 | 4256 | 48 | 1262 | 376 | 10 | 0.67 | 0 |
| 44 | The Other Gods | 18/9/17 | 5 | 4323 | 40 | 1094 | 376 | 10 | 0.58 | 0 |
| 45 | 'Umr at-Tawil | 18/9/17 | 5 | 4855 | 88 | 1217 | 376 | 10 | 0.65 | 0 |
| 46 | Nyarlathotep | 18/9/17 | 5 | 5719 | 74 | 1462 | 376 | 10 | 0.78 | 0 |
| 47 | Azathoth | 18/9/17 | 5 | 8911 | 90 | 10055 | 376 | 10 | 5.35 | 0 |

Bounds held by the test: each boss finishes within 6 to 260 seconds, and costs at most 3 lives (a colossus, 6; a Great Old One or an Outer God, 1.5), and the bot does not die.
Each tier has its band (round 61, raised in round 68): a named horror takes 14 to 50 seconds and costs 0.2 to 1.2 lives; one of the 16 great fights (a Great Old One or an Outer God of the sort that is a fight of its own) takes 35 to 100 seconds and costs 0.45 to 1.5 lives.

## At the cap

The same bot, from 9 starts (6 to 14 metres off), with every level bought (30 Vigour, 30 Endurance, 30 Might, which the soft caps make 431 health, 281 stamina and blows of 1.90) and the cane at +5. The horrors have grown past what a person has when they meet them:
their health by the Might the investigator has beyond the standing above, and their blows by the Vigour (`overmatch` in `systems/bossScaling.ts`, `BOSS_OVERMATCH`). A named horror still takes at least 10 seconds and costs a bot 0.1 of a life; a great fight 30 and 0.4.

| # | Boss | Vig/End/Might | Cane + | Scaled health | Seconds | Taken | Our health | Doses | Lives | Deaths |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Dr. Muñoz | 30/30/30 | 5 | 1381 | 12 | 284 | 431 | 4 | 0.25 | 0 |
| 2 | Charles le Sorcier | 30/30/30 | 5 | 1458 | 10 | 261 | 431 | 4 | 0.23 | 0 |
| 3 | The Outsider | 30/30/30 | 5 | 2236 | 17 | 374 | 431 | 4 | 0.33 | 0 |
| 4 | Brown Jenkin | 30/30/30 | 5 | 1484 | 14 | 170 | 431 | 4 | 0.15 | 0 |
| 5 | Ephraim Waite | 30/30/30 | 5 | 1773 | 20 | 367 | 431 | 5 | 0.28 | 0 |
| 6 | Keziah Mason | 30/30/30 | 5 | 2438 | 17 | 426 | 431 | 5 | 0.33 | 0 |
| 7 | The Black Man | 30/30/30 | 5 | 2549 | 20 | 314 | 431 | 5 | 0.24 | 0 |
| 8 | The Colour Out of Space | 30/30/30 | 5 | 2478 | 20 | 849 | 431 | 5 | 0.66 | 0 |
| 9 | The Hound | 30/30/30 | 5 | 3040 | 21 | 462 | 431 | 6 | 0.32 | 0 |
| 10 | The Unnamable | 30/30/30 | 5 | 4194 | 28 | 601 | 431 | 6 | 0.41 | 0 |
| 11 | The Haunter of the Dark | 30/30/30 | 5 | 2202 | 203 | 6267 | 431 | 6 | 4.28 | 0 |
| 12 | The Terrible Old Man | 30/30/30 | 5 | 2349 | 23 | 490 | 431 | 7 | 0.30 | 0 |
| 13 | The Gorgon of Medusa's Coil | 30/30/30 | 5 | 2389 | 25 | 465 | 431 | 7 | 0.28 | 0 |
| 14 | The Horror at Martin's Beach | 30/30/30 | 5 | 2887 | 25 | 261 | 431 | 7 | 0.16 | 0 |
| 15 | Wilbur Whateley | 30/30/30 | 5 | 3012 | 26 | 606 | 431 | 7 | 0.37 | 0 |
| 16 | The Whisperer in Akeley's Chair | 30/30/30 | 5 | 3109 | 30 | 561 | 431 | 8 | 0.31 | 0 |
| 17 | Edward Hutchinson | 30/30/30 | 5 | 3226 | 30 | 581 | 431 | 8 | 0.32 | 0 |
| 18 | Simon Orne | 30/30/30 | 5 | 3226 | 30 | 817 | 431 | 8 | 0.45 | 0 |
| 19 | Lilith | 30/30/30 | 5 | 3605 | 40 | 991 | 431 | 8 | 0.55 | 0 |
| 20 | The Shunned House Entity | 30/30/30 | 5 | 3700 | 28 | 1104 | 431 | 9 | 0.56 | 0 |
| 21 | Joseph Curwen | 30/30/30 | 5 | 4079 | 33 | 574 | 431 | 9 | 0.29 | 0 |
| 22 | The Dunwich Horror | 30/30/30 | 5 | 5470 | 41 | 1448 | 431 | 9 | 0.73 | 0 |
| 23 | Mother Hydra | 30/30/30 | 5 | 7115 | 54 | 2569 | 431 | 10 | 1.19 | 0 |
| 24 | Father Dagon | 30/30/30 | 5 | 7400 | 62 | 2059 | 431 | 10 | 0.96 | 0 |
| 25 | Hypnos | 30/30/30 | 5 | 2357 | 29 | 444 | 431 | 10 | 0.21 | 0 |
| 26 | High Priest Not to Be Described | 30/30/30 | 5 | 4518 | 31 | 276 | 431 | 10 | 0.13 | 0 |
| 27 | The Colossus Beneath the Pyramids | 30/30/30 | 5 | 5619 | 45 | 1601 | 431 | 10 | 0.74 | 0 |
| 28 | Ghatanothoa | 30/30/30 | 5 | 6256 | 86 | 1097 | 431 | 10 | 0.51 | 0 |
| 29 | Bokrug | 30/30/30 | 5 | 6517 | 52 | 1850 | 431 | 10 | 0.86 | 0 |
| 30 | Nug | 30/30/30 | 5 | 6517 | 51 | 1969 | 431 | 10 | 0.91 | 0 |
| 31 | Rhan-Tegoth | 30/30/30 | 5 | 6517 | 50 | 1876 | 431 | 10 | 0.87 | 0 |
| 32 | Yeb | 30/30/30 | 5 | 6517 | 49 | 1486 | 431 | 10 | 0.69 | 0 |
| 33 | The Great Ones | 30/30/30 | 5 | 7473 | 60 | 2347 | 431 | 10 | 1.09 | 0 |
| 34 | Yig | 30/30/30 | 5 | 7473 | 65 | 2462 | 431 | 10 | 1.14 | 0 |
| 35 | Tsathoggua | 30/30/30 | 5 | 7559 | 64 | 2099 | 431 | 10 | 0.97 | 0 |
| 36 | Cthulhu | 30/30/30 | 5 | 8081 | 64 | 2039 | 431 | 10 | 0.95 | 0 |
| 37 | Hastur | 30/30/30 | 5 | 8863 | 74 | 1174 | 431 | 10 | 0.54 | 0 |
| 38 | Zkauba the Wizard | 30/30/30 | 5 | 3756 | 35 | 870 | 431 | 10 | 0.40 | 0 |
| 39 | The Thing Beyond Erich Zann's Window | 30/30/30 | 5 | 4340 | 34 | 365 | 431 | 10 | 0.17 | 0 |
| 40 | Yog-Sothoth | 30/30/30 | 5 | 4507 | 47 | 1492 | 431 | 10 | 0.69 | 0 |
| 41 | The Ancient Ones | 30/30/30 | 5 | 4758 | 37 | 522 | 431 | 10 | 0.24 | 0 |
| 42 | Shub-Niggurath | 30/30/30 | 5 | 5175 | 80 | 1018 | 431 | 10 | 0.47 | 0 |
| 43 | The Daemon Pipers | 30/30/30 | 5 | 5342 | 47 | 1309 | 431 | 10 | 0.61 | 0 |
| 44 | The Other Gods | 30/30/30 | 5 | 5426 | 40 | 1365 | 431 | 10 | 0.63 | 0 |
| 45 | 'Umr at-Tawil | 30/30/30 | 5 | 6093 | 67 | 1122 | 431 | 10 | 0.52 | 0 |
| 46 | Nyarlathotep | 30/30/30 | 5 | 7178 | 83 | 1646 | 431 | 10 | 0.76 | 0 |
| 47 | Azathoth | 30/30/30 | 5 | 11185 | 90 | 11986 | 431 | 10 | 5.56 | 0 |

## The opening

The same bot against the horrors of the first hours (the hub about the first Elder Sign, and Arkham), at the standing a new
player has there: only those two realms' lesser foes (60% of them, in step) and their own bosses before it have
given Echoes and star-stones. Each may cost at most 1.5 lives.

| # | Boss | Vig/End/Might | Cane + | Scaled health | Seconds | Taken | Our health | Doses | Lives | Deaths |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Dr. Muñoz | 1/0/1 | 0 | 558 | 21 | 210 | 172 | 4 | 0.47 | 0 |
| 2 | Charles le Sorcier | 3/1/2 | 1 | 627 | 20 | 188 | 196 | 4 | 0.37 | 0 |
| 3 | The Outsider | 4/2/3 | 2 | 1014 | 22 | 199 | 208 | 4 | 0.37 | 0 |
| 4 | Brown Jenkin | 5/2/4 | 2 | 704 | 28 | 238 | 220 | 4 | 0.42 | 0 |
| 5 | Ephraim Waite | 5/2/5 | 3 | 872 | 27 | 430 | 220 | 5 | 0.65 | 0 |
| 6 | Keziah Mason | 6/2/5 | 3 | 1207 | 26 | 312 | 232 | 5 | 0.45 | 0 |
| 7 | The Black Man | 6/3/5 | 4 | 1271 | 23 | 156 | 232 | 5 | 0.22 | 0 |
| 8 | The Colour Out of Space | 7/3/6 | 4 | 1288 | 27 | 601 | 244 | 5 | 0.82 | 0 |
| 9 | The Hound | 7/3/7 | 4 | 1635 | 25 | 375 | 244 | 6 | 0.45 | 0 |
| 10 | The Unnamable | 8/3/7 | 5 | 2270 | 29 | 517 | 256 | 6 | 0.59 | 0 |
