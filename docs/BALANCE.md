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
- **Lives** is the damage taken against the health a person has there and the Reagent they carry (4 doses of 45%):
  1 is a fight that spends all of it, for a bot that rolls from 55% of blows.
  A value above 1 exceeds the carried healing at this bot's dodge rate; these raw costs are never divided by the scaling factors.
- Ghatanothoa is fought with the gaze waived (its seconds scaled by the half of a fight in its sight), Shub-Niggurath with
  its roots down (forty seconds more, to cut them), and the Great Ones and 'Umr at-Tawil with the void under their hidden
  platforms shut (a person with insight keeps to the platforms): the bot plays those badly. Azathoth and the Haunter of the Dark are not held
  to the bounds: Azathoth is blind and cannot be wounded (the piping is outlasted, and what it costs the bot is the noise the bot
  makes), the Haunter is hurt only by lamplight (a person lures it to a lamp).


| # | Boss | Vig/End/Might | Cane + | Scaled health | Seconds | Taken | Our health | Lives | Deaths |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Dr. Muñoz | 1/0/1 | 0 | 406 | 15 | 163 | 172 | 0.34 | 0 |
| 2 | Charles le Sorcier | 3/1/2 | 1 | 575 | 16 | 232 | 196 | 0.42 | 0 |
| 3 | The Outsider | 4/2/3 | 2 | 587 | 13 | 60 | 208 | 0.10 | 0 |
| 4 | Brown Jenkin | 5/2/4 | 2 | 325 | 10 | 98 | 220 | 0.16 | 0 |
| 5 | The Hound | 5/2/5 | 3 | 600 | 10 | 69 | 220 | 0.11 | 0 |
| 6 | Ephraim Waite | 6/2/5 | 3 | 659 | 23 | 71 | 232 | 0.11 | 0 |
| 7 | Keziah Mason | 6/3/5 | 4 | 774 | 13 | 143 | 232 | 0.22 | 0 |
| 8 | The Black Man | 6/3/6 | 4 | 834 | 15 | 11 | 232 | 0.02 | 0 |
| 9 | The Unnamable | 7/3/7 | 4 | 958 | 11 | 96 | 244 | 0.14 | 0 |
| 10 | The Colour Out of Space | 7/3/7 | 5 | 1128 | 20 | 420 | 244 | 0.61 | 0 |
| 11 | The Terrible Old Man | 8/4/7 | 5 | 514 | 10 | 65 | 256 | 0.09 | 0 |
| 12 | Wilbur Whateley | 8/4/8 | 5 | 690 | 11 | 105 | 256 | 0.15 | 0 |
| 13 | Edward Hutchinson | 9/4/9 | 5 | 757 | 13 | 95 | 268 | 0.13 | 0 |
| 14 | Simon Orne | 10/4/9 | 5 | 762 | 11 | 187 | 280 | 0.24 | 0 |
| 15 | Lilith | 10/5/9 | 5 | 885 | 13 | 209 | 280 | 0.27 | 0 |
| 16 | The Shunned House Entity | 10/5/10 | 5 | 891 | 11 | 209 | 280 | 0.27 | 0 |
| 17 | The Gorgon of Medusa's Coil | 11/5/10 | 5 | 956 | 19 | 81 | 292 | 0.10 | 0 |
| 18 | The Whisperer in Akeley's Chair | 11/5/11 | 5 | 1022 | 12 | 92 | 292 | 0.11 | 0 |
| 19 | Joseph Curwen | 12/5/11 | 5 | 1089 | 13 | 163 | 304 | 0.19 | 0 |
| 20 | The Haunter of the Dark | 12/6/11 | 5 | 1278 | 168 | 3576 | 304 | 4.20 | 0 |
| 21 | The Horror at Martin's Beach | 12/6/12 | 5 | 1470 | 31 | 126 | 304 | 0.15 | 0 |
| 22 | The Dunwich Horror | 13/6/12 | 5 | 1910 | 21 | 603 | 316 | 0.68 | 0 |
| 23 | Mother Hydra | 11/5/11 | 5 | 3126 | 36 | 827 | 292 | 1.01 | 0 |
| 24 | Father Dagon | 11/5/11 | 5 | 3247 | 41 | 712 | 292 | 0.87 | 0 |
| 25 | Shub-Niggurath | 11/5/11 | 5 | 3728 | 86 | 667 | 292 | 0.82 | 0 |
| 26 | Hypnos | 14/7/13 | 5 | 1192 | 28 | 91 | 328 | 0.10 | 0 |
| 27 | High Priest Not to Be Described | 16/7/15 | 5 | 1285 | 13 | 124 | 352 | 0.13 | 0 |
| 28 | The Colossus Beneath the Pyramids | 17/8/16 | 5 | 2157 | 19 | 576 | 364 | 0.57 | 0 |
| 29 | The Other Gods | 16/7/15 | 5 | 2442 | 21 | 494 | 352 | 0.50 | 0 |
| 30 | Bokrug | 16/7/15 | 5 | 3341 | 41 | 956 | 352 | 0.97 | 0 |
| 31 | Nug | 16/7/15 | 5 | 3341 | 36 | 976 | 352 | 0.99 | 0 |
| 32 | Rhan-Tegoth | 16/7/15 | 5 | 3341 | 39 | 1095 | 352 | 1.11 | 0 |
| 33 | Yeb | 16/7/15 | 5 | 3341 | 35 | 897 | 352 | 0.91 | 0 |
| 34 | The Great Ones | 16/7/15 | 5 | 3791 | 44 | 1177 | 352 | 1.19 | 0 |
| 35 | Yig | 16/7/15 | 5 | 3791 | 46 | 1285 | 352 | 1.30 | 0 |
| 36 | Tsathoggua | 16/7/15 | 5 | 3855 | 45 | 1075 | 352 | 1.09 | 0 |
| 37 | Nyarlathotep | 16/7/15 | 5 | 4369 | 57 | 990 | 352 | 1.00 | 0 |
| 38 | Hastur | 16/7/15 | 5 | 4498 | 45 | 596 | 352 | 0.61 | 0 |
| 39 | Ghatanothoa | 16/7/15 | 5 | 4626 | 89 | 944 | 352 | 0.96 | 0 |
| 40 | Cthulhu | 16/7/15 | 5 | 4755 | 50 | 900 | 352 | 0.91 | 0 |
| 41 | Zkauba the Wizard | 18/9/17 | 5 | 1463 | 16 | 247 | 376 | 0.23 | 0 |
| 42 | The Thing Beyond Erich Zann's Window | 18/9/18 | 5 | 1739 | 14 | 94 | 376 | 0.09 | 0 |
| 43 | The Daemon Pipers | 18/9/17 | 5 | 1995 | 20 | 292 | 376 | 0.28 | 0 |
| 44 | The Ancient Ones | 18/9/17 | 5 | 2926 | 33 | 214 | 376 | 0.20 | 0 |
| 45 | 'Umr at-Tawil | 18/9/17 | 5 | 4256 | 58 | 650 | 376 | 0.62 | 0 |
| 46 | Yog-Sothoth | 18/9/17 | 5 | 4788 | 73 | 1558 | 376 | 1.48 | 0 |
| 47 | Azathoth | 18/9/17 | 5 | 8911 | 90 | 10055 | 376 | 9.55 | 0 |

Bounds held by the test: each boss finishes within 6 to 260 seconds, and costs at most 3 lives (a colossus, 6; a Great Old One or an Outer God, 1.5), and the bot does not die.
Each tier also keeps its time band: a named horror takes 7 to 40 seconds and costs at least 0.01 of a life; a god of 2500 base health or more takes 18 to 90 seconds and costs 0.35 to 1.5 lives. The god's upper healing budget allows the modest level scaling; the named lower bound allows deterministic path variation while still requiring positive pressure.

## The opening

The same bot against the horrors of the first hours (the hub about the first Elder Sign, and Arkham), at the standing a new
player has there: only those two realms' lesser foes (60% of them, in step) and their own bosses before it have
given Echoes and star-stones. Each may cost at most 1.5 lives.

| # | Boss | Vig/End/Might | Cane + | Scaled health | Seconds | Taken | Our health | Lives | Deaths |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Dr. Muñoz | 1/0/1 | 0 | 406 | 15 | 163 | 172 | 0.34 | 0 |
| 2 | Charles le Sorcier | 3/1/2 | 1 | 575 | 16 | 232 | 196 | 0.42 | 0 |
| 3 | The Outsider | 4/2/3 | 2 | 587 | 13 | 60 | 208 | 0.10 | 0 |
| 4 | Brown Jenkin | 5/2/4 | 2 | 325 | 10 | 98 | 220 | 0.16 | 0 |
| 5 | The Hound | 5/2/5 | 3 | 600 | 10 | 69 | 220 | 0.11 | 0 |
| 6 | Ephraim Waite | 6/2/5 | 3 | 659 | 23 | 71 | 232 | 0.11 | 0 |
| 7 | Keziah Mason | 6/3/5 | 4 | 774 | 13 | 143 | 232 | 0.22 | 0 |
| 8 | The Black Man | 6/3/6 | 4 | 834 | 15 | 11 | 232 | 0.02 | 0 |
| 9 | The Unnamable | 7/3/7 | 4 | 958 | 11 | 96 | 244 | 0.14 | 0 |
| 10 | The Colour Out of Space | 7/3/7 | 5 | 1128 | 20 | 420 | 244 | 0.61 | 0 |
