import { spot, type Hazard } from '../src/data/arenaWays';
import type { Game } from '../src/systems/components';
import { hazard, type WayRun } from '../src/systems/ways';
import { pointAt } from '../src/world/arenaWay';

/** The hazards the authored ways had until round 66 ("remove all traps from all paths that lead to bosses" took them from the data): kept here so that the machinery that plays them (src/systems/ways.ts) is still held to its rules. */
export const TRAPS: Readonly<Record<string, readonly Hazard[]>> = {
  colour_out_of_space: [
    { kind: 'blight', look: 'stain', at: [spot(74, 0), spot(64, 6), spot(54, -5), spot(44, 1), spot(32, 5), spot(20, -4)], r: 4.6, rate: 2.6 },
  ],
  black_man: [
    { kind: 'ward', look: 'flame', plates: [spot(60, -1.4), spot(55, 1.5), spot(50, 0), spot(45, -1.5), spot(40, 1.3), spot(35, -0.6), spot(30, 1.4)], damage: 24 },
  ],
  shub_niggurath: [
    { kind: 'vent', look: 'spore', at: [spot(72, 3.2), spot(60, -3.2), spot(48, 3), spot(36, -3.2), spot(24, 3.2)], every: [5, 9], burst: 3.2, damage: 22, warn: 70 },
  ],
  medusa_gorgon: [
    { kind: 'field', look: 'eye', from: 22, to: 50, rows: 5, cols: 3, key: 3, at: spot(58, -3.8), damage: 26 },
  ],
  martins_beach_horror: [
    { kind: 'tide', look: 'brine', from: 20, to: 62, width: 11, every: [12, 20], damage: 26 },
  ],
  simon_orne: [
    { kind: 'field', look: 'salt', from: 14, to: 40, rows: 5, cols: 3, key: 2, at: spot(46, -4), damage: 26 },
  ],
  edward_hutchinson: [
    { kind: 'vent', look: 'bolt', at: [spot(64, 3), spot(54, -3.4), spot(44, 3.4), spot(34, -3), spot(24, 3.2)], every: [4, 8], burst: 2.6, damage: 30, warn: 55 },
  ],
  colossus_pyramids: [
    { kind: 'tide', look: 'sand', from: 28, to: 80, width: 12, every: [14, 24], damage: 24 },
  ],
  yig: [
    { kind: 'ward', look: 'coil', plates: [spot(72, 1.5), spot(66, -1.2), spot(60, 0), spot(54, 1.5), spot(48, -1.4), spot(42, 0), spot(36, 1.2), spot(30, -1.5)], damage: 22 },
  ],
  nug: [
    { kind: 'vent', look: 'flame', at: [spot(80, -3.4), spot(70, 3.4), spot(60, 0), spot(50, -3.2), spot(40, 3.2), spot(30, 0)], every: [5, 9], burst: 3, damage: 28, warn: 66 },
  ],
  bokrug: [
    { kind: 'tide', look: 'brine', from: 22, to: 62, width: 9, every: [16, 26], damage: 24 },
  ],
  other_gods: [
    { kind: 'blight', look: 'frost', at: [spot(76, 0), spot(62, 5), spot(48, -5), spot(34, 0)], r: 5.2, rate: 2.8, of: 'stamina' },
    { kind: 'vent', look: 'bolt', at: [spot(68, 5), spot(54, -5), spot(40, 5)], every: [6, 11], burst: 3, damage: 30, warn: 66 },
  ],
  cthulhu: [
    { kind: 'tide', look: 'brine', from: 28, to: 84, width: 12, every: [12, 18], damage: 26 },
  ],
  hastur: [
    { kind: 'field', look: 'sign', from: 20, to: 44, rows: 5, cols: 3, key: 1, at: spot(50, 3.8), damage: 28 },
    { kind: 'blight', look: 'sign', at: [spot(78, -3), spot(66, 3.5), spot(30, -5)], r: 4.6, rate: 2.4 },
  ],
  yog_sothoth: [
    { kind: 'vent', look: 'star', at: [spot(92, 4.5), spot(80, -4.5), spot(68, 4.5), spot(56, -4.5), spot(44, 4.5), spot(32, -4.5)], every: [5, 9], burst: 3, damage: 28, warn: 60 },
  ],
  azathoth: [
    { kind: 'blight', look: 'void', at: [spot(84, 0), spot(70, 5), spot(56, -5), spot(42, 0), spot(28, 5)], r: 5.2, rate: 3.2 },
    { kind: 'vent', look: 'void', at: [spot(76, 3.8), spot(60, -3.8), spot(44, 3.8)], every: [5, 9], burst: 3, damage: 28, warn: 60 },
  ],
  zkauba: [
    { kind: 'field', look: 'glass', from: 24, to: 52, rows: 5, cols: 3, key: 0, at: spot(60, -3.8), damage: 26 },
  ],
  daemon_pipers: [
    { kind: 'vent', look: 'star', at: [spot(80, 3), spot(68, -3), spot(56, 3.2), spot(44, -3.2), spot(32, 3), spot(22, -3)], every: [4, 7], burst: 2.8, damage: 24, warn: 50 },
  ],
  ancient_ones: [
    { kind: 'field', look: 'star', from: 24, to: 50, rows: 5, cols: 3, key: 3, at: spot(56, -3.8), damage: 28 },
    { kind: 'blight', look: 'void', at: [spot(84, 4), spot(74, -4.5), spot(64, 4.5)], r: 4.4, rate: 2.4 },
  ],
};

/** The hazards `TRAPS` names for a run's boss, laid in its court as the world once laid them. */
export function layTraps(g: Game, run: WayRun): WayRun {
  const place = (s: { d: number; side: number }) => {
    const p = pointAt(run.plan, s.d, s.side);
    return { x: p.x, y: g.world.ground(p.x, p.z), z: p.z };
  };
  for (const h of TRAPS[run.plan.boss] ?? []) hazard(g, run, h, place);
  return run;
}
