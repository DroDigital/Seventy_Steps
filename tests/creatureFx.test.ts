/**
 * A drawn creature goes, forms and wears its wounds by its own texels (round 81; render/creatureFx.ts,
 * data/creatureFx.ts, shaders/spriteFx.ts): its death by the matter of its body, an ambusher rising
 * out of the ground, a creature formed again as its other self, the dark patches of its wounds and
 * the pool of light where the last blow fell. The recorded art is not touched.
 */
import { describe, expect, it } from 'vitest';
import { createGame } from '../src/systems/game';
import { CREATURE_FX, FX_STYLE, deathStyle } from '../src/data/creatureFx';
import { ROSTER_IDS } from '../src/data/roster';
import { getEntity } from '../src/data/registry';
import { createCreatureFx } from '../src/render/creatureFx';
import { lookOf, phaseOf, type Look } from '../src/render/creatureLook';
import { SPRITE_FRAG, SPRITE_VERT } from '../src/render/shaders/sprite';
import { SPRITE_FX_GLSL } from '../src/render/shaders/spriteFx';
import { spawnCreature } from '../src/systems/creatures';

const whole: Look = { state: 'idle', frame: 0, opacity: 1, sink: 0, lash: 0 };
const def = (id: string) => getEntity(id)!;

describe('how a creature goes (data/creatureFx.ts)', () => {
  it('has a death by its matter: the sea and the flesh melt, bone and sand fall as dust, soot burns, and what is not of this world goes into the starlight', () => {
    expect(deathStyle(def('deep_one'))).toBe('melt');
    expect(deathStyle(def('exham_troglodyte'))).toBe('crumble');
    expect(deathStyle(def('cthulhu_cultist'))).toBe('burn');
    expect(deathStyle(def('cthulhu'))).toBe('shatter');
    expect(deathStyle(def('moon_bog_wraith'))).toBe('shatter');
  });

  it('gives every creature of the roster a style the shader knows, and uses all four', () => {
    const seen = new Set<string>();
    for (const id of ROSTER_IDS) {
      const s = deathStyle(def(id));
      expect(FX_STYLE[s], id).toBeGreaterThan(0);
      seen.add(s);
    }
    expect([...seen].sort()).toEqual(['burn', 'crumble', 'melt', 'shatter']);
  });

  it('puts a pack out of step: each creature has its own place in its cycles, spread over the longest, the same each time', () => {
    const phases = Array.from({ length: 40 }, (_, i) => phaseOf(i + 1));
    expect(new Set(phases.map((p) => p.toFixed(3))).size).toBe(40);
    for (const p of phases) [expect(p).toBeGreaterThanOrEqual(0), expect(p).toBeLessThan(2.5)];
    expect(phaseOf(7)).toBe(phaseOf(7));
  });
});

describe('what the shader is told (render/creatureFx.ts)', () => {
  const setup = () => {
    const g = createGame();
    const e = spawnCreature(g, 'deep_one', { x: 5, z: 5, yaw: 0 })!;
    return { g, e, fx: createCreatureFx(g), d: def('deep_one') };
  };

  it('is whole while it lives, and goes by its style through its death, whole until the first beats of the move are by', () => {
    const { e, fx, d } = setup();
    expect(fx.gone(e, d, 'creature:deep_one', whole, 1)).toEqual({ amount: 0, style: 0 });
    const hold = fx.gone(e, d, 'creature:deep_one', { ...whole, dissolve: CREATURE_FX.deathHold / 2 }, 1);
    expect(hold.amount).toBe(0);
    let last = 0;
    for (const t of [0.2, 0.4, 0.6, 0.8, 0.95]) {
      const { amount, style } = fx.gone(e, d, 'creature:deep_one', { ...whole, dissolve: t }, 1);
      expect(amount).toBeGreaterThanOrEqual(last);
      expect(style).toBe(FX_STYLE.melt);
      last = amount;
    }
    expect(last).toBeGreaterThan(0.9);
  });

  it('a horror roused comes together out of the ground, and a hidden creature rises when it shows; a creature seen the first time is simply there', () => {
    const { e, fx, d } = setup();
    expect(fx.gone(e, d, 'creature:deep_one', { ...whole, appear: 0.25 }, 1)).toEqual({ amount: 0.75, style: FX_STYLE.rise });
    fx.gone(e, d, 'creature:deep_one', null, 2); // hidden
    expect(fx.gone(e, d, 'creature:deep_one', whole, 3)).toEqual({ amount: 1, style: FX_STYLE.rise }); // it shows: at the start of its rising
    const mid = fx.gone(e, d, 'creature:deep_one', whole, 3 + CREATURE_FX.emerge / 2);
    expect(mid.amount).toBeCloseTo(0.5, 5);
    expect(fx.gone(e, d, 'creature:deep_one', whole, 3 + CREATURE_FX.emerge + 0.1).amount).toBe(0);
    const g2 = setup();
    expect(g2.fx.gone(g2.e, g2.d, 'creature:deep_one', whole, 50)).toEqual({ amount: 0, style: 0 });
  });

  it('forms again when its model changes (the eldritch variant of a failing mind), in the starlight', () => {
    const { e, fx, d } = setup();
    fx.gone(e, d, 'creature:deep_one', whole, 1);
    expect(fx.gone(e, d, 'creature:deep_one#eldritch', whole, 2)).toEqual({ amount: 1, style: FX_STYLE.shatter });
    expect(fx.gone(e, d, 'creature:deep_one#eldritch', whole, 2 + CREATURE_FX.swap + 0.1).amount).toBe(0);
  });

  it('wears the share of its health lost past the first patches, and a wound is held where the blow fell for a moment', () => {
    const { g, e, fx } = setup();
    const h = g.ecs.c.health.get(e)!;
    expect(fx.wear(e)).toBe(0);
    h.hp = h.max * (1 - CREATURE_FX.stainFrom / 2);
    expect(fx.wear(e)).toBe(0);
    h.hp = h.max * 0.5;
    expect(fx.wear(e)).toBeGreaterThan(0.3);
    h.hp = 0;
    expect(fx.wear(e)).toBe(1);
    expect(fx.wound(e, 5, 0, 5, 2, 2, { x: 1, z: 0 }, 0)).toBeNull(); // not struck
    g.events.emit('Hit', { attacker: g.player.id, target: e, outcome: 'hit', damage: 4 });
    const w = fx.wound(e, 5, 0, 5, 2, 2, { x: 1, z: 0 }, g.frame / 60)!;
    expect(w[0]).toBeGreaterThanOrEqual(0);
    expect(w[0]).toBeLessThanOrEqual(1);
    expect(w[2]).toBeCloseTo(1, 5);
    expect(w[3]).toBe(CREATURE_FX.woundMetres);
    expect(fx.wound(e, 5, 0, 5, 2, 2, { x: 1, z: 0 }, g.frame / 60 + CREATURE_FX.woundSeconds + 0.1)).toBeNull(); // and gone
  });

  it('is not struck by a pool\'s tick, a dodged blow or one that did no harm', () => {
    const { g, e, fx } = setup();
    g.events.emit('Hit', { attacker: g.player.id, target: e, outcome: 'hit', damage: 4, lingering: true });
    g.events.emit('Hit', { attacker: g.player.id, target: e, outcome: 'dodged', damage: 0 });
    g.events.emit('Hit', { attacker: g.player.id, target: e, outcome: 'blocked', damage: 2 });
    expect(fx.wound(e, 5, 0, 5, 2, 2, { x: 1, z: 0 }, g.frame / 60)).toBeNull();
  });

  it('is read by the shader from the instance: the texels moved before the one shown is sampled, then its rim and wounds laid on, then it is dropped', () => {
    const src = SPRITE_FRAG.replace(/\s+/g, ' ');
    expect(SPRITE_VERT).toContain('attribute vec4 aFx;');
    expect(SPRITE_VERT).toContain('attribute vec4 aWound;');
    const [moved, sampled, worn, kept] = ['fxSource(uv)', 'texture(uAtlas, src.xy)', 'fxWear(col, vFlash)', 'fxKeep(src.xy, col)'].map((s) => src.indexOf(s));
    expect([moved, sampled, worn, kept].every((i) => i >= 0)).toBe(true);
    expect(moved).toBeLessThan(sampled);
    expect(sampled).toBeLessThan(worn);
    expect(worn).toBeLessThan(kept);
    expect(src.indexOf('float fog = vFog * uFogAmount')).toBeGreaterThan(kept); // the rim is its own light, not dimmed by the mist before it is mixed
    for (const s of ['crumble', 'burn', 'melt', 'starlight', 'ichor']) expect(SPRITE_FX_GLSL).toContain(s);
  });

  it('draws a death from the last frame of its hurt pose, whole to its opacity: its texels go, it does not fade', () => {
    const g = createGame();
    const e = spawnCreature(g, 'deep_one', { x: 5, z: 5, yaw: 0 })!;
    const a = g.ecs.c.actor.get(e)!;
    a.move = 'death';
    a.frame = a.moves.death.frames / 2;
    expect(lookOf(g, e, 0, { hurt: 3 })).toMatchObject({ state: 'hurt', frame: 2, opacity: 1, dissolve: 0.5 });
  });
});
