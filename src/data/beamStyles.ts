/**
 * The character of each caster's beam (round 69: asked for attacks "visually distinct ... aligned with each boss's thematic identity
 * and lore"). Every beam was two ribbons with a hot core, one picture in many colours; now the pattern drawn in the ribbon is the
 * caster's own (render/beams.ts, shader): a braid of two strands, running beads, a crackle, a slow wave, bands of colour, a flame's
 * tongue, dashes of ice, a dark core with a bright rim. Data only: no Three.js.
 */

export const BEAM_PATTERNS = ['plain', 'braid', 'beads', 'arc', 'wave', 'prism', 'flame', 'frost', 'void'] as const;
export type BeamPattern = (typeof BEAM_PATTERNS)[number];

/** By roster id (a beam, a sweeping beam). A creature not named keeps the plain ribbon. */
export const BEAM_STYLES: Readonly<Record<string, BeamPattern>> = {
  colour_out_of_space: 'prism', // the colour that was not of this earth, in its bands
  algol_light_being: 'prism',
  nodens: 'prism',
  yog_sothoth: 'braid', // strands of the spheres' light, woven
  umr_at_tawil: 'braid',
  medusa_gorgon: 'braid', // her snakes, twined
  hastur: 'beads', // the Yellow Sign's marks pulsing out along it
  zann_window_thing: 'beads', // notes, one after another
  great_ones: 'beads',
  whisperer: 'wave', // a voice's ripple
  hypnos: 'wave', // sleep's slow drift
  ancient_ones: 'wave',
  joseph_curwen: 'flame', // the alchemist's fire
  charles_le_sorcier: 'flame',
  edward_hutchinson: 'frost', // dashes of ice
  zkauba: 'arc', // lightning off Yaddith
  yithian: 'arc',
  mi_go: 'arc',
  nyarlathotep: 'arc', // "electrical" wonders
  black_man: 'void', // darkness with a bright rim
  high_priest: 'void', // what the silk mask hides
};
