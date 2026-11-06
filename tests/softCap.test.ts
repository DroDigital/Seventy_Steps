/** Purchased levels keep their full value throughout each attribute's progression. */
import { describe, expect, it } from 'vitest';
import { LEVELS, PLAYER, STAMINA } from '../src/data/tuning';
import { createGame, createWorldGame } from '../src/systems/game';
import { applyLevels, buyLevel, might, nextLevelCost } from '../src/systems/levels';
import { healthAt, levelsWorth, levelWorth, mightAt, staminaAt, staminaRegen } from '../src/systems/levelWorth';
import { applySave, snapshot } from '../src/systems/save';
import { levelGain } from '../src/ui/levelGains';

describe('full level gains', () => {
  it('gives the same health, stamina and recovery per level through the maximum, and damage halved past the Might knee', () => {
    for (let n = 0; n <= LEVELS.vigour.max; n++) {
      expect(levelWorth(n)).toBe(n);
      expect(healthAt(n)).toBe(PLAYER.hp + n * LEVELS.vigour.hp!);
      expect(staminaAt(n)).toBe(PLAYER.stamina + n * LEVELS.endurance.stamina!);
      expect(staminaRegen(n)).toBeCloseTo(STAMINA.regen + n * LEVELS.endurance.regen!, 9);
      expect(mightAt(n)).toBeCloseTo(1 + Math.min(n, LEVELS.might.knee!) * LEVELS.might.damage! + Math.max(0, n - LEVELS.might.knee!) * LEVELS.might.past!, 9); // (2026-11-01: half a level's worth past the knee)
      if (n < LEVELS.vigour.max) {
        expect(levelGain('vigour', n)).toBe('+16 health');
        expect(levelGain('endurance', n)).toBe('+8 stamina, faster recovery');
        expect(levelGain('might', n)).toBe(n < LEVELS.might.knee! ? '+4% damage' : '+2% damage');
      }
    }
    expect(levelWorth(20.5)).toBe(20.5);
    expect(levelWorth(-1)).toBe(0);
    expect(levelsWorth({ vigour: 30, endurance: 30, might: 30 })).toBe(90);
  });

  it('applies a purchase beyond both former thresholds and keeps existing wounds', () => {
    const g = createGame();
    g.player.levels = { vigour: 26, endurance: 26, might: 26 };
    applyLevels(g);
    const h = g.ecs.c.health.get(g.player.id)!;
    h.hp = 100;
    g.player.echoes = nextLevelCost(g);
    expect(buyLevel(g, 'vigour')).toBe(true);
    expect(h).toMatchObject({ max: healthAt(27), hp: 116 });
    expect(might(g, g.player.id)).toBeCloseTo(mightAt(26), 9);
  });

  it('loads a previous save with its purchased levels and current health, recalculating the maxima', () => {
    const old = createWorldGame();
    old.player.levels = { vigour: 30, endurance: 30, might: 30 };
    applyLevels(old);
    const saved = { ...snapshot(old), hp: 431 };
    const loaded = createWorldGame();
    applySave(loaded, saved);
    expect(loaded.player.levels).toEqual(old.player.levels);
    expect(loaded.ecs.c.health.get(loaded.player.id)).toMatchObject({ max: healthAt(30), hp: 431 });
    expect(loaded.ecs.c.stamina.get(loaded.player.id)!.max).toBe(staminaAt(30));
  });
});
