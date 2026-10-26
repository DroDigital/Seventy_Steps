/**
 * What an ordinary creature's blow looks like (round 87; asked: "many of the lower-tier creatures' attack animations and telegraphs appear
 * acceptable but overly elaborate; in high-density combat scenarios, this detracts from the intended eerie atmosphere ... each creature should
 * instead feature a distinct, high-fidelity, subtle animation with optional graphic accents ... reevaluate overused color palettes and consider
 * blending or animating varied hues"). The horrors keep their own look (`bossAttackTheme`, `attackSignatures`); every other creature
 * (lesser, greater, ally and the plain named) has one entry here and nothing else: a graphic `mark` it leaves where its blow falls, the `tempo` that
 * mark moves in, the few specks of `matter` it sheds, an optional second `accent` (drawn at the wound and in the tell) and three `hues` the mark
 * drifts through as it fades. Drawn by `render/foeFx.ts` with the vocabulary of `render/blowKit.ts`. Data only: no Three.js.
 */

/** The graphic a blow leaves. Drawn in particles (render/blowKit.ts); a ripple is the one that lies on the ground. */
export const MARKS = [
  'rake', // three curved scratches, drawn in one after another along the swing (claws)
  'jaws', // two crescents closing on a point (teeth)
  'crescent', // one tapering arc that follows the tip of a sweep (a blade, an edge, a limb)
  'lash', // a tapering S-curve that cracks out and back (a tentacle, a tail, a whip)
  'splat', // an ink blot with flicks that opens and sinks (ichor, ooze, spawn)
  'swirl', // an open ring that turns about the point as it fades (a spell, a mind, a pull)
  'glint', // a thin cross of cold light that opens and closes (steel, glass, crystal)
  'dash', // short ticks stitched along the blow (a stinger, a needle, a thread)
  'ripple', // a thin ring running out along the ground (water, a slam's tremor)
  'sigil', // a small rune that kindles and goes out (a rite, a cult's sign)
  'eye', // an eye that opens where the blow falls and closes (a watcher, a gaze)
  'plume', // a rising wisp of smoke (ash, spores, a breath, an exhalation)
] as const;
export type Mark = (typeof MARKS)[number];

/** How a mark moves: the rhythm of its life. */
export const TEMPOS = [
  'snap', // there at once, sharp and gone in a few frames
  'drag', // laid along the swing as it goes, each stroke a frame behind the last
  'bloom', // soft, it swells as it fades
  'settle', // it hangs and sinks, the ground taking what it carries
  'flutter', // it turns and drifts like something winged
  'pulse', // twice, a beat apart
] as const;
export type Tempo = (typeof TEMPOS)[number];

/** The few specks a blow sheds besides its mark. */
export const MATTERS = [
  'none', // the mark alone
  'brine', // drops of sea-water, falling
  'ash', // grey flecks, drifting down
  'dust', // fine sand and grit, falling
  'spore', // pale motes, rising
  'frost', // glints of ice, hanging
  'ichor', // dark beads, falling
  'ember', // sparks, rising and cooling
  'mote', // soft lights, hanging
  'down', // feathers or fur, drifting
] as const;
export type Matter = (typeof MATTERS)[number];

export interface FoeBlow {
  mark: Mark;
  tempo: Tempo;
  matter: Matter;
  accent?: Mark; // a second graphic, smaller, at the wound and in the tell
  /** 0xrrggbb: where a mark starts (bright: at least `LIGHT_FLOOR` of luma), what it passes through and where it ends (cooler, darker). */
  hues: readonly [number, number, number];
}

const blow = (mark: Mark, tempo: Tempo, matter: Matter, hues: FoeBlow['hues'], accent?: Mark): FoeBlow => ({ mark, tempo, matter, hues, ...(accent && { accent }) });

/** By roster id, for every creature that is not one of the horrors (`isHorrorSignature`) with a look of its own. */
export const FOE_BLOWS: Readonly<Record<string, FoeBlow>> = {
  deep_one: blow('crescent', 'drag', 'brine', [0xc8f4ec, 0x4fb4c8, 0x1c4a86], 'ripple'),
  ghoul: blow('rake', 'drag', 'spore', [0xe4e8c8, 0x9cb060, 0x4a5a2c], 'jaws'),
  dagon_priest: blow('sigil', 'pulse', 'mote', [0xcff0ff, 0x6a8cf0, 0x2c2c86], 'swirl'),
};

/** The blow of roster id `id`, or undefined for a horror and anything not drawn this way. */
export const blowOf = (id: string | undefined): FoeBlow | undefined => (id ? FOE_BLOWS[id] : undefined);
