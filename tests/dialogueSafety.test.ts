import { describe, expect, it } from 'vitest';
import { brainSystem } from '../src/systems/brain';
import { shove, strike, targetsOf } from '../src/systems/combat';
import { spawnCreature } from '../src/systems/creatures';
import { createWorldGame } from '../src/systems/game';
import { movementSystem } from '../src/systems/movement';
import { bleed, loseSanity } from '../src/systems/sanity';

/** A deep one a stride from the investigator, in the open world: where someone can talk to them. */
function foeBeside() {
  const g = createWorldGame();
  const me = g.ecs.c.transform.get(g.player.id)!;
  const foe = spawnCreature(g, 'deep_one', { x: me.pos.x + 2, z: me.pos.z, yaw: 0 })!;
  return { g, foe, me };
}

describe('a dialogue keeps the investigator safe, and foes let go of them', () => {
  it('no blow, push or loss of mind reaches the investigator while a dialogue is open', () => {
    const { g, foe, me } = foeBeside();
    const player = g.player.id;
    const hp = g.ecs.c.health.get(player)!.hp;
    const sanity = g.mind.sanity;
    const blow = { damage: 40, poise: 1000, guard: 0, hitstop: 3, parryable: false, interrupts: true };
    g.talking = true;
    expect(strike(g, foe, player, blow)).toBe('dodged');
    shove(g, player, { ...me.pos, x: me.pos.x - 1 }, 10);
    expect(g.ecs.c.shove.has(player)).toBe(false);
    loseSanity(g, 30);
    expect(g.mind.sanity).toBe(sanity);
    expect(g.ecs.c.health.get(player)!.hp).toBe(hp);
    g.talking = false;
    expect(strike(g, foe, player, blow)).not.toBe('dodged');
    expect(g.ecs.c.health.get(player)!.hp).toBeLessThan(hp);
  });

  it('a foe on the investigator lets go of them while a dialogue is open, and takes them up again after', () => {
    const { g, foe } = foeBeside();
    const player = g.player.id;
    const br = g.ecs.c.brain.get(foe)!;
    br.state = 'engage';
    br.target = player;
    g.talking = true;
    let attacked = false;
    for (let i = 0; i < 120; i++) {
      brainSystem(g);
      if (g.ecs.c.actor.get(foe)!.move !== null) attacked = true;
      movementSystem(g, 1 / 60);
    }
    expect(br.target).toBeNull();
    expect(br.state).not.toBe('engage');
    expect(attacked).toBe(false);
    expect(targetsOf(g, foe)).not.toContain(player);
    g.talking = false;
    expect(targetsOf(g, foe)).toContain(player);
  });

  it('the unmoored body does not bleed while a dialogue is open', () => {
    const { g } = foeBeside();
    const h = g.ecs.c.health.get(g.player.id)!;
    g.mind.band = 'unmoored';
    h.hp = h.max * 0.8;
    const hp = h.hp;
    g.talking = true;
    bleed(g, 1);
    expect(h.hp).toBe(hp);
    g.talking = false;
    bleed(g, 1);
    expect(h.hp).toBeLessThan(hp);
  });
});
