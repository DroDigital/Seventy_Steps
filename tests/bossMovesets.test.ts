/**
 * Every horror's moveset is its own (2026-11-24; asked: "make sure every boss has a unique attack-moveset because bossfights become repetitive
 * fast"). A horror strikes no blow another creature strikes (but the summons, whose servants are each its own), its blows are its own in what
 * they do (not one renamed: the shape of each, quantized so a frame or a hair does not count, is no other's), each chain runs on into the
 * horror's own next link, and every blow says how it is met.
 */
import { describe, expect, it } from 'vitest';
import { ATTACKS, LIBRARY, compileAttack } from '../src/data/attacks';
import { OWNER, OWN_SPECS, baseOf } from '../src/data/bossMoves';
import { ENTITIES } from '../src/data/registry';
import type { AttackId, EntityDef } from '../src/data/schema';
import { tipOf } from '../src/systems/deathNotes';

/** The horrors that fight by a script (the boss variants with them), and the two that are vanquished as horrors with none. */
const UNSCRIPTED = ['voice_in_the_tomb', 'curwen_pit_thing'];
const horrors: { id: string; def: EntityDef; script: boolean }[] = ENTITIES.flatMap((d) => [
  ...(d.bossScript || UNSCRIPTED.includes(d.id) ? [{ id: d.id, def: d, script: !!d.bossScript }] : []),
  ...(d.bossVariant?.bossScript ? [{ id: d.id, def: { ...d, bossScript: d.bossVariant.bossScript, behavior: { ...d.behavior, ...d.bossVariant.behavior } } as EntityDef, script: true }] : []),
]);
const isHorror = (id: string): boolean => horrors.some((h) => h.id === id);

/** Every blow a creature strikes: its script's (or, with none, its list's), and the chains they run into. */
function blowsOf(def: EntityDef, script: boolean): Set<AttackId> {
  const ids = new Set<AttackId>(script ? def.bossScript!.phases.flatMap((p) => p.attacks.map((a) => a.id)) : def.behavior.attacks);
  for (const id of [...ids]) for (let f = ATTACKS[id].follow; f && !ids.has(f); f = ATTACKS[f].follow) ids.add(f);
  return ids;
}

const SHARED: readonly string[] = ['summon']; // what it calls up is each horror's own (its phases' summons)
const q = (x: number | undefined, step: number): number | undefined => (x === undefined ? undefined : Math.round(x / step));

/** What a blow does, as a player reads it: its timing and its shape, not its weight (power, poise, recovery and the AI's bracket are balance). */
function shape(id: AttackId, depth = 0): string {
  const a = ATTACKS[id];
  const m = a.marks;
  return JSON.stringify({
    kind: a.kind, effect: a.effect, windup: q(a.windup, 6), active: q(a.active, 6),
    reach: q(a.reach, 0.5), radius: q(a.radius, 0.25), height: q(a.height, 0.25), arc: a.arc?.map((x) => q(x, 15)),
    lunge: q(a.lunge, 0.5), push: q(a.push, 0.5), grab: a.unblockable, shot: q(a.shot, 2), sanity: q(a.sanity, 0.25), far: a.kind === 'special' ? q(a.range[1], 2) : undefined,
    bolts: a.bolts && { n: a.bolts.count, spread: q(a.bolts.spread, 6), speed: q(a.bolts.speed, 1), r: q(a.bolts.radius, 0.05), lob: !!a.bolts.lob, bounces: a.bolts.bounces ?? 0 },
    pool: a.pool && { r: q(a.pool.radius, 0.25), life: q(a.pool.life, 30) },
    marks: m && { n: m.count, ring: m.ring.map((x) => q(x, 0.5)), delay: q(m.delay, 6), stagger: q(m.stagger, 3), r: q(m.radius, 0.25), pattern: m.pattern, look: m.look, spokes: m.spokes, rings: m.rings, turns: m.turns, seek: m.seek && [q(m.seek.speed, 0.5), q(m.seek.lock, 6)], leaves: !!m.leaves },
    wave: a.wave && { speed: q(a.wave.speed, 0.5), width: q(a.wave.width, 0.25), reach: q(a.wave.reach, 1), lane: q(a.wave.lane?.half, 0.5) },
    cloud: a.cloud && { n: a.cloud.count, r: q(a.cloud.radius, 0.25), life: q(a.cloud.life, 30), drift: q(a.cloud.drift, 0.25), kind: a.cloud.kind, blind: a.cloud.blind },
    sweep: a.sweep && { arc: a.sweep.arc.map((x) => q(x, 15)), length: q(a.sweep.length, 1), width: q(a.sweep.width, 0.1), arms: a.sweep.arms, blind: a.sweep.blind },
    barrage: a.barrage && { arms: a.barrage.arms, every: a.barrage.every, spin: q(a.barrage.spin, 3), speed: q(a.barrage.speed, 0.5) },
    pull: a.pull && { speed: q(a.pull.speed, 0.25), range: q(a.pull.range, 1) },
    then: a.follow && depth < 8 ? shape(a.follow, depth + 1) : undefined,
  });
}

describe("every horror's moveset is its own (2026-11-24)", () => {
  const blows = new Map(horrors.map((h) => [h.id, blowsOf(h.def, h.script)]));
  const common = ENTITIES.filter((d) => !isHorror(d.id)).flatMap((d) => [...blowsOf(d, false)]);

  it('a horror strikes no blow that another creature strikes, but its summons', () => {
    const struckBy = new Map<string, string[]>();
    for (const [who, ids] of blows) for (const id of ids) if (!SHARED.includes(id)) struckBy.set(id, [...(struckBy.get(id) ?? []), who]);
    for (const [id, who] of struckBy) {
      expect(who, `${id} is struck by ${who.join(' and ')}`).toHaveLength(1);
      expect(common, `${id} (${who[0]}'s) is also a common foe's`).not.toContain(id);
    }
  });

  it("every own blow is its horror's, and struck by it: none is spare", () => {
    for (const [id, who] of Object.entries(OWNER)) expect(blows.get(who)?.has(id as AttackId), `${who}'s ${id}`).toBe(true);
    for (const [who, ids] of blows) for (const id of ids) if (!SHARED.includes(id) && id in OWN_SPECS) expect(OWNER[id], id).toBe(who);
    for (const [who, ids] of blows) if (who !== 'azathoth') for (const id of ids) if (!SHARED.includes(id)) expect(OWNER[id], `${who} strikes the library's ${id}`).toBe(who);
  });

  it('no two horrors strike a blow of the same shape, and none is a library blow renamed', () => {
    const seen = new Map<string, string>();
    for (const id of Object.keys(LIBRARY) as AttackId[]) if (!seen.has(shape(id))) seen.set(shape(id), id);
    const twins: string[] = [];
    for (const [, ids] of blows) for (const id of ids) {
      if (SHARED.includes(id) || id in LIBRARY) continue;
      const k = shape(id);
      if (seen.has(k)) twins.push(`${id} is shaped as ${seen.get(k)}`);
      seen.set(k, id);
    }
    expect(twins).toEqual([]);
  });

  it('every horror has blows enough of its own, and a chain runs on into its own next link, never the library\'s', () => {
    for (const [who, ids] of blows) if (horrors.find((h) => h.id === who)!.script) expect([...ids].filter((x) => !SHARED.includes(x)).length, who).toBeGreaterThanOrEqual(4);
    for (const [id, s] of Object.entries(OWN_SPECS)) {
      if (LIBRARY[s.of].follow) expect(s.follow, `${id}, built on ${s.of}, names its own next link`).toBeDefined();
      if (s.follow) expect(OWNER[s.follow], `${id} runs on into ${s.follow}`).toBe(OWNER[id]);
    }
  });

  it('a link shows itself for 0.2 s at least, a bolt can be outrun, and every blow says how it is met', () => {
    for (const id of Object.keys(OWN_SPECS) as AttackId[]) {
      const a = ATTACKS[id];
      if (a.kind !== 'special' && baseOf(id) !== 'vortex_burst') expect(a.windup, id).toBeGreaterThanOrEqual(a.range[1] === 0 ? 12 : 18); // (the burst that ends a pull is warned of by the pull, as the library's is)
      if (a.bolts) expect(a.bolts.speed, id).toBeLessThanOrEqual(13);
      expect(tipOf(id), id).toBeTruthy();
      expect(baseOf(id), id).toBe(OWN_SPECS[id].of);
    }
  });

  it('a chained link\'s bolts, barrage and gaze still carry across the court, though no horror chooses it on its own', () => {
    const stats = { damage: 10, sanityDamage: 1 } as Parameters<typeof compileAttack>[1];
    for (const id of Object.keys(OWN_SPECS) as AttackId[]) {
      if (ATTACKS[id].range[1] !== 0) continue;
      const m = compileAttack(id, stats, 1.9);
      const far = LIBRARY[OWN_SPECS[id].of].range[1];
      if (m.volley) expect(m.volley.range, id).toBeGreaterThanOrEqual(Math.max(far * 1.5, 1));
      if (m.barrage) expect(m.barrage.range, id).toBeGreaterThanOrEqual(far * 1.6);
      if (m.effect) expect(m.effect.range, id).toBe(far);
    }
  });
});
