/**
 * Each creature's attack signature (round 60: asked, "make it very distinct from each other, and also with more
 * fidelity"). A blow's element (render/aoeLook.ts: what it is made of) was shared by up to six horrors, and every
 * common foe of one hide threw the same matter in the same colours; now every one has a layer of its own drawn over
 * the element in every flash, burst, landing, trail, gathering and column (render/fxForms.ts): what it is (`form`),
 * how it moves (`motion`) and the light it is drawn in (`accent`). No two creatures of one element share all three,
 * and no two horrors of one element share a form (tests/attackSignatures.test.ts). Data only: no Three.js.
 *
 * Since round 89 (asked: the lower tiers' blows were acceptable but overly elaborate, and their colours clustered) this table is the
 * horrors' alone, and shoggoth's and the flying polyp's: every other creature's blow, lesser, greater, ally and plain named, is
 * `data/foeBlows.ts`, one quiet graphic mark and its three hues. A creature has a signature or a blow here, never both.
 */

export const FORMS = ['tendrils', 'bubbles', 'runes', 'eyes', 'arcs', 'fangs', 'feathers', 'swarm', 'crystals', 'petals', 'void', 'prism', 'sand', 'chains', 'hands', 'notes', 'cinders', 'motes'] as const;
export type Form = (typeof FORMS)[number];

export const MOTIONS = ['fountain', 'spiral', 'implode', 'rain', 'orbit', 'scatter'] as const;
export type Motion = (typeof MOTIONS)[number];

export interface Signature {
  form: Form;
  motion: Motion;
  accent: number; // 0xrrggbb: the light the form is drawn in (a common foe's whole palette is drawn from it: render/attackLook.ts)
}

const sig = (form: Form, motion: Motion, accent: number): Signature => ({ form, motion, accent });

/** The horrors (by element, as aoeLook.ts assigns it). */
const HORRORS: Readonly<Record<string, Signature>> = {
  // tide
  cthulhu: sig('tendrils', 'spiral', 0x6ff0c8), father_dagon: sig('bubbles', 'fountain', 0x8fd0ff), bokrug: sig('fangs', 'scatter', 0xc8e070), martins_beach_horror: sig('eyes', 'implode', 0xd8ecff),
  // root
  mother_hydra: sig('tendrils', 'fountain', 0x70e0a0), shub_niggurath: sig('hands', 'fountain', 0xb8d860), wilbur_whateley: sig('feathers', 'rain', 0xe0c890), shunned_house_entity: sig('swarm', 'implode', 0xc8f080),
  // glyph
  hastur: sig('runes', 'orbit', 0xffe060), black_man: sig('void', 'implode', 0xff3060), simon_orne: sig('sand', 'rain', 0xbff0e0), high_priest: sig('cinders', 'spiral', 0xffd070), umr_at_tawil: sig('prism', 'orbit', 0xa0d0ff), zkauba: sig('arcs', 'scatter', 0xc0e8ff),
  // stain
  tsathoggua: sig('bubbles', 'implode', 0xd09060), yeb: sig('hands', 'spiral', 0x90a0e0), ephraim_waite: sig('eyes', 'orbit', 0xe090b0), the_hound: sig('fangs', 'scatter', 0xff8040), lilith: sig('petals', 'spiral', 0xff6090),
  // eye
  ghatanothoa: sig('crystals', 'implode', 0xe8dcb0), haunter_of_the_dark: sig('void', 'orbit', 0x8c8cff), zann_window_thing: sig('notes', 'spiral', 0xb4a4ff), hypnos: sig('petals', 'rain', 0x88a8ff), other_gods: sig('eyes', 'scatter', 0xe868e8), nyarlathotep: sig('sand', 'spiral', 0xffc060),
  // coil
  yig: sig('fangs', 'spiral', 0xd8e060), medusa_gorgon: sig('crystals', 'fountain', 0xb8e898), daemon_pipers: sig('notes', 'orbit', 0xff88c8),
  // spore
  nug: sig('swarm', 'fountain', 0xff8898), colour_out_of_space: sig('prism', 'implode', 0xff48c8), rhan_tegoth: sig('chains', 'spiral', 0xe8b088),
  // ash
  whisperer: sig('hands', 'rain', 0xc8c8b8), the_unnamable: sig('void', 'scatter', 0xd8b8a8), the_outsider: sig('crystals', 'scatter', 0xece4d4),
  // star
  yog_sothoth: sig('motes', 'orbit', 0x60ffb0), azathoth: sig('arcs', 'implode', 0xff60a8), ancient_ones: sig('chains', 'rain', 0xa8c0ff), great_ones: sig('runes', 'fountain', 0xfff0a8),
  // flame
  keziah_mason: sig('runes', 'spiral', 0xff9838), joseph_curwen: sig('cinders', 'fountain', 0xffa858), charles_le_sorcier: sig('arcs', 'implode', 0xff5828), brown_jenkin: sig('fangs', 'scatter', 0xffd4a8),
  // frost
  edward_hutchinson: sig('chains', 'spiral', 0xd4f4ff), dr_munoz: sig('crystals', 'rain', 0xc4f0ff), terrible_old_man: sig('bubbles', 'orbit', 0xffe4a8),
  // crack
  dunwich_horror: sig('tendrils', 'scatter', 0xa8c878), colossus_pyramids: sig('sand', 'fountain', 0xffdc98),
};

/** The two themed greater creatures (shoggoth and flying polyp: they have colours of their own in `bossAttackTheme` but no horror's entry above). Every other creature's blow is `data/foeBlows.ts`. */
const THEMED_GREATER: Readonly<Record<string, Signature>> = {
  shoggoth: sig('bubbles', 'spiral', 0x9ae890), flying_polyp: sig('void', 'rain', 0xb8a0e0),
};

export const SIGNATURES: Readonly<Record<string, Signature>> = { ...HORRORS, ...THEMED_GREATER };

/** Whether roster id `id` is one of the horrors (a boss): its signature is checked against the other horrors of its element. */
export const isHorrorSignature = (id: string): boolean => id in HORRORS;
