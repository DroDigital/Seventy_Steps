# New Game Plus

New Game+ restarts the story while carrying the investigator's strength forward. The difficulty selected for the save remains in effect. Journey scaling and Echo rewards stop increasing at NG+7 (journey eight). Boss health is always the authored health of its current form, including in later journeys.

## Regional progression

Ordinary enemies use the following health and damage multipliers, relative to their authored stats. Each multiplier is the geometric midpoint of the corresponding regional curve from PR #214 and the equal-step ordinary-enemy ladder from PR #209, rounded to three decimals. This keeps the earlier regions' stronger progression while moderating the steepest proposal; the numbers are a design compromise, not a guarantee that every encounter is fair.

| Journey | Early health / damage | Middle health / damage | Late health / damage |
| --- | --- | --- | --- |
| First | 1 / 1 | 1 / 1 | 1 / 1 |
| NG+1 | 1.352 / 1.134 | 1.309 / 1.124 | 1.242 / 1.110 |
| NG+2 | 1.663 / 1.265 | 1.583 / 1.242 | 1.478 / 1.219 |
| NG+3 | 1.946 / 1.394 | 1.832 / 1.363 | 1.690 / 1.327 |
| NG+4 | 2.153 / 1.478 | 2.021 / 1.448 | 1.859 / 1.412 |
| NG+5 | 2.342 / 1.563 | 2.191 / 1.528 | 2.028 / 1.483 |
| NG+6 | 2.531 / 1.639 | 2.360 / 1.604 | 2.176 / 1.554 |
| NG+7 and beyond | 2.702 / 1.710 | 2.530 / 1.679 | 2.324 / 1.620 |

The university and Arkham are early; the rest of the waking world is middle; distant realms and the Outer Dark are late. The southern 400 metres of the Dreamlands use middle. The authored spawn region takes precedence over a spatial lookup, including dungeon rooms that cross a region boundary. A creature keeps its captured home profile and existing regional pressure when it crosses a boundary or changes form. A roaming Dhole takes 60% of its region's added health and 80% of its added damage. Existing first-journey regional pressure remains in addition to the journey multiplier for ordinary enemies.

## Bosses and encounters

Bosses retain their authored maximum health at every level and journey. On the first journey, their damage uses the existing per-level and Vigour overmatch rules. On later journeys, their damage uses a fixed 18 Vigour / 9 Endurance / 17 Might reference, then 80% of the region's added damage. This reference is a tuning point, not a minimum required carry: further purchases improve the investigator without strengthening those bosses.

Servants inherit their encounter's journey damage growth and retain the existing servant damage reduction. They do not receive a second ordinary-region multiplier. Their health, like the boss's, stays at its authored value. A scripted creature summoned as a servant does not start an independent boss fight. Morphs retain the fraction of health remaining and preserve servant status. Shub-Niggurath's roots keep their authored health; the Haunter's lamplight damage remains effective at the same rate. Cthulhu's Alert finish remains available. Azathoth is defeated in combat; it has no survival timer.

Persistent enemy projectiles, waves, clouds and pools capture their caster's outgoing scale when created, so they retain that scale and the enemy single-hit limit if the caster disappears. A projectile's pool inherits the captured value once. Phantom attacks remain physically harmless after their source vanishes. The single-blow limit is a backstop; it does not prevent death from successive hits, damage over time, petrification or falls.

## Saves and rewards

Echo rewards gain 50% of base per journey, capped at NG+7. Existing consumable prices, the three difficulty choices and their saved settings remain. Existing later-journey saves receive a localized notice about the changed regional scaling. The first older NG+ save overwritten is preserved under `<slot-key>-before-journey-balance-1`, separately from the rolling recovery backup; clearing the slot clears both backups. Inventory, levels, quests, difficulty and enemy wound fractions remain in the save.

The ending card shows New Game+ as a distinct choice and explains what carries, what resets and which save slot is cleared. Each ending-card action has its own confirmation. If the carry or reload flag cannot be stored, the current journey remains open.

## Verification and limits

`tests/ngPlusMechanics.test.ts` checks the regional ladder, the ceiling, captured home profiles, fixed boss health, encounter servants, lingering attacks and save migration. `tests/ngPlusSignatures.test.ts` checks Cthulhu, Azathoth and the Haunter across journeys. `tests/ngPlusWorld.test.ts` checks the Alert route against the streamed R'lyeh collision with attacks disabled; it is not a combat survival test.

`tests/ngPlus.test.ts` runs finite-resource boss fights with real health, finite ammunition, healing and deaths, including both the reference and a fully leveled build at NG+7. `NGPLUS_WRITE=1 npm run audit -- tests/ngPlus.test.ts` regenerates [the results](NGPLUS_RESULTS.md). The synthetic arenas and deterministic bot do not predict human completion rates, and some strategies cannot solve every special mechanic. Human playtesting and further real-world routes are needed to judge the tuning.
