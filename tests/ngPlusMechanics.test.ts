import { describe, expect, it } from 'vitest';
import { BOSS_JOURNEY, JOURNEY_CURVES, JOURNEY_REFERENCE, REGION_JOURNEYS } from '../src/data/ngPlusTuning';
import { REGIONS } from '../src/data/regions';
import { ENTITIES, getEntity } from '../src/data/registry';
import { BOSS, DIFFICULTIES, NEW_GAME_PLUS, SHUB } from '../src/data/tuning';
import { applyChange } from '../src/systems/arenaChanges';
import { bossHealthScale, overmatch } from '../src/systems/bossScaling';
import { balanceBackupKey } from '../src/systems/balanceMigration';
import { strike } from '../src/systems/combat';
import { morph, spawnCreature } from '../src/systems/creatures';
import { foeBounty, foeDamage } from '../src/systems/cycles';
import { createWorldGame } from '../src/systems/game';
import { hazardSystem, spawnPool } from '../src/systems/hazards';
import { applyLevels, buyLevel, nextLevelCost } from '../src/systems/levels';
import { levelsWorth } from '../src/systems/levelWorth';
import { bossRung, foeRung, homeRung, journeyIndex } from '../src/systems/ngPlus';
import { loose } from '../src/systems/projectiles';
import { parseSave, SAVE_KEY, saveGame, snapshot } from '../src/systems/save';
import { summon } from '../src/systems/specials';
import { regionRect } from '../src/world/worldMap';
import { bossGame } from './bossHelpers';
import { scriptedGame } from './helpers';

describe('regional journeys', () => {
  it('covers every region explicitly, and every override names a scripted boss', () => {
    expect(Object.keys(REGION_JOURNEYS).sort()).toEqual(REGIONS.map((r) => r.id).sort());
    for (const id of Object.keys(BOSS_JOURNEY)) expect(getEntity(id)?.bossScript, id).toBeTruthy();
  });

  it('has substantial early steps, a monotone ladder and a ceiling at NG+7', () => {
    for (const profile of ['early', 'middle', 'late'] as const) {
      const curve = JOURNEY_CURVES[profile];
      expect(curve).toHaveLength(NEW_GAME_PLUS.most + 1);
      expect(foeRung(0, profile)).toEqual({ health: 1, damage: 1 });
      for (let i = 1; i < curve.length; i++) {
        expect(curve[i][0]).toBeGreaterThan(curve[i - 1][0]);
        expect(curve[i][1]).toBeGreaterThan(curve[i - 1][1]);
        // Keep meaningful combined stat growth even on the last steps before the ceiling.
        expect((curve[i][0] * curve[i][1]) / (curve[i - 1][0] * curve[i - 1][1])).toBeGreaterThan(1.08);
      }
      expect(foeRung(100, profile)).toEqual(foeRung(7, profile));
      expect(foeRung(-1, profile)).toEqual(foeRung(0, profile));
    }
    expect(foeRung(3, 'early').health).toBeGreaterThanOrEqual(2.5);
    expect(foeRung(3, 'late').health).toBeGreaterThanOrEqual(2);
    expect(journeyIndex(NaN)).toBe(0);
    expect(journeyIndex(Infinity)).toBe(0);
    expect(journeyIndex(2.9)).toBe(2);
    const g = scriptedGame().g;
    g.player.cycle = 999;
    expect(foeBounty(g)).toBe(4.5);
  });

  it('captures home at spawn, preserves wounds through morphs and never changes at a border', () => {
    const g = createWorldGame();
    g.player.cycle = 3;
    const early = spawnCreature(g, 'ghoul', { x: 10, z: 10, yaw: 0 })!;
    const r = regionRect(REGIONS.find((r) => r.id === 'rlyeh')!);
    const late = spawnCreature(g, 'ghoul', { x: r.x0 + 10, z: r.z0 + 10, yaw: 0 })!;
    const h = g.ecs.c.health.get(early)!;
    expect(h.max).toBeGreaterThan(g.ecs.c.health.get(late)!.max);
    const damage = foeDamage(g, early);
    g.ecs.c.transform.get(early)!.pos = { x: r.x0 + 10, y: 0, z: r.z0 + 10 };
    h.hp = h.max * 0.4;
    morph(g, early, 'ghoul', undefined);
    expect(foeDamage(g, early)).toBe(damage);
    expect(h.hp / h.max).toBeCloseTo(0.4);
    expect(g.ecs.c.journey.get(early)?.profile).toBe('early');
    expect(g.ecs.c.combatant.get(early)!.bounty).toBe(Math.round(getEntity('ghoul')!.drops.echoes * foeBounty(g)));
  });

  it('assigns the southern Dreamlands approach separately from the northern dream', () => {
    const g = createWorldGame();
    const r = regionRect(REGIONS.find((r) => r.id === 'dreamlands')!);
    const at = (z: number) => spawnCreature(g, 'ghoul', { x: r.x0 + 600, z: r.z0 + z, yaw: 0 })!;
    expect(g.ecs.c.journey.get(at(100))?.profile).toBe('middle');
    expect(g.ecs.c.journey.get(at(800))?.profile).toBe('late');
  });

  it('keeps NG+ bosses fixed while player investment improves the investigator', () => {
    const { g, boss } = bossGame('dr_munoz');
    g.player.cycle = 2;
    Object.assign(g.player.levels, JOURNEY_REFERENCE);
    applyLevels(g);
    const h = g.ecs.c.health.get(boss)!;
    const before = { max: h.max, damage: foeDamage(g, boss) };
    h.hp = h.max * 0.3;
    for (const attribute of ['vigour', 'endurance', 'might'] as const) {
      g.player.echoes = nextLevelCost(g);
      expect(buyLevel(g, attribute)).toBe(true);
      expect(h.max).toBe(before.max);
      expect(h.hp / h.max).toBeCloseTo(0.3);
      expect(foeDamage(g, boss)).toBe(before.damage);
    }
    for (const build of [{ vigour: 0, endurance: 0, might: 0 }, { vigour: 30, endurance: 0, might: 0 }, { vigour: 0, endurance: 30, might: 30 }, { vigour: 30, endurance: 30, might: 30 }]) {
      Object.assign(g.player.levels, build);
      applyLevels(g);
      expect(h.max).toBe(before.max);
      expect(h.hp / h.max).toBeCloseTo(0.3);
      expect(foeDamage(g, boss)).toBe(before.damage);
    }
  });

  it('gives every scripted form a growing, finite profile and keeps Azathoth’s clock fixed', () => {
    for (const e of ENTITIES.filter((e) => e.bossScript || e.bossVariant?.bossScript)) {
      const a = bossRung(e.id, 1);
      const b = bossRung(e.id, 3);
      const c = bossRung(e.id, 7);
      expect(a.damage, e.id).toBeGreaterThan(1);
      expect(b.damage, e.id).toBeGreaterThan(a.damage);
      expect(c.damage, e.id).toBeGreaterThan(b.damage);
      expect(c.health, e.id).toBeGreaterThanOrEqual(b.health);
      expect(Number.isFinite(c.health), e.id).toBe(true);
    }
    expect(bossRung('azathoth', 7).health).toBe(1);
  });

  it('inherits only encounter growth for servants, including a summoned boss and a morph', () => {
    const { g, boss } = bossGame('tsathoggua');
    g.player.cycle = 3;
    applyLevels(g);
    const home = g.ecs.c.journey.get(boss)!;
    const rung = homeRung(home, 3);
    const add = summon(g, boss, 'formless_spawn')!;
    expect(g.ecs.c.health.get(add)!.max).toBe(Math.round(getEntity('formless_spawn')!.stats.hp * rung.health));
    expect(foeDamage(g, add)).toBeCloseTo(BOSS.servantDamage * rung.damage);
    const h = g.ecs.c.health.get(add)!;
    h.hp = h.max / 2;
    morph(g, add, 'formless_spawn', undefined);
    expect(h.hp / h.max).toBeCloseTo(0.5);
    expect(g.ecs.c.combatant.get(add)!.bounty).toBe(0);
    const other = summon(g, boss, 'dr_munoz')!;
    expect(g.ecs.c.fight.has(other)).toBe(false);
    expect(g.ecs.c.health.get(other)!.max).toBe(Math.round(getEntity('dr_munoz')!.stats.hp * rung.health));
    g.ecs.despawn(other);
    const unseenBoss = summon(g, boss, 'dunwich_horror')!;
    expect(g.ecs.c.fight.has(unseenBoss)).toBe(false);
    expect(g.ecs.c.unseen.has(unseenBoss)).toBe(false);
    g.ecs.despawn(boss);
    expect(foeDamage(g, add)).toBeCloseTo(BOSS.servantDamage * rung.damage);
  });

  it('gives roots a bounded part of their encounter’s growth', () => {
    const { g, boss, fight } = bossGame('shub_niggurath');
    g.player.cycle = 7;
    applyChange(g, boss, fight, 'roots');
    const roots = fight.props.filter((p) => g.ecs.c.prop.get(p)?.kind === 'root');
    expect(roots).toHaveLength(SHUB.roots);
    for (const r of roots) {
      expect(g.ecs.c.health.get(r)!.max).toBeGreaterThan(SHUB.hp);
      expect(g.ecs.c.health.get(r)!.max).toBeLessThan(SHUB.hp * 1.2);
    }
  });

  it('preserves the first journey’s scripted servant health without making an independent fight', () => {
    const { g, boss } = bossGame('umr_at_tawil');
    g.player.levels = { vigour: 30, endurance: 30, might: 30 };
    applyLevels(g);
    const add = summon(g, boss, 'ancient_ones')!;
    const expected = Math.round(getEntity('ancient_ones')!.stats.hp * bossHealthScale(levelsWorth(g.player.levels), 0, overmatch(g.player.levels, 'ancient_ones').health));
    expect(g.ecs.c.health.get(add)!.max).toBe(expected);
    expect(g.ecs.c.fight.has(add)).toBe(false);
  });
});

describe('lasting attacks and migration', () => {
  it('never turns a phantom’s lingering attack into physical damage when the phantom vanishes', () => {
    const { g, deepOne, player } = scriptedGame();
    g.ecs.c.phantom.set(deepOne, { life: 1 });
    const p = g.ecs.c.transform.get(player)!.pos;
    const pool = spawnPool(g, deepOne, 'enemy', p, { radius: 2, life: 120, tick: 30, damage: 100 });
    expect(g.ecs.c.hazard.get(pool)!.enemyScale).toBe(0);
    g.ecs.despawn(deepOne);
    const h = g.ecs.c.health.get(player)!;
    const poise = g.ecs.c.poise.get(player)!;
    const before = { hp: h.hp, poise: poise.value };
    hazardSystem(g);
    strike(g, deepOne, player, { damage: 100, enemyScale: 0, poise: 100, guard: 100, hitstop: 0, parryable: false, interrupts: false });
    expect(h.hp).toBe(before.hp);
    expect(poise.value).toBe(before.poise);
  });

  it('retains enemy scaling and the no-one-hit cap after a pool’s owner despawns', () => {
    const { g, deepOne, player } = scriptedGame();
    g.player.cycle = 3;
    g.player.difficulty = 'nightmare';
    const p = g.ecs.c.transform.get(player)!.pos;
    const scale = foeDamage(g, deepOne);
    const pool = spawnPool(g, deepOne, 'enemy', p, { radius: 2, life: 120, tick: 30, damage: 10 });
    expect(g.ecs.c.hazard.get(pool)!.enemyScale).toBe(scale);
    g.ecs.despawn(deepOne);
    const h = g.ecs.c.health.get(player)!;
    const before = h.hp;
    hazardSystem(g);
    expect(before - h.hp).toBe(Math.round(10 * scale));
    g.ecs.c.hazard.get(pool)!.damage = 1e6;
    g.ecs.c.hazard.get(pool)!.next = 0;
    h.hp = h.max;
    hazardSystem(g);
    expect(h.hp).toBe(h.max - Math.floor(h.max * BOSS.blowMost));
  });

  it('captures a projectile’s outgoing scale independently of its caster', () => {
    const { g, deepOne } = scriptedGame();
    g.player.cycle = 3;
    const scale = foeDamage(g, deepOne);
    loose(g, deepOne, { x: 0, y: 1, z: 0 }, { x: 1, y: 0, z: 0 }, { damage: 20, poise: 0, speed: 1, radius: 0.2, range: 10, lob: false });
    g.ecs.despawn(deepOne);
    expect([...g.ecs.c.bolt.values()].at(-1)!.enemyScale).toBe(scale);
  });

  it('preserves old choices and wounds, and keeps the original NG+ save exactly once', () => {
    const g = createWorldGame({ difficulty: 'light' });
    g.player.cycle = 3;
    const old = { ...snapshot(g), balance: undefined, wounds: { 'p:arkham:0': 0.4 } };
    const raw = JSON.stringify(old);
    const loaded = createWorldGame({ save: parseSave(raw)! });
    expect(loaded.player.difficulty).toBe('light');
    expect(loaded.overworld!.wounds.get('p:arkham:0')).toBe(0.4);
    const values = new Map([[SAVE_KEY, raw]]);
    const store = { getItem: (k: string) => values.get(k) ?? null, setItem: (k: string, v: string) => { values.set(k, v); }, removeItem: (k: string) => { values.delete(k); } };
    saveGame(loaded, store, 1);
    expect(values.get(balanceBackupKey(SAVE_KEY))).toBe(raw);
    loaded.player.echoes++;
    saveGame(loaded, store, 1);
    expect(values.get(balanceBackupKey(SAVE_KEY))).toBe(raw);
    expect(parseSave(values.get(SAVE_KEY)!)!.balance).toBe(1);
    expect(DIFFICULTIES.light.foe).toBe(0.6);
  });

  it('leaves the first journey’s ordinary stats and player damage unchanged', () => {
    const { g, deepOne, player } = scriptedGame();
    const def = getEntity('deep_one')!;
    expect(g.ecs.c.health.get(deepOne)!.max).toBe(def.stats.hp);
    expect(foeDamage(g, deepOne)).toBe(1);
    let seen = 0;
    g.events.on('Hit', (e) => { seen = e.damage; });
    strike(g, player, deepOne, { damage: 20, poise: 0, guard: 0, hitstop: 0, parryable: false, interrupts: false });
    expect(seen).toBe(20);
  });
});
