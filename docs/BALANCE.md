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
| 1 | Dr. Muñoz | 1/0/1 | 0 | 609 | 22 | 196 | 172 | 4 | 0.44 | 0 |
| 2 | Charles le Sorcier | 3/1/2 | 1 | 721 | 22 | 299 | 196 | 4 | 0.59 | 0 |
| 3 | The Outsider | 4/2/3 | 2 | 1014 | 22 | 231 | 208 | 4 | 0.43 | 0 |
| 4 | Brown Jenkin | 5/2/4 | 2 | 758 | 29 | 237 | 220 | 4 | 0.41 | 0 |
| 5 | Ephraim Waite | 5/2/5 | 3 | 872 | 24 | 361 | 220 | 5 | 0.55 | 0 |
| 6 | Keziah Mason | 6/2/5 | 3 | 1207 | 21 | 305 | 232 | 5 | 0.44 | 0 |
| 7 | The Colour Out of Space | 6/3/5 | 4 | 1271 | 28 | 555 | 232 | 5 | 0.80 | 0 |
| 8 | The Hound | 7/3/6 | 4 | 1624 | 24 | 309 | 244 | 5 | 0.42 | 0 |
| 9 | The Unnamable | 7/3/7 | 4 | 2255 | 34 | 453 | 244 | 6 | 0.55 | 0 |
| 10 | The Black Man | 7/3/7 | 5 | 3044 | 48 | 365 | 244 | 6 | 0.44 | 0 |
| 11 | The Haunter of the Dark | 8/4/7 | 5 | 1200 | 196 | 3281 | 256 | 6 | 3.77 | 0 |
| 12 | Wilbur Whateley | 9/4/8 | 5 | 1794 | 21 | 335 | 268 | 7 | 0.33 | 0 |
| 13 | The Gorgon of Medusa's Coil | 9/4/9 | 5 | 1864 | 29 | 436 | 268 | 7 | 0.43 | 0 |
| 14 | The Whisperer in Akeley's Chair | 10/4/9 | 5 | 1876 | 25 | 233 | 280 | 7 | 0.22 | 0 |
| 15 | Edward Hutchinson | 10/5/10 | 5 | 2019 | 35 | 531 | 280 | 7 | 0.50 | 0 |
| 16 | Simon Orne | 11/5/10 | 5 | 2032 | 30 | 642 | 292 | 8 | 0.52 | 0 |
| 17 | The Horror at Martin's Beach | 11/5/11 | 5 | 2225 | 34 | 254 | 292 | 8 | 0.21 | 0 |
| 18 | The Terrible Old Man | 12/5/11 | 5 | 2239 | 34 | 564 | 304 | 8 | 0.44 | 0 |
| 19 | Lilith | 12/5/11 | 5 | 2299 | 34 | 743 | 304 | 8 | 0.58 | 0 |
| 20 | The Shunned House Entity | 12/6/11 | 5 | 2374 | 28 | 826 | 304 | 9 | 0.59 | 0 |
| 21 | Joseph Curwen | 12/6/12 | 5 | 2695 | 33 | 424 | 304 | 9 | 0.30 | 0 |
| 22 | The Dunwich Horror | 13/6/12 | 5 | 3636 | 45 | 1125 | 316 | 9 | 0.77 | 0 |
| 23 | Mother Hydra | 11/5/11 | 5 | 4509 | 57 | 2007 | 292 | 10 | 1.37 | 0 |
| 24 | Father Dagon | 11/5/11 | 5 | 4690 | 61 | 1511 | 292 | 10 | 1.03 | 0 |
| 25 | Hypnos | 14/7/13 | 5 | 2385 | 32 | 374 | 328 | 10 | 0.23 | 0 |
| 26 | High Priest Not to Be Described | 16/7/15 | 5 | 3341 | 32 | 406 | 352 | 10 | 0.23 | 0 |
| 27 | The Colossus Beneath the Pyramids | 17/8/16 | 5 | 5165 | 53 | 1801 | 364 | 10 | 0.99 | 0 |
| 28 | Bokrug | 16/7/15 | 5 | 4819 | 54 | 1735 | 352 | 10 | 0.99 | 0 |
| 29 | Nug | 16/7/15 | 5 | 4819 | 54 | 1624 | 352 | 10 | 0.92 | 0 |
| 30 | Rhan-Tegoth | 16/7/15 | 5 | 4819 | 59 | 2044 | 352 | 10 | 1.16 | 0 |
| 31 | Yeb | 16/7/15 | 5 | 4819 | 49 | 1130 | 352 | 10 | 0.64 | 0 |
| 32 | The Great Ones | 16/7/15 | 5 | 5526 | 62 | 2122 | 352 | 10 | 1.21 | 0 |
| 33 | Yig | 16/7/15 | 5 | 5526 | 59 | 1659 | 352 | 10 | 0.94 | 0 |
| 34 | Tsathoggua | 16/7/15 | 5 | 5590 | 70 | 1837 | 352 | 10 | 1.04 | 0 |
| 35 | Ghatanothoa | 16/7/15 | 5 | 6232 | 118 | 1174 | 352 | 10 | 0.67 | 0 |
| 36 | Hastur | 16/7/15 | 5 | 6554 | 71 | 1113 | 352 | 10 | 0.63 | 0 |
| 37 | Cthulhu | 16/7/15 | 5 | 6875 | 65 | 2125 | 352 | 10 | 1.21 | 0 |
| 38 | The Thing Beyond Erich Zann's Window | 18/8/17 | 5 | 3439 | 37 | 462 | 376 | 10 | 0.25 | 0 |
| 39 | Zkauba the Wizard | 18/9/18 | 5 | 3812 | 46 | 1069 | 376 | 10 | 0.57 | 0 |
| 40 | The Other Gods | 18/9/17 | 5 | 4921 | 49 | 1420 | 376 | 10 | 0.76 | 0 |
| 41 | 'Umr at-Tawil | 18/9/17 | 5 | 5054 | 65 | 883 | 376 | 10 | 0.47 | 0 |
| 42 | The Daemon Pipers | 18/9/17 | 5 | 5187 | 59 | 1421 | 376 | 10 | 0.76 | 0 |
| 43 | The Ancient Ones | 18/9/17 | 5 | 5387 | 63 | 826 | 376 | 10 | 0.44 | 0 |
| 44 | Nyarlathotep | 18/9/17 | 5 | 6850 | 103 | 1833 | 376 | 10 | 0.98 | 0 |
| 45 | Shub-Niggurath | 18/9/17 | 5 | 7249 | 120 | 1571 | 376 | 10 | 0.84 | 0 |
| 46 | Yog-Sothoth | 18/9/17 | 5 | 8113 | 147 | 4296 | 376 | 10 | 2.29 | 0 |
| 47 | Azathoth | 18/9/17 | 5 | 8911 | 90 | 10055 | 376 | 10 | 5.35 | 0 |

Bounds held by the test: each boss finishes within 6 to 260 seconds, and costs at most 3 lives (a colossus, 6; a Great Old One or an Outer God, 1.5), and the bot does not die.
Each tier has its band (round 61, raised in round 68): a named horror takes 14 to 50 seconds and costs 0.2 to 1.2 lives; one of the 16 great fights (a Great Old One or an Outer God of the sort that is a fight of its own) takes 35 to 100 seconds and costs 0.45 to 1.5 lives.

## At the cap

The same bot, from 9 starts (6 to 14 metres off), with every level bought (30 Vigour, 30 Endurance, 30 Might, which the soft caps make 431 health, 281 stamina and blows of 1.90) and the cane at +5. The horrors have grown past what a person has when they meet them:
their health by the Might the investigator has beyond the standing above, and their blows by the Vigour (`overmatch` in `systems/bossScaling.ts`, `BOSS_OVERMATCH`). A named horror still takes at least 10 seconds and costs a bot 0.1 of a life; a great fight 30 and 0.4.

| # | Boss | Vig/End/Might | Cane + | Scaled health | Seconds | Taken | Our health | Doses | Lives | Deaths |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Dr. Muñoz | 30/30/30 | 5 | 1507 | 11 | 257 | 431 | 4 | 0.23 | 0 |
| 2 | Charles le Sorcier | 30/30/30 | 5 | 1676 | 11 | 230 | 431 | 4 | 0.21 | 0 |
| 3 | The Outsider | 30/30/30 | 5 | 2236 | 17 | 299 | 431 | 4 | 0.27 | 0 |
| 4 | Brown Jenkin | 30/30/30 | 5 | 1598 | 15 | 211 | 431 | 4 | 0.19 | 0 |
| 5 | Ephraim Waite | 30/30/30 | 5 | 1773 | 16 | 226 | 431 | 5 | 0.17 | 0 |
| 6 | Keziah Mason | 30/30/30 | 5 | 2438 | 17 | 452 | 431 | 5 | 0.35 | 0 |
| 7 | The Colour Out of Space | 30/30/30 | 5 | 2549 | 20 | 846 | 431 | 5 | 0.65 | 0 |
| 8 | The Hound | 30/30/30 | 5 | 3124 | 22 | 457 | 431 | 5 | 0.35 | 0 |
| 9 | The Unnamable | 30/30/30 | 5 | 4194 | 28 | 654 | 431 | 6 | 0.45 | 0 |
| 10 | The Black Man | 30/30/30 | 5 | 5661 | 53 | 698 | 431 | 6 | 0.48 | 0 |
| 11 | The Haunter of the Dark | 30/30/30 | 5 | 2202 | 206 | 5668 | 431 | 6 | 3.87 | 0 |
| 12 | Wilbur Whateley | 30/30/30 | 5 | 3166 | 24 | 560 | 431 | 7 | 0.34 | 0 |
| 13 | The Gorgon of Medusa's Coil | 30/30/30 | 5 | 3186 | 33 | 705 | 431 | 7 | 0.43 | 0 |
| 14 | The Whisperer in Akeley's Chair | 30/30/30 | 5 | 3186 | 28 | 406 | 431 | 7 | 0.25 | 0 |
| 15 | Edward Hutchinson | 30/30/30 | 5 | 3303 | 28 | 602 | 431 | 7 | 0.37 | 0 |
| 16 | Simon Orne | 30/30/30 | 5 | 3303 | 30 | 789 | 431 | 8 | 0.44 | 0 |
| 17 | The Horror at Martin's Beach | 30/30/30 | 5 | 3510 | 32 | 313 | 431 | 8 | 0.17 | 0 |
| 18 | The Terrible Old Man | 30/30/30 | 5 | 3510 | 35 | 785 | 431 | 8 | 0.43 | 0 |
| 19 | Lilith | 30/30/30 | 5 | 3605 | 40 | 1079 | 431 | 8 | 0.60 | 0 |
| 20 | The Shunned House Entity | 30/30/30 | 5 | 3700 | 27 | 1168 | 431 | 9 | 0.59 | 0 |
| 21 | Joseph Curwen | 30/30/30 | 5 | 4079 | 33 | 476 | 431 | 9 | 0.24 | 0 |
| 22 | The Dunwich Horror | 30/30/30 | 5 | 5470 | 42 | 1245 | 431 | 9 | 0.63 | 0 |
| 23 | Mother Hydra | 30/30/30 | 5 | 7115 | 59 | 2823 | 431 | 10 | 1.31 | 0 |
| 24 | Father Dagon | 30/30/30 | 5 | 7400 | 58 | 1823 | 431 | 10 | 0.85 | 0 |
| 25 | Hypnos | 30/30/30 | 5 | 3445 | 44 | 742 | 431 | 10 | 0.34 | 0 |
| 26 | High Priest Not to Be Described | 30/30/30 | 5 | 4518 | 33 | 391 | 431 | 10 | 0.18 | 0 |
| 27 | The Colossus Beneath the Pyramids | 30/30/30 | 5 | 6726 | 51 | 1950 | 431 | 10 | 0.90 | 0 |
| 28 | Bokrug | 30/30/30 | 5 | 6517 | 49 | 1849 | 431 | 10 | 0.86 | 0 |
| 29 | Nug | 30/30/30 | 5 | 6517 | 50 | 1807 | 431 | 10 | 0.84 | 0 |
| 30 | Rhan-Tegoth | 30/30/30 | 5 | 6517 | 49 | 1846 | 431 | 10 | 0.86 | 0 |
| 31 | Yeb | 30/30/30 | 5 | 6517 | 50 | 1407 | 431 | 10 | 0.65 | 0 |
| 32 | The Great Ones | 30/30/30 | 5 | 7473 | 59 | 2425 | 431 | 10 | 1.13 | 0 |
| 33 | Yig | 30/30/30 | 5 | 7473 | 56 | 2020 | 431 | 10 | 0.94 | 0 |
| 34 | Tsathoggua | 30/30/30 | 5 | 7559 | 67 | 2240 | 431 | 10 | 1.04 | 0 |
| 35 | Ghatanothoa | 30/30/30 | 5 | 8428 | 115 | 1625 | 431 | 10 | 0.75 | 0 |
| 36 | Hastur | 30/30/30 | 5 | 8863 | 68 | 1135 | 431 | 10 | 0.53 | 0 |
| 37 | Cthulhu | 30/30/30 | 5 | 9297 | 65 | 2243 | 431 | 10 | 1.04 | 0 |
| 38 | The Thing Beyond Erich Zann's Window | 30/30/30 | 5 | 4340 | 33 | 380 | 431 | 10 | 0.18 | 0 |
| 39 | Zkauba the Wizard | 30/30/30 | 5 | 4667 | 42 | 1087 | 431 | 10 | 0.50 | 0 |
| 40 | The Other Gods | 30/30/30 | 5 | 6177 | 45 | 1392 | 431 | 10 | 0.65 | 0 |
| 41 | 'Umr at-Tawil | 30/30/30 | 5 | 6344 | 77 | 1205 | 431 | 10 | 0.56 | 0 |
| 42 | The Daemon Pipers | 30/30/30 | 5 | 6511 | 56 | 1760 | 431 | 10 | 0.82 | 0 |
| 43 | The Ancient Ones | 30/30/30 | 5 | 6761 | 61 | 951 | 431 | 10 | 0.44 | 0 |
| 44 | Nyarlathotep | 30/30/30 | 5 | 8597 | 102 | 2170 | 431 | 10 | 1.01 | 0 |
| 45 | Shub-Niggurath | 30/30/30 | 5 | 9098 | 111 | 1701 | 431 | 10 | 0.79 | 0 |
| 46 | Yog-Sothoth | 30/30/30 | 5 | 10183 | 140 | 4471 | 431 | 10 | 2.07 | 0 |
| 47 | Azathoth | 30/30/30 | 5 | 11185 | 90 | 11986 | 431 | 10 | 5.56 | 0 |

## The opening

The same bot against the horrors of the first hours (the hub about the first Elder Sign, and Arkham), at the standing a new
player has there: only those two realms' lesser foes (60% of them, in step) and their own bosses before it have
given Echoes and star-stones. Each may cost at most 1.5 lives.

| # | Boss | Vig/End/Might | Cane + | Scaled health | Seconds | Taken | Our health | Doses | Lives | Deaths |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Dr. Muñoz | 1/0/1 | 0 | 609 | 22 | 196 | 172 | 4 | 0.44 | 0 |
| 2 | Charles le Sorcier | 3/1/2 | 1 | 721 | 22 | 299 | 196 | 4 | 0.59 | 0 |
| 3 | The Outsider | 4/2/3 | 2 | 1014 | 22 | 231 | 208 | 4 | 0.43 | 0 |
| 4 | Brown Jenkin | 5/2/4 | 2 | 758 | 29 | 237 | 220 | 4 | 0.41 | 0 |
| 5 | Ephraim Waite | 5/2/5 | 3 | 872 | 24 | 361 | 220 | 5 | 0.55 | 0 |
| 6 | Keziah Mason | 6/2/5 | 3 | 1207 | 21 | 305 | 232 | 5 | 0.44 | 0 |
| 7 | The Colour Out of Space | 6/3/5 | 4 | 1271 | 28 | 555 | 232 | 5 | 0.80 | 0 |
| 8 | The Hound | 7/3/6 | 4 | 1624 | 24 | 309 | 244 | 5 | 0.42 | 0 |
| 9 | The Unnamable | 7/3/7 | 4 | 2255 | 34 | 453 | 244 | 6 | 0.55 | 0 |
| 10 | The Black Man | 7/3/7 | 5 | 3044 | 48 | 365 | 244 | 6 | 0.44 | 0 |
