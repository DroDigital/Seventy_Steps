import { describe, expect, it } from 'vitest';
import { distXZ } from '../src/core/geom';
import { emptyInput } from '../src/core/input';
import { getEntity, variantOf } from '../src/data/registry';
import { AZATHOTH, BOSS, SHUB, YOG } from '../src/data/tuning';
import { strike } from '../src/systems/combat';
import { bodyOf } from '../src/systems/creatures';
import { fightAction } from '../src/systems/fightActions';
import { createWorldGame } from '../src/systems/game';
import { setSanity } from '../src/systems/sanity';
import { AZATHOTH_SIGNATURE, noise } from '../src/systems/signatures/azathoth';
import { rootsOf } from '../src/systems/signatures/shub';
import { borrowed } from '../src/systems/signatures/nyarlathotep';
import { spheresOf } from '../src/systems/signatures/yogSothoth';
import { worldLayout } from '../src/world/placements';
import { bossGame, calm, engage } from './bossHelpers';
import { place, press, steps } from './helpers';
import { creatureOf, deathblow, goTo, kill, record, run } from './worldHelpers';

const blow = (damage: number) => ({ damage, poise: 0, guard: 0, hitstop: 2, parryable: false, interrupts: false });

describe('the outer gods (spec §3E)', () => {
  it('Shub-Niggurath bears the Thousand Young from its roots, shielded while any stands, until they are cut down', () => {
    const b = bossGame('shub_niggurath', undefined, 14);
    const { g, boss, fight } = b;
    g.ecs.c.health.get(g.player.id)!.immortal = true; // the Young hunt the investigator all the while
    engage(b);
    calm(b);
    const roots = rootsOf(g, fight);
    expect(roots).toHaveLength(SHUB.roots);
    const h = g.ecs.c.health.get(boss)!;
    let hp = h.hp;
    strike(g, g.player.id, boss, blow(100));
    expect(hp - h.hp).toBeCloseTo(100 * SHUB.shielded, 0);
    steps(g, SHUB.every);
    const young = fight.minions.filter((m) => g.ecs.c.model.get(m) === 'creature:thousand_young');
    expect(young.length).toBe(Math.min(SHUB.roots, SHUB.young, BOSS.summonCap)); // (round 100: the fight holds three at most, so the fourth root's birth waits)
    for (const r of roots) kill(g, r);
    expect(rootsOf(g, fight)).toEqual([]);
    const born = fight.minions.length;
    steps(g, SHUB.every * 2);
    expect(fight.minions.length).toBeLessThanOrEqual(born);
    setSanity(g, 100); // the Young's auras have worn at the mind, which would sharpen the blow
    hp = h.hp;
    strike(g, g.player.id, boss, blow(100));
    expect(hp - h.hp).toBe(100);
  });

  it("Yog-Sothoth's spheres are gates, and its arena leaps between them", () => {
    const b = bossGame('yog_sothoth', undefined, 14);
    const { g, fight } = b;
    engage(b);
    calm(b);
    const spheres = spheresOf(g, fight);
    expect(spheres).toHaveLength(YOG.spheres);
    const through = record(g, 'Rewired');
    const at = (s: number) => g.ecs.c.transform.get(s)!.pos;
    place(g, g.player.id, at(spheres[0]).x, at(spheres[0]).z, 0);
    steps(g, 1);
    expect(through).toHaveLength(1);
    expect(distXZ(g.ecs.c.transform.get(g.player.id)!.pos, at(spheres[1]))).toBeLessThan(YOG.touch + 1.5);
    place(g, g.player.id, fight.arena.x + 3, fight.arena.z + 3, 0);
    steps(g, YOG.leap[1] + 1);
    expect(through.length).toBeGreaterThanOrEqual(2);
  });

  it("Nyarlathotep's final form keeps its true shape and borrows its avatars' attacks; Nodens, once beheld, answers its call", () => {
    const b = bossGame('nyarlathotep', undefined, 8);
    const { g, boss, fight } = b;
    engage(b);
    calm(b);
    expect(fightAction(g)).toBeNull(); // Nodens not yet beheld
    g.ecs.c.health.get(boss)!.hp *= 0.25;
    steps(g, 3);
    expect(g.ecs.c.model.get(boss)).toBe('creature:nyarlathotep#eldritch');
    expect(g.ecs.c.body.get(boss)).toMatchObject(bodyOf(variantOf(getEntity('nyarlathotep')!, 'eldritch')!)); // struck as its true form is drawn
    setSanity(g, 30);
    setSanity(g, 100);
    steps(g, 2);
    expect(g.ecs.c.model.get(boss)).toBe('creature:nyarlathotep#eldritch'); // it no longer swaps back
    const copied = borrowed(g);
    expect(copied.length).toBeGreaterThan(0);
    const choices = g.ecs.c.brain.get(boss)!.def.attacks.map((a) => a.move);
    for (const id of copied) expect(choices).toContain(id);
    for (const id of copied) expect(g.ecs.c.actor.get(boss)!.moves[id]).toBeDefined();
    g.mind.seen.add('nodens');
    expect(fightAction(g)?.label).toBe('call upon Nodens, Lord of the Great Abyss');
    steps(g, 1, press('interact'));
    const nodens = fight.minions.find((m) => g.ecs.c.model.get(m) === 'creature:nodens')!;
    expect(g.ecs.c.combatant.get(nodens)!.faction).toBe('player');
    expect(fightAction(g)).toBeNull(); // once a fight
  });

  it('in the world Nyarlathotep borrows from the bosses slain, and watches when a region boss falls', () => {
    const g = createWorldGame();
    g.overworld!.slain = new Set(['boss:cthulhu', 'boss:ghatanothoa']);
    expect(borrowed(g)).toEqual(expect.arrayContaining(['tentacle_burst', 'slam', 'tidal_surge']));
    const s = worldLayout().spawns.find((x) => x.id === 'boss:colour_out_of_space')!;
    goTo(g, s.at.x, s.at.z + 12);
    run(g, 5);
    const colour = creatureOf(g, 'boss:colour_out_of_space')!;
    const watching = record(g, 'Notice');
    kill(g, colour);
    expect(watching.map((n) => n.text)).toContain('THE CRAWLING CHAOS WATCHES');
    const apparition = [...g.ecs.c.model].find(([, m]) => m === 'creature:nyarlathotep')?.[0];
    expect(apparition).toBeDefined();
    expect(g.ecs.c.brain.has(apparition!)).toBe(false);
    run(g, 300);
    expect(g.ecs.c.transform.has(apparition!)).toBe(false); // gone
  });

  it('Azathoth is struck and falls like any horror: its health is no song, nothing drains it, and when it falls it slumbers (2026-10-29)', () => {
    const b = bossGame('azathoth', undefined, 20);
    const { g, boss } = b;
    engage(b);
    calm(b);
    const h = g.ecs.c.health.get(boss)!;
    steps(g, 60 * 90); // ninety seconds, the length of the old song, with nothing struck
    expect(h.hp).toBe(h.max);
    expect([h.floor, h.ward]).toEqual([undefined, undefined]); // not invulnerable
    setSanity(g, 100); // (a mind at its edge would sharpen the blow)
    strike(g, g.player.id, boss, blow(100));
    expect(h.max - h.hp).toBe(100);
    const deaths = record(g, 'Died');
    const titles = record(g, 'Title');
    expect(strike(g, g.player.id, boss, deathblow)).toBe('kill');
    expect(h.hp).toBe(0);
    expect(g.ecs.c.actor.get(boss)!.move).toBe('death');
    expect(deaths).toEqual([expect.objectContaining({ entity: boss, killer: g.player.id })]);
    expect(titles.map((t) => t.text)).toEqual(['THE PIPING FADES · AZATHOTH SLUMBERS']);
  });

  it('Azathoth has no timer: its phases follow its health, whatever the minutes, and a fight broken off takes up where it was', () => {
    const b = bossGame('azathoth', undefined, 40);
    engage(b);
    calm(b);
    const h = b.g.ecs.c.health.get(b.boss)!;
    steps(b.g, 60 * 180);
    expect([b.fight.phase, h.hp]).toEqual([0, h.max]); // three minutes, and not a step of the song
    for (const [i, share] of [0.7, 0.4, 0.15].entries()) {
      h.hp = h.max * share;
      steps(b.g, 2);
      expect(b.fight.phase, `at ${share}`).toBe(i + 1);
    }
    b.g.ecs.c.brain.get(b.boss)!.state = 'return'; // the investigator fled its court
    steps(b.g, 1);
    engage(b);
    expect(h.hp).toBeCloseTo(h.max * 0.15, 0); // and it keeps its wounds
    expect(b.fight.phase).toBe(3);
  });

  it('Azathoth hears the loud and answers where it was made (a shot, a sprint; in its last phase a roll and a swing), and not a step', () => {
    const b = bossGame('azathoth', undefined, 20);
    const { g, boss, fight } = b;
    engage(b);
    calm(b);
    const marks = () => [...g.ecs.c.mark.values()].filter((m) => m.owner === boss);
    fight.sig.rest = 0;
    steps(g, 600, { ...emptyInput(), moveX: 1 }); // walking: nothing
    expect([fight.sig.heed, marks()]).toEqual([0, []]);
    const told = record(g, 'Notice');
    g.player.sprinting = true;
    const step = (): void => void AZATHOTH_SIGNATURE.step!(g, boss, fight);
    for (let i = 0; i < 1 / AZATHOTH.heed.sprint + 2; i++) step(); // held long enough: it answers
    expect(marks()).toHaveLength(1);
    const pp = g.ecs.c.transform.get(g.player.id)!.pos;
    const at = g.ecs.c.transform.get([...g.ecs.c.mark.keys()][0])!.pos;
    expect(distXZ(at, pp)).toBeLessThan(1); // where the investigator stood
    expect(told.map((n) => n.text)).toContain('IT HEARS YOU');
    for (let i = 0; i < 1 / AZATHOTH.heed.sprint + 2; i++) step(); // and rests before it answers again
    expect(marks()).toHaveLength(1);
    g.player.sprinting = false;
    const a = g.ecs.c.actor.get(g.player.id)!;
    a.move = 'roll';
    expect(noise(g, false)).toBe(0); // a roll is not heard...
    expect(noise(g, true)).toBe(AZATHOTH.heed.dodge); // ...until its last phase
    a.move = 'light1';
    expect([noise(g, false), noise(g, true)]).toEqual([0, AZATHOTH.heed.swing]);
    a.move = 'shoot';
    expect(noise(g, false)).toBe(AZATHOTH.heed.shot);
    expect(AZATHOTH.heed.shot * 32).toBeGreaterThan(1); // one shot is an answer, whole
  });

  it("'Umr at-Tawil yields in its last phase and offers passage through the Gate", () => {
    const b = bossGame('umr_at_tawil', undefined, 5);
    const { g, boss } = b;
    engage(b);
    g.ecs.c.health.get(boss)!.hp *= 0.2;
    steps(g, 2);
    expect(g.ecs.c.brain.get(boss)!.cooldown).toBe(Infinity);
    place(g, g.player.id, g.ecs.c.transform.get(boss)!.pos.x, g.ecs.c.transform.get(boss)!.pos.z + 4, Math.PI);
    const endings = record(g, 'Ending');
    expect(fightAction(g)?.label).toBe('follow the Guide');
    steps(g, 1, press('interact'));
    expect(endings).toEqual([]);
    expect(b.fight.sig.gate).toBe(1);
    place(g, g.player.id, b.fight.sig.gx!, b.fight.sig.gz!, Math.PI);
    expect(fightAction(g)?.label).toBe('step through the Gate');
    steps(g, 1, press('interact'));
    expect(endings).toEqual([{ id: 'silver_key' }]);
  });

  it("after the passage through the Gate the Guide takes no more part: its fight and fog are let go of, and the investigator is not held in its ring (round 55)", () => {
    const b = bossGame('umr_at_tawil', undefined, 5);
    const { g, boss, fight } = b;
    g.overworld = createWorldGame().overworld; // (the ending is the world's: the arena has none)
    engage(b);
    g.ecs.c.health.get(boss)!.hp *= 0.2;
    steps(g, 2);
    const me = (): { x: number; z: number } => g.ecs.c.transform.get(g.player.id)!.pos; // (place() sets a new position: read it afresh)
    const outside = (): void => place(g, g.player.id, fight.arena.x, fight.arena.z + fight.arena.radius + 2, Math.PI);
    outside();
    steps(g, 1);
    expect(distXZ(me(), fight.arena)).toBeLessThanOrEqual(fight.arena.radius); // while it is engaged, the fog sets them back at the rim
    const at = g.ecs.c.transform.get(boss)!.pos;
    place(g, g.player.id, at.x, at.z + 4, Math.PI);
    steps(g, 1, press('interact'));
    expect(g.overworld!.ending).toBeNull();
    place(g, g.player.id, fight.sig.gx!, fight.sig.gz!, Math.PI);
    steps(g, 1, press('interact'));
    expect(g.overworld!.ending).toBe('silver_key');
    const health = g.ecs.c.health.get(g.player.id)!.hp;
    steps(g, 2);
    expect(fight.engaged).toBe(false);
    expect(fight.veiled).toBe(false);
    expect(g.ecs.c.brain.get(boss)!.state).not.toBe('engage');
    outside();
    steps(g, 30);
    expect(distXZ(me(), fight.arena)).toBeGreaterThan(fight.arena.radius); // nothing sets them back: they walk on
    expect(g.ecs.c.brain.get(boss)!.state).not.toBe('engage');
    expect(g.ecs.c.health.get(g.player.id)!.hp).toBe(health);
  });
});
