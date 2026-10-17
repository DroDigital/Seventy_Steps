/**
 * How a shot is drawn. The bolt still flies as the simulation launched it. What changed is the
 * picture: one void-green fireball was every caster's shot. That orb stays with Yog-Sothoth, whose
 * spheres are that light, and the Colour keeps an orb in its own hue. Everyone else is a shard, a
 * drop, a spark or a dart in their own colours.
 */

import { BOSS_ATTACK_THEME } from '../data/bossAttackTheme';
import { getEntity } from '../data/registry';
import type { CreaturePalette } from '../data/schema';
import { ANOMALY, BASE, CREATURE_COLORS, mixRgb, type Rgb } from './palette';

export const SHOT_FORMS = ['orb', 'shard', 'drop', 'spark', 'dart'] as const;
export type ShotForm = (typeof SHOT_FORMS)[number];

export interface ShotLook {
  form: ShotForm;
  color: Rgb;
}

const BODIES = ['shard', 'spark', 'dart'] as const;

function paletteOf(id: string): CreaturePalette {
  const def = getEntity(id);
  return def?.sprite?.palette ?? def?.assembly?.palette ?? 'bone';
}

function formOf(id: string, lob: boolean): ShotForm {
  if (id === 'yog_sothoth' || id === 'colour_out_of_space') return 'orb';
  const palette = paletteOf(id);
  if (lob || palette === 'sea' || palette === 'ichor') return 'drop';
  let n = 0;
  for (let i = 0; i < id.length; i++) n = (n + id.charCodeAt(i) * (i + 1)) % BODIES.length;
  return BODIES[n]!;
}

function colorOf(id: string): Rgb {
  if (id === 'yog_sothoth') return ANOMALY.green;
  if (id === 'colour_out_of_space') return BOSS_ATTACK_THEME[id]!.danger;
  const theme = BOSS_ATTACK_THEME[id];
  if (theme) return theme.line;
  const ink = CREATURE_COLORS[paletteOf(id)];
  return mixRgb(ink.light, BASE.bone, 0.45);
}

/** The picture of a shot from roster id `id`. A lob, or a sea or ichor body, is a drop. */
export function shotLook(id: string | undefined, lob = false): ShotLook {
  if (!id) return { form: 'dart', color: BASE.bone };
  return { form: formOf(id, lob), color: colorOf(id) };
}
