/**
 * Round 78, the interface's mood: the numbers of the realm title cards' ink, the night's hour cards, the picture that follows the body
 * (render/tide.ts) and the quiet walk (ui/calm.ts). Presentation only: nothing here reaches the simulation. Times in seconds.
 */

/** The ink of a title (ui/inkTitle.ts): its letters rise out of the dark from the middle outward and sink away from the ends in. */
export const INK = {
  span: 1.1, // seconds from the first letter's start to the last's
  letter: 0.75, // seconds a letter takes to come clear
  out: 0.8, // seconds from the first letter to sink to the last
  outLetter: 0.55,
  jitter: 0.025, // seconds a letter's start may stray either way, so the line is not a metronome
  blur: 5, // px: a letter not yet inked is this soft
  sink: 4, // px: and this far below its place
  rule: { delay: 0.5, draw: 1.4, width: 420 }, // the hairline under a realm's name: when it begins, how long it takes to be drawn out from the middle, and its width (px at UI scale 1)
  epigraph: { delay: 1.6, rise: 1.0 }, // the epigraph follows the name a beat later
  tint: 0.45, // how far the card's bone turns toward the realm's first accent
  floor: 0.62, // and the least brightness of the result (0..1), so a dark accent never leaves a name hard to read
};

/** The cards of the banner (ui/banner.ts) a new one waits behind, by rank: a great card is never kept waiting, a quiet one never cuts another short. */
export const CARD = {
  realmHold: 4.8, // a realm's card is up this long (a place's is 2.6)
  stale: 90, // seconds a card kept waiting for another is still worth showing
};

/** The veil that knows where it is going (ui/veil.ts, ui/journeys.ts). */
export const VEIL = {
  epigraphMs: 3600, // ms under the veil, at least, when it says a realm's epigraph (once for each realm; any other journey is as quick as before)
  loreRise: 700, // ms the line beneath the name takes to come, after the last letter is inked
};

/** The night's turns announced (ui/hourCards.ts). */
export const HOUR = {
  hold: 3.4, // seconds a card is up
  settle: 3, // seconds after a new world is made before the first hour may be announced (a loaded save is not a turn)
};

/** The picture that follows the body (render/tide.ts). */
export const TIDE = {
  drain: 2.2, // seconds the colour takes to run out of the world after the investigator is struck down
  grey: 0.88, // the share of its colour the picture has lost by then (the post pass's uFaint.y)
  close: 0.5, // and how far the corners have closed in toward black (uFade; 1 is wholly black)
  breath: { vig: 0.55, bloom: 0.35, seconds: 1.8, decay: 0.7 }, // rising from the Elder Sign: the corners open by this share and the light swells by that, easing out over `decay`
};

/** The quiet walk (ui/calm.ts): the bars recede and the camera draws back when nothing threatens. */
export const QUIET = {
  hudAfter: 7, // seconds with no blow, wound, lock-on or hunt before the bars recede
  hudTo: 0.3, // the share of their strength they keep
  camAfter: 5, // seconds standing still (and not turning the view) after that before the camera draws back
  back: 1.1, // the boom grows by this share...
  lift: 0.04, // ...and the view rises by this many radians
  in: 2.5, // seconds to come on
  out: 0.4, // and to snap back
  sanity: 70, // a mind below this keeps its bar at full: it is what is failing
  still: 0.2, // m/s: slower than this the investigator is standing
  turn: 0.25, // rad/s of the view's turning that counts as the hand being on it
};
