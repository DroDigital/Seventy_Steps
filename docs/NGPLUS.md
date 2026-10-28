# The later journeys

NG+ is an optional, substantially harder return to the world. Most design and test attention belongs to the first journey and NG+1–3. NG+7 (journey eight) is the final scaling ceiling, including rewards. Stats are always derived from base values; reloading, leveling or transforming never compounds them.

## Regional curves

Ordinary enemies use `src/data/ngPlusTuning.ts`. Each cell is health / outgoing damage, relative to authored first-journey stats.

| Journey | Early | Middle | Late |
| --- | --- | --- | --- |
| NG | 1 / 1 | 1 / 1 | 1 / 1 |
| NG+1 | 1.60 / 1.20 | 1.50 / 1.18 | 1.35 / 1.15 |
| NG+2 | 2.15 / 1.40 | 1.95 / 1.35 | 1.70 / 1.30 |
| NG+3 | 2.65 / 1.60 | 2.35 / 1.53 | 2.00 / 1.45 |
| NG+4 | 2.95 / 1.70 | 2.60 / 1.63 | 2.20 / 1.55 |
| NG+5 | 3.20 / 1.80 | 2.80 / 1.72 | 2.40 / 1.62 |
| NG+6 | 3.45 / 1.88 | 3.00 / 1.80 | 2.55 / 1.69 |
| NG+7+ | 3.65 / 1.95 | 3.20 / 1.88 | 2.70 / 1.75 |

The university and Arkham are early; the rest of the waking world is middle; distant realms and the Outer Dark are late. The southern 400 metres of the Dreamlands, including its approach, use middle. The authored spawn region takes precedence over a spatial lookup, including dungeon rooms extending past a region boundary. The profile is captured at spawn and retained when a creature crosses a border or changes form. Arena tests use the creature's canonical region.

Early enemies gain more because the investigator brings back levels and reinforced weapons. Diminishing increments means that later steps generally add less as the ceiling approaches. Every uncapped ordinary regional step still adds over 8% to the combined health × damage proxy; this is a stat constraint, not a prediction of player difficulty. A roaming Dhole takes 60% of its region's added health and 80% of added damage: its colossal base stats already make it a substantial encounter. A summoned Dhole follows its encounter instead.

## Bosses and player progression

The first journey keeps its existing level and overmatch scaling. On NG+, bosses use a fixed reference of 18 Vigour / 9 Endurance / 17 Might, followed by their journey growth. This is a tuning reference, **not a minimum possible carry**. Lower builds remain legal; further investment improves the player without strengthening NG+ bosses.

The default boss receives 50% of the regional added health and 80% of added damage. These are fractions of the growth, not another regional multiplier. For example, an early boss at NG+3 receives 1.825 health and 1.48 damage over its fixed baseline; a late boss receives 1.5 and 1.36. Every multiplier is applied once. Wounds retain their health fraction, and dead bosses remain dead.

Explicit health-growth weights are: Azathoth 0; Haunter 0.2; Cthulhu 0.25; Shub-Niggurath 0.15; Tsathoggua, Mother Hydra and Ghatanothoa 0.2; Nyarlathotep and 'Umr at-Tawil 0.25. Their damage-growth weight is 0.8. Other bosses, including the Elder Shoggoth and Polyp Swarm, use the documented default and are included in the finite-resource benchmark.

Bosses retain their different durations and attack identities. The fit-to-one-flat-band approach of PR #209 is not carried forward: making every later fight stay under the first journey's pressure ceiling would suppress the requested challenge. No automatic changes are made to animation speed, telegraphs, stamina costs, poise, spawn population or sanity rates. Attribute soft caps (18 and 26), attribute maxima (30), and weapon reinforcement (+5) remain in place.

## Complete encounters

Servants inherit their summoner's encounter growth at spawn, retaining their own base stats and the existing 0.7 servant-damage factor. They do not also receive ordinary regional scaling or the master's level baseline. Nested summons retain the encounter, even after the parent disappears. The first journey preserves the legacy spawn-time level-scaled health of scripted servants such as the Guide’s Ancient Ones. Scripted creatures summoned as servants do not become independent boss fights. Morphs retain servant status and wound fractions.

Spawning roots receive only 20% of their encounter's added health. Their authored population and summon intervals remain unchanged. Azathoth's survival clock remains 90 seconds; health scaling does not lengthen it. The Haunter's passive lamplight burn scales with its own journey health delta so that its defining mechanic remains effective. Cthulhu's Alert finish remains available at its authored phase and is tested independently of weapon damage.

The old Cthulhu time cliff was reproduced against PR #209's original bot at commit `d65611f`, at the level cap and NG+7, holding damage growth at 24.7% and using nine starting positions. At +20% boss health, the mean fight took 69.4 seconds and entered the final phase at 52.4 seconds; at +31%, it took 108.9 seconds and entered that phase at 100.3 seconds. Both runs spawned two star-spawn, but the bot killed an average of 0 versus 1.78: it prioritizes nearby servants, so extra add-clearing strongly coincides with the delay. This trace identifies a bot/encounter interaction, not proof of one exclusive cause or of a player-facing threshold defect. To reproduce its 27 JSON lines, use `node tools/ngplus_cthulhu_trace.mjs /path/to/pr-209-checkout > trace.jsonl` with that commit and its development dependencies available.

The current bot records phase times and routes around colossal bodies. Its route now permits movement directly away from a boss even when already inside the navigation safety margin; previously it could circle indefinitely. `tests/ngPlusWorld.test.ts` walks around Cthulhu to the Alert through the streamed R'lyeh arena's real collision at NG+1, NG+3 and NG+7 from three approach directions, and completes the ship finish. This isolates route geometry by placing the fight in its final phase and suppressing attacks; it is not a combat survival or human playtest.

Persistent enemy bolts, waves, clouds and pools capture outgoing difficulty/journey scaling when created. They retain that scale and enemy single-hit protection if their owner despawns. A bolt's pool inherits the captured value rather than multiplying it again. Marks still fizzle when their caster dies, as authored. Phantom attacks retain zero physical damage and poise damage after their source vanishes.

The 60% maximum-health single-blow cap remains a backstop, including after a caster disappears. It does not guarantee survival of multiple attacks, damage over time, petrification, or falling. Repeated mistakes can still kill quickly. Ordinary world damage does not acquire an enemy's multiplier.

## Rewards, choices and saves

Echoes retain +50% of base per journey: x1.5, x2 and x2.5 on NG+1–3, capped at x4.5 on NG+7. No unlimited attribute or weapon tiers are introduced to cancel the enemy curve. Existing consumable prices and the ability to reinforce other weapons remain. Transforming enemies retain their journey reward multiplier, and transformed servants still grant no bounty.

Light Slumber, Deep Slumber and Nightmare remain chosen when starting a save, and retain their existing 0.6 / 1 / 1.5 incoming-enemy-damage modifiers. The baseline measured here is Deep Slumber. Old choices are preserved through saves and carries, rather than silently converting a gentler save. Missing or invalid choices use the default, including inherited object-property names.

Saves carry `balance: 1` independently of the structural save version. The first old NG+ save overwritten is preserved verbatim under `<slot-key>-before-journey-balance-1`, separately from the rolling corruption-recovery backup. It is not overwritten by subsequent autosaves; clearing the slot clears both backups. Storage refusal does not prevent saving progress. A continued old NG+ save receives a localized notice about regional scaling. Inventory, attributes, quests, difficulty and enemy wound fractions are retained. The ending confirmation explains the challenge and the final ceiling.

## Verification and limits

`tests/ngPlusMechanics.test.ts` covers regional assignment, boundaries, transformations, fixed NG+ bosses, minion inheritance, roots, persistent attacks and migration. `tests/ngPlusSignatures.test.ts` covers Cthulhu's Alert and Azathoth's timer at NG, NG+1, NG+2, NG+3 and NG+7, plus proportional lamplight effectiveness. The original first-journey balance, one-hit and difficulty tests remain. `tests/ngPlusWorld.test.ts` checks the Alert route against streamed-world collision and three approach directions.

`tests/ngPlus.test.ts` adds finite-resource fights for all 49 scripted encounters, including boss variants: two seeds/starts at NG+1, NG+2, NG+3 and NG+7 (392 fights). It uses actual health, ten Reagent doses, finite ammunition, normal healing and death, a reinforced weapon, and real mechanics. All weapons are also exercised with a modest carried build in the opening NG+ fight, and every ordinary hostile is fought at the ceiling. Hovering foes are shot with finite ammunition; a hidden Being from Beyond is approached from a legal Unmoored starting state. The legacy immortal damage-tally mode remains for first-journey comparison; no claim that its zero ordinary deaths proves survival is made.

The finite benchmark uses one deterministic bot, reference attributes at NG+1–3 and capped attributes at NG+7, a clear synthetic arena with each encounter's authored radius, and no mechanic waivers. It is **not a human completion-rate forecast**. Its broad roster acceptance floors catch large regressions; they do not certify every individual encounter. Deaths, timeouts and unsupported strategies remain visible in `docs/NGPLUS_RESULTS.md`. In particular, the bot is not a complete solver for petrification, hidden-platform navigation or root prioritization. Actual-world collision is now covered for the Alert route only. Skilled human playtesting and the remaining dungeon routes are still needed before calling the tuning final.

`NGPLUS_WRITE=1 npm run audit` refreshes that report. Default audits validate the same benchmark without rewriting files. No generated per-boss fit hides individual failures or silently changes its own targets.
