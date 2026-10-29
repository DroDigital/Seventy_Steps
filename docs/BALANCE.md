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

- Bosses gain 0.75% maximum health and 0.3% damage per player level, a level counted by what it is worth (round 71, the soft caps: each attribute's levels count whole to 20, 50% from 21, 20% from 27: thirty are worth 23.8, so ninety bought are 71.4). Level one retains the authored stats;
  ordinary enemies, summons and spawning roots keep their existing stats. **Scaled health** is the boss's actual maximum in that run.
- **Seconds** is how long the boss took with this bot's choices; actual players' fight times will differ.
- **Lives** is the damage taken against the health a person has there and the Reagent they carry there (4 doses of 40% at the start, a vial more as the horrors fall, to 10):
  1 is the equivalent of all of it. A selected dodge can fail to start or avoid damage, and a value above 1 exceeds the carried healing
  in this simulation; these raw costs are never divided by the scaling factors.
- Ghatanothoa is fought with the gaze waived (its seconds scaled by the half of a fight in its sight), Shub-Niggurath with
  its roots down (forty seconds more, to cut them), and the Great Ones and 'Umr at-Tawil with the void under their hidden
  platforms shut (a person with insight keeps to the platforms): the bot plays those badly. The Haunter of the Dark is not held
  to the bounds: it is hurt only by lamplight (a person lures it to a lamp). Azathoth is held to bounds of its own and must cost the bot more than
  any other horror (2026-10-29): its blows are rhythms over the whole court, which the bot reads badly, and its fight is the hardest there is.
- Dagon and Hydra share one encounter. Their individual rows are supplemental; `tests/seaBosses.test.ts` also checks both together at the expected standing, including combined time and damage against one healing inventory. Solo pressure floors are lower for these two members, while their upper limits remain in force.


| # | Boss | Vig/End/Might | Cane + | Scaled health | Seconds | Taken | Our health | Doses | Lives | Deaths |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Dr. Muñoz | 1/0/1 | 0 | 609 | 39 | 263 | 176 | 4 | 0.58 | 0 |
| 2 | Charles le Sorcier | 3/1/2 | 1 | 730 | 43 | 342 | 208 | 4 | 0.63 | 0 |
| 3 | The Outsider | 4/2/3 | 2 | 1014 | 33 | 300 | 224 | 4 | 0.52 | 0 |
| 4 | Brown Jenkin | 5/2/4 | 2 | 758 | 74 | 404 | 240 | 4 | 0.65 | 0 |
| 5 | Ephraim Waite | 5/2/5 | 3 | 872 | 28 | 370 | 240 | 5 | 0.51 | 0 |
| 6 | The Hound | 6/2/5 | 3 | 1591 | 56 | 407 | 256 | 5 | 0.53 | 0 |
| 7 | Keziah Mason | 6/3/5 | 4 | 1768 | 46 | 491 | 256 | 5 | 0.64 | 0 |
| 8 | The Unnamable | 6/3/6 | 4 | 2225 | 52 | 427 | 256 | 5 | 0.56 | 0 |
| 9 | The Colour Out of Space | 7/3/6 | 4 | 2688 | 111 | 904 | 272 | 6 | 0.98 | 0 |
| 10 | The Black Man | 7/3/7 | 5 | 3044 | 61 | 286 | 272 | 6 | 0.31 | 0 |
| 11 | The Haunter of the Dark | 8/4/7 | 5 | 1200 | 238 | 2289 | 288 | 6 | 2.34 | 0 |
| 12 | Wilbur Whateley | 9/4/8 | 5 | 1794 | 35 | 472 | 304 | 7 | 0.41 | 0 |
| 13 | The Gorgon of Medusa's Coil | 9/4/9 | 5 | 1864 | 51 | 417 | 304 | 7 | 0.36 | 0 |
| 14 | The Whisperer in Akeley's Chair | 10/4/9 | 5 | 1876 | 44 | 360 | 320 | 7 | 0.30 | 0 |
| 15 | Edward Hutchinson | 10/5/10 | 5 | 2019 | 54 | 615 | 320 | 7 | 0.51 | 0 |
| 16 | Simon Orne | 11/5/10 | 5 | 2032 | 60 | 750 | 336 | 8 | 0.53 | 0 |
| 17 | The Horror at Martin's Beach | 11/5/11 | 5 | 2225 | 40 | 321 | 336 | 8 | 0.23 | 0 |
| 18 | The Terrible Old Man | 12/5/11 | 5 | 2239 | 57 | 620 | 352 | 8 | 0.42 | 0 |
| 19 | Lilith | 12/5/11 | 5 | 2299 | 67 | 871 | 352 | 8 | 0.59 | 0 |
| 20 | The Shunned House Entity | 12/6/11 | 5 | 2374 | 44 | 882 | 352 | 9 | 0.54 | 0 |
| 21 | Joseph Curwen | 12/6/12 | 5 | 2695 | 50 | 568 | 352 | 9 | 0.35 | 0 |
| 22 | The Dunwich Horror | 13/6/12 | 5 | 3636 | 79 | 1290 | 368 | 9 | 0.76 | 0 |
| 23 | Mother Hydra | 11/5/11 | 5 | 2946 | 58 | 934 | 336 | 10 | 0.56 | 0 |
| 24 | Father Dagon | 11/5/11 | 5 | 3066 | 63 | 626 | 336 | 10 | 0.37 | 0 |
| 25 | Hypnos | 14/7/13 | 5 | 2385 | 60 | 677 | 384 | 10 | 0.35 | 0 |
| 26 | High Priest Not to Be Described | 16/7/15 | 5 | 3341 | 53 | 448 | 416 | 10 | 0.22 | 0 |
| 27 | The Colossus Beneath the Pyramids | 17/8/16 | 5 | 5165 | 89 | 1694 | 432 | 10 | 0.78 | 0 |
| 28 | Bokrug | 16/7/15 | 5 | 4819 | 110 | 1798 | 416 | 10 | 0.86 | 0 |
| 29 | Nug | 16/7/15 | 5 | 4819 | 81 | 1726 | 416 | 10 | 0.83 | 0 |
| 30 | Rhan-Tegoth | 16/7/15 | 5 | 4819 | 95 | 1759 | 416 | 10 | 0.85 | 0 |
| 31 | Yeb | 16/7/15 | 5 | 4819 | 90 | 1918 | 416 | 10 | 0.92 | 0 |
| 32 | The Great Ones | 16/7/15 | 5 | 5526 | 103 | 1995 | 416 | 10 | 0.96 | 0 |
| 33 | Yig | 16/7/15 | 5 | 5526 | 95 | 2339 | 416 | 10 | 1.12 | 0 |
| 34 | Tsathoggua | 16/7/15 | 5 | 5590 | 119 | 2099 | 416 | 10 | 1.01 | 0 |
| 35 | Ghatanothoa | 16/7/15 | 5 | 6232 | 265 | 2579 | 416 | 10 | 1.24 | 0 |
| 36 | Hastur | 16/7/15 | 5 | 6554 | 146 | 1415 | 416 | 10 | 0.68 | 0 |
| 37 | Cthulhu | 16/7/15 | 5 | 6875 | 96 | 1171 | 416 | 10 | 0.56 | 0 |
| 38 | The Thing Beyond Erich Zann's Window | 18/8/17 | 5 | 3439 | 47 | 527 | 448 | 10 | 0.24 | 0 |
| 39 | Zkauba the Wizard | 18/9/18 | 5 | 3812 | 112 | 1588 | 448 | 10 | 0.71 | 0 |
| 40 | The Other Gods | 18/9/17 | 5 | 4921 | 71 | 1097 | 448 | 10 | 0.49 | 0 |
| 41 | 'Umr at-Tawil | 18/9/17 | 5 | 5054 | 70 | 617 | 448 | 10 | 0.28 | 0 |
| 42 | The Daemon Pipers | 18/9/17 | 5 | 5187 | 122 | 2432 | 448 | 10 | 1.09 | 0 |
| 43 | The Ancient Ones | 18/9/17 | 5 | 5387 | 78 | 646 | 448 | 10 | 0.29 | 0 |
| 44 | Nyarlathotep | 18/9/17 | 5 | 6850 | 328 | 3481 | 448 | 10 | 1.55 | 0 |
| 45 | Shub-Niggurath | 18/9/17 | 5 | 7249 | 221 | 2436 | 448 | 10 | 1.09 | 0 |
| 46 | Yog-Sothoth | 18/9/17 | 5 | 8113 | 321 | 3732 | 448 | 10 | 1.67 | 0 |
| 47 | Azathoth | 18/9/17 | 5 | 8911 | 221 | 4730 | 448 | 10 | 2.11 | 0 |

Bounds held by the test: each boss finishes within 6 to 450 seconds, and costs at most 3 lives (a colossus, 6; a Great Old One or an Outer God, 1.5), and the bot does not die, subject to the named pressure exceptions below.
Each tier has its band: a named horror takes 14 to 90 seconds and costs 0.2 to 1.2 lives (the Colour may cost up to 1.5); one of the 17 great fights takes 35 to 170 seconds and costs 0.45 to 1.5 lives. Named exceptions are brown jenkin 14–120 seconds; colossus pyramids 14–110 seconds; daemon pipers 14–145 seconds 0.2–1.6 lives; zkauba 14–130 seconds; mother hydra 0.2–1.5 lives; father dagon 0.2–1.5 lives; ghatanothoa 35–280 seconds; nyarlathotep 35–430 seconds 0.45–3 lives; azathoth 90–430 seconds 1.7–3 lives; shub niggurath 35–250 seconds; yog sothoth 35–400 seconds 0.45–2.5 lives; umr at tawil 0.25–1.5 lives; colour out of space 14–135 seconds. Yog-Sothoth is additionally capped at 2.5 lives at its expected standing.

## At the cap

The same bot, from 9 starts (6 to 14 metres off), with every level bought (30 Vigour, 30 Endurance, 30 Might, which the soft caps make 541 health, 290 stamina and blows of 1.95) and the cane at +5. The horrors have grown past what a person has when they meet them:
their health by the Might the investigator has beyond the standing above, and their blows by the Vigour (`overmatch` in `systems/bossScaling.ts`, `BOSS_OVERMATCH`). A named horror still takes at least 10 seconds and costs a bot 0.1 to 1.5 lives; a great fight 30 and 0.4 to 1.875 lives, except 'Umr at-Tawil's 0.18 life floor, Dagon and Hydra's 0.2 life floor per member, and Yog-Sothoth's 2.2 life ceiling. Dagon and Hydra's combined encounter is additionally bounded in `tests/seaBosses.test.ts`.

| # | Boss | Vig/End/Might | Cane + | Scaled health | Seconds | Taken | Our health | Doses | Lives | Deaths |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Dr. Muñoz | 30/30/30 | 5 | 1325 | 12 | 225 | 541 | 4 | 0.16 | 0 |
| 2 | Charles le Sorcier | 30/30/30 | 5 | 1507 | 10 | 215 | 541 | 4 | 0.15 | 0 |
| 3 | The Outsider | 30/30/30 | 5 | 2001 | 18 | 305 | 541 | 4 | 0.22 | 0 |
| 4 | Brown Jenkin | 30/30/30 | 5 | 1442 | 18 | 200 | 541 | 4 | 0.14 | 0 |
| 5 | Ephraim Waite | 30/30/30 | 5 | 1613 | 15 | 181 | 541 | 5 | 0.11 | 0 |
| 6 | The Hound | 30/30/30 | 5 | 2924 | 27 | 479 | 541 | 5 | 0.30 | 0 |
| 7 | Keziah Mason | 30/30/30 | 5 | 3227 | 30 | 649 | 541 | 5 | 0.40 | 0 |
| 8 | The Unnamable | 30/30/30 | 5 | 3953 | 36 | 652 | 541 | 5 | 0.40 | 0 |
| 9 | The Colour Out of Space | 30/30/30 | 5 | 4743 | 66 | 883 | 541 | 6 | 0.48 | 0 |
| 10 | The Black Man | 30/30/30 | 5 | 5234 | 56 | 622 | 541 | 6 | 0.34 | 0 |
| 11 | The Haunter of the Dark | 30/30/30 | 5 | 2035 | 207 | 3251 | 541 | 6 | 1.77 | 0 |
| 12 | Wilbur Whateley | 30/30/30 | 5 | 2950 | 29 | 618 | 541 | 7 | 0.30 | 0 |
| 13 | The Gorgon of Medusa's Coil | 30/30/30 | 5 | 2992 | 38 | 771 | 541 | 7 | 0.38 | 0 |
| 14 | The Whisperer in Akeley's Chair | 30/30/30 | 5 | 2992 | 34 | 377 | 541 | 7 | 0.18 | 0 |
| 15 | Edward Hutchinson | 30/30/30 | 5 | 3125 | 35 | 627 | 541 | 7 | 0.31 | 0 |
| 16 | Simon Orne | 30/30/30 | 5 | 3125 | 39 | 750 | 541 | 8 | 0.33 | 0 |
| 17 | The Horror at Martin's Beach | 30/30/30 | 5 | 3346 | 34 | 293 | 541 | 8 | 0.13 | 0 |
| 18 | The Terrible Old Man | 30/30/30 | 5 | 3346 | 45 | 664 | 541 | 8 | 0.29 | 0 |
| 19 | Lilith | 30/30/30 | 5 | 3436 | 49 | 924 | 541 | 8 | 0.41 | 0 |
| 20 | The Shunned House Entity | 30/30/30 | 5 | 3527 | 35 | 1089 | 541 | 9 | 0.44 | 0 |
| 21 | Joseph Curwen | 30/30/30 | 5 | 3917 | 41 | 637 | 541 | 9 | 0.26 | 0 |
| 22 | The Dunwich Horror | 30/30/30 | 5 | 5252 | 53 | 1110 | 541 | 9 | 0.45 | 0 |
| 23 | Mother Hydra | 30/30/30 | 5 | 4431 | 46 | 1154 | 541 | 10 | 0.43 | 0 |
| 24 | Father Dagon | 30/30/30 | 5 | 4612 | 46 | 619 | 541 | 10 | 0.23 | 0 |
| 25 | Hypnos | 30/30/30 | 5 | 3332 | 38 | 470 | 541 | 10 | 0.17 | 0 |
| 26 | High Priest Not to Be Described | 30/30/30 | 5 | 4431 | 46 | 314 | 541 | 10 | 0.12 | 0 |
| 27 | The Colossus Beneath the Pyramids | 30/30/30 | 5 | 6642 | 77 | 1813 | 541 | 10 | 0.67 | 0 |
| 28 | Bokrug | 30/30/30 | 5 | 6392 | 91 | 1609 | 541 | 10 | 0.59 | 0 |
| 29 | Nug | 30/30/30 | 5 | 6392 | 70 | 1943 | 541 | 10 | 0.72 | 0 |
| 30 | Rhan-Tegoth | 30/30/30 | 5 | 6392 | 77 | 1895 | 541 | 10 | 0.70 | 0 |
| 31 | Yeb | 30/30/30 | 5 | 6392 | 72 | 1731 | 541 | 10 | 0.64 | 0 |
| 32 | The Great Ones | 30/30/30 | 5 | 7329 | 83 | 2060 | 541 | 10 | 0.76 | 0 |
| 33 | Yig | 30/30/30 | 5 | 7329 | 83 | 2475 | 541 | 10 | 0.91 | 0 |
| 34 | Tsathoggua | 30/30/30 | 5 | 7414 | 100 | 2290 | 541 | 10 | 0.85 | 0 |
| 35 | Ghatanothoa | 30/30/30 | 5 | 8266 | 158 | 1513 | 541 | 10 | 0.56 | 0 |
| 36 | Hastur | 30/30/30 | 5 | 8692 | 110 | 1426 | 541 | 10 | 0.53 | 0 |
| 37 | Cthulhu | 30/30/30 | 5 | 9119 | 82 | 1583 | 541 | 10 | 0.59 | 0 |
| 38 | The Thing Beyond Erich Zann's Window | 30/30/30 | 5 | 4315 | 36 | 381 | 541 | 10 | 0.14 | 0 |
| 39 | Zkauba the Wizard | 30/30/30 | 5 | 4671 | 68 | 1198 | 541 | 10 | 0.44 | 0 |
| 40 | The Other Gods | 30/30/30 | 5 | 6141 | 61 | 1152 | 541 | 10 | 0.43 | 0 |
| 41 | 'Umr at-Tawil | 30/30/30 | 5 | 6307 | 81 | 987 | 541 | 10 | 0.36 | 0 |
| 42 | The Daemon Pipers | 30/30/30 | 5 | 6473 | 82 | 1986 | 541 | 10 | 0.73 | 0 |
| 43 | The Ancient Ones | 30/30/30 | 5 | 6722 | 71 | 859 | 541 | 10 | 0.32 | 0 |
| 44 | Nyarlathotep | 30/30/30 | 5 | 8548 | 248 | 3642 | 541 | 10 | 1.35 | 0 |
| 45 | Shub-Niggurath | 30/30/30 | 5 | 9046 | 179 | 2472 | 541 | 10 | 0.91 | 0 |
| 46 | Yog-Sothoth | 30/30/30 | 5 | 10125 | 236 | 3258 | 541 | 10 | 1.20 | 0 |
| 47 | Azathoth | 30/30/30 | 5 | 11121 | 159 | 4214 | 541 | 10 | 1.56 | 0 |

## The opening

The same bot against the horrors of the first hours (the hub about the first Elder Sign, and Arkham), at the standing a new
player has there: only those two realms' lesser foes (60% of them, in step) and their own bosses before it have
given Echoes and star-stones. Each may cost at most 1.5 lives; the Colour is capped at 1.3 lives.

| # | Boss | Vig/End/Might | Cane + | Scaled health | Seconds | Taken | Our health | Doses | Lives | Deaths |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Dr. Muñoz | 1/0/1 | 0 | 609 | 39 | 263 | 176 | 4 | 0.58 | 0 |
| 2 | Charles le Sorcier | 3/1/2 | 1 | 730 | 43 | 342 | 208 | 4 | 0.63 | 0 |
| 3 | The Outsider | 4/2/3 | 2 | 1014 | 33 | 300 | 224 | 4 | 0.52 | 0 |
| 4 | Brown Jenkin | 5/2/4 | 2 | 758 | 74 | 404 | 240 | 4 | 0.65 | 0 |
| 5 | Ephraim Waite | 5/2/5 | 3 | 872 | 28 | 370 | 240 | 5 | 0.51 | 0 |
| 6 | The Hound | 6/2/5 | 3 | 1591 | 56 | 407 | 256 | 5 | 0.53 | 0 |
| 7 | Keziah Mason | 6/3/5 | 4 | 1768 | 46 | 491 | 256 | 5 | 0.64 | 0 |
| 8 | The Unnamable | 6/3/6 | 4 | 2225 | 52 | 427 | 256 | 5 | 0.56 | 0 |
| 9 | The Colour Out of Space | 7/3/6 | 4 | 2688 | 111 | 904 | 272 | 6 | 0.98 | 0 |
| 10 | The Black Man | 7/3/7 | 5 | 3044 | 61 | 286 | 272 | 6 | 0.31 | 0 |
