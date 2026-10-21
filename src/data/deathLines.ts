/**
 * What is read under UNMADE (round 26: a death was a word and a fall to black; the next attempt began as
 * ignorant as the last): if a horror or a creature's blow was the last, a line on how that blow is met, in
 * the voice of the dream; else a fragment of the place where it happened, a small piece of the story to
 * carry back. Keyed by the attack the blow was (data/attacks.ts) and by region. Data only (systems/deathNotes.ts).
 */

import type { AttackId } from './schema';

/** Over an edge (round 54): the floor is not always where the eye leaves it. */
export const EDGES: readonly string[] = [
  'The dark below a ledge is deeper than it looks. Walk the stone, and keep your feet on it.',
  'A bridge with a gap in it is not a bridge. Look for what opens it before you cross.',
  'A well has no bottom a living man has found. Go round it.',
];

/** Into the sea (round 55): what stands in the shallows is not alone there. */
export const SEAS: readonly string[] = [
  'The sea at the land\'s edge is not empty. Something waits under the dark water, and it is not shy of the shore.',
  'What has hold of you in the water does not let go. Keep to the land, and do not wade where the ground gives way.',
  'The deep takes what the shore lets slip. Turn back before the ground goes under the water.',
];

/** How each blow is met. */
export const TIPS: Readonly<Record<AttackId, string>> = {
  sweep: 'A sweep comes low and wide. Roll toward it, not away, and you are through it.',
  slam: 'It comes down where it stands. The weight lands late: roll to the side as it does.',
  lunge: 'It crosses the ground in a breath. Roll as it leaves the ground, and be behind it.',
  charge: 'It runs in a line and cannot turn. Step aside at the last, not before.',
  grab: 'A crimson flare is a grab, and no guard stops it. Roll away the moment it shows.',
  seize: 'A grab that a guard can hold. Give it the guard, or roll before its hands close.',
  bite: 'Quick, and close. Block it, or stand a pace further off than it likes.',
  tentacle_burst: 'The tentacles sweep all round at once. Roll through them, or be out of their reach.',
  projectile: 'One bolt, straight. Step off its line and it is nothing.',
  projectile_fan: 'A fan of bolts leaves a gap between each. Stand in one.',
  beam: 'The beam is a line drawn where you stood. Do not be there when it is drawn.',
  spit: 'What it spits burns where it lands. Stay out of the pools afterward.',
  wind_push: 'The wind shoves, and shoves you into worse. Hold your guard, or go with it.',
  aoe_ring: 'The ring bursts about it. Be outside it, or roll as it swells.',
  pool: 'It has marked the ground beneath you. Move, and keep moving.',
  dive: 'It drops from above. Watch its shadow, and roll as it darkens.',
  teleport: 'It is behind you now. Turn, and do not stop moving.',
  summon: 'What it calls will not wait. Take the small ones first, or keep them off your back.',
  roar: 'The roar takes the mind, not the body. Steady yourself, and do not stand in it long.',
  gaze: 'Its gaze takes the mind. Break its sight, and let it go.',
  darkness: 'It has put out the lights. Find a flame and stay by it.',
  eruption: 'Marked ground will burst. Leave each mark before the last one lights.',
  quake: 'A ring runs out along the ground. Roll through it as it reaches you.',
  sweep_beam: 'The beam sweeps an arc. Go the way it came from, or roll through it as it passes.',
  barrage: 'Its arms scatter bolts as they turn. Weave between them: there is always a gap.',
  vortex: 'It draws you in for the burst. Run out of the pull, then roll as it breaks.',
  vortex_burst: 'The burst follows the pull. Roll as it breaks, not before.',
  combo: 'Three blows, and the last the hardest. Block the first two, and roll the third.',
  combo_2: 'The second blow follows at once. Keep your guard up.',
  combo_3: 'The last is the heavy one. Roll it.',
  delayed_slam: 'It holds the blow a long breath. Do not roll early; roll when it falls.',
  crushing_blow: 'Its heaviest blow is lifted a full second. Roll as it falls, not as it rises; then strike while it recovers.',
  great_mark: 'The ground it marks under you will break. Leave the circle, or roll as it breaks.',
};

/** A fragment of the place where it happened: the waking world, then the dream's realms. */
export const FRAGMENTS: Readonly<Record<string, readonly string[]>> = {
  hub: [
    'The reading room keeps a place for you. The lamp is lit, and the book is open at a page that was not there.',
    'A tall man in a good coat stood at the gate of the university tonight. He was gone when the porter looked again.',
  ],
  arkham: [
    'The gambrel roof in Arkham has a window no one has seen opened. Something small looks out of it, and is patient.',
    'On the heath the well glows by day as well. The grass, where the light has been, has forgotten how to grow.',
  ],
  dunwich: [
    'The whippoorwills of Dunwich wait for a soul to leave a body. Tonight they have been waiting near you.',
    'The farmers do not go up Sentinel Hill. The hill does not mind; it has its own ways of coming down.',
  ],
  innsmouth: [
    'Every house in Innsmouth has a door that faces the sea. Not one of them has ever been seen to open.',
    'The fog off Devil Reef carries a sound that is almost singing. It stops when you listen, and begins again when you do not.',
  ],
  providence: [
    'The steeple window on Federal Hill is shuttered, and always has been. The light is on the inside.',
    'Dr. Willett burned what he found in the vats. The ashes were not all ash.',
  ],
  vermont: [
    'The hills of Vermont keep their own counsel, and the brooks have begun to keep it with them.',
    'Akeley’s wires still hang along the road. They hum, though there is nothing on them.',
  ],
  mountains: [
    'The cold on the plateau is older than the mountains. It remembers what was built there, and is in no hurry.',
    'The Elder Things carved their history on the walls, and then carved over it. Read the second carving.',
  ],
  pnakotus: ['The archives of the Great Race are kept by those who will not leave them. They have time.', 'Every book here was written by someone who has not yet been born.'],
  kn_yan: ['The blue light of K’n-yan is the light of no sun. It has never been warm, and it has never gone out.', 'They say the people of this place have forgotten what death is. They have not forgotten what it is for.'],
  dreamlands: ['In the dreamlands no one is ever wholly dead, only elsewhere. It is the only comfort they have, and they are wrong about it.', 'The cats of Ulthar know a thing they will not say. They look at you a long while, and look away.'],
  rlyeh: ['The angles of R’lyeh are wrong in a way the eye accepts, and the mind does not. It has been building a reason.', 'In his house at R’lyeh dead Cthulhu waits dreaming. You are very nearly in the dream.'],
  yuggoth: ['The towers of Yuggoth have no windows. They do not need them, for they are looking out already.', 'The spores drift up from the river. Each one, for a moment, is a small white face.'],
  beyond: ['Beyond the Gate there is no place to die in, and no way to be otherwise. You are not there, yet.', 'The piping goes on. It has been going on since before the first night, and will go on after the last.'],
};

/** Said when nothing more particular can be. */
export const GENERIC: readonly string[] = [
  'The dream does not keep the dead. It keeps what they left, and gives it back to those who come for it.',
  'You have been unmade before, and will be again. The Echoes are where you fell.',
  'Something in the dark has learned a little of how you move. So have you.',
];
