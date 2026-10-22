import { describe, expect, it } from 'vitest';
import { ENTITIES, getEntity, variantOf, type Variant } from '../src/data/registry';
import { BOSS, BOSS_LEVEL_SCALING, DIFFICULTIES, NEW_GAME_PLUS, SHUB } from '../src/data/tuning';
import { applyChange } from '../src/systems/arenaChanges';
import { resetFight } from '../src/systems/bossFight';
import { strike } from '../src/systems/combat';
import { morph, spawnCreature } from '../src/systems/creatures';
import { foeDamage } from '../src/systems/cycles';
import { createGame, createWorldGame } from '../src/systems/game';
import { applyLevels, buyLevel, nextLevelCost } from '../src/systems/levels';
import { applySave, snapshot } from '../src/systems/save';
import { summon } from '../src/systems/specials';
import { worldLayout } from '../src/world/placements';
import { bossGame, calm, engage } from './bossHelpers';
import { steps } from './helpers';
import { creatureOf, deathblow, goTo, run } from './worldHelpers';

const AT = { x: 0, z: 0, yaw: 0 };
const healthAt = (levels: number): number => 1 + levels * BOSS_LEVEL_SCALING.health;
const damageAt = (levels: number): number => 1 + levels * BOSS_LEVEL_SCALING.damage;

describe('only bosses scale with player level', () => {
  it('every hostile scripted form scales health and damage; ordinary creatures and allies stay as authored', () => {
    const g = createGame();
    g.player.levels = { vigour: 10, endurance: 5, might: 5 }; // level 21
    applyLevels(g);
    for (const def of ENTITIES) {
      for (const variant of [undefined, 'eldritch', 'boss'] as const) {
        const form = variant ? variantOf(def, variant) : def;
        if (!form) continue;
        const e = spawnCreature(g, def.id, AT, variant as Variant | undefined)!;
        const boss = form.tier !== 'ally' && !!form.bossScript;
        const h = g.ecs.c.health.get(e)!;
        expect(h.max, `${def.id} ${variant}`).toBe(Math.round(form.stats.hp * (boss ? healthAt(20) : 1)));
        expect(foeDamage(g, e), `${def.id} ${variant}`).toBeCloseTo(boss ? damageAt(20) : 1);
        expect(h.baseMax).toBe(boss ? form.stats.hp : undefined);
        g.ecs.despawn(e);
      }
    }
  });

  it('level one retains the original boss stats, speeds and attack timing', () => {
    const low = bossGame('dr_munoz');
    const high = bossGame('dr_munoz');
    high.g.player.levels = { vigour: 20, endurance: 20, might: 20 };
    applyLevels(high.g);
    expect(low.g.ecs.c.health.get(low.boss)!.max).toBe(getEntity('dr_munoz')!.stats.hp);
    expect(foeDamage(low.g, low.boss)).toBe(1);
    expect(high.g.ecs.c.health.get(high.boss)!.max).toBe(Math.round(getEntity('dr_munoz')!.stats.hp * healthAt(60)));
    expect(high.g.ecs.c.health.get(high.boss)!.max).toBeGreaterThan(low.g.ecs.c.health.get(low.boss)!.max);
    expect(foeDamage(high.g, high.boss)).toBe(damageAt(60));
    expect(foeDamage(high.g, high.boss)).toBeGreaterThan(foeDamage(low.g, low.boss));
    expect(high.g.ecs.c.brain.get(high.boss)!.speed).toBe(low.g.ecs.c.brain.get(low.boss)!.speed);
    expect(high.g.ecs.c.actor.get(high.boss)!.moves).toEqual(low.g.ecs.c.actor.get(low.boss)!.moves);
  });

  it('a purchased level updates existing bosses without healing wounds, resetting phases or compounding', () => {
    const b = bossGame('dr_munoz');
    const { g, boss, fight } = b;
    engage(b);
    calm(b);
    const h = g.ecs.c.health.get(boss)!;
    h.hp = h.max * 0.3;
    steps(g, 1);
    const phase = fight.phase;
    g.player.echoes = nextLevelCost(g);
    expect(buyLevel(g, 'endurance')).toBe(true);
    expect(h.max).toBe(Math.round(getEntity('dr_munoz')!.stats.hp * healthAt(1)));
    expect(h.hp / h.max).toBeCloseTo(0.3);
    expect(fight.phase).toBe(phase);
    const after = { hp: h.hp, max: h.max };
    for (let i = 0; i < 10; i++) applyLevels(g);
    expect(h).toMatchObject(after);
    resetFight(g, boss, fight);
    expect(h).toMatchObject(after);
    expect(foeDamage(g, boss)).toBeCloseTo(damageAt(1));
  });

  it('does not rescale ordinary active enemies, the training dummy, adds or roots', () => {
    const { g, boss, fight } = bossGame('shub_niggurath');
    const foe = spawnCreature(g, 'deep_one', AT)!;
    const dummy = [...g.ecs.c.model].find(([, m]) => m === 'dummy')![0];
    const add = summon(g, boss, 'thousand_young')!;
    applyChange(g, boss, fight, 'roots');
    const root = fight.props.find((e) => g.ecs.c.prop.get(e)?.kind === 'root')!;
    const before = [foe, dummy, add, root].map((e) => ({ e, ...g.ecs.c.health.get(e)! }));
    g.player.levels = { vigour: 10, endurance: 10, might: 10 };
    applyLevels(g);
    for (const h of before) expect(g.ecs.c.health.get(h.e)!).toMatchObject({ hp: h.hp, max: h.max });
    expect(g.ecs.c.health.get(root)!.max).toBe(SHUB.hp);
    expect(foeDamage(g, foe)).toBe(1);
    expect(foeDamage(g, add)).toBe(BOSS.servantDamage);
    expect(foeDamage(g, root)).toBe(1);
    expect(foeDamage(g, boss)).toBe(damageAt(30));
  });

  it('composes with difficulty and NG+ for real boss blows, while allies retain their damage', () => {
    const { g, boss } = bossGame('dr_munoz');
    g.player.levels = { vigour: 10, endurance: 5, might: 5 };
    g.player.cycle = 2;
    g.player.difficulty = 'nightmare';
    applyLevels(g);
    const h = g.ecs.c.health.get(boss)!;
    expect(h.max).toBe(Math.round(getEntity('dr_munoz')!.stats.hp * (1 + 2 * NEW_GAME_PLUS.health) * healthAt(20)));
    const damage = 40 * DIFFICULTIES.nightmare.foe * (1 + 2 * NEW_GAME_PLUS.damage) * damageAt(20);
    const me = g.ecs.c.health.get(g.player.id)!;
    const before = me.hp;
    expect(strike(g, boss, g.player.id, { damage: 40, poise: 0, guard: 0, hitstop: 0, parryable: false, interrupts: false })).toBe('hit');
    expect(before - me.hp).toBe(Math.round(damage));
    const ally = spawnCreature(g, 'nodens', AT)!;
    expect(foeDamage(g, ally)).toBe(1);
  });

  it('morphing a boss recomputes scaling from the new form and keeps its wounds', () => {
    const { g, boss } = bossGame('nyarlathotep');
    g.player.levels.might = 10;
    g.player.cycle = 1;
    applyLevels(g);
    const h = g.ecs.c.health.get(boss)!;
    h.hp = h.max * 0.4;
    morph(g, boss, 'nyarlathotep', 'eldritch');
    const def = variantOf(getEntity('nyarlathotep')!, 'eldritch')!;
    expect(h.max).toBe(Math.round(def.stats.hp * 1.6 * healthAt(10)));
    expect(h.hp / h.max).toBeCloseTo(0.4);
    applyLevels(g);
    expect(h.max).toBe(Math.round(def.stats.hp * 1.6 * healthAt(10)));
    expect(h.hp / h.max).toBeCloseTo(0.4);
  });

  it('a dead boss stays dead after later levels', () => {
    const { g, boss } = bossGame('dunwich_horror');
    expect(strike(g, g.player.id, boss, deathblow)).toBe('kill');
    g.player.levels.might = 20;
    applyLevels(g);
    expect(g.ecs.c.health.get(boss)!.hp).toBe(0);
    expect(g.ecs.c.actor.get(boss)!.move).toBe('death');
  });

  it('saved levels, NG+ and boss wounds return together without a save-format change', () => {
    const g = createWorldGame();
    g.player.levels = { vigour: 10, endurance: 5, might: 5 };
    g.player.cycle = 2;
    applyLevels(g);
    const at = worldLayout().spawns.find((s) => s.id === 'boss:dunwich_horror')!.at;
    goTo(g, at.x, at.z + 12);
    run(g, 2);
    const boss = creatureOf(g, 'boss:dunwich_horror')!;
    const h = g.ecs.c.health.get(boss)!;
    h.hp = h.max * 0.4;
    const saved = snapshot(g);
    const loaded = createWorldGame({ save: saved });
    const foe = creatureOf(loaded, 'boss:dunwich_horror')!;
    const restored = loaded.ecs.c.health.get(foe)!;
    expect(restored.max).toBe(h.max);
    expect(restored.hp / restored.max).toBeCloseTo(0.4);
    expect(foeDamage(loaded, foe)).toBeCloseTo(foeDamage(g, boss));
    const active = spawnCreature(loaded, 'cthulhu', AT)!;
    const wounded = loaded.ecs.c.health.get(active)!;
    wounded.hp = wounded.max * 0.5;
    const previous = wounded.max;
    applySave(loaded, { ...saved, cycle: 1, levels: { vigour: 5, endurance: 0, might: 0 } });
    expect(wounded.max).toBeLessThan(previous);
    expect(wounded.hp / wounded.max).toBeCloseTo(0.5);
  });
});
