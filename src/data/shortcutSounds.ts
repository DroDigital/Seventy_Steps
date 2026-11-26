/**
 * How a shortcut's bar sounds (round 127: render/shortcutViews.ts plays it where the door stands, and then the door's own swing,
 * data/doorSounds.ts): a beam lifted out of its brackets and set down against the wall, a bolt drawn back grinding into its jamb, a lever
 * thrown and the works behind the wall taking up; and a door tried from the side it will not open from, rattling on its bar. Data only.
 */

import type { Bar } from './shortcutLooks';
import { noise, tone, type Layer } from './sounds';

export const BAR_SOUNDS: Readonly<Record<Bar, Layer[]>> = {
  beam: [
    noise('bandpass', 900, 0.32, 0.4, { to: 600, q: 2, attack: 0.05 }), // the timber dragged up out of its brackets
    tone('sawtooth', 160, 0.28, 0.05, { to: 120, attack: 0.04 }),
    noise('lowpass', 500, 0.16, 0.6, { at: 0.42 }), tone('sine', 70, 0.3, 0.45, { at: 0.42, to: 48, attack: 0.01 }), // set down against the wall
  ],
  bolt: [
    noise('bandpass', 2600, 0.34, 0.32, { to: 1800, q: 5, attack: 0.03 }), // iron grinding in iron
    tone('triangle', 640, 0.3, 0.05, { to: 520, attack: 0.05 }),
    noise('bandpass', 3200, 0.05, 0.5, { at: 0.38, q: 6 }), tone('triangle', 1250, 0.18, 0.12, { at: 0.38, to: 980 }), tone('sine', 90, 0.16, 0.3, { at: 0.38, to: 60 }), // home in the jamb
  ],
  lever: [
    noise('bandpass', 1500, 0.08, 0.45, { q: 4 }), tone('triangle', 700, 0.12, 0.1, { to: 420 }), // the lever's throw...
    noise('lowpass', 260, 0.9, 0.5, { at: 0.18, attack: 0.25, to: 120 }), tone('sine', 46, 1, 0.4, { at: 0.18, attack: 0.3, to: 38 }), // ...and the works behind the stone taking up
    ...[0.3, 0.45, 0.6].map((at) => noise('bandpass', 2000, 0.03, 0.18, { at, q: 6 })), // a ratchet's teeth
  ],
};

/** A barred door shaken from the wrong side: three knocks of the leaves against the bar, the last the hardest. */
export const RATTLE: Layer[] = [0, 0.11, 0.24].flatMap((at, k) => [
  noise('lowpass', 900, 0.08, 0.35 + 0.15 * k, { at }),
  tone('sine', 85 - 6 * k, 0.12, 0.25 + 0.1 * k, { at, to: 60, attack: 0.005 }),
  noise('bandpass', 2400, 0.03, 0.12, { at: at + 0.01, q: 5 }),
]);
