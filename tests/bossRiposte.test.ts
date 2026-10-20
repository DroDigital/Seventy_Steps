import { describe, expect, it } from 'vitest';
import { emptyInput } from '../src/core/input';
import { PLAYER_MOVES, REACTIONS } from '../src/data/moves';
import { BOSS, COMBAT } from '../src/data/tuning';
import { startMove } from '../src/systems/actions';
import { strike, type Blow } from '../src/systems/combat';
import { createGame, stepGame } from '../src/systems/game';
import { bossGame } from './bossHelpers';

const blow: Blow = { damage: 44, poise: 34, guard: 36, hitstop: 4, parryable: true, interrupts: false };

describe('a parried or interrupted horror is a punish taken at once, not a free crit (round 60)', () => {
  it('stays open a shorter while than a common foe: the riposte is the next blow, not any within a second and a half', () => {
    expect(REACTIONS.parried.frames).toBe(96);
    expect(BOSS.opening).toBeLessThan(REACTIONS.parried.frames);
    expect(BOSS.opening / 60).toBeLessThanOrEqual(1.1);
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

  it('the opening is one a parry can take: a heavy blow begun as the earliest parry\'s recovery ends still lands as a riposte (review of PR 150: at 40 frames none could)', () => {
    const { g, boss } = bossGame('dr_munoz', undefined, 1.8);
    g.ecs.c.brain.delete(boss); // it stands where it is parried
    const me = g.ecs.c.actor.get(g.player.id)!;
    startMove(me, 'parry');
    me.frame = PLAYER_MOVES.parry.parry![0]; // caught on the parry's first frame: the longest recovery after it
    expect(strike(g, boss, g.player.id, { ...blow, damage: 30 })).toBe('parried');
    expect(g.ecs.c.actor.get(boss)!.move).toBe('parried');
    const seen: string[] = [];
    g.events.on('Hit', (e) => void (e.attacker === g.player.id && e.target === boss && seen.push(e.outcome)));
    for (let f = 0; f < 120 && !seen.length; f++) {
      const i = emptyInput();
      [i.held.heavy, i.pressed.heavy] = [true, me.move === 'parry' || me.move === null]; // pressed through the recovery, as a person mashes it
      stepGame(g, i);
    }
    expect(seen).toEqual(['riposte']);
  });

  it('a boss that joins a fight gathers itself as one woken does (review of PR 150: the join set its cooldown to nothing)', () => {
    const { g, boss } = bossGame('brown_jenkin', undefined, 1.5); // with no leader standing, it joins at once, at the investigator's feet
    let joined = -1;
    for (let k = 0; k < 300; k++) {
      stepGame(g, emptyInput());
      const br = g.ecs.c.brain.get(boss)!;
      if (joined < 0 && br.state === 'engage') joined = k;
      const move = g.ecs.c.actor.get(boss)!.move;
      if (joined >= 0 && move !== null && move !== 'evade') {
        expect(k - joined).toBeGreaterThanOrEqual(BOSS.wake);
        return;
      }
    }
    throw new Error('it never struck');
  });
});
