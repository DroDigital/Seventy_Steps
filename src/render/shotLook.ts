/**
 * How a shot is drawn. The bolt still flies as the simulation launched it. What changed is the picture: one void-green fireball was
 * every caster's shot (round 51: five stock solids, picked from the caster's name); since round 69 each creature that shoots throws
 * a thing from its own tale (data/shotForms.ts, built in render/shotShapes*.ts), Yog-Sothoth its congeries of globes and the Colour
 * its globule, in the light of the horror's other blows (attackLook).
 */

import { SHOTS, type ShotForm } from '../data/shotForms';
import { lookOf, paletteOf } from './attackLook';
import { ANOMALY, type Rgb } from './palette';

export { SHOT_FORMS, type ShotForm } from '../data/shotForms';

export interface ShotLook {
  form: ShotForm;
  color: Rgb;
}

function formOf(id: string, lob: boolean): ShotForm {
  const choice = SHOTS[id];
  const own = choice && (lob ? choice.lob ?? choice.bolt : choice.bolt ?? choice.lob);
  if (own) return own;
  const palette = paletteOf(id);
  return lob || palette === 'sea' || palette === 'ichor' ? 'glob' : 'shard';
}

function colorOf(id: string): Rgb {
  if (id === 'yog_sothoth') return ANOMALY.green;
  if (id === 'colour_out_of_space') return lookOf(id).danger;
  return lookOf(id).line; // (lifted to a light's brightness)
}

/** The picture of a shot from roster id `id`. A creature with no shot of its own throws a glob if it spits, else a shard. */
export function shotLook(id: string | undefined, lob = false): ShotLook {
  if (!id) return { form: lob ? 'glob' : 'shard', color: lookOf(undefined).line };
  return { form: formOf(id, lob), color: colorOf(id) };
}
