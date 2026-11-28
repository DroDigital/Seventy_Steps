/**
 * Nyarlathotep (spec §3E). It appears as avatars throughout the game: the Black Man and the Haunter
 * of the Dark are its avatars, and whenever a region boss falls it stands watching a moment, then is
 * gone (registerNyarlathotep, the open world). In its last phase it takes its true form, the Crawling
 * Chaos, for good, and borrows the movesets of the bosses slain before it (in the arena, its
 * avatars'). Nodens, once beheld, can be called to its fight as an ally. Pure: no Three.js.
 */

import type { Entity } from '../../core/ecs';
import { t } from '../../core/i18n';
import { yawOf } from '../../core/geom';
import { ATTACKS, attackRange, compileAttack } from '../../data/attacks';
import { baseOf } from '../../data/bossMoves';
import { bandOf } from '../../data/bossPunish';
import { getEntity } from '../../data/registry';
import { REGIONS } from '../../data/regions';
import type { AttackId } from '../../data/schema';
import { NYARLATHOTEP } from '../../data/tuning';
import type { Fight, Game } from '../components';
import { creatureOf, defOf, morph, spawnCreature } from '../creatures';
import type { Signature } from '../signatures';
import { groundNear } from '../specials';

const ID = 'nyarlathotep';
/** What it does not borrow: a summoning, and a god's one heavy blow (round 60), which is that god's own (the Crawling Chaos has one of its own): by what a blow is built on (2026-11-24: every horror's blows its own). */
const KEPT: readonly string[] = ['summon', 'crushing_blow', 'great_mark'];
export const AVATARS: readonly string[] = ['black_man', 'haunter_of_the_dark'];
const REGION_BOSSES = new Set(REGIONS.flatMap((r) => r.bosses));

const lastPhase = (f: Fight): boolean => f.phase === f.script.phases.length - 1;

/** A slain horror's blows, the one it struck most first (its weights over its phases), none it keeps for its own. */
function blowsOf(id: string): AttackId[] {
  const d = id === ID ? undefined : getEntity(id);
  const weight = new Map<AttackId, number>();
  for (const p of (d?.bossScript ?? d?.bossVariant?.bossScript)?.phases ?? []) for (const a of p.attacks) if (!KEPT.includes(baseOf(a.id))) weight.set(a.id, (weight.get(a.id) ?? 0) + a.weight);
  return [...weight].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([x]) => x);
}

/**
 * The attacks of the bosses slain before it (summons need servants of their own). Every horror's blows are its own (2026-11-24), so it takes
 * from each in turn, the last slain first: each one's most struck blow, then each one's next, until it holds its copies.
 */
export function borrowed(g: Game): AttackId[] {
  const slain = g.overworld ? [...g.overworld.slain].map((s) => s.replace(/^boss:/, '')).reverse() : AVATARS;
  const lists = slain.map(blowsOf).filter((l) => l.length);
  const out: AttackId[] = [];
  for (let i = 0; out.length < NYARLATHOTEP.copies && lists.some((l) => l.length > i); i++) {
    for (const l of lists) if (l[i] && !out.includes(l[i]) && out.length < NYARLATHOTEP.copies) out.push(l[i]);
  }
  return out;
}

/** It stands watching the investigator a moment: seen by them alone, gone if struck. */
function watch(g: Game): void {
  const tr = g.ecs.c.transform.get(g.player.id)!;
  const p = groundNear(g, tr.pos, [NYARLATHOTEP.watchAt, NYARLATHOTEP.watchAt + 2], 0.6);
  const e = spawnCreature(g, ID, { ...p, yaw: yawOf(tr.pos.x - p.x, tr.pos.z - p.z) });
  if (e === undefined) return;
  const c = g.ecs.c;
  for (const store of [c.brain, c.fight, c.dread, c.home, c.swap]) store.delete(e);
  c.combatant.get(e)!.bounty = 0;
  c.phantom.set(e, { life: NYARLATHOTEP.watch });
  g.events.emit('Notice', { text: t('sig.watches') });
}

export function registerNyarlathotep(g: Game): void {
  g.events.on('Vanquished', ({ entity }) => {
    const id = creatureOf(g, entity)?.id;
    if (id && AVATARS.includes(id)) g.events.emit('Notice', { text: t('sig.avatarFalls') });
    else if (id && id !== ID && REGION_BOSSES.has(id)) watch(g);
  });
}

export const NYARLATHOTEP_SIGNATURE: Signature = {
  step(g, e, f) {
    if (!lastPhase(f) || creatureOf(g, e)?.variant === 'eldritch') return;
    g.ecs.c.swap.delete(e); // the true form now, whatever the mind
    morph(g, e, ID, 'eldritch');
  },
  extra(g, e, f) {
    if (!lastPhase(f)) return [];
    const a = g.ecs.c.actor.get(e)!;
    const { height, reach } = g.ecs.c.body.get(e)!;
    const stats = defOf(g, e)!.stats;
    const own = new Set(f.script.phases[f.phase].attacks.map((x) => x.id));
    return borrowed(g)
      .filter((id) => !own.has(id))
      .map((id) => {
        for (let x: AttackId | undefined = id; x && !a.moves[x]; x = ATTACKS[x].follow) a.moves = { ...a.moves, [x]: compileAttack(x, stats, reach ?? height, bandOf(f.id)) }; // and the chain it runs into
        return { move: id, weight: 1, range: attackRange(id, reach ?? height) };
      });
  },
  action(g, _e, f) {
    if (f.sig.nodens || !g.mind.seen.has('nodens')) return null;
    return {
      label: t('act.nodens'),
      run() {
        f.sig.nodens = 1;
        const tr = g.ecs.c.transform.get(g.player.id)!;
        const ally: Entity | undefined = spawnCreature(g, 'nodens', { ...groundNear(g, tr.pos, [2, 4], 0.8, f.arena), yaw: tr.yaw });
        if (ally !== undefined) f.minions.push(ally); // it leaves with the fight
        g.events.emit('Notice', { text: t('sig.nodens') });
      },
    };
  },
};
