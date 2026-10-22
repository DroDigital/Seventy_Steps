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

- Bosses gain 0.75% maximum health and 0.3% damage per purchased player level. Level one retains the authored stats;
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
| 1 | Dr. Muñoz | 1/0/1 | 0 | 558 | 21 | 193 | 172 | 4 | 0.43 | 0 |
| 2 | Charles le Sorcier | 3/1/2 | 1 | 627 | 19 | 262 | 196 | 4 | 0.51 | 0 |
| 3 | The Outsider | 4/2/3 | 2 | 1014 | 22 | 199 | 208 | 4 | 0.37 | 0 |
| 4 | Brown Jenkin | 5/2/4 | 2 | 704 | 28 | 238 | 220 | 4 | 0.42 | 0 |
| 5 | Ephraim Waite | 5/2/5 | 3 | 872 | 25 | 99 | 220 | 5 | 0.15 | 0 |
| 6 | Keziah Mason | 6/2/5 | 3 | 1207 | 26 | 312 | 232 | 5 | 0.45 | 0 |
| 7 | The Black Man | 6/3/5 | 4 | 1271 | 25 | 114 | 232 | 5 | 0.16 | 0 |
| 8 | The Colour Out of Space | 7/3/6 | 4 | 1288 | 29 | 635 | 244 | 5 | 0.87 | 0 |
| 9 | The Hound | 7/3/7 | 4 | 1635 | 25 | 375 | 244 | 6 | 0.45 | 0 |
| 10 | The Unnamable | 8/3/7 | 5 | 2270 | 29 | 517 | 256 | 6 | 0.59 | 0 |
| 11 | The Haunter of the Dark | 8/4/7 | 5 | 1200 | 168 | 3114 | 256 | 6 | 3.58 | 0 |
| 12 | The Terrible Old Man | 9/4/8 | 5 | 1331 | 26 | 290 | 268 | 7 | 0.28 | 0 |
| 13 | The Gorgon of Medusa's Coil | 9/4/9 | 5 | 1398 | 29 | 148 | 268 | 7 | 0.14 | 0 |
| 14 | The Horror at Martin's Beach | 10/4/9 | 5 | 1700 | 28 | 303 | 280 | 7 | 0.29 | 0 |
| 15 | Wilbur Whateley | 10/5/10 | 5 | 1841 | 27 | 555 | 280 | 7 | 0.52 | 0 |
| 16 | The Whisperer in Akeley's Chair | 11/5/10 | 5 | 1912 | 25 | 298 | 292 | 8 | 0.24 | 0 |
| 17 | Edward Hutchinson | 11/5/11 | 5 | 2044 | 37 | 420 | 292 | 8 | 0.34 | 0 |
| 18 | Simon Orne | 12/5/11 | 5 | 2057 | 31 | 669 | 304 | 8 | 0.52 | 0 |
| 19 | Lilith | 12/5/11 | 5 | 2299 | 34 | 657 | 304 | 8 | 0.51 | 0 |
| 20 | The Shunned House Entity | 12/6/11 | 5 | 2374 | 28 | 802 | 304 | 9 | 0.57 | 0 |
| 21 | Joseph Curwen | 12/6/12 | 5 | 2695 | 38 | 851 | 304 | 9 | 0.61 | 0 |
| 22 | The Dunwich Horror | 13/6/12 | 5 | 3636 | 41 | 1014 | 316 | 9 | 0.70 | 0 |
| 23 | Shub-Niggurath | 11/5/11 | 5 | 3728 | 86 | 778 | 292 | 10 | 0.53 | 0 |
| 24 | Mother Hydra | 11/5/11 | 5 | 4509 | 52 | 1322 | 292 | 10 | 0.91 | 0 |
| 25 | Father Dagon | 11/5/11 | 5 | 4690 | 62 | 1692 | 292 | 10 | 1.16 | 0 |
| 26 | Hypnos | 14/7/13 | 5 | 1631 | 35 | 155 | 328 | 10 | 0.09 | 0 |
| 27 | High Priest Not to Be Described | 16/7/15 | 5 | 3341 | 35 | 489 | 352 | 10 | 0.28 | 0 |
| 28 | The Colossus Beneath the Pyramids | 17/8/16 | 5 | 4315 | 46 | 1607 | 364 | 10 | 0.88 | 0 |
| 29 | The Other Gods | 16/7/15 | 5 | 4176 | 44 | 1120 | 352 | 10 | 0.64 | 0 |
| 30 | Ghatanothoa | 16/7/15 | 5 | 4626 | 83 | 843 | 352 | 10 | 0.48 | 0 |
| 31 | Bokrug | 16/7/15 | 5 | 4819 | 55 | 1580 | 352 | 10 | 0.90 | 0 |
| 32 | Nug | 16/7/15 | 5 | 4819 | 56 | 1617 | 352 | 10 | 0.92 | 0 |
| 33 | Rhan-Tegoth | 16/7/15 | 5 | 4819 | 57 | 1856 | 352 | 10 | 1.05 | 0 |
| 34 | Yeb | 16/7/15 | 5 | 4819 | 55 | 1875 | 352 | 10 | 1.07 | 0 |
| 35 | The Great Ones | 16/7/15 | 5 | 5526 | 68 | 2354 | 352 | 10 | 1.34 | 0 |
| 36 | Nyarlathotep | 16/7/15 | 5 | 5526 | 90 | 2308 | 352 | 10 | 1.31 | 0 |
| 37 | Yig | 16/7/15 | 5 | 5526 | 77 | 2468 | 352 | 10 | 1.40 | 0 |
| 38 | Tsathoggua | 16/7/15 | 5 | 5590 | 70 | 2048 | 352 | 10 | 1.16 | 0 |
| 39 | Cthulhu | 16/7/15 | 5 | 5975 | 87 | 1573 | 352 | 10 | 0.89 | 0 |
| 40 | Hastur | 16/7/15 | 5 | 6554 | 77 | 1531 | 352 | 10 | 0.87 | 0 |
| 41 | Zkauba the Wizard | 18/9/17 | 5 | 2993 | 44 | 1272 | 376 | 10 | 0.68 | 0 |
| 42 | The Thing Beyond Erich Zann's Window | 18/9/18 | 5 | 3477 | 37 | 462 | 376 | 10 | 0.25 | 0 |
| 43 | Yog-Sothoth | 18/9/17 | 5 | 3591 | 50 | 1464 | 376 | 10 | 0.78 | 0 |
| 44 | The Ancient Ones | 18/9/17 | 5 | 3791 | 40 | 476 | 376 | 10 | 0.25 | 0 |
| 45 | The Daemon Pipers | 18/9/17 | 5 | 4256 | 48 | 1262 | 376 | 10 | 0.67 | 0 |
| 46 | 'Umr at-Tawil | 18/9/17 | 5 | 4323 | 59 | 791 | 376 | 10 | 0.42 | 0 |
| 47 | Azathoth | 18/9/17 | 5 | 8911 | 90 | 10055 | 376 | 10 | 5.35 | 0 |

Bounds held by the test: each boss finishes within 6 to 260 seconds, and costs at most 3 lives (a colossus, 6; a Great Old One or an Outer God, 1.5), and the bot does not die.
Each tier has its band (round 61, raised in round 66): a named horror takes 14 to 50 seconds and costs 0.05 to 1.2 lives; one of the 16 great fights (a Great Old One or an Outer God of the sort that is a fight of its own) takes 35 to 100 seconds and costs 0.3 to 1.5 lives.

## The opening

The same bot against the horrors of the first hours (the hub about the first Elder Sign, and Arkham), at the standing a new
player has there: only those two realms' lesser foes (60% of them, in step) and their own bosses before it have
given Echoes and star-stones. Each may cost at most 1.5 lives.

| # | Boss | Vig/End/Might | Cane + | Scaled health | Seconds | Taken | Our health | Doses | Lives | Deaths |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Dr. Muñoz | 1/0/1 | 0 | 558 | 21 | 193 | 172 | 4 | 0.43 | 0 |
| 2 | Charles le Sorcier | 3/1/2 | 1 | 627 | 19 | 262 | 196 | 4 | 0.51 | 0 |
| 3 | The Outsider | 4/2/3 | 2 | 1014 | 22 | 199 | 208 | 4 | 0.37 | 0 |
| 4 | Brown Jenkin | 5/2/4 | 2 | 704 | 28 | 238 | 220 | 4 | 0.42 | 0 |
| 5 | Ephraim Waite | 5/2/5 | 3 | 872 | 25 | 99 | 220 | 5 | 0.15 | 0 |
| 6 | Keziah Mason | 6/2/5 | 3 | 1207 | 26 | 312 | 232 | 5 | 0.45 | 0 |
| 7 | The Black Man | 6/3/5 | 4 | 1271 | 25 | 114 | 232 | 5 | 0.16 | 0 |
| 8 | The Colour Out of Space | 7/3/6 | 4 | 1288 | 29 | 635 | 244 | 5 | 0.87 | 0 |
| 9 | The Hound | 7/3/7 | 4 | 1635 | 25 | 375 | 244 | 6 | 0.45 | 0 |
| 10 | The Unnamable | 8/3/7 | 5 | 2270 | 29 | 517 | 256 | 6 | 0.59 | 0 |
