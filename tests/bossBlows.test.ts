/**
 * No horror's heaviest blow takes more than 30% of the investigator's health, nor less than 11%, where a person meets it (round 60, a third; round 61, 28%:
 * asked, "God bosses like Father Dagon and similar are way too overpowered and make way too much damage"; at the
 * standing a person has when the open world first lets them reach a god, Shub-Niggurath's charge took 51% of it,
 * Father Dagon's slam 44%, Nyarlathotep's burst 43%, so two blows were a death, against 18-24% for the named horrors).
 * The standing is the balance model's (tests/balanceModel.ts), the blow its phase-one compiled damage.
 */
import { describe, expect, it } from 'vitest';
import { ENTITIES } from '../src/data/registry';
import { toCombatant } from '../src/systems/creatures';
import { standings } from './balanceModel';

const MOST = 0.3; // (round 68: 28%, before the foes were made to hit as a soulslike's do; round 61: a third, before the four that stood at 30% were eased: stacked with a mind Unmoored (x1.35) and a relic that costs (x1.08), 28% is 41%, and 30% is 44%: still never two blows to a death)
const LEAST = 0.11; // Recalibrated for 16 HP per Vigour: Brown Jenkin's grab is 11.25% raw (11.67% scaled), without undoing the health gain. (round 61, "none excessively easy": a blow that does not matter is a boss that is only a wall of health; the Haunter is not hurt or measured like the rest, and Azathoth, whose blows were once only a blast, is since 2026-10-29)

const heaviest = (id: string): { move: string; damage: number } => {
  const cd = toCombatant(ENTITIES.find((e) => e.id === id)!);
  let best = { move: '', damage: 0 };
  for (const [move, m] of Object.entries(cd.moves)) {
    const d = m.hit?.damage ?? m.volley?.damage ?? m.marks?.damage ?? m.wave?.damage ?? m.sweep?.damage ?? m.barrage?.damage ?? m.shot?.damage ?? m.pool?.damage ?? 0;
    if (d > best.damage) best = { move, damage: d };
  }
  return best;
};

describe('a horror\'s heaviest blow (round 60)', () => {
  it('takes at most 30% of the health a person has when they meet it', () => {
    for (const s of standings()) {
      const { move, damage } = heaviest(s.id);
      expect(damage / s.hp, `${s.id}'s ${move}: ${damage} of ${s.hp}`).toBeLessThanOrEqual(MOST);
    }
  });

  it('takes at least 11% of it, or the horror is only a wall of health', () => {
    for (const s of standings().filter((x) => x.id !== 'haunter_of_the_dark')) {
      const { move, damage } = heaviest(s.id);
      expect(damage / s.hp, `${s.id}'s ${move}: ${damage} of ${s.hp}`).toBeGreaterThanOrEqual(LEAST);
    }
  });
});
