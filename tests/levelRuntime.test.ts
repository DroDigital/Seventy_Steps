/**
 * The dungeons' second ways at play (round 125; docs/LEVEL_DESIGN.md): a barred shortcut opens from its far side only, rattles from
 * the near one, lets a body through once its door has swung, and stays open in the save but not into a new journey; a foe lying in
 * wait keeps hidden until the investigator comes within its reach (never while they are at peace); and a ledge is dropped from, over
 * some frames, and cannot be climbed.
 */
import { describe, expect, it } from 'vitest';
import { t } from '../src/core/i18n';
import { emptyInput } from '../src/core/input';
import { shortcutLook } from '../src/data/shortcutLooks';
import { AMBUSH, SHORTCUT } from '../src/data/tuning';
import { carryOf } from '../src/systems/cycles';
import { isConcealed, type Game } from '../src/systems/components';
import { createWorldGame, stepGame } from '../src/systems/game';
import { applySave, parseSave, snapshot } from '../src/systems/save';
import { isOpened, shortcutAction, shortcutKey } from '../src/systems/shortcuts';
import { worldLayout } from '../src/world/placements';
import { shortcutSeal, sideOf, standAt, type ShortcutPlace } from '../src/world/shortcutPlan';
import { DIRS } from '../src/world/worldMap';
import { goTo, record, run, sendAway, walkEnd } from './worldHelpers';

const at = (g: Game) => g.ecs.c.transform.get(g.player.id)!.pos;
const free = (g: Game): Game => ((g.player.peace = null), g);
const cut = (): ShortcutPlace => worldLayout().shortcuts.find((s) => s.dungeon === 'curwen_catacombs')!; // the passage to the crypt: two flat rooms
const facing = (s: ShortcutPlace, side: 'from' | 'to'): number => (side === 'from' ? s.yaw : s.yaw + Math.PI);
const stand = (g: Game, s: ShortcutPlace, side: 'from' | 'to'): void => {
  const p = standAt(s, side);
  goTo(g, p.x, p.z, facing(s, side));
};
/** Walks from a pace before the door on `side` through it, and says which side the walk ends on. */
const through = (g: Game, s: ShortcutPlace, side: 'from' | 'to'): 'from' | 'to' => sideOf(s, walkEnd(g, standAt(s, side === 'from' ? 'to' : 'from', 4), standAt(s, side), 120));

describe('a barred shortcut (round 125)', () => {
  it('will not move from its near side, opens from its far side, and lets a body through once its door has swung', () => {
    const g = free(createWorldGame());
    const s = cut();
    expect(through(g, s, 'to'), 'shut, from the near side').toBe('to');
    expect(through(g, s, 'from'), 'shut, from the far side').toBe('from');
    stand(g, s, 'to');
    const tried = record(g, 'ShortcutTried');
    const rattle = shortcutAction(g)!;
    expect(rattle.label).toBe(t('hud.barredBeyond'));
    rattle.run();
    expect([tried.length, isOpened(g, s.id)]).toEqual([1, false]);
    stand(g, s, 'from');
    const opened = record(g, 'ShortcutOpened');
    const bar = shortcutAction(g)!;
    expect(bar.label).toBe(t(({ beam: 'hud.unbar', bolt: 'hud.unbolt', lever: 'hud.unlever' } as const)[shortcutLook(s.kit).bar])); // the beam lifted, the bolt drawn, the lever thrown
    expect(shortcutLook(s.kit).bar, 'the catacombs\' grille is bolted').toBe('bolt');
    bar.run();
    expect([opened.length, isOpened(g, s.id), g.overworld!.told.has(shortcutKey(s.id))]).toEqual([1, true, true]);
    expect(shortcutAction(g), 'nothing more to do at an open door').toBeNull();
    const seal = g.world.colliders.find((c) => JSON.stringify(c) === JSON.stringify(shortcutSeal(s)))!;
    expect(seal, 'its seal stands in the doorway').toBeDefined();
    run(g, SHORTCUT.solidFor - 10);
    expect(g.world.off.has(seal), 'the door still swinging').toBe(false);
    run(g, 12);
    expect(g.world.off.has(seal), 'swung aside').toBe(true);
    expect(through(g, s, 'from'), 'open, from the far side').toBe('to');
    expect(through(g, s, 'to'), 'open, from the near side').toBe('from');
  });

  it('stays open in the save, and is barred again on a new journey', () => {
    const g = free(createWorldGame());
    const s = cut();
    stand(g, s, 'from');
    shortcutAction(g)!.run();
    run(g, SHORTCUT.solidFor + 2);
    const read = free(createWorldGame());
    applySave(read, parseSave(JSON.stringify(snapshot(g)))!);
    run(read, 2);
    expect(isOpened(read, s.id)).toBe(true);
    expect(through(free(read), s, 'to'), 'read from the save').toBe('from');
    const next = free(createWorldGame({ carry: carryOf(g) }));
    run(next, 2);
    expect(isOpened(next, s.id)).toBe(false);
    expect(through(next, s, 'to'), 'a new journey').toBe('to');
    const back = free(createWorldGame());
    applySave(back, parseSave(JSON.stringify(snapshot(next)))!);
    run(back, 2);
    expect(through(free(back), s, 'to'), 'a save that never opened it').toBe('to');
  });
});

describe('a foe lying in wait (round 125)', () => {
  const lurker = () => worldLayout().spawns.find((p) => p.lurk && p.id === 'room:curwen_catacombs:niches:lurk:0')!;
  /** A world game with the investigator `away` metres from the lurker's post (toward the cloister, east), the lurker spawned. */
  function waiting(away: number): { g: Game; e: number; post: { x: number; z: number } } {
    const g = createWorldGame();
    const p = lurker();
    goTo(g, p.at.x + away, p.at.z, -Math.PI / 2);
    run(g, 20);
    const e = g.overworld!.alive.get(p.id)!;
    return { g, e, post: p.at };
  }

  it('is laid hidden, unseen and untouchable, and keeps hidden while the investigator is beyond its reach', () => {
    const { g, e } = waiting(AMBUSH.reach + 5);
    expect(e, 'spawned').toBeDefined();
    const br = g.ecs.c.brain.get(e)!;
    expect([br.state, br.lurk, isConcealed(g, e)]).toEqual(['hidden', AMBUSH.reach, true]);
    free(g);
    run(g, 60);
    expect(g.ecs.c.brain.get(e)!.state).toBe('hidden');
  });

  it('springs at an investigator brushing past, but never at one at peace', () => {
    const { g, e, post } = waiting(AMBUSH.reach + 5);
    const sprung = record(g, 'AmbushSprung');
    g.player.peace = { since: g.frame, risen: false, left: 1e6 };
    goTo(g, post.x + 1.4, post.z, -Math.PI / 2);
    g.player.peace = { since: g.frame, risen: false, left: 1e6 };
    run(g, 30);
    expect([sprung.length, g.ecs.c.brain.get(e)!.state], 'at peace').toEqual([0, 'hidden']);
    free(g);
    run(g, 10);
    expect(sprung.map((s) => s.entity)).toEqual([e]);
    const br = g.ecs.c.brain.get(e)!;
    expect([br.state, br.lurk, br.target, isConcealed(g, e)]).toEqual(['engage', undefined, g.player.id, false]);
  });
});

describe('a drop (round 125)', () => {
  const ledge = () => {
    const d = worldLayout().dungeons.find((x) => x.layout.def.id === 'witch_house')!.layout;
    const o = d.doors.find((x) => x.link?.kind === 'drop')!;
    return { o, dir: DIRS[o.link!.side], low: o.link!.to.level };
  };

  it('is fallen from over some frames, landing on the floor below, and heard', () => {
    const g = free(createWorldGame());
    const { o, dir, low } = ledge();
    goTo(g, o.x - dir.x * 1.6, o.z - dir.z * 1.6, Math.atan2(dir.x, dir.z));
    sendAway(g);
    const landed = record(g, 'Dropped');
    expect(at(g).y).toBeCloseTo(o.level, 1);
    const heights: number[] = [];
    for (let k = 0; k < 90; k++) {
      stepGame(g, { ...emptyInput(), moveY: 1 });
      sendAway(g);
      heights.push(at(g).y);
    }
    const between = heights.filter((y) => y < o.level - 0.2 && y > low + 0.2);
    expect(between.length, 'a fall, not a step').toBeGreaterThan(2);
    expect(at(g).y).toBeCloseTo(low, 1);
    expect(landed.length).toBe(1);
    expect(landed[0].height).toBeCloseTo(o.level - low, 0);
  });

  it('cannot be climbed back up', () => {
    const g = free(createWorldGame());
    const { o, dir, low } = ledge();
    const end = walkEnd(g, { x: o.x - dir.x * 6, z: o.z - dir.z * 6 }, { x: o.x + dir.x * 3, z: o.z + dir.z * 3 }, 150);
    expect((end.x - o.x) * dir.x + (end.z - o.z) * dir.z, 'still below the ledge').toBeGreaterThan(0);
    expect(at(g).y).toBeCloseTo(low, 1);
  });
});
