import { describe, expect, it } from 'vitest';
import { RELIC_IDS, RELIC_SLOTS, RELICS } from '../src/data/relics';
import { createWorldGame } from '../src/systems/game';
import { boon, bountyOf, grant, owned, relicEffects, relicFor, slotsOf, wear, worn } from '../src/systems/relics';
import { mendRate } from '../src/systems/sanity';
import { parseSave, snapshot } from '../src/systems/save';

describe('relics and tempers (round 26)', () => {
  it('each gift has a price', () => {
    for (const id of RELIC_IDS) {
      const r = RELICS[id] as Record<string, number | string>;
      const good = (k: string, v: number) => (k === 'taken' ? v < 1 : v > 1);
      const gifts = Object.entries(r).filter(([k, v]) => typeof v === 'number' && good(k, v));
      const prices = Object.entries(r).filter(([k, v]) => typeof v === 'number' && !good(k, v));
      expect(gifts.length, id).toBeGreaterThan(0);
      expect(prices.length, id).toBeGreaterThan(0);
    }
  });

  it('a horror slain leaves a relic, each a different one, until all are found', () => {
    const g = createWorldGame();
    expect(owned(g)).toEqual([]);
    for (let i = 0; i < RELIC_IDS.length + 2; i++) {
      const id = relicFor(g, 'Dagon');
      if (!id) break;
      grant(g, id);
    }
    expect(owned(g).length).toBe(RELIC_IDS.length);
    expect(relicFor(g, 'Dagon')).toBeUndefined();
  });

  it('only the worn relics change bounties and mending', () => {
    const g = createWorldGame();
    expect(bountyOf(g, 100)).toBe(100);
    grant(g, 'blackCoin');
    expect(bountyOf(g, 100)).toBe(130);
    g.mind.sanity = 50;
    grant(g, 'yellowSeal');
    expect(boon(g, 'mend')).toBeCloseTo(0.35);
    expect(mendRate(g)).toBeGreaterThanOrEqual(0);
    grant(g, 'paleLamp'); // the third found: kept, not worn
    expect(boon(g, 'mend')).toBeCloseTo(0.35);
    expect(owned(g)).toContain('paleLamp');
  });
});

describe('two relics are worn at a time, chosen at an Elder Sign', () => {
  it('the first two found are worn at once; the rest wait', () => {
    const g = createWorldGame();
    expect(RELIC_SLOTS).toBe(2);
    expect(grant(g, 'starHook')).toBe(true);
    expect(grant(g, 'blackCoin')).toBe(true);
    expect(grant(g, 'paleLamp')).toBe(false);
    expect(worn(g)).toEqual(['starHook', 'blackCoin']);
    expect(owned(g)).toEqual(['starHook', 'blackCoin', 'paleLamp']);
  });

  it('a slot takes any relic found, and gives up what it held', () => {
    const g = createWorldGame();
    for (const id of ['starHook', 'blackCoin', 'paleLamp'] as const) grant(g, id);
    expect(wear(g, 1, 'paleLamp')).toBe(true);
    expect(slotsOf(g)).toEqual(['starHook', 'paleLamp']);
    expect(boon(g, 'echoes')).toBe(1); // the coin is not worn now
    expect(wear(g, 0, null)).toBe(true);
    expect(slotsOf(g)).toEqual([null, 'paleLamp']);
    expect(grant(g, 'saltCharm')).toBe(true); // a slot is free again
    expect(slotsOf(g)).toEqual(['saltCharm', 'paleLamp']);
  });

  it('one worn in the other slot changes places with the slot chosen', () => {
    const g = createWorldGame();
    grant(g, 'starHook');
    grant(g, 'blackCoin');
    wear(g, 0, 'blackCoin');
    expect(slotsOf(g)).toEqual(['blackCoin', 'starHook']);
    wear(g, 1, 'starHook'); // already there: nothing changes
    expect(slotsOf(g)).toEqual(['blackCoin', 'starHook']);
  });

  it('refuses a relic not found, and a slot there is not', () => {
    const g = createWorldGame();
    grant(g, 'starHook');
    expect(wear(g, 1, 'yellowSeal')).toBe(false);
    expect(wear(g, 2, 'starHook')).toBe(false);
    expect(wear(g, -1, 'starHook')).toBe(false);
    expect(wear(g, 0.5, 'starHook')).toBe(false);
    expect(slotsOf(g)).toEqual(['starHook', null]);
  });

  it('no two builds are the same: what is worn changes the blows dealt and taken', () => {
    const g = createWorldGame();
    for (const id of RELIC_IDS) grant(g, id);
    const build = (a: (typeof RELIC_IDS)[number], b: (typeof RELIC_IDS)[number]) => {
      wear(g, 0, null);
      wear(g, 1, null);
      wear(g, 0, a);
      wear(g, 1, b);
      return { dealt: boon(g, 'dealt'), taken: boon(g, 'taken'), echoes: boon(g, 'echoes'), mend: boon(g, 'mend') };
    };
    const distinct = new Set<string>();
    for (const a of RELIC_IDS) for (const b of RELIC_IDS) if (a < b) distinct.add(JSON.stringify(build(a, b)));
    expect(distinct.size).toBe((RELIC_IDS.length * (RELIC_IDS.length - 1)) / 2); // every pair a different build
  });

  it('what is worn is kept in the save', () => {
    const g = createWorldGame();
    for (const id of ['starHook', 'blackCoin', 'paleLamp'] as const) grant(g, id);
    wear(g, 0, 'paleLamp');
    const loaded = createWorldGame({ save: parseSave(JSON.stringify(snapshot(g)))! });
    expect(slotsOf(loaded)).toEqual(['paleLamp', 'blackCoin']);
    expect(owned(loaded)).toEqual(['starHook', 'blackCoin', 'paleLamp']);
  });

  it('a save from before the slots keeps its first two relics worn, and the others waiting', () => {
    const g = createWorldGame();
    for (const id of ['yellowSeal', 'saltCharm', 'starHook']) g.overworld!.told.add(`relic:${id}`); // as the old rules left them: found, all worn
    const old = snapshot(g);
    expect(old.told!.some((k) => k.startsWith('slot:'))).toBe(false);
    const loaded = createWorldGame({ save: parseSave(JSON.stringify(old))! });
    expect(slotsOf(loaded)).toEqual(['yellowSeal', 'saltCharm']);
    expect(owned(loaded)).toEqual(['yellowSeal', 'saltCharm', 'starHook']);
  });

  it('the menus show each effect as a signed figure, green for a gift and red for a price (round 52)', () => {
    for (const id of RELIC_IDS) {
      const fx = relicEffects(id);
      expect(fx.some((e) => e.good), id).toBe(true);
      expect(fx.some((e) => !e.good), id).toBe(true);
      for (const e of fx) expect(e.text, id).toMatch(/ [+−]\d+%$/);
    }
    const hook = relicEffects('starHook');
    expect(hook).toEqual([{ text: 'Damage +10%', good: true }, { text: 'Mending −40%', good: false }]);
    expect(relicEffects('saltCharm')).toEqual([{ text: 'Damage taken −8%', good: true }, { text: 'Echoes −15%', good: false }]); // less harm taken is a gift
    expect(relicEffects('blackCoin')).toEqual([{ text: 'Damage taken +8%', good: false }, { text: 'Echoes +30%', good: true }]);
  });
});
