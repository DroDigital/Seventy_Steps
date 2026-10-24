/**
 * Nyarlathotep's own arena (round 73): the Crawling Chaos was in the onyx castle of Kadath; the Outer Gods are in the Outer Dark now, and he is in the court at the centre of it, beside
 * the blind idiot's, where in the Dream-Quest he carries a dreamer. His house, its set, the way to it and the discovery that opens it, in the same forms as the other open horrors'
 * (data/arenaHouses.ts, arenaSets.ts, arenaWays.ts, discoveries.ts; registered in the `All` files). Data only.
 */

import { house, type House } from './arenaHouses';
import { at, lane, put, ring, type ArenaSet } from './arenaSets';
import { mark, piece, spot, type Way } from './arenaWays';
import { leaf, offer, read, vigil, type Discovery } from './discoveries';

export const OUTER_HOUSES: Readonly<Record<string, House>> = {
  nyarlathotep: house({
    name: 'THE HALL OF THE BLACK PHARAOH', line: 'The doors are open at the hour of your choosing. There is no charge. No one has asked for his money back.',
    wall: 'ashlar', height: 5, thick: 3, tint: [0.17, 0.16, 0.2], glow: 'purple',
    tower: { kind: 'spire', every: 8, height: 14, lit: true }, gate: { width: 10, height: 12, flank: 22, sealed: true }, place: true,
  }),
};

export const OUTER_SETS: Readonly<Record<string, ArenaSet>> = {
  // The hall of the Crawling Chaos: a floor of black basalt ringed with cold light, the apparatus of the show on its dais, a crowd of stone running one way.
  nyarlathotep: {
    candle: 'votive',
    ground: { texture: 'slab', tint: [0.15, 0.14, 0.2], gain: 1.2, reach: 14, bands: [{ r0: 0.3, r1: 0.36, k: 1.7, tint: [0.5, 0.42, 0.72] }, { r0: 0.7, r1: 0.76, k: 1.6 }], spokes: { n: 9, width: 2, k: 1.6, r0: 0.1, r1: 1, twist: 45 } },
    puts: [
      put('hexped', ring(1.08, 6, { jitter: 0 }), { glow: 'purple', size: 1.0 }),
      put('pylon', lane([1.2, 1.5], 2, 4.4), { size: 0.7, lit: 'torch' }),
      put('trilith', at(1.12, 180, { face: 'in' }), { size: 0.9 }), // (the walls, the columns, the running crowd and the dais are laid by its place, world/places/nyarlathotep.ts)
    ],
    air: { kind: 'mote', color: [0.7, 0.62, 0.95], rate: 22 },
  },
};

export const OUTER_WAYS: Readonly<Record<string, Way>> = {
  // The road to the hall: obelisks of black stone, braziers lit for a crowd that is not there, footprints that go one way.
  nyarlathotep: {
    marks: [
      mark(piece('prop:obelisk', { size: 0.9 }), 14, 150, 22, 6.5, { mirror: true, jitter: 2, face: 'in' }),
      mark(piece('prop:firepit', { size: 1.1 }), 12, 140, 30, 3.6, { mirror: true, jitter: 2, chance: 0.8 }),
      mark(piece('urn', { size: 1.1 }), 20, 130, 36, [8, 11], { mirror: true, jitter: 3, chance: 0.6 }),
    ],
    omens: [
      { at: 120, words: 'A CROWD HAS MARCHED THIS WAY. THE FOOTPRINTS GO ONE WAY', sound: 'whisper', pitch: 0.55 },
      { at: 84, words: 'THE DOORS ARE OPEN AT THE HOUR OF YOUR CHOOSING', sound: 'choral', pitch: 0.5 },
      { at: 48, words: 'SOMEONE HAS ALREADY SHAKEN YOUR HAND. IT WAS PRECISELY THE TEMPERATURE OF YOUR OWN', sound: 'wail', shake: 0.05, pitch: 0.45 },
    ],
  },
};

export const OUTER_DISCOVERIES: Readonly<Record<string, Discovery>> = {
  nyarlathotep: {
    title: 'The Handbill',
    start: 'A hall, open to all, with its doors at the hour of your choosing. A handbill is pasted to the jamb of a gate that is shut.',
    steps: [
      read('A Handbill', 'A handbill lies in the court before the gate. It says that the man will show what he has seen, and that there is no charge.'),
      vigil(spot(16, -5.4), piece('hexped', { glow: 'purple', size: 0.9 }), 30, { hour: ['deep'], mind: { from: 'lucid', to: 'uneasy' } }, 'THE CROWD GOES BY. YOU ARE ALSO A MEMBER OF THE AUDIENCE', 'Stand by the lit stone at the dead of the night, with a mind that is still your own. The hall opens to those who will watch, and are still able to look away.'),
      offer(spot(12, 5.2), piece('urn', { size: 1.3 }), { kind: 'dose' }, 'take the draught the programme recommends', 'THE PROGRAMME IS FOLLOWED. THE DOORS STAND OPEN', 'The programme recommends a dose of the Laudanum before the exhibition begins. It is not required. It is polite.'),
    ],
    leaves: [leaf('A Handbill', 9, 3.6)],
    shut: 'The gate is shut, and there is nothing on the other side of it that is not already looking at the gate.',
    opens: 'THE GATE STANDS OPEN. THE HALL IS FULL, AND HAS ALWAYS BEEN',
    done: 'The Crawling Chaos has been shown out of his own hall. The seats are warm, and empty, and the doors are open still.',
    reward: { echoes: 2200, insight: 1 },
  },
};
