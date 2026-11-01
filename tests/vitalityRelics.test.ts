import { describe, expect, it } from 'vitest';
import { RELICS } from '../src/data/relics';
import { createWorldGame } from '../src/systems/game';
import { applyLevels } from '../src/systems/levels';
import { healthAt, staminaAt, staminaRegen } from '../src/systems/levelWorth';
import { boon, grant, owned, relicEffects, relicFor, slotsOf, wear } from '../src/systems/relics';
import { parseSave, snapshot } from '../src/systems/save';
import { tickStamina } from '../src/systems/stamina';
import { levelGain } from '../src/ui/levelGains';

describe('health and stamina relics', () => {
  it('a relic kept with both slots full has no effect until chosen', () => {
    const g = createWorldGame();
    grant(g, 'starHook');
    grant(g, 'saltCharm');
    expect(grant(g, 'heartwood')).toBe(false);
    expect(g.ecs.c.health.get(g.player.id)!.max).toBe(healthAt(0));
    expect(g.ecs.c.stamina.get(g.player.id)!.max).toBe(staminaAt(0));
    wear(g, 0, 'heartwood');
    expect(g.ecs.c.health.get(g.player.id)!.max).toBe(Math.round(healthAt(0) * 1.15));
  });

  it('applies worn capacity bonuses and prices immediately, without making equipment changes a free heal', () => {
    const g = createWorldGame();
    const h = g.ecs.c.health.get(g.player.id)!;
    const s = g.ecs.c.stamina.get(g.player.id)!;
    h.hp = h.max / 2;
    s.value = s.max / 4;
    grant(g, 'heartwood');
    expect(h.max).toBe(Math.round(healthAt(0) * 1.15));
    expect(h.hp).toBeCloseTo(h.max / 2);
    expect(s.max).toBe(Math.round(staminaAt(0) * 0.9));
    expect(s.value).toBeCloseTo(s.max / 4);
    grant(g, 'drownedLung');
    expect(h.max).toBe(Math.round(healthAt(0) * 1.15 * 0.92));
    expect(s.max).toBe(Math.round(staminaAt(0) * 0.9 * 1.2));
    wear(g, 0, null);
    wear(g, 0, 'heartwood');
    expect(h.hp).toBeCloseTo(h.max / 2);
    expect(s.value).toBeCloseTo(s.max / 4);
    expect(relicEffects('heartwood')).toEqual([{ text: 'Max health +15%', good: true }, { text: 'Max stamina −10%', good: false }]);
    expect(relicEffects('drownedLung')).toEqual([{ text: 'Max health −8%', good: false }, { text: 'Max stamina +20%', good: true }]);
  });

  it('changes actual stamina recovery only while worn, including a combined build', () => {
    const g = createWorldGame();
    const s = g.ecs.c.stamina.get(g.player.id)!;
    grant(g, 'dreamKnot');
    grant(g, 'bloodAmber');
    expect(boon(g, 'dealt')).toBe(RELICS.bloodAmber.dealt);
    expect(boon(g, 'echoes')).toBe(RELICS.dreamKnot.echoes);
    expect(s.regen).toBeCloseTo(staminaRegen(0) * 1.2 * 1.1);
    s.value = 0;
    s.delay = 0;
    tickStamina(s, 'idle', 1);
    expect(s.value).toBeCloseTo(staminaRegen(0) * 1.2 * 1.1);
    wear(g, 0, null);
    expect(s.regen).toBeCloseTo(staminaRegen(0) * 1.1);
    expect(relicEffects('dreamKnot')).toEqual([{ text: 'Stamina recovery +20%', good: true }, { text: 'Echoes −15%', good: false }]);
  });

  it('preserves stamina debt and cannot revive a dead investigator when changing relics', () => {
    const g = createWorldGame();
    const h = g.ecs.c.health.get(g.player.id)!;
    const s = g.ecs.c.stamina.get(g.player.id)!;
    h.hp = 0;
    s.value = -17;
    grant(g, 'drownedLung');
    expect(h.hp).toBe(0);
    expect(s.value).toBe(-17);
    wear(g, 0, null);
    expect(h.hp).toBe(0);
    expect(s.value).toBe(-17);
  });

  it('keeps the correct maxima and health through save/load and subsequent level gains', () => {
    const g = createWorldGame();
    grant(g, 'heartwood');
    grant(g, 'dreamKnot');
    g.player.levels.vigour = 5;
    g.player.levels.endurance = 3;
    applyLevels(g);
    const h = g.ecs.c.health.get(g.player.id)!;
    h.hp = h.max / 2;
    const savedHp = h.hp;
    const loaded = createWorldGame({ save: parseSave(JSON.stringify(snapshot(g)))! });
    const lh = loaded.ecs.c.health.get(loaded.player.id)!;
    const ls = loaded.ecs.c.stamina.get(loaded.player.id)!;
    expect(slotsOf(loaded)).toEqual(['heartwood', 'dreamKnot']);
    expect(lh.max).toBe(Math.round(healthAt(5) * 1.15));
    expect(lh.hp).toBeCloseTo(savedHp);
    expect(ls.max).toBe(Math.round(staminaAt(3) * 0.9));
    expect(ls.regen).toBeCloseTo(staminaRegen(3) * 1.2);
    const oldMax = lh.max;
    loaded.player.levels.vigour++;
    applyLevels(loaded);
    expect(lh.hp - savedHp).toBe(lh.max - oldMax);
    expect(levelGain('vigour', 5, boon(loaded, 'health'))).toBe(`+${lh.max - oldMax} health`);
    expect(levelGain('endurance', 3, 1, boon(loaded, 'stamina'))).toBe(`+${Math.round(staminaAt(4) * 0.9) - Math.round(staminaAt(3) * 0.9)} stamina, faster recovery`);
  });

  it('offers the new relics to an existing save that already found all five originals', () => {
    const g = createWorldGame();
    for (const id of ['starHook', 'blackCoin', 'paleLamp', 'yellowSeal', 'saltCharm'] as const) grant(g, id);
    const loaded = createWorldGame({ save: parseSave(JSON.stringify(snapshot(g)))! });
    const first = relicFor(loaded, 'Dagon');
    loaded.events.emit('Vanquished', { entity: 0, name: 'Dagon' });
    expect(owned(loaded)).toContain(first);
    for (let i = 0; i < 3; i++) {
      const id = relicFor(loaded, 'Dagon');
      expect(id).toBeDefined();
      grant(loaded, id!);
    }
    expect(owned(loaded)).toEqual(expect.arrayContaining(['heartwood', 'drownedLung', 'dreamKnot', 'bloodAmber']));
    expect(relicFor(loaded, 'Dagon')).toBeUndefined();
  });

  it('does not re-equip deliberately emptied slots after loading', () => {
    const g = createWorldGame();
    grant(g, 'heartwood');
    grant(g, 'drownedLung');
    wear(g, 0, null);
    wear(g, 1, null);
    const loaded = createWorldGame({ save: parseSave(JSON.stringify(snapshot(g)))! });
    expect(slotsOf(loaded)).toEqual([null, null]);
    expect(loaded.ecs.c.health.get(loaded.player.id)!.max).toBe(healthAt(0));
    expect(loaded.ecs.c.stamina.get(loaded.player.id)!.max).toBe(staminaAt(0));
  });
});
