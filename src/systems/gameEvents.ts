/** The events the systems send each other over the typed bus (spec §1), and the sanity bands. Pure. */

import type { Entity } from '../core/ecs';
import type { V3 } from '../core/geom';
import type { SampleSetId } from '../data/samples';
import type { LevelId } from '../data/tuning';

export type HitOutcome =
  | 'dodged'
  | 'parried'
  | 'blocked'
  | 'guardBreak'
  | 'hit'
  | 'stagger'
  | 'riposte'
  | 'interrupted'
  | 'kill';

/** Sanity bands (spec §3A), from the sanest. */
export const BANDS = ['lucid', 'uneasy', 'fractured', 'unmoored'] as const;
export type Band = (typeof BANDS)[number];

export interface GameEvents {
  Hit: { attacker: Entity; target: Entity; outcome: HitOutcome; damage: number; lingering?: boolean }; // lingering: a pool's or the void's tick
  Shot: { shooter: Entity; from: V3; to: V3; target: Entity | null };
  StrikeWarned: { at: V3; radius: number; frames: number }; // a ring of light marks ground where a bolt will fall (systems/skyStrikes.ts; round 52)
  StrikeLanded: { at: V3; radius: number }; // the bolt falls
  Swung: { entity: Entity; at: V3; yaw: number }; // a blow's hit window opens (combat.ts; round 51: its flash and its sound)
  BoltLoosed: { owner: Entity; at: V3; vel: V3; fire: boolean; conjured: boolean }; // a bolt leaves its caster (projectiles.ts; round 51: the muzzle's flash)
  BoltLanded: { owner: Entity; at: V3; vel: V3; on: 'body' | 'ground' | 'wall' | 'spent'; radius: number; lob: boolean; fire: boolean; conjured: boolean }; // a bolt's end: it struck, struck the world, or gave out
  Reloading: { entity: Entity }; // a reload begun: the cylinder swings out (gun.ts; round 22)
  Reloaded: { entity: Entity; loaded: number }; // the revolver's cylinder filled from the spare rounds
  DryFire: { entity: Entity }; // the trigger pulled on an empty cylinder with nothing to load it from
  Died: { entity: Entity; killer: Entity | null; at: V3 };
  Fell: { entity: Entity; at: V3; frames: number; sea?: boolean }; // the investigator goes over an edge: the fall begins, and ends in Died `frames` later (systems/falls.ts; round 54)
  Splash: { at: V3; speed: number; size: number }; // a body meets the sea: its speed (m/s) and the splash's size, 0..1 (systems/waterFall.ts; round 55)
  Seized: { entity: Entity; at: V3; root: V3 }; // the tentacle has hold of the investigator in the water (systems/waterFall.ts)
  Vanished: { entity: Entity; at: V3; struck: boolean }; // a hallucination gone: struck, or faded
  Respawned: { entity: Entity };
  RiseChoice: { candle: { x: number; z: number; yaw: number }; wall: string }; // a fall that a lit candle reaches, and a screen to ask where to rise (death.ts)
  CandleLit: { id: string; x: number; z: number }; // a candle before a horror's fog taken up (candles.ts)
  FogPassing: { wall: string; x: number; z: number; frames: number }; // frames: how long the walk through takes (the sound is made to its length) // the investigator sets out through a boss's fog (round 35)
  FogPassed: { wall: string; x: number; z: number };
  Echoes: { change: 'earned' | 'dropped' | 'recovered' | 'lost' | 'spent'; amount: number; total: number; on?: 'ware' | 'level' }; // `on`: what spent Echoes were spent on (the coins of a ware are heard; a level has its own sound)
  LevelUp: { attribute: LevelId; level: number; total: number }; // a level bought with Echoes: the attribute's level and the investigator's
  LockChanged: { target: Entity | null };
  SanityBandChanged: { from: Band; to: Band; sanity: number };
  SanityLost: { amount: number; sanity: number }; // a loss of at least SANITY.jolt at once (a blow, a sight, a burst), not a slow drain
  InsightChanged: { insight: number; change: number; cause: 'sight' | 'tome' | 'upgrade' | 'debug' | 'load' | 'quest'; source: string };
  FirstSight: { entity: Entity; name: string; sanity: number; insight: number }; // sanity lost, insight gained
  Discovered: { sign: string; name: string }; // an Elder Sign found
  PlaceFound: { id: string; name: string; region: string; found: number; of: number }; // a named place first stepped into, and how many of its region's are found (places.ts; round 18)
  Rested: { sign: string; name: string };
  RestRefused: { sign: string };
  Travelled: { via: 'sign' | 'gate' | 'dream'; to: string; name: string };
  RegionEntered: { region: string; name: string };
  Vanquished: { entity: Entity; name: string }; // a boss or optional boss, slain for good
  Wandered: { id: string; at: V3; sound?: SampleSetId; words?: string }; // a file of creatures has come out of the dark (wanderers.ts; round 26); `words` the first time one is seen
  Foreboding: { words: string; sound: SampleSetId; shake: number; pitch: number }; // something vast is heard, far off (hook.ts; round 26)
  Exhaled: { region: string; name: string }; // the last horror of a region has fallen, and it breathes out (omens.ts; round 26)
  BossEngaged: { entity: Entity; name: string };
  BossPhase: { entity: Entity; phase: number };
  Teleported: { entity: Entity; from: V3; to: V3 };
  Summoned: { entity: Entity; by: Entity };
  GazeBurst: { sanity: number; by: Entity };
  Darkened: { by: Entity };
  TimeSkipped: { entity: Entity };
  BodyStolen: { frames: number };
  Rewired: { entity: Entity };
  Revealed: { entity: Entity; doses: number };
  LampChanged: { lamp: Entity; lit: boolean };
  Petrified: { by: Entity };
  Named: { name: string; count: number }; // Hastur's name, flickering onto the HUD
  Rammed: { entity: Entity };
  Title: { text: string }; // a set piece's words across the screen
  Notice: { text: string }; // a short line mid-screen
  Overheard: { name: string; text: string }; // someone near says a line to themselves (overheard.ts; round 34)
  Ending: { id: string }; // one of the three endings (endings.ts)
  DemoEnded: Record<string, never>; // the demo's last horror has fallen: its end is said, once a save (systems/demo.ts; round 56)
  Healed: { entity: Entity; amount: number }; // a shot of West's Reagent
  Erupted: { at: V3; radius: number; by: Entity }; // a marked spot bursts
  Quaked: { at: V3; by: Entity }; // a ring goes racing out
  Marked: { at: V3; by: Entity }; // ground marked to erupt (at the first spot)
  Swept: { by: Entity }; // a sweeping beam begins its sweep
  Explored: { region: string }; // more of a region seen (exploration.ts)
  Talked: { npc: string; name: string; title: string; lines: readonly string[]; rumor?: { boss: string; text: string }; shop?: string }; // recorded dialogue; an optional written rumour and a merchant's wares follow
  RumorRead: { npc: string; boss: string }; // a written rumour was shown after a completed conversation (omens.ts)
  Speaking: { speaker: string; text: string; rate: number; seconds: number; curve: Float32Array }; // a recording has begun to sound: how long it is (as played) and where in it the voice sounds (core/pace.ts), so a caption can be said as it is spoken (ui/dialogue.ts)
  Said: { speaker: string; text: string }; // a line said aloud, by `npc:<id>` (ui/dialogue.ts) or `boss:<id>` (a horror's scene: render/cinema.ts, cinemaDirector.ts): its recording plays (render/audio/speech.ts; the voices)
  Silenced: Record<string, never>; // a talk ended, or a scene was skipped: whoever was speaking is cut off
  Trade: { shop: string; name: string }; // a merchant's wares are shown (ui/shopMenu.ts; round 12)
  QuestChanged: { id: string; title: string; stage: number; done: boolean }; // a quest begun, moved on or done (quests.ts)
  Read: { name: string }; // a tome or a note picked up (documents.ts has its text)
}
