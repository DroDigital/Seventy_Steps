/**
 * What each caster's shot is (round 69: asked, "many boss and creature attacks exhibit repetitive designs and basic geometry, such
 * as conical projectiles, but should feature visually distinct aesthetics that align with each boss's thematic identity and lore").
 * Every bolt, fan and barrage was one of five solids (an octahedron, a tetrahedron, a sphere, a cone) picked from the caster's name;
 * now each creature that shoots throws a thing from its own tale, built in render/shotShapes*.ts, and the colours, the trail and the
 * burst stay the horror's (attackLook, attackSignatures). Data only: no Three.js.
 */

export const SHOT_FORMS = [
  // the fallbacks: a creature with no shot of its own
  'shard', 'glob',
  // the sea
  'fish', 'conch', 'bubbles', 'tangle',
  // flesh, ichor, slime
  'spawn', 'ooze', 'eyeglob', 'grub', 'viper', 'fang', 'venom', 'hand', 'pod',
  // eyes and faces
  'eyeball', 'trilobe', 'mask', 'skull', 'lens',
  // the cast and the conjured
  'orb', 'globes', 'pentastar', 'helix', 'flare', 'crystal', 'crag',
  // things a sorcerer made or kept
  'page', 'dagger', 'quill', 'flask', 'urn', 'chainlink', 'cylinder', 'cog', 'coin', 'key', 'brand',
  // shapes of the night
  'crescent', 'note', 'panpipe', 'ankh', 'poppy', 'sign', 'tablet',
] as const;
export type ShotForm = (typeof SHOT_FORMS)[number];

export interface ShotChoice {
  bolt?: ShotForm; // a bolt, a fan or a barrage
  lob?: ShotForm; // spit, which falls in an arc and spreads where it lands
}

const one = (f: ShotForm): ShotChoice => ({ bolt: f, lob: f });

/**
 * By roster id, with the tale it comes from. The same three words are kept for a kin: the Archivist throws what the Yithians do.
 * A creature not named here throws a `shard`, or a `glob` if it spits (render/shotLook.ts).
 */
export const SHOTS: Readonly<Record<string, ShotChoice>> = {
  // the sea (Innsmouth, the Dream-Quest)
  dagon_priest: one('fish'), // the Order's sacred fish: a silver fish with a forked tail, thrown
  tritons: one('conch'), // Nodens' tritons blow conches; here the shell is flung
  gnorri: one('bubbles'), // brine and froth, three bubbles of it that cling
  mother_hydra: one('tangle'), // a knot of kelp and tendrils unravelling in flight
  // the slime and the flesh
  being_of_ib: one('spawn'), // the batrachian Ib-folk: a clot of spawn, each egg with its dark eye
  formless_spawn: one('ooze'), // Tsathoggua's spawn: a black blob that puts out and draws in its stubs
  tsathoggua: one('eyeglob'), // the toad-god: a fat black glob with two eyes on its brow
  dhole: one('grub'), // the bleached burrowing worm: a ringed grub, wriggling
  yig: one('viper'), // father of serpents: a diamond-backed snake, loosed head first
  serpent_man: { bolt: 'fang', lob: 'venom' }, // Valusia's serpent-men: a curved fang with its bead of venom, and the venom spat
  yeb: one('hand'), // the black hands that grope from Yeb
  mi_go: one('pod'), // the Fungi from Yuggoth: a puffball of pink spores
  // eyes, faces, skulls
  ephraim_waite: one('eyeball'), // the eyes that stared out of Asenath's face
  haunter_of_the_dark: one('trilobe'), // the three-lobed burning eye
  high_priest: one('mask'), // the yellow silk mask he is never without
  charles_le_sorcier: one('skull'), // the alchemist of the line of Mauvais: a skull aflame
  yekubian: one('lens'), // the crystal lens through which the Yekubians reach over the gulf
  // the cast and the conjured
  colour_out_of_space: one('orb'), // the globule that was not of this earth
  yog_sothoth: one('globes'), // "a congeries of iridescent globes"
  elder_thing: one('pentastar'), // the five-pointed head
  yithian: one('helix'), // the Great Race's tubular weapons: a coil of lightning
  yithian_archivist: one('helix'),
  algol_light_being: one('flare'), // the star Algol's light, in rays
  venusian_man_lizard: one('crystal'), // the crystal walls of Eryx
  great_ones: one('crag'), // gods of the earth throw its stone
  // what a sorcerer made or kept
  wilbur_whateley: one('page'), // a leaf torn from the Necronomicon
  keziah_mason: one('dagger'), // the crooked knife of the Walpurgis rite
  black_man: one('quill'), // the pen of the Black Man's book, dipped in red
  joseph_curwen: one('flask'), // an alembic of the Essential Saltes
  simon_orne: one('urn'), // the urn his dust was raised from
  edward_hutchinson: one('chainlink'), // linked iron, rimed
  whisperer: one('cylinder'), // Akeley's wax cylinder, the record that spoke in a voice that was not his
  dr_munoz: one('cog'), // the pump that kept him cold, its gear frosted
  terrible_old_man: one('coin'), // the old Spanish gold he sold for the things that he feared
  zkauba: one('key'), // the Silver Key, in the hand of Yaddith's wizard
  nasht_kaman_thah: one('brand'), // the torches of the Cavern of Flame
  // the night
  lilith: one('crescent'), // the Black Moon
  zann_window_thing: one('note'), // a note of the viol that held it back
  daemon_pipers: one('panpipe'), // the reeds the flute-players pipe on
  nyarlathotep: one('ankh'), // the Black Pharaoh's crux ansata
  hypnos: one('poppy'), // sleep's flower
  hastur: one('sign'), // the Yellow Sign, a triskele turning
  ancient_ones: one('tablet'), // a slab of the Ancients' cyclopean masonry, a seal burning on it
};
