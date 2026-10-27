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
| 1 | Dr. Muñoz | 1/0/1 | 0 | 558 | 20 | 162 | 172 | 4 | 0.36 | 0 |
| 2 | Charles le Sorcier | 3/1/2 | 1 | 721 | 22 | 299 | 196 | 4 | 0.59 | 0 |
| 3 | The Outsider | 4/2/3 | 2 | 1014 | 22 | 231 | 208 | 4 | 0.43 | 0 |
| 4 | Brown Jenkin | 5/2/4 | 2 | 704 | 29 | 220 | 220 | 4 | 0.39 | 0 |
| 5 | Ephraim Waite | 5/2/5 | 3 | 872 | 24 | 361 | 220 | 5 | 0.55 | 0 |
| 6 | Keziah Mason | 6/2/5 | 3 | 1207 | 21 | 305 | 232 | 5 | 0.44 | 0 |
| 7 | The Colour Out of Space | 6/3/5 | 4 | 1271 | 28 | 555 | 232 | 5 | 0.80 | 0 |
| 8 | The Hound | 7/3/6 | 4 | 1624 | 24 | 309 | 244 | 5 | 0.42 | 0 |
| 9 | The Black Man | 7/3/7 | 4 | 1691 | 31 | 269 | 244 | 6 | 0.32 | 0 |
| 10 | The Unnamable | 8/3/7 | 5 | 2270 | 29 | 410 | 256 | 6 | 0.47 | 0 |
| 11 | The Haunter of the Dark | 8/4/7 | 5 | 1200 | 196 | 3281 | 256 | 6 | 3.77 | 0 |
| 12 | The Terrible Old Man | 9/4/8 | 5 | 1331 | 21 | 253 | 268 | 7 | 0.25 | 0 |
| 13 | The Gorgon of Medusa's Coil | 9/4/9 | 5 | 1398 | 22 | 374 | 268 | 7 | 0.37 | 0 |
| 14 | Wilbur Whateley | 10/4/9 | 5 | 1817 | 22 | 331 | 280 | 7 | 0.31 | 0 |
| 15 | The Whisperer in Akeley's Chair | 10/5/9 | 5 | 1888 | 27 | 309 | 280 | 7 | 0.29 | 0 |
| 16 | Edward Hutchinson | 11/5/10 | 5 | 2032 | 35 | 532 | 292 | 8 | 0.43 | 0 |
| 17 | Simon Orne | 11/5/10 | 5 | 2032 | 30 | 642 | 292 | 8 | 0.52 | 0 |
| 18 | The Horror at Martin's Beach | 11/5/11 | 5 | 2225 | 34 | 254 | 292 | 8 | 0.21 | 0 |
| 19 | Lilith | 12/5/11 | 5 | 2299 | 34 | 743 | 304 | 8 | 0.58 | 0 |
| 20 | The Shunned House Entity | 12/6/11 | 5 | 2374 | 28 | 826 | 304 | 9 | 0.59 | 0 |
| 21 | Joseph Curwen | 12/6/12 | 5 | 2695 | 33 | 424 | 304 | 9 | 0.30 | 0 |
| 22 | The Dunwich Horror | 13/6/12 | 5 | 3636 | 45 | 1125 | 316 | 9 | 0.77 | 0 |
| 23 | Mother Hydra | 11/5/11 | 5 | 4509 | 57 | 2007 | 292 | 10 | 1.37 | 0 |
| 24 | Father Dagon | 11/5/11 | 5 | 4690 | 61 | 1511 | 292 | 10 | 1.03 | 0 |
| 25 | Hypnos | 14/7/13 | 5 | 2385 | 32 | 374 | 328 | 10 | 0.23 | 0 |
| 26 | High Priest Not to Be Described | 16/7/15 | 5 | 3341 | 32 | 406 | 352 | 10 | 0.23 | 0 |
| 27 | The Colossus Beneath the Pyramids | 17/8/16 | 5 | 4315 | 43 | 1358 | 364 | 10 | 0.75 | 0 |
| 28 | Ghatanothoa | 16/7/15 | 5 | 4626 | 85 | 796 | 352 | 10 | 0.45 | 0 |
| 29 | Bokrug | 16/7/15 | 5 | 4819 | 54 | 1735 | 352 | 10 | 0.99 | 0 |
| 30 | Nug | 16/7/15 | 5 | 4819 | 54 | 1624 | 352 | 10 | 0.92 | 0 |
| 31 | Rhan-Tegoth | 16/7/15 | 5 | 4819 | 59 | 2044 | 352 | 10 | 1.16 | 0 |
| 32 | Yeb | 16/7/15 | 5 | 4819 | 49 | 1130 | 352 | 10 | 0.64 | 0 |
| 33 | The Great Ones | 16/7/15 | 5 | 5526 | 62 | 2122 | 352 | 10 | 1.21 | 0 |
| 34 | Yig | 16/7/15 | 5 | 5526 | 59 | 1659 | 352 | 10 | 0.94 | 0 |
| 35 | Tsathoggua | 16/7/15 | 5 | 5590 | 70 | 1837 | 352 | 10 | 1.04 | 0 |
| 36 | Cthulhu | 16/7/15 | 5 | 5975 | 58 | 1775 | 352 | 10 | 1.01 | 0 |
| 37 | Hastur | 16/7/15 | 5 | 6554 | 71 | 1113 | 352 | 10 | 0.63 | 0 |
| 38 | Zkauba the Wizard | 18/8/17 | 5 | 2976 | 36 | 837 | 376 | 10 | 0.45 | 0 |
| 39 | The Thing Beyond Erich Zann's Window | 18/9/18 | 5 | 3477 | 37 | 385 | 376 | 10 | 0.20 | 0 |
| 40 | Yog-Sothoth | 18/9/17 | 5 | 3591 | 44 | 1017 | 376 | 10 | 0.54 | 0 |
| 41 | The Ancient Ones | 18/9/17 | 5 | 3791 | 47 | 633 | 376 | 10 | 0.34 | 0 |
| 42 | The Daemon Pipers | 18/9/17 | 5 | 4256 | 48 | 1200 | 376 | 10 | 0.64 | 0 |
| 43 | The Other Gods | 18/9/17 | 5 | 4323 | 45 | 1247 | 376 | 10 | 0.66 | 0 |
| 44 | Shub-Niggurath | 18/9/17 | 5 | 4788 | 84 | 859 | 376 | 10 | 0.46 | 0 |
| 45 | 'Umr at-Tawil | 18/9/17 | 5 | 4855 | 65 | 1025 | 376 | 10 | 0.55 | 0 |
| 46 | Nyarlathotep | 18/9/17 | 5 | 5719 | 83 | 1558 | 376 | 10 | 0.83 | 0 |
| 47 | Azathoth | 18/9/17 | 5 | 8911 | 90 | 10055 | 376 | 10 | 5.35 | 0 |

Bounds held by the test: each boss finishes within 6 to 260 seconds, and costs at most 3 lives (a colossus, 6; a Great Old One or an Outer God, 1.5), and the bot does not die.
Each tier has its band (round 61, raised in round 68): a named horror takes 14 to 50 seconds and costs 0.2 to 1.2 lives; one of the 16 great fights (a Great Old One or an Outer God of the sort that is a fight of its own) takes 35 to 100 seconds and costs 0.45 to 1.5 lives.

## At the cap

The same bot, from 9 starts (6 to 14 metres off), with every level bought (30 Vigour, 30 Endurance, 30 Might, which the soft caps make 431 health, 281 stamina and blows of 1.90) and the cane at +5. The horrors have grown past what a person has when they meet them:
their health by the Might the investigator has beyond the standing above, and their blows by the Vigour (`overmatch` in `systems/bossScaling.ts`, `BOSS_OVERMATCH`). A named horror still takes at least 10 seconds and costs a bot 0.1 of a life; a great fight 30 and 0.4.

| # | Boss | Vig/End/Might | Cane + | Scaled health | Seconds | Taken | Our health | Doses | Lives | Deaths |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Dr. Muñoz | 30/30/30 | 5 | 1381 | 10 | 251 | 431 | 4 | 0.22 | 0 |
| 2 | Charles le Sorcier | 30/30/30 | 5 | 1676 | 11 | 230 | 431 | 4 | 0.21 | 0 |
| 3 | The Outsider | 30/30/30 | 5 | 2236 | 17 | 299 | 431 | 4 | 0.27 | 0 |
| 4 | Brown Jenkin | 30/30/30 | 5 | 1484 | 16 | 205 | 431 | 4 | 0.18 | 0 |
| 5 | Ephraim Waite | 30/30/30 | 5 | 1773 | 16 | 226 | 431 | 5 | 0.17 | 0 |
| 6 | Keziah Mason | 30/30/30 | 5 | 2438 | 17 | 452 | 431 | 5 | 0.35 | 0 |
| 7 | The Colour Out of Space | 30/30/30 | 5 | 2549 | 20 | 846 | 431 | 5 | 0.65 | 0 |
| 8 | The Hound | 30/30/30 | 5 | 3124 | 22 | 457 | 431 | 5 | 0.35 | 0 |
| 9 | The Black Man | 30/30/30 | 5 | 3145 | 26 | 306 | 431 | 6 | 0.21 | 0 |
| 10 | The Unnamable | 30/30/30 | 5 | 4194 | 28 | 628 | 431 | 6 | 0.43 | 0 |
| 11 | The Haunter of the Dark | 30/30/30 | 5 | 2202 | 206 | 5668 | 431 | 6 | 3.87 | 0 |
| 12 | The Terrible Old Man | 30/30/30 | 5 | 2349 | 20 | 368 | 431 | 7 | 0.22 | 0 |
| 13 | The Gorgon of Medusa's Coil | 30/30/30 | 5 | 2389 | 23 | 444 | 431 | 7 | 0.27 | 0 |
| 14 | Wilbur Whateley | 30/30/30 | 5 | 3086 | 25 | 562 | 431 | 7 | 0.34 | 0 |
| 15 | The Whisperer in Akeley's Chair | 30/30/30 | 5 | 3186 | 28 | 406 | 431 | 7 | 0.25 | 0 |
| 16 | Edward Hutchinson | 30/30/30 | 5 | 3303 | 28 | 582 | 431 | 8 | 0.32 | 0 |
| 17 | Simon Orne | 30/30/30 | 5 | 3303 | 30 | 789 | 431 | 8 | 0.44 | 0 |
| 18 | The Horror at Martin's Beach | 30/30/30 | 5 | 3510 | 32 | 313 | 431 | 8 | 0.17 | 0 |
| 19 | Lilith | 30/30/30 | 5 | 3605 | 40 | 1079 | 431 | 8 | 0.60 | 0 |
| 20 | The Shunned House Entity | 30/30/30 | 5 | 3700 | 27 | 1168 | 431 | 9 | 0.59 | 0 |
| 21 | Joseph Curwen | 30/30/30 | 5 | 4079 | 33 | 476 | 431 | 9 | 0.24 | 0 |
| 22 | The Dunwich Horror | 30/30/30 | 5 | 5470 | 42 | 1245 | 431 | 9 | 0.63 | 0 |
| 23 | Mother Hydra | 30/30/30 | 5 | 7115 | 59 | 2823 | 431 | 10 | 1.31 | 0 |
| 24 | Father Dagon | 30/30/30 | 5 | 7400 | 58 | 1823 | 431 | 10 | 0.85 | 0 |
| 25 | Hypnos | 30/30/30 | 5 | 3445 | 44 | 742 | 431 | 10 | 0.34 | 0 |
| 26 | High Priest Not to Be Described | 30/30/30 | 5 | 4518 | 33 | 391 | 431 | 10 | 0.18 | 0 |
| 27 | The Colossus Beneath the Pyramids | 30/30/30 | 5 | 5619 | 45 | 1579 | 431 | 10 | 0.73 | 0 |
| 28 | Ghatanothoa | 30/30/30 | 5 | 6256 | 80 | 1104 | 431 | 10 | 0.51 | 0 |
| 29 | Bokrug | 30/30/30 | 5 | 6517 | 49 | 1849 | 431 | 10 | 0.86 | 0 |
| 30 | Nug | 30/30/30 | 5 | 6517 | 50 | 1807 | 431 | 10 | 0.84 | 0 |
| 31 | Rhan-Tegoth | 30/30/30 | 5 | 6517 | 49 | 1846 | 431 | 10 | 0.86 | 0 |
| 32 | Yeb | 30/30/30 | 5 | 6517 | 50 | 1407 | 431 | 10 | 0.65 | 0 |
| 33 | The Great Ones | 30/30/30 | 5 | 7473 | 59 | 2425 | 431 | 10 | 1.13 | 0 |
| 34 | Yig | 30/30/30 | 5 | 7473 | 56 | 2020 | 431 | 10 | 0.94 | 0 |
| 35 | Tsathoggua | 30/30/30 | 5 | 7559 | 67 | 2240 | 431 | 10 | 1.04 | 0 |
| 36 | Cthulhu | 30/30/30 | 5 | 8081 | 54 | 1572 | 431 | 10 | 0.73 | 0 |
| 37 | Hastur | 30/30/30 | 5 | 8863 | 68 | 1135 | 431 | 10 | 0.53 | 0 |
| 38 | Zkauba the Wizard | 30/30/30 | 5 | 3756 | 36 | 840 | 431 | 10 | 0.39 | 0 |
| 39 | The Thing Beyond Erich Zann's Window | 30/30/30 | 5 | 4258 | 32 | 376 | 431 | 10 | 0.17 | 0 |
| 40 | Yog-Sothoth | 30/30/30 | 5 | 4507 | 46 | 1470 | 431 | 10 | 0.68 | 0 |
| 41 | The Ancient Ones | 30/30/30 | 5 | 4758 | 37 | 539 | 431 | 10 | 0.25 | 0 |
| 42 | The Daemon Pipers | 30/30/30 | 5 | 5342 | 45 | 1383 | 431 | 10 | 0.64 | 0 |
| 43 | The Other Gods | 30/30/30 | 5 | 5426 | 39 | 1181 | 431 | 10 | 0.55 | 0 |
| 44 | Shub-Niggurath | 30/30/30 | 5 | 6010 | 85 | 992 | 431 | 10 | 0.46 | 0 |
| 45 | 'Umr at-Tawil | 30/30/30 | 5 | 6093 | 69 | 906 | 431 | 10 | 0.42 | 0 |
| 46 | Nyarlathotep | 30/30/30 | 5 | 7178 | 79 | 1475 | 431 | 10 | 0.68 | 0 |
| 47 | Azathoth | 30/30/30 | 5 | 11185 | 90 | 11986 | 431 | 10 | 5.56 | 0 |

## The opening

The same bot against the horrors of the first hours (the hub about the first Elder Sign, and Arkham), at the standing a new
player has there: only those two realms' lesser foes (60% of them, in step) and their own bosses before it have
given Echoes and star-stones. Each may cost at most 1.5 lives.

| # | Boss | Vig/End/Might | Cane + | Scaled health | Seconds | Taken | Our health | Doses | Lives | Deaths |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Dr. Muñoz | 1/0/1 | 0 | 558 | 20 | 162 | 172 | 4 | 0.36 | 0 |
| 2 | Charles le Sorcier | 3/1/2 | 1 | 721 | 22 | 299 | 196 | 4 | 0.59 | 0 |
| 3 | The Outsider | 4/2/3 | 2 | 1014 | 22 | 231 | 208 | 4 | 0.43 | 0 |
| 4 | Brown Jenkin | 5/2/4 | 2 | 704 | 29 | 220 | 220 | 4 | 0.39 | 0 |
| 5 | Ephraim Waite | 5/2/5 | 3 | 872 | 24 | 361 | 220 | 5 | 0.55 | 0 |
| 6 | Keziah Mason | 6/2/5 | 3 | 1207 | 21 | 305 | 232 | 5 | 0.44 | 0 |
| 7 | The Colour Out of Space | 6/3/5 | 4 | 1271 | 28 | 555 | 232 | 5 | 0.80 | 0 |
| 8 | The Hound | 7/3/6 | 4 | 1624 | 24 | 309 | 244 | 5 | 0.42 | 0 |
| 9 | The Black Man | 7/3/7 | 4 | 1691 | 31 | 269 | 244 | 6 | 0.32 | 0 |
| 10 | The Unnamable | 8/3/7 | 5 | 2270 | 29 | 410 | 256 | 6 | 0.47 | 0 |
