# The balance table

Written by `tests/balance.test.ts` (`BALANCE_WRITE=1 npm run audit`; round 25, playtest note 8). A bot fights each scripted boss
in the arena at the standing a person has when they reach it (`tests/balanceModel.ts`). Round 60: the world is open, so
the bosses are met ring by ring as it opens about the start (the university; Arkham; the waking world beyond it; the realms down
the stair and through its gates; Beyond the Gate). In each ring its lesser foes give 60% of their Echoes in step with its named
horrors and colossi, met the weak first, each slain giving most of its own; its gods may be met in any order, so each is met
halfway through its ring with no god's Echoes in hand. The Echoes are spent on levels as a person builds (Vigour and Might most,
Endurance less), and the star-stones the bosses leave are set into the sword-cane. The bot closes to the edge of the body and
strikes when it can retain enough stamina for a roll, selects 55% of telegraphed blows for a dodge attempt, strikes down a servant or a phantom at
its elbow, takes the Alert's helm, keeps behind a monolith from a gaze that turns flesh to stone, and (round 58) drinks Laudanum
when the HUD calls for it, as a person is told to. It cannot be killed, and what it took is the tally. Each fight is the mean of
three, from 7, 10, 13 metres off (a bot's path through a fight is chaos), and a colossus is fought with the arena's middle pillars,
low walls and training dummy set aside: a body that wide finds no place to stand among them, as its own arena in the world has
nothing in its way.

- Bosses gain 0.75% maximum health and 0.3% damage per player level, a level counted by what it is worth (round 71, the soft caps: each attribute's levels count whole to 18, 50% from 19, 15% from 27: thirty are worth 22.6, so ninety bought are 67.8). Level one retains the authored stats;
  ordinary enemies, summons and spawning roots keep their existing stats. **Scaled health** is the boss's actual maximum in that run.
- **Seconds** is how long the boss took with this bot's choices; actual players' fight times will differ.
- **Lives** is the damage taken against the health a person has there and the Reagent they carry there (4 doses of 40% at the start, a vial more as the horrors fall, to 10):
  1 is the equivalent of all of it. A selected dodge can fail to start or avoid damage, and a value above 1 exceeds the carried healing
  in this simulation; these raw costs are never divided by the scaling factors.
- Ghatanothoa is fought with the gaze waived (its seconds scaled by the half of a fight in its sight), Shub-Niggurath with
  its roots down (forty seconds more, to cut them), and the Great Ones and 'Umr at-Tawil with the void under their hidden
  platforms shut (a person with insight keeps to the platforms): the bot plays those badly. Azathoth and the Haunter of the Dark are not held
  to the bounds: Azathoth is blind and cannot be wounded (the piping is outlasted, and what it costs the bot is the noise the bot
  makes), the Haunter is hurt only by lamplight (a person lures it to a lamp).


| # | Boss | Vig/End/Might | Cane + | Scaled health | Seconds | Taken | Our health | Doses | Lives | Deaths |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Dr. Muñoz | 1/0/1 | 0 | 609 | 46 | 344 | 172 | 4 | 0.77 | 0 |
| 2 | Charles le Sorcier | 3/1/2 | 1 | 721 | 41 | 333 | 196 | 4 | 0.65 | 0 |
| 3 | The Outsider | 4/2/3 | 2 | 1014 | 33 | 300 | 208 | 4 | 0.55 | 0 |
| 4 | Brown Jenkin | 5/2/4 | 2 | 758 | 99 | 506 | 220 | 4 | 0.88 | 0 |
| 5 | Ephraim Waite | 5/2/5 | 3 | 872 | 27 | 399 | 220 | 5 | 0.61 | 0 |
| 6 | The Hound | 6/2/5 | 3 | 1591 | 54 | 440 | 232 | 5 | 0.63 | 0 |
| 7 | Keziah Mason | 6/3/5 | 4 | 1768 | 46 | 491 | 232 | 5 | 0.71 | 0 |
| 8 | The Unnamable | 6/3/6 | 4 | 2225 | 52 | 427 | 232 | 5 | 0.61 | 0 |
| 9 | The Colour Out of Space | 7/3/6 | 4 | 2688 | 111 | 904 | 244 | 6 | 1.09 | 0 |
| 10 | The Black Man | 7/3/7 | 5 | 3044 | 61 | 286 | 244 | 6 | 0.34 | 0 |
| 11 | The Haunter of the Dark | 8/4/7 | 5 | 1200 | 362 | 4043 | 256 | 6 | 4.65 | 0 |
| 12 | Wilbur Whateley | 9/4/8 | 5 | 1794 | 35 | 472 | 268 | 7 | 0.46 | 0 |
| 13 | The Gorgon of Medusa's Coil | 9/4/9 | 5 | 1864 | 54 | 497 | 268 | 7 | 0.49 | 0 |
| 14 | The Whisperer in Akeley's Chair | 10/4/9 | 5 | 1876 | 44 | 411 | 280 | 7 | 0.39 | 0 |
| 15 | Edward Hutchinson | 10/5/10 | 5 | 2019 | 54 | 615 | 280 | 7 | 0.58 | 0 |
| 16 | Simon Orne | 11/5/10 | 5 | 2032 | 68 | 828 | 292 | 8 | 0.67 | 0 |
| 17 | The Horror at Martin's Beach | 11/5/11 | 5 | 2225 | 40 | 321 | 292 | 8 | 0.26 | 0 |
| 18 | The Terrible Old Man | 12/5/11 | 5 | 2239 | 64 | 682 | 304 | 8 | 0.53 | 0 |
| 19 | Lilith | 12/5/11 | 5 | 2299 | 79 | 961 | 304 | 8 | 0.75 | 0 |
| 20 | The Shunned House Entity | 12/6/11 | 5 | 2374 | 44 | 882 | 304 | 9 | 0.63 | 0 |
| 21 | Joseph Curwen | 12/6/12 | 5 | 2695 | 51 | 607 | 304 | 9 | 0.43 | 0 |
| 22 | The Dunwich Horror | 13/6/12 | 5 | 3636 | 79 | 1290 | 316 | 9 | 0.89 | 0 |
| 23 | Mother Hydra | 11/5/11 | 5 | 4509 | 101 | 2611 | 292 | 10 | 1.79 | 0 |
| 24 | Father Dagon | 11/5/11 | 5 | 4690 | 106 | 1236 | 292 | 10 | 0.85 | 0 |
| 25 | Hypnos | 14/7/13 | 5 | 2385 | 60 | 677 | 328 | 10 | 0.41 | 0 |
| 26 | High Priest Not to Be Described | 16/7/15 | 5 | 3341 | 53 | 448 | 352 | 10 | 0.25 | 0 |
| 27 | The Colossus Beneath the Pyramids | 17/8/16 | 5 | 5165 | 89 | 1694 | 364 | 10 | 0.93 | 0 |
| 28 | Bokrug | 16/7/15 | 5 | 4819 | 110 | 1798 | 352 | 10 | 1.02 | 0 |
| 29 | Nug | 16/7/15 | 5 | 4819 | 81 | 1726 | 352 | 10 | 0.98 | 0 |
| 30 | Rhan-Tegoth | 16/7/15 | 5 | 4819 | 109 | 1553 | 352 | 10 | 0.88 | 0 |
| 31 | Yeb | 16/7/15 | 5 | 4819 | 84 | 1873 | 352 | 10 | 1.06 | 0 |
| 32 | The Great Ones | 16/7/15 | 5 | 5526 | 103 | 1995 | 352 | 10 | 1.13 | 0 |
| 33 | Yig | 16/7/15 | 5 | 5526 | 95 | 2471 | 352 | 10 | 1.40 | 0 |
| 34 | Tsathoggua | 16/7/15 | 5 | 5590 | 123 | 2245 | 352 | 10 | 1.28 | 0 |
| 35 | Ghatanothoa | 16/7/15 | 5 | 6232 | 234 | 2100 | 352 | 10 | 1.19 | 0 |
| 36 | Hastur | 16/7/15 | 5 | 6554 | 148 | 1364 | 352 | 10 | 0.78 | 0 |
| 37 | Cthulhu | 16/7/15 | 5 | 6875 | 97 | 1171 | 352 | 10 | 0.67 | 0 |
| 38 | The Thing Beyond Erich Zann's Window | 18/8/17 | 5 | 3439 | 47 | 527 | 376 | 10 | 0.28 | 0 |
| 39 | Zkauba the Wizard | 18/9/18 | 5 | 3812 | 109 | 1509 | 376 | 10 | 0.80 | 0 |
| 40 | The Other Gods | 18/9/17 | 5 | 4921 | 71 | 1097 | 376 | 10 | 0.58 | 0 |
| 41 | 'Umr at-Tawil | 18/9/17 | 5 | 5054 | 70 | 617 | 376 | 10 | 0.33 | 0 |
| 42 | The Daemon Pipers | 18/9/17 | 5 | 5187 | 119 | 2511 | 376 | 10 | 1.34 | 0 |
| 43 | The Ancient Ones | 18/9/17 | 5 | 5387 | 78 | 646 | 376 | 10 | 0.34 | 0 |
| 44 | Nyarlathotep | 18/9/17 | 5 | 6850 | 378 | 4934 | 376 | 10 | 2.62 | 0 |
| 45 | Shub-Niggurath | 18/9/17 | 5 | 7249 | 201 | 2536 | 376 | 10 | 1.35 | 0 |
| 46 | Yog-Sothoth | 18/9/17 | 5 | 8113 | 333 | 3923 | 376 | 10 | 2.09 | 0 |
| 47 | Azathoth | 18/9/17 | 5 | 8911 | 90 | 9839 | 376 | 10 | 5.23 | 0 |

Bounds held by the test: each boss finishes within 6 to 450 seconds, and costs at most 3 lives (a colossus, 6; a Great Old One or an Outer God, 1.5), and the bot does not die, subject to the named pressure exceptions below.
Each tier has its band: a named horror takes 14 to 90 seconds and costs 0.2 to 1.2 lives (the Colour may cost up to 1.5); one of the 16 great fights takes 35 to 170 seconds and costs 0.45 to 1.5 lives. Named exceptions are brown jenkin 14–120 seconds; colossus pyramids 14–110 seconds; daemon pipers 14–145 seconds 0.2–1.6 lives; zkauba 14–130 seconds; mother hydra 0.45–2.1 lives; ghatanothoa 35–280 seconds; nyarlathotep 35–430 seconds 0.45–3 lives; shub niggurath 35–250 seconds; yog sothoth 35–400 seconds 0.45–2.5 lives; umr at tawil 0.25–1.5 lives; colour out of space 14–135 seconds. Yog-Sothoth is additionally capped at 2.5 lives at its expected standing.

## At the cap

The same bot, from 9 starts (6 to 14 metres off), with every level bought (30 Vigour, 30 Endurance, 30 Might, which the soft caps make 431 health, 281 stamina and blows of 1.90) and the cane at +5. The horrors have grown past what a person has when they meet them:
their health by the Might the investigator has beyond the standing above, and their blows by the Vigour (`overmatch` in `systems/bossScaling.ts`, `BOSS_OVERMATCH`). A named horror still takes at least 10 seconds and costs a bot 0.1 to 1.5 lives; a great fight 30 and 0.4 to 1.875 lives, except 'Umr at-Tawil's 0.18 life floor and Yog-Sothoth's 2.2 life ceiling.

| # | Boss | Vig/End/Might | Cane + | Scaled health | Seconds | Taken | Our health | Doses | Lives | Deaths |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Dr. Muñoz | 30/30/30 | 5 | 1507 | 14 | 314 | 431 | 4 | 0.28 | 0 |
| 2 | Charles le Sorcier | 30/30/30 | 5 | 1676 | 13 | 262 | 431 | 4 | 0.23 | 0 |
| 3 | The Outsider | 30/30/30 | 5 | 2236 | 21 | 400 | 431 | 4 | 0.36 | 0 |
| 4 | Brown Jenkin | 30/30/30 | 5 | 1598 | 23 | 282 | 431 | 4 | 0.25 | 0 |
| 5 | Ephraim Waite | 30/30/30 | 5 | 1773 | 18 | 258 | 431 | 5 | 0.20 | 0 |
| 6 | The Hound | 30/30/30 | 5 | 3214 | 32 | 587 | 431 | 5 | 0.45 | 0 |
| 7 | Keziah Mason | 30/30/30 | 5 | 3546 | 35 | 790 | 431 | 5 | 0.61 | 0 |
| 8 | The Unnamable | 30/30/30 | 5 | 4309 | 41 | 760 | 431 | 5 | 0.59 | 0 |
| 9 | The Colour Out of Space | 30/30/30 | 5 | 5171 | 75 | 1156 | 431 | 6 | 0.79 | 0 |
| 10 | The Black Man | 30/30/30 | 5 | 5661 | 65 | 616 | 431 | 6 | 0.42 | 0 |
| 11 | The Haunter of the Dark | 30/30/30 | 5 | 2202 | 298 | 5222 | 431 | 6 | 3.56 | 0 |
| 12 | Wilbur Whateley | 30/30/30 | 5 | 3166 | 34 | 722 | 431 | 7 | 0.44 | 0 |
| 13 | The Gorgon of Medusa's Coil | 30/30/30 | 5 | 3186 | 45 | 775 | 431 | 7 | 0.47 | 0 |
| 14 | The Whisperer in Akeley's Chair | 30/30/30 | 5 | 3186 | 39 | 512 | 431 | 7 | 0.31 | 0 |
| 15 | Edward Hutchinson | 30/30/30 | 5 | 3303 | 39 | 736 | 431 | 7 | 0.45 | 0 |
| 16 | Simon Orne | 30/30/30 | 5 | 3303 | 46 | 964 | 431 | 8 | 0.53 | 0 |
| 17 | The Horror at Martin's Beach | 30/30/30 | 5 | 3510 | 37 | 372 | 431 | 8 | 0.21 | 0 |
| 18 | The Terrible Old Man | 30/30/30 | 5 | 3510 | 50 | 835 | 431 | 8 | 0.46 | 0 |
| 19 | Lilith | 30/30/30 | 5 | 3605 | 57 | 1107 | 431 | 8 | 0.61 | 0 |
| 20 | The Shunned House Entity | 30/30/30 | 5 | 3700 | 39 | 1296 | 431 | 9 | 0.65 | 0 |
| 21 | Joseph Curwen | 30/30/30 | 5 | 4079 | 50 | 758 | 431 | 9 | 0.38 | 0 |
| 22 | The Dunwich Horror | 30/30/30 | 5 | 5470 | 55 | 1249 | 431 | 9 | 0.63 | 0 |
| 23 | Mother Hydra | 30/30/30 | 5 | 7115 | 89 | 3038 | 431 | 10 | 1.41 | 0 |
| 24 | Father Dagon | 30/30/30 | 5 | 7400 | 89 | 1567 | 431 | 10 | 0.73 | 0 |
| 25 | Hypnos | 30/30/30 | 5 | 3445 | 37 | 513 | 431 | 10 | 0.24 | 0 |
| 26 | High Priest Not to Be Described | 30/30/30 | 5 | 4518 | 47 | 346 | 431 | 10 | 0.16 | 0 |
| 27 | The Colossus Beneath the Pyramids | 30/30/30 | 5 | 6726 | 82 | 1982 | 431 | 10 | 0.92 | 0 |
| 28 | Bokrug | 30/30/30 | 5 | 6517 | 97 | 1871 | 431 | 10 | 0.87 | 0 |
| 29 | Nug | 30/30/30 | 5 | 6517 | 76 | 2182 | 431 | 10 | 1.01 | 0 |
| 30 | Rhan-Tegoth | 30/30/30 | 5 | 6517 | 83 | 1964 | 431 | 10 | 0.91 | 0 |
| 31 | Yeb | 30/30/30 | 5 | 6517 | 76 | 1840 | 431 | 10 | 0.85 | 0 |
| 32 | The Great Ones | 30/30/30 | 5 | 7473 | 92 | 2270 | 431 | 10 | 1.05 | 0 |
| 33 | Yig | 30/30/30 | 5 | 7473 | 96 | 2907 | 431 | 10 | 1.35 | 0 |
| 34 | Tsathoggua | 30/30/30 | 5 | 7559 | 98 | 2212 | 431 | 10 | 1.03 | 0 |
| 35 | Ghatanothoa | 30/30/30 | 5 | 8428 | 191 | 2207 | 431 | 10 | 1.02 | 0 |
| 36 | Hastur | 30/30/30 | 5 | 8863 | 123 | 1673 | 431 | 10 | 0.78 | 0 |
| 37 | Cthulhu | 30/30/30 | 5 | 9297 | 91 | 1899 | 431 | 10 | 0.88 | 0 |
| 38 | The Thing Beyond Erich Zann's Window | 30/30/30 | 5 | 4340 | 38 | 476 | 431 | 10 | 0.22 | 0 |
| 39 | Zkauba the Wizard | 30/30/30 | 5 | 4667 | 68 | 1232 | 431 | 10 | 0.57 | 0 |
| 40 | The Other Gods | 30/30/30 | 5 | 6177 | 96 | 2220 | 431 | 10 | 1.03 | 0 |
| 41 | 'Umr at-Tawil | 30/30/30 | 5 | 6344 | 69 | 460 | 431 | 10 | 0.21 | 0 |
| 42 | The Daemon Pipers | 30/30/30 | 5 | 6511 | 86 | 2109 | 431 | 10 | 0.98 | 0 |
| 43 | The Ancient Ones | 30/30/30 | 5 | 6761 | 71 | 858 | 431 | 10 | 0.40 | 0 |
| 44 | Nyarlathotep | 30/30/30 | 5 | 8597 | 253 | 3208 | 431 | 10 | 1.49 | 0 |
| 45 | Shub-Niggurath | 30/30/30 | 5 | 9098 | 206 | 2731 | 431 | 10 | 1.27 | 0 |
| 46 | Yog-Sothoth | 30/30/30 | 5 | 10183 | 277 | 3959 | 431 | 10 | 1.84 | 0 |
| 47 | Azathoth | 30/30/30 | 5 | 11185 | 90 | 11549 | 431 | 10 | 5.36 | 0 |

## The opening

The same bot against the horrors of the first hours (the hub about the first Elder Sign, and Arkham), at the standing a new
player has there: only those two realms' lesser foes (60% of them, in step) and their own bosses before it have
given Echoes and star-stones. Each may cost at most 1.5 lives; the Colour is capped at 1.3 lives.

| # | Boss | Vig/End/Might | Cane + | Scaled health | Seconds | Taken | Our health | Doses | Lives | Deaths |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Dr. Muñoz | 1/0/1 | 0 | 609 | 46 | 344 | 172 | 4 | 0.77 | 0 |
| 2 | Charles le Sorcier | 3/1/2 | 1 | 721 | 41 | 333 | 196 | 4 | 0.65 | 0 |
| 3 | The Outsider | 4/2/3 | 2 | 1014 | 33 | 300 | 208 | 4 | 0.55 | 0 |
| 4 | Brown Jenkin | 5/2/4 | 2 | 758 | 99 | 506 | 220 | 4 | 0.88 | 0 |
| 5 | Ephraim Waite | 5/2/5 | 3 | 872 | 27 | 399 | 220 | 5 | 0.61 | 0 |
| 6 | The Hound | 6/2/5 | 3 | 1591 | 54 | 440 | 232 | 5 | 0.63 | 0 |
| 7 | Keziah Mason | 6/3/5 | 4 | 1768 | 46 | 491 | 232 | 5 | 0.71 | 0 |
| 8 | The Unnamable | 6/3/6 | 4 | 2225 | 52 | 427 | 232 | 5 | 0.61 | 0 |
| 9 | The Colour Out of Space | 7/3/6 | 4 | 2688 | 111 | 904 | 244 | 6 | 1.09 | 0 |
| 10 | The Black Man | 7/3/7 | 5 | 3044 | 61 | 286 | 244 | 6 | 0.34 | 0 |
