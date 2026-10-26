/**
 * The game: the open world (Phase 4) or the combat arena (Phase 1, with a `?spawn` roster creature
 * from Phase 2). Builds the world, subscribes the event hooks (the mind from Phase 3), and runs the
 * systems in their fixed order each step.
 */

import { createEcs, type Entity } from '../core/ecs';
import { createEventBus } from '../core/events';
import type { InputFrame } from '../core/input';
import { createMountState, mountSystem, registerMounts } from './mounts';
import { MOUNT_QUEST } from '../data/mounts';
import { yawOf, type V3 } from '../core/geom';
import { createRng } from '../core/rng';
import { ARENA } from '../data/arena';
import { getEntity, type Variant } from '../data/registry';
import { DEEP_ONE, TRAINING_DUMMY } from '../data/placeholders';
import type { Place } from '../data/arena';
import { START_SIGN } from '../data/sites';
import { CAMERA_MODES } from '../data/cameraModes';
import { CAMERA, DEFAULT_DIFFICULTY, GUN, LAUDANUM, REAGENT, SIM, WORLD, type DifficultyId } from '../data/tuning';
import { createArenaWorld } from '../world/arena';
import type { CollisionWorld } from '../world/colliders';
import { createWorldCollision } from '../world/worldCollision';
import { actionSystem } from './actions';
import { fightSystem, registerFights, setArena } from './bossFight';
import { brainSystem } from './brain';
import { createCameraRig, followY, stepCamera } from './camera';
import { checkpointSystem, furnishWorld, signPlace } from './checkpoints';
import { NIGHT } from './clock';
import { meleeSystem } from './combat';
import { createStores, type Game, type GameEvents } from './components';
import { dreadOf, resolveCreature, spawnCreature } from './creatures';
import { deathSystem, registerDeath } from './death';
import { fallSystem } from './falls';
import { demoSystem } from './demo';
import { fightActionSystem } from './fightActions';
import { hallucinationSystem, registerHallucinations } from './hallucinations';
import { hazardSystem } from './hazards';
import { registerHiddenLayer, spawnPiece } from './hiddenLayer';
import { explorationSystem } from './exploration';
import { markerSystem } from './marker';
import { passageSystem } from './passages';
import { placeSystem } from './places';
import { poiSystem } from './pois';
import { createBuffer } from './inputBuffer';
import { insightSystem, spawnTome } from './insight';
import { aimPoint, frameOf, lockSystem } from './lockOn';
import { movementSystem } from './movement';
import { createOverworld, registerOverworld } from './overworld';
import { registerArms, unreinforced } from './arms';
import { registerRelics } from './relics';
import { applyCarry, type Carry } from './cycles';
import { registerTally, tallySystem } from './tally';
import { overheardSystem } from './overheard';
import { registerRoomWords, roomWordsSystem } from './roomWords';
import { registerPeace, peaceSystem } from './peace';
import { registerPerception } from './perception';
import { playerControl } from './playerControl';
import { npcSystem, spawnNpcs } from './npcs';
import { populationSystem } from './population';
import { boltSystem } from './projectiles';
import { skyStrikeSystem } from './skyStrikes';
import { discoverySystem } from './discovery';
import { waySystem } from './ways';
import { questSystem, startQuest } from './quests';
import { npcLife } from './npcLife';
import { emptyInput } from '../core/input';
import { candleSystem } from './candles';
import { fogBlockSystem, fogPassSystem } from './fogGates';
import { gatePassSystem, gateStepSystem } from './gateWalk';
import { registerOmens } from './omens';
import { registerDeathNotes } from './deathNotes';
import { hookSystem } from './hook';
import { registerSurvey } from './survey';
import { wanderSystem } from './wanderers';
import { easeSeaChop } from './seaChop';
import { weatherSystem } from './weather';
import { refreshSeals, registerSeals, sealSystem } from './seals';
import { createReality, realitySystem, registerReality } from './reality';
import { reagentSystem, registerReagent } from './reagent';
import { registerHastur } from './signatures/hastur';
import { registerNyarlathotep } from './signatures/nyarlathotep';
import { shotSystem } from './revolver';
import { gunSystem, registerGun } from './gun';
import { createMind, registerSanity, sanitySystem } from './sanity';
import { applySave, type SaveData } from './save';
import { spawnCombatant, spawnPlayer } from './spawn';
import { specialSystem } from './specials';
import { strikeSystem } from './strikes';
import { registerVariantSwap } from './variantSwap';
import { vitalsSystem } from './vitals';

export interface GameOptions {
  seed?: number;
  /** A roster creature to fight (it replaces the placeholder Deep One) or fight beside (allies). */
  creature?: string;
  variant?: Variant;
}

/** The investigator in a world, with the hooks every game shares. */
function baseGame(world: CollisionWorld, spawn: Place, seed: number): Game {
  NIGHT.hurried = 0; // a new game's night is its own (clock.ts)
  const ecs = createEcs(createStores());
  const id = spawnPlayer({ ecs, world }, spawn);
  const g: Game = {
    ecs,
    world,
    events: createEventBus<GameEvents>(),
    player: { id, mount: createMountState(), buffer: createBuffer(), dodgeHeld: -1, sprinting: false, blockHeld: false, blockRaised: false, echoes: 0, levels: { vigour: 0, endurance: 0, might: 0 }, arms: ['cane'], weapon: 'cane', stones: 0, reinforced: unreinforced(), checkpoint: { ...spawn }, laudanum: LAUDANUM.doses, reagent: REAGENT.doses, reagentMax: REAGENT.doses, oil: 0, ammo: GUN.chamber, rounds: GUN.start, gun: 0, difficulty: DEFAULT_DIFFICULTY, cycle: 0, steady: 0, tonic: [], mended: 0, listening: null, glance: false, kneeling: null, falling: null, ask: false, rising: null, fogPass: null, gatePass: null, peace: null },
    mind: createMind(),
    camera: createCameraRig(spawn.yaw),
    lock: { target: null, unseen: 0 },
    rng: createRng(seed),
    frame: 0,
    cutscene: false,
    sheltered: false,
    reality: createReality(),
  };
  registerMounts(g);
  registerDeath(g);
  registerSanity(g);
  registerHiddenLayer(g);
  registerVariantSwap(g);
  registerHallucinations(g);
  registerFights(g);
  registerReality(g);
  registerReagent(g);
  registerGun(g);
  registerPerception(g);
  registerPeace(g);
  return g;
}

/** The open world (spec §3D): a new investigator wakes at the Miskatonic Quad; a save puts them back where they were. */
export function createWorldGame({ seed = WORLD.seed, save, carry, difficulty, demo }: { seed?: number; save?: SaveData; carry?: Carry; difficulty?: DifficultyId; demo?: boolean } = {}): Game {
  const g = baseGame(createWorldCollision(), signPlace(START_SIGN)!.rest, seed);
  if (demo) g.demo = true; // the free demo (systems/demo.ts)
  if (difficulty) g.player.difficulty = difficulty; // a new dream's, chosen at the title (a save or a carry brings its own, which replaces it)
  g.overworld = createOverworld(START_SIGN);
  registerOverworld(g);
  registerArms(g);
  registerRelics(g);
  registerTally(g);
  registerRoomWords(g);
  registerHastur(g);
  registerNyarlathotep(g);
  registerSeals(g);
  registerOmens(g);
  registerSurvey(g);
  registerDeathNotes(g);
  if (save) g.overworld.read = new Set(save.read); // unread tomes only
  furnishWorld(g);
  spawnNpcs(g);
  if (save) applySave(g, save);
  else if (carry) applyCarry(g, carry); // a new journey (NG+): before the world fills, so its foes are that journey's
  startQuest(g, MOUNT_QUEST); // offered on new and older saves; no boss or purchase is required
  refreshSeals(g); // bosses slain in the save break their seals
  populationSystem(g);
  cameraSystem(g, 0, 0, 0);
  return g;
}

export function createGame({ seed = ARENA.seed, creature, variant }: GameOptions = {}): Game {
  const g = baseGame(createArenaWorld(), ARENA.spawn, seed);
  g.player.rounds = GUN.carry; // the arena has no boxes to find and no merchant
  spawnCombatant(g, TRAINING_DUMMY, ARENA.dummy, 'enemy');
  const def = creature === undefined ? undefined : resolveCreature(creature, variant);
  if (def?.tier === 'ally') spawnCreature(g, creature!, ARENA.ally, variant);
  const foe = def && def.tier !== 'ally' ? spawnCreature(g, creature!, ARENA.deepOne, variant) : undefined;
  if (foe !== undefined) {
    setArena(g, foe, { x: 0, z: 0, radius: ARENA.radius }); // a boss holds the whole arena
    standAtEdge(g, foe);
  }
  else g.ecs.c.dread.set(spawnCombatant(g, DEEP_ONE, ARENA.deepOne, 'enemy'), dreadOf(getEntity('deep_one')!)); // it weighs on the mind like the roster's Deep One
  spawnTome(g, ARENA.tome);
  for (const piece of ARENA.hidden) spawnPiece(g, piece);
  cameraSystem(g, 0, 0, 0);
  return g;
}

/** A body wider than a man's is not stood inside (round 24: `?spawn=cthulhu` began with the investigator within it): they stand a few metres off its near edge, facing it. */
function standAtEdge(g: Game, foe: Entity): void {
  const [at, body, me] = [g.ecs.c.transform.get(foe)!.pos, g.ecs.c.body.get(foe)!, g.ecs.c.transform.get(g.player.id)!];
  const gap = body.radius + 4;
  if (Math.hypot(me.pos.x - at.x, me.pos.z - at.z) >= gap) return;
  const z = at.z + gap;
  me.pos = { x: at.x, y: g.world.ground(at.x, z), z };
  me.prev = { ...me.pos };
  me.yaw = me.prevYaw = Math.PI; // toward -z, where the body stands
}

/** Where the camera looks while someone talks: at them, turned a little left so they stand clear of the investigator. */
function talkFocus(pivot: V3, at: V3 | null): V3 | null {
  if (!at) return null;
  const [len, yaw] = [Math.hypot(at.x - pivot.x, at.z - pivot.z), yawOf(at.x - pivot.x, at.z - pivot.z) + CAMERA.talkTurn];
  return { x: pivot.x + Math.sin(yaw) * len, y: at.y, z: pivot.z + Math.cos(yaw) * len };
}

function cameraSystem(g: Game, lookX: number, lookY: number, dt: number): void {
  const tr = g.ecs.c.transform.get(g.player.id)!;
  g.camera.prevMountLift = g.camera.mountLift;
  g.camera.mountLift += ((g.player.mount.active ? 1.05 : 0) - g.camera.mountLift) * Math.min(1, dt * 6);
  const tune = CAMERA_MODES[g.camera.mode];
  const pivot = { x: tr.pos.x, y: followY(g.player.falling, tr.pos.y) + tune.pivotHeight + g.camera.mountLift, z: tr.pos.z };
  const focus = g.lock.target !== null ? aimPoint(g, g.lock.target) : g.player.listening !== null && !g.player.glance ? talkFocus(pivot, aimPoint(g, g.player.listening)) : null;
  const frame = g.lock.target !== null && !g.player.mount.active ? frameOf(g, g.lock.target) : null; // a foe held in the lock is framed (Low hero, Long lens); a person spoken to, or a rig driven, is not
  stepCamera(g.camera, { lookX, lookY, pivot, focus, frame, behind: tr.yaw, distance: g.player.mount.active ? tune.mountDistance : tune.distance, probe: g.player.falling ? g.player.falling.lip.y + tune.pivotHeight : undefined, sea: !!g.player.falling?.water }, g.world, dt);
}

/**
 * One fixed 60 Hz step. The order matters: intent → a boss fight's E, then signs, gates and talk → moves →
 * AI (the peace of an arrival first) → motion → falls → hits, shots, special effects, bolts and pools → recovery → sanity → boss fights and
 * their reality hooks → lock → camera → sight → the words of rooms and people → hallucinations → death → population.
 */
export function stepGame(g: Game, input: InputFrame): void {
  const dt = 1 / SIM.hz;
  g.frame++;
  NIGHT.hurried = g.overworld?.hurried ?? 0; // the night as this game has it (clock.ts)
  if (g.player.fogPass || g.player.gatePass) input = { ...emptyInput(), lookX: input.lookX, lookY: input.lookY }; // walked through a boss's fog: looking about is theirs, the rest is the fog's (round 35)
  mountSystem(g);
  playerControl(g, input);
  fogPassSystem(g);
  gatePassSystem(g); // round 60: a realm's gate walked into
  candleSystem(g);
  weatherSystem(g, dt);
  easeSeaChop(g);
  const spent = g.reality.stolen <= 0 && fightActionSystem(g, input);
  checkpointSystem(g, spent ? { ...input, pressed: { ...input.pressed, interact: false } } : input);
  npcSystem(g, dt);
  npcLife(g, dt);
  actionSystem(g);
  peaceSystem(g, input); // round 88: an arrival's peace ends on their own blow or the seconds after they rise, before the foes' turn
  brainSystem(g);
  wanderSystem(g);
  hookSystem(g);
  movementSystem(g, dt);
  fallSystem(g);
  fogBlockSystem(g);
  gateStepSystem(g);
  demoSystem(g); // the demo's realms kept (round 56)
  meleeSystem(g);
  shotSystem(g);
  specialSystem(g);
  strikeSystem(g);
  boltSystem(g);
  hazardSystem(g);
  skyStrikeSystem(g); // round 52: a thunderstorm's bolt on the ground, a ring of light before it
  waySystem(g); // round 62: the courts before the open arenas' gates: wards, vents, waves, blight, rites, omens
  discoverySystem(g); // round 63: a house seen, a page read, a vigil kept, a gate given
  vitalsSystem(g, dt);
  sanitySystem(g, dt);
  reagentSystem(g);
  gunSystem(g);
  fightSystem(g);
  realitySystem(g);
  lockSystem(g);
  cameraSystem(g, input.lookX, input.lookY, dt);
  insightSystem(g);
  explorationSystem(g);
  markerSystem(g); // the marker reached is cleared (round 60)
  passageSystem(g); // a secret passage the investigator is near opens (round 61)
  placeSystem(g);
  poiSystem(g);
  questSystem(g);
  tallySystem(g);
  roomWordsSystem(g);
  overheardSystem(g);
  sealSystem(g);
  hallucinationSystem(g);
  deathSystem(g);
  populationSystem(g);
}
