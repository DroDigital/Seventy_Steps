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
| 1 | Brown Jenkin | 2/0/1 | 0 | 300 | 14 | 126 | 184 | 0.24 | 0 |
| 2 | Dr. Muñoz | 3/1/3 | 1 | 400 | 10 | 108 | 196 | 0.20 | 0 |
| 3 | The Terrible Old Man | 4/2/4 | 2 | 450 | 11 | 82 | 208 | 0.14 | 0 |
| 4 | Charles le Sorcier | 5/2/5 | 2 | 550 | 10 | 122 | 220 | 0.20 | 0 |
| 5 | The Hound | 6/2/5 | 3 | 550 | 8 | 137 | 232 | 0.21 | 0 |
| 6 | The Outsider | 6/3/6 | 3 | 550 | 7 | 31 | 232 | 0.05 | 0 |
| 7 | Ephraim Waite | 7/3/6 | 4 | 600 | 16 | 53 | 244 | 0.08 | 0 |
| 8 | Wilbur Whateley | 7/3/7 | 4 | 600 | 13 | 137 | 244 | 0.20 | 0 |
| 9 | Edward Hutchinson | 8/3/7 | 4 | 650 | 10 | 39 | 256 | 0.05 | 0 |
| 10 | Hypnos | 8/4/7 | 5 | 650 | 10 | 0 | 256 | 0.00 | 0 |
| 11 | Simon Orne | 8/4/8 | 5 | 650 | 7 | 93 | 256 | 0.13 | 0 |
| 12 | Keziah Mason | 9/4/8 | 5 | 700 | 10 | 108 | 268 | 0.14 | 0 |
| 13 | The Black Man | 9/4/9 | 5 | 750 | 15 | 66 | 268 | 0.09 | 0 |
| 14 | Lilith | 10/4/9 | 5 | 750 | 8 | 125 | 280 | 0.16 | 0 |
| 15 | The Shunned House Entity | 10/4/9 | 5 | 750 | 8 | 39 | 280 | 0.05 | 0 |
| 16 | Zkauba the Wizard | 10/5/9 | 5 | 750 | 10 | 100 | 280 | 0.13 | 0 |
| 17 | The Gorgon of Medusa's Coil | 10/5/10 | 5 | 800 | 14 | 0 | 280 | 0.00 | 0 |
| 18 | The Unnamable | 10/5/10 | 5 | 850 | 7 | 0 | 280 | 0.00 | 0 |
| 19 | The Whisperer in Akeley's Chair | 11/5/10 | 5 | 850 | 8 | 53 | 292 | 0.06 | 0 |
| 20 | The Thing Beyond Erich Zann's Window | 11/5/11 | 5 | 850 | 8 | 78 | 292 | 0.10 | 0 |
| 21 | Joseph Curwen | 11/5/11 | 5 | 900 | 10 | 86 | 292 | 0.11 | 0 |
| 22 | The Colour Out of Space | 12/5/11 | 5 | 1000 | 19 | 314 | 304 | 0.37 | 0 |
| 23 | High Priest Not to Be Described | 12/5/11 | 5 | 1000 | 12 | 64 | 304 | 0.08 | 0 |
| 24 | The Haunter of the Dark | 12/6/11 | 5 | 1050 | 178 | 3376 | 304 | 3.97 | 0 |
| 25 | The Daemon Pipers | 12/6/12 | 5 | 1200 | 11 | 170 | 304 | 0.20 | 0 |
| 26 | The Horror at Martin's Beach | 12/6/12 | 5 | 1200 | 14 | 82 | 304 | 0.10 | 0 |
| 27 | The Ancient Ones | 13/6/12 | 5 | 1550 | 20 | 351 | 316 | 0.40 | 0 |
| 28 | The Dunwich Horror | 13/6/12 | 5 | 1550 | 20 | 579 | 316 | 0.65 | 0 |
| 29 | The Colossus Beneath the Pyramids | 13/6/13 | 5 | 1650 | 14 | 474 | 316 | 0.54 | 0 |
| 30 | The Other Gods | 14/6/13 | 5 | 1900 | 27 | 623 | 328 | 0.68 | 0 |
| 31 | Nug | 14/6/13 | 5 | 2600 | 37 | 1170 | 328 | 1.27 | 0 |
| 32 | Rhan-Tegoth | 14/7/13 | 5 | 2600 | 42 | 1104 | 328 | 1.20 | 0 |
| 33 | Yeb | 14/7/14 | 5 | 2600 | 39 | 1157 | 328 | 1.26 | 0 |
| 34 | The Great Ones | 15/7/14 | 5 | 2950 | 48 | 2430 | 340 | 2.55 | 0 |
| 35 | Yig | 15/7/14 | 5 | 2950 | 44 | 2108 | 340 | 2.21 | 0 |
| 36 | Mother Hydra | 15/7/15 | 5 | 3100 | 24 | 1188 | 340 | 1.25 | 0 |
| 37 | Bokrug | 16/7/15 | 5 | 3250 | 52 | 1527 | 352 | 1.55 | 0 |
| 38 | Father Dagon | 16/8/15 | 5 | 3250 | 28 | 1217 | 352 | 1.23 | 0 |
| 39 | Tsathoggua | 16/8/16 | 5 | 3250 | 52 | 1841 | 352 | 1.87 | 0 |
| 40 | 'Umr at-Tawil | 16/8/16 | 5 | 3600 | 80 | 2322 | 352 | 2.36 | 0 |
| 41 | Hastur | 17/8/17 | 5 | 4200 | 55 | 1240 | 364 | 1.22 | 0 |
| 42 | Cthulhu | 18/8/17 | 5 | 4300 | 150 | 2963 | 376 | 2.81 | 0 |
| 43 | Ghatanothoa | 18/9/17 | 5 | 4850 | 82 | 1713 | 376 | 1.63 | 0 |
| 44 | Nyarlathotep | 18/9/18 | 5 | 5150 | 83 | 3027 | 376 | 2.88 | 0 |
| 45 | Shub-Niggurath | 19/9/18 | 5 | 5450 | 102 | 2427 | 388 | 2.23 | 0 |
| 46 | Yog-Sothoth | 20/9/19 | 5 | 6100 | 121 | 3868 | 400 | 3.45 | 0 |
| 47 | Azathoth | 20/10/19 | 5 | 6700 | 90 | 9960 | 400 | 8.89 | 0 |

Bounds held by the test: each boss finishes within 6 to 260 seconds, and costs at most 3 lives (a colossus, 6), and the bot does not die.

## The opening

The same bot against the horrors of the first hours (the hub about the first Elder Sign, and Arkham), at the standing a new
player has there: only those two realms' lesser foes (60% of them, in step) and their own bosses before it have
given Echoes and star-stones. Each may cost at most 1.5 lives.

| # | Boss | Vig/End/Might | Cane + | Health | Seconds | Taken | Our health | Lives | Deaths |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Brown Jenkin | 1/0/0 | 0 | 300 | 16 | 141 | 172 | 0.29 | 0 |
| 2 | Dr. Muñoz | 2/1/1 | 1 | 400 | 10 | 108 | 184 | 0.21 | 0 |
| 3 | Charles le Sorcier | 3/1/2 | 2 | 550 | 11 | 126 | 196 | 0.23 | 0 |
| 4 | The Hound | 4/1/3 | 2 | 550 | 11 | 169 | 208 | 0.29 | 0 |
| 5 | The Outsider | 4/2/3 | 3 | 550 | 7 | 31 | 208 | 0.05 | 0 |
| 6 | Ephraim Waite | 4/2/4 | 3 | 600 | 21 | 53 | 208 | 0.09 | 0 |
| 7 | Keziah Mason | 5/2/4 | 4 | 700 | 11 | 108 | 220 | 0.18 | 0 |
| 8 | The Black Man | 5/2/5 | 4 | 750 | 18 | 147 | 220 | 0.24 | 0 |
| 9 | The Unnamable | 6/2/5 | 4 | 850 | 10 | 96 | 232 | 0.15 | 0 |
| 10 | The Colour Out of Space | 6/3/5 | 5 | 1000 | 27 | 594 | 232 | 0.91 | 0 |
