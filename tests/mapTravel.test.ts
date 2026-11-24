import { describe, expect, it } from 'vitest';
import { setLocale } from '../src/core/i18n';
import { LANGS } from '../src/data/lang';
import { START_SIGN } from '../src/data/sites';
import { signPlace, travel, travelBar } from '../src/systems/checkpoints';
import { isAbsent } from '../src/systems/components';
import { createWorldGame } from '../src/systems/game';
import { barWord, litSigns, mapZoom, signAt, signToward, steerPad, type BarWord } from '../src/ui/mapTravel';
import type { MapPlace } from '../src/world/mapData';
import { realmOf } from '../src/world/mapData';

const stickAtRest = { x: 0, y: 0 };
const padAtRest = { stick: stickAtRest, pan: stickAtRest, lock: false, dpad: null, zoomIn: 0, zoomOut: 0 };

describe('playtest round 7: fast travel from the map', () => {
  it('the map offers the realm’s lit signs, nearest first, and picks the one under the pointer', () => {
    const g = createWorldGame();
    const realm = realmOf(g.overworld!.region!);
    const here = g.ecs.c.transform.get(g.player.id)!.pos;
    expect(litSigns(g, realm, here).map((s) => s.id)).toEqual([START_SIGN]);
    g.overworld!.discovered.add('arkham_streets');
    g.overworld!.discovered.add('rlyeh_door'); // another realm: not on this map
    const lit = litSigns(g, realm, here);
    expect(lit.map((s) => s.id)).toEqual([START_SIGN, 'arkham_streets']);
    const s = lit[1];
    const view = { cx: s.x, cz: s.z, scale: 1, w: 400, h: 300 };
    expect(signAt(lit, view, 205, 148)?.id).toBe('arkham_streets'); // a few pixels off
    expect(signAt(lit, view, 240, 150)).toBeNull();
  });

  it('picks a sign in the direction the pad points', () => {
    const place = (id: string, x: number, z: number): MapPlace => ({ id, x, z, kind: 'sign', name: id, region: 'arkham', bosses: [] });
    const north = place('north', 0, 80); // +z is up the map
    const east = place('east', -90, 0); // −x is to the right
    const south = place('south', 10, -70);
    const signs = [north, east, south];
    const view = { cx: 0, cz: 0, scale: 2, w: 400, h: 300 };
    expect(signToward(signs, view, { x: 0, z: 0 }, { x: 0, y: -1 })?.id).toBe('north');
    expect(signToward(signs, view, { x: 0, z: 0 }, { x: 1, y: 0 })?.id).toBe('east');
    expect(signToward(signs, view, { x: 0, z: 0 }, { x: 0, y: 1 })?.id).toBe('south');
    expect(signToward(signs, view, { x: 0, z: 0 }, { x: -1, y: 0 })).toBeNull(); // nothing to the left
    expect(signToward(signs, view, north, { x: 0, y: -1 })).toBeNull(); // already on the northern sign: the next press does not pick it again
    const onNorth = { cx: north.x, cz: north.z, scale: 2, w: 400, h: 300 };
    expect(signToward(signs, onNorth, { x: onNorth.cx, z: onNorth.cz }, { x: 0, y: 1 })?.id).toBe('south');
  });

  it('moves the pad crosshair onto a visible sign without panning the map', () => {
    const sign: MapPlace = { id: 'east', x: -48, z: -24, kind: 'sign', name: 'east', region: 'arkham', bosses: [] };
    const at = { locked: false, armed: true, cx: 0, cz: 0, w: 400, h: 300, scale: 2, aim: { x: 200, y: 150 } };
    const moved = steerPad(at, { ...padAtRest, stick: { x: 1, y: 0.5 } }, 0.5, [sign], 14).view;
    expect(moved).toMatchObject({ cx: 0, cz: 0, aim: { x: 296, y: 198 } });
    expect(signAt([sign], moved, moved.aim.x, moved.aim.y)).toBe(sign);
    const right = steerPad(moved, { ...padAtRest, pan: { x: 1, y: 0 } }, 0.5, [sign], 14).view;
    expect(right).toMatchObject({ cx: -48, cz: 0, aim: moved.aim });
    const edge = steerPad(moved, { ...padAtRest, stick: { x: 1, y: 0 } }, 1, [sign], 14).view;
    expect(edge).toMatchObject({ cx: -44, cz: 0, aim: { x: 400, y: 198 } });
  });

  it('steps past the hovered sign when the D-pad points toward it and the next sign', () => {
    const here: MapPlace = { id: 'here', x: -5, z: 0, kind: 'sign', name: 'here', region: 'arkham', bosses: [] };
    const east = { ...here, id: 'east', x: -100 };
    const at = { locked: false, armed: true, cx: 0, cz: 0, w: 400, h: 300, scale: 2, aim: { x: 200, y: 150 } };
    const step = steerPad(at, { ...padAtRest, dpad: { x: 1, y: 0 } }, 1 / 60, [here, east], 14);
    expect(step.focus).toBe(east);
  });

  it('R3 locks the sign under the mark and a stick push switches once, and the triggers zoom by time', () => {
    const place = (id: string, x: number, z: number): MapPlace => ({ id, x, z, kind: 'sign', name: id, region: 'arkham', bosses: [] });
    const here = place('here', 0, 0);
    const east = place('east', -90, 0);
    const at = { locked: false, armed: true, cx: 0, cz: 0, w: 400, h: 300, scale: 2, aim: { x: 200, y: 150 } };
    const push = { ...padAtRest, stick: { x: 1, y: 0 } };
    const held = steerPad(at, { ...push, lock: true }, 1 / 60, [here, east], 40);
    expect(held.focus?.id).toBe('here'); // a stick already pushed does not flick on the lock itself
    expect(held.view).toMatchObject({ locked: true, armed: false, cx: 0, aim: at.aim });
    const back = steerPad(held.view, padAtRest, 1 / 60, [here, east], 40);
    expect(back.view.armed).toBe(true);
    const flick = steerPad(back.view, push, 1 / 60, [here, east], 40);
    expect(flick.focus?.id).toBe('east');
    expect(flick.view).toMatchObject({ cx: east.x, aim: at.aim });
    expect(steerPad(flick.view, push, 1 / 60, [here, east], 40).focus).toBeNull(); // held: no chain of signs
    const out = mapZoom(0, 1, 1 / 60);
    expect(out).toBeLessThan(1);
    expect(mapZoom(1, 0, 1 / 60)).toBeGreaterThan(1);
    expect(out * out).toBeCloseTo(mapZoom(0, 1, 1 / 30), 5); // two frames, or one of twice the time
    expect(mapZoom(0, 0, 1)).toBe(1);
  });

  it('no journey while a foe hunts close by, or a boss fight is on; otherwise the sign is reached', () => {
    const g = createWorldGame();
    expect(travelBar(g)).toBeNull();
    const foe = [...g.overworld!.alive.values()].find((e) => !isAbsent(g, e) && !g.ecs.c.fight.has(e))!;
    const p = g.ecs.c.transform.get(g.player.id)!.pos;
    g.ecs.c.transform.get(foe)!.pos = { x: p.x + 4, y: p.y, z: p.z };
    const br = g.ecs.c.brain.get(foe)!;
    Object.assign(br, { state: 'engage', target: g.player.id });
    expect(travelBar(g)).toBe('foes');
    Object.assign(br, { state: 'idle', target: null });
    const boss = g.ecs.spawn();
    g.ecs.c.fight.set(boss, { engaged: true } as never);
    g.ecs.c.health.set(boss, { hp: 100, max: 100, calm: 0 } as never);
    expect(travelBar(g)).toBe('boss');
    g.ecs.despawn(boss);
    expect(travelBar(g)).toBeNull();
    g.overworld!.discovered.add('arkham_streets');
    expect(travel(g, 'arkham_streets')).toBe(true);
    expect(g.ecs.c.transform.get(g.player.id)!.pos).toMatchObject({ x: signPlace('arkham_streets')!.rest.x, z: signPlace('arkham_streets')!.rest.z });
  });

  it('every travel refusal has words in every language', () => {
    const bars: readonly BarWord[] = ['boss', 'foes', 'fallen', 'demo'];
    try {
      for (let i = 0; i < LANGS.length; i++) {
        setLocale(i);
        for (const bar of bars) expect(barWord(bar), `${LANGS[i].id} ${bar}`).toBeTruthy();
      }
      setLocale(0);
      const en = bars.map(barWord);
      setLocale(1);
      expect(bars.map(barWord)).not.toEqual(en);
    } finally {
      setLocale(0);
    }
  });
});
