/**
 * The horrors' pace (2026-11-27, data/bossPace.ts): no blow a horror opens with, or strikes out of a step or the dark, is shown for less
 * than its band gives; no link of a chain for less than 0.3 s; no mark it lays bursts sooner than 0.8 s after it is seen, a row's later;
 * what is still quick weighs less, but the heaviest blow. Read on the compiled moves, as the fight plays them.
 */
import { describe, expect, it } from 'vitest';
import { ATTACKS } from '../src/data/attacks';
import { PACE, strikesDirect } from '../src/data/bossPace';
import { bandOf } from '../src/data/bossPunish';
import { ENTITIES, variantOf } from '../src/data/registry';
import type { AttackId, EntityDef } from '../src/data/schema';
import { attacksOf, toCombatant } from '../src/systems/creatures';

const forms = ENTITIES.flatMap((e) => [e, variantOf(e, 'eldritch'), variantOf(e, 'boss')]).filter((d): d is EntityDef => !!d);
const bosses = forms.filter((e) => e.bossScript);
const lead = new Map(Object.entries(ATTACKS).filter(([, a]) => a.follow).map(([id, a]) => [a.follow!, id as AttackId]));
const FORESHOWN = ['beats', 'spiral', 'scatter', 'seek'];

describe("the horrors' pace (2026-11-27)", () => {
  it('shows every blow a horror opens with, or strikes out of nothing, for its band\'s least, and every link of a chain for 0.3 s', () => {
    for (const def of bosses) {
      const band = bandOf(def.id)!;
      const moves = toCombatant(def).moves;
      for (const id of attacksOf(def)) {
        const a = ATTACKS[id];
        const hit = moves[id].hit;
        if (!strikesDirect(a) || !hit) continue;
        const before = lead.get(id) && ATTACKS[lead.get(id)!];
        if (before?.pull) continue; // a pull's burst is warned of by the pull
        const least = before && before.kind !== 'special' ? PACE.link : PACE.open[band];
        expect(hit.window[0], `${def.id} ${id}`).toBeGreaterThanOrEqual(least);
        expect(hit.window[0], `${def.id} ${id}`).toBeGreaterThanOrEqual(a.windup); // never quicker than it was
      }
    }
  });

  it('lets every mark a horror lays on the ground be seen 0.8 s before it bursts, and a row with a gap longer', () => {
    for (const def of bosses) {
      const moves = toCombatant(def).moves;
      for (const id of attacksOf(def)) {
        const m = moves[id].marks;
        if (!m || FORESHOWN.includes(m.pattern ?? '')) continue;
        expect(m.delay, `${def.id} ${id}`).toBeGreaterThanOrEqual(m.pattern === 'rows' ? PACE.rows.delay : PACE.mark);
        if (m.pattern === 'rows') expect(m.stagger, `${def.id} ${id}`).toBeGreaterThanOrEqual(PACE.rows.stagger);
      }
    }
  });

  it('gives the Great Ones time: the descent out of the cloud, the stamp and the reap are each shown for more than half a second', () => {
    const moves = toCombatant(ENTITIES.find((e) => e.id === 'great_ones')!).moves;
    for (const id of ['greatones_descent', 'greatones_stamp', 'greatones_reap']) expect(moves[id].hit!.window[0] / 60, id).toBeGreaterThan(0.55);
    expect(moves.greatones_dance.marks!.delay / 60).toBeGreaterThanOrEqual(0.9);
  });

  it('weighs a quick blow less, and leaves a horror\'s heaviest as it was', () => {
    const def = ENTITIES.find((e) => e.id === 'bokrug')!;
    const moves = toCombatant(def).moves;
    const thrash = moves.bokrug_thrash.hit!; // a chain's link, still quick
    expect(thrash.damage).toBeLessThan(Math.round(ATTACKS.bokrug_thrash.power * def.stats.damage));
    const top = Math.max(...attacksOf(def).map((id) => ATTACKS[id].power));
    const heaviest = attacksOf(def).find((id) => ATTACKS[id].power === top && moves[id].hit)!;
    expect(moves[heaviest].hit!.damage).toBe(Math.round(top * def.stats.damage));
  });

  it('is for the horrors alone: a lesser foe winds up as the library has it', () => {
    for (const def of forms.filter((e) => !e.bossScript)) {
      const moves = toCombatant(def).moves;
      for (const id of attacksOf(def)) if (moves[id].hit) expect(moves[id].hit!.window[0], `${def.id} ${id}`).toBe(ATTACKS[id].windup);
    }
  });
});
