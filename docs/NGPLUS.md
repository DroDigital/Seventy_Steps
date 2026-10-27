# The later journeys

Written by `tests/ngPlus.test.ts` (`NGPLUS_WRITE=1 npm run audit`; round 95). There is one difficulty (the three of round 38 are gone), and the dream grows harder each
time it is dreamed again, up to the 8th journey, along a ladder of 7 equal rungs, one a journey (`systems/ngPlus.ts`). What a rung adds is not the same for every foe:

- **An ordinary foe** (`NEW_GAME_PLUS.foes`) is 100% hardier and strikes 50% harder at the top. No foe but a horror grows with the investigator's levels. Set from the bot at the cap against
  every creature of the roster that is not a horror (`tests/botHelpers.ts`, `cycle`): the old ladder (+420% health, +245% blows on the eighth journey) left 13 of the 46 unbeaten in half a minute,
  and four of them cost over five health bars each; this costs the middle one about twice what it did on the first journey (3.5% of the health, from 1.6%) and the worst, the Dhole, a bar and two thirds (from half a bar).
- **A horror** takes its own growth (`data/bossNgPlus.ts`, the last two columns), fitted so that on the last journey it costs the balance bot, at the worse of two standings (the least a second journey
  begins with and the cap: a horror grows with the levels bought, so a person with them all can meet a longer fight than one with the least: Cthulhu, given 31% more health by a fit at the least alone, took 109 seconds at the cap against 57), 90% of its
  band's top in lives (a named horror 1.2, a great fight 1.5), or 3 times what it cost on the first journey where it has less room, and takes no longer than
  90% of its band's seconds (50 and 100). A horror that already costs more than that stays as it is. A horror's blows
  grow by 70% at the most, and by no more than keeps its heaviest blow (a third of the investigator's health where it is met, more with the levels bought) short of `BOSS.blowMost`, which would hold it level: no blow takes more than 60% of their health, tests/oneHit.test.ts; its health
  by 60% at the most, and by no more than its seconds leave room for. Where a horror is held by the one it gains the other (a great fight that is already long grows in its blows,
  one that is already costly in its health). Azathoth and the Haunter of the Dark, which the bot cannot measure, and the Elder Shoggoth and the Polyp Swarm, the hall bosses of two lesser creatures, which it does not table, take `NEW_GAME_PLUS.boss` (25% and 25%).
- Echoes (`NEW_GAME_PLUS.echoes`) rise 50% a journey, as before. A horror still grows with the investigator's levels (`systems/bossScaling.ts`) on every journey; the rung is laid over that.

## What it costs

The balance bot of `tests/balance.test.ts`, from 9 starts, with the least a second journey begins with (the last horror's standing: 18 Vigour, 9 Endurance and 17 Might, the cane at +5), on the first, fourth and eighth
journeys; and, in the last column, at the cap (every level bought), which a person reaches in a journey or two of hunting: stronger, but met by a horror grown with the levels, so mostly a tenth easier, and now and then not. Each cell is the seconds the horror took and the lives it cost (the damage
taken against the health and Reagent a person has there, as the first journey carries them; a second carries every vial it found, so these lives are more than it spends; 1 is a fight that spends all of it).
Lives, first journey: median 0.53, most 1.50; fourth: median 0.70, most 1.44; eighth: median 1.04, most 1.62; eighth at the cap: median 0.90, most 1.41. The bot's path through a fight is chaos, so any one cell moves by a tenth with anything.
Past a band's top on the eighth journey: Tsathoggua, 1.62 lives (1.5); The Daemon Pipers, 51 seconds (50); at the cap: none (the checks let a quarter pass in lives, as the cap table does, and a tenth in seconds). A horror's servants are ordinary foes and take the ordinary
rung whatever the horror's own, so a horror that costs most for its servants can be past its top with nothing added to it.

| # | Horror | Band | Journey 1: seconds / lives | Journey 4 | Journey 8 | Journey 8 at the cap | Health added at the top | Blows added at the top |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Dr. Muñoz | named | 11 / 0.21 | 14 / 0.42 | 18 / 0.61 | 17 / 0.59 | +60% | +70% |
| 2 | Charles le Sorcier | named | 13 / 0.23 | 15 / 0.39 | 20 / 0.70 | 20 / 0.70 | +60% | +42% |
| 3 | The Outsider | named | 17 / 0.32 | 21 / 0.41 | 28 / 0.96 | 28 / 0.79 | +60% | +59% |
| 4 | Brown Jenkin | named | 16 / 0.22 | 23 / 0.37 | 27 / 0.66 | 30 / 0.54 | +60% | +61% |
| 5 | Ephraim Waite | named | 18 / 0.29 | 22 / 0.49 | 28 / 0.89 | 27 / 0.70 | +60% | +54% |
| 6 | Keziah Mason | named | 21 / 0.42 | 27 / 0.67 | 34 / 1.06 | 27 / 0.90 | +60% | +67% |
| 7 | The Colour Out of Space | named | 27 / 0.81 | 30 / 0.97 | 32 / 1.04 | 24 / 0.91 | +17% | +12% |
| 8 | The Hound | named | 25 / 0.45 | 31 / 0.65 | 42 / 1.09 | 37 / 0.92 | +60% | +27% |
| 9 | The Black Man | named | 28 / 0.28 | 33 / 0.36 | 43 / 0.55 | 40 / 0.54 | +50% | +70% |
| 10 | The Unnamable | named | 30 / 0.47 | 38 / 0.78 | 45 / 1.11 | 42 / 0.86 | +40% | +26% |
| 12 | The Terrible Old Man | named | 22 / 0.28 | 29 / 0.53 | 37 / 0.82 | 39 / 0.88 | +60% | +37% |
| 13 | The Gorgon of Medusa's Coil | named | 24 / 0.35 | 32 / 0.60 | 41 / 1.06 | 41 / 0.85 | +60% | +48% |
| 14 | Wilbur Whateley | named | 25 / 0.43 | 32 / 0.64 | 41 / 1.03 | 40 / 0.94 | +60% | +45% |
| 15 | The Whisperer in Akeley's Chair | named | 28 / 0.30 | 35 / 0.56 | 45 / 0.81 | 45 / 0.77 | +49% | +70% |
| 16 | Edward Hutchinson | named | 36 / 0.44 | 40 / 0.66 | 44 / 0.94 | 34 / 0.68 | +17% | +70% |
| 17 | Simon Orne | named | 32 / 0.55 | 37 / 0.76 | 42 / 1.09 | 41 / 0.97 | +32% | +44% |
| 18 | The Horror at Martin's Beach | named | 31 / 0.22 | 37 / 0.35 | 44 / 0.47 | 44 / 0.47 | +37% | +70% |
| 19 | Lilith | named | 39 / 0.61 | 38 / 0.77 | 42 / 1.10 | 42 / 1.04 | +9% | +59% |
| 20 | The Shunned House Entity | named | 29 / 0.55 | 34 / 0.76 | 42 / 1.03 | 41 / 1.10 | +48% | +26% |
| 21 | Joseph Curwen | named | 33 / 0.29 | 38 / 0.46 | 42 / 0.62 | 44 / 0.64 | +28% | +70% |
| 22 | The Dunwich Horror | named | 47 / 0.78 | 47 / 0.91 | 47 / 1.08 | 42 / 0.87 | +0% | +39% |
| 23 | Mother Hydra | great | 63 / 1.50 | 61 / 1.44 | 63 / 1.49 | 59 / 1.38 | +0% | +0% |
| 24 | Father Dagon | great | 65 / 0.92 | 71 / 1.04 | 82 / 1.23 | 78 / 1.36 | +23% | +10% |
| 25 | Hypnos | named | 46 / 0.35 | 46 / 0.45 | 46 / 0.59 | 44 / 0.59 | +0% | +70% |
| 26 | High Priest Not to Be Described | named | 36 / 0.21 | 39 / 0.30 | 43 / 0.40 | 38 / 0.31 | +17% | +70% |
| 27 | The Colossus Beneath the Pyramids | named | 45 / 0.71 | 45 / 0.87 | 45 / 1.08 | 45 / 1.11 | +0% | +51% |
| 28 | Ghatanothoa | great | 88 / 0.51 | 88 / 0.67 | 88 / 0.87 | 80 / 0.87 | +0% | +70% |
| 29 | Bokrug | great | 51 / 0.91 | 57 / 1.09 | 66 / 1.38 | 64 / 1.33 | +24% | +16% |
| 30 | Nug | great | 57 / 1.03 | 62 / 1.13 | 67 / 1.31 | 57 / 0.97 | +16% | +11% |
| 31 | Rhan-Tegoth | great | 55 / 1.06 | 57 / 1.11 | 65 / 1.35 | 55 / 1.11 | +14% | +6% |
| 32 | Yeb | great | 53 / 0.68 | 64 / 0.93 | 80 / 1.36 | 78 / 1.15 | +50% | +15% |
| 33 | The Great Ones | great | 62 / 1.15 | 65 / 1.24 | 69 / 1.31 | 65 / 1.32 | +9% | +7% |
| 34 | Yig | great | 69 / 1.29 | 70 / 1.30 | 71 / 1.34 | 57 / 0.99 | +2% | +2% |
| 35 | Tsathoggua | great | 74 / 1.20 | 85 / 1.42 | 84 / 1.62 | 81 / 1.41 | +6% | +5% |
| 36 | Cthulhu | great | 65 / 0.81 | 65 / 0.96 | 69 / 1.26 | 57 / 1.04 | +0% | +25% |
| 37 | Hastur | great | 71 / 0.61 | 79 / 0.85 | 83 / 1.27 | 82 / 1.07 | +12% | +70% |
| 38 | Zkauba the Wizard | named | 44 / 0.54 | 44 / 0.70 | 44 / 0.91 | 36 / 0.66 | +0% | +70% |
| 39 | The Thing Beyond Erich Zann's Window | named | 36 / 0.20 | 39 / 0.33 | 43 / 0.52 | 39 / 0.42 | +17% | +70% |
| 40 | Yog-Sothoth | great | 42 / 0.53 | 45 / 0.46 | 59 / 0.97 | 72 / 1.32 | +41% | +36% |
| 41 | The Ancient Ones | named | 44 / 0.30 | 44 / 0.38 | 44 / 0.50 | 37 / 0.43 | +0% | +70% |
| 42 | The Daemon Pipers | named | 51 / 0.68 | 51 / 0.85 | 51 / 1.07 | 45 / 1.02 | +0% | +59% |
| 43 | The Other Gods | named | 47 / 0.63 | 47 / 0.82 | 47 / 1.08 | 39 / 0.93 | +0% | +70% |
| 44 | Shub-Niggurath | great | 84 / 0.46 | 84 / 0.61 | 84 / 0.79 | 86 / 0.79 | +1% | +70% |
| 45 | 'Umr at-Tawil | great | 78 / 0.59 | 81 / 0.79 | 84 / 1.03 | 76 / 0.82 | +9% | +70% |
| 46 | Nyarlathotep | great | 82 / 0.85 | 81 / 1.10 | 80 / 1.28 | 81 / 1.20 | +4% | +53% |

## Held by

`tests/ngPlus.test.ts` holds every horror under its tier's band on the fourth and eighth journeys, and on the eighth at the cap (named: at most 50 seconds and 1.2 lives; great: 100 and 1.5; no deaths;
lives to a quarter past the top, as the cap table's are, and seconds to a tenth), and holds the eighth to cost more than the fourth (the bands' bottoms are the first journey's, tests/balance.test.ts: a later journey only costs more; the rungs between are straight lines). `tests/ladder.test.ts` holds the rungs: the first journey as authored, equal steps, a rung for every horror the bot measures, none that falls.
`tests/oneHit.test.ts` holds that no horror's heaviest blow reaches `BOSS.blowMost` at the top of the ladder.
