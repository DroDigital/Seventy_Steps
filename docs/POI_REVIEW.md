# The seventy secrets, reviewed (round 68)

Asked: "evaluate each new point of interest for entertainment value, reward quality and difficulty; enhance the overall exploration
experience to provide greater incentives". Read from `src/data/pois*.ts`, `systems/pois.ts` and the balance model (`tests/balanceModel.ts`):
what a level costs where each realm is met, against what each place leaves.

## What was found

| Kind | Places | What they left, before | Verdict |
| --- | --- | --- | --- |
| den (a guarded lair) | 19 | a chest of 240 to 1800 Echoes, and the guard's own | the fights are right (five to seven lesser foes of the region); the chest was 0.15 to 0.35 of a level |
| rite | 16 | 450 to 2500, the heaviest guards (600 to 900 health) | the best fights of the seventy; paid like the dens |
| hoard | 8 | 350 to 1600, a light guard | a fair reward for a short walk, but small |
| anomaly | 17 | one point of insight and a dread to bear | an experience, not a reward: nothing to take away |
| tale | 10 | one point of insight, a line | seven of ten leave nothing else |

The three faults were these. (1) **Pay.** A level costs 340 at the university, 2,000 at Arkham, 3,500 in the waking world beyond it, 8,800 down
the stair and 10,500 past Kadath's seals, and rises to forty thousand at the cap: a chest of one to two thousand was a fifth of a level at
best, and none of a level once a person had gone far, so nobody walked to a place for its chest after the first hours. (2) **Nothing for the
strange.** Twenty-four places, the ones that make the land feel written (the well on the Blasted Heath, the Crowninshield door, the Onyx
stair), gave a point of insight and a burden on the mind: found once, forgotten. (3) **No sense of a count.** Seventy secrets, and the map
said how many of a realm's were found, but nothing came of finding them.

Difficulty was left as it is: the guards are the lesser foes of the region at their posts, a person is told by the "?" and the line before
they come to it, the heaviest guards stand at the rites that ask the most of a person, and the opening (the university, Arkham) keeps its
gentle few. What a person fights for a chest is worth the fight in the lesser Echoes that fall about it as well (a den's guard leaves 200 to
2,500).

## What was done

- **Every place leaves a purse.** The twenty-four with none have one, a tenth to a sixth of a level's price (100 at the university, 300 at
  Arkham, 500 beyond, 1,200 down the stair, 1,500 past the seals).
- **The chests are worth a level.** Each realm's hoards are scaled to the price of a level where the realm is met: a den, rite or hoard
  leaves 0.2 to 0.9 of a level (mean 0.5 to 0.6), a strange place 0.1 to 0.2, a tale up to half. `tests/poiGifts.test.ts` holds the ratios.
- **Gifts for the count.** At 6, 15, 30, 50 and 70 secrets found, a gift (`POI.gifts`): star-stones (nine in all, one weapon's five levels) and
  Echoes worth one to six levels at the price of the next. The map's heading says where the next one is.
- **The level cap is thirty each**, so the Echoes have somewhere to go all the way down (docs/DECISIONS.md).

## Left for a playtest

Whether the rites' heaviest guards (the polyp pit, the Pipers' ring) are too much for the level they are met at, and whether five gifts is
the right number, are for a person to say with a controller in hand; the numbers above are what the model sees.
