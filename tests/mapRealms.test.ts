/**
 * The realms of the full map (2026-11-24: "it should be possible to view every known map (travelled to and activated an elder sign)
 * inside the actual map menu and fast-travel to each known sign without having to rest at a sign"): the map shows the realm stood in and
 * every other with a sign lit, each opening on its own ground, and any lit sign of the one on show is travelled to from it.
 */
import { describe, expect, it } from 'vitest';
import { signPlace, travel } from '../src/systems/checkpoints';
import { createWorldGame } from '../src/systems/game';
import { hintsFor } from '../src/ui/mapChrome';
import { knownRealms, realmAnchor, realmHeading, realmHere, realmName, realmTurn } from '../src/ui/mapRealms';
import { litSigns } from '../src/ui/mapTravel';
import { allRealms, realmOf, realmRect } from '../src/world/mapData';
import { regionAt } from '../src/world/worldMap';

const pos = (g: ReturnType<typeof createWorldGame>) => g.ecs.c.transform.get(g.player.id)!.pos;

describe('the full map shows every realm known (2026-11-24)', () => {
  it('knows the realm stood in, and each other once a sign is lit there, in the world’s order', () => {
    const g = createWorldGame();
    const home = realmHere(g);
    expect(home.length).toBeGreaterThan(1); // the waking world
    expect(knownRealms(g, home)).toEqual([home]);
    g.overworld!.discovered.add('rlyeh_door');
    const rlyeh = realmOf('rlyeh');
    const known = knownRealms(g, home);
    expect(known).toEqual([home, rlyeh].sort((a, b) => allRealms().indexOf(a) - allRealms().indexOf(b)));
    expect(known.indexOf(home)).toBeGreaterThanOrEqual(0); // found by identity, as the map finds it
    expect(knownRealms(g, [])).toEqual(known); // between realms, those with a sign lit (the first sign is lit from the start)
  });

  it('names each realm, and heads it with the region stood in only in the investigator’s own', () => {
    const g = createWorldGame();
    const home = realmHere(g);
    expect(realmName(home)).toBe('The Waking World');
    expect(realmName(realmOf('rlyeh'))).toBe(realmOf('rlyeh')[0].name);
    expect(realmHeading(g, home, true)[0]).toBe(home.find((r) => r.id === g.overworld!.region)!.name.toUpperCase());
    expect(realmHeading(g, realmOf('rlyeh'), false)[0]).toBe(realmOf('rlyeh')[0].name.toUpperCase());
    expect(realmHeading(g, realmOf('rlyeh'), false)[1]).toMatch(/CHARTED|SURVEY BEGUN/);
  });

  it('opens a realm about the investigator in their own, about its sign in another, and its middle where none is lit', () => {
    const g = createWorldGame();
    expect(realmAnchor(g, realmHere(g))).toEqual({ x: pos(g).x, z: pos(g).z });
    g.overworld!.discovered.add('rlyeh_door');
    const door = signPlace('rlyeh_door')!;
    expect(realmAnchor(g, realmOf('rlyeh'))).toEqual({ x: door.x, z: door.z });
    const yuggoth = realmOf('yuggoth');
    const r = realmRect(yuggoth);
    expect(realmAnchor(g, yuggoth)).toEqual({ x: (r.x0 + r.x1) / 2, z: (r.z0 + r.z1) / 2 });
  });

  it('travels to a lit sign of another realm from the map, with no rest at a sign first', () => {
    const g = createWorldGame();
    g.overworld!.discovered.add('rlyeh_door');
    const there = realmOf('rlyeh');
    const lit = litSigns(g, there, realmAnchor(g, there));
    expect(lit.map((s) => s.id)).toContain('rlyeh_door');
    expect(travel(g, 'rlyeh_door')).toBe(true);
    expect(realmOf(regionAt(pos(g).x, pos(g).z)!.id)).toBe(there); // (the overworld's region follows on its next step)
    expect(g.overworld!.sign).toBe('rlyeh_door');
  });

  it('turns between the realms with Q and E or PageUp and PageDown, and says so in the row of keys', () => {
    const key = (code: string, repeat = false) => ({ code, repeat });
    expect(realmTurn(key('KeyQ'), 'KeyM')).toBe(-1);
    expect(realmTurn(key('PageUp'), 'KeyM')).toBe(-1);
    expect(realmTurn(key('KeyE'), 'KeyM')).toBe(1);
    expect(realmTurn(key('PageDown'), 'KeyM')).toBe(1);
    expect(realmTurn(key('KeyE', true), 'KeyM')).toBe(0); // held
    expect(realmTurn(key('KeyE'), 'KeyE')).toBe(0); // the map bound to E: it shuts the map
    expect(realmTurn(key('KeyW'), 'KeyM')).toBe(0);
    const says = (pad: boolean, realms: boolean, k: string) => hintsFor(pad, 'M', realms).some(([keys, words]) => keys.includes(k) && words === 'Realm');
    expect(says(false, true, 'Q') && says(false, true, 'E')).toBe(true);
    expect(says(true, true, 'L3')).toBe(true);
    expect(says(false, false, 'Q') || says(true, false, 'L3')).toBe(false); // one realm known: nothing to turn to
  });
});
