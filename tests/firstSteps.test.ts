import { describe, expect, it } from 'vitest';
import { FIRST_STEPS as F } from '../src/data/tuning';
import { HINT_KEPT } from '../src/data/fieldGuide';
import { teleport } from '../src/systems/checkpoints';
import type { Game } from '../src/systems/components';
import { spawnCreature } from '../src/systems/creatures';
import { createWorldGame } from '../src/systems/game';
import { parseSave, snapshot } from '../src/systems/save';
import { createSteps, stepTips, TIP_KEPT, TIP_ROWS, TIPS_KEPT, type Steps } from '../src/ui/firstSteps';

function open(g = createWorldGame()): Game {
  g.world = { ground: () => 0, colliders: [], off: new Set(), contain: () => {} };
  teleport(g, { x: 256, z: 240, yaw: 0 });
  return g;
}

/** `n` frames of the card, the body walked `dx` metres along x each. */
function run(g: Game, s: Steps, n: number, dx = 0) {
  let view = stepTips(g, s);
  for (let i = 0; i < n; i++) {
    g.frame++;
    g.ecs.c.transform.get(g.player.id)!.pos.x += dx;
    view = stepTips(g, s);
  }
  return view;
}

function foeAt(g: Game, metres: number) {
  const me = g.ecs.c.transform.get(g.player.id)!.pos;
  const foe = spawnCreature(g, 'deep_one', { x: me.x + metres, z: me.z, yaw: 0 })!;
  Object.assign(g.ecs.c.brain.get(foe)!, { state: 'engage', target: g.player.id });
  return foe;
}

describe('the first steps', () => {
  it('shows walking and looking on waking, ticks each as it is done, and keeps the card done in the save', () => {
    const g = open();
    const s = createSteps(g);
    expect(stepTips(g, s)).toEqual({ id: 'walk', rows: [false, false] });
    expect(run(g, s, 60, 0.1)?.rows).toEqual([true, false]);
    g.camera.yaw += 1;
    expect(run(g, s, 1)?.rows).toEqual([true, true]);
    expect(g.overworld!.told.has(TIP_KEPT + 'walk')).toBe(true);
    expect(run(g, s, F.linger)?.id).not.toBe('walk'); // seen ticked, then gone
    const again = createWorldGame({ save: parseSave(JSON.stringify(snapshot(g)))! });
    expect(createSteps(again).skip.has('walk')).toBe(true);
    expect(createSteps(again).skip.has('run')).toBe(false);
  });

  it('teaches running once walking is learned, while the body moves', () => {
    const g = open();
    const s = createSteps(g);
    s.rows.add('walk:0').add('walk:1');
    run(g, s, 1);
    Object.assign(g.ecs.c.mover.get(g.player.id)!, { vx: 3, vz: 0 });
    expect(run(g, s, 1)?.id).toBe('run');
    g.player.sprinting = true;
    expect(run(g, s, F.sprint)?.rows).toEqual([true]);
  });

  it('calls up the blows as a foe closes in, the roll when it swings, and the Reagent before both when badly hurt', () => {
    const g = open();
    const s = createSteps(g);
    s.skip.add('walk').add('run');
    const foe = foeAt(g, 20);
    expect(stepTips(g, s)?.id).toBe('strike');
    const me = g.ecs.c.actor.get(g.player.id)!;
    me.move = 'light1';
    expect(run(g, s, 1)?.rows).toEqual([true, false]);
    me.move = 'heavy1';
    expect(run(g, s, 1)?.rows).toEqual([true, true]);
    me.move = null;
    run(g, s, F.linger);
    g.ecs.c.transform.get(foe)!.pos.x = g.ecs.c.transform.get(g.player.id)!.pos.x + 4;
    expect(run(g, s, 1)?.id).toBe('dodge');
    const h = g.ecs.c.health.get(g.player.id)!;
    h.hp = h.max * 0.3;
    expect(run(g, s, 1)?.id).toBe('dodge'); // a card is not cut off at once...
    expect(run(g, s, F.minShow)?.id).toBe('heal'); // ...but a wound comes first
    me.move = 'inject';
    expect(run(g, s, 1)?.rows).toEqual([true]);
  });

  it('offers the chariot on open ground once running is learned, and no foe is near', () => {
    const g = open();
    const s = createSteps(g);
    s.skip.add('walk');
    s.rows.add('run:0');
    run(g, s, 1);
    expect(run(g, s, F.mountAfter - 2)).toBe(null);
    expect(run(g, s, 2)?.id).toBe('mount');
    g.player.mount.active = 'grey';
    expect(run(g, s, 1)?.rows).toEqual([true]);
  });

  it('does not teach a save from before the cards what its hints say it already knows', () => {
    const g = open();
    const told = g.overworld!.told;
    told.delete(TIPS_KEPT);
    for (const id of ['move', 'fight']) told.add(HINT_KEPT + id);
    const s = createSteps(g);
    expect([...s.skip].sort()).toEqual(['dodge', 'run', 'strike', 'walk']);
    expect(told.has(TIPS_KEPT)).toBe(true);
    for (const id of ['walk', 'run', 'strike', 'dodge']) expect(told.has(TIP_KEPT + id)).toBe(true); // the migration's skips are kept...
    const again = createWorldGame({ save: parseSave(JSON.stringify(snapshot(g)))! });
    expect([...createSteps(again).skip].sort()).toEqual(['dodge', 'run', 'strike', 'walk']); // ...so a later load still skips them
    told.delete(HINT_KEPT + 'fight');
    told.add(HINT_KEPT + 'hurt');
    expect(createSteps(g).skip.has('heal')).toBe(false); // once it keeps its cards, a hint given later skips nothing
  });

  it('shows nothing in the arena, nor to the fallen', () => {
    const g = open();
    const s = createSteps(g);
    g.ecs.c.health.get(g.player.id)!.hp = 0;
    expect(stepTips(g, s)).toBe(null);
    for (const rows of Object.values(TIP_ROWS)) expect(rows.length).toBeGreaterThan(0);
  });
});
