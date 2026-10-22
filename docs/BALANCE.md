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
- **Lives** is the damage taken against the health a person has there and the Reagent they carry there (4 doses of 40% at the start, a vial more as the horrors fall, to 10):
  1 is a fight that spends all of it, for a bot that rolls from 55% of blows.
- Ghatanothoa is fought with the gaze waived (its seconds scaled by the half of a fight in its sight), Shub-Niggurath with
  its roots down (forty seconds more, to cut them), and the Great Ones and 'Umr at-Tawil with the void under their hidden
  platforms shut (a person with insight keeps to the platforms): the bot plays those badly. Azathoth and the Haunter of the Dark are not held
  to the bounds: Azathoth is blind and cannot be wounded (the piping is outlasted, and what it costs the bot is the noise the bot
  makes), the Haunter is hurt only by lamplight (a person lures it to a lamp).


| # | Boss | Vig/End/Might | Cane + | Health | Seconds | Taken | Our health | Doses | Lives | Deaths |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Dr. Muñoz | 1/0/1 | 0 | 550 | 19 | 191 | 172 | 4 | 0.43 | 0 |
| 2 | Charles le Sorcier | 3/1/2 | 1 | 600 | 19 | 260 | 196 | 4 | 0.51 | 0 |
| 3 | The Outsider | 4/2/3 | 2 | 950 | 21 | 189 | 208 | 4 | 0.35 | 0 |
| 4 | Brown Jenkin | 5/2/4 | 2 | 650 | 23 | 209 | 220 | 4 | 0.36 | 0 |
| 5 | Ephraim Waite | 5/2/5 | 3 | 800 | 23 | 96 | 220 | 5 | 0.15 | 0 |
| 6 | Keziah Mason | 6/2/5 | 3 | 1100 | 23 | 273 | 232 | 5 | 0.39 | 0 |
| 7 | The Black Man | 6/3/5 | 4 | 1150 | 22 | 75 | 232 | 5 | 0.11 | 0 |
| 8 | The Colour Out of Space | 7/3/6 | 4 | 1150 | 27 | 546 | 244 | 5 | 0.75 | 0 |
| 9 | The Hound | 7/3/7 | 4 | 1450 | 21 | 323 | 244 | 6 | 0.39 | 0 |
| 10 | The Unnamable | 8/3/7 | 5 | 2000 | 24 | 325 | 256 | 6 | 0.37 | 0 |
| 11 | The Haunter of the Dark | 8/4/7 | 5 | 1050 | 158 | 2812 | 256 | 6 | 3.23 | 0 |
| 12 | The Terrible Old Man | 9/4/8 | 5 | 1150 | 21 | 269 | 268 | 7 | 0.26 | 0 |
| 13 | The Gorgon of Medusa's Coil | 9/4/9 | 5 | 1200 | 26 | 90 | 268 | 7 | 0.09 | 0 |
| 14 | The Horror at Martin's Beach | 10/4/9 | 5 | 1450 | 23 | 228 | 280 | 7 | 0.21 | 0 |
| 15 | Wilbur Whateley | 10/5/10 | 5 | 1550 | 23 | 419 | 280 | 7 | 0.39 | 0 |
| 16 | The Whisperer in Akeley's Chair | 11/5/10 | 5 | 1600 | 21 | 179 | 292 | 8 | 0.15 | 0 |
| 17 | Edward Hutchinson | 11/5/11 | 5 | 1700 | 23 | 244 | 292 | 8 | 0.20 | 0 |
| 18 | Simon Orne | 12/5/11 | 5 | 1700 | 26 | 507 | 304 | 8 | 0.40 | 0 |
| 19 | Lilith | 12/5/11 | 5 | 1900 | 28 | 530 | 304 | 8 | 0.42 | 0 |
| 20 | The Shunned House Entity | 12/6/11 | 5 | 1950 | 21 | 514 | 304 | 9 | 0.37 | 0 |
| 21 | Joseph Curwen | 12/6/12 | 5 | 2200 | 32 | 713 | 304 | 9 | 0.51 | 0 |
| 22 | The Dunwich Horror | 13/6/12 | 5 | 2950 | 34 | 789 | 316 | 9 | 0.54 | 0 |
| 23 | Shub-Niggurath | 11/5/11 | 5 | 3100 | 72 | 497 | 292 | 10 | 0.34 | 0 |
| 24 | Mother Hydra | 11/5/11 | 5 | 3750 | 38 | 1045 | 292 | 10 | 0.72 | 0 |
| 25 | Father Dagon | 11/5/11 | 5 | 3900 | 44 | 1126 | 292 | 10 | 0.77 | 0 |
| 26 | Hypnos | 14/7/13 | 5 | 1650 | 35 | 141 | 328 | 10 | 0.09 | 0 |
| 27 | High Priest Not to Be Described | 16/7/15 | 5 | 2600 | 27 | 344 | 352 | 10 | 0.20 | 0 |
| 28 | The Colossus Beneath the Pyramids | 17/8/16 | 5 | 3950 | 37 | 1275 | 364 | 10 | 0.70 | 0 |
| 29 | Ghatanothoa | 16/7/15 | 5 | 3600 | 67 | 870 | 352 | 10 | 0.49 | 0 |
| 30 | The Other Gods | 16/7/15 | 5 | 3700 | 38 | 922 | 352 | 10 | 0.52 | 0 |
| 31 | Bokrug | 16/7/15 | 5 | 3750 | 48 | 1137 | 352 | 10 | 0.65 | 0 |
| 32 | Nug | 16/7/15 | 5 | 3750 | 43 | 1115 | 352 | 10 | 0.63 | 0 |
| 33 | Rhan-Tegoth | 16/7/15 | 5 | 3750 | 42 | 1308 | 352 | 10 | 0.74 | 0 |
| 34 | Yeb | 16/7/15 | 5 | 3750 | 41 | 1240 | 352 | 10 | 0.70 | 0 |
| 35 | The Great Ones | 16/7/15 | 5 | 4300 | 51 | 1489 | 352 | 10 | 0.85 | 0 |
| 36 | Nyarlathotep | 16/7/15 | 5 | 4300 | 55 | 1187 | 352 | 10 | 0.67 | 0 |
| 37 | Yig | 16/7/15 | 5 | 4300 | 55 | 1587 | 352 | 10 | 0.90 | 0 |
| 38 | Tsathoggua | 16/7/15 | 5 | 4350 | 63 | 1810 | 352 | 10 | 1.03 | 0 |
| 39 | Hastur | 16/7/15 | 5 | 5100 | 53 | 813 | 352 | 10 | 0.46 | 0 |
| 40 | Cthulhu | 16/7/15 | 5 | 5350 | 53 | 1427 | 352 | 10 | 0.81 | 0 |
| 41 | The Thing Beyond Erich Zann's Window | 18/9/17 | 5 | 2600 | 26 | 176 | 376 | 10 | 0.09 | 0 |
| 42 | Zkauba the Wizard | 18/9/18 | 5 | 2850 | 41 | 1027 | 376 | 10 | 0.55 | 0 |
| 43 | 'Umr at-Tawil | 18/9/17 | 5 | 3800 | 52 | 743 | 376 | 10 | 0.40 | 0 |
| 44 | The Daemon Pipers | 18/9/17 | 5 | 3900 | 43 | 973 | 376 | 10 | 0.52 | 0 |
| 45 | The Ancient Ones | 18/9/17 | 5 | 4050 | 47 | 624 | 376 | 10 | 0.33 | 0 |
| 46 | Yog-Sothoth | 18/9/17 | 5 | 5200 | 54 | 1197 | 376 | 10 | 0.64 | 0 |
| 47 | Azathoth | 18/9/17 | 5 | 6700 | 90 | 8864 | 376 | 10 | 4.71 | 0 |

Bounds held by the test: each boss finishes within 6 to 260 seconds, and costs at most 3 lives (a colossus, 6; a Great Old One or an Outer God, 1.3), and the bot does not die.
Each tier has its band (round 61, raised in round 66): a named horror takes 14 to 50 seconds and costs 0.05 to 1.2 lives; one of the 16 great fights (a Great Old One or an Outer God of the sort that is a fight of its own) takes 35 to 100 seconds and costs 0.3 to 1.3 lives.

## The opening

The same bot against the horrors of the first hours (the hub about the first Elder Sign, and Arkham), at the standing a new
player has there: only those two realms' lesser foes (60% of them, in step) and their own bosses before it have
given Echoes and star-stones. Each may cost at most 1.5 lives.

| # | Boss | Vig/End/Might | Cane + | Health | Seconds | Taken | Our health | Doses | Lives | Deaths |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Dr. Muñoz | 1/0/1 | 0 | 550 | 19 | 191 | 172 | 4 | 0.43 | 0 |
| 2 | Charles le Sorcier | 3/1/2 | 1 | 600 | 19 | 260 | 196 | 4 | 0.51 | 0 |
| 3 | The Outsider | 4/2/3 | 2 | 950 | 21 | 189 | 208 | 4 | 0.35 | 0 |
| 4 | Brown Jenkin | 5/2/4 | 2 | 650 | 23 | 209 | 220 | 4 | 0.36 | 0 |
| 5 | Ephraim Waite | 5/2/5 | 3 | 800 | 23 | 96 | 220 | 5 | 0.15 | 0 |
| 6 | Keziah Mason | 6/2/5 | 3 | 1100 | 23 | 273 | 232 | 5 | 0.39 | 0 |
| 7 | The Black Man | 6/3/5 | 4 | 1150 | 22 | 75 | 232 | 5 | 0.11 | 0 |
| 8 | The Colour Out of Space | 7/3/6 | 4 | 1150 | 27 | 546 | 244 | 5 | 0.75 | 0 |
| 9 | The Hound | 7/3/7 | 4 | 1450 | 21 | 323 | 244 | 6 | 0.39 | 0 |
| 10 | The Unnamable | 8/3/7 | 5 | 2000 | 24 | 325 | 256 | 6 | 0.37 | 0 |
