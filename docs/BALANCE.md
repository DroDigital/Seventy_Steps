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

- **Seconds** is how long the boss took at that steady pace. A person strikes for perhaps a third of a fight, so their fight
  is about three times as long.
- **Lives** is the damage taken against the health a person has there and the Reagent they carry (4 doses of 45%):
  1 is a fight that spends all of it, for a bot that rolls from 55% of blows.
- Ghatanothoa is fought with the gaze waived (its seconds scaled by the half of a fight in its sight), Shub-Niggurath with
  its roots down (forty seconds more, to cut them), and the Great Ones and 'Umr at-Tawil with the void under their hidden
  platforms shut (a person with insight keeps to the platforms): the bot plays those badly. Azathoth and the Haunter of the Dark are not held
  to the bounds: Azathoth is blind and cannot be wounded (the piping is outlasted, and what it costs the bot is the noise the bot
  makes), the Haunter is hurt only by lamplight (a person lures it to a lamp).


| # | Boss | Vig/End/Might | Cane + | Health | Seconds | Taken | Our health | Lives | Deaths |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Dr. Muñoz | 1/0/1 | 0 | 400 | 15 | 162 | 172 | 0.34 | 0 |
| 2 | Charles le Sorcier | 3/1/2 | 1 | 550 | 15 | 212 | 196 | 0.39 | 0 |
| 3 | The Outsider | 4/2/3 | 2 | 550 | 13 | 42 | 208 | 0.07 | 0 |
| 4 | Brown Jenkin | 5/2/4 | 2 | 300 | 10 | 81 | 220 | 0.13 | 0 |
| 5 | The Hound | 5/2/5 | 3 | 550 | 8 | 105 | 220 | 0.17 | 0 |
| 6 | Ephraim Waite | 6/2/5 | 3 | 600 | 17 | 30 | 232 | 0.05 | 0 |
| 7 | Keziah Mason | 6/3/5 | 4 | 700 | 11 | 124 | 232 | 0.19 | 0 |
| 8 | The Black Man | 6/3/6 | 4 | 750 | 15 | 34 | 232 | 0.05 | 0 |
| 9 | The Unnamable | 7/3/7 | 4 | 850 | 9 | 46 | 244 | 0.07 | 0 |
| 10 | The Colour Out of Space | 7/3/7 | 5 | 1000 | 18 | 361 | 244 | 0.53 | 0 |
| 11 | The Terrible Old Man | 8/4/7 | 5 | 450 | 11 | 75 | 256 | 0.11 | 0 |
| 12 | Wilbur Whateley | 8/4/8 | 5 | 600 | 10 | 99 | 256 | 0.14 | 0 |
| 13 | Edward Hutchinson | 9/4/9 | 5 | 650 | 10 | 75 | 268 | 0.10 | 0 |
| 14 | Simon Orne | 10/4/9 | 5 | 650 | 9 | 156 | 280 | 0.20 | 0 |
| 15 | Lilith | 10/5/9 | 5 | 750 | 11 | 183 | 280 | 0.23 | 0 |
| 16 | The Shunned House Entity | 10/5/10 | 5 | 750 | 9 | 135 | 280 | 0.17 | 0 |
| 17 | The Gorgon of Medusa's Coil | 11/5/10 | 5 | 800 | 17 | 30 | 292 | 0.04 | 0 |
| 18 | The Whisperer in Akeley's Chair | 11/5/11 | 5 | 850 | 10 | 54 | 292 | 0.07 | 0 |
| 19 | Joseph Curwen | 12/5/11 | 5 | 900 | 10 | 123 | 304 | 0.14 | 0 |
| 20 | The Haunter of the Dark | 12/6/11 | 5 | 1050 | 147 | 2715 | 304 | 3.19 | 0 |
| 21 | The Horror at Martin's Beach | 13/6/12 | 5 | 1200 | 22 | 102 | 316 | 0.12 | 0 |
| 22 | The Dunwich Horror | 13/6/12 | 5 | 1550 | 18 | 416 | 316 | 0.47 | 0 |
| 23 | Mother Hydra | 11/5/11 | 5 | 3100 | 30 | 596 | 292 | 0.73 | 0 |
| 24 | Father Dagon | 11/5/11 | 5 | 3250 | 37 | 601 | 292 | 0.74 | 0 |
| 25 | Shub-Niggurath | 11/5/11 | 5 | 3800 | 80 | 629 | 292 | 0.77 | 0 |
| 26 | Hypnos | 14/7/14 | 5 | 650 | 15 | 25 | 328 | 0.03 | 0 |
| 27 | High Priest Not to Be Described | 16/7/15 | 5 | 1000 | 9 | 106 | 352 | 0.11 | 0 |
| 28 | The Colossus Beneath the Pyramids | 17/8/17 | 5 | 1650 | 15 | 398 | 364 | 0.39 | 0 |
| 29 | The Other Gods | 16/8/15 | 5 | 1900 | 15 | 212 | 352 | 0.22 | 0 |
| 30 | Bokrug | 16/8/15 | 5 | 2600 | 30 | 689 | 352 | 0.70 | 0 |
| 31 | Nug | 16/8/15 | 5 | 2600 | 29 | 828 | 352 | 0.84 | 0 |
| 32 | Rhan-Tegoth | 16/8/15 | 5 | 2600 | 24 | 752 | 352 | 0.76 | 0 |
| 33 | Yeb | 16/8/15 | 5 | 2600 | 29 | 662 | 352 | 0.67 | 0 |
| 34 | The Great Ones | 16/8/15 | 5 | 2950 | 34 | 706 | 352 | 0.72 | 0 |
| 35 | Yig | 16/8/15 | 5 | 2950 | 29 | 751 | 352 | 0.76 | 0 |
| 36 | Tsathoggua | 16/8/15 | 5 | 3250 | 36 | 764 | 352 | 0.78 | 0 |
| 37 | Nyarlathotep | 16/8/15 | 5 | 4000 | 51 | 769 | 352 | 0.78 | 0 |
| 38 | Hastur | 16/8/15 | 5 | 4200 | 43 | 616 | 352 | 0.62 | 0 |
| 39 | Cthulhu | 16/8/15 | 5 | 4300 | 50 | 764 | 352 | 0.78 | 0 |
| 40 | Ghatanothoa | 16/8/15 | 5 | 4850 | 84 | 676 | 352 | 0.69 | 0 |
| 41 | Zkauba the Wizard | 18/9/17 | 5 | 750 | 7 | 70 | 376 | 0.07 | 0 |
| 42 | The Thing Beyond Erich Zann's Window | 18/9/18 | 5 | 850 | 6 | 17 | 376 | 0.02 | 0 |
| 43 | The Daemon Pipers | 18/9/18 | 5 | 1200 | 11 | 119 | 376 | 0.11 | 0 |
| 44 | The Ancient Ones | 18/9/18 | 5 | 1550 | 13 | 20 | 376 | 0.02 | 0 |
| 45 | 'Umr at-Tawil | 18/9/18 | 5 | 3600 | 47 | 619 | 376 | 0.59 | 0 |
| 46 | Yog-Sothoth | 18/9/18 | 5 | 4400 | 44 | 728 | 376 | 0.69 | 0 |
| 47 | Azathoth | 18/9/18 | 5 | 6700 | 90 | 8864 | 376 | 8.42 | 0 |

Bounds held by the test: each boss finishes within 6 to 260 seconds, and costs at most 3 lives (a colossus, 6; a Great Old One or an Outer God, 1), and the bot does not die.

## The opening

The same bot against the horrors of the first hours (the hub about the first Elder Sign, and Arkham), at the standing a new
player has there: only those two realms' lesser foes (60% of them, in step) and their own bosses before it have
given Echoes and star-stones. Each may cost at most 1.5 lives.

| # | Boss | Vig/End/Might | Cane + | Health | Seconds | Taken | Our health | Lives | Deaths |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Dr. Muñoz | 1/0/1 | 0 | 400 | 15 | 162 | 172 | 0.34 | 0 |
| 2 | Charles le Sorcier | 3/1/2 | 1 | 550 | 15 | 212 | 196 | 0.39 | 0 |
| 3 | The Outsider | 4/2/3 | 2 | 550 | 13 | 42 | 208 | 0.07 | 0 |
| 4 | Brown Jenkin | 5/2/4 | 2 | 300 | 10 | 81 | 220 | 0.13 | 0 |
| 5 | The Hound | 5/2/5 | 3 | 550 | 8 | 105 | 220 | 0.17 | 0 |
| 6 | Ephraim Waite | 6/2/5 | 3 | 600 | 17 | 30 | 232 | 0.05 | 0 |
| 7 | Keziah Mason | 6/3/5 | 4 | 700 | 11 | 124 | 232 | 0.19 | 0 |
| 8 | The Black Man | 6/3/6 | 4 | 750 | 15 | 34 | 232 | 0.05 | 0 |
| 9 | The Unnamable | 7/3/7 | 4 | 850 | 9 | 46 | 244 | 0.07 | 0 |
| 10 | The Colour Out of Space | 7/3/7 | 5 | 1000 | 18 | 361 | 244 | 0.53 | 0 |
