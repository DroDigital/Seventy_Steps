# The balance table

Written by `tests/balance.test.ts` (`BALANCE_WRITE=1 npm run audit`; round 25, playtest note 8). A bot fights each scripted boss
in the arena at the standing a person has when they reach it (`tests/balanceModel.ts`): the bosses are met in order of
their health, the world's lesser foes give 60% of their Echoes in step with them and each boss slain most of its
own; the Echoes are spent on levels as a person builds (Vigour and Might most, Endurance less), and the star-stones the
bosses leave are set into the sword-cane. The bot closes to the edge of the body and strikes without pause, reads the
wind-up of every blow and rolls from 55% of them, takes the Alert's helm, and keeps behind a monolith from a gaze that
turns flesh to stone. It cannot be killed, and what it took is the tally.

- **Seconds** is how long the boss took at that steady pace. A person strikes for perhaps a third of a fight, so their fight
  is about three times as long.
- **Lives** is the damage taken against the health a person has there and the Reagent they carry (4 doses of 45%):
  1 is a fight that spends all of it, for a bot that rolls from 55% of blows.
- Ghatanothoa is fought with the gaze waived (its seconds scaled by the half of a fight in its sight), and Shub-Niggurath with
  its roots down (forty seconds more, to cut them): the bot plays those badly. Azathoth and the Haunter of the Dark are not held
  to the bounds: Azathoth is blind and cannot be wounded (the piping is outlasted, and what it costs the bot is the noise the bot
  makes), the Haunter is hurt only by lamplight (a person lures it to a lamp).


| # | Boss | Vig/End/Might | Cane + | Health | Seconds | Taken | Our health | Lives | Deaths |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Brown Jenkin | 2/0/1 | 0 | 300 | 15 | 100 | 184 | 0.19 | 0 |
| 2 | Dr. Muñoz | 3/1/3 | 1 | 400 | 10 | 108 | 196 | 0.20 | 0 |
| 3 | The Terrible Old Man | 4/2/4 | 2 | 450 | 13 | 82 | 208 | 0.14 | 0 |
| 4 | Charles le Sorcier | 5/2/5 | 2 | 550 | 10 | 122 | 220 | 0.20 | 0 |
| 5 | The Hound | 6/2/5 | 3 | 550 | 10 | 201 | 232 | 0.31 | 0 |
| 6 | The Outsider | 6/3/6 | 3 | 550 | 7 | 31 | 232 | 0.05 | 0 |
| 7 | Ephraim Waite | 7/3/6 | 4 | 600 | 16 | 53 | 244 | 0.08 | 0 |
| 8 | Wilbur Whateley | 7/3/7 | 4 | 600 | 13 | 137 | 244 | 0.20 | 0 |
| 9 | Edward Hutchinson | 8/3/7 | 4 | 650 | 10 | 39 | 256 | 0.05 | 0 |
| 10 | Hypnos | 8/4/7 | 5 | 650 | 10 | 0 | 256 | 0.00 | 0 |
| 11 | Simon Orne | 8/4/8 | 5 | 650 | 7 | 93 | 256 | 0.13 | 0 |
| 12 | Keziah Mason | 9/4/8 | 5 | 700 | 10 | 89 | 268 | 0.12 | 0 |
| 13 | The Unnamable | 9/4/9 | 5 | 700 | 8 | 93 | 268 | 0.12 | 0 |
| 14 | The Black Man | 9/4/9 | 5 | 750 | 19 | 66 | 268 | 0.09 | 0 |
| 15 | Lilith | 10/4/9 | 5 | 750 | 8 | 125 | 280 | 0.16 | 0 |
| 16 | The Shunned House Entity | 10/5/9 | 5 | 750 | 9 | 119 | 280 | 0.15 | 0 |
| 17 | Zkauba the Wizard | 10/5/10 | 5 | 750 | 10 | 100 | 280 | 0.13 | 0 |
| 18 | The Gorgon of Medusa's Coil | 10/5/10 | 5 | 800 | 14 | 0 | 280 | 0.00 | 0 |
| 19 | The Whisperer in Akeley's Chair | 11/5/10 | 5 | 850 | 11 | 32 | 292 | 0.04 | 0 |
| 20 | The Thing Beyond Erich Zann's Window | 11/5/11 | 5 | 850 | 8 | 78 | 292 | 0.10 | 0 |
| 21 | Joseph Curwen | 11/5/11 | 5 | 900 | 12 | 105 | 292 | 0.13 | 0 |
| 22 | The Colour Out of Space | 12/5/11 | 5 | 1000 | 20 | 379 | 304 | 0.45 | 0 |
| 23 | High Priest Not to Be Described | 12/5/11 | 5 | 1000 | 10 | 62 | 304 | 0.07 | 0 |
| 24 | The Haunter of the Dark | 12/6/11 | 5 | 1050 | 109 | 2424 | 304 | 2.85 | 0 |
| 25 | The Daemon Pipers | 12/6/12 | 5 | 1200 | 11 | 170 | 304 | 0.20 | 0 |
| 26 | The Horror at Martin's Beach | 12/6/12 | 5 | 1200 | 14 | 82 | 304 | 0.10 | 0 |
| 27 | The Ancient Ones | 13/6/12 | 5 | 1550 | 17 | 142 | 316 | 0.16 | 0 |
| 28 | The Dunwich Horror | 13/6/12 | 5 | 1550 | 19 | 333 | 316 | 0.38 | 0 |
| 29 | The Colossus Beneath the Pyramids | 13/6/13 | 5 | 1650 | 11 | 474 | 316 | 0.54 | 0 |
| 30 | The Other Gods | 14/6/13 | 5 | 1900 | 27 | 623 | 328 | 0.68 | 0 |
| 31 | Nug | 14/6/13 | 5 | 2600 | 40 | 1598 | 328 | 1.74 | 0 |
| 32 | Rhan-Tegoth | 14/7/13 | 5 | 2600 | 35 | 1157 | 328 | 1.26 | 0 |
| 33 | Yeb | 14/7/14 | 5 | 2600 | 35 | 985 | 328 | 1.07 | 0 |
| 34 | The Great Ones | 15/7/14 | 5 | 2950 | 40 | 2037 | 340 | 2.14 | 0 |
| 35 | Yig | 15/7/14 | 5 | 2950 | 49 | 2438 | 340 | 2.56 | 0 |
| 36 | Mother Hydra | 15/7/15 | 5 | 3100 | 23 | 1151 | 340 | 1.21 | 0 |
| 37 | Bokrug | 16/7/15 | 5 | 3250 | 52 | 1977 | 352 | 2.01 | 0 |
| 38 | Father Dagon | 16/8/15 | 5 | 3250 | 37 | 1723 | 352 | 1.75 | 0 |
| 39 | Tsathoggua | 16/8/16 | 5 | 3250 | 52 | 2227 | 352 | 2.26 | 0 |
| 40 | 'Umr at-Tawil | 16/8/16 | 5 | 3600 | 63 | 2242 | 352 | 2.27 | 0 |
| 41 | Hastur | 17/8/17 | 5 | 4200 | 56 | 1209 | 364 | 1.19 | 0 |
| 42 | Cthulhu | 18/8/17 | 5 | 4300 | 167 | 4112 | 376 | 3.91 | 0 |
| 43 | Ghatanothoa | 18/9/17 | 5 | 4850 | 113 | 2153 | 376 | 2.05 | 0 |
| 44 | Nyarlathotep | 18/9/18 | 5 | 5150 | 76 | 2033 | 376 | 1.93 | 0 |
| 45 | Shub-Niggurath | 19/9/18 | 5 | 5450 | 109 | 2956 | 388 | 2.72 | 0 |
| 46 | Yog-Sothoth | 20/9/19 | 5 | 6100 | 133 | 4410 | 400 | 3.94 | 0 |
| 47 | Azathoth | 20/10/19 | 5 | 6700 | 90 | 9960 | 400 | 8.89 | 0 |

Bounds held by the test: each boss finishes within 6 to 260 seconds, and costs at most 3 lives (a colossus, 6), and the bot does not die.
