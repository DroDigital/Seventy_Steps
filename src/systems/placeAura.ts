/**
 * The dread of the place the investigator stands in (round 61; data/pois.ts `aura`, systems/pois.ts): sanity a second, set as the places
 * are looked for and counted by sanity.ts's drain with the foes' auras, so that it presses on the mind and stops its mending as they do,
 * and a swallow of Laudanum holds it off as it holds them. A leaf module, so that sanity.ts need not import the places that import it.
 */

const dread = new WeakMap<object, number>();

/** Sanity a second the place stands in takes, or 0. */
export const placeDread = (g: object): number => dread.get(g) ?? 0;

export function setPlaceDread(g: object, perSecond: number): void {
  if (perSecond > 0) dread.set(g, perSecond);
  else dread.delete(g);
}
