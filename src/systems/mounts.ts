/** Mount access, intent and lifecycle. No health, stamina or action state is restored on mounting. */
import { yawOf } from '../core/geom';
import { t } from '../core/i18n';
import type { InputFrame } from '../core/input';
import { FREE_MOUNT, MOUNTS, MOUNT_QUEST, MOUNT_TRAVERSAL, type MountId } from '../data/mounts';
import { PLAYER, SIM, STAMINA } from '../data/tuning';
import type { Game } from './components';
import { createBuffer } from './inputBuffer';
import { setLock } from './lockOn';
import { canAfford } from './stamina';
import { isDone } from './quests';
import { mountGroundAllowed, footprintClear } from './mountGround';
import { createReins, type ReinState } from './mountReins';
import type { HorseToss } from './horseIdle';

export { moveMounted } from './mountMotion';

export interface MountState {
  selected: MountId;
  active: MountId | null;
  automobileOwned: boolean;
  chariotOwned: boolean;
  speed: number;
  yawRate: number; // rad/s, to the left positive: the turn the rig is in (the horse leads it: render/draftHorse)
  jam: number; // frames it has wanted to turn and could not (systems/mountMotion.ts: after a few it is backed off the obstacle)
  phase: number; // gait cycles ridden since the summon, by distance (systems/mountGait.ts): the picture and the hoofbeats both count from it
  cooldownUntil: number;
  reins: ReinState; // the driver's hands: slaps at a gallop, a pull to stop, a hand drawn into a turn (systems/mountReins.ts; the picture and the sound read it)
  idleToss: HorseToss | null; // transient presentation cue shared by the horse's head and its harness sound; never saved
}

export const createMountState = (): MountState => ({ selected: FREE_MOUNT, active: null, automobileOwned: false, chariotOwned: false, speed: 0, yawRate: 0, jam: 0, phase: 0, cooldownUntil: 0, reins: createReins(), idleToss: null });
export const mountUnlocked = (g: Game): boolean => isDone(g, MOUNT_QUEST);

function dlcOwned(g: Game, id: MountId): boolean {
  if (id === 'automobile') return g.player.mount.automobileOwned;
  if (id === 'chariot') return g.player.mount.chariotOwned;
  return true;
}

export const mountAvailable = (g: Game, id: MountId): boolean => mountUnlocked(g) && (!MOUNTS[id].dlc || dlcOwned(g, id));

function releaseIfLost(g: Game, id: MountId, owned: boolean): void {
  if (owned) return;
  if (g.player.mount.active === id) dismissMount(g);
  if (g.player.mount.selected === id) g.player.mount.selected = FREE_MOUNT;
}

/** Only a verified runtime platform query should call these; they are deliberately absent from saves. */
export function setAutomobileEntitlement(g: Game, owned: boolean): void {
  g.player.mount.automobileOwned = owned === true;
  releaseIfLost(g, 'automobile', owned === true);
}

export function setChariotEntitlement(g: Game, owned: boolean): void {
  g.player.mount.chariotOwned = owned === true;
  releaseIfLost(g, 'chariot', owned === true);
}

export function selectMount(g: Game, id: MountId): boolean {
  if (!mountAvailable(g, id)) return false;
  dismissMount(g);
  g.player.mount.selected = id;
  return true;
}

/** Dissolves in place: no teleport, healing, stamina, invulnerability or action cancellation. */
export function dismissMount(g: Game): void {
  if (!g.player.mount.active) return;
  Object.assign(g.player.mount, { active: null, speed: 0, yawRate: 0, jam: 0, reins: createReins(), idleToss: null });
  g.player.sprinting = false;
  g.player.dodgeHeld = -1;
  Object.assign(g.ecs.c.mover.get(g.player.id)!, { vx: 0, vz: 0 });
}

/** Why summoning is barred, in words that can be shown directly. */
export function mountBar(g: Game): string | null {
  const p = g.player;
  if (!g.overworld) return t('n.mountOpen');
  if (!mountUnlocked(g)) return t('n.mountQuest');
  if (!mountAvailable(g, p.mount.selected)) return t('n.mountDlc', { name: MOUNTS[p.mount.selected].name.toUpperCase(), free: MOUNTS.grey.name.toUpperCase() });
  if ((g.ecs.c.health.get(p.id)?.hp ?? 0) <= 0 || g.ecs.c.actor.get(p.id)?.move !== null || p.fogPass || p.gatePass || g.reality.stolen > 0) return t('n.mountStand');
  if (g.frame < p.mount.cooldownUntil) return t('n.mountHurt');
  const tr = g.ecs.c.transform.get(p.id)!;
  if (!mountGroundAllowed(g, tr.pos)) return t('n.mountGround');
  if (!footprintClear(g, tr.pos, tr.yaw)) return t('n.mountRoom');
  return null;
}

export function toggleMount(g: Game): boolean {
  if (g.player.mount.active) {
    dismissMount(g);
    return true;
  }
  const reason = mountBar(g);
  if (reason) {
    g.events.emit('Notice', { text: reason });
    return false;
  }
  const p = g.player;
  Object.assign(p.mount, { active: p.mount.selected, speed: 0, yawRate: 0, jam: 0, phase: 0, reins: createReins(), idleToss: null });
  p.buffer = createBuffer(); // no pre-summon dodge or attack may start while riding
  p.listening = p.kneeling = null;
  p.dodgeHeld = -1;
  p.blockHeld = p.blockRaised = false;
  g.ecs.c.actor.get(p.id)!.guard = false;
  setLock(g, null);
  return true;
}

/** Riding uses camera-relative steering and the ordinary sprint stamina drain. Releasing gallop never rolls. */
export function controlMount(g: Game, input: InputFrame): void {
  const p = g.player;
  const m = g.ecs.c.mover.get(p.id)!;
  if (input.pressed.dodge) p.dodgeHeld = 0;
  else if (p.dodgeHeld >= 0 && input.held.dodge) p.dodgeHeld++;
  if (!input.held.dodge) p.dodgeHeld = -1;
  const [s, c] = [Math.sin(g.camera.yaw), Math.cos(g.camera.yaw)];
  const [x, z] = [s * input.moveY - c * input.moveX, c * input.moveY + s * input.moveX];
  const len = Math.hypot(x, z);
  const mag = Math.min(1, len);
  p.sprinting = mag > 0.1 && p.dodgeHeld > PLAYER.dodgeTapFrames && canAfford(g.ecs.c.stamina.get(p.id), STAMINA.sprintDrain / SIM.hz);
  p.blockHeld = p.blockRaised = false;
  const speed = (p.sprinting ? MOUNT_TRAVERSAL.gallop : MOUNT_TRAVERSAL.cruise) * mag;
  m.vx = len > 0.1 ? x / len * speed : 0;
  m.vz = len > 0.1 ? z / len * speed : 0;
  m.face = len > 0.1 ? yawOf(x, z) : null;
}

/** Handles interruptions even when a caller changed position or action outside the usual input path. */
export function mountSystem(g: Game): void {
  const p = g.player;
  if (!p.mount.active) return;
  const tr = g.ecs.c.transform.get(p.id)!;
  if (!mountAvailable(g, p.mount.active) || g.ecs.c.actor.get(p.id)?.move !== null || p.fogPass || p.gatePass || g.reality.stolen > 0 || (g.ecs.c.health.get(p.id)?.hp ?? 0) <= 0 || !mountGroundAllowed(g, tr.pos)) dismissMount(g);
}

export function registerMounts(g: Game): void {
  g.events.on('Hit', ({ target, damage }) => {
    if (target !== g.player.id || damage <= 0) return;
    dismissMount(g);
    g.player.mount.cooldownUntil = g.frame + MOUNT_TRAVERSAL.damageCooldown;
  });
  g.events.on('Died', ({ entity }) => { if (entity === g.player.id) dismissMount(g); });
  g.events.on('Teleported', ({ entity }) => { if (entity === g.player.id) dismissMount(g); });
  for (const event of ['Rested', 'Travelled', 'Respawned', 'BossEngaged', 'FogPassing', 'BodyStolen'] as const) g.events.on(event, () => dismissMount(g));
  g.events.on('QuestChanged', ({ id, done }) => {
    if (id === MOUNT_QUEST && done) g.events.emit('Notice', { text: t('n.mountYours') });
  });
}
