/**
 * The keep tests the rules share (docs/DEMO_BUILD.md): an entry stays when its id is one the demo keeps (`KEEP`, src/data/demoContent.ts).
 * A variant key (`deep_one#eldritch`) keeps with its id. Each test names the kind of id it asks of, so a rule reads as what it cuts.
 */

import { KEEP } from '../../../src/data/demoContent.ts';

type Kind = keyof typeof KEEP;

/** Keeps an entry whose id (or variant key's id) the demo keeps of `kind`. */
export const kept = (kind: Kind): ((id: string) => boolean) => {
  const set = new Set<string>(KEEP[kind]);
  return (id) => set.has(id) || set.has(id.split('#')[0]!);
};

/** Every realm of the full game, by id (data/regions.ts; `tests/demoContent.test.ts` holds this list to the file). */
export const ALL_REALMS: readonly string[] = [
  'hub', 'arkham', 'dunwich', 'innsmouth', 'providence', 'vermont', 'mountains', 'pnakotus', 'kn_yan', 'dreamlands', 'rlyeh', 'yuggoth', 'beyond',
  'cloud_summit', 'black_wood', 'pale_lattice', 'piping_dark', 'spheres', 'court_centre',
];

/**
 * For a table keyed by realm and also by other keys (a scene's `title` or `arena`): a realm the demo does not keep is cut, and any
 * other key stays.
 */
export const realmsOrOther = (): ((id: string) => boolean) => {
  const keptRealms = new Set<string>(KEEP.regions);
  const realms = new Set<string>(ALL_REALMS);
  return (id) => keptRealms.has(id) || !realms.has(id);
};

/** Every weapon of the full game (data/weapons.ts; `tests/demoContent.test.ts` holds this list to the file). */
export const ALL_WEAPONS: readonly string[] = ['cane', 'axe', 'razor', 'cutlass', 'rapier'];

/** For a table keyed by weapon, and by a weapon's move (`axe.guard`) too: a weapon the demo does not keep is cut, any other key stays. */
export const weaponsOrOther = (): ((id: string) => boolean) => {
  const keptWeapons = new Set<string>(KEEP.weapons);
  const weapons = new Set<string>(ALL_WEAPONS);
  return (id) => {
    const w = id.split('.')[0]!;
    return keptWeapons.has(w) || !weapons.has(w);
  };
};

/** For a list of player parts: an arm of a weapon the demo does not keep (`arm_axe`) is cut; every other part stays. */
export const weaponPartsOrOther = (): ((id: string) => boolean) => {
  const keptWeapons = new Set<string>(KEEP.weapons);
  const weapons = new Set<string>(ALL_WEAPONS);
  return (id) => !(id.startsWith('arm_') && weapons.has(id.slice(4)) && !keptWeapons.has(id.slice(4)));
};

/** Every realm of the full game that the demo does not keep is cut from a list of realms; a list's other words stay. */
export const realmsNotKept = (): ((id: string) => boolean) => {
  const keptRealms = new Set<string>(KEEP.regions);
  const realms = new Set<string>(ALL_REALMS);
  return (id) => keptRealms.has(id) || !realms.has(id);
};
