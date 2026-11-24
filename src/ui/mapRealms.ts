/**
 * The realms of the full map (2026-11-24: "it should be possible to view every known map (travelled to and activated an elder sign)
 * inside the actual map menu and fast-travel to each known sign without having to rest at a sign"). The map shows one realm at a time:
 * the one the investigator stands in, or any other in which they have lit an Elder Sign, chosen from the row of their names under the
 * heading (a click), Q and E or PageUp and PageDown, or the pad's L3. A lit sign of the realm on show is travelled to as one of the realm
 * stood in always was (mapTravel.ts), barred by the same things (checkpoints.ts's travelBar). Here: which realms are known, what each is
 * called, where the map opens on one not stood in, the heading's line of what is charted, and the row of names.
 */

import type { XZ } from '../core/geom';
import type { RegionDef } from '../data/regions';
import { signBeyondDemo, signPlace } from '../systems/checkpoints';
import type { Game } from '../systems/components';
import { exploredShare } from '../systems/exploration';
import { nextGift, secretsFound } from '../systems/poiGifts';
import { poiTotals } from '../systems/pois';
import { allRealms, realmOf, realmRect } from '../world/mapData';
import { placesOf } from '../world/namedPlaces';
import { worldLayout } from '../world/placements';
import { regionAt } from '../world/worldMap';
import { BONE, DIM } from './mapIconKit';
import { el } from './menuKit';

/** The realm the investigator stands in (none, `[]`, between realms): one of `allRealms()`'s arrays. */
export function realmHere(g: Game): RegionDef[] {
  const p = g.ecs.c.transform.get(g.player.id)!.pos;
  return realmOf(g.overworld?.region ?? regionAt(p.x, p.z)?.id ?? '');
}

/**
 * The realms the map can show, in the world's order: `here` (the one stood in, if any) and every one with an Elder Sign lit (in the
 * demo, none beyond its realms). The arrays are `allRealms()`'s own, so `realmOf`'s answer is found among them by identity.
 */
export function knownRealms(g: Game, here: readonly RegionDef[]): RegionDef[][] {
  const ow = g.overworld;
  const lit = new Set<string>();
  if (ow) for (const s of worldLayout().signs) if (ow.discovered.has(s.id) && !signBeyondDemo(g, s.id)) lit.add(s.region);
  return allRealms().filter((rs) => rs === here || rs.some((r) => lit.has(r.id)));
}

/** A realm's name: its one region's, or, for the realm of many (the waking world, in the full game and the demo), what it is. */
export const realmName = (rs: readonly RegionDef[]): string => (rs.length !== 1 && rs.some((r) => r.id === 'hub') ? 'The Waking World' : (rs[0]?.name ?? ''));

/** Where the map opens on a realm: the investigator, in their own; in another, the sign last rested at or come to, if it is there, else its first sign lit, else its middle. */
export function realmAnchor(g: Game, rs: readonly RegionDef[]): XZ {
  const p = g.ecs.c.transform.get(g.player.id)!.pos;
  if (rs.length && rs === realmHere(g)) return { x: p.x, z: p.z };
  const ids = new Set(rs.map((r) => r.id));
  const ow = g.overworld;
  const last = ow ? signPlace(ow.sign) : undefined;
  if (last && ids.has(last.region)) return { x: last.x, z: last.z };
  const lit = worldLayout().signs.find((s) => ids.has(s.region) && !!ow?.discovered.has(s.id));
  if (lit) return { x: lit.x, z: lit.z };
  const r = realmRect(rs);
  return { x: (r.x0 + r.x1) / 2, z: (r.z0 + r.z1) / 2 };
}

/** The heading over a realm: the region stood in, in the investigator's own (`mine`), else the realm's name; and what is charted of it. */
export function realmHeading(g: Game, rs: readonly RegionDef[], mine: boolean): [string, string] {
  const where = mine ? rs.find((x) => x.id === g.overworld?.region)?.name : undefined;
  return [(where ?? realmName(rs)).toUpperCase(), realmStats(g, rs)];
}

/** Which way a key turns the map's realm: Q or PageUp back, E or PageDown on; 0 for any other, a key held, or the map's own key (it shuts the map). */
export function realmTurn(e: Pick<KeyboardEvent, 'code' | 'repeat'>, mapKey: string): -1 | 0 | 1 {
  if (e.repeat || e.code === mapKey) return 0;
  return e.code === 'KeyQ' || e.code === 'PageUp' ? -1 : e.code === 'KeyE' || e.code === 'PageDown' ? 1 : 0;
}

/** The heading's second line for a realm: how much of it is charted, the places and secrets found there, and the next gift for secrets. */
export function realmStats(g: Game, rs: readonly RegionDef[]): string {
  const ow = g.overworld;
  if (!ow || !rs.length) return '';
  const area = (x: RegionDef): number => x.area[2] * x.area[3];
  const charted = rs.reduce((s, x) => s + exploredShare(ow.explored, x) * area(x), 0) / rs.reduce((s, x) => s + area(x), 0);
  const found = rs.flatMap((x) => placesOf(x.id)).filter((p) => ow.places.has(p.id)).length; // round 18
  const secrets = poiTotals(g, rs); // round 61
  const gift = nextGift(g); // round 68: the gifts for the secrets found, in all the realms
  const totalSecrets = secretsFound(g);
  const parts: string[] = [charted >= 0.005 ? `${Math.round(charted * 100)}% CHARTED` : 'SURVEY BEGUN'];
  if (found > 0) parts.push(`${found} ${found === 1 ? 'PLACE' : 'PLACES'} CHARTED`);
  if (secrets.found > 0) parts.push(`${secrets.found} ${secrets.found === 1 ? 'SECRET' : 'SECRETS'} UNCOVERED`);
  if (totalSecrets > 0 && secrets.of && gift) parts.push(`GIFT AT ${gift.at} SECRETS (${totalSecrets} FOUND)`);
  return parts.join('   ·   ');
}

export interface RealmBar {
  /** Whether `target` is part of the row: the pointer there is on it, not on the map beneath it. */
  holds(target: EventTarget | null): boolean;
}

/**
 * The row of the known realms' names, under the heading: the one on show bright, each another a click away (`pick`, by its place in
 * `realms`), with the keys that turn through them at its ends (`pad`: the pad's L3). Not buttons: the menus' arrows and A do not stop on them.
 */
export function buildRealmBar(head: HTMLElement, realms: readonly (readonly RegionDef[])[], shown: number, pick: (i: number) => void, pad: boolean): RealmBar {
  const ui = 'var(--ui, 1)';
  const row = el(head, 'div', '', `display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:4px 6px;margin:8px auto 0;max-width:88%;pointer-events:auto;user-select:none`);
  row.addEventListener('contextmenu', (e) => e.preventDefault());
  const cap = (text: string): void => void el(row, 'span', text, `border:1px solid ${BONE}55;border-radius:3px;padding:0 5px;font-size:calc(10px * ${ui});color:${BONE};background:#d9d0b81a;letter-spacing:.5px`);
  if (!pad) cap('Q');
  realms.forEach((rs, i) => {
    const on = i === shown;
    const chip = el(row, 'div', realmName(rs).toUpperCase(), `padding:2px 9px;letter-spacing:2px;font-size:calc(10px * ${ui});color:${on ? BONE : DIM};border:1px solid ${on ? '#d9d0b899' : '#d9d0b826'};background:${on ? '#d9d0b81f' : '#050506b0'};cursor:${on ? 'default' : 'pointer'};white-space:nowrap`);
    chip.setAttribute('role', 'button');
    chip.setAttribute('aria-pressed', String(on));
    if (on) return;
    chip.addEventListener('mouseenter', () => void (chip.style.color = BONE));
    chip.addEventListener('mouseleave', () => void (chip.style.color = DIM));
    chip.addEventListener('click', () => pick(i));
  });
  cap(pad ? 'L3' : 'E');
  return { holds: (target) => target instanceof Node && row.contains(target) };
}
