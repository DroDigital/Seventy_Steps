/**
 * The controller's rumble (2026-11-03): what each moment of the game is felt as in the hands. A pulse
 * is the heavy motor's share (`strong`, the low thud) and the light one's (`weak`, the buzz), each 0..1,
 * held for `ms` and fading as it goes (`fade`, the share of it that fades). Read by render/rumbleFx.ts,
 * scaled by Settings › Accessibility › Vibration; felt only while a pad is the device in hand.
 */

export interface PulseSpec {
  strong: number;
  weak: number;
  ms: number;
  fade?: number; // 0: held flat; 1 (the default): from full to nothing over its length
}

export const RUMBLE = {
  /** A blow of the investigator's landing, scaled between these by its weight (render/audio/impact.ts): a graze, and a killing blow. */
  land: [{ strong: 0.08, weak: 0.32, ms: 70 }, { strong: 0.55, weak: 0.6, ms: 200 }] as const,
  guarded: { strong: 0.05, weak: 0.22, ms: 55 } as PulseSpec, // a blow of theirs turned by a foe's guard
  parry: { strong: 0.25, weak: 0.85, ms: 90 } as PulseSpec, // a blow of a foe's turned aside by the investigator's parry: a crisp ring
  block: { strong: 0.3, weak: 0.25, ms: 110 } as PulseSpec, // taken on their own guard
  guardBreak: { strong: 0.75, weak: 0.4, ms: 260 } as PulseSpec,
  dodged: { strong: 0, weak: 0.12, ms: 40 } as PulseSpec, // a blow rolled through: the faintest brush
  /** A wound taken, between a graze and a third of full health or more. */
  hurt: [{ strong: 0.3, weak: 0.25, ms: 140 }, { strong: 0.9, weak: 0.55, ms: 340 }] as const,
  lingering: { strong: 0.08, weak: 0.1, ms: 60 } as PulseSpec, // a pool's or the void's tick
  shot: { strong: 0.6, weak: 0.35, ms: 95 } as PulseSpec, // the revolver's kick
  dryFire: { strong: 0, weak: 0.25, ms: 30 } as PulseSpec, // the hammer on an empty chamber
  reloaded: { strong: 0.05, weak: 0.2, ms: 60 } as PulseSpec, // the cylinder snapped home
  died: { strong: 1, weak: 0.5, ms: 700 } as PulseSpec,
  healed: { strong: 0.12, weak: 0.08, ms: 260, fade: 0.4 } as PulseSpec, // the Reagent going in
  levelUp: { strong: 0.15, weak: 0.3, ms: 160 } as PulseSpec,
  engaged: { strong: 0.55, weak: 0.25, ms: 650, fade: 0.8 } as PulseSpec, // a horror roused: its roar
  phase: { strong: 0.6, weak: 0.3, ms: 550, fade: 0.8 } as PulseSpec, // a horror's next phase
  vanquished: { strong: 0.8, weak: 0.45, ms: 1300, fade: 1 } as PulseSpec, // a horror's long fall
  gate: { strong: 0.45, weak: 0.15, ms: 900, fade: 0.6 } as PulseSpec, // a house's gate grinding open
  /** The ground struck near: a quake, a burst, a bolt from the sky, a plate of a way; full within `near` metres, nothing past `far`. */
  ground: { strong: 0.65, weak: 0.3, ms: 300 } as PulseSpec,
  near: 4,
  far: 28,
  /** The heart near death (render/feel.ts): a thud each stroke, its second softer, harder the nearer death. */
  heart: { strong: [0.12, 0.38] as const, weak: 0.04, ms: 75 },
  /** An omen's shake (WayOmen, Foreboding: 0.04..0.08) to the strong motor, for this long. */
  omen: { per: 7, ms: 900 },
  /** How often a held rumble is sent again (each send lasts `hold`, so one the game stops sending dies by itself), and the least change worth a send. */
  every: 50,
  hold: 120,
  step: 0.04,
} as const;
