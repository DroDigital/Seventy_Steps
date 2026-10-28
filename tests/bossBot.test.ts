/**
 * A bot fights every scripted boss in the arena (playtest round 24): it closes to the body's edge,
 * strikes, dodges now and again, does what E offers, and cannot be killed. Nothing may throw or be
 * left not a number, and every boss it can reach falls within four minutes with a legal build (except the two named slow fights). Two finds came
 * out of this: a blow that killed a boss whose summons its fall had just cleared went on to reach
 * for them, and the colossi (Cthulhu, Ghatanothoa, Yog-Sothoth, Shub-Niggurath) could not be struck.
 */
import { describe, expect, it } from 'vitest';
import { ENTITIES } from '../src/data/registry';
import { botFight } from './botHelpers';

const FRAMES = 60 * 240; // capped Might replaces the old impossible Might150; scaled Yog-Sothoth needs more than150s
const BOSSES = Object.values(ENTITIES).filter((e) => e.bossScript).map((e) => e.id);
/** What these ask of the investigator is more than the bot does: to take the Alert's helm, to keep behind a monolith from a gaze that turns flesh to stone, to cut down the roots. It wounds them all the same. */
const ASKS_MORE = ['cthulhu', 'ghatanothoa', 'shub_niggurath'];
/** The Haunter takes harm only by a lamp's light, and the bot lights a lamp only when it happens to stand by one: from eight starts it needs 123 to 303 seconds (round 83: four minutes was a lucky start's, 128 s, and 5 of 8 starts before it), so it has six. */
// Yog's restored 6100 health takes this max-Might bot about 320 seconds; it must still fell the boss.
const SLOW: Record<string, number> = { haunter_of_the_dark: 60 * 360, yog_sothoth: 60 * 360 };

describe('a bot fights every boss (playtest round 24)', () => {
  it('has bosses to fight', () => expect(BOSSES.length).toBeGreaterThan(40));

  it.each(BOSSES)('%s: no throw, nothing left not a number, and it falls (or is wounded, if it asks more)', (id) => {
    const r = botFight(id, SLOW[id] ?? FRAMES);
    expect(r.bad).toEqual([]);
    if (ASKS_MORE.includes(id)) expect(r.dealt).toBeGreaterThan(0);
    else expect(r.fell).toBe(true);
  });
});
