/**
 * Soft caps on the levels (round 71, asked: "Souls-style ... full gains up to about level 15 to 20, roughly half after that, very little near
 * the cap of 30"): past the marks of `SOFT_CAP` a level of Vigour, Endurance or Might is worth a fraction of one, in the health, stamina,
 * recovery and blows it gives, and in what the horrors grow to meet (systems/levelWorth.ts). The journey as it is made stays whole.
 */
import { describe, expect, it } from 'vitest';
import { BOSS_STANDING } from '../src/data/bossStanding';
import { BOSS_OVERMATCH, LEVELS, PLAYER, SOFT_CAP, STAMINA } from '../src/data/tuning';
import { bossHealthScale, overmatch } from '../src/systems/bossScaling';
import { createGame, createWorldGame } from '../src/systems/game';
import { applyLevels, might, staminaRegen } from '../src/systems/levels';
import { healthAt, levelsWorth, levelWorth, mightAt, nextWorth, staminaAt } from '../src/systems/levelWorth';
import { applySave, snapshot } from '../src/systems/save';
import { levelGain, softCap } from '../src/ui/levelGains';

const [FIRST, MOST] = [SOFT_CAP[0].after, LEVELS.might.max];
const IDS = Object.keys(LEVELS) as (keyof typeof LEVELS)[];

describe('what a level is worth (systems/levelWorth.ts)', () => {
  it('is as it was asked: whole to about level 15 to 20, about half after that, very little near the cap of 30', () => {
    expect(FIRST).toBeGreaterThanOrEqual(15);
    expect(FIRST).toBeLessThanOrEqual(20);
    expect(nextWorth(0)).toBe(1);
    expect(nextWorth(FIRST - 1)).toBe(1); // the last level before the mark is whole
    expect(nextWorth(FIRST)).toBeGreaterThanOrEqual(0.4);
    expect(nextWorth(FIRST)).toBeLessThanOrEqual(0.6);
    expect(nextWorth(MOST - 1)).toBeGreaterThan(0);
    expect(nextWorth(MOST - 1)).toBeLessThanOrEqual(0.2);
  });

  it('has its marks inside the levels there are, rising, each level softer than the last', () => {
    for (const id of IDS) for (const t of SOFT_CAP) expect(t.after, id).toBeLessThan(LEVELS[id].max);
    SOFT_CAP.forEach((t, i) => {
      expect(t.worth).toBeGreaterThan(0);
      expect(t.worth).toBeLessThan(i ? SOFT_CAP[i - 1].worth : 1);
      if (i) expect(t.after).toBeGreaterThan(SOFT_CAP[i - 1].after);
    });
  });

  it('counts the first levels whole, then falls away without a jump, and never loses a level', () => {
    for (let n = 0; n <= FIRST; n++) expect(levelWorth(n)).toBe(n);
    let last = nextWorth(0);
    for (let n = 1; n < MOST; n++) {
      expect(levelWorth(n + 1)).toBeGreaterThan(levelWorth(n));
      expect(nextWorth(n)).toBeLessThanOrEqual(last + 1e-12); // (a mark is a step down in the worth of a level, never up)
      last = nextWorth(n);
    }
    expect(levelWorth(FIRST + 0.5)).toBeCloseTo(FIRST + 0.5 * SOFT_CAP[0].worth, 9); // (continuous: a part of a level is a part of its worth)
    expect(levelWorth(MOST)).toBeCloseTo(20 + 6 * 0.5 + 4 * 0.2, 9); // thirty levels are worth 23.8
  });

  it('counts a record of levels by the worth of each attribute, and a person at the cap has not ninety levels but 71.4', () => {
    expect(levelsWorth({ vigour: 10, endurance: 5, might: 5 })).toBe(20);
    expect(levelsWorth({ vigour: 22, endurance: 0, might: 0 })).toBe(21);
    expect(levelsWorth({ vigour: MOST, endurance: MOST, might: MOST })).toBeCloseTo(71.4, 9);
    expect(levelsWorth({})).toBe(0);
  });

  it('leaves the journey as it is made whole: no horror is met past the first mark', () => {
    for (const [id, [vigour, might]] of Object.entries(BOSS_STANDING)) {
      expect(vigour, `${id} Vigour`).toBeLessThanOrEqual(FIRST);
      expect(might, `${id} Might`).toBeLessThanOrEqual(FIRST);
    }
  });
});

describe('what the levels give', () => {
  it('is what it was up to the first mark', () => {
    for (const n of [0, 1, 7, FIRST]) {
      expect(healthAt(n)).toBe(PLAYER.hp + n * LEVELS.vigour.hp!);
      expect(staminaAt(n)).toBe(PLAYER.stamina + n * LEVELS.endurance.stamina!);
      expect(staminaRegen(n)).toBeCloseTo(STAMINA.regen + n * LEVELS.endurance.regen!, 9);
      expect(mightAt(n)).toBeCloseTo(1 + n * LEVELS.might.damage!, 9);
    }
  });

  it('is less than a level a time past it, at the cap 541 health, 290 stamina, 51.04 stamina a second and blows of 1.952', () => {
    expect(healthAt(FIRST + 1)).toBe(healthAt(FIRST) + 8);
    expect(healthAt(MOST)).toBe(541); // previous balance: 431
    expect(staminaAt(MOST)).toBe(290); // previous balance: 281
    expect(staminaRegen(MOST)).toBeCloseTo(51.04, 9); // previous balance: 50.08
    expect(mightAt(MOST)).toBeCloseTo(1.952, 9); // previous balance: 1.904
    for (const n of [FIRST + 1, 22, 26, 28, MOST]) {
      expect(healthAt(n)).toBeLessThan(PLAYER.hp + n * LEVELS.vigour.hp!);
      expect(healthAt(n)).toBeGreaterThan(healthAt(n - 1) - 1); // (rounded to a whole point of health, and never falling)
      expect(Number.isInteger(healthAt(n)) && Number.isInteger(staminaAt(n))).toBe(true);
    }
  });

  it('sets the investigator’s health, stamina, recovery and blows when the levels are bought, and a wound is kept when one is bought past the mark', () => {
    const g = createGame();
    const me = g.player.id;
    g.player.levels = { vigour: FIRST, endurance: FIRST, might: FIRST };
    applyLevels(g);
    const [h, s] = [g.ecs.c.health.get(me)!, g.ecs.c.stamina.get(me)!];
    h.hp = 100;
    g.player.levels.vigour++;
    g.player.levels.endurance++;
    applyLevels(g);
    expect(h).toMatchObject({ max: healthAt(FIRST) + 8, hp: 108 });
    expect(s.max).toBe(staminaAt(FIRST) + 4);
    g.player.levels = { vigour: MOST, endurance: MOST, might: MOST };
    applyLevels(g);
    expect(h.max).toBe(541);
    expect(s.max).toBe(290);
    expect(s.regen).toBeCloseTo(51.04, 9);
    expect(might(g, me)).toBeCloseTo(1.952, 9);
    expect(might(g, me + 999)).toBe(1); // (and no one else's blows)
  });

  it('loads a save from the previous balance while retaining purchased levels and current health', () => {
    const g = createWorldGame();
    g.player.levels = { vigour: MOST, endurance: MOST, might: MOST };
    applyLevels(g);
    const old = { ...snapshot(g), hp: 431 }; // full health under the previous 12 HP / 18-26 soft-cap balance
    const loaded = createWorldGame();
    applySave(loaded, old);
    expect(loaded.ecs.c.health.get(loaded.player.id)).toMatchObject({ max: 541, hp: 431 });
    expect(loaded.player.levels).toEqual({ vigour: MOST, endurance: MOST, might: MOST }); // purchased levels survive the balance update
  });
});

describe('the horrors grow to meet the worth, not the count', () => {
  it('give no more for a soft level than it is worth: the 21st level of Vigour makes a horror half as much harder as the 20th', () => {
    const scale = (vigour: number): number => bossHealthScale(levelsWorth({ vigour, endurance: 0, might: 0 }), 0);
    const [whole, half] = [scale(FIRST) - scale(FIRST - 1), scale(FIRST + 1) - scale(FIRST)];
    expect(half / whole).toBeCloseTo(SOFT_CAP[0].worth, 9);
  });

  it('meet the blows and health the investigator really has: past a horror’s standing, on the soft-capped worth', () => {
    const [v, m] = BOSS_STANDING.cthulhu!;
    const o = overmatch({ vigour: MOST, might: MOST }, 'cthulhu');
    expect(o.health).toBeCloseTo(1 + BOSS_OVERMATCH.share * (mightAt(MOST) / mightAt(m) - 1), 9);
    expect(o.damage).toBeCloseTo(1 + BOSS_OVERMATCH.share * (healthAt(MOST) / healthAt(v) - 1), 9);
    const linear = 1 + BOSS_OVERMATCH.share * ((1 + MOST * LEVELS.might.damage!) / (1 + m * LEVELS.might.damage!) - 1);
    expect(o.health).toBeLessThan(linear); // (thirty levels of Might are not the 2.2 they were)
  });
});

describe('the Elder Sign says what the next level gives (ui/levelGains.ts)', () => {
  it('says the whole gain before the first mark, then the real one', () => {
    expect(levelGain('vigour', 0)).toBe('+16 health');
    expect(levelGain('vigour', FIRST)).toBe('+8 health');
    expect(levelGain('vigour', 26)).toBe('+3 health');
    expect(levelGain('endurance', 0)).toBe('+8 stamina, faster recovery');
    expect(levelGain('endurance', FIRST)).toBe('+4 stamina, faster recovery');
    expect(levelGain('might', 0)).toBe('+4% damage');
    expect(levelGain('might', FIRST)).toBe('+2% damage');
    expect(levelGain('might', 26)).toBe('+0.8% damage');
  });

  it('marks a level that counts for less, and none before the first mark or past the last level', () => {
    expect(softCap('vigour', FIRST - 1)).toBeUndefined();
    expect(softCap('vigour', FIRST)!.chip).toBe('soft cap: 50%');
    expect(softCap('might', 26)!.chip).toBe('soft cap: 20%');
    expect(softCap('might', 26)!.hint).toContain('whole to 20, then 50% to 26, then 20%');
    expect(softCap('endurance', MOST)).toBeUndefined(); // (nothing more to buy)
  });
});
