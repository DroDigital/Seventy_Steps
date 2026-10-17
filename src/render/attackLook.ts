/**
 * What one horror's attacks look like (round 51). `data/bossAttackTheme` holds its four colours as its
 * author chose them, many of them near black (the dread's own hue). A ground mark in near black on
 * a dark floor is a mark nobody sees, so the colours the eye must find (the telegraphs, the bolts, the
 * beams, the flashes) are lifted to a floor of brightness that keeps their hue; the dark ones stay as
 * the ink of what the blow leaves behind (the scar, the pool). Pure: no Three.js.
 */

import type { Entity } from '../core/ecs';
import type { Game } from '../systems/components';
import { creatureOf } from '../systems/creatures';
import { BOSS_ATTACK_THEME, type AttackTheme } from '../data/bossAttackTheme';
import { getEntity } from '../data/registry';
import type { CreaturePalette } from '../data/schema';
import { aoeLook, type AoeMotif } from './aoeLook';
import { DEFAULT_ATTACK_THEME } from './attackTheme';
import { BASE, CREATURE_COLORS, luma, mixRgb, rgbToHsv, scaleRgb, type Rgb } from './palette';

/** The least brightness (Rec. 709 luma, 0..1) of a colour that marks where a blow will fall. */
export const DANGER_FLOOR = 0.42;
/** The least brightness of a bolt, a beam or a flash: these are lights, and shine. */
export const LIGHT_FLOOR = 0.58;

export interface AttackLook {
  motif: AoeMotif; // the element of its blows: what they are made of and how they burst
  danger: Rgb; // where a blow will land (lifted)
  line: Rgb; // a bolt, a beam (lifted)
  ring: Rgb; // a quake's band, a burst's dust
  mind: Rgb; // a gaze, a vortex, a summoning (lifted)
  core: Rgb; // the white-hot heart of a light, in the horror's tint
  ember: Rgb; // what a spark cools to
  ink: Rgb; // what a blow leaves on the ground: the author's own dark
}

const clamp1 = (c: Rgb): Rgb => [Math.min(1, c[0]), Math.min(1, c[1]), Math.min(1, c[2])];

/** `c` at least as bright as `floor`, its hue kept: raised by scale, then toward white if it would clip. */
export function lift(c: Rgb, floor: number): Rgb {
  const l = luma(c);
  if (l >= floor - 1e-6) return c;
  const [, s] = rgbToHsv(c);
  let out: Rgb = l < 1e-4 ? [floor, floor, floor] : clamp1(scaleRgb(c, floor / l));
  if (s > 0.02 && luma(out) < floor) out = mixRgb(out, [1, 1, 1], Math.min(1, (floor - luma(out)) / Math.max(0.05, 1 - luma(out))));
  return out;
}

/** The body a roster id is drawn in. */
export function paletteOf(id: string): CreaturePalette {
  const def = getEntity(id);
  return def?.sprite?.palette ?? def?.assembly?.palette ?? 'bone';
}

/** What a creature with no theme of its own throws, from what it is made of. */
const MADE_OF: Readonly<Record<CreaturePalette, AoeMotif>> = {
  sea: 'tide', ichor: 'stain', rubber: 'stain', fungus: 'spore', mold: 'spore', flesh: 'root',
  stone: 'crack', sand: 'crack', rust: 'crack', bone: 'ash', charcoal: 'ash', pallid: 'frost',
};

function build(id: string | undefined, theme: AttackTheme): AttackLook {
  const themed = !!id && theme !== DEFAULT_ATTACK_THEME;
  const plain = !themed && !!id && !!getEntity(id);
  const danger = lift(theme.danger, DANGER_FLOOR);
  const line = lift(plain ? mixRgb(CREATURE_COLORS[paletteOf(id)].light, BASE.bone, 0.45) : theme.line, LIGHT_FLOOR);
  return {
    motif: themed ? aoeLook(id).name : plain ? MADE_OF[paletteOf(id)] : 'plain',
    danger,
    line,
    ring: lift(theme.ring, DANGER_FLOOR),
    mind: lift(theme.mind, DANGER_FLOOR),
    core: mixRgb(line, [1, 1, 1], 0.7),
    ember: scaleRgb(mixRgb(danger, BASE.charcoal, 0.4), 0.5),
    ink: theme.danger,
  };
}

const cache = new Map<string | undefined, AttackLook>();

/** The look of roster id `id`'s attacks; one with no theme keeps the shared palette, lifted all the same. */
export function lookOf(id: string | undefined): AttackLook {
  let look = cache.get(id);
  if (!look) cache.set(id, (look = build(id, (id && BOSS_ATTACK_THEME[id]) || DEFAULT_ATTACK_THEME)));
  return look;
}

export function attackLook(g: Game, id: Entity): AttackLook {
  return lookOf(creatureOf(g, id)?.id);
}

/** Whether roster id `id` is one of the horrors with colours of its own. */
export const isThemed = (id: string | undefined): boolean => !!id && !!BOSS_ATTACK_THEME[id];
