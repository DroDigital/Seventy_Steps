import { describe, expect, it } from 'vitest';
import { REACTIONS } from '../src/data/moves';
import { BOSS, COMBAT } from '../src/data/tuning';
import { startMove } from '../src/systems/actions';
import { strike, type Blow } from '../src/systems/combat';
import { createGame } from '../src/systems/game';
import { bossGame } from './bossHelpers';

const blow: Blow = { damage: 44, poise: 34, guard: 36, hitstop: 4, parryable: true, interrupts: false };

describe('a parried or interrupted horror is a punish taken at once, not a free crit (round 60)', () => {
  it('stays open a shorter while than a common foe: the riposte is the next blow, not any within a second and a half', () => {
    expect(REACTIONS.parried.frames).toBe(96);
    expect(BOSS.opening / 60).toBeLessThan(0.75);
    for (const id of ['dr_munoz', 'keziah_mason', 'the_hound', 'cthulhu']) {
      const { g, boss } = bossGame(id);
      expect(g.ecs.c.actor.get(boss)!.moves.parried.frames, id).toBe(BOSS.opening);
    }
    const g = createGame(); // the Deep One of the arena: a common foe keeps its long reel
    const foe = [...g.ecs.c.brain.keys()][0];
    expect(g.ecs.c.actor.get(foe)!.moves.parried.frames).toBe(REACTIONS.parried.frames);
  });

  it('a riposte weighs BOSS.riposte on a horror, COMBAT.riposte on a common foe (it took half of Dr. Munoz\'s bar at x2.5)', () => {
    expect(BOSS.riposte).toBeLessThan(COMBAT.riposte);
    const { g, boss } = bossGame('dr_munoz');
    const h = g.ecs.c.health.get(boss)!;
    startMove(g.ecs.c.actor.get(boss)!, 'parried');
    const before = h.hp;
    expect(strike(g, g.player.id, boss, blow)).toBe('riposte');
    expect(before - h.hp).toBe(Math.round(blow.damage * BOSS.riposte));
    expect(g.ecs.c.actor.get(boss)!.move).toBe('stagger'); // and it reels, as a riposted foe does
    expect(strike(g, g.player.id, boss, blow)).not.toBe('riposte'); // once
    const a = createGame();
    const foe = [...a.ecs.c.brain.keys()][0];
    const fh = a.ecs.c.health.get(foe)!;
    startMove(a.ecs.c.actor.get(foe)!, 'parried');
    const was = fh.hp;
    expect(strike(a, a.player.id, foe, blow)).toBe('riposte');
    expect(was - fh.hp).toBe(Math.min(was, Math.round(blow.damage * COMBAT.riposte)));
  });
});
