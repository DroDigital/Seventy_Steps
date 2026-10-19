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
| 1 | Brown Jenkin | 2/1/1 | 0 | 300 | 12 | 96 | 184 | 0.19 | 0 |
| 2 | Dr. Muñoz | 4/1/3 | 1 | 400 | 10 | 71 | 208 | 0.12 | 0 |
| 3 | The Terrible Old Man | 4/2/4 | 2 | 450 | 13 | 112 | 208 | 0.19 | 0 |
| 4 | Charles le Sorcier | 5/2/5 | 2 | 550 | 10 | 76 | 220 | 0.12 | 0 |
| 5 | The Hound | 6/3/5 | 3 | 550 | 8 | 129 | 232 | 0.20 | 0 |
| 6 | The Outsider | 6/3/6 | 3 | 550 | 7 | 28 | 232 | 0.04 | 0 |
| 7 | Ephraim Waite | 7/3/6 | 4 | 600 | 16 | 0 | 244 | 0.00 | 0 |
| 8 | Wilbur Whateley | 7/3/7 | 4 | 600 | 10 | 85 | 244 | 0.12 | 0 |
| 9 | Edward Hutchinson | 8/3/7 | 4 | 650 | 11 | 60 | 256 | 0.08 | 0 |
| 10 | Hypnos | 8/4/7 | 5 | 650 | 10 | 0 | 256 | 0.00 | 0 |
| 11 | Simon Orne | 8/4/8 | 5 | 650 | 8 | 93 | 256 | 0.13 | 0 |
| 12 | Keziah Mason | 9/4/8 | 5 | 700 | 8 | 119 | 268 | 0.16 | 0 |
| 13 | The Black Man | 9/4/9 | 5 | 750 | 10 | 62 | 268 | 0.08 | 0 |
| 14 | Lilith | 10/4/9 | 5 | 750 | 9 | 158 | 280 | 0.20 | 0 |
| 15 | The Shunned House Entity | 10/5/9 | 5 | 750 | 8 | 75 | 280 | 0.10 | 0 |
| 16 | Zkauba the Wizard | 10/5/9 | 5 | 750 | 10 | 114 | 280 | 0.15 | 0 |
| 17 | The Gorgon of Medusa's Coil | 10/5/10 | 5 | 800 | 22 | 45 | 280 | 0.06 | 0 |
| 18 | The Unnamable | 11/5/10 | 5 | 850 | 7 | 0 | 292 | 0.00 | 0 |
| 19 | The Whisperer in Akeley's Chair | 11/5/10 | 5 | 850 | 8 | 51 | 292 | 0.06 | 0 |
| 20 | The Thing Beyond Erich Zann's Window | 11/5/11 | 5 | 850 | 7 | 51 | 292 | 0.06 | 0 |
| 21 | Joseph Curwen | 11/5/11 | 5 | 900 | 10 | 101 | 292 | 0.12 | 0 |
| 22 | The Colour Out of Space | 12/5/11 | 5 | 1000 | 18 | 218 | 304 | 0.26 | 0 |
| 23 | High Priest Not to Be Described | 12/6/11 | 5 | 1000 | 10 | 80 | 304 | 0.09 | 0 |
| 24 | The Haunter of the Dark | 12/6/11 | 5 | 1050 | 99 | 2099 | 304 | 2.47 | 0 |
| 25 | The Daemon Pipers | 12/6/12 | 5 | 1200 | 11 | 190 | 304 | 0.22 | 0 |
| 26 | The Horror at Martin's Beach | 13/6/12 | 5 | 1200 | 16 | 80 | 316 | 0.09 | 0 |
| 27 | The Ancient Ones | 13/6/12 | 5 | 1550 | 17 | 60 | 316 | 0.07 | 0 |
| 28 | The Dunwich Horror | 13/6/13 | 5 | 1550 | 17 | 360 | 316 | 0.41 | 0 |
| 29 | The Colossus Beneath the Pyramids | 13/6/13 | 5 | 1650 | 11 | 349 | 316 | 0.39 | 0 |
| 30 | The Other Gods | 14/6/13 | 5 | 1900 | 17 | 331 | 328 | 0.36 | 0 |
| 31 | Bokrug | 14/7/13 | 5 | 2600 | 30 | 685 | 328 | 0.75 | 0 |
| 32 | Nug | 14/7/14 | 5 | 2600 | 31 | 764 | 328 | 0.83 | 0 |
| 33 | Rhan-Tegoth | 14/7/14 | 5 | 2600 | 34 | 816 | 328 | 0.89 | 0 |
| 34 | Yeb | 15/7/14 | 5 | 2600 | 27 | 598 | 340 | 0.63 | 0 |
| 35 | The Great Ones | 15/7/15 | 5 | 2950 | 36 | 1518 | 340 | 1.59 | 0 |
| 36 | Yig | 16/7/15 | 5 | 2950 | 32 | 1029 | 352 | 1.04 | 0 |
| 37 | Mother Hydra | 16/7/15 | 5 | 3100 | 18 | 737 | 352 | 0.75 | 0 |
| 38 | Father Dagon | 16/8/15 | 5 | 3250 | 27 | 1205 | 352 | 1.22 | 0 |
| 39 | Tsathoggua | 16/8/16 | 5 | 3250 | 38 | 1150 | 352 | 1.17 | 0 |
| 40 | 'Umr at-Tawil | 17/8/16 | 5 | 3600 | 63 | 1433 | 364 | 1.41 | 0 |
| 41 | Hastur | 17/8/17 | 5 | 4200 | 46 | 1195 | 364 | 1.17 | 0 |
| 42 | Cthulhu | 18/8/17 | 5 | 4300 | 89 | 1563 | 376 | 1.48 | 0 |
| 43 | Ghatanothoa | 18/9/17 | 5 | 4850 | 73 | 1122 | 376 | 1.07 | 0 |
| 44 | Nyarlathotep | 18/9/18 | 5 | 5150 | 50 | 1622 | 376 | 1.54 | 0 |
| 45 | Shub-Niggurath | 19/9/19 | 5 | 5450 | 83 | 1637 | 388 | 1.51 | 0 |
| 46 | Yog-Sothoth | 20/9/19 | 5 | 6100 | 84 | 2689 | 400 | 2.40 | 0 |
| 47 | Azathoth | 20/10/19 | 5 | 6700 | 90 | 8864 | 400 | 7.91 | 0 |

Bounds held by the test: each boss finishes within 6 to 260 seconds, and costs at most 3 lives (a colossus, 6), and the bot does not die.

## The opening

The same bot against the horrors of the first hours (the hub about the first Elder Sign, and Arkham), at the standing a new
player has there: only those two realms' lesser foes (60% of them, in step) and their own bosses before it have
given Echoes and star-stones. Each may cost at most 1.5 lives.

| # | Boss | Vig/End/Might | Cane + | Health | Seconds | Taken | Our health | Lives | Deaths |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Brown Jenkin | 1/0/0 | 0 | 300 | 13 | 119 | 172 | 0.25 | 0 |
| 2 | Dr. Muñoz | 2/1/1 | 1 | 400 | 10 | 88 | 184 | 0.17 | 0 |
| 3 | Charles le Sorcier | 3/1/2 | 2 | 550 | 11 | 76 | 196 | 0.14 | 0 |
| 4 | The Hound | 3/1/3 | 2 | 550 | 11 | 161 | 196 | 0.29 | 0 |
| 5 | The Outsider | 4/2/3 | 3 | 550 | 7 | 28 | 208 | 0.05 | 0 |
| 6 | Ephraim Waite | 4/2/4 | 3 | 600 | 17 | 46 | 208 | 0.08 | 0 |
| 7 | Keziah Mason | 5/2/4 | 4 | 700 | 10 | 102 | 220 | 0.17 | 0 |
| 8 | The Black Man | 5/2/5 | 4 | 750 | 15 | 62 | 220 | 0.10 | 0 |
| 9 | The Unnamable | 6/2/5 | 4 | 850 | 10 | 45 | 232 | 0.07 | 0 |
| 10 | The Colour Out of Space | 6/3/5 | 5 | 1000 | 20 | 340 | 232 | 0.52 | 0 |
