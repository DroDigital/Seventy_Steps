/**
 * The own blows of the middle band's sea gods, dreamers and greater horrors (2026-11-24; data/bossMoveKit.ts): Father Dagon's monolith
 * weight and his tide, Mother Hydra's heads and the depths of Y'ha-nthlei (the two fight as one, and share no blow), Hypnos's crown of
 * stars and the hours, the Colossus's paw and its sands, the High Priest's flute, silk and lamp, the Elder Shoggoth's pseudopods and its
 * train down the tunnel, and the Polyp Swarm's wind.
 */

import { link, own, type OwnTable } from './bossMoveKit';

export const DREAM_MOVES = {
  father_dagon: {
    dagon_monolith: own('slam', { windup: 36, radius: 1 }, 'He brings his whole weight down. The blow lands late: roll aside as it falls.'),
    dagon_arms: own('sweep', { windup: 26, arc: [110, -110], reach: 1.5 }, 'He flings both scaled arms wide about him. Roll in toward him, through them.'),
    dagon_wake: own('wind_push', { windup: 32, arc: [40, -40], reach: 3, push: 4 }, 'The water he wades through is thrown at you. Guard it, and come back in.'),
    dagon_tide: own('tidal_surge', { windup: 56, wave: { speed: 6.5, width: 2.4, lane: { half: 7.5, push: 3.5 } } }, 'A tide comes down the lane he draws. Roll into it as it reaches you, or leave the lane.'),
    dagon_bellow: own('roar', { windup: 34, active: 16, range: [0, 14] }, 'His bellow from the deep takes the mind. Steady yourself.'),
    dagon_wade: own('charge', { windup: 40, lunge: 6, radius: 1.2 }, 'He wades at you, slow to start and hard to stop. Step aside at the last.'),
    dagon_breach: own('aoe_ring', { windup: 48, radius: 3.4 }, 'He heaves up out of the water in a ring of spray. Be beyond it, or roll as it breaks.'),
  },
  mother_hydra: {
    hydra_clasp: own('grab', { windup: 34, reach: 1.5, radius: 0.7 }, 'Her clasp is wide and slow. Roll away from it early.'),
    hydra_brine: own('pool', { windup: 32, pool: { radius: 1.6, life: 360 } }, 'Brine spreads under you and stings. Leave it.'),
    hydra_heads: own('tentacle_burst', { recovery: 10, arc: [100, -100], power: 0.6, follow: 'hydra_heads_2' }, 'Her heads sweep one way, then back. Roll through the first sweep, and again.'),
    hydra_heads_2: link('tentacle_burst', { windup: 16, arc: [-100, 100], power: 0.6 }),
    hydra_spawn: own('tentacle_rise', { marks: { seek: { speed: 4, lock: 28 } } }, 'Three of her spawn creep after your feet, then stop. Roll the moment they stop.'),
    hydra_spit: own('spit', { windup: 36, bolts: { count: 2, spread: 24 } }, 'She spits two at once, high. Move once they are in the air, and keep off the pools.'),
    hydra_depths: own('vortex', { windup: 28, pull: { speed: 3, range: 11 }, follow: 'hydra_depths_burst' }, "The depths of Y'ha-nthlei draw you in. Run from the pull, and roll as it breaks."),
    hydra_depths_burst: link('vortex_burst', { windup: 16, radius: 3.8 }),
  },
  hypnos: {
    hypnos_eyes: own('gaze', { windup: 28, active: 22 }, 'The eyes of the sleeper hold yours. Break their sight.'),
    hypnos_drift: own('teleport', { windup: 26, follow: 'hypnos_poppy' }, 'He drifts to your side and the air blooms with sleep. Roll out as it blooms.'),
    hypnos_poppy: link('aoe_ring', { windup: 18, radius: 2.4, power: 0.8 }),
    hypnos_slumber: own('dream_cloud', { cloud: { radius: 2.6, life: 300, drift: 1.2 } }, 'Two small sleeps drift after you, quick, and pass. Step out of them and steady yourself.'),
    hypnos_crown: own('starfall', { marks: { pattern: 'ring', count: 6, ring: [3, 3.4], delay: 52, stagger: 4 } }, 'Corona Borealis: a crown of stars falls about you, one under your feet. Step out of the ring, not across it.'),
    hypnos_hours: own('quartering', { marks: { spokes: 12, stagger: 60 } }, 'The floor breaks in hours, every other one and then the rest. Step onto the burnt hours.'),
    hypnos_ray: own('beam', { windup: 44, recovery: 12, follow: 'hypnos_ray_2' }, 'A ray from the dream, and another a breath after. Move, and move again.'),
    hypnos_ray_2: link('beam', { windup: 32, shot: 26, power: 0.7 }),
    hypnos_circle: own('sweep_beam', { windup: 46, active: 56, sweep: { arc: [130, -130], length: 12 } }, 'The beam turns most of the way round. Roll through it as it reaches you.'),
    hypnos_abyss: own('vortex', { windup: 22, pull: { speed: 3.2, range: 12 }, follow: 'hypnos_abyss_burst' }, 'The abyss of sleep draws you down. Run from it, and roll as it breaks.'),
    hypnos_abyss_burst: link('vortex_burst', { windup: 14 }),
  },
  colossus_pyramids: {
    colossus_paw: own('slam', { windup: 40, radius: 1.2 }, 'The great paw comes down where you stand. Roll aside as it falls.'),
    colossus_grasp: own('grab', { windup: 36, reach: 1.6 }, 'It reaches out to take you up. Roll away; nothing holds it back.'),
    colossus_lumber: own('charge', { windup: 44, active: 22, lunge: 5 }, 'It lumbers forward a short way, slowly. Step aside as it comes.'),
    colossus_sands: own('quake', { windup: 36, wave: { speed: 5.5, width: 1.8, reach: 12 } }, 'The sand heaves out from it, slow and broad. Roll through it as it reaches you.'),
    colossus_hammer: own('delayed_slam', { windup: 66, radius: 1.1 }, 'It holds the blow a very long time. Do not roll early: roll as it falls.'),
    colossus_jaws: own('bite', { windup: 26, reach: 1.6, lunge: 1.2 }, 'Its jaws close from above and ahead. Step back out of them.'),
    colossus_heave: own('aoe_ring', { windup: 46, radius: 3.8 }, 'It heaves the ground up all about it. Be beyond the ring, or roll as it breaks.'),
    colossus_dunes: own('eruption', { windup: 30, marks: { pattern: 'spokes', spokes: 5, count: 10, ring: [2.5, 9] } }, 'Sand bursts in five lines out from it. Stand in the dark between them.'),
    colossus_columns: own('cave_in', { marks: { count: 2, delay: 60 } }, 'The pillars of the temple shed their stones about their feet. Step out into the open.'),
  },
  high_priest: {
    priest_flute: own('projectile', { recovery: 12, power: 1, bolts: { radius: 0.34 }, follow: 'priest_flute_2' }, 'A note from the flute, then two more. Step off the first line, and wide of the next.'),
    priest_flute_2: link('projectile_fan', { windup: 18, power: 0.8, bolts: { count: 2, spread: 30, speed: 12 } }),
    priest_veil: own('teleport', { windup: 30, follow: 'priest_silk' }, 'He is beside you in a swirl of yellow silk, and it bursts. Roll out as he appears.'),
    priest_silk: link('aoe_ring', { windup: 16, radius: 2.2, power: 1 }),
    priest_mask: own('gaze', { windup: 32, active: 22, sanity: 0.7 }, 'What is under the mask looks out at you. Break its sight.'),
    priest_monastery: own('cave_in', { power: 1.25, marks: { count: 3, ring: [0, 9], radius: 1.4, delay: 44 } }, "The monastery's stones fall about the pillars nearest you. Step into the open."),
    priest_fan: own('projectile_fan', { windup: 48, power: 0.8, bolts: { count: 5, spread: 76, speed: 11 } }, 'Five bolts, wide apart. Stand in a gap and let them pass.'),
    priest_incense: own('dream_cloud', { cloud: { radius: 2.8, drift: 1.3 } }, 'The incense drifts after you, faster than it looks. Keep out of it.'),
    priest_lamp: own('beam', { windup: 50, recovery: 14, follow: 'priest_lamp_2' }, "The lamp's ray strikes, then strikes again where you went. Move twice."),
    priest_lamp_2: link('beam', { windup: 36, shot: 22, power: 1.1 }),
    priest_sweep: own('sweep_beam', { sweep: { arc: [-60, 100], length: 16 } }, 'The beam sweeps from his left, far round. Roll through it toward where it began.'),
    priest_void: own('vortex', { windup: 26, pull: { speed: 4, range: 10 }, follow: 'priest_void_burst' }, 'The void behind the mask draws you in. Run, then roll as it breaks.'),
    priest_void_burst: link('vortex_burst', { windup: 10, radius: 3.2 }),
  },
  shoggoth: {
    shoggoth_pseudopods: own('tentacle_burst', { windup: 26, arc: [100, -100], reach: 2.4 }, 'Pseudopods shoot out of it all round. Be beyond them, or roll through.'),
    shoggoth_engulf: own('grab', { windup: 32, reach: 1.4, radius: 0.9 }, 'It engulfs what it reaches. Roll away; there is nothing to guard against.'),
    shoggoth_crush: own('slam', { windup: 36, reach: 1.6, radius: 1.2 }, 'It rears and falls on you. Roll aside as it falls.'),
    shoggoth_eyes: own('aoe_ring', { windup: 30, radius: 3.4 }, 'Eyes and mouths bubble out of it all round. Be beyond them, or roll as they burst.'),
    shoggoth_maw: own('vortex', { windup: 30, active: 46, pull: { speed: 3, range: 10 }, follow: 'shoggoth_maw_burst' }, 'It draws you toward a mouth it has made. Run, then roll as it closes.'),
    shoggoth_maw_burst: link('vortex_burst', { windup: 12, radius: 3.8 }),
    shoggoth_train: own('charge', { windup: 40, active: 24, lunge: 12, radius: 1.2 }, 'It comes down the tunnel like a train, filling it. Get out of its line early.'),
    shoggoth_tekeli: own('roar', { windup: 20, active: 20 }, '"Tekeli-li!": the piping takes the mind. Steady yourself.'),
    shoggoth_ripple: own('quake', { windup: 34, wave: { speed: 9, width: 0.8, reach: 12 } }, 'A quick ripple runs out through its mass and the floor. Roll through it.'),
  },
  flying_polyp: {
    polyp_wind: own('wind_push', { windup: 22, reach: 3.4, push: 5 }, "The polyps' terrible wind drives you back. Guard, and come in when it drops."),
    polyp_grip: own('grab', { windup: 26, reach: 1.2, radius: 0.7 }, 'Something unseen takes hold. Roll the moment the air moves near you.'),
    polyp_lash: own('tentacle_burst', { windup: 24, arc: [90, -90], reach: 2.6 }, 'Unseen tentacles lash before it. Roll through them, or be behind them.'),
    polyp_gale: own('vortex', { windup: 20, pull: { speed: 4.4, range: 11 }, follow: 'polyp_gale_burst' }, 'A whirlwind draws you in. Run hard out of it, and roll as it breaks.'),
    polyp_gale_burst: link('vortex_burst', { radius: 3.2 }),
    polyp_burst: own('aoe_ring', { windup: 28, radius: 2.8 }, 'The air bursts outward about it. Be beyond it, or roll.'),
    polyp_whistle: own('procession', { marks: { rings: 5, count: 5, radius: 1.4 } }, 'Rows of whistling air march out, each with a gap. Find it each time.'),
  },
} as const satisfies OwnTable;
