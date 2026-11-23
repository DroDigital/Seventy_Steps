/**
 * What stands along a hall's walls (round 30: the dungeons were bare stone boxes with a pillar or
 * two): by its kit, shelves of books, stone coffins, statues, stelae, pews, casks and crates, growths
 * of the deep and of the fungus; each built on a wall's own frame (`s` along it, `d` out from it), a
 * few small things strewn on the floor between them, and braziers in a hall's far corners. Render
 * only, and nothing it makes is solid: the walls it leans on are, and it stands no more than 60 cm
 * off them. Pure but for the geometry it makes.
 */

import * as THREE from 'three';
import type { KitId } from '../data/kits';
import type { WallItem } from '../data/dungeonLooks';
import { DARK, IRON, lathe, type Frame } from './furnitureKit';
import { KIT_ITEMS, type KitItem } from './kitItems';
import { LORE_ITEMS, type LoreItem } from './loreItems';
import { tint } from './meshKit';
import { scaleRgb } from './palette';

export { blob, BONE, DARK, IRON, round, wb, type Frame, type Out, type Wall } from './furnitureKit';

export type Item = WallItem;

/** What each kit sets along its walls, in turn (a few repeat to weigh them). */
export const ITEMS: Readonly<Record<KitId, readonly KitItem[]>> = {
  masonry: ['coffin', 'stele', 'barrel', 'bones'],
  library: ['shelves', 'shelves', 'shelves', 'statue'],
  timber: ['shelves', 'crate', 'barrel', 'crate'],
  townhouse: ['shelves', 'crate', 'barrel'],
  cellar: ['barrel', 'crate', 'barrel', 'rubble'],
  mine: ['crate', 'rubble', 'barrel', 'rubble'],
  brick: ['barrel', 'crate', 'stele'],
  crypt: ['coffin', 'coffin', 'stele', 'bones'],
  church: ['pew', 'statue', 'coffin', 'pew'],
  marble: ['statue', 'statue', 'stele'],
  hill: ['stele', 'rubble'],
  drowned: ['growth', 'stele', 'growth', 'rubble'],
  sunken: ['growth', 'stele', 'rubble'],
  elder: ['stele', 'rubble'],
  basalt: ['coffin', 'stele', 'statue'],
  tsath: ['statue', 'stele'],
  dream: ['statue', 'stele', 'coffin'],
  dreamflame: ['statue', 'stele'],
  dreamdeep: ['statue', 'stele'],
  dreamabyss: ['stele', 'statue', 'rubble'],
  onyx: ['stele', 'statue'],
  cyclopean: ['stele', 'growth', 'rubble'],
  fungoid: ['growth', 'growth', 'rubble'],
  void: [],
};

/** Builds one item on a wall at `f.s`. */
export const place = (item: Item, f: Frame): void => (item in LORE_ITEMS ? LORE_ITEMS[item as LoreItem](f) : KIT_ITEMS[item as KitItem](f));

/** How far an item stands off its wall at most (the walls' inner faces are solid; nothing is set deeper into a room than this). */
export const DEPTH = 1.1;

/**
 * A brazier at (x, z) on a floor at `y`, and where its fire burns (the pixel flame, flames.ts: round 87, no cone of it is built): round 117,
 * a bowl turned with a rolled rim on three splayed legs with their feet, a ring binding them under it, and coals heaped in it that glow.
 */
export function brazier(x: number, z: number, y: number): { iron: THREE.BufferGeometry[]; at: { x: number; y: number; z: number } } {
  const dark = scaleRgb(IRON, 1.15);
  const bowl = lathe([[0, 0.9], [0.2, 0.9], [0.36, 1.02], [0.44, 1.16], [0.47, 1.2], [0.43, 1.21], [0.38, 1.12], [0, 1.08]], 10, dark).translate(x, y, z);
  const iron: THREE.BufferGeometry[] = [bowl, tint(new THREE.TorusGeometry(0.215, 0.025, 4, 12).rotateX(Math.PI / 2).translate(x, y + 0.55, z), IRON)]; // (the ring that binds its legs)
  for (let k = 0; k < 3; k++) { // its legs, splayed, each on a foot
    const a = (k / 3) * Math.PI * 2;
    const [fx, fz] = [x + Math.sin(a) * 0.4, z + Math.cos(a) * 0.4];
    const leg = new THREE.CylinderGeometry(0.03, 0.04, 1.0, 5).translate(0, 0.5, 0).rotateX(-0.33).rotateY(a); // leaning in, to meet under the bowl
    iron.push(tint(leg.translate(fx, y + 0.015, fz), IRON), tint(new THREE.CylinderGeometry(0.07, 0.08, 0.05, 6).translate(fx, y + 0.025, fz), IRON));
  }
  for (let k = 0; k < 6; k++) { // the coals heaped in it
    const a = k * 2.4;
    const r = k ? 0.2 : 0;
    iron.push(tint(new THREE.IcosahedronGeometry(0.1, 0).scale(1, 0.6, 1).translate(x + Math.sin(a) * r, y + 1.16 + (k ? 0 : 0.04), z + Math.cos(a) * r), scaleRgb(DARK, 0.4)));
  }
  return { iron, at: { x, y: y + 1.7, z } };
}
