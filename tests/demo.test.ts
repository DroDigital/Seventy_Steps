import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { emptyInput } from '../src/core/input';
import { t } from '../src/core/i18n';
import { DEMO_KEY, editionOf } from '../src/data/edition';
import { GAME_PAGE } from '../src/data/links';
import { REGIONS } from '../src/data/regions';
import { dream, gateBeyondDemo, gatePlace, passGate, signBeyondDemo, signPlace, travel } from '../src/systems/checkpoints';
import type { Game } from '../src/systems/components';
import { DEMO, demoAllows } from '../src/systems/demo';
import { createWorldGame, stepGame } from '../src/systems/game';
import { worldLayout } from '../src/world/placements';
import { regionAt, TILE } from '../src/world/worldMap';
import { edition } from '../desktop/steam.js';
import { goTo, record, run } from './worldHelpers';

const pos = (g: Game) => g.ecs.c.transform.get(g.player.id)!.pos;
const inDemo = (x: number, z: number): boolean => DEMO.regions.has(regionAt(x, z)?.id ?? '');
/** The times the demo said its way is closed (a live count). */
function closed(g: Game): { readonly length: number } {
  const log = record(g, 'Notice');
  return { get length() { return log.filter((n) => n.text === t('demo.closed')).length; } };
}

/** A walk straight on from (x, z) along `dir`, the camera behind it, for `frames` steps; the farthest any foot went from the demo. */
function walk(g: Game, x: number, z: number, yaw: number, frames: number): boolean {
  goTo(g, x, z, yaw);
  g.camera.yaw = g.camera.prevYaw = yaw;
  let left = false;
  for (let i = 0; i < frames; i++) {
    stepGame(g, { ...emptyInput(), moveY: 1 });
    if (!inDemo(pos(g).x, pos(g).z)) left = true;
  }
  return left;
}

describe('the demo (round 56): the university and Arkham, to the fall of Keziah Mason', () => {
  it('holds a walk at the edge of its realms, and says why, as a fog holds one', () => {
    const g = createWorldGame({ demo: true });
    const said = closed(g);
    const hub = REGIONS.find((r) => r.id === 'hub')!;
    const x = (hub.area[0] + 0.5) * TILE; // the middle of the university's tile, walking north into Vermont's
    const edge = (hub.area[1] + 1) * TILE;
    expect(regionAt(x, edge + 1)?.id).toBe('vermont');
    const left = walk(g, x, edge - 6, 0, 600);
    expect(left).toBe(false);
    expect(pos(g).z).toBeGreaterThan(edge - 4); // it walked up to the edge, and there it stands
    expect(said.length).toBeGreaterThan(0);
    expect(said.length).toBeLessThanOrEqual(Math.ceil(600 / DEMO.noticeFrames)); // said now and then, not every frame
  });

  it('refuses a gate to a far realm, the stair, and a sign beyond it, where each begins', () => {
    const g = createWorldGame({ demo: true });
    const said = closed(g);
    const far = worldLayout().gates.find((gt) => inDemo(gt.x, gt.z) && !inDemo(gatePlace(gt.to)!.arrive.x, gatePlace(gt.to)!.arrive.z))!;
    expect(far).toBeDefined();
    goTo(g, far.arrive.x, far.arrive.z);
    run(g, 2);
    const at = { ...pos(g) };
    expect(passGate(g, far.id)).toBe(false);
    expect(pos(g)).toMatchObject({ x: at.x, z: at.z });
    const sleeper = worldLayout().signs.find((s) => s.dream)!;
    g.overworld!.sign = sleeper.id;
    g.overworld!.slain.add(`boss:${DEMO.lastBoss}`);
    expect(dream(g)).toBe(false);
    const beyond = worldLayout().signs.find((s) => !inDemo(s.rest.x, s.rest.z))!;
    g.overworld!.discovered.add(beyond.id);
    expect(travel(g, beyond.id)).toBe(false);
    expect(inDemo(pos(g).x, pos(g).z)).toBe(true);
    expect(said.length).toBeGreaterThan(0);
  });

  it('names, before any journey begins, the signs and gates it refuses: the map greys them, the sign lists them not (review of PR 142)', () => {
    const [demo, full] = [createWorldGame({ demo: true }), createWorldGame()];
    const beyond = worldLayout().signs.find((s) => !inDemo(s.rest.x, s.rest.z))!;
    const within = worldLayout().signs.find((s) => inDemo(s.rest.x, s.rest.z))!;
    const out = worldLayout().gates.find((gt) => inDemo(gt.x, gt.z) && !inDemo(gatePlace(gt.to)!.arrive.x, gatePlace(gt.to)!.arrive.z))!;
    expect([signBeyondDemo(demo, beyond.id), signBeyondDemo(demo, within.id), signBeyondDemo(full, beyond.id)]).toEqual([true, false, false]);
    expect([gateBeyondDemo(demo, out.id), gateBeyondDemo(full, out.id)]).toEqual([true, false]);
    const said = closed(demo);
    signBeyondDemo(demo, beyond.id);
    gateBeyondDemo(demo, out.id);
    expect(said.length).toBe(0); // asking says nothing: only a refusal does
  });

  it('says its end once, when Keziah Mason has fallen, and keeps it in the save', () => {
    const g = createWorldGame({ demo: true });
    const ended = record(g, 'DemoEnded');
    run(g, 5);
    expect(ended).toHaveLength(0);
    g.overworld!.slain.add(`boss:${DEMO.lastBoss}`);
    run(g, 5);
    expect(ended).toHaveLength(1);
    expect(g.overworld!.told.has(DEMO.told)).toBe(true);
  });

  it('wakes a save from the full game, made beyond its realms, at the university', () => {
    const g = createWorldGame({ demo: true });
    const beyond = worldLayout().signs.find((s) => !inDemo(s.rest.x, s.rest.z))!;
    g.player.checkpoint = { ...beyond.rest };
    g.overworld!.sign = beyond.id;
    goTo(g, beyond.rest.x, beyond.rest.z);
    run(g, 1);
    expect(inDemo(pos(g).x, pos(g).z)).toBe(true);
    expect(g.overworld!.sign).toBe(DEMO.start);
    expect(inDemo(g.player.checkpoint.x, g.player.checkpoint.z)).toBe(true);
  });

  it('leaves the full game as it was: the same leaps go through, and nothing is said', () => {
    const g = createWorldGame();
    const said = closed(g);
    const beyond = worldLayout().signs.find((s) => !inDemo(s.rest.x, s.rest.z))!;
    g.overworld!.discovered.add(beyond.id);
    expect(travel(g, beyond.id)).toBe(true);
    expect(demoAllows(g, pos(g))).toBe(true);
    g.overworld!.slain.add(`boss:${DEMO.lastBoss}`);
    const ended = record(g, 'DemoEnded');
    run(g, 5);
    expect([said.length, ended.length]).toEqual([0, 0]);
  });

  it('holds all it promises: its signs and its horrors, Keziah Mason among them, stand in its realms', () => {
    const signs = worldLayout().signs.filter((s) => inDemo(s.rest.x, s.rest.z));
    expect(signs.map((s) => s.id)).toContain(DEMO.start);
    expect(signs.some((s) => s.dream)).toBe(true); // the Sleeper's Sign, whose stair is the way on
    expect(signPlace(DEMO.start)).toBeDefined();
    const bosses = REGIONS.filter((r) => DEMO.regions.has(r.id)).flatMap((r) => r.bosses);
    expect(bosses).toContain(DEMO.lastBoss);
  });

  it('in a browser, stays the demo through the game\'s own reloads, which drop the address\'s ?demo (review of PR 142)', () => {
    const kept = new Map<string, string>();
    const tab = { getItem: (k: string) => kept.get(k) ?? null, setItem: (k: string, v: string) => void kept.set(k, v) };
    expect(editionOf(undefined, '', tab)).toBe('full'); // a tab never asked
    expect(editionOf(undefined, '?demo&fresh', tab)).toBe('demo');
    expect(kept.get(DEMO_KEY)).toBe('1');
    expect(editionOf(undefined, '', tab)).toBe('demo'); // back at the title (location.pathname), the same tab
    expect(editionOf(undefined, '', null)).toBe('full'); // another tab
    const blocked = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
    expect([editionOf(undefined, '?demo', blocked), editionOf(undefined, '', blocked)]).toEqual(['demo', 'full']); // storage refused: the address alone
    expect([editionOf('demo', '', null), editionOf('full', '', null)]).toEqual(['demo', 'full']); // the shell's pack says
  });

  it('is packed as one (desktop/steam.js), and opens only the game\'s page, which the shell names too', () => {
    expect(edition({ edition: 'demo', channel: 'itch' })).toBe('demo');
    expect([edition({ edition: 'full' }), edition({}), edition(null), edition()]).toEqual(['full', 'full', 'full', 'full']);
    expect(readFileSync('desktop/main.js', 'utf8')).toContain(`const GAME_PAGE = '${GAME_PAGE}';`);
    expect(GAME_PAGE).toMatch(/^https:\/\/[\w-]+\.itch\.io\/[\w-]+$/);
  });
});
