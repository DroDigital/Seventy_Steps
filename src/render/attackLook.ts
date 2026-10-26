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
import { SIGNATURES, type Signature } from '../data/attackSignatures';
import { BOSS_ATTACK_THEME, type AttackTheme } from '../data/bossAttackTheme';
import { blowOf, type FoeBlow } from '../data/foeBlows';
import { getEntity } from '../data/registry';
import type { CreaturePalette } from '../data/schema';
import { aoeLook, type AoeMotif } from './aoeLook';
import { DEFAULT_ATTACK_THEME } from './attackTheme';
import { BASE, CREATURE_COLORS, luma, mixRgb, rgbToHsv, rotateHue, scaleRgb, type Rgb } from './palette';

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
  punch: number; // 0.85..1.2: how much matter its bursts throw, so two horrors of one element are not one
  twist: number; // 0.6..1.5: how fast that matter tumbles
  pitch: number; // 0.92..1.08: its sounds' pitch
  sig: Signature | null; // its own layer over the element (round 60: data/attackSignatures.ts, render/fxForms.ts)
  accent: Rgb; // the light that layer is drawn in (lifted)
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

/** Three small numbers from the id, the same each time. */
function temper(id: string | undefined): Pick<AttackLook, 'punch' | 'twist' | 'pitch'> {
  let n = 2166136261;
  for (const ch of id ?? '') n = Math.imul(n ^ ch.charCodeAt(0), 16777619);
  n >>>= 0;
  const at = (shift: number): number => ((n >>> shift) & 255) / 255;
  return { punch: id ? 0.85 + 0.35 * at(0) : 1, twist: id ? 0.6 + 0.9 * at(8) : 1, pitch: id ? 0.92 + 0.16 * at(16) : 1 };
}

const rgbOf = (hex: number): Rgb => [((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255];

/** A common foe's colours, from its signature's accent and its hide (round 60: every one of them was the shared magenta and green). */
function foeTheme(accent: Rgb, id: string): AttackTheme {
  const hide = CREATURE_COLORS[paletteOf(id)];
  return { danger: mixRgb(accent, hide.mid, 0.3), line: mixRgb(accent, hide.light, 0.3), ring: mixRgb(hide.light, accent, 0.3), mind: [accent[1], accent[2], accent[0]] };
}

/**
 * The look of a creature that draws its blow as a mark (round 88, data/foeBlows.ts): its three hues, lifted where the eye must find them. A mark
 * starts in the first and drifts through the second to the third as it fades; the gap between the hues is what tells two creatures apart.
 * No signature: nothing of it throws what the horrors' blows throw. Its element (`motif`, which the sounds follow) and temper are what they were.
 */
function blowLook(id: string, blow: FoeBlow): AttackLook {
  const [h0, h1, h2] = blow.hues.map(rgbOf) as [Rgb, Rgb, Rgb];
  const accent = lift(h0, LIGHT_FLOOR);
  const line = lift(mixRgb(h0, h1, 0.35), LIGHT_FLOOR);
  const danger = lift(h1, DANGER_FLOOR);
  return {
    motif: MADE_OF[paletteOf(id)],
    danger,
    line,
    ring: lift(mixRgb(h1, h2, 0.4), DANGER_FLOOR),
    mind: lift(rotateHue(h1, 40 / 360), DANGER_FLOOR),
    core: mixRgb(line, [1, 1, 1], 0.7),
    ember: scaleRgb(mixRgb(danger, BASE.charcoal, 0.4), 0.5),
    ink: mixRgb(accent, CREATURE_COLORS[paletteOf(id)].dark, 0.75),
    ...temper(id),
    sig: null,
    accent,
  };
}

function build(id: string | undefined, given: AttackTheme): AttackLook {
  const blow = id && !BOSS_ATTACK_THEME[id] && getEntity(id) ? blowOf(id) : undefined;
  if (id && blow) return blowLook(id, blow);
  const themed = !!id && given !== DEFAULT_ATTACK_THEME;
  const plain = !themed && !!id && !!getEntity(id);
  const sig = (id && SIGNATURES[id]) || null;
  const accent = lift(sig ? rgbOf(sig.accent) : given.line, LIGHT_FLOOR);
  const theme = plain && sig ? foeTheme(accent, id) : given;
  const danger = lift(theme.danger, DANGER_FLOOR);
  const line = lift(plain && !sig ? mixRgb(CREATURE_COLORS[paletteOf(id)].light, BASE.bone, 0.45) : theme.line, LIGHT_FLOOR);
  return {
    motif: themed ? aoeLook(id).name : plain ? MADE_OF[paletteOf(id)] : 'plain',
    danger,
    line,
    ring: lift(theme.ring, DANGER_FLOOR),
    mind: lift(theme.mind, DANGER_FLOOR),
    core: mixRgb(line, [1, 1, 1], 0.7),
    ember: scaleRgb(mixRgb(danger, BASE.charcoal, 0.4), 0.5),
    ink: plain && sig ? mixRgb(accent, CREATURE_COLORS[paletteOf(id)].dark, 0.75) : theme.danger,
    ...temper(id),
    sig,
    accent,
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

/** Whether entity `id` is a creature of the roster that is not one of the horrors (round 88): its blows are the quiet ones of `render/foeFx.ts`, and the horrors' machinery (`meleeFx`, `attackFx`) leaves it be. */
export const isQuiet = (g: Game, id: Entity): boolean => {
  const model = g.ecs.c.model.get(id);
  if (!model) return false;
  let quiet = quietModels.get(model);
  if (quiet === undefined) {
    const who = creatureOf(g, id)?.id;
    quietModels.set(model, (quiet = !!who && !isThemed(who)));
  }
  return quiet;
};
const quietModels = new Map<string, boolean>(); // (asked of every body every frame: the answer is the model's)
