/**
 * What the Blender kit (tools/blender) is told of each roster creature it models: its body (the
 * capsule it is struck by, the height its blows are scaled by, its hover), its look and lore, and every
 * clip it needs, with each attack's frame windows as the fight compiles them, so a modelled blow lands
 * on the frame the hit does. `MODELS_TIMING=1 npx vitest run tests/modelTiming.test.ts` rewrites
 * tools/blender/timing.json; otherwise it is checked against the data (docs/MODELS.md).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ATTACKS } from '../src/data/attacks';
import { FIELD_NOTES } from '../src/data/bestiaryNotes';
import { REACTIONS } from '../src/data/moves';
import { ENTITIES, paramsOf, variantOf, type Variant } from '../src/data/registry';
import type { EntityDef } from '../src/data/schema';
import { BOSS } from '../src/data/tuning';
import { strikeFrame } from '../src/systems/realityTricks';
import { attacksOf, bodyOf, toCombatant } from '../src/systems/creatures';

const FILE = 'tools/blender/timing.json';
const round = (x: number): number => Math.round(x * 1000) / 1000;

/** The clips a creature is drawn with: the base set, an evade where it slips blows, a stoop for a colossus, and one per attack. */
function clipsOf(def: EntityDef, attacks: readonly string[]): Record<string, unknown> {
  const c = toCombatant(def);
  const clips: Record<string, unknown> = {
    idle: { loop: true },
    move: { loop: true },
    hurt: { frames: REACTIONS.stagger.frames },
    reel: { frames: def.bossScript ? BOSS.opening : REACTIONS.parried.frames },
    death: { frames: c.moves.death.frames },
  };
  if (c.moves.evade) clips.evade = { frames: c.moves.evade.frames };
  if (def.assembly) clips.stoop = { loop: true };
  const all = toCombatant({ ...def, behavior: { ...def.behavior, attacks: attacks as EntityDef['behavior']['attacks'] }, bossScript: undefined });
  for (const id of attacks) {
    const a = ATTACKS[id as keyof typeof ATTACKS];
    const m = all.moves[id];
    const strike = strikeFrame(m) ?? a.windup;
    clips[`atk.${id}`] = {
      frames: m.frames,
      strike,
      end: m.hit?.window[1] ?? m.sweep?.window[1] ?? m.barrage?.window[1] ?? m.effect?.window[1] ?? strike + a.active,
      kind: a.kind,
      shape: m.hit ? 'hit' : m.volley ? 'volley' : m.shot ? 'shot' : m.pool ? 'pool' : m.marks ? 'marks' : m.wave ? 'wave' : m.sweep ? 'sweep' : m.barrage ? 'barrage' : m.effect ? m.effect.kind : 'none',
      ...(m.motion && { lunge: [m.motion.window[0], m.motion.window[1], round(m.motion.distance)] }),
      ...(m.hit && { arc: m.hit.arc, reach: round(m.hit.reach), height: round(m.hit.height) }),
      ...(a.follow && { then: `atk.${a.follow}` }),
      ...(a.unblockable && { unblockable: true }),
    };
  }
  return clips;
}

function entry(def: EntityDef): Record<string, unknown> {
  const variants = (['eldritch', 'boss'] as Variant[]).flatMap((v) => (variantOf(def, v) ? [[v, variantOf(def, v)!] as const] : []));
  const attacks = [...new Set([def, ...variants.map(([, d]) => d)].flatMap(attacksOf))].sort();
  const body = bodyOf(def);
  const p = paramsOf(def.behavior);
  const look = def.sprite ? { kind: 'sprite', ...def.sprite } : { kind: 'assembly', ...def.assembly };
  return {
    name: def.name,
    tier: def.tier,
    source: def.source,
    canonLooks: def.canonLooks,
    regions: def.regions,
    note: FIELD_NOTES[def.id] ?? '',
    look,
    body: { height: round(body.height), radius: round(body.radius), reach: round(toCombatant(def).reach ?? body.height), hover: p.hover },
    archetype: def.behavior.archetype,
    hide: p.hide,
    mobile: p.mobile,
    speed: def.stats.speed,
    boss: !!def.bossScript,
    variants: Object.fromEntries(variants.map(([v, d]) => [v, { height: round(bodyOf(d).height), look: d.sprite ?? d.assembly, name: d.name }])),
    clips: clipsOf(def, attacks),
  };
}

const timing = (): string => JSON.stringify({ fps: 60, entities: Object.fromEntries(ENTITIES.map((d) => [d.id, entry(d)])) }, null, 1) + '\n';

describe('model timing (tools/blender/timing.json)', () => {
  it('is what the roster and the attack library say', () => {
    const now = timing();
    if (process.env.MODELS_TIMING) writeFileSync(FILE, now);
    expect(readFileSync(FILE, 'utf8')).toBe(now);
  });
});
