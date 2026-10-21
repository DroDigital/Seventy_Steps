/**
 * Each creature's attack signature (round 60: asked, "make it very distinct from each other, and also with more
 * fidelity"). A blow's element (render/aoeLook.ts: what it is made of) was shared by up to six horrors, and every
 * common foe of one hide threw the same matter in the same colours; now every one has a layer of its own drawn over
 * the element in every flash, burst, landing, trail, gathering and column (render/fxForms.ts): what it is (`form`),
 * how it moves (`motion`) and the light it is drawn in (`accent`). No two creatures of one element share all three,
 * and no two horrors of one element share a form (tests/attackSignatures.test.ts). Data only: no Three.js.
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

/** The common foes and the allies (by the element their hide makes them: attackLook.ts `MADE_OF`). */
const FOES: Readonly<Record<string, Signature>> = {
  // tide (sea)
  deep_one: sig('bubbles', 'scatter', 0x7fd8c8), innsmouth_hybrid: sig('fangs', 'spiral', 0x9ac8b0), dagon_priest: sig('runes', 'orbit', 0x80d0e8), gnorri: sig('crystals', 'fountain', 0x90e0d0), elder_thing: sig('motes', 'spiral', 0xa0f0e0), star_spawn: sig('tendrils', 'fountain', 0x60e0b0), tritons: sig('notes', 'rain', 0xb0e8ff),
  // ash (charcoal, bone)
  cthulhu_cultist: sig('cinders', 'spiral', 0xff9c50), cat_from_saturn: sig('prism', 'scatter', 0xd0a0ff), martense_degenerate: sig('fangs', 'scatter', 0xd8c8a0), rat_swarm: sig('swarm', 'scatter', 0xc0a890), gnoph_keh: sig('crystals', 'rain', 0xd8f0ff), gug: sig('hands', 'fountain', 0xd8b090), voice_in_the_tomb: sig('notes', 'implode', 0xc8c0e0),
  yithian: sig('arcs', 'orbit', 0xc0f0ff), nodens: sig('motes', 'rain', 0xe8f0ff), nasht_kaman_thah: sig('runes', 'implode', 0xffe8b0), algol_light_being: sig('prism', 'fountain', 0xfff8d0), yithian_archivist: sig('arcs', 'spiral', 0xd0f0ff), flying_polyp: sig('void', 'rain', 0xb8a0e0),
  // spore (mold, fungus)
  ghoul: sig('fangs', 'spiral', 0xb8d098), serpent_man: sig('eyes', 'spiral', 0xc8e070), being_of_ib: sig('bubbles', 'rain', 0x98e8a8), venusian_man_lizard: sig('arcs', 'scatter', 0xa8ff90), pickman: sig('hands', 'orbit', 0xc8d8a8), mi_go: sig('arcs', 'implode', 0xe0a0ff),
  // frost (pallid)
  ghast: sig('fangs', 'fountain', 0xe8e0c8), moon_beast: sig('tendrils', 'implode', 0xe0d8f0), ym_bhi: sig('crystals', 'scatter', 0xe0f0e8), gyaa_yothn: sig('sand', 'fountain', 0xf0e0c0), exham_troglodyte: sig('swarm', 'implode', 0xe8e4d0), moon_bog_wraith: sig('hands', 'spiral', 0xc8e8ff),
  beast_in_the_cave: sig('eyes', 'rain', 0xf0f0e0), albino_penguin: sig('feathers', 'scatter', 0xf0f8ff), dhole: sig('bubbles', 'fountain', 0xe8e8d0), yekubian: sig('prism', 'orbit', 0xd0f0ff), being_from_beyond: sig('void', 'orbit', 0xe0d0ff),
  // crack (rust, sand, stone)
  zoog: sig('swarm', 'spiral', 0xffb080), man_of_leng: sig('fangs', 'rain', 0xe0a070), wamp: sig('tendrils', 'rain', 0xd89878), kn_yan_dweller: sig('runes', 'fountain', 0xf0d890), nameless_city_reptile: sig('fangs', 'implode', 0xe0c878), hybrid_mummy: sig('sand', 'spiral', 0xf0d8a0),
  child_of_yig: sig('swarm', 'fountain', 0xd8e088), cats_of_ulthar: sig('motes', 'spiral', 0xffe0a0), shantak: sig('feathers', 'spiral', 0xd8d0c0),
  // root (flesh)
  reanimated_corpse: sig('arcs', 'fountain', 0x98ffd0), curwen_pit_thing: sig('tendrils', 'spiral', 0xd09878),
  // stain (rubber, ichor)
  night_gaunt: sig('void', 'spiral', 0x9890c0), winged_hybrid: sig('feathers', 'rain', 0xa0a8c8), thousand_young: sig('hands', 'implode', 0xb0c070), shoggoth: sig('bubbles', 'spiral', 0x9ae890), formless_spawn: sig('tendrils', 'implode', 0x8878a8),
};

export const SIGNATURES: Readonly<Record<string, Signature>> = { ...HORRORS, ...FOES };

/** Whether roster id `id` is one of the horrors (a boss): its signature is checked against the other horrors of its element. */
export const isHorrorSignature = (id: string): boolean => id in HORRORS;
